/* E-LEAP reusable lesson arc, independent of textbook/lesson identity.
 * Stage metadata is for Studio navigation; learner slides show only goals/tasks.
 */
export const LEARNING_ARC=[
 {id:'connect',label:'Connect',purpose:'Spark curiosity and link to experience'},
 {id:'discover',label:'Discover',purpose:'Notice new language and ideas'},
 {id:'collaborate',label:'Collaborate',purpose:'Read, discuss, teach one another'},
 {id:'apply',label:'Apply',purpose:'Practise and use language independently'},
 {id:'reflect',label:'Reflect',purpose:'Recall and transfer learning'}
];
const stageId=s=>{
 const t=String(s.stage||'').toLowerCase(),title=String(s.title||'').toLowerCase();
 if(/cover|lead-in|opener|warm.up/.test(t))return 'connect';
 if(/reading/.test(t)&&/jigsaw|group|share/.test(title))return 'collaborate';
 if(/practice|speaking|writing|pronunciation/.test(t))return 'apply';
 if(/review|closing|homework/.test(t))return 'reflect';
 if(/grammar|vocabulary|reading|listening/.test(t))return 'discover';
 return 'apply';
};
export const phaseForScreen=s=>s.learningPhase&&LEARNING_ARC.some(x=>x.id===s.learningPhase)?s.learningPhase:stageId(s);
export function lessonArcSummary(lesson){
 const phases=LEARNING_ARC.map(p=>({...p,count:(lesson.screens||[]).filter(s=>phaseForScreen(s)===p.id).length}));
 const missing=phases.filter(p=>p.count===0);
 const sequence=(lesson.screens||[]).map(phaseForScreen);
 return {phases,missing,sequence};
}
