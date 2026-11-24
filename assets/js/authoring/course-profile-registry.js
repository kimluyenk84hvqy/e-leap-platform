/* E-LEAP Course Profiles — names and availability only.
 * Stable IDs survive later textbook-title changes. Do not seed fake units,
 * lessons, media, activities or assessment records for planned publications.
 */
export const COURSE_PROFILES = Object.freeze([
 Object.freeze({id:'objective-pet-b1',label:'Objective PET B1',availability:'active'}),
 Object.freeze({id:'objective-first-b2',label:'Objective First B2',availability:'active'}),
 Object.freeze({id:'life',label:'LIFE',availability:'active'}),
 Object.freeze({id:'esp-medicine',label:'English for Medical Purposes',availability:'planned'}),
 Object.freeze({id:'esp-pharmacy',label:'English for Pharmaceutical Purposes',availability:'planned'})
]);
export function activeCourseProfiles(){return COURSE_PROFILES.filter(p=>p.availability==='active');}
export function plannedCourseProfiles(){return COURSE_PROFILES.filter(p=>p.availability==='planned');}
export function courseProfileById(id){return COURSE_PROFILES.find(p=>p.id===id)||null;}
export function courseIsSelectable(id){return courseProfileById(id)?.availability==='active';}
