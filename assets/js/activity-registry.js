/* E-LEAP Activity Registry v1.0 — templates define behavior, lessons provide data. */
export const E_LEAP_ACTIVITY_TYPES={
  'mcq':{label:'Multiple Choice',student:['choose','submit'],teacher:['check','reveal'],presentation:['reveal']},
  'multi-select':{label:'Multiple Select',student:['choose','submit'],teacher:['check','reveal'],presentation:['reveal']},
  'true-false':{label:'True / False',student:['choose','submit'],teacher:['check','reveal'],presentation:['reveal']},
  'fill':{label:'Fill in the Blank',student:['type','submit'],teacher:['check','reveal'],presentation:['reveal']},
  'matching':{label:'Matching',student:['match','submit'],teacher:['check','reveal'],presentation:['reveal']},
  'ordering':{label:'Ordering',student:['order','submit'],teacher:['check','reveal'],presentation:['reveal']},
  'categorising':{label:'Categorising',student:['sort','submit'],teacher:['check','reveal'],presentation:['reveal']},
  'click-reveal':{label:'Click to Reveal',student:['explore'],teacher:['reveal'],presentation:['reveal']},
  'listening':{label:'Listening',student:['listen','respond','submit'],teacher:['play','check','reveal'],presentation:['play','reveal']},
  'video-question':{label:'Watch & Answer',student:['watch','respond','submit'],teacher:['play','check','reveal'],presentation:['play','reveal']},
  'speaking-record':{label:'Speaking / Record',student:['record','submit'],teacher:['review'],presentation:['prompt']},
  'writing':{label:'Writing',student:['type','autosave','submit'],teacher:['review','feedback'],presentation:['prompt']},
  'discussion':{label:'Discussion / Group Task',student:['respond'],teacher:['facilitate'],presentation:['prompt']},
  'poll':{label:'Poll',student:['choose','submit'],teacher:['responses'],presentation:['results']},
  'flashcards':{label:'Flashcards',student:['explore'],teacher:['reveal'],presentation:['reveal']},
  'flip-match':{label:'Flip & Match',student:['play'],teacher:['facilitate','reveal'],presentation:['play','reveal']}
};
export function getActivityDefinition(type){return E_LEAP_ACTIVITY_TYPES[type]||null;}
export function isSupportedActivity(type){return !!getActivityDefinition(type);}
