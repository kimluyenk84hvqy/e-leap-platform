(()=>{
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  let busy=false;
  async function enhance(){
    const title=document.getElementById('pageTitle')?.textContent||'';
    const content=document.getElementById('content');
    if(!content||!title.includes('Progress')||content.querySelector('[data-mock-progress]'))return;
    try{
      const r=await fetch('/api/research/mock-tests',{credentials:'same-origin',cache:'no-store'});if(!r.ok)return;
      const d=await r.json(),rows=d.attempts||[];
      const released=rows.filter(a=>a.status==='feedback-released');
      const totals=released.map(a=>{const m=(a.writing_score==null||a.speaking_score==null)?null:Number(a.auto_score||0)+Number(a.writing_score)+Number(a.speaking_score);const max=Number(a.auto_max||0)+Number(a.manual_max||0);return m==null||!max?null:Math.round(100*m/max)}).filter(v=>v!=null);
      const avg=totals.length?Math.round(totals.reduce((a,b)=>a+b,0)/totals.length):null;
      const box=document.createElement('section');box.dataset.mockProgress='1';box.className='simple-list';box.innerHTML=`<div class="assignment-card"><div><h3>Mock Tests</h3><small>${rows.length} attempt(s) · ${released.length} released</small></div><span class="pill">${avg==null?'—':avg+'% avg'}</span></div>`;
      content.appendChild(box);
    }catch(_){ }
  }
  const obs=new MutationObserver(()=>{if(busy)return;busy=true;setTimeout(async()=>{try{await enhance()}finally{busy=false}},100)});obs.observe(document.documentElement,{subtree:true,childList:true});enhance();
})();
