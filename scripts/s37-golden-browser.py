from pathlib import Path
from playwright.sync_api import sync_playwright
import json,re,sys
base=Path(sys.argv[1]);out=Path(sys.argv[2]);root=Path.cwd();css='\n'.join((root/'assets/css'/n).read_text() for n in ['e-leap-design-system.css','studio.css','studio-template-contracts.css','studio-certified-templates.css','studio-template-gallery.css','studio-resource-assembly.css'])
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=browser.new_page(viewport={'width':1920,'height':1080});page.route('**/*',lambda route:route.abort());errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 for n in ['4.1','4.2']:
  page.close();page=browser.new_page(viewport={'width':1920,'height':1080});page.route('**/*',lambda route:route.abort());errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content((base/f'U{n}_FINAL_AUDITORIUM.html').read_text(),wait_until='domcontentloaded');slides=page.locator('[data-slide]').count();page.locator('#presentation').evaluate('(e)=>e.click()');states=[]
  for i in range(slides):
   page.locator(f'[data-slide="{i}"]').evaluate('(e)=>e.click()');tabs=page.locator('#stage [data-tab]').count();labels=page.locator('#stage [data-tab]').all_text_contents();rows=[]
   for j in range(max(tabs,1)):
    if tabs:page.locator(f'#stage [data-tab="{j}"]').evaluate('(e)=>e.click()')
    rows.append(page.locator('#stage').evaluate('e=>({title:e.querySelector("h1")?.textContent||"",textLength:e.innerText.length,inputs:e.querySelectorAll("input,textarea,select").length,images:e.querySelectorAll("img").length})'))
   states.append({'slide':i+1,'tabs':tabs,'labels':labels,'states':rows})
   if i==0 or (n=='4.1' and i==7) or (n=='4.2' and i==8):page.screenshot(path=str(out/f's37-{n}-final-{i+1}.png'))
  r=json.load(open(out/f's37-{n}.json'));pkg=json.load(open(base/f'U{n}_ELEAP_NATIVE.json'));assets={str(i+1).zfill(12):'data:image/jpeg;base64,'+a['base64'] for i,a in enumerate(pkg['assets'])};results=[]
  for i,h in enumerate(next(x['screens'] for x in r['html'] if x['role']=='presentation')):
   h=re.sub(r'/api/studio-media\?document=1&amp;open=12345678-1234-1234-1234-(\d{12})',lambda m:assets.get(m[1],m[0]),h)
   page.set_content('<style>'+css+'</style>'+h,wait_until='domcontentloaded');results.append(page.locator('.lesson-canvas').evaluate('e=>({title:e.querySelector("h1")?.textContent, height:Math.round(e.getBoundingClientRect().height), inputs:e.querySelectorAll("input,textarea,select").length, images:e.querySelectorAll("img").length, tabs:e.querySelectorAll("[data-combo-step]").length, font:getComputedStyle(e.querySelector("h1")).fontSize})'))
   if i==0 or (n=='4.1' and i==17) or (n=='4.2' and i==19):page.screenshot(path=str(out/f's37-{n}-studio-{i+1}.png'))
  result={'lesson':n,'final':states,'studio':results,'errors':errors[:]};json.dump(result,open(out/f's37-browser-{n}.json','w'),ensure_ascii=False,indent=2);print(n,'FINAL slides',slides,'states',sum(len(x['states']) for x in states),'empty',sum(z['textLength']==0 for x in states for z in x['states']),'studio',len(results),'input',sum(x['inputs'] for x in results),'over1080',sum(x['height']>1080 for x in results),'errors',errors,flush=True)
 browser.close()
