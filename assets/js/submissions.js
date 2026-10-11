/** E-LEAP Submission Model v1.0 — development storage adapter.
 * Production storage will be authenticated/server-side; the public contract stays stable.
 */
const uid=(p)=>`${p}-${globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
export class LocalSubmissionStore{
  constructor(key='e-leap-submissions'){this.key=key;}
  all(){return JSON.parse(localStorage.getItem(this.key)||'[]');}
  save(row){const rows=this.all(); const i=rows.findIndex(x=>x.submissionId===row.submissionId); i<0?rows.push(row):rows.splice(i,1,row); localStorage.setItem(this.key,JSON.stringify(rows.slice(-500))); return row;}
  forActivity(resourceId,activityId){return this.all().filter(x=>x.resourceId===resourceId&&x.activityId===activityId);}
  clear(){localStorage.removeItem(this.key);}
}
export class ELeapSubmissionService{
  constructor({resourceId,studentId=null,sessionId=null,context={},store=new LocalSubmissionStore(),events=null}={}){if(!resourceId)throw new Error('resourceId is required');Object.assign(this,{resourceId,studentId,sessionId,context,store,events});}
  attemptNo(activityId){return this.store.forActivity(this.resourceId,activityId).filter(x=>x.status!=='draft').length+1;}
  async draft(activity,response){const row={submissionId:uid('sub'),resourceId:this.resourceId,activityId:activity.id,studentId:this.studentId,sessionId:this.sessionId,attemptNo:this.attemptNo(activity.id),status:'draft',response,submittedAt:new Date().toISOString(),grading:null,context:this.context};this.store.save(row);await this.events?.emit('response.drafted',{activityId:activity.id,studentId:this.studentId,sessionId:this.sessionId,payload:{submissionId:row.submissionId,responseKind:response.kind}});return row;}
  async submit(activity,response){let grading=null;if(activity.grading?.mode==='auto'&&activity.type==='choose'){const correct=response.value===activity.grading.correctOptionId;grading={mode:'auto',score:correct?1:0,maxScore:1,correct};}
    const row={submissionId:uid('sub'),resourceId:this.resourceId,activityId:activity.id,studentId:this.studentId,sessionId:this.sessionId,attemptNo:this.attemptNo(activity.id),status:grading?'graded':'submitted',response,submittedAt:new Date().toISOString(),grading,context:this.context};this.store.save(row);
    await this.events?.emit('response.submitted',{activityId:activity.id,studentId:this.studentId,sessionId:this.sessionId,payload:{submissionId:row.submissionId,responseKind:response.kind,attemptNo:row.attemptNo}});
    if(grading) await this.events?.emit('attempt.checked',{activityId:activity.id,studentId:this.studentId,sessionId:this.sessionId,payload:{submissionId:row.submissionId,...grading}});
    await this.events?.emit('progress.updated',{activityId:activity.id,studentId:this.studentId,sessionId:this.sessionId,payload:{state:'submitted',submissionId:row.submissionId}});return row;}
}
