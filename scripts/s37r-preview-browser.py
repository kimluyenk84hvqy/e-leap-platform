from pathlib import Path
from playwright.sync_api import sync_playwright
import json,re,base64
root=Path.cwd()
def module(path):
    source=path.read_text()
    source=re.sub(r"((?:from\s*|import\s*)['\"])(\.{1,2}/[^'\"]+)(['\"])",lambda m:m[1]+module((path.parent/m[2]).resolve())+m[3],source)
    return 'data:text/javascript;base64,'+base64.b64encode(source.encode()).decode()
url=module(root/'assets/js/authoring/interactive-preview.js')
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content('<main id="host"></main>')
    page.evaluate('''async url=>{const m=await import(url);const b={type:'fill',activity:{prompt:'Complete the sentences',items:[{id:'a',prompt:'The sky is _____.',answers:['blue']},{id:'b',prompt:'The grass is _____.',answers:['green']}],evidenceByItem:{a:{quote:'The sky is blue.',why:'Colour of the sky.'}}}};window.mount=role=>{const host=document.querySelector('#host');host.innerHTML=m.renderInteractivePreview(b,role);m.wireInteractivePreview(host.firstElementChild,b,role);};mount('student');}''',url)
    page.locator('input').first.fill('blue');page.get_by_role('button',name='Check',exact=True).click();assert '1/2 correct · 50%' in page.locator('[role=status]').inner_text();assert page.get_by_role('button',name='Submit').is_disabled();assert page.get_by_role('button',name='Show answer').count()==0
    page.evaluate("mount('teacher')");assert page.locator('input').first.input_value()=='';page.get_by_role('button',name='Show answer').click();page.get_by_role('button',name='Answer 1',exact=True).click();assert page.locator('.local-preview-key').all_text_contents()==['blue'];assert 'The sky is blue.' in page.locator('.local-preview-evidence').inner_text();page.get_by_role('button',name='Reset').click();assert page.locator('.local-preview-key').count()==0
    page.evaluate("mount('student')");assert page.locator('input').first.input_value()=='blue';assert page.locator('.local-preview-key').count()==0;page.get_by_role('button',name='Reset').click();assert page.locator('input').first.input_value()=='';assert not errors,errors
    print('Chromium: Check, unanswered denominator, disabled Submit, role isolation, per-item reveal, evidence, Reset passed; no page errors')
    # Exact source highlight: unique, duplicate, missing, editable and reset.
    page.set_content('<section class="lesson-canvas"><div class="studio-text-role role-body" contenteditable="false">The sky is blue.</div><main id="host"></main></section>')
    page.evaluate("mount('teacher')")
    page.get_by_role('button',name='Show answer').click();page.get_by_role('button',name='Answer 1',exact=True).click();page.get_by_role('button',name='Highlight source').click();assert page.locator('mark[data-preview-evidence]').inner_text()=='The sky is blue.'
    page.get_by_role('button',name='Reset').click();assert page.locator('mark[data-preview-evidence]').count()==0
    page.evaluate("""async url=>{const m=await import(url);const c=document.querySelector('.lesson-canvas');const s=c.querySelector('.studio-text-role');s.textContent='The sky is blue. The sky is blue.';if(m.highlightSourceQuote(c,'The sky is blue.'))throw Error('ambiguous match');if(m.highlightSourceQuote(c,'Missing quote'))throw Error('missing match');s.textContent='The sky is blue.';s.contentEditable='true';if(m.highlightSourceQuote(c,'The sky is blue.'))throw Error('editable text modified');}""",url)
    assert not errors,errors;print('Evidence highlight: unique, duplicate, absent, editable and reset PASS')
    browser.close()
