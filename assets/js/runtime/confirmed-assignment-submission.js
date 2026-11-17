/* Shared Runtime → existing Research Assignment API.
 * Authenticated confirmation only. No offline queue, optimistic success or hidden retry.
 * Role/assignment checks on the server remain authoritative; these client checks only
 * prevent accidental wrong-context submission and misleading success statuses.
 */
const validId=value=>typeof value==='string'&&value.length>=5&&value.length<=120&&/^[a-zA-Z0-9_-]+$/.test(value);
export class ConfirmedAssignmentSubmission{
 constructor({fetchImpl=(...args)=>globalThis.fetch(...args),endpoint='/api/research',authEndpoint='/api/auth/me',idFactory=()=>globalThis.crypto?.randomUUID?.(),storage=globalThis.sessionStorage}={}){
  if(typeof fetchImpl!=='function')throw Error('Fetch is required');
  this.fetchImpl=fetchImpl;this.endpoint=endpoint;this.authEndpoint=authEndpoint;this.idFactory=idFactory;this.storage=storage;this.pending=new Set();this.requestCache=new Map();
 }
 async json(response){
  let result;
  try{result=await response.json()}catch{throw Error('Server returned an unreadable response');}
  if(!response.ok||result?.ok!==true)throw Error(result?.error||'Server rejected request (HTTP '+response.status+')');
  return result;
 }
 // Response fingerprint is a local resume hint, NOT a security or provenance proof.
 async fingerprint(response){
  if(!globalThis.crypto?.subtle||typeof TextEncoder==='undefined')
   throw Error('Secure browser fingerprinting is required');
  const bytes=new TextEncoder().encode(JSON.stringify(response));
  const digest=await globalThis.crypto.subtle.digest('SHA-256',bytes);
  return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
 }
 requestKey(userId,assignmentId,activityId){return 'eleap-submit-v2:'+userId+':'+assignmentId+':'+activityId;}
 requestFor(key,fingerprint){
  let remembered=this.requestCache.get(key);
  if(!remembered){try{remembered=JSON.parse(this.storage?.getItem(key)||'null')}catch{}}
  if(remembered?.fingerprint===fingerprint&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(remembered.id||'')))return remembered.id;
  const id=this.idFactory?.();
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(id||'')))
   throw Error('A secure unique request ID is required');
  remembered={id,fingerprint};this.requestCache.set(key,remembered);
  try{this.storage?.setItem(key,JSON.stringify(remembered))}catch{}
  return id;
 }
 clearRequest(key){this.requestCache.delete(key);try{this.storage?.removeItem(key)}catch{}}
 async findCommittedSubmission(assignmentId,requestId){
  try{
   const url=this.endpoint+'/submissions?assignmentId='+encodeURIComponent(assignmentId);
   const result=await this.json(await this.fetchImpl(url,{credentials:'same-origin',cache:'no-store'}));
   const row=(result.submissions||[]).find(x=>String(x.client_request_id||'').toLowerCase()===requestId.toLowerCase());
   if(row?.submission_id&&String(row.assignment_id)===assignmentId&&Number.isInteger(Number(row.attempt_no))&&Number(row.attempt_no)>=1){
    return {submissionId:row.submission_id,assignmentId,attemptNo:Number(row.attempt_no),status:'submitted'};
   }
  }catch{}
  return null;
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
   const userId=identity.user.user_id;
   if(!userId)throw Error('Authenticated Student identity is missing');
   const requestKey=this.requestKey(userId,assignmentId,activityId);
   const requestId=this.requestFor(requestKey,await this.fingerprint(response));
   let posted;
   try{posted=await this.json(await this.fetchImpl(this.endpoint+'/submissions',{
    method:'POST',credentials:'same-origin',cache:'no-store',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({assignmentId,clientRequestId:requestId,response:{activityId,resourceId,value:response}})
   }));}catch(postError){
    const found=await this.findCommittedSubmission(assignmentId,requestId);
    if(found){this.clearRequest(requestKey);return found;}
    throw postError;
   }
   const row=posted.submission;
   if(!row?.submission_id||String(row.assignment_id)!==assignmentId||
      row.status!=='submitted'||!Number.isInteger(Number(row.attempt_no))||Number(row.attempt_no)<1)
    throw Error('Server did not confirm a valid submission');
   this.clearRequest(requestKey);
   return {submissionId:row.submission_id,assignmentId,attemptNo:Number(row.attempt_no),status:'submitted'};
  }catch(error){
   // A lost response may mean the server committed. Never retry blindly.
   throw Error('Submission NOT confirmed: '+(error?.message||'Connection failed')+'. Check My Submissions before retrying.');
  }finally{this.pending.delete(key);}
 }
}
