import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const html=await readFile(new URL('../reading-jigsaw.html',import.meta.url),'utf8');

test('U6 learner has exactly six interactive Jigsaw stages, no textbook excerpts embedded in public HTML',()=>{
 const stages=[...html.matchAll(/class="section step-panel" data-jigsaw-stage="([^"]+)"/g)].map(x=>x[1]);
 assert.deepEqual(stages,['predict','assigned','expert','home','complete','evidence']);
 assert.match(html,/data-note="individual1"/);
 assert.match(html,/data-note="individual2"/);
 assert.match(html,/data-note="expertEvidence"/);
 assert.match(html,/data-note="expertWhy"/);
 assert.match(html,/data-note="partner1"/);
 assert.match(html,/data-note="partner2"/);
 assert.match(html,/id="groupAnswers"/);
 assert.match(html,/id="answerForm"/);
 assert.match(html,/data\.passage/);
 assert.doesNotMatch(html,/My father walked to the school with me/);
 assert.doesNotMatch(html,/the playground was full of big boys/);
 assert.doesNotMatch(html,/the art rooms, the computer rooms/);
});

test('Book Reading tasks require whole-group answers and one-to-one picture matching before submitting',()=>{
 assert.match(html,/groupAnswers\.some\(row=>!row\.photoName\|\|!row\.yearEstimate\)/);
 assert.match(html,/new Set\(groupAnswers\.map\(row=>row\.photoName\)\)\.size!==3/);
 assert.match(html,/own\.photoName!==\$\('photo'\)\.value/);
 assert.match(html,/own\.yearEstimate!==\$\('year'\)\.value\.trim\(\)/);
 assert.match(html,/yearEstimate:\$\('year'\)\.value\.trim\(\),groupAnswers/);
 assert.match(html,/new ConfirmedAssignmentSubmission\(\)\.submit/);
});

test('Role-limited passage is obtained from authenticated server; notes are private to Student and assignment',()=>{
 assert.match(html,/api\('\/api\/auth\/me'\)/);
 assert.match(html,/reading-jigsaw\?assignmentId=/);
 assert.match(html,/data\.account/);
 assert.match(html,/const stateKey='eleap-u6-group-notes:'\+assignmentId\+':'\+session\.user\.user_id/);
 assert.match(html,/sessionStorage\.setItem\(stateKey/);
 assert.match(html,/sessionStorage\.removeItem\(groupKey\)/);
 assert.doesNotMatch(html,/accounts\.A|accounts\.B|accounts\.C/);
});

test('Submitted book work requires individual clues, expert discussion and both home-group partners',()=>{
 for(const tag of ['individual1','individual2','expertEvidence','expertWhy','partner1','partner2']){
  assert.match(html,new RegExp("\\['"+tag+"','(?:assigned|expert|home)'"));
 }
 assert.match(html,/data-note="shared"/);
 assert.match(html,/showStage\('home'\);return/);
});
