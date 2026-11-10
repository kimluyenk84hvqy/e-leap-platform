import assert from 'node:assert/strict';
import {applyMappedContent,validateMapping,CONTENT_SLOT_SCHEMAS} from '../assets/js/authoring/content-mapper.js';
import {VISUAL_VARIANTS,setVisualVariant} from '../assets/js/authoring/visual-variants.js';
import {validateVisualContracts} from '../assets/js/authoring/visual-template-contracts.js';

assert.equal(Object.keys(CONTENT_SLOT_SCHEMAS).length,8);
assert.ok(Object.keys(VISUAL_VARIANTS).length>=8);
const screen={
 id:'test',templateId:'reading-task',title:'Reading',instruction:'Read and discuss.',
 teacherNotes:'Teacher-only: divide the class into four groups.',
 blocks:[
  {id:'a',type:'text',content:{text:'Original reading'}},
  {id:'b',type:'discussion',activity:{prompt:'Original prompt'}}
 ]
};
const mapped=applyMappedContent(screen,{
 title:'Weather and nature',
 instruction:'Read the passage and find evidence.',
 passage:'A scientist studies extreme weather.',
 prompt:'What evidence supports your answer?'
});
assert.equal(mapped.ok,true);
assert.equal(mapped.screen.blocks[0].content.text,'A scientist studies extreme weather.');
assert.equal(mapped.screen.teacherNotes,screen.teacherNotes);
assert.equal(screen.blocks[0].content.text,'Original reading','Original screen must remain immutable');
assert.ok(validateMapping('lead-in',{imageSrc:'life_page_141.jpg'}).length);
assert.ok(validateMapping('reading-task',{passage:'Insert the reading passage here.'}).length);
assert.ok(validateMapping('vocabulary-presentation',{
 items:Array.from({length:9},(_,i)=>'word'+i+' | meaning').join('\n')
}).length);
const design=setVisualVariant(mapped.screen,'evidence-board');
assert.equal(design.ok,true);
assert.equal(design.screen.layout,'two-column');
assert.ok(validateVisualContracts({screens:[{
 templateId:'reading-task',title:'Reading',instruction:'',
 blocks:[{type:'image',content:{src:'book_page_32.png'}}]
}]}).some(i=>i[0]==='error'));
console.log('E-LEAP Studio contract smoke tests passed.');
