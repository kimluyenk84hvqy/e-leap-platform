(function(){
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const role=()=>localStorage.getItem('e-leap-preview-role')||'guest';
  const api=async(path,options={})=>{const r=await fetch(`/api/research${path}`,{credentials:'same-origin',...options,headers:{'Content-Type':'application/json',...(options.headers||{})}});let d={};try{d=await r.json()}catch{}if(!r.ok)throw new Error(d.error||`Request failed (${r.status})`);return d};
  const localInputValue=iso=>{if(!iso)return'';const d=new Date(iso);if(Number.isNaN(d.getTime()))return'';const z=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}`};
  const dueLabel=a=>{if(!a.deadline)return 'No deadline';const d=new Date(a.deadline),over=Date.now()>d.getTime();return `${over?'Past due':'Due'} ${d.toLocaleString()}`};
  const policyLabel=a=>a.late_policy==='allow-late'?'Late submissions allowed':'Closes at deadline';
  let resourcesCache=null,rubricsCache=null;
  async function resourceOptions(){if(resourcesCache)return resourcesCache;try{const d=await fetch('data/resources.json',{cache:'no-store'}).then(r=>r.json());resourcesCache=(d.resources||[]).filter(r=>['approved','published'].includes(String(r.status).toLowerCase())||['teacher','admin'].includes(role())).map(r=>({id:r.id,name:r.name,status:r.status}));}catch{resourcesCache=[]}return resourcesCache}
  async function rubrics(){if(rubricsCache)return rubricsCache;try{rubricsCache=(await fetch('data/rubrics.json',{cache:'no-store'}).then(r=>r.json())).rubrics||[]}catch{rubricsCache=[]}return rubricsCache}
  function refreshAssignments(){document.querySelector('#mainNav [data-nav="assignments"]')?.click()}
  async function createAssignment(){
    const classes=(await api('/classes')).classes||[],rs=await resourceOptions(),rubs=await rubrics();
    const active=classes.filter(c=>c.status!=='archived');
    if(!active.length){alert('Create a class before assigning homework.');return}
    const defaultDue=new Date(Date.now()+7*86400000);defaultDue.setHours(23,59,0,0);
    ELEAPOps.modal('Assign Homework',
      `<label class="field">Homework title<input id="hwTitle" autofocus placeholder="e.g. Review U2.2"></label>
       <label class="field">Class<select id="hwClass">${active.map(c=>`<option value="${esc(c.class_id)}">${esc(c.class_name)}</option>`).join('')}</select></label>
       <label class="field">Lesson / activity<select id="hwResource">${rs.map(r=>`<option value="${esc(r.id)}">${esc(r.name)}${r.status&&r.status!=='approved'?' · '+esc(r.status):''}</option>`).join('')}</select></label>
       <label class="field">Instructions<textarea id="hwPrompt" rows="4" placeholder="What should students complete?"></textarea></label>
       <label class="field">Deadline<input id="hwDeadline" type="datetime-local" value="${localInputValue(defaultDue.toISOString())}" required></label>
       <label class="field">After deadline<select id="hwLate"><option value="closed" selected>Close submission automatically</option><option value="allow-late">Allow late submission</option></select></label>
       <label class="field">Attempt limit<input id="hwLimit" type="number" min="1" max="50" value="1"></label>
       <label class="field">Rubric<select id="hwRubric">${rubs.map(r=>`<option value="${esc(r.id)}">${esc(r.name)}</option>`).join('')||'<option value="general-100-v1">General score</option>'}</select></label>`,
      async m=>{const title=m.querySelector('#hwTitle').value.trim(),resourceId=m.querySelector('#hwResource').value,deadline=m.querySelector('#hwDeadline').value;if(!title||!resourceId||!deadline){alert('Title, lesson/activity and deadline are required.');return false}const d=new Date(deadline);if(Number.isNaN(d.getTime())){alert('Please choose a valid deadline.');return false}try{await api('/assignments',{method:'POST',body:JSON.stringify({classId:m.querySelector('#hwClass').value,resourceId,title,prompt:m.querySelector('#hwPrompt').value.trim()||null,rubricId:m.querySelector('#hwRubric').value||'general-100-v1',deadline:d.toISOString(),attemptLimit:Number(m.querySelector('#hwLimit').value||1),latePolicy:m.querySelector('#hwLate').value,status:'active'})});setTimeout(refreshAssignments,40);return true}catch(e){alert(e.message);return false}}
    );
  }
  async function editAssignment(a){
    ELEAPOps.modal('Homework settings',
      `<label class="field">Title<input id="heTitle" value="${esc(a.title)}"></label>
       <label class="field">Instructions<textarea id="hePrompt" rows="4">${esc(a.prompt||'')}</textarea></label>
       <label class="field">Deadline<input id="heDeadline" type="datetime-local" value="${localInputValue(a.deadline)}"></label>
       <label class="field">After deadline<select id="heLate"><option value="closed" ${a.late_policy!=='allow-late'?'selected':''}>Close submission automatically</option><option value="allow-late" ${a.late_policy==='allow-late'?'selected':''}>Allow late submission</option></select></label>
       <label class="field">Attempt limit<input id="heLimit" type="number" min="1" max="50" value="${a.attempt_limit||1}"></label>
       <label class="field">Status<select id="heStatus"><option value="active" ${a.status==='active'?'selected':''}>Active</option><option value="closed" ${a.status==='closed'?'selected':''}>Closed</option><option value="draft" ${a.status==='draft'?'selected':''}>Draft</option><option value="archived" ${a.status==='archived'?'selected':''}>Archived</option></select></label>`,
      async m=>{try{const deadline=m.querySelector('#heDeadline').value;await api('/assignments',{method:'PATCH',body:JSON.stringify({assignmentId:a.assignment_id,title:m.querySelector('#heTitle').value.trim(),prompt:m.querySelector('#hePrompt').value.trim(),deadline:deadline?new Date(deadline).toISOString():null,latePolicy:m.querySelector('#heLate').value,attemptLimit:Number(m.querySelector('#heLimit').value||1),status:m.querySelector('#heStatus').value})});setTimeout(refreshAssignments,40);return true}catch(e){alert(e.message);return false}}
    );
  }
  async function enhanceStaff(){
    const btn=document.getElementById('newAssignment');if(!btn||btn.dataset.hwUpgrade==='1')return;
    btn.dataset.hwUpgrade='1';btn.textContent='+ Assign Homework';btn.onclick=createAssignment;
    let asgs=[];try{asgs=(await api('/assignments')).assignments||[]}catch{return}
    const cards=[...document.querySelectorAll('#content .assignment-card')];
    cards.forEach((card,i)=>{const a=asgs[i];if(!a||card.querySelector('[data-hw-meta]'))return;const box=document.createElement('div');box.dataset.hwMeta='1';box.className='hw-meta';const overdue=a.deadline&&Date.now()>new Date(a.deadline).getTime();box.innerHTML=`<span class="hw-chip ${overdue?'danger':''}">${esc(dueLabel(a))}</span><span class="hw-chip">${esc(policyLabel(a))}</span><span class="hw-chip">${a.attempt_limit?`${esc(a.attempt_limit)} attempt${Number(a.attempt_limit)===1?'':'s'}`:'Unlimited attempts'}</span><button type="button" class="btn quiet" data-hw-edit>Edit</button>`;card.querySelector('div')?.append(box);box.querySelector('[data-hw-edit]').onclick=()=>editAssignment(a)});
  }
  async function enhanceStudent(){
    let asgs=[];try{asgs=(await api('/assignments')).assignments||[]}catch{return}
    const cards=[...document.querySelectorAll('#content .assignment-card')];
    cards.forEach((card,i)=>{const a=asgs[i];if(!a||card.dataset.hwStudent==='1')return;card.dataset.hwStudent='1';const overdue=!!(a.deadline&&Date.now()>new Date(a.deadline).getTime()),closedByDeadline=overdue&&a.late_policy==='closed';const meta=document.createElement('div');meta.className='hw-meta';meta.innerHTML=`<span class="hw-chip ${overdue?'danger':''}">${esc(dueLabel(a))}</span><span class="hw-chip">${esc(policyLabel(a))}</span>`;card.querySelector('div')?.append(meta);if(closedByDeadline){const b=card.querySelector('[data-do]');if(b){b.disabled=true;b.textContent='Deadline passed';b.title='This homework closed automatically at the deadline';}}
      const resBtn=document.createElement('button');resBtn.type='button';resBtn.className='btn';resBtn.textContent='Open lesson';resBtn.onclick=()=>location.href=`engine/lesson-host.html?resource=${encodeURIComponent(a.resource_id)}&assignmentId=${encodeURIComponent(a.assignment_id)}`;const existing=card.querySelector('[data-do]');if(existing)existing.before(resBtn);else card.append(resBtn);
    });
  }
  async function apply(){const t=document.getElementById('pageTitle')?.textContent||'';if(t==='Assignments'&&['teacher','admin'].includes(role()))await enhanceStaff();if((t==='My Assignments'||t==='Homework')&&role()==='student')await enhanceStudent();}
  const style=document.createElement('style');style.textContent='.hw-meta{display:flex;gap:7px;flex-wrap:wrap;align-items:center;margin-top:8px}.hw-chip{display:inline-flex;align-items:center;padding:5px 8px;border-radius:999px;background:#eef5f1;color:#315f52;font-size:11px;font-weight:800}.hw-chip.danger{background:#fff0ef;color:#8d3535}.assignment-card button[disabled]{opacity:.55;cursor:not-allowed}@media(max-width:700px){.hw-meta{align-items:stretch}.hw-meta .btn{width:100%;justify-content:center}}';document.head.append(style);
  let timer=null;const obs=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(()=>apply().catch(console.warn),90)});obs.observe(document.documentElement,{subtree:true,childList:true,characterData:true});setTimeout(()=>apply().catch(console.warn),250);
})();
