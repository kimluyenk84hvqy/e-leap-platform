from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
css='\n'.join((root/'assets/css'/n).read_text() for n in ['e-leap-design-system.css','studio.css','studio-template-contracts.css','studio-certified-templates.css','studio-template-gallery.css','studio-resource-assembly.css'])
html='<section class="lesson-canvas auditorium-preview template-reading-task"><header class="canvas-hero"><h1 class="canvas-title">Reading</h1><p class="canvas-instruction">Read and discuss.</p></header><div class="canvas-body"><nav class="combo-step-nav"><button class="combo-step-button">Read</button></nav><div class="aud-reading-regions"><section class="aud-reading-region aud-reading-source"><div class="block" data-slot="passage"><div class="studio-text-role role-body">'+('A long reading passage. '*500)+'</div></div></section><section class="aud-reading-region aud-reading-task">'+('<div class="local-preview-item"><div class="local-answer-box"><input value="response"><div class="local-preview-key">Answer</div></div><div class="local-preview-evidence">Evidence</div><div class="local-preview-why">Why</div></div>'*35)+'</section></div></div></section>'
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1920,'height':1080});page.set_content('<style>'+css+'</style>'+html)
 a=page.locator('.aud-reading-source');q=page.locator('.aud-reading-task');assert a.evaluate('e=>e.scrollHeight>e.clientHeight');assert q.evaluate('e=>e.scrollHeight>e.clientHeight');a.evaluate('e=>e.scrollTop=250');assert a.evaluate('e=>e.scrollTop')>0 and q.evaluate('e=>e.scrollTop')==0
 q.evaluate('e=>e.scrollTop=300');assert q.evaluate('e=>e.scrollTop')>0 and a.evaluate('e=>e.scrollTop')==250
 assert page.locator('.lesson-canvas').evaluate('e=>e.getBoundingClientRect().height')<=1080
 for sel,size in [('.role-body','29px'),('.local-preview-key','30px'),('.local-preview-evidence','29px'),('.local-preview-item input','30px')]: assert page.locator(sel).first.evaluate('e=>getComputedStyle(e).fontSize')==size,(sel,size,page.locator(sel).first.evaluate('e=>getComputedStyle(e).fontSize'))
 b.close()
print('PASS independent scrolling, canvas height, reading/key/evidence/input font sizes')
