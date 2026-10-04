export function createMediaAsset({type='image',url='',name='',alt='',metadata={}}={}){return {assetId:`media-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`,type,url,name:name||url.split('/').pop()||'Media',alt,metadata,createdAt:new Date().toISOString()};}
export function mediaRef(asset){return asset?{assetId:asset.assetId,src:asset.url||'',alt:asset.alt||''}:{assetId:null,src:'',alt:''};}
export function resolveMediaRef(ref={},manifest={}){if(ref.assetId&&manifest[ref.assetId])return {...ref,...manifest[ref.assetId]};return ref;}
