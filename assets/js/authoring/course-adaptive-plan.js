/* Course-aware recommendations, NOT simulated AI responses or a verified lesson. */
import {courseProfileById} from './course-profile-registry.js';
import {METHOD_COMBOS} from './method-combo-catalog.js';
const byFocus={
 Reading:['master-guided-reading-four-step','claim-evidence-reading','reciprocal-reading'],
 Listening:['staged-listening','tbl-listening'],
 Speaking:['think-pair-share','speaking-roleplay'],
 Writing:['process-writing','writing-genre'],
 Grammar:['guided-grammar','grammar-ppp'],
 Vocabulary:['contextual-vocabulary','vocabulary-word-map']
};
export function suggestCoursePlan({courseProfileId,focus,paragraphCount=0,sourceVerified=false}={}){
 const profile=courseProfileById(courseProfileId);
 if(!profile||profile.availability!=='active')return {ok:false,issues:['Select an active course profile.'],suggestions:[]};
 if(!byFocus[focus])return {ok:false,issues:['Choose an instructional focus.'],suggestions:[]};
 const candidates=focus==='Reading'&&paragraphCount===3?['master-u6-reading-six-step',...byFocus[focus]]:byFocus[focus];
 const suggestions=candidates.filter(id=>Boolean(METHOD_COMBOS[id])).slice(0,4);
 return {ok:true,profileId:profile.id,focus,
  suggestions:suggestions.map(id=>({id,label:METHOD_COMBOS[id].label,requiresTextbookReview:true,canPublish:false})),
  stages:['Academic & Pedagogy','Visual & Interaction','Critical Review & QA'].map(name=>({name,status:'awaiting AI provider and source verification'})),
  sourceVerified:sourceVerified===true,canPublish:false,
  issues:['Course-aware suggestions are not an authored lesson. Verify the complete original source, media and exercises before approval.']};
}