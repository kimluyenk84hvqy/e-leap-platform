/* E-LEAP Authoring Layout Registry v1.3 — responsive, bounded layout presets. */
export const E_LEAP_LAYOUTS={
  standard:{label:'Standard',description:'Balanced single-column lesson layout'},
  hero:{label:'Hero',description:'Large lesson title / cover composition'},
  'media-left':{label:'Media left',description:'Media on left, content on right'},
  'media-right':{label:'Media right',description:'Content on left, media on right'},
  'media-40-60':{label:'Media 40 / Content 60',description:'Smaller media with larger teaching content'},
  'media-50-50':{label:'Media 50 / Content 50',description:'Equal media and content'},
  'three-cards':{label:'Three cards',description:'Three concise objectives or concepts'},
  'full-media':{label:'Full media',description:'Large image/video focus'},
  'question-options':{label:'Question + options',description:'Prompt-led objective practice'},
  'two-column':{label:'Two columns',description:'Parallel content or comparison'},
  'reading-split':{label:'Reading split',description:'Reading passage + tasks'},
  'speaking-prompt':{label:'Speaking prompt',description:'Large prompt + recording/task area'}
};
export const E_LEAP_LAYOUT_IDS=Object.keys(E_LEAP_LAYOUTS);
export function normaliseLayout(id){return E_LEAP_LAYOUTS[id]?id:'standard';}
