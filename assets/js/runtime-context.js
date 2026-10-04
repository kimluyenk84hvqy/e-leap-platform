/* E-LEAP Shared Runtime Context v1.0
   One role/context contract for every native lesson.
   Preview currently reads browser state. Production must replace this with server-issued claims. */
export class ELeapRuntimeContext {
  constructor(overrides={}){
    const rawRole=(overrides.role||window.ELEAPIdentity?.role?.()||window.ELEAPAccess?.role?.()||'guest').toLowerCase();
    this.role=['guest','student','teacher','admin'].includes(rawRole)?rawRole:'guest';
    const requestedMode=overrides.mode||window.ELEAPAccess?.mode?.()||'normal';
    this.mode=(requestedMode==='presentation'&&['teacher','admin'].includes(this.role))?'presentation':'normal';
    const identity=window.ELEAPIdentity?.context?.()||{};
    this.studentId=overrides.studentId??identity.studentId??null;
    this.participantId=overrides.participantId??identity.participantId??null;
    this.classId=overrides.classId??identity.classIds?.[0]??null;
    this.sessionId=overrides.sessionId??null;
    this.resourceId=overrides.resourceId??null;
    this.capabilities=this._capabilities(overrides.capabilities);
    Object.freeze(this.capabilities);
  }
  _capabilities(extra=[]){
    const base={
      guest:['lesson:view:public','practice:use'],
      student:['lesson:view','practice:use','response:submit','progress:self'],
      teacher:['lesson:view','lesson:teach','live:manage','response:review','progress:class','presentation:enter'],
      admin:['*']
    }[this.role]||[];
    return [...new Set([...base,...(Array.isArray(extra)?extra:[])])];
  }
  can(capability){
    if(this.capabilities.includes('*')) return true;
    if(capability==='teacher:reveal') return ['teacher','admin'].includes(this.role);
    if(capability==='presentation:enter') return ['teacher','admin'].includes(this.role);
    if(capability==='response:submit') return this.role==='student';
    if(capability==='content:edit') return this.role==='admin'||window.ELEAPAccess?.hasGrant?.('content:manage')===true;
    if(capability==='content:publish') return this.role==='admin'||window.ELEAPAccess?.hasGrant?.('content:publish')===true;
    return this.capabilities.includes(capability);
  }
  toJSON(){return {role:this.role,mode:this.mode,studentId:this.studentId,participantId:this.participantId,classId:this.classId,sessionId:this.sessionId,resourceId:this.resourceId,capabilities:[...this.capabilities]};}
}
