import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const code=await readFile(new URL('../assets/js/operations-ui.js',import.meta.url),'utf8');

function install(){
 const save={disabled:false,textContent:'Save',onclick:null};
 const close={onclick:null};
 const area={before(){}};
 let panel;
 const document={
  createElement(tag){
   if(tag!=='div')return {dataset:{},setAttribute(){},className:'',textContent:''};
   panel={className:'',innerHTML:'',onclick:null,isConnected:false,
    remove(){this.isConnected=false},
    querySelector(selector){
     if(selector==='[data-save]')return save;
     if(selector==='[data-close]')return close;
     if(selector==='.action-row')return area;
     if(selector==='[data-modal-status]')return null;
     throw Error('Unexpected query: '+selector);
    }};
   return panel;
  },
  body:{appendChild(d){d.isConnected=true}}
 };
 const context={window:{},document};
 vm.runInNewContext(code,context);
 return {modal:context.window.ELEAPOps.modal,save,get panel(){return panel}};
}
test('async submit leaves modal and answer open until confirmed',async()=>{
 const a=install();let resolve;
 const waiting=new Promise(r=>resolve=r);
 const panel=a.modal('Submit','<textarea>answer</textarea>',()=>waiting);
 const click=a.save.onclick();
 assert.equal(panel.isConnected,true);
 assert.equal(a.save.disabled,true);
 assert.equal(a.save.textContent,'Saving…');
 resolve(true);await click;
 assert.equal(panel.isConnected,false);
});
test('failed confirmation does not close modal and can retry',async()=>{
 const a=install();let attempts=0;
 const panel=a.modal('Submit','<textarea>answer</textarea>',async()=>++attempts===1?false:true);
 await a.save.onclick();assert.equal(panel.isConnected,true);
 assert.equal(a.save.disabled,false);
 await a.save.onclick();assert.equal(panel.isConnected,false);
 assert.equal(attempts,2);
});
