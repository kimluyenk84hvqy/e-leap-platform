"""S8.2 Studio browser integration; synthetic source, auth, DB and media only."""
from base64 import b64decode, b64encode
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from urllib.parse import urlparse, parse_qs
from io import BytesIO
from hashlib import sha256
import json, wave
from playwright.sync_api import expect, sync_playwright

ROOT=Path(__file__).resolve().parents[1]
# Public synthetic fixture: 1x1 PNG is used for the existing image; JPEG marker
# fixture tests the packaged-image handoff. Real visual quality is separate QA.
PNG=b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lKcAAAAASUVORK5CYII=")
JPEG=bytes.fromhex("ffd8ffe000104a46494600010100000100010000ffd9")
buf=BytesIO()
with wave.open(buf,'wb') as w:
    w.setnchannels(1);w.setsampwidth(2);w.setframerate(8000);w.writeframes(b'\0\0'*4000)
WAV=buf.getvalue()
IMAGE='01234567-89ab-4def-8123-456789abcdef'
AUDIO='11234567-89ab-4def-8123-456789abcdef'
PACKAGED='21234567-89ab-4def-8123-456789abcdef'
DOC='document:31234567-89ab-4def-8123-456789abcdef'
def run(browser, origin):
    draft={'id':'s82-qa-fixture','status':'draft','courseProfileId':'life','courseLabel':'LIFE','lessonNumber':'U4.1','title':'Synthetic source draft','screens':[{'id':f'source-{i}','title':f'PDF page {p}','stage':'Imported source','instruction':'Read the source.','layout':'standard','blocks':[{'id':f'b-{i}','type':'text','content':{'text':f'Synthetic source page {p}.'}}]} for i,p in enumerate([44,47,48,49,50,51,48])]}
    record={'draft':draft,'revision':1}; writes=[]; errors=[]
    files=[{'asset_id':IMAGE,'original_name':'fixture.png','content_type':'image/png','status':'active'},{'asset_id':AUDIO,'original_name':'life--track-026.wav','content_type':'audio/wav','status':'active'}]
    context=browser.new_context(accept_downloads=True,service_workers='block',viewport={'width':1600,'height':1000})
    page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
    def api(route):
        request=route.request; u=urlparse(request.url); q=parse_qs(u.query)
        if u.path=='/api/auth/me':
            return route.fulfill(json={'ok':True,'user':{'id':'qa-teacher','user_id':'qa-teacher','role':'teacher','permissions':['studio:edit'],'display_name':'Synthetic QA'}})
        if u.path=='/api/authoring/lessons':
            if request.method=='POST':
                body=request.post_data_json
                assert body['expectedRevision']==record['revision']
                record['draft']=body['lesson'];record['revision']+=1;writes.append(record['revision'])
                return route.fulfill(json={'ok':True,'saved':True,'revision':record['revision']})
            return route.fulfill(json={'ok':True,**record,'drafts':[]})
        if u.path=='/api/studio-media':
            if request.method=='POST':
                b=request.post_data_json;assert b['action']=='confirm-document' and b['sha256']==sha256(JPEG).hexdigest()
                if not any(f['asset_id']==PACKAGED for f in files):files.append({'asset_id':PACKAGED,'original_name':'fixture.jpg','content_type':'image/jpeg','status':'active'})
                return route.fulfill(json={'ok':True,'assetId':PACKAGED})
            if q.get('open'):
                aid=q['open'][0]
                return route.fulfill(body=WAV if aid==AUDIO else PNG,content_type='audio/wav' if aid==AUDIO else 'image/png')
            return route.fulfill(json={'ok':True,'files':files,'uploadEnabled':True})
        if u.path=='/api/authoring/pdf-ai-build':return route.fulfill(json={'ok':True,'configured':False})
        return route.fulfill(json={'ok':True,'files':[]})
    context.route(origin+'/api/**',api)
    context.route('https://esm.sh/**',lambda route:route.fulfill(body='export async function uploadPresigned(){throw Error("Unexpected fixture upload");}',content_type='application/javascript',headers={'Access-Control-Allow-Origin':'*'}))
    context.route('https://cdnjs.cloudflare.com/**',lambda route:route.fulfill(body='',content_type='application/javascript'))
    page.goto(origin+'/studio/?serverDraft=s82-qa-fixture',wait_until='domcontentloaded')
    page.locator('[data-native-brief]').fill('Synthetic source; teach three parts and review.')
    page.locator('[data-native-range]').fill('47-51');page.locator('[data-native-duration]').fill('180');page.locator('[data-native-covers]').fill('3');page.locator('[data-chatgpt-source]').check()
    with page.expect_download() as info:page.locator('[data-native-request]').click()
    request=json.loads(info.value.path().read_text())
    assert [p['pdfPage'] for p in request['sourcePages']]==[47,48,49,50,51]
    assert request['authoring']['durationMinutes']==180 and request['authoring']['coverCount']==3
    assert request['destination']['shellId']=='life-intermediate-u04-l01'
    assert any(x['type']=='lesson-part-cover' for x in request['functionalTemplates'])
    assert any(m['assetId']==AUDIO for m in request['media'])
    print('PASS AI1: actual Studio download, scope deduplication, plan, template and audio manifest',flush=True)
    def content(value,step=None):
        b={'type':'text','content':{'text':value,'role':'body'}}
        if step:b['comboStep']=step
        return b
    def writing(prompt,step=None):
        b={'type':'writing','activity':{'prompt':prompt}}
        if step:b['comboStep']=step
        return b
    def slide(title,section,minutes,page,blocks,**extra):
        return {'title':title,'stage':'Practice','instruction':'Complete the exercise.','layout':'standard','sectionId':section,'minutes':minutes,'sourcePage':page,'blocks':blocks,**extra}
    def cover(title,section,page,aid):
        return slide(title,section,1,page,[{'type':'image','content':{'assetId':aid,'alt':'Synthetic picture'}}],stage='Cover',functional={'type':'lesson-part-cover','variant':'photo-right','values':{'institution':'Synthetic institution','faculty':'Synthetic faculty','lessonCode':'U4.1','lessonTitle':title,'course':'LIFE'}})
    category={'type':'categorising','comboStep':'complete','activity':{'prompt':'Classify the statement.','categories':['Alpha','Beta'],'items':[{'id':'r1','text':'The sky was clear.','category':'Alpha'}],'evidenceByItem':{'r1':{'quote':'The sky was clear.','why':'The passage describes Alpha.'}}}}
    jigsaw=slide('Jigsaw QA','a',40,48,[content('Alpha account. The sky was clear.','read'),content('Beta account. It rained.','read'),writing('Record two details.','read'),content('Alpha account. The sky was clear.','expert'),content('Beta account. It rained.','expert'),writing('Prepare your summary.','expert'),writing('Share and record notes.','share'),content('Alpha account. The sky was clear. Beta account. It rained.','complete'),category],stage='Reading',layout='reading-split',comboId='reading-jigsaw',sharedPedagogy={'experts':{'groups':[{'label':'Alpha','passages':{'read':0,'expert':3}},{'label':'Beta','passages':{'read':1,'expert':4}}]}})
    ordering={'type':'ordering','activity':{'prompt':'Order the events.','items':[{'id':'a','text':'Arrive'},{'id':'b','text':'Leave'}],'answerKey':['a','b'],'evidenceByItem':{'0':{'why':'Arrival precedes departure.'},'1':{'why':'Departure is last.'}}}}
    matching={'type':'matching','activity':{'prompt':'Match the words.','pairs':[{'id':'m1','left':'Alpha','right':'First'},{'id':'m2','left':'Beta','right':'Second'}],'evidenceByItem':{'m1':{'why':'Alpha is first.'},'m2':{'why':'Beta is second.'}}}}
    fill={'type':'fill','activity':{'prompt':'Complete the sentence.','items':[{'id':'f1','prompt':'The sky ___ clear.','answers':['was']}],'evidenceByItem':{'f1':{'why':'Use past simple be.'}}}}
    reports={'academic':{'findings':['Synthetic source review.'],'issues':[]},'visual':{'findings':['Synthetic visual review.'],'issues':[]},'critical':{'findings':['Synthetic critical review.'],'issues':['Actual media QA remains pending.'],'missingMedia':['Original source media not tested.']}}
    pkg={'schema':'eleap-native-lesson-package-v1','courseProfileId':'life','lessonNumber':'U4.1','title':'S8.2 native QA','authoring':{**request['authoring'],'sections':[{'id':'opening','title':'Opening','minutes':1},{'id':'a','title':'Part A','minutes':41},{'id':'b','title':'Part B','minutes':101},{'id':'review','title':'Review','minutes':37}]},'assets':[{'id':DOC,'name':'fixture.jpg','type':'image/jpeg','base64':b64encode(JPEG).decode()}],'screens':[cover('Opening cover','opening',47,DOC),cover('Part A cover','a',48,IMAGE),jigsaw,cover('Part B cover','b',50,IMAGE),slide('Interactive QA','b',100,51,[{'type':'audio','content':{'track':26,'label':'Track 26'}},matching,ordering,fill]),slide('Review QA','review',37,51,[writing('Reflect on the task.')])],'review':{'source':'Synthetic source only.','notes':['No authentic textbook data.'],'reports':reports}}
    def load(p):
        page.locator('[data-native-lesson-file]').set_input_files({'name':'qa.json','mimeType':'application/json','buffer':json.dumps(p).encode()})
    load(pkg)
    expect(page.locator('[data-slide]')).to_have_count(6,timeout=25000)
    page.wait_for_function("document.querySelector('[data-studio-status]')?.textContent.includes('Saved on Preview server')",timeout=20000)
    d=record['draft'];assert d['authoringPlan']['durationMinutes']==180 and len(d['screens'])==6
    assert d['screens'][0]['blocks'][0]['content']['assetId']==PACKAGED
    assert d['screens'][1]['blocks'][0]['content']['assetId']==IMAGE
    assert d['screens'][4]['blocks'][0]['content']['assetId']==AUDIO
    assert d['screens'][2]['blocks'][8]['activity']['evidenceByItem']['r1']['why']=='The passage describes Alpha.'
    assert d['screens'][4]['blocks'][2]['activity']['evidenceByItem']['0']['why']=='Arrival precedes departure.'
    assert d['assistedAuthoring']['reviews']==reports and d['assistedAuthoring']['teacherApproved'] is False
    print('PASS AI2/AI3: populated native import, packaged and reused images, track binding, evidence, three reports, save',flush=True)
    page.locator('[data-slide="2"]').click()
    canvas=page.locator('.lesson-canvas')
    expect(canvas).to_contain_text('Alpha account.')
    expect(canvas).not_to_contain_text('Beta account.')
    page.locator('[data-ped-expert="1"]').click()
    expect(canvas).to_contain_text('Beta account.')
    expect(canvas).not_to_contain_text('Alpha account.')
    page.locator('[data-combo-step="complete"]').click()
    act=canvas.locator('[data-local-interaction]')
    act.locator('[data-local-row]').first.select_option('Alpha')
    page.locator('[data-preview-role="presentation"]').click()
    page.locator('[data-studio-action="check"]').click()
    expect(act.locator('[role=status]').first).to_contain_text('correct')
    page.locator('[data-studio-action="reveal"]').click()
    act.locator('[data-local-reveal]').first.click()
    expect(act.locator('.local-preview-why')).to_contain_text('The passage describes Alpha.')
    page.locator('[data-studio-action="reset"]').click()
    assert act.locator('[data-local-row]').first.input_value()==''
    page.locator('[data-exit-presentation]').click()
    page.locator('[data-preview-role="student"]').click()
    assert act.locator('[data-local-action="reveal"]').count()==0
    page.locator('[data-preview-role="teacher"]').click()
    page.locator('[data-slide="4"]').click()
    expect(page.locator('audio').first).to_have_attribute('src','/api/studio-media?document=1&open='+AUDIO)
    page.goto(origin+'/studio/?serverDraft=s82-qa-fixture',wait_until='domcontentloaded')
    expect(page.locator('[data-slide]')).to_have_count(6)
    before=record['revision'];bad=json.loads(json.dumps(pkg));bad['screens'][4]['minutes']-=1;load(bad)
    expect(page.locator('[data-studio-status]')).to_contain_text('timing',timeout=15000)
    assert record['revision']==before
    assert not errors,errors
    print('PASS Studio browser: Jigsaw assignment, presentation Check/Reveal/Reset, student restriction, audio URL, reopen, rejection of invalid timing',flush=True)
    context.close()

if __name__=='__main__':
    server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=ROOT))
    Thread(target=server.serve_forever,daemon=True).start()
    try:
        with sync_playwright() as p:
            with p.chromium.launch() as browser:run(browser,f'http://127.0.0.1:{server.server_port}')
    finally:server.shutdown()
