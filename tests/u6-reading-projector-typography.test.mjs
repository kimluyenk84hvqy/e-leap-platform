import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const source=await fs.readFile(new URL('../reading-jigsaw.html',import.meta.url),'utf8');
const css=source.match(/<style>([\s\S]*?)<\/style>/)?.[1]||'';
const rule=selector=>css.slice(css.indexOf(selector+'{')).match(/^.*?\{([^}]*)\}/s)?.[1]||'';
test('U6 projected Reading typography uses bold large visible headings, body, source and actions',()=>{
 for(const [selector,min] of [['body',23],['h1',40],['h2',30],['.passage',25],['.step-button',21],['.eyebrow',21],['.source-photo figcaption',22],['.evidence-panel .passage',25],['button',22]]){
  const block=rule(selector);
  assert.ok(block,'CSS block missing: '+selector);
  assert.match(block,/font-size\s*:/,'Font size missing: '+selector);
  const values=[...block.matchAll(/font-size:\s*(?:clamp\()?\s*(\d+)px/g)].map(m=>Number(m[1]));
  assert.ok(values.length&&values[0]>=min,selector+' minimum font size is below '+min);
 }
 for(const selector of ['body','h1','h2','.passage','.step-button','button','.field']){
  const block=rule(selector);
  assert.match(block,/font-weight:\s*(?:650|700|750|800|850|900)/,'Unclear weight for '+selector);
 }
});
test('U6 image layout uses source-linked authenticated route, three visible originals and clear loading failure',()=>{
 assert.match(source,/id="originalPhotos"/);
 assert.match(source,/source-photos\{display:grid;grid-template-columns:repeat\(3/);
 assert.match(source,/reading-jigsaw-photo\?assignmentId=/);
 assert.match(source,/picture\.addEventListener\('error'/);
 assert.match(source,/Original photo is unavailable/);
 assert.match(source,/figure\.append\(picture,caption\)/);
});
test('U6 keeps six role-based Jigsaw stages, group completion, evidence highlight and locked submit receipt',()=>{
 for(const stage of ['predict','assigned','expert','home','complete','evidence'])
  assert.match(source,new RegExp('data-jigsaw-stage="'+stage+'"'));
 assert.match(source,/new ConfirmedAssignmentSubmission\(\)\.submit/);
 assert.match(source,/highlight\.scrollIntoView/);
 assert.match(source,/data\.passage/);
 assert.doesNotMatch(source,/blob\.vercel-storage\.com/);
});
