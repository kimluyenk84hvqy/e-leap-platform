import assert from 'node:assert/strict';
import {METHOD_COMBOS,checkMethodSource,mapMethodToStates} from '../assets/js/authoring/method-combo-catalog.js';
import {createMethodTemplateScreen,methodTemplateIssues,renderMethodTemplateCanvas} from '../assets/js/authoring/method-template-builder.js';
import {auditMasterLibraryCompatibility,MASTER_TEMPLATE_BINDINGS} from '../assets/js/authoring/master-library-preflight.js';
const ids=['master-u6-reading-six-step','master-guided-reading-four-step'];
const labels=[
 ['Read','Find Clues','Share','Match','Justify','Submit'],
 ['Read for Gist','Scan','Evidence & Why','Submit']
];
for(const [i,id] of ids.entries()){
 const method=METHOD_COMBOS[id];
 assert.ok(method,'Missing '+id);
 assert.deepEqual(method.steps.map(s=>s.label),labels[i]);
 assert.equal(new Set(method.steps.map(s=>s.id)).size,method.steps.length);
 const draft=createMethodTemplateScreen(id);
 assert.ok(draft,'Studio builder failed: '+id);
 assert.equal(draft.methodDraft.publishStatus,'template-only');
 assert.equal(draft.methodDraft.sourceMapped,false);
 assert.ok(methodTemplateIssues(draft).some(s=>s.includes('Publish is blocked')));
 assert.match(renderMethodTemplateCanvas(draft,'student'),/not yet available/i);
 assert.match(renderMethodTemplateCanvas(draft,'teacher'),/NOT PUBLISHED/);
 assert.ok(checkMethodSource(id,{}).length>0);
}
const q={text:'What detail supports this?',answers:['This is an open response.'],evidenceQuote:'the art room',why:'The source explicitly mentions the art room.',sourceRef:'test-paragraph'};
const shared={sourceVerified:true,sourceRef:'local-review-fixture',passage:'The art room was large.',questions:[q]};
const normal=mapMethodToStates(ids[1],shared);
assert.equal(normal.ok,true,'Verified single-text input should pass method mapper');
assert.equal(normal.status,'needs-teacher-review');
assert.ok(normal.states.every(s=>s.answerPolicy==='hidden'));
assert.ok(normal.states.every(s=>s.requiresServerIssuedRoleGrants===true));
assert.equal(mapMethodToStates(ids[1],{...shared,sourceVerified:false}).ok,false);
const sections=['A','B','C'].map(label=>({label,text:'Source paragraph '+label}));
const u6={...shared,sections,photoAssetsVerified:true,photoAssetIds:['photo1','photo2','photo3'],roleSelectionPersisted:true};
assert.equal(mapMethodToStates(ids[0],u6).ok,true,'Verified 3-role U6 review input should pass');
for(const invalid of [
 {...u6,sections:[sections[0],sections[1],sections[1]]},
 {...u6,photoAssetIds:['photo1','photo2','photo2']},
 {...u6,roleSelectionPersisted:false},
 {...u6,sourceVerified:false},
 {...u6,photoAssetsVerified:false}
])assert.equal(mapMethodToStates(ids[0],invalid).ok,false,'Invalid U6 review should be blocked');
const master={visualTemplates:Object.keys(MASTER_TEMPLATE_BINDINGS).map(id=>({id})),activityRegistry:[{id:'reading'}],teachingCombos:[{id:'jigsaw'}]};
const status=auditMasterLibraryCompatibility(master);
assert.equal(status.ok,true);
assert.equal(status.publicationAllowed,false);
assert.ok(status.unimplemented.includes('reading-jigsaw'));
assert.equal(auditMasterLibraryCompatibility(master,{requirePublication:true}).ok,false);
console.log('Studio Master Reading: preview draft, verification and publication gates passed.');
