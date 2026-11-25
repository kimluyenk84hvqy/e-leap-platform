import test from 'node:test';import assert from 'node:assert/strict';
import {nativeSourceReview} from '../assets/js/authoring/native-blueprint.js';
test('legacy package without review remains unverified',()=>assert.equal(nativeSourceReview({}),null));
test('source limitations retained without granting review status',()=>{const notes=['Adapted reading; verify exact wording.','Original video unavailable.'];assert.deepEqual(nativeSourceReview({review:{source:'SB pp. 28–33',notes,status:'approved',teacherApproved:true}}),{source:'SB pp. 28–33',notes,status:'teacher-review-required'});});
test('malformed or oversized notes fail before upload',()=>{for(const review of [{notes:['']},{notes:['x'.repeat(2001)]},{notes:[{}]},{notes:Array(41).fill('note')},{source:{}}])assert.throws(()=>nativeSourceReview({review}),/Invalid package review/);});
