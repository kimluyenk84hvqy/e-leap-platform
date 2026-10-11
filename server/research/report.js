import { createHmac } from 'node:crypto';
import { getResearchDb } from '../_research-db.js';
import { requireAuth,teacherOwnsClass } from '../_auth.js';

function pseudo(v){
  const key=process.env.RESEARCH_PSEUDONYM_KEY||process.env.E_LEAP_SESSION_SECRET;
  if(!key)throw new Error('Missing RESEARCH_PSEUDONYM_KEY');
  return 'P-'+createHmac('sha256',key).update(String(v||'unknown')).digest('hex').slice(0,20);
}
function num(v){const n=Number(v);return Number.isFinite(n)?n:null}
function iso(v){try{return v?new Date(v).toISOString():null}catch{return null}}
function inRangeSql(from,to){return {from:from||null,to:to||null}}
function avg(xs){const a=xs.filter(Number.isFinite);return a.length?a.reduce((s,x)=>s+x,0)/a.length:null}

export default async function handler(req,res){
  try{
    if(req.method!=='GET'){res.setHeader('Allow',['GET']);return res.status(405).json({ok:false,error:'Method not allowed'});}
    const sql=getResearchDb(); const user=await requireAuth(req,res,['teacher','admin']); if(!user)return;
    const classId=req.query?.classId||null,from=req.query?.from||null,to=req.query?.to||null;
    if(!classId)return res.status(400).json({ok:false,error:'classId is required'});
    if(!await teacherOwnsClass(sql,user,classId))return res.status(403).json({ok:false,error:'Class access denied'});
    const range=inRangeSql(from,to);
    const classes=await sql`SELECT class_id,class_name,course_id,academic_year,status,created_at FROM classes WHERE class_id=${classId} LIMIT 1`;
    if(!classes.length)return res.status(404).json({ok:false,error:'Class not found'});
    const cls=classes[0];

    const sessions=await sql`
      SELECT session_id,lesson_id,status,started_at,ended_at,created_at
      FROM sessions
      WHERE class_id=${classId}
        AND (${range.from}::timestamptz IS NULL OR COALESCE(started_at,created_at)>=${range.from}::timestamptz)
        AND (${range.to}::timestamptz IS NULL OR COALESCE(started_at,created_at)<=${range.to}::timestamptz)
      ORDER BY COALESCE(started_at,created_at)`;
    const sessionIds=sessions.map(x=>x.session_id);
    if(!sessionIds.length){
      const empty={ok:true,class:cls,range:{from,to},summary:{sessions:0,participants:0,joined:0,active:0,submitted:0,notSubmitted:0,totalSubmits:0,averageScore:null},sessions:[],participation:[],attempts:[],feedback:[]};
      return send(req,res,empty);
    }

    const participants=await sql`
      SELECT p.participant_id,p.session_id,p.student_user_id,p.participant_code,p.joined_at,p.left_at,se.lesson_id
      FROM participants p JOIN sessions se ON se.session_id=p.session_id
      WHERE se.class_id=${classId}
        AND (${range.from}::timestamptz IS NULL OR p.joined_at>=${range.from}::timestamptz)
        AND (${range.to}::timestamptz IS NULL OR p.joined_at<=${range.to}::timestamptz)
      ORDER BY p.joined_at`;

    const events=await sql`
      SELECT e.event_id,e.session_id,e.participant_id,e.lesson_id,e.activity_id,e.event_type,e.is_correct,e.score,e.occurred_at,e.metadata
      FROM events e
      WHERE e.class_id=${classId}
        AND (${range.from}::timestamptz IS NULL OR e.occurred_at>=${range.from}::timestamptz)
        AND (${range.to}::timestamptz IS NULL OR e.occurred_at<=${range.to}::timestamptz)
      ORDER BY e.occurred_at`;

    const feedback=await sql`
      SELECT rf.feedback_id,rf.session_id,rf.lesson_id,rf.respondent_user_id,rf.respondent_role,rf.dimension,rf.instrument,rf.items,rf.comment,rf.created_at
      FROM research_feedback rf
      WHERE rf.class_id=${classId} AND rf.research_consent=true
        AND (${range.from}::timestamptz IS NULL OR rf.created_at>=${range.from}::timestamptz)
        AND (${range.to}::timestamptz IS NULL OR rf.created_at<=${range.to}::timestamptz)
      ORDER BY rf.created_at`;

    const participantKey=new Map();
    for(const p of participants){participantKey.set(String(p.participant_id),pseudo(p.student_user_id||p.participant_code||p.participant_id));}
    const people=new Map();
    function person(id){if(!people.has(id))people.set(id,{researchParticipantId:id,sessionsJoined:new Set(),activeSessions:new Set(),submittedSessions:new Set(),activityViews:0,drafts:0,checks:0,submits:0,mediaEvents:0,firstSeen:null,lastSeen:null,scores:[]});return people.get(id)}
    for(const p of participants){const id=participantKey.get(String(p.participant_id));const x=person(id);x.sessionsJoined.add(String(p.session_id));const t=new Date(p.joined_at).getTime();if(Number.isFinite(t)){x.firstSeen=x.firstSeen==null?t:Math.min(x.firstSeen,t);x.lastSeen=x.lastSeen==null?t:Math.max(x.lastSeen,t)}}

    const attempts=[];
    for(const e of events){
      const id=participantKey.get(String(e.participant_id)); if(!id)continue;
      const x=person(id);x.activeSessions.add(String(e.session_id));
      const t=new Date(e.occurred_at).getTime();if(Number.isFinite(t)){x.firstSeen=x.firstSeen==null?t:Math.min(x.firstSeen,t);x.lastSeen=x.lastSeen==null?t:Math.max(x.lastSeen,t)}
      if(e.event_type==='activity.viewed')x.activityViews++;
      if(e.event_type==='response.drafted')x.drafts++;
      if(e.event_type==='attempt.checked')x.checks++;
      if(String(e.event_type||'').startsWith('media.'))x.mediaEvents++;
      if(e.event_type==='response.submitted'){
        x.submits++;x.submittedSessions.add(String(e.session_id));
        const meta=typeof e.metadata==='string'?(()=>{try{return JSON.parse(e.metadata)}catch{return {}}})():e.metadata||{};
        const payload=meta.payload||{};const grading=payload.grading||{};
        const score=num(e.score??payload.score??grading.score);if(score!=null)x.scores.push(score);
        attempts.push({researchParticipantId:id,sessionId:String(e.session_id),lessonId:e.lesson_id||'',activityId:e.activity_id||'',attemptNo:num(payload.attemptNo)||x.submits,submittedAt:iso(e.occurred_at),score,correctCount:num(payload.correctCount??grading.correctCount),totalCount:num(payload.totalCount??grading.totalCount),answeredCount:num(payload.answeredCount??grading.answeredCount),unansweredCount:num(payload.unansweredCount??grading.unansweredCount)});
      }
    }

    const participation=[...people.values()].map(x=>({
      researchParticipantId:x.researchParticipantId,
      sessionsJoined:x.sessionsJoined.size,
      activeSessions:x.activeSessions.size,
      submittedSessions:x.submittedSessions.size,
      status:x.submits>0?'Submitted':x.activeSessions.size>0?'Active':'Joined',
      activityViews:x.activityViews,drafts:x.drafts,checks:x.checks,totalSubmits:x.submits,mediaEvents:x.mediaEvents,
      firstSeen:x.firstSeen?new Date(x.firstSeen).toISOString():null,lastSeen:x.lastSeen?new Date(x.lastSeen).toISOString():null,
      latestScore:x.scores.length?x.scores.at(-1):null,bestScore:x.scores.length?Math.max(...x.scores):null,averageScore:avg(x.scores)
    })).sort((a,b)=>a.researchParticipantId.localeCompare(b.researchParticipantId));

    const feedbackRows=feedback.map(r=>({researchParticipantId:pseudo(r.respondent_user_id),sessionId:r.session_id?String(r.session_id):'',lessonId:r.lesson_id||'',respondentRole:r.respondent_role,dimension:r.dimension,instrument:r.instrument,items:r.items||{},comment:r.comment||'',createdAt:iso(r.created_at)}));
    const submitted=participation.filter(x=>x.totalSubmits>0).length,active=participation.filter(x=>x.activeSessions>0).length;
    const allScores=attempts.map(x=>x.score).filter(Number.isFinite);
    const report={ok:true,class:cls,range:{from,to},summary:{sessions:sessions.length,participants:participation.length,joined:participation.length,active,submitted,notSubmitted:Math.max(0,participation.length-submitted),totalSubmits:attempts.length,averageScore:avg(allScores)},sessions:sessions.map(s=>({sessionId:String(s.session_id),lessonId:s.lesson_id,status:s.status,startedAt:iso(s.started_at||s.created_at),endedAt:iso(s.ended_at)})),participation,attempts,feedback:feedbackRows};
    return send(req,res,report);
  }catch(error){console.error('research report failed',error);return res.status(500).json({ok:false,error:'Research report failed'});}
}

async function send(req,res,report){
  if(req.query?.format!=='xlsx')return res.status(200).json(report);
  const ExcelJS=(await import('exceljs')).default;
  const wb=new ExcelJS.Workbook();wb.creator='E-LEAP';wb.created=new Date();
  const summary=wb.addWorksheet('Summary');
  summary.addRows([
    ['E-LEAP Research Report'],['Class',report.class?.class_name||''],['Course',report.class?.course_id||''],['Academic year',report.class?.academic_year||''],['From',report.range?.from||''],['To',report.range?.to||''],[],
    ['Metric','Value'],['Sessions',report.summary.sessions],['Participants',report.summary.participants],['Joined',report.summary.joined],['Active',report.summary.active],['Submitted',report.summary.submitted],['Not submitted',report.summary.notSubmitted],['Total submits',report.summary.totalSubmits],['Average score',report.summary.averageScore]
  ]);
  addTable(wb,'Participation',report.participation);
  addTable(wb,'Attempts',report.attempts);
  addTable(wb,'Sessions',report.sessions);
  addTable(wb,'Feedback',report.feedback.map(x=>({...x,items:JSON.stringify(x.items)})));
  for(const ws of wb.worksheets){ws.views=[{state:'frozen',ySplit:1}];ws.columns.forEach(c=>{c.width=Math.min(40,Math.max(12,...c.values.filter(v=>v!=null).map(v=>String(v).length+2)))});ws.getRow(1).font={bold:true};}
  const buf=await wb.xlsx.writeBuffer();
  res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition',`attachment; filename="e-leap-research-${String(report.class?.class_name||'class').replace(/[^a-z0-9]+/gi,'-')}.xlsx"`);
  return res.status(200).send(Buffer.from(buf));
}
function addTable(wb,name,rows){const ws=wb.addWorksheet(name);const keys=rows[0]?Object.keys(rows[0]):[];if(!keys.length){ws.addRow(['No data']);return}ws.addRow(keys);for(const r of rows)ws.addRow(keys.map(k=>r[k]??''));}
