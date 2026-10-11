/* New lessons should reference media by assetId. src remains as a backward-compatible fallback. */
export function createAuthoringMediaRef({assetId=null,src='',type='image',alt='',label='',caption='',transcript=''}={}){return {assetId,src,type,alt,label,caption,transcript};}
export function hasStableMediaRef(ref={}){return Boolean(ref.assetId||ref.src);}
export function mediaFolderFor(type){return ({image:'media/images',audio:'media/audio',video:'media/video'})[type]||'media';}
