const L=window.LESSON;
const __eleapParams=new URLSearchParams(location.search);
const __eleapHosted=__eleapParams.get('eleapHosted')==='1';
const __eleapRole=['guest','student','teacher','admin'].includes(__eleapParams.get('eleapRole'))?__eleapParams.get('eleapRole'):'guest';
const __eleapCanTeach=['teacher','admin'].includes(__eleapRole);
const __eleapRequestedPresentation=__eleapParams.get('eleapMode')==='presentation';
const __eleapLockedMode=__eleapHosted?(__eleapCanTeach?(__eleapRequestedPresentation?'presentation':'teacher'):'student'):null;
const __eleapNormalizeMode=(requested)=>{
  if(!__eleapHosted)return requested;
  if(!__eleapCanTeach)return 'student';
  return requested==='presentation'?'presentation':'teacher';
};
let i=0,mode=__eleapLockedMode||'student',lastNonPresentationMode=(__eleapHosted&&__eleapCanTeach)?'teacher':'student',timerInt=null;
const videoRoundState={round:0,answers:Array(6).fill(''),submitted:Array(6).fill(false)};
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]));

const rich=s=>esc(s).replace(/\*([^*]+)\*/g,'<em class="focus">$1</em>');

const demoResponses=[
  'the youngest and skinniest models',
  'critical / disapproving',
  'comparative & superlative',
  'more casual',
  'not as fast as'
];

/* =========================================================
   E-LEAP U1.2 PRIVATE MEDIA
   ========================================================= */

let privateMediaMap=null;

function privateMediaKey(path){
  const fileName=String(path||'').split('/').pop();
  return fileName?`u01/l02/${fileName}`:'';
}

async function getPrivateMediaMap(){
  if(privateMediaMap)return privateMediaMap;
  const cacheKey='e-leap:media-map:v2';
  try{
    const raw=sessionStorage.getItem(cacheKey);
    if(raw){const cached=JSON.parse(raw);if(cached?.value&&Date.now()-(cached.savedAt||0)<600000){privateMediaMap=cached.value;return privateMediaMap;}}
  }catch(_){}
  const response=await fetch('/media-map.json',{cache:'default'});
  if(!response.ok)throw new Error(`media-map.json: ${response.status}`);
  privateMediaMap=await response.json();
  try{sessionStorage.setItem(cacheKey,JSON.stringify({savedAt:Date.now(),value:privateMediaMap}))}catch(_){}
  return privateMediaMap;
}

async function resolvePrivateMedia(){
  try{
    const mediaMap=await getPrivateMediaMap();

    document.querySelectorAll('[data-media-key]').forEach(element=>{
      const rawKey=element.dataset.mediaKey;
      const key=privateMediaKey(rawKey);
      const url=mediaMap[key];

      if(!url){
        console.warn('E-LEAP media key not found:',key);
        return;
      }

      if(
        element.tagName==='IMG' ||
        element.tagName==='AUDIO' ||
        element.tagName==='VIDEO' ||
        element.tagName==='SOURCE'
      ){
        if(element.getAttribute('src')!==url){
          element.src=url;

          if(element.tagName==='SOURCE'){
            const parent=element.parentElement;
            if(parent&&(parent.tagName==='VIDEO'||parent.tagName==='AUDIO')){
              parent.load();
            }
          }
        }
      }
    });

  }catch(error){
    console.error('E-LEAP private media resolver failed:',error);
  }
}

/* ========================================================= */

function groups(gs,cls=''){
  return `<div class="groups ${cls}">
    ${gs.map(g=>`
      <section class="group">
        <h3>${esc(g.heading)}</h3>
        ${g.items.map(x=>`<div class="bullet">${rich(x)}</div>`).join('')}
      </section>
    `).join('')}
  </div>`;
}

function sections(ss,cls='three'){
  return `<div class="source-sections ${cls}">
    ${ss.map(s=>`
      <section class="source-section">
        <h2>${esc(s.heading)}</h2>
        ${s.items.map(x=>`<div class="source-line">${rich(x)}</div>`).join('')}
      </section>
    `).join('')}
  </div>`;
}

function answerBox(n,ph='Your answer'){
  return `<input class="miniinput" data-answer-index="${n-1}" aria-label="Answer ${n}" placeholder="${ph}">`;
}

function qRows(items,numbered=false){
  return `<div class="qrows">
    ${items.map((x,n)=>`
      <div class="qrow">
        <div class="qtext">${numbered?`<b>${n+1}.</b> `:''}${rich(x)}</div>
        ${answerBox(n+1)}
      </div>
    `).join('')}
  </div>`;
}

function mixedTable(a){
  let k=0;

  return `<div class="formtable">
    <div class="tr head">
      <div>Adjective</div>
      <div>Comparative</div>
      <div>Superlative</div>
    </div>

    ${a.rows.map((r,ri)=>`
      <div class="tr">
        ${r.map((x,ci)=>`
          <div>
            ${x
              ?rich(x)
              :`<input class="cellinput"
                       data-answer-index="${k++}"
                       aria-label="Row ${ri+1} column ${ci+1}"
                       placeholder="Type…">`
            }
          </div>
        `).join('')}
      </div>
    `).join('')}
  </div>`;
}

function inlineBlanks(items,grouped=false){
  return `<div class="inline-list ${grouped?'grouped-three':''}">
    ${items.map((p,n)=>`
      <div class="inline-q">
        <span>${rich(p[0])}</span>
        <input class="inlineinput"
               data-answer-index="${n}"
               aria-label="Blank ${n+1}"
               placeholder="answer">
        <span>${rich(p[1])}</span>
      </div>
    `).join('')}
  </div>`;
}

function inlineMulti(items){
  let c=0;

  return `<div class="inline-list">
    ${items.map(parts=>{
      let h='<div class="inline-q">';

      parts.forEach((p,j)=>{
        h+=`<span>${rich(p)}</span>`;

        if(j<parts.length-1){
          c++;
          h+=`<input class="inlineinput"
                     data-answer-index="${c-1}"
                     aria-label="Blank ${c}"
                     placeholder="type answer">`;
        }
      });

      return h+'</div>';
    }).join('')}
  </div>`;
}

function videoRounds(a){
  const n=videoRoundState.round;

  return `
    <div class="video-round-shell">

      <div class="video-round-main">
        <video id="roundVideo" controls preload="metadata">
          <source
            data-media-key="${esc(a.videos[n])}"
            src=""
            type="video/mp4">
        </video>
      </div>

      <aside class="video-round-side">

        <div class="round-counter">
          Video ${n+1} of ${a.videos.length}
        </div>

        <div class="round-dots">
          ${a.videos.map((_,k)=>`
            <button
              class="round-dot
                ${k===n?'current':''}
                ${videoRoundState.submitted[k]?'done':''}"
              data-round="${k}">
              ${k+1}
            </button>
          `).join('')}
        </div>

        <div class="video-round-answer">
          <label for="roundAnswer">Your answer</label>

          <input
            id="roundAnswer"
            value="${esc(videoRoundState.answers[n])}"
            placeholder="Type the clothing word">

          ${mode==='student' ? `
          <button
            class="submit round-submit"
            id="roundSubmit"
            style="margin-top:10px;width:100%">
            ${videoRoundState.submitted[n]?'Submitted ✓':'Submit answer'}
          </button>
          ` : ''}
        </div>

        <div class="round-controls">
          <button id="roundPrev" ${n===0?'disabled':''}>
            ← Previous video
          </button>

          <button
            class="round-next"
            id="roundNext"
            ${n===a.videos.length-1?'disabled':''}>
            Next video →
          </button>
        </div>

        <div class="round-status">
          One activity · six video rounds
        </div>

      </aside>
    </div>
  `;
}

function media(a){
  let h='';

  if(a.image){
    h+=`
      <img
        class="sourceimg ${a.type==='reading-mcq'?'jeans':''}"
        src="${a.image}"
        alt="Source visual">
    `;
  }

  if(a.videos){
    h+=a.type==='video-responses'
      ?videoRounds(a)
      :`
        <div class="media-grid">
          ${a.videos.map((v,n)=>`
            <div class="media-card">

              <video controls preload="metadata">
                <source
                  data-media-key="${esc(v)}"
                  src=""
                  type="video/mp4">
              </video>

              <label>Video ${n+1}</label>
            </div>
          `).join('')}
        </div>
      `;
  }

  return h;
}

function mcq(a){
  return `<div class="mcq-list">
    ${a.mcq.map((q,qi)=>`
      <div class="mcq">
        <div class="qtext"><b>${esc(q.q)}</b></div>

        <div class="mcq-options">
          ${q.options.map(o=>`
            <button class="option" data-q="${qi}">
              ${esc(o)}
            </button>
          `).join('')}
        </div>
      </div>
    `).join('')}
  </div>`;
}

function tf(items){
  return `<div class="tf-list">
    ${items.map((x,n)=>`
      <div class="tf-row">
        <div>${rich(x)}</div>

        <div class="tf-buttons">
          <button class="option" data-q="${n}">T</button>
          <button class="option" data-q="${n}">F</button>
        </div>
      </div>
    `).join('')}
  </div>`;
}

function stacked(items){
  return `<div class="stacked-list">
    ${items.map((x,n)=>`
      <div class="stacked-q">
        <div>${rich(x)}</div>

        <div class="answerline">
          <b>⇒</b>
          <input class="stackinput"
                 data-answer-index="${n}"
                 aria-label="Answer ${n+1}"
                 placeholder="Type the complete answer here">
        </div>
      </div>
    `).join('')}
  </div>`;
}

function numberedWords(items){
  return `<div class="word-grid">
    ${items.map((x,n)=>`
      <div class="word-item">
        <b>${n+1}.</b>
        <span>${esc(x)}</span>
        ${answerBox(n+1,'Correct spelling')}
      </div>
    `).join('')}
  </div>`;
}

const groupState={};

function tabbedItems(key,items,groups,renderer){
  const active=groupState[key]||0;
  const [start,end,label]=groups[active];

  return `
    <div class="item-tabs">
      ${groups.map((g,k)=>`
        <button
          class="item-tab ${k===active?'active':''}"
          data-group-key="${key}"
          data-group="${k}">
          ${g[2]}
        </button>
      `).join('')}
    </div>

    <div class="tabbed-items">
      ${renderer(items.slice(start,end),start)}
    </div>
  `;
}

function inlineBlanksTabbed(items){
  return tabbedItems(
    'ex4',
    items,
    [[0,3,'a–c'],[3,6,'d–f'],[6,8,'g–h']],
    (xs,off)=>`
      <div class="inline-list full-lines">
        ${xs.map((p,n)=>`
          <div class="inline-q">
            <span>${rich(p[0])}</span>

            <input
              class="inlineinput"
              data-answer-index="${off+n}"
              aria-label="Blank ${off+n+1}"
              placeholder="answer">

            <span>${rich(p[1])}</span>
          </div>
        `).join('')}
      </div>
    `
  );
}

function transformTabbed(items){
  return tabbedItems(
    'transform',
    items,
    [[0,3,'1–3'],[3,6,'4–6'],[6,9,'7–9']],
    (xs,off)=>`
      <div class="transform-list">
        ${xs.map((x,n)=>{
          const [pre,post='']=x.split('|');
          const parts=pre.split('→');

          return `
            <div class="transform-row">
              <div class="transform-source">
                ${rich((parts[0]||'').trim())}
              </div>

              <div class="transform-answer">
                <b>⇒</b>
                <span>${rich((parts[1]||'').trim())}</span>

                <input
                  class="inlineinput transform-input"
                  data-answer-index="${off+n}"
                  aria-label="Answer ${off+n+1}"
                  placeholder="answer">

                <span>${rich(post)}</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `
  );
}

function spellingTabbed(items){
  return tabbedItems(
    'spell8',
    items,
    [[0,4,'1–4'],[4,8,'5–8']],
    (xs,off)=>`
      <div class="spelling-lines">
        ${xs.map((x,n)=>`
          <div class="spelling-line">
            <div>
              <b>${off+n+1}.</b> ${rich(x)}
            </div>

            ${answerBox(off+n+1,'answer')}
          </div>
        `).join('')}
      </div>
    `
  );
}

function grammarTabbed(items){
  return tabbedItems(
    'grammar8',
    items,
    [[0,4,'a–d'],[4,8,'e–h']],
    (xs,off)=>`
      <div class="grammar-lines">
        ${xs.map((x,n)=>`
          <div class="grammar-line">
            <div>${rich(x)}</div>

            <div class="answerline">
              <b>⇒</b>

              <input
                class="stackinput"
                data-answer-index="${off+n}"
                aria-label="Answer ${off+n+1}"
                placeholder="answer">
            </div>
          </div>
        `).join('')}
      </div>
    `
  );
}

function structureCards(items){
  return `<div class="structure-question-grid">
    ${items.map((x,n)=>`
      <div class="structure-q">
        <div>${rich(x)}</div>
        ${answerBox(n+1,'Your answer')}
      </div>
    `).join('')}
  </div>`;
}

function vocabQuestions(items){
  return `<div class="vocab-q-grid">
    ${items.map((x,n)=>`
      <div class="vocab-q">
        <div>${rich(x)}</div>
        ${answerBox(n+1,'answer')}
      </div>
    `).join('')}
  </div>`;
}

function groupedQuestions(items){
  return `<div class="compact-grid">
    ${items.map((x,n)=>`
      <div class="compact-q">
        <div>
          <b>${n+1}.</b> ${rich(x)}
        </div>

        ${answerBox(n+1,'Answer')}
      </div>
    `).join('')}
  </div>`;
}

function transformInline(items){
  return `<div class="transform-list">
    ${items.map((x,n)=>{
      const [pre,post='']=x.split('|');
      const parts=pre.split('→');
      const source=(parts[0]||'').trim();
      const target=(parts[1]||'').trim();

      return `
        <div class="transform-row">

          <div class="transform-source">
            ${rich(source)}
          </div>

          <div class="transform-answer">
            <b>⇒</b>
            <span>${rich(target)}</span>

            <input
              class="inlineinput transform-input"
              data-answer-index="${n}"
              aria-label="Answer ${n+1}"
              placeholder="Type the missing words">

            <span>${rich(post)}</span>
          </div>
        </div>
      `;
    }).join('')}
  </div>`;
}

function groupedAnswers(items){
  return `<div class="grammar-card-grid">
    ${items.map((x,n)=>`
      <div class="grammar-card">
        <div>${rich(x)}</div>

        <div class="answerline">
          <b>⇒</b>

          <input
            class="stackinput"
            data-answer-index="${n}"
            aria-label="Answer ${n+1}"
            placeholder="Type your sentence">
        </div>
      </div>
    `).join('')}
  </div>`;
}

function rewriteInline(items){
  return `<div class="rewrite-grid full">
    ${items.map((p,n)=>`
      <div class="rewrite-q">
        <div>${rich(p[0])}</div>

        <div class="rewrite-line">
          <b>⇒</b>
          <span>${rich(p[1])}</span>

          <input
            class="inlineinput rewrite-input"
            data-answer-index="${n}"
            aria-label="Answer ${n+1}"
            placeholder="answer">

          <span>${rich(p[2])}</span>
        </div>
      </div>
    `).join('')}
  </div>`;
}

function evidenceText(text,evidence=[]){
  let out=esc(text);

  evidence.forEach((e,n)=>{
    const safe=esc(e);
    out=out.replace(
      safe,
      `<mark class="evidence ev${n}">${safe}</mark>`
    );
  });

  return out.replace(/\n/g,'<br>');
}

function evidenceReading(a,withImage=false){
  return `
    <div class="evidence-layout ${withImage?'with-image':''}">
      ${withImage
        ?`<img class="jeans-photo" src="${a.image}" alt="Old Levi’s jeans">`
        :''
      }

      <div class="reading typed evidence-text">
        ${evidenceText(a.text,a.evidence)}
      </div>
    </div>
  `;
}

function evidenceControls(a){
  return `<div class="evidence-controls">
    ${a.evidence.map((_,n)=>`
      <button class="evidence-btn" data-ev="${n}">
        Evidence ${n+1}
      </button>
    `).join('')}

    <button class="evidence-btn all" data-ev="all">
      Show all evidence
    </button>
  </div>`;
}

function inner(a){
  let h='';

  if(a.subtitle){
    h+=`<div class="subtitle">${esc(a.subtitle)}</div>`;
  }

  if(a.instruction){
    h+=`<div class="instruction">${rich(a.instruction)}</div>`;
  }

  if(a.type==='cover-modern'&&a.image){
    h+=`
      <div class="hero-cover">

        <div class="hero-copy">
          <div class="hero-kicker">OBJECTIVE FIRST B2</div>
          <div class="hero-title">FASHION<br>MATTERS</div>

          <div class="hero-tags">
            ${a.items.map(x=>`<span>${esc(x)}</span>`).join('')}
          </div>
        </div>

        <div class="hero-visual">
          <img src="${a.image}" alt="Objective First coursebook">
          <div class="fashion-orb orb1"></div>
          <div class="fashion-orb orb2"></div>
        </div>

      </div>
    `;
    return h;
  }

  if(a.type==='thankyou-modern'){
    return `
      <div class="thankyou modern">
        <div class="pattern"></div>

        <div class="thanks-card">
          <div>THANK YOU</div>
        </div>
      </div>
    `;
  }

  if(a.type==='aims-horizontal'){
    h+=groups(a.groups,'horizontal');
  }

  else if(a.type==='sources-three'){
    h+=sections(a.sections);
  }

  else if(a.type==='sources-two'){
    h+=sections(a.sections,'two');
  }

  else if(a.type==='video-responses'){
    h+=media(a);
  }

  else if(a.type==='reading-questions'){
    h+=`
      <div class="reading-question-split">
        <div class="reading">
          ${rich(a.text)}
        </div>

        <div>
          ${qRows(a.items)}
        </div>
      </div>
    `;
  }

  else if(a.type==='structure-questions'){
    h+=`
      <div class="structure-strip">
        ${a.structures.map(x=>`<div>${rich(x)}</div>`).join('')}
      </div>
    `;

    h+=structureCards(a.items);
  }

  else if(a.type==='mixed-table'){
    h+=mixedTable(a);
  }

  else if(a.type==='inline-blanks-grouped'){
    h+=inlineBlanksTabbed(a.items);
  }

  else if(a.type==='degree-notes'){
    h+=`
      <div class="degree-example-panel">
        <ul class="example-list">
          ${a.examples.map(x=>`<li>${rich(x)}</li>`).join('')}
        </ul>
      </div>

      <div class="degree-questions">
        ${a.items.map((x,n)=>`
          <div class="degree-q">
            <div>${rich(x)}</div>

            ${n===2&&a.subitems
              ?`
                <div class="degree-subitems">
                  ${a.subitems.map(y=>`<div>${rich(y)}</div>`).join('')}
                </div>
              `
              :''
            }

            ${answerBox(n+1,'answer')}
          </div>
        `).join('')}
      </div>
    `;
  }

  else if(a.type==='image-inline-questions'){
    h+=`
      <div class="image-question-layout">
        ${media(a)}

        <div>
          ${inlineBlanks(a.items)}
        </div>
      </div>
    `;
  }

  else if(a.type==='source'){
    h+=media(a)+`
      <textarea
        class="input"
        placeholder="Type your answer here">
      </textarea>
    `;
  }

  else if(a.type==='article-typed'){
    h+=`
      <article class="book-article">

        <div class="book-article-title">
          ${esc(a.articleTitle)}
        </div>

        <div class="book-article-text">
          ${esc(a.text)}
        </div>

      </article>

      ${
        mode==='presentation'
          ?`
            <div
              class="article-answer article-presentation-answer presentation-answer-target"
              data-article-answer="1">
              Click here to reveal the answer
            </div>
          `
          :`
            <textarea
              class="input article-answer"
              data-answer-index="0"
              placeholder="Type your answer here">
            </textarea>
          `
      }
    `;
  }

  else if(a.type==='questions'){
    h+=qRows(a.items);
  }

  else if(a.type==='vocab-questions'){
    h+=vocabQuestions(a.items);
  }

  else if(a.type==='grouped-questions'){
    h+=spellingTabbed(a.items);
  }

  else if(a.type==='transform-inline'){
    h+=transformTabbed(a.items);
  }

  else if(a.type==='numbered-words'){
    h+=numberedWords(a.items);
  }

  else if(a.type==='numbered-questions'){
    h+=qRows(a.items,true);
  }

  else if(a.type==='inline-multi-blanks'){
    h+=inlineMulti(a.items);
  }

  else if(a.type==='reading-evidence-mcq'){
    h+=`
      <div class="reading-predict-split">

        <div class="predict-panel">
          <img
            class="jeans-photo"
            src="${a.image}"
            alt="Old Levi’s jeans">

          ${mcq(a)}

          ${
            mode==='teacher'||mode==='presentation'
              ?evidenceControls(a)
              :''
          }
        </div>

        <div class="reading typed evidence-text">
          ${evidenceText(a.text,a.evidence)}
        </div>

      </div>
    `;
  }

  else if(a.type==='reading-evidence-tf'){
    h+=`
      <div class="reading-task-split">

        <div>
          ${evidenceReading(a,false)}

          ${
            mode==='teacher'||mode==='presentation'
              ?evidenceControls(a)
              :''
          }
        </div>

        <div>
          ${tf(a.items)}
        </div>

      </div>
    `;
  }

  else if(a.type==='tf-grid'){
    h+=tf(a.items);
  }

  else if(a.type==='grouped-answers'){
    h+=grammarTabbed(a.items);
  }

  else if(a.type==='rewrite-inline'){
    h+=rewriteInline(a.items);
  }

  else if(a.type==='consolidation-rich'){
    h+=groups(a.groups,'horizontal consolidation');
  }

  else if(a.type==='productive-homework'){
    h+=`
      <div class="homework-card">

        <div class="hw-icon">✦</div>

        <div>
          ${a.items.map((x,n)=>`
            <div class="hw-step">
              <b>${n+1}</b>
              <span>${rich(x)}</span>
            </div>
          `).join('')}
        </div>

        <textarea
          class="homework-input"
          data-answer-index="0"
          placeholder="Type your response here…">
        </textarea>

      </div>
    `;
  }

  else if(a.type==='homework'){
    h+=qRows(a.items);
  }

  h+=`
    <div id="ans" class="answer">
      <b>Answer / teacher note</b><br>
      ${esc(a.answer||'Teacher-led / no fixed answer.')}
    </div>
  `;

  return h;
}

function normalizeAnswer(v){
  return (v||'')
    .toLowerCase()
    .replace(/[’‘]/g,"'")
    .replace(/[^a-z0-9' ]+/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}

function feedbackTone(ok){
  try{
    const C=window.AudioContext||window.webkitAudioContext;

    if(!C)return;

    const c=new C();
    const g=c.createGain();

    g.connect(c.destination);

    g.gain.setValueAtTime(.0001,c.currentTime);
    g.gain.exponentialRampToValueAtTime(.14,c.currentTime+.015);
    g.gain.exponentialRampToValueAtTime(
      .0001,
      c.currentTime+(ok?.34:.28)
    );

    const notes=ok
      ?[659.25,783.99]
      :[220,174.61];

    notes.forEach((f,n)=>{
      const o=c.createOscillator();

      o.type=ok?'sine':'triangle';
      o.frequency.setValueAtTime(
        f,
        c.currentTime+n*.11
      );

      o.connect(g);
      o.start(c.currentTime+n*.11);
      o.stop(c.currentTime+n*.11+.18);
    });

    setTimeout(()=>c.close(),650);

  }catch(e){}
}

function matchesExpected(value,expected){
  const v=normalizeAnswer(value);
  const xs=Array.isArray(expected)?expected:[expected];

  return xs.some(
    x=>normalizeAnswer(x)===v
  );
}

function clearFeedback(){
  document.querySelector('.inline-feedback')?.remove();

  document
    .querySelectorAll(
      '.answer-correct,.answer-wrong,.option-correct,.option-wrong'
    )
    .forEach(x=>{
      x.classList.remove(
        'answer-correct',
        'answer-wrong',
        'option-correct',
        'option-wrong'
      );
    });
}

function showFeedback(all,anchor){
  document
    .querySelector('.inline-feedback')
    ?.remove();

  const msg=document.createElement('div');

  msg.className=
    'inline-feedback '+(all?'good':'try');

  msg.textContent=
    all
      ?'✓ Correct!'
      :'Try again — check the highlighted answer(s).';

  (
    anchor||
    document.querySelector('#content')?.lastElementChild
  )?.after(msg);

  feedbackTone(all);
}

function checkActivity(a){
  let any=false;
  let all=true;
  let last=null;

  if(a.expected){
    const inputs=[
      ...document.querySelectorAll(
        'input[data-answer-index]'
      )
    ];

    inputs.forEach(el=>{
      const idx=Number(el.dataset.answerIndex);
      const exp=a.expected[idx];

      if(exp===undefined)return;

      any=true;

      const ok=matchesExpected(
        el.value,
        exp
      );

      all=all&&ok;

      el.classList.remove(
        'answer-correct',
        'answer-wrong'
      );

      el.classList.add(
        ok
          ?'answer-correct'
          :'answer-wrong'
      );

      el.setAttribute(
        'aria-invalid',
        ok?'false':'true'
      );

      last=
        el.closest(
          '.rewrite-q,.grammar-line,.transform-row,.inline-q,.word-item,.spelling-line,.vocab-q,.tr,.compact-q'
        )||el;
    });
  }

  if(a.optionExpected){
    a.optionExpected.forEach((exp,qi)=>{

      const opts=[
        ...document.querySelectorAll(
          `.option[data-q="${qi}"]`
        )
      ];

      if(!opts.length)return;

      any=true;

      const selected=
        opts.find(
          x=>x.classList.contains('selected')
        );

      if(!selected){
        all=false;
        return;
      }

      const ok=matchesExpected(
        selected.textContent,
        exp
      );

      all=all&&ok;

      selected.classList.remove(
        'option-correct',
        'option-wrong'
      );

      selected.classList.add(
        ok
          ?'option-correct'
          :'option-wrong'
      );

      last=
        selected.closest('.mcq,.tf-row')
        ||selected;
    });
  }

  if(any){
  showFeedback(all,last);

  window.ELEAP_LAST_RESULT = {
    activityId:
      document.body.dataset.screen || null,

    isCorrect: all,

    score: all ? 1 : 0,

    checkedAt:
      new Date().toISOString()
  };

  return true;
}

window.ELEAP_LAST_RESULT = {
  activityId:
    document.body.dataset.screen || null,

  isCorrect: null,

  score: null,

  checkedAt:
    new Date().toISOString()
};

return false;
}

function isAutoCheckable(a){
  /* Student Check is reserved for objectively gradable activities.
     Teacher/Presentation may also use Check as a reveal aid for model responses. */
  if(mode==='student') return !!(a.expected||a.optionExpected);
  return !!(a.expected||a.optionExpected||a.presentationExpected);
}

/* =========================================================
   TEACHER PRESENTATION REVEAL
   ========================================================= */

const presentationRevealState={};

function revealState(){
  return presentationRevealState[i]
    ||(
      presentationRevealState[i]={
        active:false,
        inputs:{},
        options:{}
      }
    );
}

function displayExpected(exp){
  return Array.isArray(exp)
    ?String(exp[0])
    :String(exp??'');
}

function restorePresentationReveals(a){
  if(mode!=='teacher'&&mode!=='presentation')return;

  const st=revealState();

  document.body.classList.toggle(
    'presentation-reveal-active',
    !!st.active
  );

  const check=$('#check');

  if(check&&st.active){
    check.textContent='✓ Reveal mode ON';
    check.classList.add('reveal-mode-on');
  }

  document
    .querySelectorAll(
      'input[data-answer-index],textarea[data-answer-index]'
    )
    .forEach(el=>{

      const idx=Number(
        el.dataset.answerIndex
      );

      if(st.inputs[idx]!==undefined){
        el.value=st.inputs[idx];
        el.classList.add('teacher-revealed');
        el.readOnly=true;
      }
    });

  Object.entries(st.options)
    .forEach(([qi,val])=>{

      const opts=[...document.querySelectorAll(`.option[data-q="${qi}"]`)];

      opts.forEach(o=>{
        if(matchesExpected(o.textContent,val)){
          o.classList.add('teacher-revealed-option');
        }
      });

    });

  if(
    a.type==='video-responses' &&
    st.inputs['video-'+videoRoundState.round]!==undefined
  ){
    const el=$('#roundAnswer');

    if(el){
      el.value=
        st.inputs[
          'video-'+videoRoundState.round
        ];

      el.classList.add(
        'teacher-revealed'
      );

      el.readOnly=true;
    }
  }
}

function setupPresentationReveal(a){
  if(mode!=='teacher'&&mode!=='presentation')return;

  const st=revealState();
  const check=$('#check');

  if(check){
    check.onclick=(e)=>{
      e.preventDefault();

      st.active=true;

      restorePresentationReveals(a);

      check.textContent=
        '✓ Reveal mode ON';

      check.classList.add(
        'reveal-mode-on'
      );
    };
  }

  document
    .querySelectorAll(
      'input[data-answer-index],textarea[data-answer-index]'
    )
    .forEach(el=>{

      el.addEventListener(
        'click',
        e=>{

          const revealExpected=
            a.presentationExpected||
            a.expected;

          if(
            !st.active||
            !revealExpected
          )return;

          e.preventDefault();

          const idx=Number(
            el.dataset.answerIndex
          );

          const exp=
            revealExpected[idx];

          if(exp===undefined)return;

          const val=
            displayExpected(exp);

          st.inputs[idx]=val;

          el.value=val;
          el.readOnly=true;

          el.classList.remove(
            'answer-wrong'
          );

          el.classList.add(
            'teacher-revealed'
          );

          feedbackTone(true);
        }
      );
    });

  if(a.optionExpected){
    a.optionExpected.forEach((exp,qi)=>{

      const opts=[
        ...document.querySelectorAll(
          `.option[data-q="${qi}"]`
        )
      ];

      const row=
        opts[0]?.closest('.mcq,.tf-row');

      if(!row)return;

      row.classList.add(
        'presentation-answer-target'
      );

      row.addEventListener(
        'click',
        e=>{

          if(!st.active)return;

          e.preventDefault();
          e.stopPropagation();

          st.options[qi]=exp;

          opts.forEach(o=>
            o.classList.toggle(
              'teacher-revealed-option',
              matchesExpected(
                o.textContent,
                exp
              )
            )
          );

          feedbackTone(true);

        },
        true
      );
    });
  }

  if(a.type==='article-typed'){
    const box=
      document.querySelector(
        '[data-article-answer]'
      );

    if(box){
      const saved=
        st.inputs['article'];

      if(saved){
        box.innerHTML=saved;

        box.classList.add(
          'teacher-revealed-article'
        );
      }

      box.addEventListener(
        'click',
        e=>{

          if(!st.active)return;

          e.preventDefault();

          const html=`
            <span class="article-answer-label">
              Answer:
            </span>
            Comparative adverbs:
            <em>much</em> lower,
            <em>far</em> more readily,
            <em>less</em> exclusively,
            <em>less</em> seriously.
            <br>
            <span class="article-answer-explain">
              Formation: comparative forms are modified
              by degree adverbs such as
              <em>much</em>,
              <em>far</em> and
              <em>less</em>.
            </span>
          `;

          st.inputs['article']=html;

          box.innerHTML=html;

          box.classList.add(
            'teacher-revealed-article'
          );

          feedbackTone(true);
        }
      );
    }
  }

  if(a.type==='video-responses'){
    const el=$('#roundAnswer');

    if(el){
      el.addEventListener(
        'click',
        e=>{

          if(!st.active)return;

          e.preventDefault();

          const exp=
            a.expected?.[
              videoRoundState.round
            ];

          if(exp===undefined)return;

          const val=
            displayExpected(exp);

          st.inputs[
            'video-'+videoRoundState.round
          ]=val;

          videoRoundState.answers[
            videoRoundState.round
          ]=val;

          videoRoundState.submitted[
            videoRoundState.round
          ]=true;

          el.value=val;
          el.readOnly=true;

          el.classList.add(
            'teacher-revealed'
          );

          feedbackTone(true);
        }
      );
    }
  }

  restorePresentationReveals(a);
}

function needsActions(a){
  return ![
    'cover-modern',
    'aims-horizontal',
    'sources-three',
    'sources-two',
    'video-responses',
    'thankyou-modern',
    'consolidation-rich'
  ].includes(a.type);
}

/* =========================================================
   MAIN RENDER
   ========================================================= */

function render(){
  const a=L.activities[i];

  document.body.className=mode;
  document.body.dataset.screen=String(i+1);

  $('#stageLabel').textContent=a.stage;
  $('#title').textContent=a.title;

  $('#content').innerHTML=inner(a);

  $('#action').innerHTML=
    (
      needsActions(a)||
      (
        (mode==='teacher'||mode==='presentation')&&
        isAutoCheckable(a)
      )
    )
      ?`
        ${
          mode==='student'
            ?'<button class="submit" id="submit">Submit</button>'
            :''
        }

        ${
          isAutoCheckable(a)
            ?'<button id="check">Check</button>'
            :''
        }

        <button id="reset">Reset</button>
      `
      :'';

  $('#progress').textContent=
    `Screen ${i+1} of ${L.activities.length}`;

  $('#count').textContent=
    `${L.activities.length} screens · FINAL`;

  document
    .querySelectorAll('.navbtn')
    .forEach(
      (b,n)=>
        b.classList.toggle(
          'active',
          n===i
        )
    );

  $('#reveal').onclick=()=>{
    $('#ans')?.classList.add('show');
  };

  if(mode==='student'){
    $('#check')
      ?.addEventListener(
        'click',
        ()=>checkActivity(a)
      );
  }

  $('#submit')
    ?.addEventListener(
      'click',
      e=>{
        e.target.textContent=
          'Submitted ✓';

        e.target.classList.add(
          'submitted'
        );

        e.target.disabled=true;
      }
    );

  $('#reset')
    ?.addEventListener(
      'click',
      ()=>{
        if(mode==='teacher'||mode==='presentation'){
          delete presentationRevealState[i];
        }

        /* R4 RC1.1: a true activity reset must clear the six-video state,
           not only rerender the current video round. */
        if(a.type==='video-responses'){
          videoRoundState.round=0;
          videoRoundState.answers=Array(a.videos?.length||6).fill('');
          videoRoundState.submitted=Array(a.videos?.length||6).fill(false);
        }

        window.ELEAP_LAST_RESULT=null;
        render();
      }
    );

  document
    .querySelectorAll('.option')
    .forEach(
      b=>b.onclick=()=>{

        const q=b.dataset.q;

        document
          .querySelectorAll(
            `.option[data-q="${q}"]`
          )
          .forEach(
            x=>x.classList.remove(
              'selected',
              'option-correct',
              'option-wrong'
            )
          );

        b.classList.add('selected');
      }
    );

  document
    .querySelectorAll('.evidence-btn')
    .forEach(
      b=>b.onclick=()=>{

        const v=b.dataset.ev;

        document
          .querySelectorAll('.evidence')
          .forEach(
            x=>x.classList.remove(
              'active'
            )
          );

        if(v==='all'){
          document
            .querySelectorAll('.evidence')
            .forEach(
              x=>x.classList.add(
                'active'
              )
            );
        }else{
          document
            .querySelectorAll('.ev'+v)
            .forEach(
              x=>x.classList.add(
                'active'
              )
            );
        }
      }
    );

  document
    .querySelectorAll('video,audio')
    .forEach(
      m=>m.addEventListener(
        'play',
        ()=>document
          .querySelectorAll('video,audio')
          .forEach(
            x=>{
              if(x!==m)x.pause();
            }
          )
      )
    );

  document
    .querySelectorAll('.item-tab')
    .forEach(
      b=>b.onclick=()=>{
        groupState[
          b.dataset.groupKey
        ]=Number(
          b.dataset.group
        );

        render();
      }
    );

  if(a.type==='video-responses'){
    const save=()=>{
      const el=$('#roundAnswer');

      if(el){
        videoRoundState.answers[
          videoRoundState.round
        ]=el.value;
      }
    };

    document
      .querySelectorAll('.round-dot')
      .forEach(
        b=>b.onclick=()=>{
          save();

          videoRoundState.round=
            Number(b.dataset.round);

          render();
        }
      );

    $('#roundPrev')
      ?.addEventListener(
        'click',
        ()=>{
          save();

          if(videoRoundState.round>0){
            videoRoundState.round--;
            render();
          }
        }
      );

    $('#roundNext')
      ?.addEventListener(
        'click',
        ()=>{
          save();

          if(
            videoRoundState.round<
            a.videos.length-1
          ){
            videoRoundState.round++;
            render();
          }
        }
      );

    $('#roundSubmit')
      ?.addEventListener(
        'click',
        ()=>{
          save();

          const el=$('#roundAnswer');

          const exp=
            a.expected?.[
              videoRoundState.round
            ];

          if(
            exp!==undefined&&
            el
          ){
            const ok=
              matchesExpected(
                el.value,
                exp
              );

            el.classList.remove(
              'answer-correct',
              'answer-wrong'
            );

            el.classList.add(
              ok
                ?'answer-correct'
                :'answer-wrong'
            );

            feedbackTone(ok);

            if(ok){
              videoRoundState.submitted[
                videoRoundState.round
              ]=true;

              setTimeout(
                render,
                280
              );
            }
          }else{
            videoRoundState.submitted[
              videoRoundState.round
            ]=true;

            render();
          }
        }
      );
  }

  setupPresentationReveal(a);

  /* Resolve private Blob media after every render */
  resolvePrivateMedia();
}

/* =========================================================
   NAVIGATION
   ========================================================= */

L.activities.forEach((a,n)=>{
  const b=
    document.createElement('button');

  b.className='navbtn';

  b.textContent=
    `${String(n+1).padStart(2,'0')}  ${a.stage}`+
    (
      a.subtitle
        ?' · '+a.subtitle.split(':')[0]
        :''
    );

  b.onclick=()=>{

    document
      .querySelectorAll('video,audio')
      .forEach(
        m=>{
          m.pause();
          m.currentTime=0;
        }
      );

    i=n;
    render();
  };

  $('#nav').appendChild(b);
});

if(__eleapHosted){
  document.querySelectorAll('[data-mode]').forEach(b=>{
    const requested=b.dataset.mode;
    const permitted=__eleapCanTeach?(requested==='teacher'||requested==='presentation'):(requested==='student');
    b.hidden=!permitted;
    b.disabled=!permitted;
    b.setAttribute('aria-hidden',permitted?'false':'true');
    if(!permitted)b.tabIndex=-1;
    b.classList.toggle('active',requested===mode);
  });
}

document
  .querySelectorAll('[data-mode]')
  .forEach(
    b=>b.onclick=()=>{

      document
        .querySelectorAll('video,audio')
        .forEach(
          m=>m.pause()
        );

      const requestedMode=b.dataset.mode;
      const nextMode=__eleapNormalizeMode(requestedMode);
      if(__eleapHosted && nextMode!==requestedMode)return;
      if(nextMode!=='presentation'){
        lastNonPresentationMode=nextMode;
      }
      mode=nextMode;

      document
        .querySelectorAll('[data-mode]')
        .forEach(
          x=>x.classList.toggle(
            'active',
            x===b
          )
        );

      render();
    }
  );


const exitPresentationBtn=document.getElementById('exitPresentation');
if(exitPresentationBtn){
  exitPresentationBtn.onclick=()=>{
    document
      .querySelectorAll('video,audio')
      .forEach(m=>m.pause());

    mode=__eleapNormalizeMode(lastNonPresentationMode||'teacher');

    document
      .querySelectorAll('[data-mode]')
      .forEach(x=>x.classList.toggle('active',x.dataset.mode===mode));

    render();
  };
}

// E-LEAP host-controlled mode API. The platform owns Teacher <-> Presentation.
window.ELEAP_LESSON_MODE_API={
  setMode(requested){
    const next=__eleapNormalizeMode(requested);
    if(__eleapHosted && !__eleapCanTeach && next!=='student') return false;
    if(next!=='presentation') lastNonPresentationMode=next;
    mode=next;
    document.querySelectorAll('video,audio').forEach(m=>m.pause());
    document.querySelectorAll('[data-mode]').forEach(x=>x.classList.toggle('active',x.dataset.mode===mode));
    render();
    return true;
  },
  getMode(){return mode;}
};

$('#prev').onclick=()=>{

  document
    .querySelectorAll('video,audio')
    .forEach(
      m=>{
        m.pause();
        m.currentTime=0;
      }
    );

  if(i){
    i--;
    render();
  }
};

$('#next').onclick=()=>{

  document
    .querySelectorAll('video,audio')
    .forEach(
      m=>{
        m.pause();
        m.currentTime=0;
      }
    );

  if(i<L.activities.length-1){
    i++;
    render();
  }
};

/* =========================================================
   MODALS
   ========================================================= */

function modal(html){
  $('#modalBody').innerHTML=html;
  $('#modal').classList.add('show');
}

$('#closeModal').onclick=()=>{
  $('#modal').classList.remove('show');
};

$('#modal').onclick=e=>{
  if(e.target.id==='modal'){
    $('#modal').classList.remove('show');
  }
};

$('#responses').onclick=()=>modal(`
  <h2>Responses</h2>

  <div class="tabs">
    <button class="active">By option</button>
    <button>All</button>
    <button>Spotlight</button>
  </div>

  <p>
    <b>Names hidden by default in classroom display.</b>
  </p>

  ${demoResponses.map((r,n)=>`
    <div class="response-card">
      Response ${n+1}: ${esc(r)}
    </div>
  `).join('')}

  <p class="media-status">
    Local Review simulation. Production connects these
    controls to live class response data.
  </p>
`);

$('#timer').onclick=()=>{

  modal(`
    <h2>Classroom Timer</h2>

    <div class="timerbig" id="clock">
      01:00
    </div>

    <div class="timercontrols">
      <button id="t30">30 sec</button>
      <button id="t60">60 sec</button>
      <button id="t120">2 min</button>
      <button id="tstart">Start / Pause</button>
    </div>
  `);

  let left=60;
  let running=false;

  const draw=()=>{
    $('#clock').textContent=
      String(
        Math.floor(left/60)
      ).padStart(2,'0')
      +':'
      +String(
        left%60
      ).padStart(2,'0');
  };

  const set=n=>{
    left=n;
    draw();
  };

  $('#t30').onclick=()=>set(30);
  $('#t60').onclick=()=>set(60);
  $('#t120').onclick=()=>set(120);

  $('#tstart').onclick=()=>{
    running=!running;

    if(timerInt){
      clearInterval(timerInt);
    }

    if(running){
      timerInt=setInterval(
        ()=>{
          if(left>0){
            left--;
            draw();
          }else{
            clearInterval(timerInt);
            running=false;
          }
        },
        1000
      );
    }
  };
};

$('#lucky').onclick=()=>modal(`
  <h2>Lucky Number</h2>

  <div class="lucky">
    ${Math.floor(Math.random()*24)+1}
  </div>

  <p style="text-align:center">
    Use for random participation. Local Review demo.
  </p>
`);

/* =========================================================
   INITIAL RENDER
   ========================================================= */

render();

/* =========================================================
   KEYBOARD CLASSROOM NAVIGATION
   ========================================================= */

document.addEventListener(
  'keydown',
  e=>{

    const tag=
      (
        document.activeElement?.tagName||
        ''
      ).toLowerCase();

    if(
      ['input','textarea','select']
        .includes(tag)
    ){
      return;
    }

    if(
      e.key==='ArrowRight' &&
      i<L.activities.length-1
    ){
      document
        .querySelectorAll('video,audio')
        .forEach(
          m=>{
            m.pause();
            m.currentTime=0;
          }
        );

      i++;
      render();
    }

    if(
      e.key==='ArrowLeft' &&
      i>0
    ){
      document
        .querySelectorAll('video,audio')
        .forEach(
          m=>{
            m.pause();
            m.currentTime=0;
          }
        );

      i--;
      render();
    }
  }
);
