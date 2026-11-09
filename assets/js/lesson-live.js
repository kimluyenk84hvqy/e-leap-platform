(() => {
  const $ = (s, root=document) => root.querySelector(s);
  const cfg = window.ELEAP_LIVE_CONFIG || {};
  const screens = cfg.SCREENS || [];
  const state = {session:null,classState:null,statsTimer:null,screenSyncTimer:null,lastScreenId:null,
    statsBusy:false,screenBusy:false,pollErrors:0,pollEpoch:0}; 
  const canPoll=()=>!!state.session && state.classState?.class_status!=="ended" &&
    !document.hidden && navigator.onLine!==false;
  const stopBackgroundRefresh=()=>{
    state.pollEpoch++;
    clearTimeout(state.statsTimer);
    clearTimeout(state.screenSyncTimer);
    state.statsTimer=null;
    state.screenSyncTimer=null;
  };

  function getCurrentScreenId(){
    const counter = $("#classroomCounter")?.textContent || `1 / ${screens.length||16}`;
    const n = parseInt(counter, 10) || 1;
    return screens.find(s => s.n === n)?.id || `s${String(n).padStart(2,"0")}`;
  }
  function getCurrentScreenNumber(){
    const counter = $("#classroomCounter")?.textContent || `1 / ${screens.length||16}`;
    return parseInt(counter, 10) || 1;
  }
  function studentUrl(code){
    const u = new URL("student.html", location.href);
    u.searchParams.set("code", code);
    if(cfg.RESOURCE_ID)u.searchParams.set("lesson",cfg.RESOURCE_ID);
    return u.toString();
  }
  function setModal(open){const modal=$("#lessonLiveModal");if(!modal)return;modal.hidden=!open;document.body.classList.toggle("lesson-live-modal-open",open)}
  function persistentPanel(){return $("#lessonPersistentJoinPanel")}
  function showPersistentPanel(force=true){const panel=persistentPanel();if(!panel||!state.session)return;panel.hidden=!force}
  function updatePersistentPanel(){
    if(!state.session)return;const panel=persistentPanel();if(!panel)return;
    $("#lessonPersistentCode").textContent=state.session.join_code;
    $("#lessonPersistentQr").src=`https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=0&data=${encodeURIComponent(studentUrl(state.session.join_code))}`;
    const joined=$("#lessonLiveJoinedCount")?.textContent||"0";$("#lessonPersistentJoined").textContent=joined;
    const status=state.classState?.class_status||"lobby";$("#lessonPersistentState").textContent=status==="live"?"Live":status==="ended"?"Ended":"Lobby";
    const start=$("#lessonPersistentStart");if(start){start.textContent=status==="live"?"Pause Class":"Start Teaching";start.disabled=status==="ended"}
    panel.classList.toggle("compact",status==="live");
  }
  function updateTopBar(){
    const btn=$("#lessonLiveButton"),resp=$("#lessonResponsesButton"),status=$("#lessonLiveStatus");
    if(!state.session){if(btn){btn.hidden=false;btn.textContent="Start Class"}if(resp)resp.hidden=true;if(status)status.hidden=true;return}
    if(btn){btn.hidden=false;btn.textContent=state.classState?.class_status==="live"?"Class Controls":"Join Class"}
    if(resp)resp.hidden=false;
    if(status){status.hidden=false;const joined=$("#lessonLiveJoinedCount")?.textContent||"0";const live=state.classState?.class_status==="live";status.innerHTML=`${live?"● Live":"● Lobby"} · <b>${joined}</b> joined`;status.classList.toggle("is-live",live)}
    updatePersistentPanel();
  }
  async function refreshClassState(){
    if(!canPoll())return;
    try{const raw=await ELeapLive.getClassState({joinCode:state.session.join_code});const cs=Array.isArray(raw)?raw[0]:raw;state.classState=cs;
      if(cs?.class_status==='ended')stopBackgroundRefresh();
      const label=$("#lessonLiveClassState");if(label){if(cs.class_status==="live")label.textContent="Live class · Students follow your screen";else if(cs.class_status==="ended")label.textContent="Class ended";else label.textContent="Lobby · Students can join now"}
      const start=$("#lessonLiveStartClass");if(start){start.textContent=cs.class_status==="live"?"Pause Class":"Start Class";start.disabled=cs.class_status==="ended"}
      updateTopBar();updatePersistentPanel();
    }catch(err){console.error("E-LEAP class-state error",err)}
  }
  async function refreshJoinedCount(){
    if(!canPoll())return;
    try{const raw=await ELeapLive.getTeacherStats({joinCode:state.session.join_code,teacherToken:state.session.teacher_token,screenId:getCurrentScreenId()});const stats=Array.isArray(raw)?raw[0]:raw;const count=stats?.joined_count??0;const el=$("#lessonLiveJoinedCount");if(el)el.textContent=count;updateTopBar();updatePersistentPanel()}catch(err){console.error("E-LEAP stats error",err)}
  }
  async function syncScreenToStudents(){
    if(!canPoll()||state.screenBusy)return;
    const screenId=getCurrentScreenId();
    if(screenId===state.lastScreenId)return;
    state.screenBusy=true;
    try{
      await ELeapLive.goToScreen({joinCode:state.session.join_code,teacherToken:state.session.teacher_token,screenId});
      state.lastScreenId=screenId;
      const sync=$("#lessonLiveScreenSync");
      if(sync)sync.textContent=`Slide ${getCurrentScreenNumber()} synced`;
    }catch(err){console.error("E-LEAP screen-sync error",err)}
    finally{
      state.screenBusy=false;
      // A slide change while the previous request was in flight must still reach students.
      if(canPoll()&&getCurrentScreenId()!==state.lastScreenId)queueMicrotask(syncScreenToStudents);
    }
  }
  function showSessionInModal(){if(!state.session)return;$("#lessonLiveCreateView").hidden=true;$("#lessonLiveSessionView").hidden=false;$("#lessonLiveJoinCode").textContent=state.session.join_code;$("#lessonLiveQr").src=`https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=0&data=${encodeURIComponent(studentUrl(state.session.join_code))}`;refreshClassState();refreshJoinedCount()}
  async function createSession(){
    const teacher=$("#lessonLiveTeacherName").value.trim(),status=$("#lessonLiveCreateStatus");if(!teacher){status.textContent="Enter the teacher name first.";return}status.textContent="Creating class session…";
    try{stopBackgroundRefresh();const raw=await ELeapLive.createSession(teacher);state.session=Array.isArray(raw)?raw[0]:raw;localStorage.setItem("eleap_teacher_session",JSON.stringify({...state.session,lesson_id:cfg.LESSON_ID,resource_id:cfg.RESOURCE_ID}));status.textContent="";showSessionInModal();showPersistentPanel(true);setModal(false);updatePersistentPanel();startBackgroundRefresh()}catch(err){status.textContent=err.message}
  }
  async function toggleClass(){if(!state.session)return;const next=state.classState?.class_status==="live"?"lobby":"live";try{const raw=await ELeapLive.setClassStatus({joinCode:state.session.join_code,teacherToken:state.session.teacher_token,status:next});state.classState=Array.isArray(raw)?raw[0]:raw;if(next==="live")ELeapSound?.start?.();await syncScreenToStudents();await refreshClassState()}catch(err){alert(err.message)}}
  function openWall(){const u=new URL("teacher-live.html",location.href);if(cfg.RESOURCE_ID)u.searchParams.set("lesson",cfg.RESOURCE_ID);window.open(u.toString(),"_blank")}
  async function copyStudentLink(){if(!state.session)return;await navigator.clipboard.writeText(studentUrl(state.session.join_code));const b=$("#lessonLiveCopyLink"),old=b.textContent;b.textContent="Copied";setTimeout(()=>b.textContent=old,1000)}
  function startBackgroundRefresh(){
    stopBackgroundRefresh();
    if(!canPoll())return;
    const epoch=state.pollEpoch;
    const refresh=async()=>{
      if(epoch!==state.pollEpoch||!canPoll())return;
      // Avoid overlapping stats RPCs even when responses are slow.
      if(!state.statsBusy){
        state.statsBusy=true;
        try{
          await Promise.all([refreshClassState(),refreshJoinedCount()]);
          state.pollErrors=0;
        }catch(_){state.pollErrors=Math.min(state.pollErrors+1,5)}
        finally{state.statsBusy=false}
      }
      if(epoch!==state.pollEpoch||!canPoll())return;
      const base=state.classState?.class_status==='live'
        ? Math.max(1500,Number(cfg.POLL_MS)||1200)
        : 5000;
      state.statsTimer=setTimeout(refresh,Math.min(30000,base*Math.pow(2,state.pollErrors)));
    };
    const screenTick=async()=>{
      if(epoch!==state.pollEpoch||!canPoll())return;
      await syncScreenToStudents();
      if(epoch===state.pollEpoch&&canPoll())state.screenSyncTimer=setTimeout(screenTick,1200);
    };
    state.statsTimer=setTimeout(refresh,0);
    state.screenSyncTimer=setTimeout(screenTick,500);
  }
  function restoreSession(){
    try{const saved=JSON.parse(localStorage.getItem("eleap_teacher_session")||"null");if(saved?.join_code&&saved?.teacher_token&&(!saved.resource_id||saved.resource_id===cfg.RESOURCE_ID)){state.session=saved;showSessionInModal();showPersistentPanel(true);updatePersistentPanel();startBackgroundRefresh()}}catch{}updateTopBar();
  }
  document.addEventListener("DOMContentLoaded",()=>{
    $("#lessonLiveButton")?.addEventListener("click",()=>{if(state.session){showPersistentPanel(true);updatePersistentPanel()}else setModal(true)});
    $("#lessonResponsesButton")?.addEventListener("click",openWall);$("#lessonLiveCreateSession")?.addEventListener("click",createSession);$("#lessonLiveStartClass")?.addEventListener("click",toggleClass);$("#lessonLiveCopyLink")?.addEventListener("click",copyStudentLink);$("#lessonLiveOpenWall")?.addEventListener("click",openWall);$("#lessonPersistentCopy")?.addEventListener("click",copyStudentLink);$("#lessonPersistentStart")?.addEventListener("click",toggleClass);$("#lessonPersistentHide")?.addEventListener("click",()=>showPersistentPanel(false));
    document.querySelectorAll("[data-live-close]").forEach(el=>el.addEventListener("click",()=>setModal(false)));
    $("#classroomPrev")?.addEventListener("click",()=>setTimeout(syncScreenToStudents,50));
    $("#classroomNext")?.addEventListener("click",()=>setTimeout(syncScreenToStudents,50));
    document.addEventListener('visibilitychange',()=>{if(document.hidden)stopBackgroundRefresh();else startBackgroundRefresh()});
    window.addEventListener('offline',stopBackgroundRefresh);
    window.addEventListener('online',startBackgroundRefresh);
    window.addEventListener('pagehide',stopBackgroundRefresh);
    restoreSession();
  });
})();
