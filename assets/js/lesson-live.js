(() => {
  const $ = (s, root=document) => root.querySelector(s);
  const cfg = window.ELEAP_LIVE_CONFIG || {};
  const screens = cfg.SCREENS || [];
  const state = {
    session: null,
    classState: null,
    statsTimer: null,
    screenSyncTimer: null,
    lastScreenId: null
  };

  function getCurrentScreenId(){
    const counter = $("#classroomCounter")?.textContent || "1 / 16";
    const n = parseInt(counter, 10) || 1;
    return screens.find(s => s.n === n)?.id || `s${String(n).padStart(2,"0")}`;
  }

  function getCurrentScreenNumber(){
    const counter = $("#classroomCounter")?.textContent || "1 / 16";
    return parseInt(counter, 10) || 1;
  }

  function studentUrl(code){
    const u = new URL("student.html", location.href);
    u.searchParams.set("code", code);
    return u.toString();
  }

  function setModal(open){
    const modal = $("#lessonLiveModal");
    if(!modal) return;
    modal.hidden = !open;
    document.body.classList.toggle("lesson-live-modal-open", open);
  }


  function persistentPanel(){
    return $("#lessonPersistentJoinPanel");
  }

  function showPersistentPanel(force=true){
    const panel = persistentPanel();
    if(!panel || !state.session) return;
    panel.hidden = !force;
  }

  function updatePersistentPanel(){
    if(!state.session) return;
    const panel = persistentPanel();
    if(!panel) return;

    $("#lessonPersistentCode").textContent = state.session.join_code;
    $("#lessonPersistentQr").src =
      `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=0&data=${encodeURIComponent(studentUrl(state.session.join_code))}`;

    const joined = $("#lessonLiveJoinedCount")?.textContent || "0";
    $("#lessonPersistentJoined").textContent = joined;

    const status = state.classState?.class_status || "lobby";
    $("#lessonPersistentState").textContent =
      status === "live" ? "Live" : status === "ended" ? "Ended" : "Lobby";

    const start = $("#lessonPersistentStart");
    if(start){
      start.textContent = status === "live" ? "Pause Class" : "Start Teaching";
      start.disabled = status === "ended";
    }

    panel.classList.toggle("compact", status === "live");
  }

  function updateTopBar(){
    const btn = $("#lessonLiveButton");
    const resp = $("#lessonResponsesButton");
    const status = $("#lessonLiveStatus");
    if(!state.session){
      if(btn){ btn.hidden=false; btn.textContent="Start Class"; }
      if(resp) resp.hidden=true;
      if(status) status.hidden=true;
      return;
    }

    if(btn){
      btn.hidden=false;
      btn.textContent = state.classState?.class_status === "live" ? "Class Controls" : "Join Class";
    }
    if(resp) resp.hidden=false;
    if(status){
      status.hidden=false;
      const joined = $("#lessonLiveJoinedCount")?.textContent || "0";
      const live = state.classState?.class_status === "live";
      status.innerHTML = `${live ? "● Live" : "● Lobby"} · <b>${joined}</b> joined`;
      status.classList.toggle("is-live", live);
    }
    updatePersistentPanel();
  }

  async function refreshClassState(){
    if(!state.session) return;
    try{
      const raw = await ELeapLive.getClassState({joinCode:state.session.join_code});
      const cs = Array.isArray(raw) ? raw[0] : raw;
      state.classState = cs;
      const label = $("#lessonLiveClassState");
      if(label){
        if(cs.class_status === "live") label.textContent = "Live class · Students follow your screen";
        else if(cs.class_status === "ended") label.textContent = "Class ended";
        else label.textContent = "Lobby · Students can join now";
      }
      const start = $("#lessonLiveStartClass");
      if(start){
        start.textContent = cs.class_status === "live" ? "Pause Class" : "Start Class";
        start.disabled = cs.class_status === "ended";
      }
      updateTopBar();
      updatePersistentPanel();
    }catch(err){
      console.error("E-LEAP class-state error", err);
    }
  }

  async function refreshJoinedCount(){
    if(!state.session) return;
    try{
      const raw = await ELeapLive.getTeacherStats({
        joinCode:state.session.join_code,
        teacherToken:state.session.teacher_token,
        screenId:getCurrentScreenId()
      });
      const stats = Array.isArray(raw) ? raw[0] : raw;
      const count = stats?.joined_count ?? 0;
      const el = $("#lessonLiveJoinedCount");
      if(el) el.textContent = count;
      updateTopBar();
      updatePersistentPanel();
    }catch(err){
      console.error("E-LEAP stats error", err);
    }
  }

  async function syncScreenToStudents(){
    if(!state.session || state.classState?.class_status === "ended") return;
    const screenId = getCurrentScreenId();
    if(screenId === state.lastScreenId) return;
    try{
      await ELeapLive.goToScreen({
        joinCode:state.session.join_code,
        teacherToken:state.session.teacher_token,
        screenId
      });
      state.lastScreenId = screenId;
      const sync = $("#lessonLiveScreenSync");
      if(sync) sync.textContent = `Slide ${getCurrentScreenNumber()} synced`;
    }catch(err){
      console.error("E-LEAP screen-sync error", err);
    }
  }

  function showSessionInModal(){
    if(!state.session) return;
    $("#lessonLiveCreateView").hidden = true;
    $("#lessonLiveSessionView").hidden = false;
    $("#lessonLiveJoinCode").textContent = state.session.join_code;
    $("#lessonLiveQr").src =
      `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=0&data=${encodeURIComponent(studentUrl(state.session.join_code))}`;
    refreshClassState();
    refreshJoinedCount();
  }

  async function createSession(){
    const teacher = $("#lessonLiveTeacherName").value.trim();
    const status = $("#lessonLiveCreateStatus");
    if(!teacher){
      status.textContent = "Enter the teacher name first.";
      return;
    }
    status.textContent = "Creating class session…";
    try{
      const raw = await ELeapLive.createSession(teacher);
      state.session = Array.isArray(raw) ? raw[0] : raw;
      localStorage.setItem("eleap_teacher_session", JSON.stringify(state.session));
      status.textContent = "";
      showSessionInModal();
      showPersistentPanel(true);
      setModal(false);
      updatePersistentPanel();
      startBackgroundRefresh();
    }catch(err){
      status.textContent = err.message;
    }
  }

  async function toggleClass(){
    if(!state.session) return;
    const next = state.classState?.class_status === "live" ? "lobby" : "live";
    try{
      const raw = await ELeapLive.setClassStatus({
        joinCode:state.session.join_code,
        teacherToken:state.session.teacher_token,
        status:next
      });
      state.classState = Array.isArray(raw) ? raw[0] : raw;
      if(next === "live") ELeapSound?.start?.();
      await syncScreenToStudents();
      await refreshClassState();
    }catch(err){
      alert(err.message);
    }
  }

  function openWall(){
    window.open("teacher-live.html", "_blank");
  }

  async function copyStudentLink(){
    if(!state.session) return;
    await navigator.clipboard.writeText(studentUrl(state.session.join_code));
    const b = $("#lessonLiveCopyLink");
    const old = b.textContent;
    b.textContent = "Copied";
    setTimeout(()=>b.textContent=old, 1000);
  }

  function startBackgroundRefresh(){
    clearInterval(state.statsTimer);
    clearInterval(state.screenSyncTimer);

    state.statsTimer = setInterval(()=>{
      refreshClassState();
      refreshJoinedCount();
    }, cfg.POLL_MS || 1200);

    // Detect lesson-renderer slide changes without changing lesson-renderer.js.
    state.screenSyncTimer = setInterval(syncScreenToStudents, 500);
  }

  function restoreSession(){
    try{
      const saved = JSON.parse(localStorage.getItem("eleap_teacher_session") || "null");
      if(saved?.join_code && saved?.teacher_token){
        state.session = saved;
        showSessionInModal();
        showPersistentPanel(true);
        updatePersistentPanel();
        startBackgroundRefresh();
      }
    }catch{}
    updateTopBar();
  }

  document.addEventListener("DOMContentLoaded", ()=>{
    $("#lessonLiveButton")?.addEventListener("click", ()=>{
      if(state.session){
        showPersistentPanel(true);
        updatePersistentPanel();
      }else{
        setModal(true);
      }
    });

    $("#lessonResponsesButton")?.addEventListener("click", openWall);
    $("#lessonLiveCreateSession")?.addEventListener("click", createSession);
    $("#lessonLiveStartClass")?.addEventListener("click", toggleClass);
    $("#lessonLiveCopyLink")?.addEventListener("click", copyStudentLink);
    $("#lessonLiveOpenWall")?.addEventListener("click", openWall);
    $("#lessonPersistentCopy")?.addEventListener("click", copyStudentLink);
    $("#lessonPersistentStart")?.addEventListener("click", toggleClass);
    $("#lessonPersistentHide")?.addEventListener("click", ()=>showPersistentPanel(false));

    document.querySelectorAll("[data-live-close]").forEach(el =>
      el.addEventListener("click", ()=>setModal(false))
    );

    // Presentation navigation: sync shortly after renderer changes the screen.
    $("#classroomPrev")?.addEventListener("click", ()=>setTimeout(syncScreenToStudents, 50));
    $("#classroomNext")?.addEventListener("click", ()=>setTimeout(syncScreenToStudents, 50));

    restoreSession();
  });
})();
