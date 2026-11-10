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
const SUPPORT={
 predict:{purpose:'Activate prior knowledge and build a low-stakes prediction before the source task.',frame:'I think ___ because I can see / already know ___.',output:'One prediction and one reason',feedback:'Invite two different hypotheses; do not reveal the final answer yet.'},
 notice:{purpose:'Notice key information before evaluating the whole textbook task.',frame:'I noticed / heard / read ___; the clue is ___.',output:'Two key details or a brief evidence note',feedback:'Ask a learner to point to the relevant image, sound or text segment.'},
 collaborate:{purpose:'Use complementary contributions to co-construct meaning.',frame:'My part says ___. What did you find? Let’s agree on ___.',output:'A jointly agreed note or explanation',feedback:'Check that every member contributes before moving on.'},
 report:{purpose:'Rehearse and publicly share a group outcome.',frame:'Our group decided ___ because ___. We also considered ___.',output:'A short oral report and supporting reason',feedback:'Ask another group to question or add to the report.'},
 evidence:{purpose:'Compare interpretations and justify them with the source.',frame:'Our answer is ___; the evidence is ___; this means ___.',output:'An answer, an evidence location and a why-explanation',feedback:'Only verified source evidence may be shown; no invented quotations.'},
 complete:{purpose:'Complete all original textbook items after supported preparation.',frame:'I choose ___ because the text / recording says ___.',output:'Original responses plus teacher-verified explanation',feedback:'Teacher checks every original item, reveals the verified key, and discusses Evidence and Why.'},
 apply:{purpose:'Apply the target learning to a new meaningful use.',frame:'In my example, ___; I used ___ because ___.',output:'A learner-created example, sentence or response',feedback:'Give a model of form, not the answer to the textbook question.'}
};
export function hybridStepContract(step){
 const mode=MODE[step?.mode]||null,key=classify(step);
 const support=SUPPORT[key];
 return {
  ...step,
  pedagogicalPurpose:support.purpose,
  learnerSupport:{sentenceFrame:support.frame,examplePolicy:'Model the response format using a different example; never reveal the original answer.',difficulty:'Allow keyword / partial sentence / complete sentence depending on learner level.'},
  expectedOutput:support.output,
  organisation:mode?.interaction||'UNKNOWN',
  accountability:mode?.accountability||'UNKNOWN',
  teacherCheck:support.feedback,
  readyForPublish:false,
  requiresTeacherAdaptation:true
 };
}
export function evaluateHybridCombo(combo){
 const errors=[],steps=combo?.steps||[];
 if(steps.length<3)errors.push('A method must have a meaningful learning progression.');
 const modes=new Set();
 for(const [i,raw] of steps.entries()){
  const s=hybridStepContract(raw);if(!MODE[s.mode])errors.push('Step '+(i+1)+' has unsupported work mode.');
  if(!s.instruction?.trim())errors.push('Step '+(i+1)+' lacks learner instruction.');
  if(!s.slot?.trim())errors.push('Step '+(i+1)+' has no content slot.');
  if(!s.pedagogicalPurpose||!s.learnerSupport.sentenceFrame||!s.expectedOutput||!s.teacherCheck)errors.push('Step '+(i+1)+' lacks scaffolding or feedback.');
  modes.add(s.mode);
 }
 if(!modes.has('individual'))errors.push('Add an individual accountability or preparation opportunity.');
 if(!modes.has('pair')&&!modes.has('group'))errors.push('Add peer interaction before the final task.');
 return {ok:errors.length===0,errors,modes:[...modes],state:'method-review-required'};
}
