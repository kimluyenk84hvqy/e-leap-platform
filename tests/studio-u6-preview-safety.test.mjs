import test from 'node:test';
import assert from 'node:assert/strict';
import {escapeActivityHtml,isNativeReviewOnly,nativeControlCapabilities} from '../assets/js/native-activity.js';
import {ELeapAuthoringSaveService} from '../assets/js/authoring-save-service.js';

test('shared native activity escapes textbook-derived HTML in labels and prompt',()=>{
 const value='<img src=x onerror=alert(1)>&"\'';
 const escaped=escapeActivityHtml(value);
 assert.equal(escaped,'&lt;img src=x onerror=alert(1)&gt;&amp;&quot;&#39;');
 assert.equal(escaped.includes('<img'),false);
});
test('restricted teacher review refuses Check, Reveal, Score and Submit independent of simulated role',()=>{
 for(const role of ['teacher','admin','student','guest','presentation']){
  const caps=nativeControlCapabilities({role,activity:{answerKey:['A']},context:{role,reviewOnly:true}});
  assert.equal(caps.reset,true);
  assert.equal(caps.reveal,false);
  assert.equal(caps.score,false);
  assert.equal(caps.check,false);
  assert.equal(caps.submit,false);
 }
 assert.equal(isNativeReviewOnly({mode:'review'}),true);
 assert.equal(nativeControlCapabilities({role:'student',activity:{answerKey:['A']}}).submit,true);
});
test('restricted source drafts never call network on Save or Publish',async()=>{
 const previousStorage=globalThis.localStorage,previousFetch=globalThis.fetch;
 const map=new Map();let requests=0;
 globalThis.localStorage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};
 globalThis.fetch=async()=>{requests++;throw Error('network must not be used');};
 try{
  const service=new ELeapAuthoringSaveService();
  const lesson={id:'u6-draft',version:1,status:'draft',screens:[{sourceReviewDraft:{status:'unverified'}}]};
  const save=await service.saveDraft(lesson);
  assert.equal(save.mode,'local');assert.equal(save.restricted,true);
  assert.equal(requests,0);
  await assert.rejects(()=>service.publish(lesson),/cannot be published/);
  assert.equal(requests,0);
 }finally{globalThis.localStorage=previousStorage;globalThis.fetch=previousFetch;}
});
