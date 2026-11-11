/* E-LEAP Resource Workshop. Local-only media processing, no API uploads.
 * Evidence segments require intro review + actual playback + explicit approval.
 */
const $=id=>document.getElementById(id);
const fmt=n=>Number(n||0).toFixed(2);
const safeName=s=>String(s||'asset').trim().toLowerCase().replace(/[^a-z0-9_-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,70)||'asset';
const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const manifest=[];
function downloadBlob(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),20000)}
function addRecord(record){manifest.push({...record,lessonId:$('lessonId').value.trim(),sourceLabel:$('sourceLabel').value.trim(),createdAt:new Date().toISOString()});renderManifest()}
function renderManifest(){
 $('manifestList').innerHTML=manifest.length?manifest.map(a=>'<div class="manifest-item"><strong>'+escapeHTML(a.assetId)+'</strong> · '+escapeHTML(a.filename)+' <span class="muted">'+escapeHTML(a.type)+' · '+escapeHTML(a.reviewStatus)+'</span></div>').join(''):'No exported assets yet.';
}
$('downloadManifest').addEventListener('click',()=>downloadBlob(new Blob([JSON.stringify({schema:'eleap-resource-workshop-v1',generatedAt:new Date().toISOString(),assets:manifest},null,2)],{type:'application/json'}),safeName($('lessonId').value)+'-resource-manifest.json'));
$('clearManifest').addEventListener('click',()=>{if(confirm('Clear this session manifest? Exported files on your computer are not deleted.')){manifest.length=0;renderManifest()}});

let pdf=null,sourceImage=null,currentPage=1,sourceFilename='',selection=null,imgBusy=false;
const pageCanvas=$('pageCanvas'),pageCtx=pageCanvas.getContext('2d');
function pageButtons(){const n=pdf?.numPages||1;$('prevPage').disabled=!pdf||imgBusy||currentPage<=1;$('nextPage').disabled=!pdf||imgBusy||currentPage>=n;$('pageInfo').textContent=sourceImage?'Image · 1/1':pdf?'PDF · Page '+currentPage+'/'+n:'No page loaded';}
function clearSelection(){selection=null;$('cropSelection').style.display='none';$('saveCrop').disabled=true}
$('resetCrop').addEventListener('click',clearSelection);
async function showPdfPage(n){
 if(!pdf)return;imgBusy=true;pageButtons();clearSelection();
 try{
  const page=await pdf.getPage(n),view=page.getViewport({scale:1.65});
  pageCanvas.width=Math.round(view.width);pageCanvas.height=Math.round(view.height);
  await page.render({canvasContext:pageCtx,viewport:view}).promise;
  currentPage=n;$('cropStatus').textContent='Drag to select a picture or a complete picture group.';
 }catch(e){$('cropStatus').textContent='Unable to render PDF page: '+e.message}
 finally{imgBusy=false;pageButtons()}
}
$('prevPage').addEventListener('click',()=>showPdfPage(currentPage-1));
$('nextPage').addEventListener('click',()=>showPdfPage(currentPage+1));
$('imgFile').addEventListener('change',async e=>{
 const file=e.target.files?.[0];if(!file)return;
 sourceFilename=file.name;pdf=null;sourceImage=null;clearSelection();
 $('cropStatus').textContent='Opening '+file.name+'…';
 if(file.type==='application/pdf'||/\.pdf$/i.test(file.name)){
  if(!window.pdfjsLib){$('cropStatus').textContent='PDF renderer unavailable. Check internet access for PDF.js; you may use a JPG/PNG page instead.';return;}
  try{window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
   pdf=await window.pdfjsLib.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;currentPage=1;await showPdfPage(1)}
  catch(err){$('cropStatus').textContent='PDF could not be opened: '+err.message}
 }else if(file.type.startsWith('image/')){
  const url=URL.createObjectURL(file),image=new Image();
  image.onload=()=>{sourceImage=image;pageCanvas.width=image.naturalWidth;pageCanvas.height=image.naturalHeight;pageCtx.drawImage(image,0,0);URL.revokeObjectURL(url);pageButtons();$('cropStatus').textContent='Drag over the image to select a crop.'};
  image.onerror=()=>{$('cropStatus').textContent='Image could not be decoded.';URL.revokeObjectURL(url)};
  image.src=url;
 }else $('cropStatus').textContent='Select a PDF or JPG/PNG/WebP.';
});
function canvasPoint(ev){
 const b=pageCanvas.getBoundingClientRect();
 return{x:Math.max(0,Math.min(pageCanvas.width,(ev.clientX-b.left)*pageCanvas.width/b.width)),y:Math.max(0,Math.min(pageCanvas.height,(ev.clientY-b.top)*pageCanvas.height/b.height))};
}
function showSelection(){
 if(!selection)return;
 const b=pageCanvas.getBoundingClientRect(),stage=$('imgStage'),sb=stage.getBoundingClientRect(),x=Math.min(selection.x1,selection.x2),y=Math.min(selection.y1,selection.y2),w=Math.abs(selection.x2-selection.x1),h=Math.abs(selection.y2-selection.y1);
 const overlay=$('cropSelection');
 overlay.style.cssText='display:block;left:'+((b.left-sb.left)+stage.scrollLeft+x*b.width/pageCanvas.width)+'px;top:'+((b.top-sb.top)+stage.scrollTop+y*b.height/pageCanvas.height)+'px;width:'+(w*b.width/pageCanvas.width)+'px;height:'+(h*b.height/pageCanvas.height)+'px';
 $('saveCrop').disabled=w<20||h<20;
}
let cropPointer=null;
pageCanvas.addEventListener('pointerdown',e=>{if(!pageCanvas.width||imgBusy)return;cropPointer=e.pointerId;const p=canvasPoint(e);selection={x1:p.x,y1:p.y,x2:p.x,y2:p.y};pageCanvas.setPointerCapture(e.pointerId);showSelection()});
pageCanvas.addEventListener('pointermove',e=>{if(cropPointer!==e.pointerId||!selection)return;const p=canvasPoint(e);selection.x2=p.x;selection.y2=p.y;showSelection()});
for(const event of ['pointerup','pointercancel'])pageCanvas.addEventListener(event,e=>{if(cropPointer!==e.pointerId)return;cropPointer=null;showSelection()});
$('saveCrop').addEventListener('click',()=>{
 if(!selection)return;const x=Math.floor(Math.min(selection.x1,selection.x2)),y=Math.floor(Math.min(selection.y1,selection.y2)),w=Math.ceil(Math.abs(selection.x2-selection.x1)),h=Math.ceil(Math.abs(selection.y2-selection.y1));if(w<20||h<20)return;
 const crop=document.createElement('canvas');crop.width=Math.min(w,pageCanvas.width-x);crop.height=Math.min(h,pageCanvas.height-y);
 crop.getContext('2d').drawImage(pageCanvas,x,y,crop.width,crop.height,0,0,crop.width,crop.height);
 const assetId=safeName($('lessonId').value)+'-'+safeName($('cropName').value),filename=assetId+'.png';
 crop.toBlob(blob=>{if(!blob){$('cropStatus').textContent='Crop encoding failed.';return;}downloadBlob(blob,filename);
 addRecord({assetId,filename,type:$('cropType').value,sourceFilename,sourcePage:currentPage,regionPixels:{x,y,width:crop.width,height:crop.height},reviewStatus:'crop-exported-needs-visual-review',mediaType:'image/png'});
 $('cropStatus').textContent='Exported '+filename+' · Check its edges and content before approving.'},'image/png');
});

let audioContext=null,audioBuffer=null,audioFilename='',activeSource=null,hasPlayedSelection=false,playedBounds='',duration=0;
const start=$('clipStart'),end=$('clipEnd'),startRange=$('startRange'),endRange=$('endRange');
function stopAudio(){if(activeSource){try{activeSource.stop()}catch{}activeSource.disconnect();activeSource=null}}
$('stopClip').addEventListener('click',stopAudio);
function boundaries(){return{a:Number(start.value),b:Number(end.value),intro:Number($('introEnds').value)}}
function validBounds(){
 const {a,b,intro}=boundaries();
 return !!audioBuffer&&Number.isFinite(a)&&Number.isFinite(b)&&Number.isFinite(intro)&&a>=0&&b<=duration+0.001&&b>a+.1&&intro>=0&&intro<=a;
}
function invalidateVerification(){
 hasPlayedSelection=false;playedBounds='';$('verified').checked=false;$('exportClip').disabled=true;
}
function drawWave(){
 const canvas=$('wave'),c=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
 c.clearRect(0,0,w,h);c.fillStyle='#eaf2ea';c.fillRect(0,0,w,h);
 if(!audioBuffer)return;
 const data=audioBuffer.getChannelData(0),stride=Math.max(1,Math.floor(data.length/w));
 c.fillStyle='#267353';
 for(let x=0;x<w;x++){
  let max=0;const offset=x*stride,limit=Math.min(offset+stride,data.length);
  for(let i=offset;i<limit;i++)max=Math.max(max,Math.abs(data[i]));
  const half=max*(h/2-7);c.fillRect(x,h/2-half,1,Math.max(1,half*2));
 }
 const {a,b,intro}=boundaries();const x1=w*a/duration,x2=w*b/duration,xIntro=w*intro/duration;
 c.fillStyle='rgba(155,196,41,.23)';c.fillRect(x1,0,Math.max(0,x2-x1),h);
 c.fillStyle='#da5939';c.fillRect(xIntro,0,2,h);
 c.fillStyle='#194dd4';c.fillRect(x1,0,3,h);c.fillRect(x2,0,3,h);
}
function onBoundaryEdited(source){
 if(source==='startRange')start.value=startRange.value;
 if(source==='endRange')end.value=endRange.value;
 if(source==='clipStart')startRange.value=start.value;
 if(source==='clipEnd')endRange.value=end.value;
 invalidateVerification();drawWave();updateEvidenceButtons();
}
for(const id of ['clipStart','clipEnd','startRange','endRange','introEnds'])$(id).addEventListener('input',()=>onBoundaryEdited(id));
$('introReviewed').addEventListener('change',()=>{invalidateVerification();updateEvidenceButtons()});
$('clipTranscript').addEventListener('input',()=>{invalidateVerification();updateEvidenceButtons()});
$('evidenceId').addEventListener('input',updateEvidenceButtons);
function updateEvidenceButtons(){
 const ok=validBounds();
 $('playClip').disabled=!ok;$('exportDraft').disabled=!ok;
 const {a,b}=boundaries();
 const heard=hasPlayedSelection&&playedBounds===a+':'+b;
 $('exportClip').disabled=!(ok&&heard&&$('introReviewed').checked&&$('verified').checked&&$('evidenceId').value.trim()&&$('clipTranscript').value.trim());
}
$('verified').addEventListener('change',updateEvidenceButtons);
$('audioFile').addEventListener('change',async e=>{
 stopAudio();audioBuffer=null;invalidateVerification();
 $('introReviewed').checked=false;$('introEnds').value='0';$('audioStatus').textContent='Decoding audio…';$('audioInfo').textContent='Reading source…';
 const file=e.target.files?.[0];if(!file)return;audioFilename=file.name;
 try{
  if(file.size>90*1024*1024)throw Error('File exceeds 90 MB local processing limit. Use a smaller source file.');
  audioContext ||= new (window.AudioContext||window.webkitAudioContext)();
  const raw=await file.arrayBuffer();
  audioBuffer=await audioContext.decodeAudioData(raw);
  duration=audioBuffer.duration;
  start.value=startRange.value=0;end.value=endRange.value=fmt(duration);
  for(const id of ['clipStart','clipEnd','startRange','endRange','introEnds'])$(id).max=fmt(duration);
  $('audioInfo').textContent=audioFilename+' · '+fmt(duration)+'s · '+audioBuffer.numberOfChannels+' channel(s). The original is unchanged.';
  $('audioStatus').textContent='First inspect and mark the intro boundary; then set a conversation clip and play to verify.';
  $('introMark').disabled=false;drawWave();updateEvidenceButtons();
 }catch(err){$('audioStatus').textContent='Audio decoding failed: '+err.message}
});
// The intro marker is only usable after a source audio file is decoded.
$('introMark').addEventListener('click',()=>{if(!audioBuffer)return;$('introEnds').value=start.value;invalidateVerification();drawWave();updateEvidenceButtons();$('audioStatus').textContent='Intro boundary recorded. Play the conversation and verify that no introduction remains.'});
$('wave').addEventListener('click',e=>{
 if(!audioBuffer)return;const b=$('wave').getBoundingClientRect(),time=Math.max(0,Math.min(duration,(e.clientX-b.left)/b.width*duration));start.value=startRange.value=fmt(time);onBoundaryEdited('clipStart');
});
$('playClip').addEventListener('click',async()=>{
 if(!validBounds())return;stopAudio();await audioContext.resume();
 const {a,b}=boundaries(),src=audioContext.createBufferSource();src.buffer=audioBuffer;src.connect(audioContext.destination);activeSource=src;src.onended=()=>{if(activeSource===src)activeSource=null};
 src.onended=()=>{if(activeSource!==src)return;activeSource=null;hasPlayedSelection=true;playedBounds=a+':'+b;updateEvidenceButtons();$('audioStatus').textContent='Clip playback completed. Check its first/last spoken words and exclude the introduction before approving.'};
 src.start(0,a,b-a);src.stop(audioContext.currentTime+b-a);
 $('audioStatus').textContent='Playing '+fmt(a)+'–'+fmt(b)+' s. Wait for the full segment to finish before verifying.';
});
function encodeWav(buffer,a,b){
 const sr=buffer.sampleRate,channels=buffer.numberOfChannels,begin=Math.floor(a*sr),stop=Math.min(buffer.length,Math.ceil(b*sr)),n=stop-begin;
 if(n<1)throw Error('Empty selection');
 const ab=new ArrayBuffer(44+n*channels*2),view=new DataView(ab),u8=new Uint8Array(ab);
 const ascii=(pos,str)=>{for(let i=0;i<str.length;i++)u8[pos+i]=str.charCodeAt(i)};
 ascii(0,'RIFF');view.setUint32(4,ab.byteLength-8,true);ascii(8,'WAVE');ascii(12,'fmt ');
 view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,channels,true);
 view.setUint32(24,sr,true);view.setUint32(28,sr*channels*2,true);view.setUint16(32,channels*2,true);view.setUint16(34,16,true);
 ascii(36,'data');view.setUint32(40,n*channels*2,true);
 let pos=44;for(let i=begin;i<stop;i++)for(let ch=0;ch<channels;ch++){
  const sample=Math.max(-1,Math.min(1,buffer.getChannelData(ch)[i]));
  view.setInt16(pos,sample<0?sample*32768:sample*32767,true);pos+=2;
 }
 return new Blob([ab],{type:'audio/wav'});
}
function exportSegment(verified){
 if(!validBounds())return;
 const {a,b,intro}=boundaries();if(verified&&$('exportClip').disabled)return;
 try{
  const assetId=safeName($('lessonId').value)+'-'+safeName($('clipName').value),suffix=verified?'-verified':'-REVIEW-UNVERIFIED',filename=assetId+suffix+'.wav';
  const wav=encodeWav(audioBuffer,a,b);downloadBlob(wav,filename);
  addRecord({assetId,filename,type:'audio-segment',mediaType:'audio/wav',sourceFilename:audioFilename,sourceStartSeconds:a,sourceEndSeconds:b,introBoundarySeconds:intro,firstWordsChecked:$('clipTranscript').value.trim(),evidenceTargetId:$('evidenceId').value.trim()||null,reviewStatus:verified?'teacher-verified':'unverified-review-only',verifiedIntro:$('introReviewed').checked,playbackChecked:hasPlayedSelection});
  $('audioStatus').textContent='Exported '+filename+(verified?' · VERIFIED locally':' · REVIEW ONLY, not valid for Evidence');
 }catch(err){$('audioStatus').textContent='Clip export failed: '+err.message}
}
$('exportClip').addEventListener('click',()=>exportSegment(true));
$('exportDraft').addEventListener('click',()=>exportSegment(false));
pageButtons();renderManifest();
