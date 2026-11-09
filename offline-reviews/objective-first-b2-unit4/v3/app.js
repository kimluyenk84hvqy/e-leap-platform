(function(){
"use strict";
const d=JSON.parse(document.getElementById("lesson-data").textContent),app=document.getElementById("app");
let page=0,readingTab="skim",highlight=null,timer=null,seconds=300;
const answers={},notes={},keys={},evidence={},whys={},globalKeys={},globalEvidence={};
const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const img=id=>'<img src="assets/'+id+'.jpg" alt="'+esc(d.animals.find(x=>x.id===id)?.name||id)+'">';
const btn=(x,a,cl)=>'<button type="button" class="'+(cl||"")+'" data-action="'+a+'">'+esc(x)+'</button>';
const entry=i=>page+":"+(d.slides[page].type==="reading"?readingTab+":":"")+i;
const val=i=>answers[entry(i)]||"";
const paper=()=>d.slides[page];
const lang=()=>["I would argue that…","One reason for this is that…","For instance, …","According to the text, …","Although…, I believe…"].map(x=>'<div class="phrase">'+x+'</div>').join("");
const photo=(ids,labeled)=>'<div class="cards">'+ids.map(id=>'<div class="animal">'+img(id)+(labeled?'<b>'+esc(d.animals.find(a=>a.id===id).name)+'</b>':"")+'</div>').join("")+'</div>';
const note=(id)=>'<textarea class="field memo" data-note="'+id+'" placeholder="Write your ideas in English…">'+esc(notes[page+":"+id]||"")+'</textarea>';
function active(){
let type=paper().type;
if(type==="pictures")return d.animals.map(a=>({q:"Match this photograph.",a:a.name,opts:d.animals.map(x=>x.name),evidence:a.fact,why:a.fact}));
if(type==="match")return d.ex2.map(a=>({q:a.q,a:a.a,opts:d.ex2ends.map(x=>x[0]),evidence:a.ending,why:a.why}));
if(type==="habitats")return d.animals.map(a=>({q:a.name,a:a.habitat,opts:d.animals.map(x=>x.habitat),evidence:a.threat,why:a.fact}));
if(type==="skim")return[{q:"Where would you find these five accounts?",a:"an article",opts:["an encyclopaedia","a novel","an article","a brochure"],evidence:"Five people describe a visit to a conservation zoo.",why:"These are personal accounts within one feature."}];
if(type==="words")return d.words.map(a=>({q:a.q,a:a.a,evidence:a.phrase,why:a.why}));
if(type==="exit")return d.exit.map(a=>({q:a.q,a:a.a,evidence:a.phrase,why:"The word appears in the original reading."}));
if(type==="reading"){
if(readingTab==="skim")return[{q:"Where might these five texts have been published?",a:"an article",opts:["an encyclopaedia","a novel","an article","a brochure"],evidence:"Five people describe their visits to zoos.",why:"They form a collection of personal reports."}];
if(readingTab==="practice")return[{q:"Who went to the zoo with a relative?",a:"E",opts:["A","B","C","D","E"],letter:"E",phrase:"my nine-year-old cousin",evidence:"my nine-year-old cousin",why:"A cousin is a relative."},{q:"Who thought the visit was good value for money?",a:"D",opts:["A","B","C","D","E"],letter:"D",phrase:"it was worth every penny",evidence:"it was worth every penny",why:"Worth every penny means good value."}];
if(readingTab==="questions")return d.readingQ.map(x=>({q:x.q,a:x.a,opts:["A","B","C","D","E"],letter:x.a,phrase:x.phrase,evidence:x.phrase,why:x.why}));
}
return[];
}
function questions(qq,photos){
return qq.map((q,i)=>'<div class="question"><p>'+(i+1)+'. '+esc(q.q)+'</p>'+(photos?img(d.animals[i].id):"")+'<div class="row">'+(q.opts?'<select class="field input" data-answer="'+i+'"><option value="">Choose…</option>'+q.opts.map(o=>'<option value="'+esc(o)+'" '+(String(val(i))===String(o)?"selected":"")+'>'+esc(o)+'</option>').join("")+'</select>':'<input class="field input" data-answer="'+i+'" value="'+esc(val(i))+'" placeholder="Your answer">')+btn("Check","item-"+i,"sm alt")+btn("Show key","show-"+i,"sm ghost")+btn("Evidence","evid-"+i,"sm ghost")+btn("Why?","why-"+i,"sm ghost")+'<span class="small" id="flag-'+i+'"></span></div>'+(keys[entry(i)]?'<div class="answerbox"><b>Key:</b> '+esc(q.a)+'</div>':"")+(evidence[entry(i)]?'<div class="answerbox"><b>Evidence:</b> '+esc(q.evidence||"See the visual clue.")+'</div>':"")+(whys[entry(i)]?'<div class="answerbox"><b>Why:</b> '+esc(q.why||"Compare the answer with the input.")+'</div>':"")+'</div>').join("")+'<div class="fact" id="score"></div>';
}
function section(title,content){return '<section class="panel"><h3>'+title+'</h3>'+content+'</section>'}
function guidance(){return '<div class="fact">Use a clear opinion, one reason and a supporting example. Compare your ideas with a partner.</div>'+lang()}
function frames(ids){return photo(ids,false)}
function scene(){
const t=paper().type,qq=active();
if(t==="cover")return '<div class="cover"><div class="copy"><div class="overline">OBJECTIVE FIRST B2 · UNIT 4.1</div><h1>ENDANGERED</h1><p>Wildlife · Conservation · Reading</p><b>OBSERVE · DISCUSS · READ · SHARE</b></div><div class="collage">'+d.animals.map(a=>img(a.id)).join("")+'</div></div>';
if(t==="thanks")return '<div class="thanks"><h1>PROTECT WHAT MATTERS</h1><p>Read for evidence. Speak with purpose.</p><div class="gallery">'+["polar","orangutan","snow"].map(x=>img(x)).join("")+'</div></div>';
if(t==="aims")return '<div class="triple"><div class="panel aim"><b>KNOWLEDGE</b>Identify threats to wildlife; use vocabulary and word families accurately.</div><div class="panel aim"><b>SKILLS</b>Summarise texts A–E, teach your group, justify 10 answers with evidence and evaluate zoo conservation.</div><div class="panel aim"><b>ATTITUDES</b>Show responsibility for wildlife and contribute respectfully in pairs and groups.</div></div><div class="bloom">IDENTIFY → UNDERSTAND → APPLY → ANALYSE → EVALUATE → CREATE</div>';
if(t==="pictures")return '<div class="grid"><div class="panel"><div class="cards">'+d.animals.map((a,i)=>'<div class="animal">'+img(a.id)+'<div class="small">PHOTO '+(i+1)+'</div><select class="field" data-answer="'+i+'"><option value="">Choose animal</option>'+d.animals.map(x=>'<option value="'+esc(x.name)+'" '+(val(i)===x.name?"selected":"")+'>'+esc(x.name)+'</option>').join("")+'</select>'+btn("Check","item-"+i,"sm alt")+(keys[entry(i)]?'<div class="good">'+esc(a.name)+'</div>':"")+'</div>').join("")+'</div><div id="score" class="fact"></div></div>'+section("Describe the photographs",guidance()+'<div class="fact">Use visual clues: a thick bill, white fur, rounded ears, stripes, long arms and spotted fur.</div>')+'</div>';
if(t==="opinion")return '<div class="grid">'+section("Look closely and choose",frames(["orangutan","polar","parrot","snow"])+'<div class="prompt">If you could save one animal, which would you choose?</div>'+note("opinion"))+section("Speak in full sentences",guidance()+'<div class="fact">Orangutans face deforestation; polar bears depend on sea ice; snow leopards face habitat loss and human–wildlife conflict.</div>')+'</div>';
if(t==="match")return '<div class="grid">'+section("Match a–e with 1–5",questions(qq,false))+section("Choose the correct endings",d.ex2ends.map(x=>'<div class="prompt"><b>'+x[0]+'</b> · '+esc(x[1])+'</div>').join("")+'<div class="fact">Use the words: habitat destruction · polluted · global warming · extinction.</div>')+'</div>';
if(t==="habitats")return '<div class="grid">'+section("Match animals and habitats",questions(qq,false))+section("Explain your decisions",frames(["snow","parrot","koala","shark"])+guidance()+'<div class="fact">Snow leopards inhabit high mountains, not the Arctic.</div>')+'</div>';
if(t==="skim")return '<div class="grid">'+section("Skim the five accounts",questions(qq,false)+note("prediction"))+section("Read for overall meaning",'<div class="prompt">Read the title and the opening lines. What is the purpose of the texts?</div><div class="prompt">Do the writers all express the same opinion?</div>'+frames(["parrot","polar","orangutan"])+'<div class="fact">Look for precise information rather than just matching individual words.</div>')+'</div>';
if(t==="reading")return reading();
if(t==="words")return '<div class="grid">'+section("Find the forms in the reading",questions(qq,false))+section("Build useful word families",'<div class="phrase">danger → endanger → endangered</div><div class="phrase">conserve → conservation → conservationist</div><div class="phrase">decide → decision → decisive</div><div class="phrase">enter → entrance</div><div class="phrase">zoo → zoology</div><div class="prompt">Write two original sentences.</div>'+note("wordsentences")+'<div class="fact">Do not confuse conserve (protect) with converse (talk).</div>')+'</div>';
if(t==="discussion")return '<div class="grid">'+section("Discuss the questions",["Are zoos a good way of saving endangered species? Why or why not?","What do you think of the zoos mentioned in the article?","Have you ever been to a zoo? What was it like?"].map((x,i)=>'<div class="prompt">'+(i+1)+'. '+x+'</div>'+note("d"+i)).join(""))+section("Develop your answer",guidance()+'<div class="fact">Text A: successful breeding and reintroduction. Text B: less familiar species are ignored. Text C: a conservation programme is funded by entrance fees.</div>')+'</div>';
if(t==="speaking")return '<div class="grid">'+section("Build a B2 response",guidance()+'<div class="prompt">Acknowledge another point of view before concluding.</div>'+note("speaking"))+section("A possible response",'<div class="answerbox">Although some zoos may have welfare problems, I believe conservation programmes can be valuable. For example, Julia describes a species that was reintroduced into the wild. Nevertheless, protecting natural habitats remains essential.</div>'+frames(["orangutan","snow"]))+'</div>';
if(t==="proposal")return '<div class="grid">'+section("Prepare a short group message",["Choose an animal and describe its habitat.","Explain a serious threat and its consequences.","Suggest an action and explain why it may help.","Present your group message. Make sure everyone speaks."].map((x,i)=>'<div class="prompt">'+x+'</div>'+note("p"+i)).join(""))+section("Use evidence and B2 language",frames(["orangutan","parrot","polar","snow"])+guidance())+'</div>';
if(t==="exit")return '<div class="grid">'+section("Complete with words from the reading",questions(qq,false))+section("Can you…?",["identify the animals and explain a threat?","summarise one passage in your own words?","match information using exact evidence?","use the new word forms?","give a balanced opinion?"].map(x=>'<div class="prompt">'+x+'</div>').join("")+'<div class="fact">Challenge: use conservation, endangered and habitat in one sentence.</div>'+img("snow"))+'</div>';
return "";
}
function reading(){
const texts=d.passages.map(p=>{let t=esc(p.text);if(highlight&&highlight.letter===p.id){let f=esc(highlight.phrase);t=t.replace(f,'<mark id="hit">'+f+'</mark>')}return '<article class="passage"><h4><b>'+p.id+'</b>'+esc(p.name)+'</h4><p>'+t+'</p></article>'}).join("");
const tabs=[["skim","Skim"],["expert","Read & Share"],["practice","Practice"],["questions","Questions 1–10"]];
let right='<div class="tabs">'+tabs.map(x=>btn(x[1],"tab-"+x[0],readingTab===x[0]?"selected":"alt")).join("")+'</div>';
if(readingTab==="expert")right+='<div class="prompt">Read one text each. Find the main idea, two details and the writer’s opinion. Tell the other group members what you found out.</div>'+guidance()+'<h3>My summary</h3>'+note("summary")+'<h3>Notes from my group</h3>'+note("peer");
else right+=(readingTab==="questions"?'<div class="prompt">Read questions 1–10. Choose A–E. Find the words that support your answers.</div>':'<div class="prompt">Read the texts for the information you need. Compare your answers with a partner.</div>')+questions(active(),false);
return '<div class="reading"><section class="readpane"><h3>FULL TEXTS A–E · SCROLL UP / DOWN</h3><div id="textscroll" class="scroll">'+texts+'</div></section><section class="readpane"><h3>READING ACTIVITIES · SCROLL UP / DOWN</h3><div id="taskscroll" class="scroll">'+right+'</div></section></div>';
}
function render(keep){let a=0,b=0;if(keep){a=document.getElementById("textscroll")?.scrollTop||0;b=document.getElementById("taskscroll")?.scrollTop||0}
const s=paper();
const title=s.type==="cover"||s.type==="thanks"?"":'<div class="overline">'+esc(s.label)+'</div><h1 class="title">'+esc(s.title)+'</h1>'+(s.instruction?'<p class="direction">'+esc(s.instruction)+'</p>':"");
const help='<div class="reveal"><b>KEY / SUGGESTED ANSWER</b><div>'+esc(s.key)+'</div></div>',proof='<div class="reveal"><b>EVIDENCE / REFERENCE</b><div>'+esc(s.evidence)+'</div></div>';
app.innerHTML='<header><div class="brand">E-LEAP</div><div class="subhead">OBJECTIVE FIRST B2 · U4.1 · ENDANGERED</div><span class="review">OFFLINE REVIEW</span>'+btn("Check","check","alt")+btn("Reset","reset","alt")+btn(globalKeys[page]?"Hide key":"Show key","key","lime")+btn(globalEvidence[page]?"Hide evidence":"Evidence","proof","alt")+btn(timer===null?"Timer 5:00":"⏱ "+Math.floor(seconds/60)+":"+String(seconds%60).padStart(2,"0"),"timer","alt")+'</header><main>'+title+scene()+'<div class="row" style="margin-top:15px">'+btn(globalKeys[page]?"Hide key":"Show key","key","lime")+btn(globalEvidence[page]?"Hide evidence":"Evidence","proof","ghost")+'</div>'+(globalKeys[page]?help:"")+(globalEvidence[page]?proof:"")+'</main><footer>'+btn("← Previous","prev","alt")+'<span class="count">'+(page+1)+' / '+d.slides.length+'</span><div class="bar"><span style="width:'+((page+1)/d.slides.length*100)+'%"></span></div>'+btn("Next →","next","")+'</footer>';
if(keep){const l=document.getElementById("textscroll"),r=document.getElementById("taskscroll");if(l)l.scrollTop=a;if(r)r.scrollTop=b}
}
function checkItem(i){const q=active()[i];if(!q)return false;let v=String(val(i)).trim().toLowerCase();const ok=v===String(q.a).toLowerCase(),el=document.getElementById("flag-"+i);if(el){el.textContent=!v?"Not answered":ok?"✓ Correct":"✕ Try again";el.className=ok?"good":"bad"}return ok}
function checkAll(){let items=active();if(!items.length){globalKeys[page]=true;render(true);return}let n=0;items.forEach((q,i)=>{if(checkItem(i))n++});let x=document.getElementById("score");if(x)x.textContent="Score: "+n+" / "+items.length+" ("+Math.round(100*n/items.length)+"%). Unanswered included."}
function next(step){page=Math.max(0,Math.min(d.slides.length-1,page+step));highlight=null;render(false)}
app.addEventListener("input",ev=>{const x=ev.target;if(x.dataset.answer!==undefined)answers[entry(Number(x.dataset.answer))]=x.value;if(x.dataset.note!==undefined)notes[page+":"+x.dataset.note]=x.value});
app.addEventListener("change",ev=>{const x=ev.target;if(x.dataset.answer!==undefined)answers[entry(Number(x.dataset.answer))]=x.value});
app.addEventListener("click",ev=>{
let x=ev.target.closest("[data-action]");if(!x)return;let action=x.dataset.action;
if(action==="prev"){next(-1);return}if(action==="next"){next(1);return}
if(action==="key"){globalKeys[page]=!globalKeys[page];render(true);return}
if(action==="proof"){globalEvidence[page]=!globalEvidence[page];render(true);return}
if(action==="check"){checkAll();return}
if(action==="reset"){for(let ob of [answers,notes,keys,evidence,whys])for(let key of Object.keys(ob))if(key.startsWith(page+":"))delete ob[key];globalKeys[page]=false;globalEvidence[page]=false;highlight=null;render(true);return}
if(action==="timer"){if(timer){clearInterval(timer);timer=null;seconds=300;render(true);return}timer=setInterval(()=>{seconds--;const y=document.querySelector('[data-action="timer"]');if(y)y.textContent="⏱ "+Math.floor(seconds/60)+":"+String(seconds%60).padStart(2,"0");if(seconds<=0){clearInterval(timer);timer=null;seconds=300;alert("Time is up.");render(true)}},1000);render(true);return}
if(action.startsWith("tab-")){readingTab=action.slice(4);highlight=null;render(true);return}
if(action.startsWith("item-")){checkItem(Number(action.slice(5)));return}
for(const [prefix,storage] of [["show-",keys],["evid-",evidence],["why-",whys]])if(action.startsWith(prefix)){const i=Number(action.slice(prefix.length)),q=active()[i],k=entry(i);storage[k]=!storage[k];if(prefix==="evid-"&&paper().type==="reading"&&q?.letter){highlight={letter:q.letter,phrase:q.phrase};render(true);const box=document.getElementById("textscroll"),hit=document.getElementById("hit");if(box&&hit)box.scrollTop+=hit.getBoundingClientRect().top-box.getBoundingClientRect().top-75;return}render(true);return}
});
document.addEventListener("keydown",ev=>{if(["TEXTAREA","INPUT","SELECT"].includes(document.activeElement?.tagName))return;if(ev.key==="ArrowLeft")next(-1);else if(ev.key==="ArrowRight")next(1)});
render(false);
})();