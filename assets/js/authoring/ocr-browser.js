/* Local, opt-in OCR for scanned textbook pages. No image or PDF bytes uploaded.
 * The browser downloads the OCR engine; the teacher still verifies source text.
 */
let enginePromise=null;
async function getEngine(){
 if(!enginePromise)enginePromise=import('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.esm.min.js');
 return enginePromise;
}
export async function createLocalOcrReader({engineLoader=getEngine}={}){
 const engine=await engineLoader();
 if(typeof engine.createWorker!=='function')throw Error('Local OCR library unavailable');
 const worker=await engine.createWorker('eng');
 return {
  async read(page){
   if(typeof document==='undefined')throw Error('Local OCR requires a browser');
   const viewport=page.getViewport({scale:1.8});
   const canvas=document.createElement('canvas');
   canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
   const context=canvas.getContext('2d',{willReadFrequently:true});
   if(!context)throw Error('Unable to render PDF page');
   await page.render({canvasContext:context,viewport}).promise;
   const output=await worker.recognize(canvas);
   return {text:String(output?.data?.text||'').trim(),confidence:Number(output?.data?.confidence||0)};
  },
  async close(){await worker.terminate()}
 };
}
