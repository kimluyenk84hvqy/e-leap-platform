/* E-LEAP Activity Registry v1.1 — single source of truth for authoring + runtime behavior. */
const O={objective:true,controls:['check','reset','submit','score'],graded:true};
const P={objective:false,controls:['reset','submit','review'],graded:false};
export const E_LEAP_ACTIVITY_TYPES={
  mcq:{label:'Multiple Choice',category:'Practice',...O},'multi-select':{label:'Multiple Response',category:'Practice',...O},'true-false':{label:'True / False',category:'Practice',...O},fill:{label:'Fill in the Blank',category:'Practice',...O},matching:{label:'Matching',category:'Practice',...O},ordering:{label:'Reorder',category:'Practice',...O},categorising:{label:'Categorize',category:'Practice',...O},
  listening:{label:'Listen & Answer',category:'Language Skills',...O,media:'audio'},'video-question':{label:'Interactive Video',category:'Language Skills',...O,media:'video'},
  'speaking-record':{label:'Speaking / Record',category:'Language Skills',...P},writing:{label:'Writing Response',category:'Language Skills',...P},discussion:{label:'Open Response',category:'Language Skills',...P},poll:{label:'Poll',category:'Interaction',objective:false,controls:['reset','submit'],graded:false},
  'click-reveal':{label:'Reveal',category:'Interaction',objective:false,controls:['reset'],graded:false},flashcards:{label:'Flashcards',category:'Interaction',objective:false,controls:['reset'],graded:false},'flip-match':{label:'Flip & Match',category:'Interaction',objective:false,controls:['reset'],graded:false}
};
export const E_LEAP_AUTHORING_LIBRARY={
 Content:[['text','T','Text','Heading, paragraph, note'],['image','▧','Image','Image with fit and alt text'],['audio','♪','Audio','Listening or pronunciation audio'],['video','▶','Video','Lesson or model video'],['vocabulary','Aa','Vocabulary','Word + meaning/example'],['grammar-note','§','Grammar note','Rule, form and examples']],
 Practice:[['mcq','◉','Multiple Choice','One correct answer'],['multi-select','☑','Multiple Response','More than one correct answer'],['true-false','T/F','True / False','Fast objective check'],['fill','__','Fill in the Blank','Typed answers'],['matching','⇄','Matching','Pair two sets'],['ordering','≡','Reorder','Put items in order'],['categorising','▦','Categorize','Sort into groups']],
 'Language Skills':[['listening','♫','Listen & Answer','Audio + objective response'],['video-question','▻?','Interactive Video','Video + question'],['speaking-record','●','Speaking / Record','Record and submit'],['writing','✎','Writing Response','Longer written response'],['discussion','☵','Open Response','Short open response']],
 Interaction:[['click-reveal','◫','Reveal','Click to reveal answer'],['flashcards','▤','Flashcards','Front / back cards'],['poll','◌','Poll','Ungraded class response']]
};
export function getActivityDefinition(type){return E_LEAP_ACTIVITY_TYPES[type]||null;}
export function isSupportedActivity(type){return !!getActivityDefinition(type);}
export function isObjectiveActivity(type){return !!getActivityDefinition(type)?.objective;}
export function activityControls(type){return getActivityDefinition(type)?.controls||[];}
