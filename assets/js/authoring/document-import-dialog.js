import {extractDocument,documentScreens,saveDocumentAssets} from './document-import.js';
import {listDocumentSources,openDocumentSource,persistDocumentMedia} from './document-library.js';

export function openDocumentImport({owner,insert,getRemainingSlides}){
  const dialog=document.createElement('dialog');
  dialog.className='studio-document-dialog';
  dialog.innerHTML=`<form>
    <h2>Import PDF or PowerPoint</h2>
    <label>From this device <input type="file" name="file" accept=".pdf,.pptx"></label>
    <label>From Media Library <select name="source" disabled><option value="">Loading documents…</option></select></label>
    <div class="studio-document-range">
      <label>First page or slide <input name="start" type="number" min="1" value="1" required></label>
      <label>Last page or slide <input name="end" type="number" min="1" placeholder="Automatic"></label>
    </div>
    <label><input type="checkbox" name="sync" disabled> Store source and media in private Preview Media Library</label>
    <p>Import up to 12 PDF pages or 40 PowerPoint slides at a time.</p>
    <p role="status" data-import-status></p>
    <div class="studio-document-actions">
      <button type="button" class="studio-btn" data-close>Cancel</button>
      <button class="studio-btn" type="submit" data-store-source disabled>Save source only</button>
      <button class="studio-btn primary" type="submit">Import slides</button>
    </div>
  </form>`;
  document.body.append(dialog);
  const form=dialog.querySelector('form');
  const {file,source,start,end,sync}=form.elements;
  const status=dialog.querySelector('[data-import-status]');
  const close=dialog.querySelector('[data-close]');
  const submit=form.querySelector('[type="submit"].primary');
  const storeSource=form.querySelector('[data-store-source]');
  let sources=[],busy=false,finished=false,capability=false;
  dialog.addEventListener('close',()=>dialog.remove(),{once:true});
  close.onclick=()=>dialog.close();
  dialog.addEventListener('cancel',event=>{if(busy)event.preventDefault();});
  file.onchange=()=>{if(file.files.length)source.value='';storeSource.disabled=!capability||!file.files.length;};
  source.onchange=()=>{if(source.value){file.value='';storeSource.disabled=true;}};
  dialog.showModal();
  listDocumentSources().then(result=>{
    sources=result.files;
    capability=result.uploadEnabled===true;
    source.replaceChildren(new Option(sources.length?'Choose a stored document…':'No stored PDFs or PPTX',''));
    for(const item of sources)source.add(new Option(item.original_name,item.asset_id));
    if(!busy&&!finished){source.disabled=!sources.length;sync.disabled=!capability;storeSource.disabled=!capability||!file.files.length;}
  }).catch(()=>{source.replaceChildren(new Option('Library unavailable in this session',''));});
  form.onsubmit=async event=>{
    event.preventDefault();
    if(busy||finished)return;
    const local=file.files[0],selected=sources.find(item=>item.asset_id===source.value);
    if(!local&&!selected){status.textContent='Choose a PDF or PPTX to import.';return;}
    const sourceOnly=event.submitter===storeSource;
    if(sourceOnly&&(!local||!capability))return;
    const first=Number(start.value),last=end.value?Number(end.value):null,server=sync.checked&&capability;
    busy=true;
    for(const element of form.elements)element.disabled=true;
    status.textContent=sourceOnly?'Saving original to private Preview Media Library…':'Extracting document…';
    try{
      if(sourceOnly){
        await persistDocumentMedia([],local);
        status.textContent='Source saved to private Preview Media Library. It can be opened in Studio from this account.';
        finished=true;
        close.textContent='Done';
        return;
      }
      const result=await extractDocument(local||await openDocumentSource(selected),{start:first,end:last});
      if(result.pages.length>getRemainingSlides())throw Error('This draft would exceed 100 slides. Select fewer pages or slides.');
      if(server){
        status.textContent='Saving extracted media to the private Preview library…';
        await persistDocumentMedia(result.assets,local);
      }else await saveDocumentAssets(owner,result.assets);
      const screens=documentScreens(result);
      if(screens.length>getRemainingSlides())throw Error('The open draft changed while the document was being imported.');
      insert(screens);
      const counts=screens.flatMap(screen=>screen.blocks).reduce((totals,block)=>({...totals,[block.type]:(totals[block.type]||0)+1}),{});
      const detail=['text','image','audio','video'].map(type=>`${counts[type]||0} ${type}`).join(', ');
      status.textContent=`Imported ${screens.length} slides (${detail}). ${server?'Source and media saved in the Preview library. ':result.assets.length?'Media saved on this device. ':''}${result.warnings.join(' ')}`;
      finished=true;
      close.textContent='Done';
    }catch(error){status.textContent=error.message;}
    finally{
      busy=false;
      close.disabled=false;
      if(!finished){
        for(const element of form.elements)element.disabled=false;
        source.disabled=!sources.length;
        sync.disabled=!capability;
        storeSource.disabled=!capability||!file.files.length;
      }
      if(finished){submit.hidden=true;storeSource.hidden=true;}
    }
  };
}
