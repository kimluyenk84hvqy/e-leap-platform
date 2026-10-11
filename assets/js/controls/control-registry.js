/** Stable control metadata used by host controls, runtime activities and Studio preview. */
export const CONTROL_REGISTRY = Object.freeze({
  check: Object.freeze({id:'check',label:'Check',group:'activity',action:'check',dataAttr:'data-check'}),
  reset: Object.freeze({id:'reset',label:'Reset',group:'activity',action:'reset',dataAttr:'data-reset'}),
  reveal: Object.freeze({id:'reveal',label:'Show answer',group:'activity',action:'reveal',dataAttr:'data-show-answer'}),
  submit: Object.freeze({id:'submit',label:'Submit',group:'activity',action:'submit',dataAttr:'data-submit',primary:true}),
  score: Object.freeze({id:'score',label:'Score',group:'activity',kind:'status'}),
  presentation: Object.freeze({id:'presentation',label:'Presentation',group:'classroom',action:'presentation',primary:true}),
  'exit-presentation': Object.freeze({id:'exit-presentation',label:'Exit Presentation',group:'classroom',action:'exit-presentation',dataAttr:'data-exit-presentation'}),
  timer: Object.freeze({id:'timer',label:'Timer',group:'classroom',action:'timer'}),
  responses: Object.freeze({id:'responses',label:'Responses',group:'classroom',action:'responses'}),
  live: Object.freeze({id:'live',label:'Live Class / QR',group:'classroom',action:'live'}),
  edit: Object.freeze({id:'edit',label:'Edit in Studio',group:'utility',action:'edit'})
});

export function controlSpec(id){return CONTROL_REGISTRY[id]||null;}
export function controlLabel(id){return controlSpec(id)?.label||id;}
