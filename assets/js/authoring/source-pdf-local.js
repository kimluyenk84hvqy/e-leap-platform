/* Local PDF text extraction using the PDF.js library already used by
 * E-LEAP Resource Workshop. This is *not* OCR or source verification.
 * Process bytes only in browser memory. No uploads/network of PDF bytes.
 */
export async function extractLocalPdfText(file,pdfjs,{maxBytes=150*1024*1024,maxPages=12,startPage=1,endPage=null}={}){
 if(!file||!(/\.pdf$/i.test(file.name)||file.type==='application/pdf'))throw Error('Select a PDF file.');
 if(file.size<=0||file.size>maxBytes)throw Error('PDF file exceeds the local extraction limit (150 MB).');
 if(!pdfjs||typeof pdfjs.getDocument!=='function')throw Error('PDF reader unavailable.');
 const bytes=new Uint8Array(await file.arrayBuffer());
 const job=pdfjs.getDocument({data:bytes});
 const document=await job.promise;
 const pages=[],warnings=[];
 try{
  const total=document.numPages;
  if(!Number.isInteger(startPage)||startPage<1||startPage>total)throw Error('Start page must be within the PDF page count.');
  const selectedEnd=endPage===null?Math.min(total,startPage+maxPages-1):endPage;
  if(!Number.isInteger(selectedEnd)||selectedEnd<startPage||selectedEnd>total||selectedEnd-startPage+1>maxPages)throw Error('Select 1–'+maxPages+' valid consecutive pages.');
  for(let n=startPage;n<=selectedEnd;n++){
   const page=await document.getPage(n);
   const content=await page.getTextContent();
   const lines=[];let lastY=null,lastX=-Infinity,current='';
   for(const item of content.items||[]){
    if(typeof item.str!=='string'||!item.str.trim())continue;
    const y=Number(item.transform?.[5]),x=Number(item.transform?.[4]);
    if(current&&(Math.abs(y-lastY)>3||x<lastX-5)){lines.push(current.trim());current='';}
    current+=(current?' ':'')+item.str;
    lastY=y;lastX=x+Number(item.width||0);
    if(item.hasEOL){lines.push(current.trim());current='';lastY=null;lastX=-Infinity;}
   }
   if(current.trim())lines.push(current.trim());
   const text=lines.filter(Boolean).join('\n');
   if(!text)warnings.push('Page '+n+' has no extractable text: scanned PDF / OCR required.');
   pages.push({page:n,text,verified:false});
  }
  if(startPage>1||selectedEnd<total)warnings.push('Only pages '+startPage+'–'+selectedEnd+' of '+total+' processed.');
  warnings.push('Reading order is heuristic; review columns, tables and question numbering against the rendered PDF.');
  return {ok:true,pageCount:total,selectedRange:{startPage,endPage:selectedEnd},pages,warnings,verification:'unverified',format:'local-pdf-text'};
 }finally{await document.destroy();}
}
