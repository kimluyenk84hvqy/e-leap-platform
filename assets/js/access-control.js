/* E-LEAP R1 — Role & Permission runtime (preview adapter).
   IMPORTANT: server-side auth/RBAC must enforce the same contract in production. */
window.ELEAPAccess={
  roleKey:'e-leap-preview-role', modeKey:'e-leap-presentation-mode', grantKey:'e-leap-demo-grants-v2',
  role(){return localStorage.getItem(this.roleKey)||'teacher'},
  mode(){return localStorage.getItem(this.modeKey)==='1'?'presentation':'normal'},
  setRole(r){if(!['guest','student','teacher','admin'].includes(r))return false;localStorage.setItem(this.roleKey,r);if(!['teacher','admin'].includes(r))localStorage.removeItem(this.modeKey);return true},
  setPresentation(on){const r=this.role();if(on&&!['teacher','admin'].includes(r))return false;on?localStorage.setItem(this.modeKey,'1'):localStorage.removeItem(this.modeKey);return true},
  grants(){try{return JSON.parse(localStorage.getItem(this.grantKey)||'{"teacher":["content:manage","content:publish","assessment:edit"]}')}catch{return {teacher:['content:manage','content:publish','assessment:edit']}}},
  hasGrant(g){const r=this.role();return r==='admin'||(this.grants()[r]||[]).includes(g)},
  isProtected(shell){return !!shell?.systemProtected||['e-leap-root','courses','skills-lab','assignments','mock-tests','progress','advanced-skills'].includes(shell?.id)},
  can(action,shell){const r=this.role(),pres=this.mode()==='presentation';if(pres&&action.startsWith('govern:'))return false;if(r==='admin')return true;if(r==='guest')return ['view:course','view:practice'].includes(action);if(r==='student')return ['view:course','view:practice','assignment:submit','progress:self','class:join'].includes(action);if(r==='teacher'){
    if(['view:course','class:manage','assignment:manage','submission:review','progress:class','live:manage','presentation:enter'].includes(action))return true;
    if(action==='govern:content')return this.hasGrant('content:manage')&&!this.isProtected(shell);
    if(action==='govern:publish')return this.hasGrant('content:publish')&&!this.isProtected(shell);
    if(action==='govern:assessment')return this.hasGrant('assessment:edit')&&!this.isProtected(shell);
  }return false},
  navAllowed(id){const r=this.role();if(r==='guest')return ['courses','skills-lab','mock-tests'].includes(id);if(r==='student')return ['courses','skills-lab','assignments','mock-tests','progress','classes','submissions'].includes(id);return true},
  label(){return ({guest:'Guest Preview',student:'Student Preview',teacher:'Teacher · Content Editor',admin:'Admin Preview'})[this.role()]||this.role()}
};
