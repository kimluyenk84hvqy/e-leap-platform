import {extractLocalPdfText} from './source-pdf-local.js';
import {pdfJs} from './pdf-ai-intake.js';
import {pdfMediaReader} from './pdf-embedded-media.js';
import {createLocalOcrReader} from './ocr-browser.js';
import {createScreen,createBlock} from './lesson-model.js';

const MB=1024*1024;
const MAX_MEDIA=100*MB;
const relationshipNs='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const strictRelationshipNs='http://purl.oclc.org/ooxml/officeDocument/relationships';
const mimeTypes={
  png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',gif:'image/gif',
  mp3:'audio/mpeg',wav:'audio/wav',m4a:'audio/mp4',ogg:'audio/ogg',
  mp4:'video/mp4',webm:'video/webm',mov:'video/quicktime'
};
const mimeFor=name=>mimeTypes[name.split('.').pop().toLowerCase()];
const elements=(node,name)=>Array.from(node.getElementsByTagNameNS('*',name));
const fileName=path=>path.split('/').pop();
const relationId=(node,key)=>node.getAttributeNS(relationshipNs,key)||node.getAttributeNS(strictRelationshipNs,key);
const libraryOrigin='https://studio-import.invalid/';
const localAssetPattern=/^document:[0-9a-f-]{36}$/;
const serverAssetPattern=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/;
const serverMediaUrl=id=>'/api/studio-media?document=1&open='+encodeURIComponent(id);

function collector(){
  const assets=new Map();
  let bytes=0;
  function add(key,name,type,content){
    if(assets.has(key))return assets.get(key);
    const blob=content instanceof Blob?content:new Blob([content],{type});
    if(!blob.size)return null;
    bytes+=blob.size;
    if(bytes>MAX_MEDIA||assets.size>=240)throw Error('Import exceeds 100 MB or 240 media items. Select fewer pages or slides.');
    const asset={id:'document:'+crypto.randomUUID(),name,type,blob};
    assets.set(key,asset);
    return asset;
  }
  return {assets,add};
}
function xmlDocument(text){
  if(/<!DOCTYPE/i.test(text))throw Error('Unsupported document XML.');
  const parsed=new DOMParser().parseFromString(text,'application/xml');
  if(elements(parsed,'parsererror').length)throw Error('Invalid PowerPoint XML.');
  return parsed;
}
function resolveTarget(part,target){
  if(!target||target.startsWith('//')||/^[a-z]+:/i.test(target))return '';
  try{
    const path=new URL(target,libraryOrigin+part);
    if(path.origin!==new URL(libraryOrigin).origin||path.hash||path.search)return '';
    return decodeURIComponent(path.pathname.slice(1));
  }catch{return '';}
}
function relPart(part){
  return part.slice(0,part.lastIndexOf('/')+1)+'_rels/'+fileName(part)+'.rels';
}
function pageRange(total,start,end,max){
  const last=end??Math.min(total,start+max-1);
  if(!Number.isInteger(start)||!Number.isInteger(last)||start<1||last<start||last>total||last-start>=max)
    throw Error('Select up to '+max+' consecutive pages or slides within the document.');
  return last;
}
async function readPptx(file,{start,end},media,warnings){
  if(!globalThis.JSZip)throw Error('PowerPoint reader unavailable. Reload Studio and try again.');
  const zip=await globalThis.JSZip.loadAsync(file);
  async function read(part,max,format){
    const entry=zip.file(part);
    if(!entry)throw Error('Missing PowerPoint part: '+part);
    // JSZip 3.10.1 exposes declared central-directory sizes on the compressed entry.
    const size=entry._data?.uncompressedSize;
    if(!Number.isSafeInteger(size)||size<0||size>max)throw Error('PowerPoint part exceeds the import limit: '+part);
    let expanded=0;
    return new Promise((resolve,reject)=>{
      const chunks=[],stream=entry.internalStream('uint8array');
      stream.on('data',chunk=>{
        expanded+=chunk.length;
        if(expanded>max){stream.pause();reject(Error('PowerPoint part exceeds the import limit: '+part));return;}
        chunks.push(chunk);
      }).on('error',reject).on('end',()=>{
        const bytes=new Uint8Array(expanded);
        let offset=0;
        for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
        resolve(format==='text'?new TextDecoder().decode(bytes):bytes);
      }).resume();
    });
  }
  const readXml=async part=>xmlDocument(await read(part,8*MB,'text'));
  const relations=async part=>{
    const path=relPart(part);
    if(!zip.file(path))return new Map();
    return new Map(elements(await readXml(path),'Relationship').map(node=>[
      node.getAttribute('Id'),{
        target:node.getAttribute('Target'),
        external:node.getAttribute('TargetMode')==='External',
        type:node.getAttribute('Type').split('/').pop()
      }
    ]));
  };
  const presentation='ppt/presentation.xml';
  const slideIds=elements(await readXml(presentation),'sldId');
  const routes=await relations(presentation);
  const last=pageRange(slideIds.length,start,end,40),pages=[];
  for(let number=start;number<=last;number++){
    const rel=routes.get(relationId(slideIds[number-1],'id'));
    const path=rel&&!rel.external&&resolveTarget(presentation,rel.target);
    if(!path?.startsWith('ppt/'))throw Error('PowerPoint slide '+number+' is missing.');
    const xml=await readXml(path);
    const slideRoutes=await relations(path);
    const paragraphText=p=>Array.from(p.children).map(run=>run.localName==='br'?'\n':elements(run,'t').map(t=>t.textContent).join('')).join('');
    const text=elements(xml,'p').map(paragraphText).filter(Boolean).join('\n');
    const title=elements(xml,'sp').find(shape=>elements(shape,'ph').some(ph=>['title','ctrTitle'].includes(ph.getAttribute('type'))));
    const page={number,text,title:title&&elements(title,'p').map(paragraphText).join('\n').split('\n')[0],assets:[]};
    for(const route of slideRoutes.values()){
      if(!['image','audio','video','media'].includes(route.type))continue;
      if(route.external){warnings.add('External media links were skipped.');continue;}
      const target=resolveTarget(path,route.target);
      const type=mimeFor(target);
      if(!type||!target.startsWith('ppt/')){warnings.add('Unsupported PowerPoint media: '+fileName(target||route.target));continue;}
      const asset=media.assets.get(target)??media.add(target,fileName(target),type,await read(target,MAX_MEDIA,'bytes'));
      if(asset&&!page.assets.includes(asset))page.assets.push(asset);
    }
    if(!page.text&&!page.assets.length)warnings.add('Slide '+number+' has no extractable text or supported media.');
    pages.push(page);
  }
  if(start>1||last<slideIds.length)warnings.add('Imported slides '+start+'–'+last+' of '+slideIds.length+'.');
  return pages;
}
async function renderPdfPage(page){
  const full=page.getViewport({scale:1});
  const viewport=page.getViewport({scale:Math.min(2,1600/Math.max(full.width,full.height))});
  const canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.ceil(viewport.width));
  canvas.height=Math.max(1,Math.ceil(viewport.height));
  try{
    await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;
    return await new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('Could not render PDF page.')),'image/png'));
  }finally{canvas.width=canvas.height=0;}
}
async function pdfImageBlob(image){
  const {width,height}=image;
  if(!width||!height||width*height>12e6)return null;
  const canvas=document.createElement('canvas');
  canvas.width=width;
  canvas.height=height;
  try{
    const ctx=canvas.getContext('2d');
    if(image.bitmap)ctx.drawImage(image.bitmap,0,0);
    else if(image.data){
      const pixels=ctx.createImageData(width,height);
      const rgb=image.kind===2,rgba=image.kind===3;
      for(let y=0;y<height;y++){
        for(let x=0;x<width;x++){
          const i=y*width+x,j=4*i;
          if(rgb||rgba){
            const k=i*(rgba?4:3);
            pixels.data[j]=image.data[k];
            pixels.data[j+1]=image.data[k+1];
            pixels.data[j+2]=image.data[k+2];
            pixels.data[j+3]=rgba?image.data[k+3]:255;
          }else{
            const shade=image.data[y*Math.ceil(width/8)+(x>>3)]&(128>>(x%8))?255:0;
            pixels.data[j]=pixels.data[j+1]=pixels.data[j+2]=shade;
            pixels.data[j+3]=255;
          }
        }
      }
      ctx.putImageData(pixels,0,0);
    }else return null;
    return await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
  }finally{canvas.width=canvas.height=0;}
}
async function readPdf(file,{start,end},media,warnings){
  const pdfAttachments=[];
  async function attachment(item){
    const name=fileName(String(item?.filename||''));
    const type=mimeFor(name);
    if(!type||!item.content?.length)return null;
    const digest=await crypto.subtle.digest('SHA-256',item.content);
    const id=Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
    return media.add('attachment:'+type+':'+id,name,type,item.content);
  }
  let addedDocumentAttachments=false,ocr=null,embedded=null;
  let result;
  const reader=await pdfJs();
  try{
    result=await extractLocalPdfText(file,reader,{
      startPage:start,endPage:end,maxBytes:150*MB,maxPages:12,
      ocrPage:async page=>{
        try{
          ocr??=await createLocalOcrReader();
          return await ocr.read(page);
        }catch{
          warnings.add('Local OCR was unavailable. Review text directly on the imported page image.');
          return null;
        }
      },
      inspectPage:async(page,pdf)=>{
        if(!addedDocumentAttachments){
          for(const item of Object.values(await pdf.getAttachments()||{})){
            const asset=await attachment(item);
            if(asset)pdfAttachments.push(asset);
            else warnings.add('A PDF attachment uses an unsupported media type.');
          }
          addedDocumentAttachments=true;
        }
        const assets=[media.add('page:'+page.pageNumber,'PDF page '+page.pageNumber+'.png','image/png',await renderPdfPage(page))];
        const operations=await page.getOperatorList();
        const objectIds=new Set();
        for(const [i,operation] of operations.fnArray.entries()){
          if(![reader.OPS.paintImageXObject,reader.OPS.paintInlineImageXObject,reader.OPS.paintImageXObjectRepeat].includes(operation))continue;
          const source=operations.argsArray[i][0];
          if(objectIds.has(source))continue;
          objectIds.add(source);
          const objects=typeof source==='string'&&(source.startsWith('g_')?page.commonObjs:page.objs);
          const image=objects?(objects.has(source)?objects.get(source):null):source;
          if(!image)continue;
          const blob=await pdfImageBlob(image);
          if(blob)assets.push(media.add('image:'+page.pageNumber+':'+i,'Page '+page.pageNumber+' image '+objectIds.size+'.png','image/png',blob));
        }
        for(const annotation of await page.getAnnotations()){
          if(!annotation.file)continue;
          const asset=await attachment(annotation.file);
          if(asset&&!assets.includes(asset))assets.push(asset);
          else if(!asset)warnings.add('A PDF page attachment uses an unsupported media type.');
        }
        embedded??=pdfMediaReader(file).catch(()=>{
          warnings.add('Embedded PDF annotation media could not be inspected.');
          return null;
        });
        const read=await embedded;
        if(read){
          const result=await read(page.pageNumber,mimeFor);
          for(const item of result.attachments){
            const asset=await attachment(item);
            if(asset&&!assets.includes(asset))assets.push(asset);
          }
          for(const warning of result.warnings)warnings.add(warning);
        }
        return {assets};
      }
    });
  }finally{if(ocr)await ocr.close();}
  for(const warning of result.warnings)warnings.add(warning);
  const pages=result.pages.map(page=>({...page,number:page.page}));
  const unplaced=pdfAttachments.filter(asset=>!pages.some(page=>page.assets.includes(asset)));
  if(unplaced.length){
    pages.push({number:'attachments',title:'PDF attachments',text:'',assets:unplaced});
    warnings.add('Document-level media is listed separately because it has no page assignment.');
  }
  return pages;
}

export async function extractDocument(file,{start=1,end=null}={}){
  const extension=String(file?.name||'').split('.').pop().toLowerCase();
  if(!['pdf','pptx'].includes(extension)||!file.size)throw Error('Select a PDF or PPTX file.');
  if(file.size>(extension==='pdf'?150:200)*MB)throw Error('File exceeds the import size limit.');
  const media=collector(),warnings=new Set();
  const pages=await (extension==='pdf'?readPdf:readPptx)(file,{start,end},media,warnings);
  if(!pages.length||!pages.some(page=>page.text||page.assets.length))throw Error('No importable content found.');
  return {pages,assets:[...media.assets.values()],warnings:[...warnings],format:extension};
}

export function documentScreens(result){
  return result.pages.map(page=>{
    const label=typeof page.number==='number'?(result.format==='pdf'?'PDF page ':'PowerPoint slide ')+page.number:'PDF attachments';
    const screen=createScreen('Imported source',page.title||label);
    screen.blocks=[];
    if(page.text){
      const block=createBlock('text');
      block.content.text=page.text;
      screen.blocks.push(block);
    }
    for(const asset of page.assets){
      const block=createBlock(asset.type.split('/')[0]);
      Object.assign(block.content,{assetId:asset.id,src:serverAssetPattern.test(asset.id)?serverMediaUrl(asset.id):'',alt:asset.name,label:asset.name});
      screen.blocks.push(block);
    }
    if(!screen.blocks.length){
      const block=createBlock('text');
      block.content.text='No extractable content on this slide.';
      screen.blocks.push(block);
    }
    return screen;
  });
}

const localUrls=new Map();
function openAssetDb(owner){
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open('eleap-document-media:'+owner,1);
    request.onupgradeneeded=()=>request.result.createObjectStore('assets');
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
  });
}
export async function saveDocumentAssets(owner,assets){
  if(!assets.length)return;
  const db=await openAssetDb(owner);
  try{
    await new Promise((resolve,reject)=>{
      const tx=db.transaction('assets','readwrite');
      tx.oncomplete=resolve;
      tx.onabort=()=>reject(tx.error);
      for(const asset of assets)tx.objectStore('assets').put(asset.blob,asset.id);
    });
    for(const asset of assets)localUrls.set(asset.id,URL.createObjectURL(asset.blob));
  }finally{db.close();}
}
export function documentMediaUrl(id){
  if(localAssetPattern.test(id||''))return localUrls.get(id)||'';
  return '';
}
export async function loadDocumentAssets(owner,lesson){
  const ids=new Set(lesson?.screens?.flatMap(screen=>screen.blocks.map(block=>block.content?.assetId))
    .filter(id=>localAssetPattern.test(id||'')&&!localUrls.has(id)));
  if(!ids.size)return;
  const db=await openAssetDb(owner);
  try{
    const tx=db.transaction('assets','readonly'),assets=tx.objectStore('assets');
    await Promise.all([...ids].map(id=>new Promise((resolve,reject)=>{
      const request=assets.get(id);
      request.onsuccess=()=>{if(request.result&&!localUrls.has(id))localUrls.set(id,URL.createObjectURL(request.result));resolve();};
      request.onerror=()=>reject(request.error);
    })));
  }finally{db.close();}
}

export function hasLocalDocumentMedia(lesson){
  return Boolean(lesson?.screens?.some(screen=>screen.blocks?.some(block=>localAssetPattern.test(block.content?.assetId||''))));
}
