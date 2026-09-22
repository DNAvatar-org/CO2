# File: cdp.py
# Desc: client CDP minimal (WebSocket RFC6455 brut, sans dependance)
import json, socket, base64, os, struct, urllib.request, time

class WS:
    def __init__(self, url, timeout=600):
        assert url.startswith('ws://')
        rest = url[5:]
        hostport, path = rest.split('/', 1)
        path = '/' + path
        host, port = hostport.split(':')
        self.s = socket.create_connection((host, int(port)), timeout=timeout)
        self.s.settimeout(timeout)
        key = base64.b64encode(os.urandom(16)).decode()
        req = (f"GET {path} HTTP/1.1\r\nHost: {hostport}\r\nUpgrade: websocket\r\n"
               f"Connection: Upgrade\r\nSec-WebSocket-Key: {key}\r\nSec-WebSocket-Version: 13\r\n\r\n")
        self.s.sendall(req.encode())
        buf = b''
        while b'\r\n\r\n' not in buf:
            buf += self.s.recv(4096)
        self.buf = buf.split(b'\r\n\r\n', 1)[1]

    def _recv_exact(self, n):
        while len(self.buf) < n:
            d = self.s.recv(65536)
            if not d: raise EOFError
            self.buf += d
        out, self.buf = self.buf[:n], self.buf[n:]
        return out

    def send(self, text):
        payload = text.encode()
        mask = os.urandom(4)
        n = len(payload)
        hdr = b'\x81'
        if n < 126: hdr += bytes([0x80 | n])
        elif n < 65536: hdr += bytes([0x80 | 126]) + struct.pack('>H', n)
        else: hdr += bytes([0x80 | 127]) + struct.pack('>Q', n)
        masked = bytes(b ^ mask[i % 4] for i, b in enumerate(payload))
        self.s.sendall(hdr + mask + masked)

    def recv(self):
        frames = b''
        while True:
            b0, b1 = self._recv_exact(2)
            fin = b0 & 0x80; op = b0 & 0x0f
            ln = b1 & 0x7f
            if ln == 126: ln = struct.unpack('>H', self._recv_exact(2))[0]
            elif ln == 127: ln = struct.unpack('>Q', self._recv_exact(8))[0]
            data = self._recv_exact(ln) if ln else b''
            if op == 0x8: raise EOFError('closed')
            if op == 0x9: continue
            frames += data
            if fin: return frames.decode('utf-8', 'replace')

class CDP:
    def __init__(self, ws_url, timeout=600):
        self.ws = WS(ws_url, timeout)
        self.id = 0
    def call(self, method, params=None):
        self.id += 1
        mid = self.id
        self.ws.send(json.dumps({'id': mid, 'method': method, 'params': params or {}}))
        while True:
            msg = json.loads(self.ws.recv())
            if msg.get('id') == mid:
                if 'error' in msg: raise RuntimeError(msg['error'])
                return msg['result']
    def eval(self, expr, await_promise=True):
        r = self.call('Runtime.evaluate', {'expression': expr, 'awaitPromise': await_promise,
                                           'returnByValue': True, 'allowUnsafeEvalBlobs': True})
        if 'exceptionDetails' in r:
            raise RuntimeError(json.dumps(r['exceptionDetails'])[:2000])
        return r['result'].get('value')

def attach(port=9333, url_filter=None, tries=60):
    for _ in range(tries):
        try:
            tabs = json.load(urllib.request.urlopen(f'http://127.0.0.1:{port}/json'))
            for t in tabs:
                if t.get('type') == 'page' and (url_filter is None or url_filter in t.get('url','')):
                    return CDP(t['webSocketDebuggerUrl'])
        except Exception:
            pass
        time.sleep(0.5)
    raise RuntimeError('no tab')
