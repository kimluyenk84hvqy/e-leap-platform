(function(){
  window.ELEAPCourseShellExtensionReady=(async function(){
    try{
      const r=await fetch('data/course-shells.json',{cache:'no-store'});
      if(!r.ok)throw new Error(`course-shells.json: ${r.status}`);
      const ext=await r.json();
      const mgr=window.ELEAPShellManager;
      if(!mgr||typeof mgr.load!=='function')throw new Error('ELEAPShellManager.load unavailable');
      if(mgr.__courseShellExtensionInstalled)return true;
      const baseLoad=mgr.load.bind(mgr);
      mgr.load=function(baseShells){
        const byId=new Map((baseShells||[]).map(x=>[x.id,x]));
        (ext.shells||[]).forEach(x=>byId.set(x.id,x));
        return baseLoad([...byId.values()]);
      };
      mgr.__courseShellExtensionInstalled=true;
      return true;
    }catch(err){
      console.error('Course shell extension failed to load',err);
      return false;
    }
  })();
})();
