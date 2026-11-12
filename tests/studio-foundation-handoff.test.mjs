import test from 'node:test';
import assert from 'node:assert/strict';
import {sourceIntakeToStudioReviewScreen} from '../assets/js/authoring/source-studio-review-adapter.js';
import {SYNTHETIC_READING_FIXTURE} from '../assets/js/authoring/source-structure-intake.js';
test('handoff keeps source keys ungraded and marked as teacher review only',()=>{
 const out=sourceIntakeToStudioReviewScreen(SYNTHETIC_READING_FIXTURE);
 assert.equal(out.ok,true);assert.equal(out.screen.sourceReviewDraft.status,'unverified');
 assert.equal(out.publishable,false);
 assert.ok(out.screen.blocks.every(x=>x.type==='discussion'||x.type==='text'));
});
