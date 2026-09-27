
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

  function renderTask(s){
    if(s.type==="quick-choice"){
      return `${mediaBlock(s.media)}<div class="lesson-support"><b>${s.question}</b></div><div class="lesson-grid">${s.options.map(o=>`<button class="choice-option">${o}</button>`).join("")}</div>`;
    }
    if(s.type==="questions"){
      return `<div class="lesson-grid">${s.questions.map((x,i)=>`<div class="lesson-card"><b>${i+1}.</b> ${x}</div>`).join("")}</div>`;
    }
    if(s.type==="layered-reveal"){
      return `${mediaBlock(s.media)}<div class="lesson-grid">${s.items.map((x,i)=>`<button class="reveal-card" data-layer="${i}"><b>${x.title}</b><div class="layer-content" hidden><div>${x.support}</div><small>${x.model||""}</small></div></button>`).join("")}</div>`;
    }
    if(s.type==="vocabulary-tabs"){
      const keys=Object.keys(s.categories);
      return `<div class="vocab-tabs">${keys.map((k,i)=>`<button class="vocab-tab ${i===0?"active":""}" data-vtab="${k}">${k}</button>`).join("")}</div><div class="word-cloud" id="wordCloud">${s.categories[keys[0]].map(w=>`<span>${w}</span>`).join("")}</div>`;
    }
    if(s.type==="photo-task"){
      return `${mediaBlock(s.media)}<div class="lesson-grid">${s.pairs.map(p=>`<button class="choice-option">${p}</button>`).join("")}</div><div class="lesson-support">${s.note}</div>`;
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
      return `<div class="lesson-grid">${(s.support||[]).map(x=>`<div class="lesson-card">${x}</div>`).join("")}</div>`;
    }
    if(s.type==="challenge-cards"){ return revealList(s.items); }
    if(s.type==="exit-ticket"){
      return `<div class="lesson-grid">${s.fields.map(x=>`<label class="lesson-card">${x}<textarea style="width:100%;min-height:80px;margin-top:8px;border:1px solid #c7d1cd;border-radius:8px"></textarea></label>`).join("")}</div>`;
    }
    if(s.type==="assignment"){
      return `<div class="lesson-support"><b>${s.label||"Assignment"}</b></div><textarea style="width:100%;min-height:240px;border:1px solid #c7d1cd;border-radius:10px;padding:14px;font-size:18px" placeholder="Draft your reply here…"></textarea>`;
    }
    if(s.type==="end-screen"){
      return `<div class="end-screen"><h2>${s.title}</h2><p>${s.instruction}</p><div class="lesson-support">${s.footer}</div></div>`;
    }
    return `<div class="lesson-card">Activity renderer coming soon.</div>`;
  }

  function wireInteractions(s){
    qa(".choice-option").forEach(b=>b.addEventListener("click",()=>b.classList.toggle("selected")));
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
    wireInteractions(s);
    hydrateMedia(q("#classroomTask")||document);
  }

  function renderPresentation(){
    const s=state.lesson.screens[state.index], host=q("#classroom");
    q("#classroomLessonMeta").textContent=`${state.lesson.lessonNumber} · ${state.lesson.title}`;
    q("#classroomStage").textContent=s.stage;
    q("#classroomTitle").textContent=s.title;
    q("#classroomInstruction").textContent=s.instruction||"";
    q("#classroomTask").innerHTML=renderTask(s);
    q("#classroomCounter").textContent=`${state.index+1} / ${state.lesson.screens.length}`;
    wireInteractions(s);
    hydrateMedia(q("#classroomTask")||document);
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
