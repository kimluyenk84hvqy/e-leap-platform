/* Studio adapter for the canonical Role Control Contract. No lesson payload buttons,
 * no grading duplication, no live/submit commands. Targets the current rendered step.
 */
import {activityControlModel} from './control-shell.js';
const teacherView=role=>['teacher','admin','presentation'].includes(role);
const selectors=Object.freeze({
 check:'[data-local-action="check"]',
 reset:'[data-local-action="reset"],[data-picture-reset],[data-certified-reset]',
 reveal:'[data-local-action="reveal"],[data-picture-arm],[data-certified-reveal]'
});
export function renderStudioControlDock(role){
 if(!teacherView(role))return '';
 return `<div class="studio-control-dock" data-studio-control-dock role="group" aria-label="Current activity controls">${activityControlModel({role}).filter(c=>selectors[c.id]).map(c=>`<button type="button" class="studio-btn ${c.id==='reveal'?'primary':''}" data-studio-action="${c.id}" disabled>${c.label}</button>`).join('')}</div>`;
}
export function wireStudioControlDock(root,role){
 const dock=root.querySelector('[data-studio-control-dock]');if(!dock||!teacherView(role))return;
 const canvas=root.querySelector('.lesson-canvas');if(!canvas)return;
 // Controls are hidden visually only once a working shared dock has been mounted.
 // Use the activity adapters' existing enabled flags, not lesson IDs or answer keys.
 const targets=id=>[...canvas.querySelectorAll(selectors[id]||':not(*)')].filter(el=>!el.disabled&&!el.closest('[hidden]'));
 for(const button of dock.querySelectorAll('[data-studio-action]')){
  const id=button.dataset.studioAction;
  if(!selectors[id])continue;
  button.disabled=targets(id).length===0;
  button.addEventListener('click',()=>{
   if(!teacherView(role)||button.disabled)return;
   // Multiple activity blocks on this step are intentionally checked/reset/armed together.
   for(const target of targets(id)){if(target.isConnected)target.click();}
  });
 }
 canvas.classList.add('studio-dock-active');
}
