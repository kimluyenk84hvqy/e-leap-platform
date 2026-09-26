
const $=(s,c=document)=>c.querySelector(s);
const $$=(s,c=document)=>[...c.querySelectorAll(s)];
const app=$(".app");
let role="teacher";
const meta={
  courses:["Courses","Programmes, classes and lessons"],
  skills:["Skills Lab","Focused practice by skill"],
  assignments:["Assignments","Submit, grade and return work"],
  mock:["Mock Tests","Four-skill assessment"],
  progress:["Progress","Completion, performance and engagement"]
};

function showView(id){
  $$(".view").forEach(v=>v.classList.remove("active"));
  $("#"+id)?.classList.add("active");
  const m=meta[id]||[id.replaceAll("-"," "),""];
  $("#topTitle").textContent=m[0];
  $("#topSub").textContent=m[1];
  $$(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===id));
  window.scrollTo({top:0,behavior:"smooth"});
}
$$(".nav-item").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.view)));

function applyRole(){
  app.dataset.role=role;
  $("#roleText").textContent=role==="teacher"?"Teacher":"Student";
  $("#progressTitle").textContent=role==="teacher"?"Class progress":"My progress";
  $$(".role-btn").forEach(b=>b.classList.toggle("active",b.dataset.role===role));
}
$$(".role-btn").forEach(b=>b.addEventListener("click",()=>{role=b.dataset.role;applyRole()}));
applyRole();

const courses={
 objective:{title:"Objective First B2",level:"B2 COURSE",desc:"Exam-oriented English with classroom delivery and self-study.",units:"12",classes:"3",current:"U2 · L3"},
 life:{title:"Life Intermediate",level:"INTERMEDIATE COURSE",desc:"General English with communicative lessons, practice and tracked progress.",units:"12",classes:"2",current:"U4 · L1"},
 pharmacy:{title:"English for Pharmacy",level:"ESP PROGRAMME",desc:"English for Specific Purposes for pharmacy learners.",units:"8",classes:"1",current:"U1 · L1"},
 medical:{title:"Medical English",level:"ESP PROGRAMME",desc:"English for Specific Purposes for medical learners.",units:"8",classes:"1",current:"U1 · L1"}
};
$$(".open-course").forEach(b=>b.addEventListener("click",()=>{
  const c=courses[b.dataset.course];
  $("#courseTitle").textContent=c.title;
  $("#courseLevel").textContent=c.level;
  $("#courseDesc").textContent=c.desc;
  $("#summaryUnits").textContent=c.units;
  $("#summaryClasses").textContent=c.classes;
  $("#summaryCurrent").textContent=c.current;
  showView("course-detail");
}));

$("#backToCourses").addEventListener("click",()=>showView("courses"));
$("#backToCourse").addEventListener("click",()=>showView("course-detail"));
$("#backToUnit").addEventListener("click",()=>showView("unit-detail"));
$("#backToClasses").addEventListener("click",()=>showView("course-detail"));
$("#backToClass").addEventListener("click",()=>showView("class-detail"));
$(".open-unit").addEventListener("click",()=>showView("unit-detail"));
$(".open-lesson").addEventListener("click",()=>showView("lesson"));
$(".open-class").addEventListener("click",()=>showView("class-detail"));
$(".open-student").addEventListener("click",()=>showView("student-profile"));

$$("[data-course-tab]").forEach(b=>b.addEventListener("click",()=>{
  $$(".course-panel").forEach(p=>p.classList.remove("active"));
  $$("[data-course-tab]").forEach(x=>x.classList.remove("active"));
  b.classList.add("active");
  $(`[data-course-panel="${b.dataset.courseTab}"]`)?.classList.add("active");
}));
$$("[data-class-tab]").forEach(b=>b.addEventListener("click",()=>{
  $$(".class-panel").forEach(p=>p.classList.remove("active"));
  $$("[data-class-tab]").forEach(x=>x.classList.remove("active"));
  b.classList.add("active");
  $(`[data-class-panel="${b.dataset.classTab}"]`)?.classList.add("active");
}));
$$("[data-assignment-tab]").forEach(b=>b.addEventListener("click",()=>{
  $$(".assignment-panel").forEach(p=>p.classList.remove("active"));
  $$("[data-assignment-tab]").forEach(x=>x.classList.remove("active"));
  b.classList.add("active");
  $(`[data-assignment-panel="${b.dataset.assignmentTab}"]`)?.classList.add("active");
}));
$$(".lesson-mode").forEach(b=>b.addEventListener("click",()=>{
  $$(".lesson-mode").forEach(x=>x.classList.remove("active"));
  b.classList.add("active");
}));
$$(".stage").forEach(b=>b.addEventListener("click",()=>{
  $$(".stage").forEach(x=>x.classList.remove("active"));
  b.classList.add("active");
}));

function openClassroom(){ $("#classroom").classList.add("active"); }
["courseStartClass","startClassBtn","classStartBtn"].forEach(id=>$("#"+id)?.addEventListener("click",openClassroom));
$("#exitClassroom").addEventListener("click",()=>$("#classroom").classList.remove("active"));

$("#courseOpenLesson")?.addEventListener("click",()=>showView("lesson"));
