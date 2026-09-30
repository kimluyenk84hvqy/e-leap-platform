// E-LEAP Runtime Engine v1.0
// Part 1/3
// Core loader + shell

import { platform, programs } from "./data/catalog.js";
import { objectivesB1 } from "./data/objectives-b1-unit1.js";
import { loadCourse } from "./services/course-loader.js";
const app = document.querySelector("#app");

let currentLesson = null;
let currentScreenIndex = 0;
let mode = "student";

let responses = JSON.parse(
  localStorage.getItem("eleap-responses") || "{}"
);


const dataStore = {
  "objectives-b1": objectivesB1
};


function saveResponses(){
  localStorage.setItem(
    "eleap-responses",
    JSON.stringify(responses)
  );
}


function escapeHTML(text=""){
  return String(text)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;");
}


function shell(content){

  app.innerHTML = `

  <div class="shell">

    <aside class="side">

      <div class="brand">
        ${platform?.name || "E-LEAP"}
      </div>

      <button data-nav="home">
        Dashboard
      </button>

      <button data-nav="courses">
        Courses
      </button>

      <button data-nav="skills">
        Skills Lab
      </button>

      <button data-nav="assignments">
        Assignments
      </button>

      <button data-nav="progress">
        Progress
      </button>

    </aside>


    <main class="main">

      ${content}

    </main>

  </div>

  `;


  bindGlobal();

}



function bindGlobal(){

 document
 .querySelectorAll("[data-nav]")
 .forEach(btn=>{

   btn.onclick=()=>renderHome();

 });

}



function renderHome(){

 shell(`

 <h1>
 E-LEAP
 </h1>


 <p>
 Select a course to continue.
 </p>


 <div class="cards">

 ${
 programs.map(p=>`

 <button 
 class="card"
 data-course="${p.id}"
 >

 ${p.title}

 </button>

 `).join("")
 }


 </div>

 `);


 document
 .querySelectorAll("[data-course]")
 .forEach(btn=>{

 btn.onclick=()=>loadCourse(
   btn.dataset.course
 );

 });


}



function loadCourse(id){

 const program =
 dataStore[id] ||
 dataStore["objectives-b1"];


 currentLesson =
 program.units?.[0]?.lessons?.[0]
 ||
 program;


 currentScreenIndex=0;


 renderLesson();

}// ==============================
// PART 2/3
// SCREEN RENDERERS
// ==============================


function renderLesson(){

 if(!currentLesson){
   shell("<h2>No lesson found</h2>");
   return;
 }


 const screens =
 currentLesson.screens || [];


 shell(`

 <div class="lesson-head">

 <h1>
 ${escapeHTML(currentLesson.title || "Lesson")}
 </h1>


 <button id="mode">
 Mode: ${mode}
 </button>


 </div>


 <section id="screen">

 ${renderScreen(
 screens[currentScreenIndex]
 )}

 </section>

 `);



 document
 .querySelector("#mode")
 ?.addEventListener("click",()=>{

 mode =
 mode==="student"
 ?
 "teacher"
 :
 "student";


 renderLesson();

 });



 bindScreen();

}



function renderScreen(s){

 if(!s){

 return `
 <h2>
 Lesson completed
 </h2>
 `;

 }


 let body="";


 switch(s.type){


 case "quick-choice":

 body =
 renderQuickChoice(s);

 break;



 case "questions":

 body =
 renderQuestions(s);

 break;



 case "text-response":

 body =
 renderTextResponse(s);

 break;



 case "assignment":

 body =
 renderTextResponse(s);

 break;



 case "exit_ticket":

 body =
 renderExitTicket(s);

 break;



 case "challenge-cards":

 body =
 renderChallengeCards(s);

 break;



 case "end-screen":

 body =
 `
 <h2>
 Thank You!
 </h2>
 `;

 break;



 default:


 body =
 `
 <p>
 ${escapeHTML(
 s.instruction || ""
 )}
 </p>
 `;

 }



 return `


 <article class="screen-card">


 <h2>
 ${escapeHTML(s.title || "")}
 </h2>


 <p>
 ${escapeHTML(s.instruction || "")}
 </p>


 ${body}



 <div class="controls">


 <button data-prev>
 Previous
 </button>


 <button data-next>
 Next
 </button>


 </div>



 </article>


 `;

}



function renderQuickChoice(s){

 return `


 <p>
 ${escapeHTML(
 s.question || ""
 )}
 </p>


 ${
 (s.options || [])
 .map(o=>`

 <button
 class="option"
 data-answer="${escapeHTML(o)}">

 ${escapeHTML(o)}

 </button>


 `).join("")
 }


 <div id="feedback"></div>


 `;

}



function renderQuestions(s){

 return `


 ${
 (s.questions || [])
 .map((q,i)=>`

 <div class="question">


 <b>
 ${i+1}.
 ${escapeHTML(q)}
 </b>


 <textarea
 data-question="${i}"
 placeholder="Your answer">
 </textarea>


 </div>


 `).join("")
 }



 <button data-submit>
 Submit
 </button>


 `;

}



function renderTextResponse(s){

 return `


 <textarea

 id="response"

 placeholder="Type your response here...">

 </textarea>



 <button data-submit>

 Submit

 </button>


 `;

}



function renderExitTicket(s){

 return `


 ${
 (s.fields || [])
 .map(f=>`

 <label>

 ${escapeHTML(f)}

 </label>


 <textarea></textarea>


 `).join("")
 }



 <button data-submit>

 Submit

 </button>


 `;

}



function renderChallengeCards(s){

 return `


 ${
 (s.items || [])
 .map((x,i)=>`

 <button
 class="challenge"
 data-card="${i}">

 ${escapeHTML(x.prompt)}

 </button>


 `).join("")
 }


 `;

}// ==============================
// PART 3/3
// SUBMIT + NAVIGATION + START
// ==============================


function bindScreen(){


document
.querySelectorAll(".option")
.forEach(btn=>{


btn.onclick=()=>{


responses.answer =
btn.dataset.answer;


saveResponses();


const fb =
document.querySelector("#feedback");


if(fb){

fb.innerText =
"Submitted";

}


};


});



document
.querySelectorAll("[data-submit]")
.forEach(btn=>{


btn.onclick=()=>{


const box =
document.querySelector("#response");


if(box){

responses.text =
box.value;

}


saveResponses();


btn.innerText =
"Submitted";


};


});




document
.querySelector("[data-next]")
?.addEventListener(
"click",
()=>{


const screens =
currentLesson.screens || [];


if(
currentScreenIndex <
screens.length-1
){

currentScreenIndex++;

renderLesson();

}


});


document
.querySelector("[data-prev]")
?.addEventListener(
"click",
()=>{


if(
currentScreenIndex>0
){

currentScreenIndex--;

renderLesson();

}


});


}




// START E-LEAP

renderHome();
