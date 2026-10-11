(function(){
  'use strict';
  function enhance(){
    const app=document.querySelector('.app');
    const role=app?.getAttribute('data-role');
    if(!['teacher','admin'].includes(role))return;
    document.querySelectorAll('.live-class-card').forEach(card=>{
      if(card.querySelector('[data-marking-center]'))return;
      const src=card.querySelector('[data-live]');
      const classId=src?.dataset?.live||card.dataset?.classId||'';
      if(!classId)return;
      const host=card.querySelector('.live-class-actions,.class-actions,.row')||card;
      const a=document.createElement('a');
      a.href='marking-center.html?classId='+encodeURIComponent(classId);
      a.dataset.markingCenter='1';
      a.className='btn';
      a.textContent='Marking';
      a.title='Open the class Marking Center';
      host.appendChild(a);
    });
  }
  const observer=new MutationObserver(enhance);
  observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['data-role']});
  enhance();
})();
