/* E-LEAP course extension: Objective PET B1
 * Adds a new course shell without modifying the master shells.json file.
 * Structure mirrors Objective First B2: Course -> Unit -> Lesson.
 * Lesson shells start hidden until PET B1 content is authored/published.
 */
(function installObjectivePetB1CourseExtension(){
  const nativeFetch=window.fetch.bind(window);
  const extensionShells=[
    {
      id:'objective-pet-b1',
      parentId:'coursebooks',
      name:'Objective PET B1',
      type:'course',
      order:1.5,
      status:'published'
    },
    {
      id:'objective-pet-b1-u01',
      parentId:'objective-pet-b1',
      name:'Unit 1',
      type:'unit',
      order:1,
      status:'published'
    },
    {
      id:'objective-pet-b1-u01-l01',
      parentId:'objective-pet-b1-u01',
      name:'U1.1',
      type:'lesson',
      order:1,
      status:'hidden'
    },
    {
      id:'objective-pet-b1-u01-l02',
      parentId:'objective-pet-b1-u01',
      name:'U1.2',
      type:'lesson',
      order:2,
      status:'hidden'
    }
  ];

  window.fetch=async function(input,init){
    const url=typeof input==='string'?input:(input&&input.url)||'';
    const response=await nativeFetch(input,init);
    if(!response.ok || !/(^|\/)data\/shells\.json(?:[?#]|$)/.test(url))return response;

    try{
      const data=await response.clone().json();
      if(!Array.isArray(data?.shells))return response;
      const existing=new Set(data.shells.map(x=>x?.id));
      const additions=extensionShells.filter(x=>!existing.has(x.id));
      const merged={...data,shells:[...data.shells,...additions]};
      const headers=new Headers(response.headers);
      headers.set('Content-Type','application/json; charset=utf-8');
      return new Response(JSON.stringify(merged),{
        status:response.status,
        statusText:response.statusText,
        headers
      });
    }catch(_){
      return response;
    }
  };
})();
