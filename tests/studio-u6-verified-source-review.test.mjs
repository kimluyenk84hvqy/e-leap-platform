import assert from 'node:assert/strict';
import {validateU6TeacherSource,fetchU6TeacherSource,renderU6TeacherReview} from '../assets/js/authoring/u6-source-review.js';
import {createMethodTemplateScreen,renderMethodTemplateCanvas,methodTemplateIssues} from '../assets/js/authoring/method-template-builder.js';
const uuid=['d1cccd64-82f6-4dee-bb3b-f6d8dd8f06bf','f14e9fce-2cf0-4465-8403-21a621415373','ed74b0b8-27e9-4f56-80e8-cb961b7a4fd8'];
const source={accounts:{A:'School day A. I went into the big library for the first lesson.',B:'School day B. I was late for the first lesson today.',C:'School day C. We saw the art room and the school garden.'},photo_assets:uuid.map((assetId,i)=>({assetId,alt:'Photo '+i})),photo_labels:['Person one','Person two','Person three'],original_questions:['Which photograph matches each paragraph?','Which person and approximate year belongs to each paragraph?'],source_page:41,source_text_verified:true,photo_assets_verified:true,__reviewAssignmentId:'d763be6e-3a27-4d1a-95e0-658060610e27'};
const payload={ok:true,reviewOnly:true,material:source};
assert.equal(validateU6TeacherSource(payload).ok,true);
for(const invalid of [
 {...payload,reviewOnly:false},
 {...payload,material:{...source,photo_assets_verified:false}},
 {...payload,material:{...source,photo_assets:[source.photo_assets[0],source.photo_assets[0],source.photo_assets[1]]}},
 {...payload,material:{...source,accounts:{A:'Short',B:'Short',C:'Short'}}}
])assert.equal(validateU6TeacherSource(invalid).ok,false);
const screen=createMethodTemplateScreen('master-u6-reading-six-step');
assert.ok(screen);
assert.ok(methodTemplateIssues(screen).length>0);
assert.match(renderMethodTemplateCanvas(screen,'student',source),/not yet available/i);
assert.doesNotMatch(renderMethodTemplateCanvas(screen,'guest',source),/School day A/);
assert.match(renderMethodTemplateCanvas(screen,'teacher',null),/Load verified source/);
assert.doesNotMatch(renderMethodTemplateCanvas(screen,'teacher',null),/School day A/);
const read=renderMethodTemplateCanvas(screen,'teacher',source);
assert.match(read,/School day A/);
assert.match(read,/Paragraph B/);
assert.doesNotMatch(read,/School day B/);
screen.methodDraft.activeStep='match';
const match=renderMethodTemplateCanvas(screen,'teacher',source);
assert.match(match,/reading-jigsaw-photo-review/);
assert.match(match,/Person one/);
assert.match(match,/Which photograph matches/);
assert.doesNotMatch(match,/School day A/);
screen.methodDraft.activeStep='submit';
assert.match(renderMethodTemplateCanvas(screen,'teacher',source),/Submit remains locked/);
const malicious={...source,accounts:{...source.accounts,A:'<script>alert(1)</script> this is a long verified placeholder'}};
screen.methodDraft.activeStep='read';
const html=renderU6TeacherReview(screen,malicious);
assert.doesNotMatch(html,/<script>/);
assert.match(html,/&lt;script&gt;/);
let requested='';
const response=await fetchU6TeacherSource('d763be6e-3a27-4d1a-95e0-658060610e27',{fetcher:async(url,opts)=>{requested=url;assert.equal(opts.credentials,'same-origin');return {ok:true,json:async()=>payload};}});
assert.equal(response.accounts.A,source.accounts.A);
assert.match(requested,/assignmentId=/);
await assert.rejects(fetchU6TeacherSource('bad-id',{fetcher:async()=>{throw Error('should not call')}}));
console.log('U6 verified Teacher review: source checks, auth fetch policy, role isolation, media links and HTML escaping PASS.');
