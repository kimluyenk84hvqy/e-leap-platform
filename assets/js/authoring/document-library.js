const endpoint='/api/studio-media';
async function libraryRequest(params){
  const response=await fetch(endpoint+'?'+new URLSearchParams({document:'1',...params}),{cache:'no-store'});
  const body=await response.json();
  if(!response.ok||!body.ok)throw Error(body.error||'Preview Media Library unavailable.');
  return body;
}
export async function listDocumentSources(){
  return libraryRequest({});
}
export async function openDocumentSource(source){
  if(!/^[0-9a-f-]{36}$/.test(source.asset_id))throw Error('Invalid source reference.');
  const response=await fetch(endpoint+'?document=1&open='+encodeURIComponent(source.asset_id));
  if(!response.ok)throw Error('Could not open document from Media Library.');
  return new File([await response.blob()],source.original_name,{type:source.content_type});
}
async function confirmDocument(sha256,bytes,mime){
  const response=await fetch(endpoint+'?document=1',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({action:'confirm-document',sha256,bytes,mime})
  });
  const body=await response.json();
  if(!response.ok||!body.ok)throw Error(body.error||'Could not verify the private upload.');
  return body.assetId;
}
export async function persistDocumentMedia(assets,original){
  const items=[...assets];
  if(original){
    const type=/\.pdf$/i.test(original.name)?'application/pdf':'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    items.push({name:original.name,type,blob:original,id:'document:original',category:'temporary'});
  }
  if(!items.length)return;
  const capability=await listDocumentSources();
  if(!capability.uploadEnabled)throw Error('Private media upload is disabled on this Preview.');
  const {uploadPresigned}=await import('https://esm.sh/@vercel/blob@2.6.1/client?bundle');
  for(const asset of items){
    const sha256=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await asset.blob.arrayBuffer())))
      .map(byte=>byte.toString(16).padStart(2,'0')).join('');
    const existing=await confirmDocument(sha256,asset.blob.size,asset.type);
    if(existing){asset.id=existing;continue;}
    const extension=asset.name.split('.').pop().toLowerCase();
    const path='studio-library/document-'+crypto.randomUUID()+'/'+crypto.randomUUID()+'-'+extension;
    await uploadPresigned(path,asset.blob,{
      access:'private',handleUploadUrl:endpoint+'?document=1',contentType:asset.type,
      multipart:asset.blob.size>8*1024*1024,
      clientPayload:JSON.stringify({name:asset.name.slice(-170),bytes:asset.blob.size,mime:asset.type,sha256,category:asset.category||asset.type.split('/')[0]})
    });
    for(let attempt=0;attempt<12;attempt++){
      const saved=await confirmDocument(sha256,asset.blob.size,asset.type);
      if(saved){asset.id=saved;break;}
      await new Promise(resolve=>setTimeout(resolve,1000));
    }
    if(asset.id.startsWith('document:'))throw Error('Private storage did not confirm this upload. Retry Save source only to check the same file again.');
  }
}
