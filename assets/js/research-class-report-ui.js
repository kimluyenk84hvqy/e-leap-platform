/* E-LEAP research report UI adapter.
 * Adds non-invasive Research Report access to teacher/admin class cards.
 * Does not modify Live Class / QR logic.
 */
(function(){
  function enhance(){
    const role=document.querySelector('.app')?.dataset?.role||'guest';
    if(!['teacher','admin'].includes(role))return;
    document.querySelectorAll('.live-class-card').forEach(card=>{
      if(card.querySelector('[data-research-report]'))return;
      const live=card.querySelector('[data-live]');
      const row=live?.closest('.class-actions-row');
      const classId=live?.dataset?.live;
      if(!row||!classId)return;
      const b=document.createElement('button');
      b.type='button';b.className='btn';b.dataset.researchReport=classId;b.textContent='Research Report';
      b.onclick=()=>{location.href=`research-report.html?classId=${encodeURIComponent(classId)}`};
      row.appendChild(b);
    });
  }
  const mo=new MutationObserver(()=>enhance());
  mo.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('DOMContentLoaded',enhance);setTimeout(enhance,1200);
})();
