import {learnerBlockReady} from './learner-preview-policy.js';
const sharedTypes=new Set(['text','image','audio','video','vocabulary','grammar-note']);
export function createComposite(raw){
 if(!raw.composite||raw.comboId||raw.certified)throw Error('Composite conflicts with another template.');
 const steps=raw.composite.steps;
 if(!Array.isArray(steps)||steps.length<2||steps.length>12)throw Error('Composite requires 2–12 steps.');
 const seen=new Set();const text=(x,n)=>{if(typeof x!=='string'||!x.trim()||x.length>n)throw Error('Invalid composite text.');return x;};
 const defs=steps.map(s=>{if(typeof s.id!=='string'||! /^[a-z][a-z0-9-]{0,39}$/.test(s.id)||seen.has(s.id))throw Error('Invalid or duplicate composite step.');seen.add(s.id);return {id:s.id,label:text(s.label,80),instruction:text(s.instruction,500)};});
 for(const b of raw.blocks||[]){if(b.comboStep&&!seen.has(b.comboStep))throw Error('Unknown composite step.');if(!b.comboStep&&!sharedTypes.has(b.type))throw Error('Shared composite blocks must be content.');}
 for(const s of defs)if(!(raw.blocks||[]).some(b=>b.comboStep===s.id&&learnerBlockReady(b)))throw Error('Empty composite step: '+s.id);
 return {schemaVersion:2,activeStep:defs[0].id,steps:defs};
}
