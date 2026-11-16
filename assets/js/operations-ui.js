window.ELEAPOps={
 modal(title,body,onSave,saveLabel='Save'){const d=document.createElement('div');d.className='modal-backdrop';d.innerHTML=`<div class="modal"><h2>${title}</h2>${body}<div class="action-row"><button class="btn" data-close>Cancel</button><button class="btn primary" data-save>${saveLabel}</button></div></div>`;document.body.appendChild(d);d.querySelector('[data-close]').onclick=()=>d.remove();d.onclick=e=>{if(e.target===d)d.remove()};const save=d.querySelector('[data-save]');
 save.onclick=async()=>{
  if(save.disabled)return;
  save.disabled=true;
  const label=save.textContent;
  save.textContent='Saving…';
  try{
   // The modal must remain visible until a server-confirmed async operation
   // resolves. An explicit false result means retry without losing answers.
   const accepted=await onSave(d);
   if(accepted!==false)d.remove();
  }catch(error){
   let status=d.querySelector('[data-modal-status]');
   if(!status){
    status=document.createElement('p');status.dataset.modalStatus='1';
    status.setAttribute('role','alert');status.className='ops-note';
    d.querySelector('.action-row').before(status);
   }
   status.textContent=error?.message||'Request failed. Please try again.';
  }finally{
   if(d.isConnected){save.disabled=false;save.textContent=label;}
  }
 };return d},
 confirm(title,body,label,onConfirm){return this.modal(title,body,()=>{onConfirm();return true},label||'Confirm')},
 shellMenu(x,handlers){const b=Object.keys(handlers).map(k=>`<button class="btn ${k==='Archive'?'danger':''}" data-a="${k}">${k}</button>`).join('');const d=this.modal(`Manage: ${x.name}`,`<div class="shell-menu-panel">${b}</div>`,()=>false);d.querySelector('[data-save]').style.display='none';d.querySelectorAll('[data-a]').forEach(z=>z.onclick=()=>{d.remove();handlers[z.dataset.a]()})}
};