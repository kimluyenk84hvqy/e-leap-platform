import assert from 'node:assert/strict';
import {
 CERTIFIED_TEMPLATES,makeCertifiedTemplate,changeCertifiedVariant,validateCertifiedTemplate,
 applyCertifiedTemplate,draftSourceFromScreen
} from '../assets/js/authoring/certified-templates.js';
import {renderCertifiedVisual,renderCertifiedEditor} from '../assets/js/authoring/certified-template-render.js';
assert.deepEqual(Object.keys(CERTIFIED_TEMPLATES),['cover','aims','opener']);
assert.deepEqual(Object.values(CERTIFIED_TEMPLATES).map(s=>s.variants.length),[3,2,3]);
for(const family of Object.keys(CERTIFIED_TEMPLATES)){
 const data=makeCertifiedTemplate(family);
 const original=JSON.stringify(data.values);
 for(const variant of CERTIFIED_TEMPLATES[family].variants){
  const switched=changeCertifiedVariant(data,variant.id);
  assert.equal(switched.variant,variant.id);
  assert.equal(JSON.stringify(switched.values),original,'Changing design must preserve source data');
  assert.ok(renderCertifiedVisual({certifiedTemplate:switched},'teacher').includes('certified-'+family));
 }
 assert.equal(changeCertifiedVariant(data,'does-not-exist'),null);
 assert.ok(validateCertifiedTemplate(data).length>0,'Empty draft must be blocked from Publish');
 const mapped=applyCertifiedTemplate({id:'s1',blocks:[{type:'text',content:{text:'Original source'}}]},data);
 assert.equal(mapped.ok,true);
 assert.equal(mapped.screen.blocks[0].content.text,'Original source','Keep legacy source for Studio editing');
 assert.ok(renderCertifiedEditor(mapped.screen).includes('data-certified-slot='));
}
const cover=makeCertifiedTemplate('cover');
Object.assign(cover.values,{unit:'Unit 12',topic:'Nature',imageSrc:'https://images.example.edu/nature.jpg',imageAlt:'Natural landscape'});
cover.values.imageSrc='/assets/media/nature.webp';cover.values.imageAlt='Mountain and forest landscape';cover.mediaCheck={src:cover.values.imageSrc,loaded:true};
assert.ok(validateCertifiedTemplate(cover).some(x=>x.includes('not been loaded')));
cover.mediaCheck={src:cover.values.imageSrc,loaded:true};
assert.deepEqual(validateCertifiedTemplate(cover),[]);
const aims=makeCertifiedTemplate('aims');
Object.assign(aims.values,{
 knowledge1:'Identify extreme weather types.',knowledge2:'Explain the second conditional.',
 skills1:'Interpret evidence from texts.',skills2:'Apply conditional language in discussion.',
 attitudes1:'Collaborate with peers respectfully.',attitudes2:'Demonstrate curiosity about nature.'
});
assert.deepEqual(validateCertifiedTemplate(aims),[]);
aims.values.knowledge1='Understand the lesson.';
assert.ok(validateCertifiedTemplate(aims).some(s=>s.includes('Bloom')));
const opener=makeCertifiedTemplate('opener');
Object.assign(opener.values,{
 activityNumber:'1',instruction:'Look at the photograph and discuss.',
 imageSrc:'https://images.example.edu/tornado.jpg',imageAlt:'Tornado in an open field',
 q1:'What can you see?',a1:'Dark clouds.',
 q2:'What is happening?',a2:'A strong storm is coming.',
 q3:'What is it called?',a3:'A tornado.',
 target:'tornado',concept:'A rapidly rotating column of air.'
});
opener.values.imageSrc='/assets/media/tornado.webp';opener.values.imageAlt='Tornado over a field';opener.mediaCheck={src:opener.values.imageSrc,loaded:true};
assert.ok(validateCertifiedTemplate(opener).some(x=>x.includes('not been loaded')));
opener.mediaCheck={src:opener.values.imageSrc,loaded:true};
assert.deepEqual(validateCertifiedTemplate(opener),[]);
const student=renderCertifiedVisual({certifiedTemplate:opener},'student',2,true);
const teacher=renderCertifiedVisual({certifiedTemplate:opener},'teacher',2,true);
assert.ok(!student.includes('A tornado.'),'Do not expose answer to Student');
assert.ok(!student.includes('data-certified-reveal'),'No reveal button for Student');
assert.ok(teacher.includes('A tornado.'));
assert.ok(teacher.includes('data-certified-reveal'));
assert.ok(teacher.includes('data-certified-reset'));
assert.ok(student.includes('data-certified-reset'));
assert.ok(!student.includes('data-certified-reveal'));
assert.ok(validateCertifiedTemplate({...cover,values:{...cover.values,imageSrc:'not-a-url'}}).length>0);
const reveal=renderCertifiedVisual({certifiedTemplate:changeCertifiedVariant(opener,'mystery-reveal')},'teacher',1,false);
assert.ok(reveal.includes('cert-mystery-tiles stage-1'));
const hotSeat=renderCertifiedVisual({certifiedTemplate:changeCertifiedVariant(opener,'hot-seat')},'student',0,false);
assert.ok(hotSeat.includes('cert-hotseat-cover'));
opener.values.instruction='What can you see?';
assert.ok(validateCertifiedTemplate(opener).some(s=>s.includes('Separate')));
opener.values.instruction='Look at the photo.';
opener.values.imageSrc='book_page_142.png';
assert.ok(validateCertifiedTemplate(opener).some(s=>s.includes('full-page')||s.includes('Image source')));
const invalid=makeCertifiedTemplate('cover');Object.assign(invalid.values,{unit:'Unit 12',topic:'Nature',imageSrc:'not-a-url',imageAlt:'Photo'});
assert.ok(validateCertifiedTemplate(invalid).some(x=>x.includes('Image source')));
const unverified=makeCertifiedTemplate('cover');Object.assign(unverified.values,{unit:'Unit 12',topic:'Nature',imageSrc:'/assets/photo.webp',imageAlt:'Photo'});
assert.ok(validateCertifiedTemplate(unverified).some(x=>x.includes('not been loaded')));
const generic=makeCertifiedTemplate('aims');for(const k of Object.keys(generic.values))generic.values[k]='Identify something.';
assert.ok(validateCertifiedTemplate(generic).some(x=>x.includes('concrete learning')));
const converted=applyCertifiedTemplate({blocks:[{type:'text',content:{text:'Original activity 1'}}]},makeCertifiedTemplate('opener')).screen;
assert.ok(validateCertifiedTemplate(converted.certifiedTemplate).some(x=>x.includes('source needs review')));
console.log('Certified Cover / Aims / Opener fixed-slot and role-policy contracts passed.');
