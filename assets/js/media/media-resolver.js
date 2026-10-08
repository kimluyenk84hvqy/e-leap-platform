const ABS=/^(?:https?:|data:|blob:|\/)/i;
const PRIVATE_PREFIX=/^(?:objective-first-b2|life-intermediate|advanced-skills|medical-english|english-for-pharmacy)\//i;

export class ELeapMediaResolver{
  constructor({basePath='..',timeoutMs=10000}={}){
    this.basePath=basePath.replace(/\/$/,'');
    this.timeoutMs=timeoutMs;
  }

  resolve(asset){
    if(!asset)return null;
    const src=asset.src||asset.storageRef||asset.url||'';
    if(!src)return {...asset,resolvedSrc:''};
    const resolvedSrc=ABS.test(src)?src:`${this.basePath}/${String(src).replace(/^\.\//,'')}`;
    return {...asset,resolvedSrc,originalSrc:String(src).replace(/^\.\//,'')};
  }

  privateFallback(a){
    const src=String(a?.originalSrc||'').replace(/^\/+/, '');
    if(!PRIVATE_PREFIX.test(src)) return '';
    return `/api/media?pathname=${encodeURIComponent(src)}`;
  }

  render(asset){
    const a=this.resolve(asset);
    if(!a||!a.resolvedSrc)return '';
    const esc=s=>String(s||'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
    const title=esc(a.title||'Media'),alt=esc(a.alt||a.title||'');
    const fallback=this.privateFallback(a);

    if(a.type==='image'){
      const error=fallback
        ? `this.onerror=null;this.src='${fallback}';this.closest('figure').dataset.mediaState='fallback'`
        : `this.closest('figure').dataset.mediaState='error'`;
      return `<figure class="eleap-media" data-media-state="loading"><img src="${a.resolvedSrc}" alt="${alt}" loading="lazy" decoding="async" onload="this.closest('figure').dataset.mediaState='ready'" onerror="${error}"><figcaption>${title}</figcaption></figure>`;
    }

    if(a.type==='audio'){
      const sources=fallback
        ? `<source src="${a.resolvedSrc}"><source src="${fallback}">`
        : `<source src="${a.resolvedSrc}">`;
      return `<figure class="eleap-media" data-media-state="loading"><audio controls preload="metadata" onloadedmetadata="this.closest('figure').dataset.mediaState='ready'" oncanplay="this.closest('figure').dataset.mediaState='ready'" onerror="this.closest('figure').dataset.mediaState='error'">${sources}</audio><figcaption>${title}</figcaption></figure>`;
    }

    if(a.type==='video'){
      const poster=a.poster?this.resolve({src:a.poster}).resolvedSrc:'';
      const sources=fallback
        ? `<source src="${a.resolvedSrc}"><source src="${fallback}">`
        : `<source src="${a.resolvedSrc}">`;
      return `<figure class="eleap-media" data-media-state="loading"><video controls preload="metadata" playsinline ${poster?`poster="${poster}"`:''} onloadedmetadata="this.closest('figure').dataset.mediaState='ready'" oncanplay="this.closest('figure').dataset.mediaState='ready'" onerror="this.closest('figure').dataset.mediaState='error'">${sources}</video><figcaption>${title}</figcaption></figure>`;
    }

    return `<p><a href="${a.resolvedSrc}" target="_blank" rel="noopener">${title}</a></p>`;
  }

  static async fetchJSON(url,{cacheKey='e-leap:media-map:v1',ttlMs=600000}={}){
    const now=Date.now();
    try{
      const raw=sessionStorage.getItem(cacheKey);
      if(raw){const c=JSON.parse(raw);if(c?.value&&now-(c.savedAt||0)<ttlMs)return c.value;}
    }catch(_){ }
    const r=await fetch(url,{cache:'default'});
    if(!r.ok)throw new Error(`${url}: ${r.status}`);
    const value=await r.json();
    try{sessionStorage.setItem(cacheKey,JSON.stringify({savedAt:now,value}))}catch(_){ }
    return value;
  }
}
