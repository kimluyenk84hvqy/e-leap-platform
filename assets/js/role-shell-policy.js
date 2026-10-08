(function(){
  const role=()=>localStorage.getItem('e-leap-preview-role')||'guest';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let student=null,loading=false;
  async function loadStudent(){if(student||loading||role()!=='student')return student;loading=true;try{const r=await fetch('/api/auth/student',{credentials:'same-origin',cache:'no-store'});if(r.ok)student=await r.json();}catch{}finally{loading=false}return student}
  function guestPolicy(){if(role()!=='guest')return;document.querySelectorAll('#mainNav [data-nav]').forEach(b=>{if(!['courses','skills-lab'].includes(b.dataset.nav))b.remove()});}
  async function studentPolicy(){if(role()!=='student')return;const p=await loadStudent();const title=document.getElementById('pageTitle')?.textContent||'',content=document.getElementById('content');if(!content)return;
    if(title==='Courses'&&p&&!content.querySelector('[data-my-courses-policy]')){
      const ids=new Set((p.memberships||[]).map(m=>String(m.course_id||'')).filter(Boolean));
      if(ids.size){
        let visible=0;content.querySelectorAll('.shell-card [data-shell]').forEach(btn=>{const card=btn.closest('.shell-card'),id=String(btn.dataset.shell||'');if(card&&id&&id!=='advanced-skills'&&!ids.has(id)){card.hidden=true}else if(card&&!card.hidden)visible++});
        const note=document.createElement('div');note.dataset.myCoursesPolicy='1';note.className='ops-note';note.innerHTML=`Showing courses linked to your active class membership${visible?'.':''}`;const grid=content.querySelector('.grid');if(grid)grid.before(note);else content.prepend(note);
      }
    }
  }
  function staffPolicy(){const r=role();if(!['teacher','admin'].includes(r))return;document.querySelectorAll('#mainNav [data-nav]').forEach(b=>{b.dataset.workspaceRole=r});}
  async function apply(){guestPolicy();staffPolicy();await studentPolicy();}
  let busy=false;const obs=new MutationObserver(()=>{if(busy)return;busy=true;setTimeout(async()=>{try{await apply()}finally{busy=false}},80)});obs.observe(document.documentElement,{subtree:true,childList:true});apply();
})();
