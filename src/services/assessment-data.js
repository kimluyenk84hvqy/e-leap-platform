const API='/api/research';
async function req(path,options={}){const r=await fetch(`${API}${path}`,{credentials:'same-origin',...options,headers:{'Content-Type':'application/json',...(options.headers||{})}});let d=null;try{d=await r.json()}catch{}if(!r.ok)throw new Error(d?.error||`Assessment request failed (${r.status})`);return d}
export const AssessmentData={
  bootstrap:()=>req('/bootstrap',{method:'POST',body:'{}'}),
  assignments:q=>req(`/assignments?${new URLSearchParams(q||{})}`),
  createAssignment:b=>req('/assignments',{method:'POST',body:JSON.stringify(b)}),
  updateAssignment:b=>req('/assignments',{method:'PATCH',body:JSON.stringify(b)}),
  submissions:q=>req(`/submissions?${new URLSearchParams(q||{})}`),
  submit:b=>req('/submissions',{method:'POST',body:JSON.stringify(b)}),
  grade:b=>req('/grades',{method:'POST',body:JSON.stringify(b)}),
  exportUrl:(kind='submissions',teacherId,classId=null)=>{if(!teacherId)throw new Error('teacherId is required for research export');return `/api/research/export?kind=${encodeURIComponent(kind)}&format=csv&teacherId=${encodeURIComponent(teacherId)}${classId?`&classId=${encodeURIComponent(classId)}`:''}`}
};
