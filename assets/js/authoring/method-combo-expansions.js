/* Additional method variants: purposeful changes to learner interaction, not cosmetic renaming.
 * Teacher selects. AI/source mapper must validate original source before publication.
 */
const s=(id,label,instruction,slot,mode,showSource=false)=>({id,label,instruction,slot,mode,showSource});
export const EXPANDED_METHOD_COMBOS={
 'information-gap-listening':{
 label:'Split Listening · Information Gap',group:'Listening',method:'Information gap / jigsaw listening',
 description:'Predict → Listen A/B → Exchange → Reconstruct → Complete → Evidence',
 bestFor:'Dialogues, interviews, accounts with separable information',
 required:['audioSrc','questions','sections'],optional:['transcript','photoSrc','reportPrompt'],
 steps:[
 s('predict','Predict','Predict which information your partner may need.','photoSrc','pair'),
 s('split','Listen A/B','Listen to your assigned part. Note only your information.','sections','individual',true),
 s('exchange','Exchange','Explain your information without showing your notes. Ask for clarification.','sections','pair'),
 s('rebuild','Reconstruct','Build a complete account together from both parts.','reportPrompt','pair'),
 s('complete','Complete & Check','Answer all original questions; check evidence with the teacher.','questions','class',true),
 s('reflect','Reflect','Which questions helped you fill the information gap?','reportPrompt','pair')
 ]},
 'dictogloss-listening':{
 label:'Dictogloss · Reconstruct & Compare',group:'Listening',method:'Collaborative reconstruction',
 description:'Listen → Note → Reconstruct → Compare → Complete → Language Focus',
 bestFor:'Short, coherent audio with transcript; B1+ generally preferable',
 required:['audioSrc','questions','transcript'],optional:['photoSrc','reportPrompt'],
 steps:[
 s('gist','Listen','Listen once without writing and identify the main message.','audioSrc','individual'),
 s('note','Note','Listen again. Record key words, not full sentences.','audioSrc','individual'),
 s('reconstruct','Reconstruct','Combine notes in groups to reconstruct the meaning.','transcript','group'),
 s('compare','Compare','Compare your reconstruction with the original transcript.','transcript','pair',true),
 s('complete','Complete & Check','Return to the original listening questions and justify answers.','questions','class',true),
 s('language','Language Focus','Notice useful expressions and pronunciation features.','transcript','pair',true)
 ]},
 'listening-sequence':{
 label:'Sequence the Story',group:'Listening',method:'Prediction and event sequencing',
 description:'Predict Order → Listen → Reorder → Pair Justify → Complete',
 bestFor:'Narratives, processes and chronological descriptions',
 required:['audioSrc','questions','events'],optional:['transcript','photoSrc'],
 steps:[
 s('predict','Predict','Look at the events. Predict the order.','events','pair'),
 s('listen','Listen','Listen for the sequence, not every word.','audioSrc','individual'),
 s('reorder','Reorder','Arrange the event cards using information you heard.','events','group'),
 s('justify','Justify','Explain your sequence to another pair.','events','pair'),
 s('complete','Complete & Check','Complete all questions from the textbook.','questions','class',true)
 ]},
 'listening-noticing':{
 label:'Sound Detective · Listening',group:'Listening',method:'Bottom-up listening and phonological noticing',
 description:'Predict Sounds → Listen → Notice → Compare → Complete',
 bestFor:'Connected speech, contractions, numbers and key expressions',
 required:['audioSrc','questions','transcript'],optional:['focusWords','photoSrc'],
 steps:[
 s('predict','Predict','Predict the words or sounds you expect.','focusWords','pair'),
 s('listen','Listen','Listen once for meaning before focusing on sounds.','audioSrc','individual'),
 s('notice','Notice','Listen again. Mark the words or sounds you hear.','focusWords','individual'),
 s('compare','Compare','Compare what you heard with the transcript.','transcript','pair',true),
 s('complete','Complete & Check','Finish the original listening task with the class.','questions','class',true)
 ]},
 'reciprocal-reading':{
 label:'Reciprocal Reading · Four Roles',group:'Reading',method:'Predict–Clarify–Question–Summarize',
 description:'Preview → Role Reading → Exchange → Questions → Complete + Evidence',
 bestFor:'Informational texts with several meaningful sections',
 required:['passage','questions'],optional:['sections','groupTask'],
 steps:[
 s('preview','Preview','Predict the text topic from its title and visuals.','passage','pair',true),
 s('roles','Role Reading','Predictor, Clarifier, Questioner and Summarizer read with separate roles.','passage','group',true),
 s('exchange','Exchange','Each role explains their findings to the group.','groupTask','group'),
 s('question','Question','Ask one question and locate support in the text.','passage','pair',true),
 s('complete','Complete & Check','Answer the original questions, then show Evidence and Why.','questions','class',true)
 ]},
 'scanning-race':{
 label:'Scanning Quest · Find & Prove',group:'Reading',method:'Purposeful scanning and peer explanation',
 description:'Preview → Locate → Verify → Pair Explain → Complete + Evidence',
 bestFor:'Dates, names, facts, locations, statistics and multiple short sections',
 required:['passage','questions'],optional:['scanTargets','sections'],
 steps:[
 s('preview','Preview','Predict where the target information is located.','scanTargets','pair'),
 s('locate','Locate','Scan the text quickly and bookmark key phrases.','passage','individual',true),
 s('verify','Verify','Compare the exact supporting sentence with a partner.','passage','pair',true),
 s('explain','Explain','Explain how the information answers the question.','scanTargets','pair'),
 s('complete','Complete & Check','Complete all original questions; reveal Evidence and Why with your teacher.','questions','class',true)
 ]},
 'cut-up-reading':{
 label:'Split Text · Information Exchange',group:'Reading',method:'Cut-up / information gap reading',
 description:'Read Piece → Explain → Rebuild → Predict → Complete',
 bestFor:'Texts that divide into coherent passages; avoid breaking sentences',
 required:['passage','questions','sections'],optional:['groupTask'],
 steps:[
 s('read','Read Piece','Read your assigned piece of the text and make notes.','sections','individual',true),
 s('explain','Explain','Tell partners what your piece says without showing the text.','sections','group'),
 s('rebuild','Rebuild','Put the full story or argument in logical order.','groupTask','group'),
 s('predict','Predict','Predict answers using the reconstructed information.','questions','pair'),
 s('complete','Complete & Check','View the full original text and answer all textbook questions.','questions','class',true)
 ]},
 'claim-evidence-reading':{
 label:'Claim → Evidence → Why',group:'Reading',method:'Evidence-based argument and comprehension',
 description:'Claim → Search → Compare → Decide → Complete',
 bestFor:'Inference, argument, true/false and author attitude questions',
 required:['passage','questions'],optional:['claims','groupTask'],
 steps:[
 s('claim','Claim','Discuss a claim about the text before reading in detail.','claims','pair'),
 s('search','Search','Find a sentence that supports or challenges the claim.','passage','individual',true),
 s('compare','Compare','Compare two different interpretations.','claims','group'),
 s('decide','Decide','Explain how your evidence supports your answer.','groupTask','pair'),
 s('complete','Complete & Check','Complete each original question, followed by Evidence and Why.','questions','class',true)
 ]},
 'grammar-ppp':{
 label:'PPP · Present–Practise–Produce',group:'Grammar',method:'Presentation–Practice–Production',
 description:'Context → Present → Controlled → Pair Check → Produce',
 bestFor:'New forms requiring explicit teacher modelling and controlled accuracy work',
 required:['grammarTarget','examples','questions'],optional:['context','application'],
 steps:[
 s('context','Context','Look at the situation and identify meaning.','context','pair'),
 s('present','Present','Study the teacher model and target structure.','examples','class',true),
 s('controlled','Controlled Practice','Try the original grammar questions individually.','questions','individual',true),
 s('peer','Pair Check','Compare your choices and explain the form.','questions','pair'),
 s('produce','Produce','Use the new grammar in a real-world exchange.','application','pair')
 ]},
 'grammar-ttt':{
 label:'Test–Teach–Test · Grammar',group:'Grammar',method:'Diagnostic test–teach–retest',
 description:'First Try → Find Gaps → Mini Lesson → Retry → Apply',
 bestFor:'Review or mixed-ability classes with partial prior knowledge',
 required:['grammarTarget','questions','examples'],optional:['rule','application'],
 steps:[
 s('first','First Try','Attempt selected items without teacher explanation.','questions','individual'),
 s('gaps','Find Gaps','Compare with a partner. Identify uncertain forms.','questions','pair'),
 s('teach','Mini Lesson','Study only the rules and examples you need.','examples','class',true),
 s('retry','Retry','Complete the original task again and explain your changes.','questions','individual',true),
 s('apply','Apply','Use the structure in new examples.','application','pair')
 ]},
 'grammar-error-hunt':{
 label:'Grammar Detective · Error Hunt',group:'Grammar',method:'Noticing and collaborative correction',
 description:'Spot → Hypothesize → Correct → Explain → Complete',
 bestFor:'Frequent errors and confusing forms',
 required:['examples','grammarTarget','questions'],optional:['errorExamples','application'],
 steps:[
 s('spot','Spot','Find possible errors in the examples.','errorExamples','pair'),
 s('hypothesize','Hypothesize','Explain which rule might be broken.','examples','group',true),
 s('correct','Correct','Propose corrected sentences together.','errorExamples','pair'),
 s('explain','Explain','Justify your corrections using the form and meaning.','grammarTarget','class'),
 s('complete','Complete & Check','Finish the original textbook exercise.','questions','class',true)
 ]},
 'vocabulary-picture-puzzle':{
 label:'Picture Elicitation → Retrieval',group:'Vocabulary',method:'Visual elicitation and retrieval',
 description:'Reveal → Guess → Meaning → Pronounce → Practise',
 bestFor:'Concrete words with visually identifiable meaning',
 required:['items','questions','photoSrc'],optional:['application'],
 steps:[
 s('reveal','Reveal','Look at the partial picture and predict the word.','photoSrc','pair'),
 s('guess','Guess','Give clues without saying the target word.','items','pair'),
 s('meaning','Meaning','Match each image and word with its meaning.','items','group',true),
 s('pronounce','Pronounce','Listen and practise stress and pronunciation.','items','class',true),
 s('complete','Practise & Check','Complete all original vocabulary exercises.','questions','class',true)
 ]},
 'vocabulary-word-map':{
 label:'Word Web → Categorise → Apply',group:'Vocabulary',method:'Semantic mapping and retrieval',
 description:'Brainstorm → Cluster → Match → Retrieve → Complete',
 bestFor:'Semantic fields, collocations and abstract topic vocabulary',
 required:['items','questions'],optional:['categories','application'],
 steps:[
 s('brainstorm','Brainstorm','List words you already know about the topic.','categories','group'),
 s('cluster','Cluster','Place the new words in meaningful groups.','items','group',true),
 s('match','Match','Match words with definitions and collocations.','items','pair',true),
 s('retrieve','Retrieve','Close the word list and explain three words to a partner.','items','pair'),
 s('complete','Complete & Check','Complete the original vocabulary task.','questions','class',true)
 ]},
 'vocabulary-hot-seat':{
 label:'Hot Seat · Describe & Guess',group:'Vocabulary',method:'Communicative word retrieval',
 description:'See → Describe → Guess → Switch → Check',
 bestFor:'Previously introduced vocabulary, images, concepts and review',
 required:['items','questions'],optional:['photoSrc','forbiddenWords','application'],
 steps:[
 s('see','See','Everyone except the guesser looks at the word or picture.','items','group'),
 s('describe','Describe','Give English clues without saying the keyword.','forbiddenWords','group'),
 s('guess','Guess','The Hot Seat learner guesses the keyword.','items','group'),
 s('switch','Switch','Change roles so every learner describes and guesses.','items','group'),
 s('complete','Check & Use','Complete the textbook task and use the target words.','questions','class',true)
 ]},
 'speaking-information-gap':{
 label:'Find the Missing Information',group:'Speaking',method:'Information gap communication',
 description:'Prepare A/B → Ask → Clarify → Compare → Report',
 bestFor:'Dialogues with roles and missing details',
 required:['speakingPrompt','sections'],optional:['languageSupport','criteria'],
 steps:[
 s('prepare','Prepare A/B','Read only your role card; do not show it to others.','sections','individual',true),
 s('ask','Ask','Ask your partner questions to obtain missing details.','speakingPrompt','pair'),
 s('clarify','Clarify','Ask follow-up questions to confirm meaning.','languageSupport','pair'),
 s('compare','Compare','Check whether both partners have complete information.','sections','pair'),
 s('report','Report','Present your completed outcome to the group.','speakingPrompt','group')
 ]},
 'speaking-roleplay':{
 label:'Role-play · Real-world Scenario',group:'Speaking',method:'Situational communicative role play',
 description:'Understand Roles → Prepare → Role-play → Swap → Feedback',
 bestFor:'Functional language, requests, advice, decision-making',
 required:['speakingPrompt','sections'],optional:['languageSupport','criteria','model'],
 steps:[
 s('roles','Understand Roles','Read your situation and role card.','sections','individual',true),
 s('prepare','Prepare','Plan useful phrases and possible responses.','languageSupport','pair'),
 s('perform','Role-play','Act out the exchange and negotiate an outcome.','speakingPrompt','pair'),
 s('swap','Swap','Change roles and try a different response.','sections','pair'),
 s('reflect','Feedback','Share one successful phrase and one improvement.','criteria','class')
 ]},
 'speaking-debate':{
 label:'Mini Debate · Evidence & Rebuttal',group:'Speaking',method:'Structured argument and counterargument',
 description:'Position → Prepare → Challenge → Rebut → Reflect',
 bestFor:'B1–C1 opinions with reasons and evidence; not very early beginners',
 required:['speakingPrompt'],optional:['sourceFacts','languageSupport','criteria'],
 steps:[
 s('position','Position','Choose a position and one reason.','speakingPrompt','individual'),
 s('prepare','Prepare','Work in teams to find supporting examples.','sourceFacts','group'),
 s('challenge','Challenge','Present your claim and ask the opposing team a question.','speakingPrompt','group'),
 s('rebut','Rebut','Respond politely to a different viewpoint.','languageSupport','group'),
 s('reflect','Reflect','Evaluate reasons, clarity and respectful language.','criteria','class')
 ]},
 'writing-genre':{
 label:'Model → Genre Features → Write',group:'Writing',method:'Genre-based writing scaffolding',
 description:'Read Model → Notice → Plan → Write → Peer Check',
 bestFor:'Emails, reports, essays and clearly patterned text genres',
 required:['writingPrompt','model'],optional:['structure','criteria','languageSupport'],
 steps:[
 s('model','Read Model','Read a sample and identify its communicative purpose.','model','individual',true),
 s('features','Notice','Find useful structure, register and linking expressions.','structure','pair'),
 s('plan','Plan','Organise key information for the target reader.','writingPrompt','individual'),
 s('write','Write','Write a complete response to the original task.','writingPrompt','individual'),
 s('check','Peer Check','Check content, organization and language choices.','criteria','pair')
 ]},
 'writing-collaborative':{
 label:'Collaborative Draft → Peer Edit',group:'Writing',method:'Collaborative writing and process feedback',
 description:'Idea Pool → Outline → Co-write → Peer Edit → Final',
 bestFor:'Short paragraphs, reports, joint summaries and group outputs',
 required:['writingPrompt'],optional:['outline','criteria','languageSupport'],
 steps:[
 s('ideas','Idea Pool','Share ideas and agree on the key message.','writingPrompt','group'),
 s('outline','Outline','Assign roles for the opening, body and conclusion.','outline','group'),
 s('draft','Co-write','Produce one shared first draft.','writingPrompt','group'),
 s('edit','Peer Edit','Exchange drafts and provide specific corrections.','criteria','group'),
 s('final','Final','Revise and submit the complete final response.','writingPrompt','group')
 ]},
 'writing-reverse-outline':{
 label:'Reverse Outline → Build Your Text',group:'Writing',method:'Analytical planning and text organisation',
 description:'Analyse → Reorder → Outline → Draft → Review',
 bestFor:'B1–C1 longer writing and coherence training',
 required:['writingPrompt','model'],optional:['outline','criteria'],
 steps:[
 s('analyse','Analyse','Read each model paragraph and identify its purpose.','model','pair',true),
 s('reorder','Reorder','Rebuild the logical paragraph sequence.','model','group'),
 s('outline','Outline','Create an outline for the original writing task.','outline','individual'),
 s('draft','Draft','Write a response based on the outline.','writingPrompt','individual'),
 s('review','Review','Evaluate organization and connections between ideas.','criteria','pair')
 ]},
 'warmup-picture-quiz':{
 label:'Visual Mystery → Keyword',group:'Warm-up / Lead-in',method:'Picture elicitation and guessing',
 description:'Reveal → Observe → Clues → Guess → Link',
 bestFor:'Introducing visual vocabulary or concrete topics',
 required:['photoSrc','targetWord'],optional:['clues','leadQuestions'],
 steps:[
 s('reveal','Reveal','Look at a small part of the picture.','photoSrc','class'),
 s('observe','Observe','Describe what you can see without guessing yet.','leadQuestions','pair'),
 s('clues','Clues','Give a short clue to your classmates.','clues','pair'),
 s('guess','Guess','Guess the keyword based on clues.','targetWord','class'),
 s('link','Link','Explain how the keyword relates to today’s topic.','targetWord','pair')
 ]},
 'warmup-poll-contrast':{
 label:'Opinion Poll → Compare',group:'Warm-up / Lead-in',method:'Engagement poll and peer explanation',
 description:'Vote → Pair Explain → Compare → Predict',
 bestFor:'Controversial but safe topics and prior-knowledge elicitation',
 required:['pollQuestion'],optional:['pollOptions','leadQuestions','photoSrc'],
 steps:[
 s('vote','Vote','Choose the option closest to your opinion.','pollQuestion','individual'),
 s('explain','Pair Explain','Explain your choice to a partner.','pollQuestion','pair'),
 s('compare','Compare','Compare the class results and give reasons.','pollOptions','class'),
 s('predict','Predict','Predict how the lesson may explore the issue.','leadQuestions','pair')
 ]}
};
