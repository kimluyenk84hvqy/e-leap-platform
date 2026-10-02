/* E-LEAP Learning Core — preview persistence adapter. Backend can replace this API later. */
window.ELEAPLearningCore={
  key:'e-leap-learning-core-v2',
  blank(){return {learners:[],classes:[],memberships:[],sessions:[],assignments:[],submissions:[]}},
  read(){try{return {...this.blank(),...(JSON.parse(localStorage.getItem(this.key))||{})}}catch{return this.blank()}},
  write(d){localStorage.setItem(this.key,JSON.stringify(d));return d},
  uid(p){return `${p}-${(crypto.randomUUID?.()||Date.now().toString(36)).toString()}`},
  createLearner(studentId,fullName){const d=this.read();if(d.learners.some(x=>x.studentId===studentId))throw new Error('Student ID already exists');const r={learnerKey:this.uid('lrn'),studentId,fullName,researchId:this.uid('R'),mode:'registered',createdAt:new Date().toISOString()};d.learners.push(r);this.write(d);return r},
  createClass(className){const d=this.read();const r={classId:this.uid('cls'),className,classCode:Math.random().toString(36).slice(2,8).toUpperCase(),status:'active',createdAt:new Date().toISOString()};d.classes.push(r);this.write(d);return r},
  enroll(learnerKey,classId){const d=this.read();if(d.memberships.some(x=>x.learnerKey===learnerKey&&x.classId===classId&&x.status==='active'))return;const r={membershipId:this.uid('mem'),learnerKey,classId,status:'active',enrolledAt:new Date().toISOString()};d.memberships.push(r);this.write(d);return r},
  archiveClass(classId){const d=this.read(),c=d.classes.find(x=>x.classId===classId);if(c)c.status='archived';this.write(d)},
  startSession(classId){const d=this.read();const r={sessionId:this.uid('ses'),classId,joinCode:Math.random().toString(36).slice(2,8).toUpperCase(),startedAt:new Date().toISOString(),status:'live'};d.sessions.push(r);this.write(d);return r},
  createAssignment({title,classId,activityId,deadline=''}){const d=this.read();const r={assignmentId:this.uid('asg'),title,classId,activityId,deadline,status:'active',createdAt:new Date().toISOString()};d.assignments.push(r);this.write(d);return r},
  addSubmission(learnerKey,activityId,kind='activity',assignmentId=null,response=''){const d=this.read();const r={submissionId:this.uid('sub'),learnerKey,activityId,assignmentId,kind,response,status:'submitted',submittedAt:new Date().toISOString(),score:null,feedback:''};d.submissions.push(r);this.write(d);return r},
  grade(submissionId,score,feedback){const d=this.read(),r=d.submissions.find(x=>x.submissionId===submissionId);if(r){r.score=score===''?null:Number(score);r.feedback=feedback;r.status='reviewed';r.reviewedAt=new Date().toISOString()}this.write(d);return r}
};
