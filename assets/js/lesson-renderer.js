
(() => {
  const q=(s,c=document)=>c.querySelector(s), qa=(s,c=document)=>[...c.querySelectorAll(s)];
  const MEDIA_SIGN_ENDPOINT="https://xfisojqahojcsfrjjxab.supabase.co/functions/v1/get-media-url";
  const mediaUrlCache=new Map();
  const state={lesson:null,index:0,selectedMatch:null,mediaMap:{}};

  async function getSignedMediaUrl(raw){
    if(!raw) return "";
    const key=String(raw).replace(/^PRIVATE_MEDIA\//,"");
    const cached=mediaUrlCache.get(key);
    if(cached && cached.expiresAt>Date.now()+60000) return cached.url;

    try{
      const res=await fetch(MEDIA_SIGN_ENDPOINT,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({path:key})
      });
      if(!res.ok) throw new Error("Signed media request failed: "+res.status);
      const data=await res.json();
      if(!data?.url) throw new Error("No signed URL returned");
      const ttl=Math.max(60,Number(data.expiresIn)||3600);
      mediaUrlCache.set(key,{url:data.url,expiresAt:Date.now()+ttl*1000});
      return data.url;
    }catch(err){
      console.error("E-LEAP private media error",key,err);
      return "";
    }
  }

  function mediaBlock(media){
    if(!media) return "";
    const items=[];
    for(const [kind,raw] of Object.entries(media)){
      const key=String(raw||"").replace(/^PRIVATE_MEDIA\//,"");
      const id="media-"+Math.random().toString(36).slice(2);
      const label=kind.toLowerCase();
      if(label==="image"){
        items.push(`<figure id="${id}" class="lesson-media-frame image-frame media-loading" data-media-kind="image" data-media-key="${key}"><div class="lesson-media-placeholder">Loading image…</div></figure>`);
      }else if(label.includes("audio")){
        items.push(`<div id="${id}" class="lesson-media-frame audio-frame media-loading" data-media-kind="audio" data-media-key="${key}"><div class="lesson-media-placeholder">Loading audio…</div></div>`);
      }else if(label==="video"){
        items.push(`<div id="${id}" class="lesson-media-frame video-frame media-loading" data-media-kind="video" data-media-key="${key}"><div class="lesson-media-placeholder">Loading video…</div></div>`);
      }
    }
    return items.join("");
  }

  async function hydrateMedia(root=document){
    const nodes=[...root.querySelectorAll("[data-media-key]")];
    await Promise.all(nodes.map(async node=>{
      const key=node.dataset.mediaKey;
      const kind=node.dataset.mediaKind;
      if(!key) return;
      const url=await getSignedMediaUrl(key);
      node.classList.remove("media-loading");
      if(!url){
        node.innerHTML='<div class="lesson-media-placeholder">Private media unavailable.</div>';
        return;
      }
      if(kind==="image"){
        node.innerHTML=`<img src="${url}" alt="" loading="lazy"/>`;
      }else if(kind==="audio"){
        node.innerHTML=`<audio controls preload="metadata" src="${url}"></audio>`;
      }else if(kind==="video"){
        node.innerHTML=`<video controls preload="metadata" playsinline src="${url}"></video>`;
      }
    }));
  }

  function revealList(items){
    return `<div class="lesson-grid">${items.map((x,i)=>`<button class="reveal-card" data-reveal="${i}" data-answer="${encodeURIComponent(x.answer||x.support||"")}"><b>${x.question||x.prompt||x.title||("Item "+(i+1))}</b></button>`).join("")}</div>`;
  }

  function renderLeadInPresentation(s){
    const response=s.responseAfterSelection?.enabled ? `
      <div class="choice-response-space" hidden>
        <div class="choice-response-label">Your choice: <b class="selected-choice-label"></b></div>
        <label class="choice-response-prompt">${s.responseAfterSelection.prompt||"Type your explanation."}</label>
        <textarea class="choice-response-input" placeholder="${s.responseAfterSelection.placeholder||"Type here..."}"></textarea>
        <div class="choice-response-actions"><button class="primary choice-submit">${s.responseAfterSelection.submitLabel||"Submit"}</button></div>
        <div class="choice-submit-status" aria-live="polite"></div>
      </div>` : "";

    return `<div class="lead-in-presentation-grid">
      <section class="lead-in-copy">
        <p class="lead-in-main-instruction">${s.instruction||""}</p>
        <div class="lead-in-question">${s.question||""}</div>
        <div class="lead-in-action-prompt">${s.interactionPrompt||"Choose one option, then type your explanation."}</div>
        <div class="lead-in-options">${s.options.map(o=>`<button class="choice-option" data-choice="${o}">${o}</button>`).join("")}</div>
        ${response}
      </section>
      <section class="lead-in-media">${mediaBlock(s.media)}</section>
    </div>`;
  }

  function renderTask(s){
    if(s.type==="quick-choice"){
      const response=s.responseAfterSelection?.enabled ? `
        <div class="choice-response-space" hidden>
          <div class="choice-response-label">Your choice: <b class="selected-choice-label"></b></div>
          <label class="choice-response-prompt">${s.responseAfterSelection.prompt||"Type your explanation."}</label>
          <textarea class="choice-response-input" placeholder="${s.responseAfterSelection.placeholder||"Type here..."}"></textarea>
          <div class="choice-response-actions"><button class="primary choice-submit">${s.responseAfterSelection.submitLabel||"Submit"}</button></div>
          <div class="choice-submit-status" aria-live="polite"></div>
        </div>` : "";
      return `${mediaBlock(s.media)}
        <div class="lesson-support"><b>${s.question}</b></div>
        ${s.interactionPrompt ? `<div class="lesson-action-prompt">${s.interactionPrompt}</div>` : ""}
        <div class="lesson-grid quick-choice-grid">${s.options.map(o=>`<button class="choice-option" data-choice="${o}">${o}</button>`).join("")}</div>
        ${response}`;
    }
    if(s.type==="questions"){
      return `<div class="lesson-grid">${s.questions.map((x,i)=>`<button class="lesson-card question-select" type="button"><b>${i+1}.</b> ${x}</button>`).join("")}</div>
      <div class="context-response-space" hidden>
        <label>Type key ideas for your answer.</label>
        <textarea class="context-response-input" placeholder="Type your ideas here..."></textarea>
      </div>`;
    }
    if(s.type==="layered-reveal"){
      return `${mediaBlock(s.media)}<div class="lesson-grid">${s.items.map((x,i)=>`<button class="reveal-card" data-layer="${i}"><b>${x.title}</b><div class="layer-content" hidden><div>${x.support}</div><small>${x.model||""}</small></div></button>`).join("")}</div>`;
    }
    if(s.type==="vocabulary-tabs"){
      const keys=Object.keys(s.categories);
      return `<div class="vocab-tabs">${keys.map((k,i)=>`<button class="vocab-tab ${i===0?"active":""}" data-vtab="${k}">${k}</button>`).join("")}</div>
      <div class="word-cloud" id="wordCloud">${s.categories[keys[0]].map(w=>`<span>${w}</span>`).join("")}</div>
      <div class="context-response-space vocab-response-space">
        <label>Add your own example.</label>
        <input class="context-response-input single-line" type="text" placeholder="Type an example..."/>
      </div>`;
    }
    if(s.type==="photo-task"){
      return `${mediaBlock(s.media)}
        <div class="lesson-grid photo-choice-grid">${s.pairs.map(p=>`<button class="choice-option" data-choice="${p}">${p}</button>`).join("")}</div>
        <div class="context-response-space" hidden>
          <label>Type key details you notice.</label>
          <textarea class="context-response-input" placeholder="Clothes, appearance, similarities, differences..."></textarea>
        </div>
        <div class="lesson-support">${s.note}</div>`;
    }
    if(s.type==="speaker-match"){
      return `${mediaBlock(s.media)}<div class="lesson-support">${s.example}</div>${s.items.map(x=>`<div class="inline-row"><span>${x.prompt}</span><button data-inline-answer="${x.answer}">Check</button><span class="inline-answer">${x.answer}</span></div>`).join("")}`;
    }
    if(s.type==="transcript-focus"){
      return `${mediaBlock(s.media)}<div class="lesson-grid">${s.items.map(x=>`<button class="reveal-card" data-answer="${encodeURIComponent(x.meaning)}"><b>${x.phrase}</b></button>`).join("")}</div>`;
    }
    if(s.type==="guided-discovery"){
      return `${mediaBlock(s.media)}${revealList(s.items)}`;
    }
    if(s.type==="listen-match"){
      const defs=[...s.matching].sort((a,b)=>a.definition.localeCompare(b.definition));
      return `${mediaBlock(s.media)}
        <h3>Step 1 · Which phrasal verbs do you hear?</h3>
        <div class="candidate-list">${s.candidates.map(x=>`<div class="candidate-row"><span>${x.text}</span><button data-heard="${x.heard?"yes":"no"}">Check</button></div>`).join("")}</div>
        <h3 style="margin-top:20px">Step 2 · Match the phrasal verbs to the definitions</h3>
        <div class="matching-grid">
          <div class="match-col">${s.matching.map((x,i)=>`<button class="match-option match-term" data-key="${i}" data-def="${encodeURIComponent(x.definition)}">${i+1}. ${x.term}</button>`).join("")}</div>
          <div class="match-col">${defs.map((x,i)=>`<button class="match-option match-def" data-definition="${encodeURIComponent(x.definition)}">${String.fromCharCode(97+i)}. ${x.definition}</button>`).join("")}</div>
        </div><div id="matchFeedback" class="lesson-support">Select a phrasal verb, then select its definition.</div>`;
    }
    if(s.type==="inline-reveal"){
      return `${s.wordBank?`<div class="lesson-support"><b>Word bank:</b> ${s.wordBank.join(" · ")}</div>`:""}${s.items.map(x=>`<div class="inline-row"><span>${x.text}</span><button data-inline-answer="${x.answer}">Reveal</button><span class="inline-answer">${x.answer}</span></div>`).join("")}`;
    }
    if(s.type==="speaking-prompt"){
      const recorder=s.recorder?.enabled ? `
        <section class="audio-recorder" data-max-seconds="${s.recorder.maxSeconds||180}">
          <div class="recorder-head">
            <div><b>Voice response</b><small>Record on this device. Nothing is uploaded until you submit.</small></div>
            <span class="recording-time">00:00</span>
          </div>
          <div class="recorder-controls">
            <button class="record-btn primary" type="button">● Record</button>
            <button class="pause-btn" type="button" disabled>Pause</button>
            <button class="stop-btn" type="button" disabled>Stop</button>
            <button class="rerecord-btn" type="button" hidden>Re-record</button>
          </div>
          <div class="recorder-playback" hidden>
            <audio class="recording-preview" controls></audio>
            <button class="submit-recording primary" type="button">${s.recorder.submitLabel||"Submit recording"}</button>
          </div>
          <div class="recorder-status" aria-live="polite">Ready to record.</div>
        </section>` : "";
      return `<div class="lesson-grid">${(s.support||[]).map(x=>`<div class="lesson-card">${x}</div>`).join("")}</div>${recorder}`;
    }
    if(s.type==="challenge-cards"){ return revealList(s.items); }
    if(s.type==="exit-ticket"){
      return `<div class="lesson-grid">${s.fields.map(x=>`<label class="lesson-card">${x}<textarea class="exit-response"></textarea></label>`).join("")}</div>
      <div class="response-submit-row"><button class="primary generic-submit" type="button">Submit</button><span class="generic-submit-status"></span></div>`;
    }
    if(s.type==="assignment"){
      return `<div class="lesson-support"><b>${s.label||"Assignment"}</b></div>
      <textarea class="assignment-response" placeholder="Draft your reply here…"></textarea>
      <div class="response-submit-row"><button class="primary generic-submit" type="button">Submit</button><span class="generic-submit-status"></span></div>`;
    }
    if(s.type==="end-screen"){
      return `<div class="end-screen"><h2>${s.title}</h2><p>${s.instruction}</p><div class="lesson-support">${s.footer}</div></div>`;
    }
    return `<div class="lesson-card">Activity renderer coming soon.</div>`;
  }

  function wireInteractions(s, root=document){
    qa(".choice-option",root).forEach(b=>b.addEventListener("click",()=>{
      const task=b.closest(".lesson-task")||root;
      qa(".choice-option",task).forEach(x=>x.classList.remove("selected"));
      b.classList.add("selected");

      const choiceSpace=q(".choice-response-space",task);
      if(choiceSpace){
        choiceSpace.hidden=false;
        const label=q(".selected-choice-label",choiceSpace);
        if(label) label.textContent=b.dataset.choice||b.textContent.trim();
        setTimeout(()=>q(".choice-response-input",choiceSpace)?.focus({preventScroll:true}),40);
      }
      const contextSpace=q(".context-response-space",task);
      if(contextSpace && s.type==="photo-task"){
        contextSpace.hidden=false;
        setTimeout(()=>q(".context-response-input",contextSpace)?.focus({preventScroll:true}),40);
      }
    }));

    qa(".question-select",root).forEach(b=>b.addEventListener("click",()=>{
      qa(".question-select",root).forEach(x=>x.classList.remove("selected"));
      b.classList.add("selected");
      const space=q(".context-response-space",root);
      if(space){space.hidden=false; setTimeout(()=>q(".context-response-input",space)?.focus({preventScroll:true}),40);}
    }));

    qa(".choice-submit",root).forEach(b=>b.addEventListener("click",()=>{
      const space=b.closest(".choice-response-space");
      const input=q(".choice-response-input",space);
      const status=q(".choice-submit-status",space);
      if(!input?.value.trim()){
        if(status) status.textContent="Type your explanation before submitting.";
        input?.focus(); return;
      }
      if(status) status.textContent="Response ready. Live class submission will connect in Student Join.";
    }));

    qa(".generic-submit",root).forEach(b=>b.addEventListener("click",()=>{
      const row=b.closest(".response-submit-row");
      const status=q(".generic-submit-status",row);
      if(status) status.textContent="Response ready. Live submission will connect in Student Join.";
    }));

    initAudioRecorders(root);
    qa(".reveal-card[data-answer]").forEach(b=>b.addEventListener("click",()=>{
      if(b.classList.contains("revealed")) return;
      const a=decodeURIComponent(b.dataset.answer||"");
      b.innerHTML += `<div style="margin-top:8px;font-weight:800">${a}</div>`;
      b.classList.add("revealed");
    }));
    qa(".reveal-card[data-layer]").forEach(b=>b.addEventListener("click",()=>{
      const c=q(".layer-content",b); c.hidden=!c.hidden; b.classList.toggle("revealed",!c.hidden);
    }));
    qa(".vocab-tab").forEach(b=>b.addEventListener("click",()=>{
      qa(".vocab-tab").forEach(x=>x.classList.remove("active")); b.classList.add("active");
      q("#wordCloud").innerHTML=state.lesson.screens[state.index].categories[b.dataset.vtab].map(w=>`<span>${w}</span>`).join("");
    }));
    qa("[data-inline-answer]").forEach(b=>b.addEventListener("click",()=>{
      const row=b.closest(".inline-row"); row.classList.toggle("revealed"); b.textContent=row.classList.contains("revealed")?"Hide":"Reveal";
    }));
    qa(".candidate-row button").forEach(b=>b.addEventListener("click",()=>{
      const row=b.closest(".candidate-row"), yes=b.dataset.heard==="yes";
      row.classList.add(yes?"heard":"not-heard"); b.textContent=yes?"HEARD":"NOT HEARD";
    }));
    qa(".match-term").forEach(b=>b.addEventListener("click",()=>{
      qa(".match-term").forEach(x=>x.classList.remove("active")); state.selectedMatch=b; b.classList.add("active");
    }));
    qa(".match-def").forEach(b=>b.addEventListener("click",()=>{
      if(!state.selectedMatch) return;
      const ok=state.selectedMatch.dataset.def===b.dataset.definition;
      const fb=q("#matchFeedback");
      if(ok){ state.selectedMatch.classList.add("done"); b.classList.add("done"); state.selectedMatch.disabled=true; b.disabled=true; fb.textContent="Correct match."; state.selectedMatch=null; }
      else fb.textContent="Not quite. Try again.";
    }));
  }

  function initAudioRecorders(root=document){
    qa(".audio-recorder",root).forEach(box=>{
      if(box.dataset.ready==="1") return;
      box.dataset.ready="1";

      const record=q(".record-btn",box), pause=q(".pause-btn",box), stop=q(".stop-btn",box);
      const rerecord=q(".rerecord-btn",box), playback=q(".recorder-playback",box);
      const audio=q(".recording-preview",box), submit=q(".submit-recording",box);
      const status=q(".recorder-status",box), time=q(".recording-time",box);
      const maxSeconds=Number(box.dataset.maxSeconds)||180;

      let recorder=null, stream=null, chunks=[], timer=null, elapsed=0, blobUrl="";

      const setTime=()=>{
        const m=String(Math.floor(elapsed/60)).padStart(2,"0");
        const s=String(elapsed%60).padStart(2,"0");
        time.textContent=`${m}:${s}`;
      };
      const cleanupStream=()=>{
        if(stream){stream.getTracks().forEach(t=>t.stop()); stream=null;}
      };
      const stopTimer=()=>{if(timer){clearInterval(timer);timer=null;}};

      async function startRecording(){
        if(!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder==="undefined"){
          status.textContent="Recording is not supported in this browser.";
          return;
        }
        try{
          if(blobUrl){URL.revokeObjectURL(blobUrl); blobUrl="";}
          playback.hidden=true; audio.removeAttribute("src");
          chunks=[]; elapsed=0; setTime();
          stream=await navigator.mediaDevices.getUserMedia({audio:true});
          recorder=new MediaRecorder(stream);
          recorder.ondataavailable=e=>{if(e.data?.size) chunks.push(e.data);};
          recorder.onstop=()=>{
            stopTimer(); cleanupStream();
            const type=recorder.mimeType || "audio/webm";
            const blob=new Blob(chunks,{type});
            blobUrl=URL.createObjectURL(blob);
            audio.src=blobUrl;
            playback.hidden=false;
            rerecord.hidden=false;
            record.disabled=true; pause.disabled=true; stop.disabled=true;
            status.textContent="Recording complete. Listen back, re-record, or submit.";
            box._eleapRecordingBlob=blob;
          };
          recorder.start(250);
          record.disabled=true; pause.disabled=false; stop.disabled=false; rerecord.hidden=true;
          status.textContent="Recording…";
          timer=setInterval(()=>{
            elapsed+=1; setTime();
            if(elapsed>=maxSeconds && recorder?.state!=="inactive") recorder.stop();
          },1000);
        }catch(err){
          cleanupStream();
          status.textContent="Microphone access is needed to record.";
          console.error("E-LEAP recorder error",err);
        }
      }

      record.addEventListener("click",startRecording);
      pause.addEventListener("click",()=>{
        if(!recorder) return;
        if(recorder.state==="recording"){
          recorder.pause(); pause.textContent="Resume"; stopTimer(); status.textContent="Recording paused.";
        }else if(recorder.state==="paused"){
          recorder.resume(); pause.textContent="Pause"; status.textContent="Recording…";
          timer=setInterval(()=>{
            elapsed+=1; setTime();
            if(elapsed>=maxSeconds && recorder?.state!=="inactive") recorder.stop();
          },1000);
        }
      });
      stop.addEventListener("click",()=>{
        if(recorder && recorder.state!=="inactive") recorder.stop();
      });
      rerecord.addEventListener("click",()=>{
        playback.hidden=true; rerecord.hidden=true; record.disabled=false; pause.disabled=true; stop.disabled=true;
        pause.textContent="Pause"; elapsed=0; setTime(); status.textContent="Ready to record again.";
        box._eleapRecordingBlob=null;
      });
      submit.addEventListener("click",()=>{
        if(!box._eleapRecordingBlob){status.textContent="Record your response first."; return;}
        status.textContent="Recording ready. Secure upload will connect in Student Join.";
      });
    });
  }

  function render(){
    const s=state.lesson.screens[state.index], host=q("#lessonRenderer");
    if(!host) return;
    q("#lessonTitle").textContent=`${state.lesson.lessonNumber} · ${state.lesson.title}`;
    host.innerHTML=`
      <div class="lesson-player">
        <aside class="lesson-player-nav">
          ${state.lesson.screens.map((x,i)=>`<button class="lesson-screen-btn ${i===state.index?"active":""}" data-screen-index="${i}"><span>${String(i+1).padStart(2,"0")}</span><b>${x.stage}</b></button>`).join("")}
        </aside>
        <section class="lesson-player-main">
          <div class="lesson-player-top"><span class="lesson-stage-chip">${s.stage}</span><span class="lesson-counter">${state.index+1} / ${state.lesson.screens.length}</span></div>
          <h2>${s.title}</h2>
          <p class="lesson-instruction">${s.instruction||""}</p>
          <div class="lesson-task">${renderTask(s)}</div>
          <div class="lesson-bottom-nav">
            <button id="lessonPrev" ${state.index===0?"disabled":""}>← Back</button>
            <button id="lessonStartClass" class="primary">Presentation mode</button>
            <button id="lessonNext" class="primary" ${state.index===state.lesson.screens.length-1?"disabled":""}>Next →</button>
          </div>
        </section>
      </div>`;
    qa("[data-screen-index]",host).forEach(b=>b.addEventListener("click",()=>{state.index=+b.dataset.screenIndex;render()}));
    q("#lessonPrev",host)?.addEventListener("click",()=>{if(state.index>0){state.index--;render()}});
    q("#lessonNext",host)?.addEventListener("click",()=>{if(state.index<state.lesson.screens.length-1){state.index++;render()}});
    q("#lessonStartClass",host)?.addEventListener("click",()=>openPresentation());
    wireInteractions(s,host);
    hydrateMedia(host);
  }

  function renderPresentation(){
    const s=state.lesson.screens[state.index], host=q("#classroom");
    q("#classroomLessonMeta").textContent=`${state.lesson.lessonNumber} · ${state.lesson.title}`;
    q("#classroomStage").textContent=s.stage;
    q("#classroomTitle").textContent=s.title;
    if(s.id==="s01") {
      q("#classroomInstruction").textContent="";
      q("#classroomInstruction").style.display="none";
      q("#classroomTask").innerHTML=renderLeadInPresentation(s);
    } else {
      q("#classroomInstruction").style.display="";
      q("#classroomInstruction").textContent=s.instruction||"";
      q("#classroomTask").innerHTML=renderTask(s);
    }
    q("#classroomCounter").textContent=`${state.index+1} / ${state.lesson.screens.length}`;
    wireInteractions(s,q("#classroomTask"));
    hydrateMedia(q("#classroomTask"));
  }
  function openPresentation(){ q("#classroom").classList.add("active"); renderPresentation(); }

  async function load(){
    try{
      const r=await fetch("courses/objective-first-b2/unit-01/lesson-01/lesson.json",{cache:"no-store"});
      state.lesson=await r.json();
      render();
      document.addEventListener("eleap-open-u11",()=>{state.index=0;render()});
      q("#classroomPrev")?.addEventListener("click",()=>{if(state.index>0){state.index--;renderPresentation()}});
      q("#classroomNext")?.addEventListener("click",()=>{if(state.index<state.lesson.screens.length-1){state.index++;renderPresentation()}});
      q("#exitClassroom")?.addEventListener("click",()=>q("#classroom").classList.remove("active"));
    }catch(e){
      const host=q("#lessonRenderer"); if(host) host.innerHTML=`<div class="empty-state"><h3>Lesson data could not be loaded</h3><p>${e.message}</p></div>`;
    }
  }
  window.addEventListener("DOMContentLoaded",load);
})();
