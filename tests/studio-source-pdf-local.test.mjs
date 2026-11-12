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
 const file={name:'big.pdf',size:151*1024*1024,type:'application/pdf',arrayBuffer:async()=>{throw Error('should not read')}};
 await assert.rejects(()=>extractLocalPdfText(file,{getDocument(){}}),/limit/);
});

test('Teacher can select a source page range without reading unrelated pages',async()=>{
 const called=[];
 const pdfjs={getDocument:()=>({promise:Promise.resolve({numPages:250,destroy:async()=>{},getPage:async n=>{called.push(n);return {getTextContent:async()=>({items:[{str:'Page '+n,transform:[0,0,0,0,0,100],width:25}]})}}})})};
 const file={name:'book.pdf',size:63*1024*1024,type:'application/pdf',arrayBuffer:async()=>new ArrayBuffer(2)};
 const r=await extractLocalPdfText(file,pdfjs,{startPage:142,endPage:143});
 assert.deepEqual(called,[142,143]);assert.equal(r.pageCount,250);assert.deepEqual(r.selectedRange,{startPage:142,endPage:143});
});
test('PDF page selection must reject excessive ranges',async()=>{
 const pdfjs={getDocument:()=>({promise:Promise.resolve({numPages:250,destroy:async()=>{},getPage:async()=>{throw Error('should not reach page')}})})};
 const file={name:'book.pdf',size:100,type:'application/pdf',arrayBuffer:async()=>new ArrayBuffer(2)};
 await assert.rejects(()=>extractLocalPdfText(file,pdfjs,{startPage:1,endPage:200}),/consecutive/);
});
