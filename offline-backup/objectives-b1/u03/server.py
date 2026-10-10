#!/usr/bin/env python3
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import json, os, socket, threading, time, io

HOST='0.0.0.0'; PORT=int(os.environ.get('ELEAP_PORT','8765'))
STATE_FILE='offline-state.json'; LOCK=threading.Lock()
STATE={'lessonIndex':0,'slideIndex':0,'slideId':'u31-s01','joinCode':'U3LIVE','responses':[]}

def load_state():
    global STATE
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE,'r',encoding='utf-8') as f: STATE.update(json.load(f))
        except Exception: pass

def save_state():
    try:
        with open(STATE_FILE,'w',encoding='utf-8') as f: json.dump(STATE,f,ensure_ascii=False,indent=2)
    except Exception: pass

def lan_ip():
    s=socket.socket(socket.AF_INET,socket.SOCK_DGRAM)
    try:
        s.connect(('8.8.8.8',80)); return s.getsockname()[0]
    except Exception: return '127.0.0.1'
    finally: s.close()

class Handler(SimpleHTTPRequestHandler):
    def send_json(self,obj,status=200):
        raw=json.dumps(obj,ensure_ascii=False).encode('utf-8')
        self.send_response(status); self.send_header('Content-Type','application/json; charset=utf-8'); self.send_header('Content-Length',str(len(raw))); self.send_header('Cache-Control','no-store'); self.end_headers(); self.wfile.write(raw)
    def read_json(self):
        try:
            n=int(self.headers.get('Content-Length','0')); return json.loads(self.rfile.read(n) or b'{}')
        except Exception: return {}
    def do_GET(self):
        u=urlparse(self.path)
        if u.path=='/api/state':
            with LOCK:
                return self.send_json({k:v for k,v in STATE.items() if k!='responses'})
        if u.path=='/api/responses':
            sid=(parse_qs(u.query).get('slideId') or [''])[0]
            with LOCK:
                rows=[r for r in STATE['responses'] if not sid or r.get('slideId')==sid]
            return self.send_json({'responses':rows})
        if u.path=='/api/qr':
            text=(parse_qs(u.query).get('text') or [''])[0]
            try:
                import qrcode
                im=qrcode.make(text); buf=io.BytesIO(); im.save(buf,format='PNG'); raw=buf.getvalue()
                self.send_response(200); self.send_header('Content-Type','image/png'); self.send_header('Content-Length',str(len(raw))); self.end_headers(); self.wfile.write(raw); return
            except Exception:
                return self.send_json({'error':'Optional qrcode package is not installed; use the join URL shown on screen.'},501)
        return super().do_GET()
    def do_POST(self):
        u=urlparse(self.path); data=self.read_json()
        if u.path=='/api/state':
            with LOCK:
                for k in ('lessonIndex','slideIndex','slideId'):
                    if k in data: STATE[k]=data[k]
                save_state()
            return self.send_json({'ok':True})
        if u.path=='/api/response':
            row={'name':data.get('name','Student'),'lessonId':data.get('lessonId'),'slideId':data.get('slideId'),'answers':data.get('answers',[]),'ts':data.get('ts',int(time.time()*1000))}
            with LOCK:
                STATE['responses'].append(row); save_state()
            return self.send_json({'ok':True})
        if u.path=='/api/reset':
            with LOCK: STATE['responses']=[]; save_state()
            return self.send_json({'ok':True})
        return self.send_json({'error':'Not found'},404)
    def log_message(self,fmt,*args):
        print('[E-LEAP]',fmt%args)

if __name__=='__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    load_state(); ip=lan_ip();
    print('\nE-LEAP Unit 3 OFFLINE MASTER')
    print(f'Teacher: http://localhost:{PORT}/')
    print(f'Students on same Wi-Fi: http://{ip}:{PORT}/?role=student')
    print('Press Ctrl+C to stop.\n')
    ThreadingHTTPServer((HOST,PORT),Handler).serve_forever()
