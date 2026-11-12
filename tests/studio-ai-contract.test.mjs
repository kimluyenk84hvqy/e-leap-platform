import test from 'node:test';
import assert from 'node:assert/strict';
import {validateAiProposal,draftProposalOnly} from '../assets/js/authoring/studio-ai-contract.js';
const draft={id:'lesson-one',version:2,status:'draft',screens:[{id:'screen-one',title:'Original'}]};
function proposal(){return {schemaVersion:'studio-ai-proposal-v1',mode:'assistant',scope:{lessonId:'lesson-one',screenId:'screen-one',stepId:null},baseDraftVersion:2,suggestions:[{id:'a1',kind:'suggest-instruction',targetId:'screen-one',instruction:'Ask a partner for two reasons.',expectedOutput:'Two reasons',sourceRefs:[{assetId:'book-one',locator:'p.34 task 2'}],reviewStatus:'requires-teacher-approval'}]}}
test('accepts review-only, scoped valid draft without mutation',()=>{
 const input=proposal(),original=JSON.stringify(draft);const r=draftProposalOnly(input,draft,{allowedSourceIds:['book-one']});
 assert.equal(r.ok,true);assert.equal(r.reviewRequired,true);assert.equal(JSON.stringify(draft),original);
});
test('rejects unrecognized source references',()=>{
 assert.equal(validateAiProposal(proposal(),{allowedSourceIds:[]}).ok,false);
});
test('rejects direct executable command kinds',()=>{
 const p=proposal();p.suggestions[0].kind='publish-or-execute';assert.equal(validateAiProposal(p,{allowedSourceIds:['book-one']}).ok,false);
});
test('rejects missing teacher approval',()=>{
 const p=proposal();p.suggestions[0].reviewStatus='auto-approved';assert.equal(validateAiProposal(p,{allowedSourceIds:['book-one']}).ok,false);
});
test('rejects stale/published drafts',()=>{
 assert.equal(draftProposalOnly(proposal(),{...draft,version:3},{allowedSourceIds:['book-one']}).ok,false);
 assert.equal(draftProposalOnly(proposal(),{...draft,status:'published'},{allowedSourceIds:['book-one']}).ok,false);
});
test('assistant must target a particular screen',()=>{
 const p=proposal();p.scope.screenId=null;assert.equal(draftProposalOnly(p,draft,{allowedSourceIds:['book-one']}).ok,false);
});
