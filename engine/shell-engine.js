/* E-LEAP Shell Engine — pure data operations. Persistence is deliberately separate. */
window.ELEAPShellEngine={
 children(shells,parentId){return shells.filter(x=>x.parentId===parentId).sort((a,b)=>(a.order||0)-(b.order||0));},
 add(shells,node){if(!node?.id||!node?.name)throw new Error('Shell id and name are required');if(shells.some(x=>x.id===node.id))throw new Error('Shell id already exists');return [...shells,{status:'planned',order:999,...node}];},
 rename(shells,id,name){return shells.map(x=>x.id===id?{...x,name}:x);},
 move(shells,id,parentId,order=999){if(id===parentId)throw new Error('A shell cannot contain itself');return shells.map(x=>x.id===id?{...x,parentId,order}:x);},
 reorder(shells,id,order){return shells.map(x=>x.id===id?{...x,order}:x);},
 setStatus(shells,id,status){return shells.map(x=>x.id===id?{...x,status}:x);},
 archive(shells,id){return this.setStatus(shells,id,'archived');},
 removePlacement(shells,id){const hasChildren=shells.some(x=>x.parentId===id);if(hasChildren)throw new Error('Move or archive child shells first');return shells.filter(x=>x.id!==id);}
};
