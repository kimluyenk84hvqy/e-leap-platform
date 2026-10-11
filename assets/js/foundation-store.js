/** E-LEAP Production Foundation v1.0
 * Generic Shell + Resource operations. UI-independent by design.
 * Stable IDs survive rename/move. Resources are referenced, never copied by placement.
 */
export class ELeapFoundationStore {
  constructor(shells = [], resources = [], placements = []) {
    this.shells = structuredClone(shells);
    this.resources = structuredClone(resources);
    this.placements = structuredClone(placements);
  }
  shell(id){ return this.shells.find(x => x.id === id) ?? null; }
  resource(id){ return this.resources.find(x => x.id === id) ?? null; }
  children(parentId){ return this.shells.filter(x => x.parentId === parentId && x.status !== 'archived').sort((a,b)=>a.order-b.order); }
  createShell(shell){
    if (!shell?.id || this.shell(shell.id)) throw new Error('Shell ID must be unique.');
    if (shell.parentId !== null && !this.shell(shell.parentId)) throw new Error('Parent shell does not exist.');
    this.shells.push({...shell}); return this.shell(shell.id);
  }
  renameShell(id, name){ const x=this.#mustShell(id); x.name=String(name).trim(); return x; }
  moveShell(id, parentId, order=0){
    const x=this.#mustShell(id); if(id===parentId) throw new Error('A shell cannot contain itself.');
    if(parentId!==null) this.#mustShell(parentId);
    let p=parentId; while(p){ if(p===id) throw new Error('Move would create a cycle.'); p=this.shell(p)?.parentId ?? null; }
    x.parentId=parentId; x.order=order; return x;
  }
  reorderShell(id, order){ const x=this.#mustShell(id); x.order=order; return x; }
  archiveShell(id){ const x=this.#mustShell(id); x.status='archived'; return x; }
  addResource(resource){ if(!resource?.id || this.resource(resource.id)) throw new Error('Resource ID must be unique.'); this.resources.push({...resource}); return this.resource(resource.id); }
  placeResource(resourceId, shellId, order=0){
    this.#mustResource(resourceId); this.#mustShell(shellId);
    const id=`placement-${resourceId}-${shellId}`;
    const existing=this.placements.find(x=>x.id===id); if(existing){ existing.status='active'; existing.order=order; return existing; }
    const p={id,resourceId,shellId,order,status:'active'}; this.placements.push(p); return p;
  }
  unplaceResource(resourceId, shellId){ const p=this.placements.find(x=>x.resourceId===resourceId&&x.shellId===shellId&&x.status==='active'); if(p)p.status='archived'; return p??null; }
  resourcesIn(shellId){ return this.placements.filter(p=>p.shellId===shellId&&p.status==='active').sort((a,b)=>a.order-b.order).map(p=>this.resource(p.resourceId)); }
  #mustShell(id){ const x=this.shell(id); if(!x)throw new Error(`Unknown shell: ${id}`); return x; }
  #mustResource(id){ const x=this.resource(id); if(!x)throw new Error(`Unknown resource: ${id}`); return x; }
}
