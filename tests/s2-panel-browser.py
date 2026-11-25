from playwright.sync_api import sync_playwright
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from threading import Thread
from pathlib import Path
import os
os.chdir(Path(__file__).resolve().parent.parent)
server=ThreadingHTTPServer(('127.0.0.1',0),SimpleHTTPRequestHandler);Thread(target=server.serve_forever,daemon=True).start()
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.set_content('<div id="panel"></div>');adapter=Path('assets/js/authoring/course-workspaces.mjs').read_text().replace('export function','function');panel=Path('assets/js/authoring/workspace-panel.mjs').read_text();panel=panel[panel.index('const esc='):];panel=panel[:panel.index('let cached;')]+panel[panel.index('export function mountWorkspacePanel'):];panel=panel.replace('export function','function');config=Path('data/course-intelligence-v2.json').read_text();page.evaluate("() => {"+adapter+panel+";window.events=[];mountWorkspacePanel(document.querySelector('#panel'),createWorkspaceIndex("+config+"),{activeId:'objective-first-b2',activeLesson:'U4.1',canCreate:id=>!id.startsWith('esp-'),onCreate:x=>window.events.push(x)});}");page.locator('[data-ws]').first.wait_for();assert page.locator('[data-ws]').count()==6
 for cid,units,lessons in [('objective-pet-b1',30,2),('objective-first-b2',24,2),('life',12,3)]:
  page.locator(f'[data-ws="{cid}"]').click();assert page.locator('[data-ws-unit] option').count()==units+1;page.locator('[data-ws-unit]').select_option('1');assert page.locator('[data-ws-lesson] option').count()==lessons+1;page.locator('[data-ws-lesson]').select_option(cid+':U1.1');page.locator('[data-ws-create]').click();assert page.evaluate('events.at(-1).lesson.key')==cid+':U1.1';assert 'objective-first-b2 U4.1' in page.locator('#panel').inner_text()
 page.locator('[data-ws="life"]').click();page.locator('summary').click();assert 'Critical thinking' in page.locator('#panel').inner_text();assert 'Key word transformation' not in page.locator('#panel').inner_text()
 page.locator('[data-ws="advanced-skills"]').click();page.locator('[data-ws-skill]').select_option('adv-writing');page.locator('[data-ws-create]').click();assert page.evaluate('events.at(-1).skill')=='adv-writing'
 for cid in ['esp-medicine','esp-pharmacy']:
  page.locator(f'[data-ws="{cid}"]').click();assert page.locator('[data-ws-create]').count()==0;assert 'Reserved workspace' in page.locator('#panel').inner_text()
 assert not errors,errors;b.close();print('PASS: six cards, three course selectors, library scope, skill route, reserved shells, draft callback and unchanged active draft; no browser page errors. Fixture only.')
server.shutdown()
