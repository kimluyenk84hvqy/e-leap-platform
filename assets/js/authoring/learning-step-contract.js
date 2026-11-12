/* E-LEAP Teaching Combo Learning Contract v2.
 * This metadata is for Authoring Studio only. It is NEVER a learner banner.
 * Each pedagogic phase must have Input, Task, Support, Output, Interaction, Feedback.
 * Canonical method IDs remain unchanged.
 */
const step=(id,label,input,task,support,output,interaction,feedback)=>({id,label,input,task,support,output,interaction,feedback});
export const LEARNING_COMBO_CONTRACTS={
 'think-pair-share':{
  name:'Think–Pair–Share · Visual elicitation / personal travel',
  phases:[
   step('look','Look','Large recognisable source photo','Name the type of transport','Photo group, useful word','A proposed transport name','individual','Compare with photo/teacher'),
   step('pair','Talk','Named transport photo','Explain where people use it','Where / when sentence starter','One supported sentence','pair','Partner asks one follow-up'),
   step('share','Share','Own previous answer','Tell class and give one reason','because / usually','A complete spoken contribution','class','Teacher acknowledges and extends')
  ]},
 'crossword-challenge':{
  name:'Digital crossword · Individual → Peer → Teacher check',
  phases:[
   step('clue','Choose clue','Full crossword and selected clue','Read and identify the transport word','Highlighted row/column, visible whole grid','Typed word shown in cells','individual','Check a single item'),
   step('peer','Compare','Own previously typed answers','Explain one uncertain clue','I think ... because ...','Revised word or reason','pair','Teacher selects a word'),
   step('reveal','Check','Selected word','Confirm the correct spelling','Focused word zoom and clue','One verified word at a time','class','Show selected word, not all')
  ]},
 'staged-listening':{
  name:'Staged listening · Predict → Listen → Compare → Check',
  canonicalPhaseMapping:{
   prepare:['predict'],listen:['gist','detail'],compare:['compare'],check:['complete','follow']
  },
  phases:[
   step('prepare','Prepare','Airport signs / need questions','Predict phrase-to-place links or expected answer type','Short phrases, sign vocabulary','Recorded prediction','pair','Revisit after listening'),
   step('listen','Listen & answer','Original Track 22, textbook questions','Write answer for each conversation while listening','Signs a–h, need / need to noticing','Saved item responses','individual','Replay original track'),
   step('compare','Compare','Saved individual responses','Discuss any differences and revise','I heard ... / I chose ... because ...','Revised individual response','pair','Teacher monitors and invites evidence'),
   step('check','Check','Original questions and submitted attempts','Check one answer at a time','Source-verified segment only','Checked responses with justification','class','Evidence and Why only after source verification')
  ]},
 'tbl-listening':{
  name:'Task-based listening · Prepare → Task → Report → Check',
  phases:[
   step('prepare','Prepare','Airport language and situation','Anticipate likely information','Visuals and phrases','Prediction','pair','Clarify task'),
   step('listen','Task','Original source audio and questions','Collect information to solve the task','Questions and replay','Written answers','individual','Replay and clarify'),
   step('compare','Report','Saved group notes','Compare findings and report','Language for justification','Group conclusion','group','Peer discussion'),
   step('check','Check','Original textbook answers','Verify against recording','Verified micro-evidence','Justified answers','class','Item feedback and Why')
  ]},
 'guided-grammar':{
  name:'Guided Discovery · Context → Notice → Discover → Rule Check → Apply',
  phases:[
   step('context','Context','Travel situation and heard expressions','Identify communicative needs','Airport examples','Meaningful recall','pair','Elicit target'),
   step('notice','Notice','Selected examples of need','Spot form after need','Bold target chunks','Marked language features','individual','Compare to examples'),
   step('discover','Discover','Original questions and examples','Infer grammar from patterns','need + noun / need to + verb examples','Proposed rules','pair','Compare hypotheses'),
   step('rule','Rule Check','Learner rule hypotheses','Confirm correct form and meaning','Teacher-controlled rule reveal','Verified grammar rule','class','Show only when ready'),
   step('apply','Apply','Travel contexts and textbook Activity 2','Use need in personal example then complete original practice','Sentence stems and item gaps','Written answers and spoken example','individual/pair','Item Check / Why')
  ]},
 'grammar-ppp':{
  name:'PPP · Present → Practise → Produce',
  phases:[
   step('present','Present','Model grammar examples','Identify form and meaning','Short examples and rule','Recognized structures','class','Concept checking'),
   step('practise','Practise','Original textbook Activity 2','Complete need gaps','Per-item input and hints','Written answers','individual/pair','Item-by-item Check'),
   step('produce','Produce','Personal travel situation','Explain personal needs','Sentence starters','Three meaningful sentences','pair','Teacher feedback')
  ]}
};
export function inspectLearningContract(id){
 const contract=LEARNING_COMBO_CONTRACTS[id];
 if(!contract)return ['Teaching Combo does not have a validated learning-step contract.'];
 const errors=[];
 for(const phase of contract.phases||[])for(const field of ['input','task','support','output','interaction','feedback']){
  if(!String(phase[field]||'').trim())errors.push(id+' / '+phase.id+': missing '+field);
 }
 return errors;
}
