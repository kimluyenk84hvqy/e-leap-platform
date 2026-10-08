(()=>{
'use strict';

/* Data-only catalog compatibility. Keep the original Courses renderer/layout. */
const nativeFetch=window.fetch.bind(window);
window.fetch=async function(input,init){
  const response=await nativeFetch(input,init);
  const url=typeof input==='string'?input:(input?.url||'');
  if(!/data\/shells\.json(?:\?|$)/.test(url)) return response;

  try{
    const data=await response.clone().json();
    if(!Array.isArray(data?.shells)) return response;
    const shells=data.shells;
    const byId=id=>shells.find(x=>x.id===id);
    const add=x=>{if(!byId(x.id))shells.push(x)};
    const publish=(id,order)=>{const x=byId(id);if(x){x.status='published';if(order!=null)x.order=order;}};

    /* Restore the complete coursebook shelf used before the stabilization pass. */
    add({id:'objectives-b1',parentId:'coursebooks',name:'Objectives B1 · Objective PET',type:'course',order:1,status:'published'});
    add({id:'objectives-b1-u01',parentId:'objectives-b1',name:'Unit 1 · A Question of Sport',type:'unit',order:1,status:'published'});

    publish('objective-first-b2',2);

    if(!byId('life-intermediate')) add({id:'life-intermediate',parentId:'coursebooks',name:'Life Intermediate',type:'course',order:3,status:'published'});
    publish('life-intermediate',3);
    add({id:'life-intermediate-u01',parentId:'life-intermediate',name:'Unit 1 · Lifestyle',type:'unit',order:1,status:'published'});
    add({id:'life-u01-l03',parentId:'life-intermediate-u01',name:'Unit 1E & 1F · Personal Information & My Local Park',type:'lesson',order:3,status:'approved'});

    if(!byId('medical-english')) add({id:'medical-english',parentId:'coursebooks',name:'Medical English',type:'course',order:4,status:'published'});
    publish('medical-english',4);

    if(!byId('english-for-pharmacy')) add({id:'english-for-pharmacy',parentId:'coursebooks',name:'English for Pharmacy',type:'course',order:5,status:'published'});
    publish('english-for-pharmacy',5);

    const body=JSON.stringify(data);
    return new Response(body,{status:response.status,statusText:response.statusText,headers:{'Content-Type':'application/json; charset=utf-8'}});
  }catch(_){
    return response;
  }
};
})();
