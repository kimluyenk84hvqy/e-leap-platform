const ABS=/^(?:https?:|data:|blob:|\/)/i;
export class ELeapMediaResolver{
  constructor({basePath='..'}={}){this.basePath=basePath.replace(/\/$/,'');}
  resolve(asset){
    if(!asset) return null;
    const src=asset.src||asset.storageRef||asset.url||'';
    if(!src) return {...asset,resolvedSrc:''};
    const resolvedSrc=ABS.test(src)?src:`${this.basePath}/${String(src).replace(/^\.\//,'')}`;
    return {...asset,resolvedSrc};
  }
  render(asset){
    const a=this.resolve(asset); if(!a||!a.resolvedSrc) return '';
    const title=String(a.title||'Media').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
    const alt=String(a.alt||a.title||'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
    if(a.type==='image') return `<figure class="eleap-media"><img src="${a.resolvedSrc}" alt="${alt}" loading="lazy"><figcaption>${title}</figcaption></figure>`;
    if(a.type==='audio') return `<figure class="eleap-media"><audio controls preload="metadata" src="${a.resolvedSrc}"></audio><figcaption>${title}</figcaption></figure>`;
    if(a.type==='video') return `<figure class="eleap-media"><video controls preload="metadata" playsinline ${a.poster?`poster="${this.resolve({src:a.poster}).resolvedSrc}"`:''} src="${a.resolvedSrc}"></video><figcaption>${title}</figcaption></figure>`;
    return `<p><a href="${a.resolvedSrc}" target="_blank" rel="noopener">${title}</a></p>`;
  }
}
