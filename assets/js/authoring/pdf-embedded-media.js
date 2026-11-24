let readerPromise;
function pdfReader(){
  if(globalThis.PDFLib)return Promise.resolve(globalThis.PDFLib);
  if(!readerPromise)readerPromise=new Promise((resolve,reject)=>{
    const tag=document.createElement('script');
    tag.src='https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js';
    tag.crossOrigin='anonymous';
    tag.referrerPolicy='no-referrer';
    tag.onload=()=>globalThis.PDFLib?resolve(globalThis.PDFLib):reject(Error('Embedded PDF media reader unavailable.'));
    tag.onerror=()=>reject(Error('Embedded PDF media reader unavailable.'));
    document.head.append(tag);
  }).catch(error=>{readerPromise=null;throw error;});
  return readerPromise;
}

async function streamBytes(stream,filter){
  const bytes=stream.getContents();
  const limit=100*1024*1024;
  if(bytes.length>limit)throw Error('Embedded media exceeds 100 MB.');
  if(!filter)return bytes;
  if(filter!=='/FlateDecode')throw Error('Unsupported PDF media stream encoding.');
  const reader=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate')).getReader();
  const chunks=[];
  let size=0;
  try{
    for(;;){
      const {done,value}=await reader.read();
      if(done)break;
      size+=value.length;
      if(size>limit){await reader.cancel();throw Error('Embedded media exceeds 100 MB.');}
      chunks.push(value);
    }
  }finally{reader.releaseLock();}
  return new Uint8Array(await new Blob(chunks).arrayBuffer());
}

export async function pdfMediaReader(file){
  const pdf=await pdfReader();
  const {PDFDocument,PDFDict,PDFArray,PDFName,PDFRawStream}=pdf;
  const doc=await PDFDocument.load(await file.arrayBuffer(),{updateMetadata:false});
  const pages=doc.getPages();
  const name=key=>PDFName.of(key);
  const get=(dict,key)=>dict instanceof PDFDict?dict.lookup(name(key)):undefined;
  const text=value=>typeof value?.decodeText==='function'?value.decodeText():'';
  const directName=value=>value instanceof PDFName?value.toString():'';
  function* nameTree(root,visited=new Set()){
    if(!(root instanceof PDFDict)||visited.has(root)||visited.size>=240)return;
    visited.add(root);
    const names=get(root,'Names');
    if(names instanceof PDFArray){
      for(let i=0;i+1<Math.min(names.size(),480);i+=2)yield [text(names.lookup(i)),names.lookup(i+1)];
    }
    const kids=get(root,'Kids');
    if(kids instanceof PDFArray){
      for(let i=0;i<Math.min(kids.size(),240)&&visited.size<240;i++)yield* nameTree(kids.lookup(i),visited);
    }
  }
  return async function readPageMedia(number,mimeFor){
    const page=pages[number-1],attachments=[],warnings=[];
    const annotations=get(page.node,'Annots');
    if(!(annotations instanceof PDFArray))return {attachments,warnings};
    const processed=new Set();
    async function add(nameHint,spec){
      const filename=text(get(spec,'UF'))||text(get(spec,'F'))||text(spec)||nameHint||'';
      const type=mimeFor(filename);
      const ef=get(spec,'EF'),stream=get(ef,'UF')||get(ef,'F');
      if(!type||!(stream instanceof PDFRawStream))return false;
      if(processed.has(stream))return true;
      processed.add(stream);
      const filter=get(stream.dict,'Filter');
      let encoding=directName(filter);
      if(filter instanceof PDFArray&&filter.size()===1)encoding=directName(filter.lookup(0));
      try{
        const content=await streamBytes(stream,encoding||(filter?'unsupported':''));
        attachments.push({filename,content});
        return true;
      }catch(error){warnings.push(error.message);return false;}
    }
    for(let i=0;i<Math.min(annotations.size(),240);i++){
      const annotation=annotations.lookup(i);
      const subtype=directName(get(annotation,'Subtype'));
      if(!['/RichMedia','/Movie','/Sound','/Screen'].includes(subtype))continue;
      let extracted=false;
      if(subtype==='/RichMedia'){
        const tree=get(get(annotation,'RichMediaContent'),'Assets');
        for(const [filename,spec] of nameTree(tree)){
          if(attachments.length>=240)break;
          if(await add(filename,spec))extracted=true;
        }
      }else if(subtype==='/Movie')extracted=await add('',get(get(annotation,'Movie'),'F'));
      else if(subtype==='/Screen'){
        const action=get(annotation,'A');
        const clip=get(get(action,'R'),'C');
        extracted=await add('',get(clip,'D'));
      }
      if(!extracted)warnings.push('A PDF multimedia annotation on page '+number+' has no supported embedded file.');
    }
    return {attachments,warnings};
  };
}
