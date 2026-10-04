/* E-LEAP R2 — Shell governance runtime (local preview adapter). */
window.ELEAPGovernance={
  auditKey:'e-leap-shell-audit-v2', versionKey:'e-leap-shell-versions-v2',
  protectedIds:new Set(['e-leap-root','courses','skills-lab','assignments','mock-tests','progress','advanced-skills']),
  childMap:{
    'root':['large-shell'],'large-shell':['collection','skill','workflow-shell'],'collection':['course','module','pathway-hub'],'course':['unit'],'unit':['lesson'],'lesson':['module','activity'],'skill':['core-module','track','exam-pathway','domain'],'core-module':['teaching-topic'],'teaching-topic':['lesson'],'track':['level','module','exam-part','domain'],'level':['configurable-collection'],'configurable-collection':['practice-set'],'exam-part':['practice-set'],'domain':['topic'],'topic':['practice-set'],'exam-pathway':['module','exam-part'],'pathway-hub':['exam-pathway'],'workflow-shell':['module','assignment','mock-test'],'module':['module','lesson','practice-set','activity'],'practice-set':['activity']
  },
  now(){return new Date().toISOString()}, actor(){return {role:window.ELEAPAccess?.role?.()||'unknown',id:'preview-user'}},
  audit(action,target,meta={}){let a=[];try{a=JSON.parse(localStorage.getItem(this.auditKey)||'[]')}catch{};a.unshift({at:this.now(),actor:this.actor(),action,targetId:target?.id||target,targetType:target?.type||null,...meta});localStorage.setItem(this.auditKey,JSON.stringify(a.slice(0,1000)))},
  versions(){try{return JSON.parse(localStorage.getItem(this.versionKey)||'{}')}catch{return {}}},
  snapshot(shell,reason){if(!shell)return;const v=this.versions();(v[shell.id]||(v[shell.id]=[])).unshift({at:this.now(),reason,actor:this.actor(),snapshot:structuredClone(shell)});v[shell.id]=v[shell.id].slice(0,30);localStorage.setItem(this.versionKey,JSON.stringify(v))},
  history(id){return this.versions()[id]||[]}, isProtected(x){return !!x?.systemProtected||this.protectedIds.has(x?.id)}, isLocked(x){return x?.locked===true},
  compatible(shell,parent,shells){if(!shell||!parent||shell.id===parent.id)return false;let p=parent;while(p){if(p.id===shell.id)return false;p=shells.find(x=>x.id===p.parentId)}const allowed=this.childMap[parent.type];return !allowed||allowed.includes(shell.type)},
  impact(shell){const d=window.ELEAPLearningCore?.read?.()||{};const refs=[];(d.assignments||[]).forEach(a=>{if(a.activityId===shell.id||a.resourceId===shell.id)refs.push(`Assignment: ${a.title||a.assignmentId}`)});return refs},
  statusBadge(x){const s=x.status||'draft';return `<span class="gov-badge gov-${s}">${s}</span>${x.locked?'<span class="gov-badge gov-locked">locked</span>':''}`}
};
