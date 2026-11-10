/* Hybrid pedagogy contract: every method state must do actual learning work.
 * Frames are generic language scaffolds, not textbook answers.
 * Teacher may replace frames for age/CEFR and approve before publishing.
 */
const MODE={
 individual:{interaction:'Read / listen / think independently',artifact:'An individual note or initial response',accountability:'Each learner records their own idea before discussion.'},
 pair:{interaction:'Compare and clarify with a partner',artifact:'A joint response supported by two contributions',accountability:'Both partners explain at least one idea and ask one follow-up question.'},
 group:{interaction:'Cooperate with named rotating roles',artifact:'A shared group decision and individual contribution',accountability:'Allocate Reader/Listener, Evidence Finder, Reporter and Checker as appropriate; rotate roles.'},
 class:{interaction:'Teacher-facilitated whole-class verification',artifact:'A shared final answer with justification',accountability:'Collect contrasting responses before revealing the key.'}
};
const getKey=s=>String(s?.id||'').toLowerCase();
const classify=s=>{
 const x=getKey(s),t=String(s.label||'').toLowerCase();
 if(/complete|check|practise|practice|retry|final/.test(x+' '+t))return 'complete';
 if(/report|share|present|perform|debate|challenge|rebut/.test(x+' '+t))return 'report';
 if(/evidence|verify|justify|compare|explain|why|reflect|feedback|review/.test(x+' '+t))return 'evidence';
 if(/listen|read|note|spot|notice|observe|locate|scan|model/.test(x+' '+t))return 'notice';
 if(/predict|guess|brainstorm|think|elicit|prepare|context|preview/.test(x+' '+t))return 'predict';
 if(/group|pair|exchange|discuss|reconstruct|rebuild|plan|draft|write|role|task|collaborate/.test(x+' '+t))return 'collaborate';
 return 'apply';
};
/* Slot schema only: learner wording is authored later against real textbook content. */
const SUPPORT={
 predict:{purpose:'Activate prior knowledge and build supported predictions.',output:'Prediction / rationale'},
 notice:{purpose:'Identify source clues and relevant information.',output:'Observation / notes'},
 collaborate:{purpose:'Co-construct understanding using individual contributions.',output:'Collaborative response'},
 report:{purpose:'Share and justify an outcome.',output:'Short oral/written report'},
 evidence:{purpose:'Locate reliable evidence and justify an interpretation.',output:'Evidence / explanation'},
 complete:{purpose:'Complete and verify original textbook tasks.',output:'Original task responses / verified rationale'},
 apply:{purpose:'Transfer learning into meaningful language use.',output:'Learner-created example'}
};
export const HYBRID_SLOT_SCHEMA=Object.freeze({
 instruction:{label:'Learner-facing instruction',required:true},
 guidedSteps:{label:'Step-by-step learner guidance',required:true},
 workedExample:{label:'Worked example / demonstration',required:true},
 sentenceSupport:{label:'Sentence frames / language support',required:true},
 sourceMaterial:{label:'Source image / passage / audio / cards',required:true},
 learnerResponse:{label:'Learner response / work area',required:true},
 peerTask:{label:'Individual / pair / group accountability',required:true},
 reportShare:{label:'Share / report area',required:true},
 feedback:{label:'Teacher feedback / checking',required:true},
 answerKey:{label:'Verified answer key (teacher only)',required:false},
 evidence:{label:'Verified evidence per item',required:false},
 why:{label:'Why this answer is supported',required:false}
});
export function hybridStepContract(step){
 const mode=MODE[step?.mode]||null,key=classify(step),support=SUPPORT[key];
 const requiredSlots=['instruction','guidedSteps','workedExample','sentenceSupport','sourceMaterial','learnerResponse','peerTask','reportShare','feedback'];
 if(key==='complete'||key==='evidence')requiredSlots.push('answerKey','evidence','why');
 return {
  ...step,
  // These are layout contracts, NOT learner-facing text or a pre-written scaffold.
  pedagogicalPurpose:support.purpose,
  expectedOutputType:support.output,
  slotSchema:HYBRID_SLOT_SCHEMA,
  requiredSlots,
  slotValues:Object.fromEntries(Object.keys(HYBRID_SLOT_SCHEMA).map(name=>[name,null])),
  sourceInstruction:step?.instruction||'', // metadata for pedagogy review only
  instruction:null,
  organisationMode:mode?.interaction||'UNKNOWN',
  accountabilityType:mode?.artifact||'UNKNOWN',
  readyForPublish:false,
  requiresLessonMapping:true
 };
}
export function evaluateHybridCombo(combo){
 const errors=[],steps=combo?.steps||[];
 if(steps.length<3)errors.push('A method must have a meaningful learning progression.');
 const modes=new Set();
 for(const [i,raw] of steps.entries()){
  const s=hybridStepContract(raw);if(!MODE[s.mode])errors.push('Step '+(i+1)+' has unsupported work mode.');
  if(!s.slotSchema?.instruction||!s.slotSchema?.sentenceSupport||!s.slotSchema?.workedExample)errors.push('Step '+(i+1)+' lacks instructional slot definitions.');
  if(!s.slot?.trim())errors.push('Step '+(i+1)+' has no content slot.');
  if(!s.pedagogicalPurpose||!s.requiredSlots.includes('learnerResponse')||!s.requiredSlots.includes('feedback'))errors.push('Step '+(i+1)+' lacks learner activity or feedback slots.');
  modes.add(s.mode);
 }
 if(!modes.has('individual'))errors.push('Add an individual accountability or preparation opportunity.');
 if(!modes.has('pair')&&!modes.has('group'))errors.push('Add peer interaction before the final task.');
 return {ok:errors.length===0,errors,modes:[...modes],state:'method-review-required'};
}
