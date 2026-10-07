/* E-LEAP Admin Course Tools
 * Adds a lightweight admin entry point for extending Coursebooks without
 * changing the locked course/unit/lesson authoring workflow.
 * Course -> Unit -> Lesson remains the canonical hierarchy.
 */
(function installAdminCourseTools(){
  const isAdmin=()=>localStorage.getItem('e-leap-preview-role')==='admin';

  // Reuse the existing shell manager, but make Coursebooks create Course shells
  // instead of the generic fallback child type.
  const nativeChildTypeFor=window.childTypeFor;
  if(typeof nativeChildTypeFor==='function'){
    window.childTypeFor=function(cur){
      if(cur?.id==='coursebooks')return ['course','Course'];
      return nativeChildTypeFor(cur);
    };
  }

  function installCoursebooksMenu(){
    if(!isAdmin())return;
    const content=document.getElementById('content');
    if(!content)return;
    const sections=[...content.querySelectorAll('.section-title')];
    const section=sections.find(x=>x.querySelector('h3')?.textContent?.trim()==='Coursebooks');
    if(!section||section.querySelector('[data-manage-coursebooks]'))return;

    section.style.display='flex';
    section.style.alignItems='center';
    section.style.justifyContent='space-between';
    section.style.gap='10px';

    const btn=document.createElement('button');
    btn.type='button';
    btn.className='shell-menu';
    btn.dataset.manageCoursebooks='1';
    btn.textContent='•••';
    btn.title='Manage Coursebooks · Add Course';
    btn.setAttribute('aria-label','Manage Coursebooks');
    btn.onclick=(e)=>{
      e.preventDefault();
      e.stopPropagation();
      if(typeof window.manage==='function')window.manage('coursebooks');
    };
    section.appendChild(btn);
  }

  const observer=new MutationObserver(()=>installCoursebooksMenu());
  const content=document.getElementById('content');
  if(content)observer.observe(content,{childList:true,subtree:true});
  installCoursebooksMenu();
  setTimeout(installCoursebooksMenu,100);
  setTimeout(installCoursebooksMenu,500);
})();
