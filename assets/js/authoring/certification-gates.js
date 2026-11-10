/* E-LEAP certified template acceptance checklist.
 * Static checks are separate from human projection acceptance and runtime E2E.
 * Never label a template 'approved' solely because source strings are present.
 */
import {validateCertifiedTemplate} from './certified-templates.js';
export function evaluateCertifiedGates(screen){
 const data=screen?.certifiedTemplate;
 if(!data)return [];
 const v=data.values||{};
 const issues=validateCertifiedTemplate(data);
 const mediaRequired=['cover','opener'].includes(data.family);
 const mediaOK=!mediaRequired||Boolean(data.mediaCheck?.loaded===true&&data.mediaCheck?.src===v.imageSrc);
 const sourceOK=!data.sourceReview?.required||(data.sourceReview?.approved===true&&data.sourceReview.contentSignature===JSON.stringify(v));
 const contentIssues=issues.filter(s=>!/Image|image|source needs review/i.test(s));
 const rows=[
  {id:'slots',label:'Required slots and content rules',status:contentIssues.length?'fail':'pass',note:contentIssues.length?contentIssues.slice(0,3).join(' · '):'Automated checks passed'},
  {id:'source',label:'Source mapping and lesson fidelity',status:sourceOK?'pass':'fail',note:sourceOK?'Source review status recorded':'Review original activities and confirm mapping'},
  {id:'media',label:'Image load and accessibility',status:!mediaOK||issues.some(s=>/Image|image/i.test(s))?'fail':'pass',note:mediaOK?'Browser image load checked; confirm licensing separately':'Image has not passed browser load/alt checks'},
  {id:'projection',label:'16:9 readability and real-device overflow',status:'pending',note:'Visual inspection and projection screenshot required'},
  {id:'interaction',label:'Real lesson runtime and role controls',status:data.family==='opener'?'pending':'not-applicable',note:data.family==='opener'?'Check · Reset · Submit · Responses are not integrated yet':'No answer or submission workflow required'},
  {id:'publish',label:'Server publish and version rollback',status:'pending',note:'Must be tested on an authorized server workflow'}
 ];
 return rows;
}
export function certifiedGroupStatus(screen){
 const rows=evaluateCertifiedGates(screen);
 return rows.some(r=>r.status==='fail')?'BLOCKED':rows.some(r=>r.status==='pending')?'AWAITING QA':'PASSED';
}
