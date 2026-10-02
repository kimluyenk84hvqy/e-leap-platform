/* E-LEAP Visual Shell Manager — local admin preview adapter.
   Production persistence must be authenticated/server-side. Stable shell IDs never change on rename. */
window.ELEAPShellManager={
 key:'e-leap-shell-overrides-v1',
 load(base){let s=structuredClone(base);try{const o=JSON.parse(localStorage.getItem(this.key)||'{}');if(o.shells)s=o.shells}catch{}return s},
 save(shells){localStorage.setItem(this.key,JSON.stringify({shells,updatedAt:new Date().toISOString()}));},
 slug(name){return String(name).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')},
 add(shells,parentId,name,type='module'){const id=`custom-${this.slug(name)}-${Date.now().toString(36)}`;const siblings=shells.filter(x=>x.parentId===parentId);shells.push({id,parentId,name,type,order:siblings.length+1,status:'published',custom:true});this.save(shells);return id},
 rename(shells,id,name){const x=shells.find(x=>x.id===id);if(x){x.name=name;this.save(shells)}},
 move(shells,id,parentId){let p=parentId;while(p){if(p===id)throw new Error('Move would create a cycle');p=shells.find(x=>x.id===p)?.parentId}const x=shells.find(x=>x.id===id);if(x){x.parentId=parentId;x.order=shells.filter(y=>y.parentId===parentId).length+1;this.save(shells)}},
 reorder(shells,id,delta){const x=shells.find(x=>x.id===id);if(!x)return;const sib=shells.filter(y=>y.parentId===x.parentId&&y.status!=='archived').sort((a,b)=>a.order-b.order);const i=sib.findIndex(y=>y.id===id),j=Math.max(0,Math.min(sib.length-1,i+delta));if(i===j)return;[sib[i].order,sib[j].order]=[sib[j].order,sib[i].order];this.save(shells)},
 status(shells,id,status){const x=shells.find(x=>x.id===id);if(x){x.status=status;this.save(shells)}},
 reset(){localStorage.removeItem(this.key)}
};