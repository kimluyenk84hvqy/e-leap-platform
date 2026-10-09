const API='/api/research';
async function req(path,options={}){
  const r=await fetch(`${API}${path}`,{credentials:'same-origin',...options,headers:{'Content-Type':'application/json',...(options.headers||{})}});
  let data=null;try{data=await r.json()}catch{}
  if(!r.ok){
    const e=new Error(data?.detail||data?.error||`Request failed (${r.status})`);
    e.detail=data?.detail||null;e.code=data?.code||null;e.status=r.status;
    throw e;
  }
  return data;
}
const qs=o=>{const p=new URLSearchParams();Object.entries(o||{}).forEach(([k,v])=>{if(v!==''&&v!=null)p.set(k,String(v))});return p.toString()};
export const R4Live={
  bootstrap:()=>req('/bootstrap',{method:'POST',body:'{}'}),
  getClasses:(q={})=>req(`/classes?${qs(q)}`),
  createClass:(body)=>req('/classes',{method:'POST',body:JSON.stringify(body)}),
  getSessions:(q={})=>req(`/sessions?${qs(q)}`),
  createSession:(body)=>req('/sessions',{method:'POST',body:JSON.stringify(body)}),
  updateSession:(body)=>req('/sessions',{method:'PATCH',body:JSON.stringify(body)}),
  join:(body)=>req('/participants',{method:'POST',body:JSON.stringify(body)}),
  participants:(sessionId)=>req(`/participants?${qs({sessionId})}`),
  events:(q={})=>req(`/events?${qs(q)}`),
  sendEvent:(body)=>req('/events',{method:'POST',body:JSON.stringify(body)})
};
