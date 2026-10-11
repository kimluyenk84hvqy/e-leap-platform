(function(){
  if(window.__ELEAP_SESSION_TIMEOUT__) return;
  window.__ELEAP_SESSION_TIMEOUT__=true;

  const IDLE_MS=90*60*1000;
  const WARN_MS=5*60*1000;
  const STORAGE_KEY='e-leap-last-activity';
  const THROTTLE_MS=15000;
  let lastWrite=0,warningShown=false,warningEl=null,timer=null;

  function now(){return Date.now();}
  function readLast(){
    const n=Number(localStorage.getItem(STORAGE_KEY)||0);
    return Number.isFinite(n)&&n>0?n:now();
  }
  function writeActivity(force=false){
    const t=now();
    if(!force&&t-lastWrite<THROTTLE_MS)return;
    lastWrite=t;
    try{localStorage.setItem(STORAGE_KEY,String(t));}catch{}
    hideWarning();
  }
  function isProtectedActiveWork(){
    try{
      if(document.fullscreenElement)return true;
      if(localStorage.getItem('e-leap-presentation-mode')==='1')return true;
    }catch{}
    const active=document.activeElement;
    if(active&&(active.matches?.('textarea,input,[contenteditable="true"]'))&&String(active.value||active.textContent||'').trim())return true;
    return false;
  }
  function hideWarning(){
    warningShown=false;
    if(warningEl){warningEl.remove();warningEl=null;}
  }
  async function logout(reason='idle'){
    try{await fetch('/api/auth/logout',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({reason})});}catch{}
    try{localStorage.removeItem(STORAGE_KEY);localStorage.removeItem('e-leap-admin-view-role');sessionStorage.removeItem('e-leap-guest-entry');}catch{}
    const next=encodeURIComponent(location.pathname+location.search+location.hash);
    location.replace(`signin.html?next=${next}&reason=timeout`);
  }
  function showWarning(remaining){
    if(warningShown)return;
    warningShown=true;
    warningEl=document.createElement('div');
    warningEl.setAttribute('role','dialog');
    warningEl.setAttribute('aria-modal','true');
    warningEl.style.cssText='position:fixed;inset:0;z-index:2147483647;background:rgba(16,45,37,.45);display:grid;place-items:center;padding:20px;font-family:Inter,system-ui,sans-serif';
    const card=document.createElement('div');
    card.style.cssText='width:min(460px,100%);background:#fff;border-radius:16px;padding:24px;box-shadow:0 24px 70px rgba(0,0,0,.24);color:#173f38';
    card.innerHTML='<h2 style="margin:0 0 10px">Session ending soon</h2><p style="margin:0 0 18px;line-height:1.5">For security on shared classroom computers, E-LEAP will sign you out after 90 minutes without activity.</p><div style="display:flex;gap:10px;flex-wrap:wrap"><button id="eleapStay" style="border:0;border-radius:10px;padding:11px 15px;background:#1f4d3a;color:#fff;font-weight:800;cursor:pointer">Stay signed in</button><button id="eleapOut" style="border:0;border-radius:10px;padding:11px 15px;background:#edf4f0;color:#1f4d3a;font-weight:800;cursor:pointer">Sign out now</button></div><div id="eleapCountdown" style="margin-top:12px;font-size:12px;color:#60756e"></div>';
    warningEl.appendChild(card);document.body.appendChild(warningEl);
    card.querySelector('#eleapStay').onclick=()=>writeActivity(true);
    card.querySelector('#eleapOut').onclick=()=>logout('manual-warning');
    updateCountdown(remaining);
  }
  function updateCountdown(ms){
    const el=warningEl?.querySelector('#eleapCountdown');
    if(!el)return;
    const mins=Math.max(1,Math.ceil(ms/60000));
    el.textContent=`Automatic sign-out in about ${mins} minute${mins===1?'':'s'}.`;
  }
  async function tick(){
    try{
      const r=await fetch('/api/auth/me',{credentials:'same-origin',cache:'no-store'});
      if(!r.ok){hideWarning();return;}
      const d=await r.json();
      if(!d?.user||!['admin','teacher','student'].includes(d.user.role)){hideWarning();return;}
    }catch{return;}
    const idle=now()-readLast();
    const remaining=IDLE_MS-idle;
    if(remaining<=0){
      if(isProtectedActiveWork()){
        writeActivity(true); // protect active presentation/editing; start a fresh idle window
        return;
      }
      return logout('idle-90m');
    }
    if(remaining<=WARN_MS){showWarning(remaining);updateCountdown(remaining);}else hideWarning();
  }

  ['pointerdown','keydown','touchstart','scroll'].forEach(ev=>window.addEventListener(ev,()=>writeActivity(false),{passive:true,capture:true}));
  window.addEventListener('storage',e=>{if(e.key===STORAGE_KEY)hideWarning();});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick();});
  writeActivity(true);
  timer=setInterval(tick,30000);
  tick();
})();
