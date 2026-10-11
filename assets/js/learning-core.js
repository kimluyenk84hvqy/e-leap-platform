/* E-LEAP Learning Core — R1.5 preview persistence adapter.
   LocalStorage is QA-only. Production backend must enforce uniqueness/RBAC. */
window.ELEAPLearningCore={
  key:'e-leap-learning-core-v3',
  legacyKey:'e-leap-learning-core-v2',
  blank(){return {learners:[],classes:[],memberships:[],sessions:[],assignments:[],submissions:[]}},
  read(){
    try{
      let raw=localStorage.getItem(this.key);
      if(!raw){raw=localStorage.getItem(this.legacyKey);if(raw)localStorage.setItem(this.key,raw)}
      return {...this.blank(),...(JSON.parse(raw)||{})};
    }catch{return this.blank()}
  },
  write(d){localStorage.setItem(this.key,JSON.stringify(d));return d},
  uid(p){return `${p}-${(crypto.randomUUID?.()||Date.now().toString(36)).toString()}`},
  createLearner(studentId,fullName,{studentGroup=null,gender=null,researchConsent=null}={}){
    const d=this.read();
    if(d.learners.some(x=>String(x.studentId).toLowerCase()===String(studentId).toLowerCase()))throw new Error('Student ID already exists');
    const r={learnerKey:this.uid('lrn'),studentId,fullName,studentGroup,gender,researchConsent,researchId:this.uid('P'),mode:'registered',status:'active',createdAt:new Date().toISOString()};
    d.learners.push(r);this.write(d);return r;
  },
  updateLearner(learnerKey,patch={}){const d=this.read(),r=d.learners.find(x=>x.learnerKey===learnerKey);if(!r)return null;for(const k of ['fullName','studentGroup','gender','researchConsent'])if(k in patch)r[k]=patch[k];r.updatedAt=new Date().toISOString();this.write(d);return r},
  createClass(className,{academicYear='',courseId=''}={}){const d=this.read();const r={classId:this.uid('cls'),className,classCode:Math.random().toString(36).slice(2,8).toUpperCase(),academicYear,courseId,status:'active',createdAt:new Date().toISOString()};d.classes.push(r);this.write(d);return r},
  enroll(learnerKey,classId,{source='manual'}={}){const d=this.read();if(d.memberships.some(x=>x.learnerKey===learnerKey&&x.classId===classId&&x.status==='active'))return d.memberships.find(x=>x.learnerKey===learnerKey&&x.classId===classId&&x.status==='active');const r={membershipId:this.uid('mem'),learnerKey,classId,status:'active',source,enrolledAt:new Date().toISOString()};d.memberships.push(r);this.write(d);return r},
  archiveClass(classId){const d=this.read(),c=d.classes.find(x=>x.classId===classId);if(c)c.status='archived';this.write(d)},
  startSession(classId,{lessonId=null,teacherId=null,ttlMinutes=180}={}){const d=this.read();const r={sessionId:this.uid('ses'),classId,lessonId,teacherId,joinCode:Math.random().toString(36).slice(2,8).toUpperCase(),startedAt:new Date().toISOString(),expiresAt:new Date(Date.now()+ttlMinutes*60000).toISOString(),status:'live'};d.sessions.push(r);this.write(d);return r},
  endSession(sessionId){const d=this.read(),s=d.sessions.find(x=>x.sessionId===sessionId);if(s){s.status='closed';s.endedAt=new Date().toISOString()}this.write(d);return s},
  findLiveSessionByCode(code){const d=this.read();return d.sessions.find(s=>s.status==='live'&&String(s.joinCode).toUpperCase()===String(code).trim().toUpperCase()&&(!s.expiresAt||new Date(s.expiresAt)>new Date()))||null},
  createAssignment({title,classId,activityId,deadline=''}){const d=this.read();const r={assignmentId:this.uid('asg'),title,classId,activityId,deadline,status:'active',createdAt:new Date().toISOString()};d.assignments.push(r);this.write(d);return r},
  addSubmission(learnerKey,activityId,kind='activity',assignmentId=null,response=''){const d=this.read();const r={submissionId:this.uid('sub'),learnerKey,activityId,assignmentId,kind,response,status:'submitted',submittedAt:new Date().toISOString(),score:null,feedback:''};d.submissions.push(r);this.write(d);return r},
  grade(submissionId,score,feedback){const d=this.read(),r=d.submissions.find(x=>x.submissionId===submissionId);if(r){r.score=score===''?null:Number(score);r.feedback=feedback;r.status='reviewed';r.reviewedAt=new Date().toISOString()}this.write(d);return r}
};
