(()=>{
'use strict';
const RESOURCE_ID='res-life-intermediate-u01-l03';
const CARD_ID='life-intermediate-live-card';

function injectLifeCard(){
  const content=document.getElementById('content');
  const pageTitle=document.getElementById('pageTitle');
  if(!content||pageTitle?.textContent?.trim()!=='Courses')return;
  if(document.getElementById(CARD_ID))return;

  const headings=[...content.querySelectorAll('.section-title h3')];
  const coursebooksHeading=headings.find(h=>h.textContent.trim()==='Coursebooks');
  if(!coursebooksHeading)return;
  const section=coursebooksHeading.closest('.section-title');
  const grid=section?.nextElementSibling;
  if(!grid?.classList?.contains('grid'))return;

  const card=document.createElement('div');
  card.id=CARD_ID;
  card.className='card shell-card';
  card.innerHTML=`
    <button class="card-open" type="button" aria-label="Open Life Intermediate Unit 1E and 1F">
      <h3>Life Intermediate</h3>
      <div class="gov-status"><span class="status-badge status-published">PUBLISHED</span></div>
      <small style="display:block;margin-top:8px;color:#60756e;font-weight:700">Unit 1E–1F · Personal Information &amp; My Local Park</small>
      <span class="arrow">→</span>
    </button>`;
  card.querySelector('button').addEventListener('click',()=>{
    location.href=`engine/lesson-host.html?resource=${encodeURIComponent(RESOURCE_ID)}`;
  });
  grid.appendChild(card);
}

let timer=null;
const observer=new MutationObserver(()=>{
  clearTimeout(timer);
  timer=setTimeout(injectLifeCard,30);
});
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('load',injectLifeCard);
setTimeout(injectLifeCard,100);
})();
