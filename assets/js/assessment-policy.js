export const E_LEAP_DELIVERY_POLICIES={
  practice:{id:'practice',label:'Practice',check:true,reveal:true,reset:true,submit:true,attempts:'unlimited',feedback:'immediate'},
  homework:{id:'homework',label:'Homework',check:false,reveal:false,reset:true,submit:true,attempts:3,feedback:'after-submit'},
  mock:{id:'mock',label:'Mock Test',check:false,reveal:false,reset:false,submit:'final-only',attempts:1,feedback:'after-release',autoSubmitOnTimeout:true},
  presentation:{id:'presentation',label:'Presentation',check:false,reveal:'teacher',reset:true,submit:false,attempts:0,feedback:'teacher-led'}
};

/* Role controls are owned by assets/js/controls/. Kept as re-exports for backward compatibility. */
export {ROLE_CONTROL_CONTRACT as E_LEAP_ROLE_CONTROLS} from './controls/role-control-contract.js';
export {controlsForRole} from './controls/control-shell.js';

export function normaliseDeliveryPolicy(p={}){const base=E_LEAP_DELIVERY_POLICIES[p.id]||E_LEAP_DELIVERY_POLICIES.practice;return {...base,...p,id:p.id||base.id};}
export function policyForActivity(lessonPolicy,activity={}){const p=normaliseDeliveryPolicy(lessonPolicy);return {...p,...(activity.policy||{})};}
