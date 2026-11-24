/* E-LEAP Course Profile Registry · Single Studio, stable source-of-truth IDs.
 * Profiles are guidance/configuration, not substitute textbook source or an AI generator.
 * Adding a course does NOT create content or permit publication.
 */
const freezeProfile=profile=>Object.freeze({...profile,preferredMethods:Object.freeze(profile.preferredMethods||[])});
export const COURSE_PROFILES=Object.freeze([
 freezeProfile({id:'objective-pet-b1',label:'Objective PET B1',kind:'coursebook',availability:'active',shellId:null,shellStatus:'unmapped',cefr:'B1',preferredMethods:['master-guided-reading-four-step','jigsaw-reading','think-pair-share']}),
 freezeProfile({id:'objective-first-b2',label:'Objective First B2',kind:'coursebook',availability:'active',shellId:'objective-first-b2',shellStatus:'published',cefr:'B2',preferredMethods:['guided-grammar','process-writing','reciprocal-reading']}),
 freezeProfile({id:'life',label:'LIFE',kind:'coursebook',availability:'active',shellId:'life-intermediate',shellStatus:'planned',cefr:null,preferredMethods:['think-pair-share','process-writing','reciprocal-reading']}),
 freezeProfile({id:'advanced-skills',label:'Advanced Skills',kind:'skills',availability:'active',shellId:'advanced-skills',shellStatus:'published',cefr:null,preferredMethods:[]}),
 freezeProfile({id:'esp-medicine',label:'English for Medical Purposes',kind:'coursebook',availability:'planned',shellId:'medical-english',cefr:null,preferredMethods:[]}),
 freezeProfile({id:'esp-pharmacy',label:'English for Pharmaceutical Purposes',kind:'coursebook',availability:'planned',shellId:'english-for-pharmacy',cefr:null,preferredMethods:[]})
]);
/* Real published branches of the existing Advanced Skills shell. */
export const ADVANCED_SKILL_PATHS=Object.freeze([
 Object.freeze({id:'adv-listening',label:'Listening'}),
 Object.freeze({id:'adv-speaking',label:'Speaking'}),
 Object.freeze({id:'adv-reading',label:'Reading'}),
 Object.freeze({id:'adv-writing',label:'Writing'})
]);
const exactAliases=Object.freeze({'Life Intermediate':'life','Objective PET B1':'objective-pet-b1','Objective First B2':'objective-first-b2','LIFE':'life','Advanced Skills':'advanced-skills'});
export const activeCourseProfiles=()=>COURSE_PROFILES.filter(x=>x.availability==='active');
export const plannedCourseProfiles=()=>COURSE_PROFILES.filter(x=>x.availability==='planned');
export const courseProfileById=id=>COURSE_PROFILES.find(x=>x.id===id)||null;
export const courseIsSelectable=id=>courseProfileById(id)?.availability==='active';
export function resolveCourseProfile(lesson){
 if(!lesson||typeof lesson!=='object')return null;
 if(lesson.courseProfileId)return courseProfileById(lesson.courseProfileId);
 return courseProfileById(exactAliases[String(lesson.courseLabel||'')]||'');
}
export function normaliseCourseIdentity(lesson){
 if(!lesson||typeof lesson!=='object')return lesson;
 const profile=resolveCourseProfile(lesson);
 if(!lesson.courseProfileId&&profile)lesson.courseProfileId=profile.id;
 return lesson; // preserve original title, content, and legacy courseLabel
}
export function createCourseDraft(profileId,makeLesson){
 const profile=courseProfileById(profileId);
 if(!profile||profile.availability!=='active')throw Error('This course library is not available for authoring.');
 if(typeof makeLesson!=='function')throw Error('Lesson factory is required.');
 const result=makeLesson({courseProfileId:profile.id,courseLabel:profile.label,courseLibraryShellId:profile.shellId,lessonNumber:'',title:'New Lesson',status:'draft'});
 // Legacy default cover has B2-specific metadata; remove it from the new course draft.
 for(const screen of result.screens||[]){
  if(screen.stage!=='Cover')continue;
  for(const block of screen.blocks||[]){
   if(block.type!=='text'||!block.content)continue;
   if(block.content.role==='eyebrow')block.content.text='New lesson';
   if(block.content.role==='display')block.content.text='New Lesson';
  }
 }
 return result;
}
export function validateCourseIdentity(lesson){
 const issues=[];
 const profile=courseProfileById(lesson?.courseProfileId);
 if(!profile){issues.push('Lesson must have a recognized Course Profile ID before publication.');return issues;}
 if(profile.availability!=='active')issues.push('Planned course is not available for publication.');
 if(lesson.courseLabel!==profile.label)issues.push('Course label and ID disagree; do not silently relabel an existing lesson.');
 if(profile.kind==='skills'&&!ADVANCED_SKILL_PATHS.some(s=>s.id===lesson?.advancedSkillId))
  issues.push('Choose the existing Advanced Skills branch: Listening, Speaking, Reading or Writing.');
 if(profile.kind==='skills'&&lesson?.advancedSkillId&&lesson?.courseLibraryShellId!==lesson.advancedSkillId)
  issues.push('Advanced Skills content destination must match its selected branch.');
 if(profile.kind!=='skills'&&lesson?.advancedSkillId)
  issues.push('Advanced Skills branch cannot be attached to a textbook lesson.');
 if(profile.shellId===null)issues.push('Course has no verified Platform shell mapping; publishing must remain blocked.');
 if(profile.shellStatus!=='published')issues.push('Course Library destination is not published or is not yet verified.');
 if(profile.shellId&&profile.kind==='coursebook'&&lesson.courseLibraryShellId!==profile.shellId)issues.push('Course Library shell ID and lesson destination disagree.');
 return issues;
}
