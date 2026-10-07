/**
 * E-LEAP Grading Core — R4 RC1.1
 * Shared scoring/attempt semantics for Courses, Skills Lab, Assignments and Mock Tests.
 *
 * Contract:
 * - score denominator is TOTAL assessable items, not only answered items.
 * - unanswered items remain distinct from wrong items.
 * - every Submit creates a distinct attempt; Check and Reset never create attempts.
 */
const numberOrNull=v=>Number.isFinite(Number(v))?Number(v):null;
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));

export function responseAnsweredCount(response){
  if(response==null)return 0;
  if(typeof response==='object'&&!Array.isArray(response)&&Object.prototype.hasOwnProperty.call(response,'kind')&&Object.prototype.hasOwnProperty.call(response,'value')) return String(response.value??'').trim()?1:0;
  if(Array.isArray(response))return response.filter(v=>String(v??'').trim()!=='').length;
  if(typeof response==='object'){
    if(Array.isArray(response.inputs)){
      const groups=new Map(); let scalar=0;
      response.inputs.forEach((x,i)=>{
        if(!x)return;
        const type=String(x.type||'').toLowerCase();
        const name=x.name||`field-${i}`;
        if(type==='radio'){
          const g=groups.get(name)||false; groups.set(name,g||x.value===true||x.checked===true);
        }else if(type==='checkbox'){
          const g=groups.get(name)||false; groups.set(name,g||x.value===true||x.checked===true);
        }else if(String(x.value??'').trim()!=='') scalar++;
      });
      return scalar+[...groups.values()].filter(Boolean).length;
    }
    return Object.values(response).filter(v=>Array.isArray(v)?v.length>0:String(v??'').trim()!=='').length;
  }
  return String(response).trim()?1:0;
}

export function normalizeAssessment(result={}, response=null){
  const correct=numberOrNull(result.correctCount ?? result.correct);
  const total=numberOrNull(result.totalCount ?? result.total);
  let answered=numberOrNull(result.answeredCount ?? result.answered);
  if(answered==null) answered=responseAnsweredCount(response);

  let safeTotal=total;
  if(safeTotal==null && correct!=null && result.wrongCount!=null && result.unansweredCount!=null){
    safeTotal=correct+Number(result.wrongCount)+Number(result.unansweredCount);
  }
  let safeCorrect=correct;
  if(safeCorrect==null && typeof result.isCorrect==='boolean' && safeTotal===1) safeCorrect=result.isCorrect?1:0;
  if(safeTotal!=null) answered=clamp(answered,0,safeTotal);
  let wrong=numberOrNull(result.wrongCount);
  if(wrong==null && safeCorrect!=null) wrong=Math.max(0,answered-safeCorrect);
  let unanswered=numberOrNull(result.unansweredCount);
  if(unanswered==null && safeTotal!=null) unanswered=Math.max(0,safeTotal-answered);

  let score=numberOrNull(result.score);
  if(safeTotal!=null && safeTotal>0 && safeCorrect!=null) score=safeCorrect/safeTotal;
  if(score!=null) score=clamp(score,0,1);
  const percent=score==null?null:Math.round(score*100);

  return {
    assessable:safeTotal!=null && safeTotal>0,
    correctCount:safeCorrect,
    answeredCount:answered,
    wrongCount:wrong,
    unansweredCount:unanswered,
    totalCount:safeTotal,
    score,
    percent,
    isCorrect:typeof result.isCorrect==='boolean'?result.isCorrect:(safeTotal!=null&&safeCorrect!=null?safeCorrect===safeTotal:null),
    source:result.source||null
  };
}

export function scoreText(g,{submitted=false}={}){
  if(!g?.assessable){
    if(g?.answeredCount>0) return submitted?'Submitted · teacher review':'Response ready';
    return 'Not answered';
  }
  const prefix=submitted?'Submitted · ':'';
  return `${prefix}${g.correctCount ?? 0}/${g.totalCount} correct · ${g.percent ?? 0}%`;
}

export function detailText(g){
  if(!g?.assessable)return g?.answeredCount>0?'This activity is not auto-graded.':'No response yet.';
  return `Answered ${g.answeredCount}/${g.totalCount} · Correct ${g.correctCount ?? 0} · Wrong ${g.wrongCount ?? 0} · Unanswered ${g.unansweredCount ?? 0}`;
}

export class AttemptTracker{
  constructor({resourceId='unknown',role='guest',studentId=null}={}){
    this.resourceId=resourceId;this.role=role;this.studentId=studentId;
    this.memory=new Map();
  }
  key(activityId){return `${this.resourceId}::${activityId||'activity'}`;}
  state(activityId){
    const k=this.key(activityId);
    if(!this.memory.has(k))this.memory.set(k,{attemptNo:0,submitCount:0,lastSubmitted:null,bestScore:null,latestScore:null});
    return this.memory.get(k);
  }
  recordSubmit(activityId,grading){
    const s=this.state(activityId);
    s.submitCount++;
    s.attemptNo=s.submitCount;
    s.lastSubmitted=new Date().toISOString();
    s.latestScore=grading?.score??null;
    if(grading?.score!=null)s.bestScore=s.bestScore==null?grading.score:Math.max(s.bestScore,grading.score);
    return {...s};
  }
  newAttempt(activityId){
    // Kept for compatibility with older callers. A distinct attempt is created by Submit itself.
    // Calling newAttempt must not create/persist an attempt before a Submit occurs.
    return {...this.state(activityId)};
  }
}
