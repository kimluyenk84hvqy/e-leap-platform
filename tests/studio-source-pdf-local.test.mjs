import test from 'node:test';
import assert from 'node:assert/strict';
import {extractLocalPdfText} from '../assets/js/authoring/source-pdf-local.js';
test('PDF local extractor preserves page boundaries and marks all content unverified',async()=>{
 const file={name:'demo.pdf',size:100,type:'application/pdf',arrayBuffer:async()=>new Uint8Array([1,2]).buffer};
 const pdfjs={getDocument:()=>({promise:Promise.resolve({numPages:1,destroy:async()=>{},getPage:async()=>({getTextContent:async()=>({items:[{str:'UNIT: 1',transform:[0,0,0,0,0,100],width:25,hasEOL:true},{str:'TASK: 1 | reading | Demo',transform:[0,0,0,0,0,90],width:55}]})})})})};
 const r=await extractLocalPdfText(file,pdfjs);assert.equal(r.ok,true);assert.equal(r.pages.length,1);
 assert.match(r.pages[0].text,/TASK: 1/);assert.equal(r.pages[0].verified,false);
});
test('PDF local extractor rejects huge file before reading',async()=>{
 const file={name:'big.pdf',size:26*1024*1024,type:'application/pdf',arrayBuffer:async()=>{throw Error('should not read')}};
 await assert.rejects(()=>extractLocalPdfText(file,{getDocument(){}}),/limit/);
});
