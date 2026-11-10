/* Approved visual variants. A variant changes composition, not teaching content. */
export const VISUAL_VARIANTS={
 'lesson-cover':{
  'hero-photo':{label:'Full photo + green title',layout:'hero'},
  'split-cover':{label:'Split photo and title',layout:'media-right'}
 },
 'lesson-aims':{
  'aims-cards':{label:'Three outcomes',layout:'three-cards'},
  'aims-steps':{label:'Numbered outcomes',layout:'standard'}
 },
 'lead-in':{
  'photo-left':{label:'Photo left',layout:'media-left'},
  'photo-right':{label:'Photo right',layout:'media-right'}
 },
 'vocabulary-presentation':{
  'visual-grid':{label:'Visual word grid',layout:'three-cards'},
  'word-and-photo':{label:'Word list + photo',layout:'media-right'}
 },
 'grammar-presentation':{
  'rule-and-example':{label:'Rule and example',layout:'two-column'},
  'discovery-board':{label:'Guided discovery',layout:'standard'}
 },
 'reading-task':{
  'passage-and-task':{label:'Reading split',layout:'reading-split'},
  'evidence-board':{label:'Evidence board',layout:'two-column'}
 },
 'listening-task':{
  'audio-and-task':{label:'Audio + task',layout:'question-options'},
  'focus-listening':{label:'Focused listening',layout:'standard'}
 },
 'speaking-task':{
  'speaker-prompt':{label:'Speaking prompt',layout:'speaking-prompt'},
  'discussion-cards':{label:'Discussion cards',layout:'two-column'}
 },
 'controlled-practice':{
  'question-focus':{label:'Question focus',layout:'question-options'},
  'compact-practice':{label:'Compact practice',layout:'standard'}
 },
 'consolidation':{
  'three-key-points':{label:'Three key points',layout:'three-cards'},
  'reflection':{label:'Reflection',layout:'standard'}
 }
};
export function variantOptions(templateId){return VISUAL_VARIANTS[templateId]||null;}
export function setVisualVariant(screen,id){
 const choices=variantOptions(screen.templateId);
 if(!choices||!choices[id])return {ok:false,reason:'Unsupported variant for this template'};
 return {ok:true,screen:{...screen,visualVariant:id,layout:choices[id].layout}};
}
