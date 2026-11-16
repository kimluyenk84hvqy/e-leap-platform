/* Shared Runtime → existing Research Assignment API.
 * Authenticated confirmation only. No offline queue, optimistic success or hidden retry.
 * Role/assignment checks on the server remain authoritative; these client checks only
 * prevent accidental wrong-context submission and misleading success statuses.
 */
const validId=value=>typeof value==='string'&&value.length>=5&&value.length<=120&&/^[a-zA-Z0-9_-]+$/.test(value);
export class ConfirmedAssignmentSubmission{
 constructor({fetchImpl=globalThis.fetch,endpoint='/api/research',authEndpoint='/api/auth/me'}={}){
  if(typeof fetchImpl!=='function')throw Error('Fetch is required');
  this.fetchImpl=fetchImpl;this.endpoint=endpoint;this.authEndpoint=authEndpoint;this.pending=new Set();
 }
 async json(response){
  let result;
  try{result=await response.json()}catch{throw Error('Server returned an unreadable response');}
  if(!response.ok||result?.ok!==true)throw Error(result?.error||'Server rejected request (HTTP '+response.status+')');
  return result;
 }
 async submit({assignmentId,resourceId,activityId,response}={}){
  if(!validId(assignmentId)||!validId(resourceId)||!validId(activityId))
   throw Error('An active assignment, resource and activity ID are required');
  if(response===undefined||response===null)throw Error('Response is missing');
  const key=assignmentId+':'+activityId;
  if(this.pending.has(key))throw Error('A submission is already in progress');
  this.pending.add(key);
  try{
   const identity=await this.json(await this.fetchImpl(this.authEndpoint,{credentials:'same-origin',cache:'no-store'}));
   if(identity?.user?.role!=='student')throw Error('An authenticated Student account is required');
   const assignments=await this.json(await this.fetchImpl(this.endpoint+'/assignments',{credentials:'same-origin',cache:'no-store'}));
   const matched=(assignments.assignments||[]).find(a=>String(a.assignment_id)===assignmentId);
   if(!matched||matched.status!=='active')throw Error('This assignment is not active for the current Student');
   if(String(matched.resource_id)!==resourceId||String(matched.activity_id||'')!==activityId)
    throw Error('Assignment does not match the selected lesson activity');
   const posted=await this.json(await this.fetchImpl(this.endpoint+'/submissions',{
    method:'POST',credentials:'same-origin',cache:'no-store',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({assignmentId,response:{activityId,resourceId,value:response}})
   }));
   const row=posted.submission;
   if(!row?.submission_id||String(row.assignment_id)!==assignmentId||
      row.status!=='submitted'||!Number.isInteger(Number(row.attempt_no))||Number(row.attempt_no)<1)
    throw Error('Server did not confirm a valid submission');
   return {submissionId:row.submission_id,assignmentId,attemptNo:Number(row.attempt_no),status:'submitted'};
  }catch(error){
   // A lost response may mean the server committed. Never retry blindly.
   throw Error('Submission NOT confirmed: '+(error?.message||'Connection failed')+'. Check My Submissions before retrying.');
  }finally{this.pending.delete(key);}
 }
}
