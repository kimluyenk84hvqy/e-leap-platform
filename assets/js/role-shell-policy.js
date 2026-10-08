(function(){
  const role=()=>localStorage.getItem('e-leap-preview-role')||'guest';
  let student=null,loading=false,shells=null,shellLoading=false;
  async function loadStudent(){if(student||loading||role()!=='student')return student;loading=true;try{const r=await fetch('/api/auth/student',{credentials:'same-origin',cache:'no-store'});if(r.ok)student=await r.json();}catch{}finally{loading=false}return student}
  async function loadShells(){if(shells||shellLoading)return shells;shellLoading=true;try{const r=await fetch('data/shells.json',{cache:'no-store'});if(r.ok){const d=await r.json();shells=window.ELEAPShellManager?.load?ELEAPShellManager.load(d.shells||[]):(d.shells||[]);}}catch{}finally{shellLoading=false}return shells||[]}
  function guestPolicy(){if(role()!=='guest')return;document.querySelectorAll('#mainNav [data-nav]').forEach(b=>{if(!['courses','skills-lab'].includes(b.dataset.nav))b.remove()});}
  async function learnerShellPolicy(){const r=role();if(!['student','guest'].includes(r))return;const registry=await loadShells(),byId=new Map((registry||[]).map(x=>[String(x.id),x]));document.querySelectorAll('#content .shell-card [data-shell]').forEach(btn=>{const card=btn.closest('.shell-card'),sh=byId.get(String(btn.dataset.shell||''));if(!card||!sh)return;const visible=sh.status==='published'||sh.status==='approved';if(!visible)card.hidden=true;});}
  async function studentPolicy(){if(role()!=='student')return;const p=await loadStudent();const title=document.getElementById('pageTitle')?.textContent||'',content=document.getElementById('content');if(!content)return;
    if(title==='Courses'&&p&&!content.querySelector('[data-my-courses-policy]')){
      const ids=new Set((p.memberships||[]).map(m=>String(m.course_id||'')).filter(Boolean));
      if(ids.size){
        let visible=0;content.querySelectorAll('.shell-card [data-shell]').forEach(btn=>{const card=btn.closest('.shell-card'),id=String(btn.dataset.shell||'');if(card&&id&&id!=='advanced-skills'&&!ids.has(id)){card.hidden=true}else if(card&&!card.hidden)visible++});
        const note=document.createElement('div');note.dataset.myCoursesPolicy='1';note.className='ops-note';note.textContent='Showing published courses linked to your active class membership.';const grid=content.querySelector('.grid');if(grid)grid.before(note);else content.prepend(note);
      }
    }
  }
  function staffPolicy(){const r=role();if(!['teacher','admin'].includes(r))return;document.querySelectorAll('#mainNav [data-nav]').forEach(b=>{b.dataset.workspaceRole=r});}
  async function apply(){guestPolicy();staffPolicy();await learnerShellPolicy();await studentPolicy();}
  let busy=false;const obs=new MutationObserver(()=>{if(busy)return;busy=true;setTimeout(async()=>{try{await apply()}finally{busy=false}},80)});obs.observe(document.documentElement,{subtree:true,childList:true});apply();
})();
