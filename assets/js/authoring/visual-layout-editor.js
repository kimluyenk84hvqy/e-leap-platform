/* E-LEAP Layout Editor — safe per-slide visual overrides, not lesson content.
 * Drag / bottom-right resize regions on a teacher-only canvas. Undo/redo is per
 * slide, defaults remain intact, and all positions stay inside the 16:9 frame.
 * This editor cannot alter source blocks, keys, permissions or activities.
 */
export const LAYOUT_SCHEMA=1;
const MAX_HISTORY=30;
const ZONES=[
 ['.cert-cover-identity','Institution + title'],['.cert-cover-photo','Cover photo'],
 ['.cert-aims-head','Aims heading'],['.cert-aim-card','Learning aim'],
 ['.cert-opener-photo','Opener image'],['.cert-opener-task','Question / task'],
 ['.functional-identity','Institution header'],['.functional-slot','Functional region'],
 ['.method-draft-heading','Combo heading'],['.method-draft-detail','Teaching step'],
 ['.method-slot','Method activity region'],
 ['.canvas-hero','Slide heading'],['.canvas-body > .block','Content / activity']
];
const skipElement=el=>!!el.closest('.layout-editor-controls,.layout-resize-handle');
const cap=(v,min,max)=>Math.max(min,Math.min(max,v));
const num=x=>Number.isFinite(Number(x))?Number(x):0;
export const cloneLayout=x=>JSON.parse(JSON.stringify(x||{}));
export function validOverride(a){
 return !!a&&typeof a==='object'&&['dx','dy','width','height','base'].every(k=>Number.isFinite(a[k]))&&
 a.base>=100&&a.base<=8000&&Math.abs(a.dx)<=8000&&Math.abs(a.dy)<=8000&&a.width>=50&&a.width<=8000&&a.height>=35&&a.height<=8000;
}
export function layoutIssues(s){
 const v=s?.visualLayout;if(!v)return [];
 const issues=[];
 if(v.schemaVersion!==LAYOUT_SCHEMA)issues.push('Unknown layout editor schema.');
 for(const [key,o] of Object.entries(v.regions||{}))if(!/^[a-z0-9:_-]{1,100}$/i.test(key)||!validOverride(o))issues.push('Invalid visual region '+key);
 return issues;
}
export function layoutRegionMetadata(canvas){
 const zones=[];
 for(const [selector,label] of ZONES){
  canvas.querySelectorAll(selector).forEach(el=>{
   // Parent and child may be independently adjustable, but a nested region
   // always receives a stable key based on its position in the DOM.
   if(skipElement(el))return;
   const name=selector.replace(/[^a-z]+/gi,'-').replace(/^-|-$/g,'');
   const ix=zones.filter(z=>z.selector===selector).length;
   const id=name+':'+ix;
   zones.push({id,label:el.classList.contains('functional-slot')?el.querySelector('b')?.textContent?.trim()||label:el.classList.contains('method-slot')?el.querySelector('strong')?.textContent?.trim()||label:label,selector,el});
  });
 }
 return zones;
}
export function applyLayoutOverrides(canvas,screen){
 if(!canvas||!screen)return [];
 const list=layoutRegionMetadata(canvas);
 const regions=screen.visualLayout?.regions||{};
 const baseWidth=Math.max(1,canvas.getBoundingClientRect().width);
 for(const {id,el} of list){
  el.dataset.layoutRegion=id;
  el.classList.add('layout-adjustable');
  const o=regions[id];
  if(!validOverride(o))continue;
  const scale=baseWidth/o.base;
  el.style.transform='translate('+Math.round(o.dx*scale)+'px,'+Math.round(o.dy*scale)+'px)';
  el.style.width=Math.round(o.width*scale)+'px';
  el.style.height=Math.round(o.height*scale)+'px';
  el.style.minWidth='0';
  el.style.minHeight='0';
  el.style.position='relative';
  el.style.zIndex='3';
 }
 return list;
}
export function resetLayout(screen){if(!screen)return false;delete screen.visualLayout;return true;}
export function layoutSnapshot(screen){return cloneLayout(screen?.visualLayout||{schemaVersion:LAYOUT_SCHEMA,regions:{}})}
export function saveRegionOverride(screen,id,entry){
 if(!screen||!/^[a-z0-9:_-]{1,100}$/i.test(id)||!validOverride(entry))return false;
 if(!screen.visualLayout)screen.visualLayout={schemaVersion:LAYOUT_SCHEMA,regions:{}};
 screen.visualLayout.regions[id]={...entry};return true;
}
export function mountLayoutEditor(canvas,screen,{enabled=false,onChange=()=>{},onSelection=()=>{}}={}){
 if(!canvas)return ()=>{};
 const zones=applyLayoutOverrides(canvas,screen),edit=!!enabled;
 canvas.classList.toggle('layout-edit-mode',edit);
 const cleanups=[];
 if(!edit)return ()=>{};
 for(const z of zones){
  const el=z.el;
  const handle=document.createElement('span');
  handle.className='layout-resize-handle';handle.title='Resize region';handle.setAttribute('aria-hidden','true');
  el.appendChild(handle);
  const startPointer=(event,resize)=>{
   if(event.button!==0||!event.isPrimary)return;
   if(!resize&&event.target.closest('button,input,textarea,select,a,[contenteditable]'))return;
   event.preventDefault();event.stopPropagation();
   const frame=canvas.getBoundingClientRect(),r=el.getBoundingClientRect(),base=Math.max(1,frame.width);
   const before=layoutSnapshot(screen);
   const existing=screen.visualLayout?.regions?.[z.id];
   const prev=validOverride(existing)?{...existing}:{dx:0,dy:0,width:r.width,height:r.height,base};
   const ratio=base/prev.base;
   const initial={dx:prev.dx*ratio,dy:prev.dy*ratio,width:prev.width*ratio,height:prev.height*ratio};
   const sx=event.clientX,sy=event.clientY;
   const pointer=event.pointerId;
   const update=ev=>{
    if(ev.pointerId!==pointer)return;
    const mx=ev.clientX-sx,my=ev.clientY-sy;
    // Work in current preview units; clamp to the 16:9 frame.
    let dx=initial.dx,dy=initial.dy,w=initial.width,h=initial.height;
    if(resize){
     w=cap(initial.width+mx,80,Math.max(80,frame.right-r.left-10));
     h=cap(initial.height+my,54,Math.max(54,frame.bottom-r.top-10));
    }else{
     dx=initial.dx+cap(mx,frame.left+8-r.left,frame.right-8-r.right);
     dy=initial.dy+cap(my,frame.top+8-r.top,frame.bottom-8-r.bottom);
    }
    el.style.transform='translate('+Math.round(dx)+'px,'+Math.round(dy)+'px)';
    el.style.width=Math.round(w)+'px';el.style.height=Math.round(h)+'px';
    el.style.position='relative';el.style.zIndex='3';el.style.minWidth='0';el.style.minHeight='0';
    const pending={dx,dy,width:w,height:h,base};
    el.__layoutPending=pending;
   };
   const end=ev=>{
    if(ev.pointerId!==pointer)return;
    el.removeEventListener('pointermove',update);el.removeEventListener('pointerup',end);el.removeEventListener('pointercancel',end);
    if(el.hasPointerCapture?.(pointer))el.releasePointerCapture(pointer);
    const entry=el.__layoutPending;delete el.__layoutPending;
    if(entry&&saveRegionOverride(screen,z.id,entry))onChange(before);
   };
   el.setPointerCapture?.(pointer);
   el.addEventListener('pointermove',update);el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);
   onSelection({id:z.id,label:z.label});
  };
  const drag=e=>startPointer(e,false),resize=e=>startPointer(e,true);
  el.addEventListener('pointerdown',drag);handle.addEventListener('pointerdown',resize);
  cleanups.push(()=>{el.removeEventListener('pointerdown',drag);handle.removeEventListener('pointerdown',resize);handle.remove()});
 }
 return ()=>cleanups.forEach(f=>f());
}
export function createLayoutHistory(){
 const perSlide=new Map();
 function change(screen,before){
  const id=screen.id,record=perSlide.get(id)||{past:[],future:[]};
  record.past.push(cloneLayout(before));if(record.past.length>MAX_HISTORY)record.past.shift();
  record.future=[];perSlide.set(id,record);
 }
 function navigate(screen,direction){
  const r=perSlide.get(screen.id),src=direction==='undo'?r?.past:r?.future,dst=direction==='undo'?r?.future:r?.past;
  if(!src?.length)return false;
  dst.push(layoutSnapshot(screen));
  screen.visualLayout=src.pop();
  perSlide.set(screen.id,r);
  return true;
 }
 return {change,undo:screen=>navigate(screen,'undo'),redo:screen=>navigate(screen,'redo')};
}
