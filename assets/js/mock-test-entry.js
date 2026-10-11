(()=>{
  document.addEventListener('click',e=>{
    const b=e.target.closest?.('[data-nav="mock-tests"]');
    if(!b)return;
    e.preventDefault();e.stopImmediatePropagation();
    location.href='mock-tests.html';
  },true);
})();
