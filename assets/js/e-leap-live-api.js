(() => {
  const cfg = window.ELEAP_LIVE_CONFIG || {};
  function assertConfig(){
    if(!cfg.SUPABASE_URL || !cfg.SUPABASE_PUBLISHABLE_KEY ||
       cfg.SUPABASE_PUBLISHABLE_KEY.includes("PASTE_")){
      throw new Error("E-LEAP Live is not configured.");
    }
  }
  async function rpc(name, body={}){
    assertConfig();
    const res = await fetch(`${cfg.SUPABASE_URL}/rest/v1/rpc/${name}`,{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "apikey":cfg.SUPABASE_PUBLISHABLE_KEY,
        "Authorization":`Bearer ${cfg.SUPABASE_PUBLISHABLE_KEY}`
      },
      body:JSON.stringify(body)
    });
    const text=await res.text();
    let data=null; try{data=text?JSON.parse(text):null}catch{data=text}
    if(!res.ok) throw new Error(data?.message || data?.hint || data?.details || String(data||res.statusText));
    return data;
  }
  const code=x=>String(x||"").trim().toUpperCase();
  window.ELeapLive={
    config:cfg,
    createSession:(teacherName)=>rpc("eleap_create_session",{p_lesson_id:cfg.LESSON_ID,p_teacher_name:teacherName}),
    joinSession:(joinCode,displayName)=>rpc("eleap_join_session",{p_join_code:code(joinCode),p_display_name:displayName}),
    getClassState:({joinCode})=>rpc("eleap_get_class_state",{p_join_code:code(joinCode)}),
    setClassStatus:({joinCode,teacherToken,status})=>rpc("eleap_set_class_status",{
      p_join_code:code(joinCode),p_teacher_token:teacherToken,p_status:status
    }),
    goToScreen:({joinCode,teacherToken,screenId})=>rpc("eleap_go_to_screen",{
      p_join_code:code(joinCode),p_teacher_token:teacherToken,p_screen_id:screenId
    }),
    getActivityState:({joinCode,screenId})=>rpc("eleap_get_activity_state",{
      p_join_code:code(joinCode),p_screen_id:screenId
    }),
    controlActivity:({joinCode,teacherToken,screenId,action,seconds})=>rpc("eleap_control_activity",{
      p_join_code:code(joinCode),p_teacher_token:teacherToken,p_screen_id:screenId,p_action:action,p_seconds:Number(seconds||0)
    }),
    submitResponse:({joinCode,participantId,participantToken,screenId,optionValue,explanation,responseType="text",audioPath=null,audioDurationSeconds=null})=>rpc("eleap_submit_response_v14",{
      p_join_code:code(joinCode),p_participant_id:participantId,p_participant_token:participantToken,
      p_screen_id:screenId,p_option_value:optionValue,p_explanation:explanation,
      p_response_type:responseType,p_audio_path:audioPath,p_audio_duration_seconds:audioDurationSeconds
    }),
    uploadResponseAudio:async({joinCode,participantId,participantToken,screenId,blob})=>{
      assertConfig();
      const form=new FormData();
      form.append("join_code",code(joinCode)); form.append("participant_id",participantId);
      form.append("participant_token",participantToken); form.append("screen_id",screenId);
      form.append("file",blob,`response-${Date.now()}.webm`);
      const res=await fetch(`${cfg.SUPABASE_URL}/functions/v1/upload-response-audio`,{
        method:"POST",headers:{"apikey":cfg.SUPABASE_PUBLISHABLE_KEY,"Authorization":`Bearer ${cfg.SUPABASE_PUBLISHABLE_KEY}`},body:form
      });
      const data=await res.json().catch(()=>null);
      if(!res.ok) throw new Error(data?.error||"Audio upload failed");
      return data;
    },
    getTeacherWall:({joinCode,teacherToken,screenId})=>rpc("eleap_get_teacher_wall_v14",{
      p_join_code:code(joinCode),p_teacher_token:teacherToken,p_screen_id:screenId
    }),
    getResponseAudioUrl:async({joinCode,teacherToken,responseId})=>{
      assertConfig();
      const res=await fetch(`${cfg.SUPABASE_URL}/functions/v1/get-response-audio-url`,{
        method:"POST",
        headers:{"Content-Type":"application/json","apikey":cfg.SUPABASE_PUBLISHABLE_KEY,"Authorization":`Bearer ${cfg.SUPABASE_PUBLISHABLE_KEY}`},
        body:JSON.stringify({join_code:code(joinCode),teacher_token:teacherToken,response_id:responseId})
      });
      const data=await res.json().catch(()=>null);
      if(!res.ok) throw new Error(data?.error||"Could not open audio");
      return data;
    },
    getTeacherStats:({joinCode,teacherToken,screenId})=>rpc("eleap_get_teacher_stats",{
      p_join_code:code(joinCode),p_teacher_token:teacherToken,p_screen_id:screenId
    }),
    closeSession:({joinCode,teacherToken})=>rpc("eleap_close_session",{
      p_join_code:code(joinCode),p_teacher_token:teacherToken
    })
  };
})();
