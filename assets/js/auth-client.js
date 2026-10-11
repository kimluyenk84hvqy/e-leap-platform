export const Auth={
  async api(path,options={}){
    const r=await fetch(path,{credentials:'same-origin',...options,headers:{...(options.body?{'Content-Type':'application/json'}:{}),...(options.headers||{})}});
    let d=null; try{d=await r.json()}catch{}
    if(!r.ok){const e=new Error(d?.error||`Request failed (${r.status})`);e.status=r.status;e.code=d?.code;throw e;} return d;
  },
  me(){return this.api('/api/auth/me');},
  login(email,password){return this.api('/api/auth/login',{method:'POST',body:JSON.stringify({email,password})});},
  logout(){return this.api('/api/auth/logout',{method:'POST',body:'{}'});},
  async require(roles=[]){
    try{const d=await this.me();if(roles.length&&!roles.includes(d.user.role))throw Object.assign(new Error('Forbidden'),{status:403});return d.user;}
    catch(e){if(e.status===401){location.href=`/login.html?next=${encodeURIComponent(location.pathname+location.search)}`;return null;}throw e;}
  }
};
