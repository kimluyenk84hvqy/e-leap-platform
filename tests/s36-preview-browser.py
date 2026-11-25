"""CSS cascade fixture, not a full authenticated Studio browser test."""
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
css='\n'.join((root/'assets/css'/n).read_text() for n in ['e-leap-design-system.css','studio.css','studio-template-contracts.css','studio-certified-templates.css','studio-template-gallery.css','studio-resource-assembly.css'])
html='''<div class="lesson-canvas template-reading-task auditorium-preview preview-presentation"><header class="canvas-hero"><h1 class="canvas-title">Reading</h1><p class="canvas-instruction">Read and discuss.</p></header><div class="canvas-body"><section class="block" data-slot="passage"><div class="studio-text-role role-body">A passage.</div></section><section class="block" data-slot="activity"><div class="activity-prompt">Question</div><div class="option-demo">Option</div><div class="studio-text-role role-answer">Key</div><div class="studio-evidence-note">Why</div></section></div></div>'''
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1920,'height':1080})
    page.set_content('<style>'+css+'</style>'+html)
    expected={'.canvas-title':'54px','.canvas-instruction':'32px','.role-body':'29px','.activity-prompt':'30px','.option-demo':'30px','.role-answer':'30px','.studio-evidence-note':'29px'}
    for selector,size in expected.items():
        actual=page.locator(selector).evaluate('(el)=>getComputedStyle(el).fontSize')
        assert actual==size,(selector,actual,size)
    page.locator('.lesson-canvas').evaluate("el=>el.classList.remove('auditorium-preview')")
    assert page.locator('.canvas-title').evaluate('(el)=>getComputedStyle(el).fontSize')!='54px'
    browser.close()
print('PASS: seven projected font sizes and unmodified ordinary preview cascade')
