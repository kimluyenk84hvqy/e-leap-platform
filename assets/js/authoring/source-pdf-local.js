/* Local PDF text extraction using the PDF.js library already used by
 * E-LEAP Resource Workshop. This is *not* OCR or source verification.
 * Process bytes only in browser memory. No uploads/network of PDF bytes.
 */
export async function extractLocalPdfText(file,pdfjs,{maxBytes=25*1024*1024,maxPages=30}={}){
 if(!file||!(/\.pdf$/i.test(file.name)||file.type==='application/pdf'))throw Error('Select a PDF file.');
 if(file.size<=0||file.size>maxBytes)throw Error('PDF file exceeds the local extraction limit (25 MB).');
 if(!pdfjs||typeof pdfjs.getDocument!=='function')throw Error('PDF reader unavailable.');
 const bytes=new Uint8Array(await file.arrayBuffer());
 const job=pdfjs.getDocument({data:bytes});
 const document=await job.promise;
 const pages=[],warnings=[];
 try{
  const total=document.numPages;
  for(let n=1;n<=Math.min(total,maxPages);n++){
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
  if(total>maxPages)warnings.push('Only first '+maxPages+' of '+total+' pages extracted.');
  warnings.push('Reading order is heuristic; review columns, tables and question numbering against the rendered PDF.');
  return {ok:true,pageCount:total,pages,warnings,verification:'unverified',format:'local-pdf-text'};
 }finally{await document.destroy();}
}
