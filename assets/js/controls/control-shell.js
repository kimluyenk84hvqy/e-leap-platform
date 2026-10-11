import teacher from './teacher-controls.js';
import admin from './admin-controls.js';
import student from './student-controls.js';
import guest from './guest-controls.js';
import presentation from './presentation-controls.js';
import {controlSpec} from './control-registry.js';

const ROLE_MAP=Object.freeze({teacher,admin,student,guest,presentation});
export function normaliseRole(role='guest'){return ROLE_MAP[role]?role:'guest';}
export function effectiveRole(role='guest',{presentation:inPresentation=false}={}){return inPresentation?'presentation':normaliseRole(role);}
export function controlsForRole(role='guest',opts={}){return ROLE_MAP[effectiveRole(role,opts)];}
export function allControlsForRole(role='guest',opts={}){const c=controlsForRole(role,opts);return [...c.activity,...c.classroom,...c.utility];}
export function hasRoleControl(role,id,opts={}){return allControlsForRole(role,opts).includes(id);}

/**
 * Convert role contract + activity capabilities into a stable activity-control model.
 * `visible` is role-owned. `enabled` is activity-owned. This prevents per-lesson UI drift.
 */
export function activityControlModel({role='guest',presentation=false,capabilities={}}={}){
  const contract=controlsForRole(role,{presentation});
  const defaults={check:true,reset:true,reveal:true,submit:true,score:true};
  return contract.activity.map(id=>{
    const spec=controlSpec(id)||{id,label:id};
    const capability=(id in capabilities)?capabilities[id]:defaults[id];
    return {...spec,visible:true,enabled:capability!==false};
  });
}

export function inlineActivityControlsHTML({role='guest',presentation=false,capabilities={},statusText=null}={}){
  const model=activityControlModel({role,presentation,capabilities});
  const parts=[];
  for(const c of model){
    if(c.kind==='status') continue;
    const attr=c.dataAttr?` ${c.dataAttr}`:'';
    const disabled=c.enabled?'':` disabled aria-disabled="true"`;
    const cls=c.primary?' class="primary"':'';
    parts.push(`<button type="button"${cls}${attr}${disabled}>${c.label}</button>`);
  }
  const defaultStatus=presentation?'Presentation':role==='guest'?'Score — · Guest Practice · not saved':role==='student'?'Score —':(role==='teacher'||role==='admin')?'Teacher mode':'';
  parts.push(`<span data-status>${statusText??defaultStatus}</span>`);
  return `<div class="eleap-actions">${parts.join('')}</div>`;
}

export function controlModelForRole({role='guest',presentation=false,capabilities={}}={}){
  const contract=controlsForRole(role,{presentation});
  const model=[];
  for(const group of ['activity','classroom','utility']){
    for(const id of contract[group]){
      const spec=controlSpec(id)||{id,label:id,group};
      const enabled=(id in capabilities)?capabilities[id]!==false:true;
      model.push({...spec,group,visible:true,enabled});
    }
  }
  return model;
}
