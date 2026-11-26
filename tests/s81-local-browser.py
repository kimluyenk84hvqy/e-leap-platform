"""Local-only actual Studio UI test. All API/media calls are fixture responses, no real account or DB."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import os,json,sys,base64,hashlib,uuid,subprocess,re
ROOT=Path(__file__).resolve().parent.parent
os.chdir(ROOT)
fixtures=Path(sys.argv[1]) if len(sys.argv)>1 else Path('/mnt/data')
# This environment blocks all browser navigations. Import the real module graph via
# an import map of data URLs in about:blank. Only bootstrap query is injected.
# fetch, storage and image hash lookup are fixtures, not production services.
modules={}
pattern=re.compile(r"((?:\bfrom\s*|\bimport\s*(?:\(\s*)?)['\"])(\.{1,2}/[^'\"]+)(['\"])")
def module(path):
 path=path.resolve();name='eleap/'+str(path.relative_to(ROOT));
 if name in modules:return name
 modules[name]=''
 source=path.read_text()
 if path.name=='authoring-studio.js':source=source.replace("new URLSearchParams(location.search)","new URLSearchParams('serverDraft=s81-fixture')")
 source=pattern.sub(lambda m:m[1]+module(path.parent/m[2])+m[3],source)
 modules[name]='data:text/javascript;base64,'+base64.b64encode(source.encode()).decode()
 return name
entry=module(ROOT/'assets/js/authoring-studio.js')
hostmod=module(ROOT/'assets/js/controls/host-control-shell.js')
lifemod=module(ROOT/'assets/js/authoring/pilot-life-u12.js')
modelmod=module(ROOT/'assets/js/authoring/lesson-model.js')
profilemod=module(ROOT/'assets/js/authoring/course-profile-registry.js')
previewmod=module(ROOT/'assets/js/authoring/interactive-preview.js')
dockmod=module(ROOT/'assets/js/controls/studio-control-dock.js')
modules['eleap/reopen']=modules[entry]+'#reopen'
modules['https://esm.sh/@vercel/blob@2.6.1/client?bundle']='data:text/javascript;base64,'+base64.b64encode(b'export async function uploadPresigned(){throw Error("unexpected fixture upload")}').decode()
css='\n'.join((ROOT/'assets/css'/n).read_text() for n in ['e-leap-design-system.css','studio.css','studio-template-contracts.css','studio-certified-templates.css','studio-template-gallery.css','studio-resource-assembly.css'])
files=[('U4.1_GOLDEN_BLUEPRINT_R54B.json','objective-first-b2','U4.1'),('U4.2_GOLDEN_BLUEPRINT_R52C_OFFLINE_MEDIA_REFINED.json','objective-first-b2','U4.2')]
def starter(course,code):
 return json.loads(subprocess.check_output(['node','--input-type=module','-e',f'''import {{createLesson}} from './assets/js/authoring/lesson-model.js';import {{createCourseDraft}} from './assets/js/authoring/course-profile-registry.js';const d=createCourseDraft({json.dumps(course)},createLesson);d.id='s81-fixture';d.lessonNumber={json.dumps(code)};d.title='Local QA';console.log(JSON.stringify(d));'''],stderr=subprocess.DEVNULL))
def dock(page,action): return page.locator('[data-studio-action="'+action+'"]')
def open_slide(page,index):
 if page.locator('.studio-presentation').count():page.locator('[data-exit-presentation]').click()
 page.locator(f'[data-slide="{index}"]').click()
def step(page,i): page.locator('[data-combo-step]').nth(i).click()
def select_role(page,role): page.locator(f'[data-preview-role="{role}"]').click()
def wait_save(page):page.wait_for_function("document.querySelector('[data-studio-status]')?.textContent.includes('Saved on Preview server')",timeout=15000)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);
 for filename,course,code in files:
  package=json.load(open(fixtures/filename));media={};hashes={};errors=[];row={'draft':starter(course,code),'revision':1};writes=[]
  for a in package['assets']:
   data=base64.b64decode(a['base64']);sha=hashlib.sha256(data).hexdigest();asset=str(uuid.uuid5(uuid.NAMESPACE_URL,sha));hashes[sha]=asset;media[asset]=data
  page=browser.new_page(viewport={'width':1920,'height':1080},accept_downloads=True);page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
  digest={str(len(data))+':'+data[:24].hex():hashlib.sha256(data).hexdigest() for data in media.values()}
  page.set_content('<style>'+css+'</style><script type="importmap">'+json.dumps({'imports':modules})+'</script><main id="studio"></main>')
  page.evaluate("""({row,hashes,digest})=>{
    window.fixture={row,writes:[]};
    const makeStorage=()=>{const map=new Map();return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k),clear:()=>map.clear()}};
    Object.defineProperty(window,'localStorage',{value:makeStorage(),configurable:true});Object.defineProperty(window,'sessionStorage',{value:makeStorage(),configurable:true});
    window.confirm=()=>true;
    if(!crypto.subtle)Object.defineProperty(crypto,'subtle',{value:{digest:async (alg,bytes)=>{const b=new Uint8Array(bytes);const k=b.length+':'+Array.from(b.slice(0,24),x=>x.toString(16).padStart(2,'0')).join('');if(!digest[k])throw Error('unknown fixture image');return Uint8Array.from(digest[k].match(/../g),x=>parseInt(x,16)).buffer;}}});
    window.fetch=async (url,opts={})=>{
     const path=String(url),respond=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
     if(path==='/api/auth/me')return respond({user:{id:'11111111-1111-4111-8111-111111111111',role:'teacher',permissions:['studio:edit']}});
     if(path.startsWith('/api/authoring/lessons')){
      if(opts.method==='POST'){const body=JSON.parse(opts.body);if(body.expectedRevision!==fixture.row.revision)return respond({ok:false,error:'fixture revision conflict'},409);fixture.row.draft=body.lesson;fixture.row.revision++;fixture.writes.push(fixture.row.revision);return respond({ok:true,saved:true,revision:fixture.row.revision});}
      return respond({ok:true,...fixture.row,drafts:[]});
     }
     if(path==='/api/authoring/pdf-ai-build')return respond({ok:true,configured:false});
     if(path.startsWith('/api/studio-media')){if(opts.method==='POST'){const assetId=hashes[JSON.parse(opts.body).sha256];if(!assetId)throw Error('unknown fixture hash');return respond({ok:true,assetId});}return respond({ok:true,uploadEnabled:true,files:[]});}
     return respond({ok:false},404);
    };
  }""",{'row':row,'hashes':hashes,'digest':digest})
  page.evaluate("name=>import(name).then(()=>true)",entry);page.locator('[data-native-lesson-file]').wait_for(state='attached');page.wait_for_timeout(250)
  page.locator('[data-native-lesson-file]').set_input_files(fixtures/filename);page.wait_for_function(f"document.querySelectorAll('[data-slide]').length=={len(package['screens'])}",timeout=25000);wait_save(page);row=page.evaluate('fixture.row')
  assert dock(page,'check').is_disabled() and dock(page,'reset').is_disabled() and dock(page,'reveal').is_disabled()
  # Direct Cover edit, no other slides or image references changed.
  before=json.loads(json.dumps(row['draft']));page.locator('[data-functional-value="lecturer"]').fill('');page.locator('[data-functional-apply]').click();assert 'Nguyen Tuan Anh' not in page.locator('.lesson-canvas').inner_text();page.locator('[data-save]').click();wait_save(page);row=page.evaluate('fixture.row')
  assert row['draft']['screens'][0]['functionalDraft']['values']['lecturer']=='';assert row['draft']['screens'][1:]==before['screens'][1:];assert row['draft']['screens'][0]['functionalDraft']['values']['image']==before['screens'][0]['functionalDraft']['values']['image']
  # Find an active objective block with evidence using actual imported lesson.
  screens=row['draft']['screens'];found=next((i,b) for i,s in enumerate(screens) for b in s['blocks'] if b.get('activity',{}).get('evidenceByItem') and b['type'] in ('fill','mcq','matching'))
  i,b=found;open_slide(page,i);s=screens[i];bs=b.get('comboStep');
  if bs: page.locator(f'[data-combo-step="{bs}"]').click()
  # Use the block picker to select the exact row, keeping stable IDs.
  idx=next(j for j,x in enumerate(s['blocks']) if x['id']==b['id']);page.locator('[data-edit-block]').select_option(str(idx));
  assert page.locator('[data-objective-apply]').is_visible();prompt=page.locator('[data-objective-field="prompt"]');prompt.fill(b['activity']['prompt']+' Please check.');page.locator('[data-objective-apply]').click();page.locator('[data-save]').click();wait_save(page);row=page.evaluate('fixture.row')
  out=row['draft']['screens'][i]['blocks'][idx]['activity'];assert out['evidenceByItem']==b['activity']['evidenceByItem'];assert out.get('items')==b['activity'].get('items');assert out.get('answerKey')==b['activity'].get('answerKey');assert out['prompt'].endswith('Please check.')
  # Actual teacher activity → Presentation → Check / Show answer / Reset → Teacher.
  assert dock(page,'check').is_enabled();assert dock(page,'reset').is_enabled();assert dock(page,'reveal').is_enabled()
  act=page.locator(f'[data-block="{idx}"] [data-local-interaction]');act.wait_for();input=act.locator('[data-local-row]').first
  expected=(out['items'][0]['answers'][0] if b['type']=='fill' else out['answerKey'][0] if b['type']=='mcq' else out['pairs'][0]['id'])
  if input.evaluate('e=>e.tagName')=='SELECT':input.select_option(expected)
  else:input.fill(expected)
  select_role(page,'presentation');assert page.locator('.studio-presentation').count()==1;assert input.input_value()==expected;assert dock(page,'check').is_visible() and dock(page,'check').is_enabled();assert dock(page,'reset').is_visible() and dock(page,'reveal').is_visible();assert page.locator('.studio-right').is_hidden();assert act.locator('[data-local-action="check"]').is_hidden()
  dock(page,'check').click();assert 'correct' in act.locator('[role=status]').first.inner_text();dock(page,'reveal').click();act.locator('[data-local-reveal]').first.click();assert act.locator('.local-preview-key').count()==1;assert act.locator('.local-preview-why').count()==1
  dock(page,'reset').click();assert input.input_value()=='';assert act.locator('.local-preview-key').count()==0;page.locator('[data-exit-presentation]').click();assert page.locator('[data-preview-role="teacher"]').get_attribute('class').endswith('primary');assert input.input_value()==''
  select_role(page,'student');assert page.locator('[data-studio-control-dock]').count()==0;assert act.locator('[data-local-action="reveal"]').count()==0;assert act.locator('[data-local-action="submit"]').is_disabled();assert page.locator('[data-preview-role="presentation"]').is_disabled();assert act.locator('[data-local-action="check"]').is_visible();select_role(page,'guest');assert act.locator('[data-local-action="reveal"]').count()==0;assert act.locator('[data-local-action="submit"]').count()==0;select_role(page,'teacher')
  # Persist active step instruction (ordinary property path).
  if bs:
   field=page.locator('[data-path="screen.instruction"]');edited=field.input_value()+' Review your answer.';field.fill(edited);page.locator('[data-refresh-content]').click();assert edited in page.locator('.canvas-instruction').inner_text();page.locator('[data-combo-step]').first.click();page.locator(f'[data-combo-step="{bs}"]').click();assert page.locator('.canvas-instruction').inner_text()==edited
  page.locator('[data-save]').click();wait_save(page);page.evaluate("()=>{document.querySelector('#studio').innerHTML='';return import('eleap/reopen').then(()=>true)}");page.wait_for_function(f"document.querySelectorAll('[data-slide]').length=={len(package['screens'])}");open_slide(page,0);assert page.locator('[data-functional-value="lecturer"]').input_value()==''
  assert not errors,errors;print(f'PASS {code}: actual Studio import ({len(package["screens"])} slides), Cover edit, stable evidence, shared dock, state, role isolation, step edit and fixture reload; {page.evaluate('fixture.writes.length')} mock saves',flush=True)
  page.close()
 # Cross-course fixture: source-grounded LIFE U12 native fill and a synthetic PET B1 activity.
 page=browser.new_page(viewport={'width':1366,'height':768});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content('<style>'+css+'</style><script type="importmap">'+json.dumps({'imports':modules})+'</script><main id="fixture"></main><header class="hostbar"><span id="roleBadge"></span></header><div id="host"></div>')
 page.evaluate("""async names=>{
 const {makeLifeU12AcceptanceFixture}=await import(names.life),{createLesson,createBlock}=await import(names.model),{createCourseDraft}=await import(names.profile);
 const preview=await import(names.preview),dock=await import(names.dock),{UnifiedLessonControls}=await import(names.host);
 const life=makeLifeU12AcceptanceFixture();const l=life.screens.flatMap(x=>x.blocks).find(x=>x.type==='fill'&&x.activity.evidenceByItem);
 const pet=createCourseDraft('objective-pet-b1',createLesson);const b=createBlock('mcq');b.activity={...b.activity,prompt:'Choose the correct sentence.',options:[{id:'A',label:'She works here.'},{id:'B',label:'She work here.'}],answerKey:['A']};pet.screens[0].blocks=[b];
 window.cross={LIFE:l,PET:b};window.mount=(course,role)=>{const b=cross[course],root=document.querySelector('#fixture');root.innerHTML=dock.renderStudioControlDock(role)+'<section class="lesson-canvas preview-'+role+'">'+preview.renderInteractivePreview(b,role)+'</section>';preview.wireInteractivePreview(root.querySelector('[data-local-interaction]'),b,role);dock.wireStudioControlDock(root,role);};
 window.hostCommands=[];const fake={contentWindow:{ELEAP_LESSON_HOST_API:{command:a=>{hostCommands.push(a);return true},getActivityState:()=>({activityId:'qa',capabilities:{check:true,reset:true,reveal:true,submit:true},assessment:{correctCount:1,totalCount:1}})}}};window.hostControl=new UnifiedLessonControls({frame:fake,role:'teacher',resourceId:'fixture-pet'});
 }""",{'life':lifemod,'model':modelmod,'profile':profilemod,'preview':previewmod,'dock':dockmod,'host':hostmod})
 for course in ['LIFE','PET']:
  page.evaluate('(course)=>mount(course,"teacher")',course);act=page.locator('#fixture [data-local-interaction]');inp=act.locator('[data-local-row]').first;value=page.evaluate('c=>cross[c].type==="fill"?cross[c].activity.items[0].answers[0]:cross[c].activity.answerKey[0]',course)
  if inp.evaluate('e=>e.tagName')=='SELECT':inp.select_option(value)
  else:inp.fill(value)
  page.evaluate('(course)=>mount(course,"presentation")',course);assert inp.input_value()==value;dock(page,'check').click();assert 'correct' in act.locator('[role=status]').first.inner_text();dock(page,'reveal').click();act.locator('[data-local-reveal]').first.click();assert act.locator('.local-preview-key').count()==1;dock(page,'reset').click();assert inp.input_value()=='';print(f'PASS {course} cross-course native adapter: {"LIFE U12 acceptance fixture" if course=="LIFE" else "synthetic PET B1 MCQ"}',flush=True)
 page.evaluate('hostControl.setPresentation(true)');assert page.locator('#hostCheckBtn').is_visible() and page.locator('#hostCheckBtn').is_enabled();page.locator('#hostCheckBtn').click();page.locator('#hostRevealBtn').click();page.locator('#hostResetBtn').click();assert page.evaluate('hostCommands')==['check','reveal','reset'];page.evaluate('hostControl.setPresentation(false)');assert page.locator('#hostPresentationBtn').inner_text()=='Presentation';assert not errors,errors;print('PASS actual UnifiedLessonControls host with mock activity API: Check, Show answer, Reset, Exit; no real Submit',flush=True)
 browser.close()
