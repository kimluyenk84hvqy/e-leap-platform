(()=>{
'use strict';

/*
  Catalog compatibility patch only.
  It does NOT draw cards or change the Courses layout.
  It only restores/adds shell data before the normal E-LEAP app renders it.
*/
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

    const life=byId('life-intermediate');
    if(life) life.status='published';
    else add({id:'life-intermediate',parentId:'coursebooks',name:'Life Intermediate',type:'course',order:3,status:'published'});

    add({id:'life-intermediate-u01',parentId:'life-intermediate',name:'Unit 1 · Lifestyle',type:'unit',order:1,status:'published'});
    add({id:'life-u01-l03',parentId:'life-intermediate-u01',name:'Unit 1E & 1F · Personal Information & My Local Park',type:'lesson',order:3,status:'approved'});

    /* Restore the B1 course that existed in the earlier E-LEAP catalog. */
    add({id:'objectives-b1',parentId:'coursebooks',name:'Objectives B1 · Objective PET',type:'course',order:1,status:'published'});
    add({id:'objectives-b1-u01',parentId:'objectives-b1',name:'Unit 1 · A Question of Sport',type:'unit',order:1,status:'published'});

    const b2=byId('objective-first-b2');
    if(b2) b2.order=2;
    const lifeCourse=byId('life-intermediate');
    if(lifeCourse) lifeCourse.order=3;

    const body=JSON.stringify(data);
    return new Response(body,{status:response.status,statusText:response.statusText,headers:{'Content-Type':'application/json; charset=utf-8'}});
  }catch(_){
    return response;
  }
};
})();
