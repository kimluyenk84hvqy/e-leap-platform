/* LIFE 2e A2-B1 Unit 12: Opener + 12A + 12B.
 * Repeatable source-grounded ACCEPTANCE FIXTURE, not a released lesson.
 * No textbook-page bitmaps or reproduced full textbook passages.
 * Source locators and teacher notes are not learner-facing.
 */
import {createLesson,createBlock,uid} from './lesson-model.js';
const txt=(value,role='body')=>{const b=createBlock('text');b.content.text=value;b.content.role=role;return b};
const activity=(type,prompt,props={})=>{const b=createBlock(type);b.activity={...b.activity,prompt,...props};return b};
const screen=(stage,title,instruction,templateId,layout,blocks,refs,notes='')=>({
 id:uid('screen'),stage,title,instruction,templateId,layout,blocks,
 audience:'student',teacherNotes:notes,sourceRefs:refs
});
const src=(pages,ppt,track)=>({collection:'life-2e-a2b1',bookPages:pages,pptSlides:ppt,audioTrack:track||null});
const audio=(track)=>{const b=createBlock('audio');b.content.label='Listen';b.content.assetId=null;b.content.src='';b.sourceTrack=track;return b};
const image=()=>{const b=createBlock('image');b.content.alt='Topic photograph';b.content.assetId=null;b.content.src='';return b};
const wordList=items=>{const b=createBlock('vocabulary');b.content.items=items.map(w=>({word:w,meaning:'',example:''}));return b};
const grammar=(rule,form,examples)=>{const b=createBlock('grammar-note');b.content={...b.content,rule,form,examples};return b};
const question=(prompt,options,correct,extra={})=>activity('mcq',prompt,{options:options.map((v,i)=>({id:String.fromCharCode(65+i),label:v})),answerKey:[String.fromCharCode(65+correct)],...extra});
const fill=(prompt,items)=>activity('fill',prompt,{items:items.map(([q,answers],i)=>({id:String(i+1),prompt:q,answers:Array.isArray(answers)?answers:[answers]}))});
const discuss=prompt=>activity('discussion',prompt,{rubric:'Share one clear answer and a supporting reason.'});
export const LIFE_U12_FIXTURE_ID='life-2e-a2b1-u12-opener-12a-12b';
export const LIFE_U12_SOURCE_MAP={
 course:'LIFE Student’s Book, 2nd Edition, A2–B1',
 book:'Life Student’s Book I 2ND Edition A2-B1.pdf',
 ppt:'U12 A + B New(1).pptx',
 audioArchive:'Audio Life pre intermediate student book.zip',
 scope:['Unit 12 Opener p.141','12A pp.142–143','12B pp.144–145'],
 trackNumbers:[93,95,96],
 mediaStatus:'UNLINKED_PRIVATE_BLOB',
 rights:'Restricted teacher-only preparation. Review licensing before sharing derived source assets.'
};
export function makeLifeU12AcceptanceFixture(){
 const slides=[];
 slides.push(screen('Cover','Unit 12 · Nature','','lesson-cover','hero',[
  txt('VIETNAM MILITARY MEDICAL UNIVERSITY','institution'),
  txt('FACULTY OF FOREIGN LANGUAGES','faculty'),
  txt('Unit 12 · Opener · 12A · 12B','eyebrow'),
  txt('NATURE','display'),image()
 ],src([141],[1]),'Cover photo awaits rights-cleared media asset.'));
 slides.push(screen('Aims','Our learning goals','By the end of the lesson, you will be able to:','lesson-aims','three-cards',[
  txt('Describe extreme weather and natural places.','heading'),
  txt('Use second conditional sentences and indefinite pronouns.','heading'),
  txt('Read, listen, share evidence and discuss nature.','heading')
 ],src([141,142,143,144,145],[3,4,5])));
 slides.push(screen('Opener','Storm chasers','Look at the photo. What do you notice?','lead-in','media-left',[
  image(),discuss('Where might this be? What makes a tornado dangerous?')
 ],src([141],[9,10]),'Source photo required. No full-page textbook screenshot.'));
 slides.push(screen('Opener','Listen: Storm chasers','Listen and answer the questions.','listening-task','question-options',[
  audio(93),
  fill('Listen for key information.',[
   ['What do most people do when a tornado is coming?',['drive away','drive in the opposite direction']],
   ['Who are storm chasers?',['scientists and ordinary people','scientists and everyday people']],
   ['When are tornadoes commonly seen?',['between 4 p.m. and 9 p.m.','4 p.m. to 9 p.m.']]
  ])
 ],src([141],[11],93),'Track 093 verified from book p.189, but not uploaded to Private Blob.'));
 slides.push(screen('Opener','Would you chase a storm?','Think alone. Discuss with a partner. Share one reason.','speaking-task','speaking-prompt',[
  discuss('Would you like to be a storm chaser? Why or why not?')
 ],src([141],[12])));
 slides.push(screen('12A · Vocabulary','Extreme weather','Read the words. Find a matching real-world photograph.','vocabulary-presentation','media-right',[
  wordList(['flood','hail','snowstorm','thunder and lightning']),image()
 ],src([142],[14,15]),'Add four licensed photos and word meanings; do not use scanned book page.'));
 slides.push(screen('12A · Vocabulary','Weather where you live','Discuss with a partner. Give examples.','speaking-task','speaking-prompt',[
  discuss('Which kinds of extreme weather happen in your country? When?')
 ],src([142],[16])));
 slides.push(screen('12A · Reading','What if…?','Read the four short sections. Then teach your group one idea.','reading-task','reading-split',[
  txt('A scientist who formerly worked at NASA answers hypothetical questions with scientific reasoning.\n\nA submarine offers more protection from lightning than an exposed boat.\n\nElectricity from a nearby lightning strike can spread across the water.\n\nRain at normal driving speed is unlikely to break a windscreen, but hail can damage it at high speed.'),
  discuss('Which scientific explanation surprised you? Explain your answer.')
 ],src([142],[17,19,23]),'Adapted teaching summary, NOT a reproduction of the source reading. Group into four expert sections.'));
 slides.push(screen('12A · Reading','Find your evidence','Discuss each answer. Identify the supporting part of the text.','reading-task','reading-split',[
  txt('Randall used to work for NASA. He answers hypothetical questions using scientific reasoning. A submarine gives more protection from lightning than an exposed boat. Electricity from lightning can spread through water. Large hailstones can break a car windscreen.'),
  (()=>{const b=fill('Write Yes or No for each statement.',[
   ['Randall currently works for NASA.','No'],
   ['The blog answers only events that really happened.','No'],
   ['The answers are based on science.','Yes'],
   ['A submarine is safer than an exposed boat during lightning.','Yes'],
   ['Lightning electricity can spread across water.','Yes'],
   ['Hail can break a car windscreen.','Yes']
  ]);b.activity.evidenceByItem={
   '1':{quote:'Randall used to work for NASA.',why:'Used to means he previously worked there, not that he currently does.'},
   '2':{quote:'He answers hypothetical questions using scientific reasoning.',why:'Hypothetical questions are not limited to events that really happened.'},
   '3':{quote:'using scientific reasoning',why:'The reading explicitly identifies scientific reasoning as his method.'},
   '4':{quote:'A submarine gives more protection from lightning than an exposed boat.',why:'The submarine is underwater, while a boat is more exposed.'},
   '5':{quote:'Electricity from lightning can spread through water.',why:'Electrical energy can travel outward through water.'},
   '6':{quote:'Large hailstones can break a car windscreen.',why:'Hail can damage glass when conditions are severe.'}
  };return b;})()
 ],src([142],[18,19,20,21,22,23,24]),'Future Evidence–Why UI must link each of six items to source spans. Never fabricate verified interactive evidence.'));
 slides.push(screen('12A · Grammar','Second conditional','Study the examples. What pattern do you notice?','grammar-presentation','two-column',[
  grammar('We use the second conditional for unlikely or imaginary situations now or in the future.','If + past simple, would + base verb.',[
   'If I had more free time, I would travel.',
   'I would stay inside if a tornado came.'
  ]),
  question('Which sentence describes an imaginary situation?',[
   'If it rains, I will stay home.',
   'If I lived by the sea, I would surf every day.'
  ],1)
 ],src([143],[25])));
 slides.push(screen('12A · Grammar','Try the second conditional','Complete the sentences, then compare with a partner.','controlled-practice','question-options',[
  fill('Use the correct verb forms.',[
   ['If I had more time, I ___ (help) you.','would help'],
   ['If it ___ (snow), we would stay home.','snowed'],
   ['If I ___ (be) you, I would check the forecast.',['were','was']]
  ])
 ],src([143],[26,27,28]),'Practice items are newly composed; refer to book pp.143 for original exercises.'));
 slides.push(screen('12A · Pronunciation','Would, wouldn’t and ’d','Listen. Count the target forms, then practise in pairs.','listening-task','question-options',[
  audio(95),
  question('How many times do you hear would, wouldn’t or ’d?',['6','7','8','9'],2)
 ],src([143,189],[29],95),'Count 8 verified from source PPT slide 29. Track 095 requires Private Blob link.'));
 slides.push(screen('12A · Speaking','Hopes and dreams','Discuss with a partner. Give a reason for each answer.','speaking-task','speaking-prompt',[
  discuss('If you could live anywhere, where would you go and why?')
 ],src([143],[30])));
 slides.push(screen('12B · Vocabulary','Nature around us','Look at the photographs. Match each place to a word.','vocabulary-presentation','media-right',[
  wordList(['forest','mountain','field','river','garden','ocean','park','desert']),image()
 ],src([144],[32,33,34,35]),'Eight-word photo grid needs licensed images. Do not paste book images with captions.'));
 slides.push(screen('12B · Listening','One cubic foot of nature','Listen. What is the purpose of the green frame?','listening-task','question-options',[
  audio(96),
  question('Why did David use the frame?',[
   'To keep animals away from his camera.',
   'To show that living things can be found nearby.',
   'To build a small greenhouse.'
  ],1)
 ],src([144,189],[37],96),'Track 096 verified from book audioscript page 189.'));
 slides.push(screen('12B · Listening','Listen for details','Listen again. Decide True or False.','listening-task','question-options',[
  audio(96),
  fill('Write T or F.',[
   ['Some city residents think nature is far away.','T'],
   ['David wanted people to notice nearby living things.','T'],
   ['He used the frame in several locations.','T'],
   ['His entire worldwide project lasted three weeks.','F'],
   ['He only photographed things smaller than one millimetre.','F']
  ])
 ],src([144,189],[38],96),'Source PPT slide 38 confirms T, T, T, F, F.'));
 slides.push(screen('12B · Grammar','Words with some-, any-, every-, no-','Look at the patterns. Complete the rule.','grammar-presentation','two-column',[
  grammar('Use -body/-one for people, -where for places and -thing for objects.','some- / any- / every- / no- + body, one, where, thing',[
   'Everyone can find nature nearby.',
   'I did not see anything unusual.',
   'There is somewhere quiet in the park.'
  ]),
  question('Which ending refers to a place?',['-thing','-one','-where'],2)
 ],src([145],[39])));
 slides.push(screen('12B · Practice','Choose the right word','Complete the sentences. Explain your choices.','controlled-practice','question-options',[
  fill('Choose a suitable indefinite pronoun.',[
   ['___ enjoys an interesting nature photo.','Everyone'],
   ['I cannot find ___ to photograph.','anything'],
   ['We went ___ peaceful at the weekend.','somewhere']
  ])
 ],src([145],[40,41,42]),'New practice items; answers are for pilot validation.'));
 slides.push(screen('12B · Speaking','Ask and answer','Complete the questions. Ask a partner.','speaking-task','speaking-prompt',[
  discuss('Have you done anything interesting outdoors recently? Have you been anywhere new?')
 ],src([145],[43])));
 slides.push(screen('Review','What can you do now?','Work with a partner. Give one example for each goal.','consolidation','three-cards',[
  txt('Describe one extreme weather event.','heading'),
  txt('Make a second conditional sentence.','heading'),
  txt('Use an indefinite pronoun in context.','heading')
 ],src([143,145],[44])));
 slides.push(screen('Closing','Exit ticket','Write one useful sentence and one question.','consolidation','standard',[
  activity('writing','What did you learn? What would you like to practise next?',{rubric:'Provide a sentence and one question.'})
 ],src([143,145],[44,45])));
 const lesson=createLesson({
  id:LIFE_U12_FIXTURE_ID,courseLabel:'LIFE 2nd Edition · A2–B1',
  lessonNumber:'U12 · Opener + 12A + 12B',title:'Nature',
  status:'draft',sourceCollection:'life-2e-a2b1',
  fixtureVersion:'2026-11-10.1',screens:slides
 });
 return lesson;
}
export function lifeU12FixtureCoverage(lesson){
 const covered=new Set(lesson.screens.map(s=>s.stage.split(' · ')[0]));
 const missingMedia=lesson.screens.flatMap((s,i)=>s.blocks.filter(b=>['audio','image'].includes(b.type)&&!b.content?.assetId&&!b.content?.src).map(b=>({
  slide:i+1,type:b.type,track:b.sourceTrack||null
 })));
 const withoutSource=lesson.screens.filter(s=>!s.sourceRefs?.bookPages?.length);
 return {slides:lesson.screens.length,sections:[...covered],missingMedia,withoutSource:withoutSource.length,
  sourcePages:[141,142,143,144,145],audioTracks:[93,95,96]};
}
