/* E-LEAP: safe course-shell extension + Admin course creation tools.
 * Keeps Objective PET B1 visible without intercepting window.fetch.
 * Adds an Admin-only "+ Add Course Shell" action on the Courses home.
 */
(function installCourseShellAdminTools(){
  const BUILTIN_B1=[
    {id:'objective-pet-b1',parentId:'coursebooks',name:'Objective PET B1',type:'course',order:1.5,status:'published'},
    {id:'objective-pet-b1-u01',parentId:'objective-pet-b1',name:'Unit 1',type:'unit',order:1,status:'published'},
    {id:'objective-pet-b1-u01-l01',parentId:'objective-pet-b1-u01',name:'U1.1',type:'lesson',order:1,status:'hidden'},
    {id:'objective-pet-b1-u01-l02',parentId:'objective-pet-b1-u01',name:'U1.2',type:'lesson',order:2,status:'hidden'}
  ];

  function mergeBuiltins(shells){
    const out=Array.isArray(shells)?shells:[];
    const ids=new Set(out.map(x=>x?.id));
    for(const x of BUILTIN_B1){ if(!ids.has(x.id)){ out.push(structuredClone(x)); ids.add(x.id); } }
    return out;
  }

  // Wrap the shell manager rather than global fetch. This preserves every other request path.
  if(window.ELEAPShellManager && !window.ELEAPShellManager.__courseToolsWrapped){
    const originalLoad=window.ELEAPShellManager.load.bind(window.ELEAPShellManager);
    window.ELEAPShellManager.load=function(base){ return mergeBuiltins(originalLoad(base)); };
    window.ELEAPShellManager.__courseToolsWrapped=true;
  }

  async function currentShells(){
    const r=await fetch('data/shells.json',{cache:'no-store'});
    if(!r.ok)throw new Error('Could not load course shells.');
    const data=await r.json();
    return mergeBuiltins(window.ELEAPShellManager.load(data.shells||[]));
  }

  async function addCourseShell(){
    if(window.ELEAPAccess?.role?.()!=='admin')return;
    const openModal=window.ELEAPOps?.modal;
    if(openModal){
      window.ELEAPOps.modal('Add Course Shell','<label class="field">Course name<input id="newCourseShellName" autofocus placeholder="e.g. Objective B1, Life Upper-Intermediate"></label>',async modal=>{
        const name=modal.querySelector('#newCourseShellName')?.value.trim();
        if(!name)return false;
        try{
          const shells=await currentShells();
          window.ELEAPShellManager.add(shells,'coursebooks',name,'course');
          location.reload();
        }catch(e){ alert(e.message||'Could not add course shell.'); }
        return false;
      });
      return;
    }
    const name=prompt('Course name');
    if(!name?.trim())return;
    const shells=await currentShells();
    window.ELEAPShellManager.add(shells,'coursebooks',name.trim(),'course');
    location.reload();
  }

  function decorateCoursesHome(){
    if(window.ELEAPAccess?.role?.()!=='admin')return;
    const content=document.getElementById('content');
    if(!content||document.getElementById('adminAddCourseShell'))return;
    const pageTitle=document.getElementById('pageTitle')?.textContent?.trim();
    if(pageTitle!=='Courses')return;
    const coursebooksTitle=[...content.querySelectorAll('.section-title h3')].find(x=>x.textContent.trim()==='Coursebooks');
    if(!coursebooksTitle)return;
    const section=coursebooksTitle.closest('.section-title');
    const toolbar=document.createElement('div');
    toolbar.className='context-toolbar';
    toolbar.innerHTML='<button class="btn primary" id="adminAddCourseShell" type="button">+ Add Course Shell</button>';
    section.insertAdjacentElement('afterend',toolbar);
    toolbar.querySelector('#adminAddCourseShell').onclick=addCourseShell;
  }

  const start=()=>{
    decorateCoursesHome();
    const content=document.getElementById('content');
    if(content)new MutationObserver(()=>decorateCoursesHome()).observe(content,{childList:true,subtree:true});
  };
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
