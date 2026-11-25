/* Layout-only transactions. No content generation or publication authority. */
import {E_LEAP_LAYOUT_IDS} from './layout-registry.js';
import {setVisualVariant,variantOptions} from './visual-variants.js';
import {changeCertifiedVariant} from './certified-templates.js';
const clone=x=>JSON.parse(JSON.stringify(x));
const clean=s=>{const x=clone(s);if(x.certifiedTemplate)delete x.certifiedTemplate.layoutReview;return x;};
const sig=s=>JSON.stringify(clean(s));
const eligible=s=>s?.id&&!s.resourceStage&&!s.sourceReviewDraft&&!s.methodDraft&&!s.functionalDraft;
export function previewRefinement(screen,kind,value){
 if(!eligible(screen))return {ok:false,reason:'This slide uses a dedicated editor.'};
 let next=clean(screen);
 if(kind==='certified'&&screen.certifiedTemplate){const c=changeCertifiedVariant(next.certifiedTemplate,value);if(!c)return {ok:false,reason:'Unsupported design'};next.certifiedTemplate=c;}
 else if(kind==='variant'&&!screen.certifiedTemplate){const r=setVisualVariant(next,value);if(!r.ok)return r;next=r.screen;}
 else if(kind==='layout'&&!screen.certifiedTemplate&&!variantOptions(screen.templateId)&&E_LEAP_LAYOUT_IDS.includes(value)){next.layout=value;}
 else return {ok:false,reason:'Unsupported layout change'};
 const label=s=>s.certifiedTemplate?.variant||s.visualVariant||s.layout;
 if(label(next)===label(screen)&&next.layout===screen.layout)return {ok:false,reason:'Design is unchanged'};
 // Coordinates are tied to the old composition; restore them on Undo only.
 delete next.visualLayout;
 return {ok:true,kind,value,before:clean(screen),after:next,beforeLabel:label(screen),afterLabel:label(next),clearsOverrides:!!screen.visualLayout};
}
export function createRefinementHistory(){
 const byLesson=new WeakMap();
 function records(lesson){if(!byLesson.has(lesson))byLesson.set(lesson,new Map());return byLesson.get(lesson);}
 function apply(lesson,screen,proposal){
  if(!proposal?.ok||!eligible(screen)||!lesson.screens.includes(screen)||sig(screen)!==sig(proposal.before))return {ok:false,reason:'Slide changed. Review again.'};
  const verified=previewRefinement(screen,proposal.kind,proposal.value);
  if(!verified.ok||sig(verified.after)!==sig(proposal.after))return {ok:false,reason:'Design proposal changed. Review again.'};
  const next=clean(verified.after),map=records(lesson),stack=map.get(screen.id)||[];
  stack.push({before:clean(screen),after:next});if(stack.length>10)stack.shift();map.set(screen.id,stack);
  return {ok:true,screen:clone(next)};
 }
 function undo(lesson,screen){const stack=records(lesson).get(screen.id),entry=stack?.at(-1);if(!entry||!lesson.screens.includes(screen)||sig(screen)!==sig(entry.after))return {ok:false,reason:'No safe undo for this slide; later edits are preserved.'};stack.pop();return {ok:true,screen:clean(entry.before)};}
 return {apply,undo};
}
