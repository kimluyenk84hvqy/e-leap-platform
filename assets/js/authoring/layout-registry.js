/* E-LEAP Authoring Layout Registry v1.2 — shared responsive slide layouts. */
export const E_LEAP_LAYOUTS={
  standard:{label:'Standard',description:'Balanced single-column lesson layout'},
  'media-40-60':{label:'Media 40 / Content 60',description:'Smaller media with larger teaching content'},
  'media-50-50':{label:'Media 50 / Content 50',description:'Equal media and content'},
  'question-options':{label:'Question + options',description:'Prompt-led objective practice'},
  'two-column':{label:'Two columns',description:'Parallel content or comparison'},
  'reading-split':{label:'Reading split',description:'Reading passage + tasks'},
  'speaking-prompt':{label:'Speaking prompt',description:'Large prompt + recording/task area'}
};
export const E_LEAP_LAYOUT_IDS=Object.keys(E_LEAP_LAYOUTS);
export function normaliseLayout(id){return E_LEAP_LAYOUTS[id]?id:'standard';}
