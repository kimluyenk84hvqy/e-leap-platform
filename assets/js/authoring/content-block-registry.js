/* E-LEAP Authoring Content Block Registry v1.2 — canonical content-only blocks. */
export const CONTENT_BLOCK_TYPES={
  text:{label:'Text',category:'Content',defaults:()=>({content:{text:'Type your content here…',role:'body'},style:{}})},
  image:{label:'Image',category:'Content',media:'image',defaults:()=>({content:{assetId:null,src:'',alt:'',fit:'contain',caption:''},style:{}})},
  audio:{label:'Audio',category:'Content',media:'audio',defaults:()=>({content:{assetId:null,src:'',label:'Listen',transcript:''},style:{}})},
  video:{label:'Video',category:'Content',media:'video',defaults:()=>({content:{assetId:null,src:'',label:'Watch',poster:'',caption:'',transcript:''},style:{}})},
  vocabulary:{label:'Vocabulary',category:'Content',defaults:()=>({content:{items:[{word:'Word',meaning:'Meaning',example:'Example sentence.'}]},style:{}})},
  'grammar-note':{label:'Grammar note',category:'Content',defaults:()=>({content:{rule:'Grammar rule',form:'Form / pattern',examples:['Example sentence.']},style:{}})}
};
export function getContentBlockDefinition(type){return CONTENT_BLOCK_TYPES[type]||null;}
export function isContentBlock(type){return !!getContentBlockDefinition(type);}
export function createContentPayload(type){const def=getContentBlockDefinition(type);return def?def.defaults():null;}
