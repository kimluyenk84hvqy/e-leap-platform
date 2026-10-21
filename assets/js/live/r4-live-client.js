const API='/api/research';
async function req(path,options={}){
  const r=await fetch(`${API}${path}`,{credentials:'same-origin',...options,headers:{'Content-Type':'application/json',...(options.headers||{})}});
  let data=null;try{data=await r.json()}catch{}
  if(!r.ok)throw new Error(data?.error||`Request failed (${r.status})`);
  return data;
}
const qs=o=>{const p=new URLSearchParams();Object.entries(o||{}).forEach(([k,v])=>{if(v!==''&&v!=null)p.set(k,String(v))});return p.toString()};
const teacherLiveKey='e-leap-teacher-live-context';
function saveTeacherSession(data,body){
  try{
    const s=data?.session;if(!s?.session_id)return data;
    localStorage.setItem(teacherLiveKey,JSON.stringify({
      sessionId:s.session_id,
      classId:s.class_id||body?.classId||null,
      lessonId:s.lesson_id||body?.lessonId||null,
      joinCode:s.join_code||null,
      status:s.status||body?.status||'active',
      updatedAt:Date.now()
    }));
    window.dispatchEvent(new CustomEvent('e-leap:teacher-live-context',{detail:JSON.parse(localStorage.getItem(teacherLiveKey)||'null')}));
  }catch(_){}
  return data;
}
function updateTeacherSession(data,body){
  try{
    const raw=JSON.parse(localStorage.getItem(teacherLiveKey)||'null');
    if(!raw)return data;
    const status=data?.session?.status||body?.status||raw.status;
    const next={...raw,status,updatedAt:Date.now()};
    if(status==='ended')localStorage.removeItem(teacherLiveKey);else localStorage.setItem(teacherLiveKey,JSON.stringify(next));
  }catch(_){}
  return data;
}
export const R4Live={
  bootstrap:()=>req('/bootstrap',{method:'POST',body:'{}'}),
  getClasses:(q={})=>req(`/classes?${qs(q)}`),
  createClass:(body)=>req('/classes',{method:'POST',body:JSON.stringify(body)}),
  getSessions:(q={})=>req(`/sessions?${qs(q)}`),
  createSession:async(body)=>saveTeacherSession(await req('/sessions',{method:'POST',body:JSON.stringify(body)}),body),
  updateSession:async(body)=>updateTeacherSession(await req('/sessions',{method:'PATCH',body:JSON.stringify(body)}),body),
  join:(body)=>req('/participants',{method:'POST',body:JSON.stringify(body)}),
  participants:(sessionId)=>req(`/participants?${qs({sessionId})}`),
  events:(q={})=>req(`/events?${qs(q)}`),
  sendEvent:(body)=>req('/events',{method:'POST',body:JSON.stringify(body)})
};
