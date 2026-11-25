// S2 local adapter. Does not create drafts, publish, or mutate S1.
const labels={'objective-pet-b1':'Objective PET B1','objective-first-b2':'Objective First B2',life:'LIFE A2–B1','advanced-skills':'Advanced Skills','esp-medicine':'ESP Medicine','esp-pharmacy':'ESP Pharmaceutical'};
const scopes={'objective-pet-b1':['pet','objective'],'objective-first-b2':['b2','objective'],life:['life'],'advanced-skills':[],'esp-medicine':[],'esp-pharmacy':[]};
export function createWorkspaceIndex(config){
 if(config?.schema!=='eleap-course-intelligence-v2')throw Error('Unsupported course configuration');
 const map=new Map(config.workspaceMap.map(w=>[w.id,w]));
 if(config.workspaceMap.length!==6||map.size!==6||Object.keys(labels).some(id=>!map.has(id)))throw Error('Invalid workspace registry');
 const courses=new Map(config.courses.map(c=>[c.id,c]));const keys=new Set();
 if(config.courses.length!==3||courses.size!==3)throw Error("Invalid course map");
 for(const [id,units,count] of [["objective-pet-b1",30,2],["objective-first-b2",24,2],["life",12,3]]){const c=courses.get(id);if(c?.units.length!==units||new Set(c.units.map(u=>u.unit)).size!==units||c.units.some(u=>u.lessons.length!==count))throw Error("Invalid unit structure");if(id==="life"&&c.units.some(u=>u.lessons.map(l=>l.sections).join(",")!=="ab,cd,ef"))throw Error("Invalid LIFE sections");}
 for(const c of courses.values())for(const u of c.units)for(const l of u.lessons){if(l.key!==`${c.id}:${l.id}`||keys.has(l.key))throw Error('Invalid lesson identity');keys.add(l.key);}
 return Object.freeze({
 list:()=>Object.keys(labels).map(id=>({...map.get(id),label:labels[id],units:courses.get(id)?.units.length??0,lessons:courses.get(id)?.units.reduce((n,u)=>n+u.lessons.length,0)??0})),
 select(id){if(!map.has(id))throw Error('Unknown workspace');const c=courses.get(id);const reserved=map.get(id).state==='reserved';return {id,label:labels[id],state:map.get(id).state,units:structuredClone(c?.units??[]),skills:id==='advanced-skills'?['adv-listening','adv-speaking','adv-reading','adv-writing']:[],library:reserved?[]:structuredClone(config.taskMatrix.filter(t=>t.scope.split(',').some(s=>s==='all'||scopes[id].includes(s)))),publicationAllowed:false};},
 lesson(id,key){if(!map.has(id)||!key.startsWith(id+':'))throw Error('Cross-course lesson selection blocked');const c=courses.get(id);for(const u of c?.units??[]){const l=u.lessons.find(l=>l.key===key);if(l)return {...structuredClone(l),unit:u.unit,unitTitle:u.title,source:c.source,publicationAllowed:false};}throw Error('Unknown lesson');},
 });
}
