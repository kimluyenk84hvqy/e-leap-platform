/* E-LEAP R1.5 — Identity, Access, Enrollment & Session Foundation (PREVIEW)
   This client adapter is for Preview QA. Production must replace role claims with
   authenticated server-issued claims. It intentionally centralizes the contract
   so lessons never decide their own role when hosted by E-LEAP. */
(function(){
  'use strict';
  const KEY='e-leap-r15-identity-v1';
  const roleKey='e-leap-preview-role';
  const allowedRoles=new Set(['guest','student','teacher','admin']);
  const now=()=>new Date().toISOString();
  const uid=p=>`${p}-${crypto.randomUUID?.()||Math.random().toString(36).slice(2)}`;
  function read(){
    try{return JSON.parse(localStorage.getItem(KEY)||'null')||{version:1,accounts:[],teacherGrants:[],lastUpdatedAt:null};}
    catch{return {version:1,accounts:[],teacherGrants:[],lastUpdatedAt:null};}
  }
  function write(d){d.lastUpdatedAt=now();localStorage.setItem(KEY,JSON.stringify(d));return d;}
  function role(){const r=localStorage.getItem(roleKey)||'teacher';return allowedRoles.has(r)?r:'guest';}
  function currentLearner(){
    const key=localStorage.getItem('e-leap-student-preview-key');
    const core=window.ELEAPLearningCore?.read?.();
    return core?.learners?.find(x=>x.learnerKey===key)||null;
  }
  function context(){
    const r=role();
    const learner=r==='student'?currentLearner():null;
    return {
      hosted:true,
      role:r,
      mode:window.ELEAPAccess?.mode?.()||'normal',
      learnerKey:learner?.learnerKey||null,
      studentId:learner?.studentId||null,
      participantId:learner?.researchId||null,
      classIds:(window.ELEAPLearningCore?.read?.().memberships||[]).filter(m=>m.learnerKey===learner?.learnerKey&&m.status==='active').map(m=>m.classId),
      issuedAt:now()
    };
  }
  function ensurePreviewAccount({role:r,email='',fullName=''}={}){
    if(!allowedRoles.has(r))throw new Error('Invalid role');
    const d=read();
    let a=d.accounts.find(x=>x.email&&email&&x.email.toLowerCase()===email.toLowerCase());
    if(!a){a={accountId:uid('acct'),email,fullName,role:r,status:'active',createdAt:now()};d.accounts.push(a);}else{a.role=r;a.fullName=fullName||a.fullName;a.status='active';}
    write(d);return a;
  }
  function grantTeacher(accountId,scopeId,capabilities=[]){
    const d=read();
    d.teacherGrants=d.teacherGrants.filter(g=>!(g.accountId===accountId&&g.scopeId===scopeId));
    d.teacherGrants.push({grantId:uid('grant'),accountId,scopeId,capabilities:[...new Set(capabilities)],status:'active',createdAt:now()});
    write(d);return d.teacherGrants.at(-1);
  }
  window.ELEAPIdentity={read,write,role,context,currentLearner,ensurePreviewAccount,grantTeacher,isPreview:true};
})();
