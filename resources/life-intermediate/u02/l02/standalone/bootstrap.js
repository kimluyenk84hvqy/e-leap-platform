(async()=>{
  const stage=document.getElementById('screenStage');
  const parts=await Promise.all(['screens-2c.html','screens-2d.html'].map(async p=>{const r=await fetch(p);if(!r.ok)throw new Error(`Failed to load ${p}: ${r.status}`);return r.text()}));
  stage.innerHTML=parts.join('\n');
  const script=document.createElement('script');script.src='app.js';script.defer=false;document.body.appendChild(script);
})().catch(err=>{console.error(err);document.getElementById('screenStage').innerHTML='<section class="screen active" style="padding:40px"><h1>Lesson loading error</h1><p>Please reload the lesson.</p></section>';});
