# server.py - 商海浮沉 游戏服务器（静态文件 + 存档文件读写 API）
import http.server
import json
import os
import sys
import urllib.parse
import urllib.request
import http.client

PORT = 8765
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SAVES_DIR = os.path.join(BASE_DIR, 'saves')
OLLAMA_BASE = 'http://localhost:11434'

class GameServer(http.server.SimpleHTTPRequestHandler):
    def handle_error(self, request, client_address):
        # Suppress common client-disconnect tracebacks (not real errors)
        exc_type = sys.exc_info()[0]
        if exc_type and issubclass(exc_type, (
            ConnectionAbortedError, ConnectionResetError, BrokenPipeError,
            TimeoutError, OSError,
        )):
            return
        super().handle_error(request, client_address)

    def end_headers(self):
        origin = self.headers.get('Origin', '')
        self.send_header('Access-Control-Allow-Origin', origin if origin.startswith('http://localhost') or origin.startswith('http://127.0.0.1') else 'http://localhost:8765')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        # 防止浏览器缓存 JS/CSS/HTML，确保代码更新立即生效
        if self.path and (self.path.endswith('.js') or self.path.endswith('.css') or self.path.endswith('.html') or self.path == '/'):
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def log_message(self, format, *args):
        # 只显示存档相关的日志，减少噪音
        if hasattr(self, 'requestline') and '/api/' in self.requestline:
            super().log_message(format, *args)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)

        if parsed.path == '/api/ping':
            self.handle_ping()
        elif parsed.path == '/api/preload':
            self.handle_preload()
        elif parsed.path == '/api/load':
            self.handle_load(parsed.query)
        elif parsed.path.startswith('/api/ollama/'):
            self.handle_ollama_proxy('GET', parsed.path)
        else:
            super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)

        if parsed.path == '/api/save':
            self.handle_save(parsed.query)
        elif parsed.path == '/api/delete':
            self.handle_delete(parsed.query)
        elif parsed.path.startswith('/api/ollama/'):
            self.handle_ollama_proxy('POST', parsed.path)
        else:
            self.send_response(405)
            self.end_headers()

    MAX_PRELOAD_FILES = 50

    def handle_ping(self):
        """GET /api/ping → 轻量存活检测，供前端断线判断"""
        try:
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(b'{"ok":true}')
        except (ConnectionAbortedError, ConnectionResetError, BrokenPipeError):
            pass

    def handle_preload(self):
        """GET /api/preload → 返回所有存档文件的 JSON"""
        try:
            result = {}
            count = 0
            if os.path.isdir(SAVES_DIR):
                for fname in sorted(os.listdir(SAVES_DIR)):
                    if fname.endswith('.json'):
                        if count >= self.MAX_PRELOAD_FILES:
                            break
                        key = fname[:-5]  # 去掉 .json
                        fpath = os.path.join(SAVES_DIR, fname)
                        with open(fpath, 'r', encoding='utf-8') as f:
                            result[key] = f.read()
                        count += 1
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps(result, ensure_ascii=False).encode('utf-8'))
        except Exception as e:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(str(e).encode('utf-8'))

    def handle_load(self, query_string):
        """GET /api/load?key=xxx → 返回单个存档文件"""
        params = urllib.parse.parse_qs(query_string)
        key = params.get('key', [None])[0]
        if not key:
            self.send_response(400)
            self.end_headers()
            return

        # 安全检查：key 只能包含安全字符
        if not all(c.isalnum() or c in '_-' for c in key):
            self.send_response(400)
            self.end_headers()
            return

        fpath = os.path.join(SAVES_DIR, key + '.json')
        if not os.path.exists(fpath):
            self.send_response(404)
            self.end_headers()
            return

        try:
            with open(fpath, 'r', encoding='utf-8') as f:
                content = f.read()
            self.send_response(200)
            self.send_header('Content-Type', 'text/plain; charset=utf-8')
            self.end_headers()
            self.wfile.write(content.encode('utf-8'))
        except Exception as e:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(str(e).encode('utf-8'))

    MAX_BODY_SIZE = 5 * 1024 * 1024  # 5MB

    def handle_save(self, query_string):
        """POST /api/save?key=xxx → 保存存档文件（body 为内容）"""
        params = urllib.parse.parse_qs(query_string)
        key = params.get('key', [None])[0]
        if not key:
            self.send_response(400)
            self.end_headers()
            return

        if not all(c.isalnum() or c in '_-' for c in key):
            self.send_response(400)
            self.end_headers()
            return

        content_length = int(self.headers.get('Content-Length', 0))
        if content_length > self.MAX_BODY_SIZE:
            self.send_response(413)
            self.end_headers()
            self.wfile.write(b'Request body too large (max 5MB)')
            return
        body = self.rfile.read(content_length).decode('utf-8')

        os.makedirs(SAVES_DIR, exist_ok=True)
        fpath = os.path.join(SAVES_DIR, key + '.json')
        try:
            with open(fpath, 'w', encoding='utf-8') as f:
                f.write(body)
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b'ok')
        except Exception as e:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(str(e).encode('utf-8'))

    def handle_delete(self, query_string):
        """POST /api/delete?key=xxx → 删除存档文件"""
        params = urllib.parse.parse_qs(query_string)
        key = params.get('key', [None])[0]
        if not key:
            self.send_response(400)
            self.end_headers()
            return

        if not all(c.isalnum() or c in '_-' for c in key):
            self.send_response(400)
            self.end_headers()
            return

        fpath = os.path.join(SAVES_DIR, key + '.json')
        try:
            if os.path.exists(fpath):
                os.remove(fpath)
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b'ok')
        except Exception as e:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(str(e).encode('utf-8'))


    def handle_ollama_proxy(self, method, path):
        target_path = path.replace('/api/ollama', '', 1)
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length) if content_length > 0 else None
        try:
            conn = http.client.HTTPConnection('localhost', 11434, timeout=120)
            headers = {}
            if body:
                headers['Content-Type'] = 'application/json'
            conn.request(method, target_path, body=body, headers=headers)
            resp = conn.getresponse()
            resp_body = resp.read()
            try:
                self.send_response(resp.status)
                self.send_header('Content-Type', resp.getheader('Content-Type', 'application/json'))
                self.end_headers()
                self.wfile.write(resp_body)
            except (ConnectionAbortedError, ConnectionResetError, BrokenPipeError):
                pass  # 客户端已断开（前端超时），静默忽略
            conn.close()
        except TimeoutError:
            try:
                self.send_response(504)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Ollama response timeout'}).encode('utf-8'))
            except (ConnectionAbortedError, ConnectionResetError, BrokenPipeError):
                pass
        except (ConnectionRefusedError, OSError) as e:
            try:
                self.send_response(502)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Ollama not running: ' + str(e)}).encode('utf-8'))
            except (ConnectionAbortedError, ConnectionResetError, BrokenPipeError):
                pass
        except Exception as e:
            try:
                self.send_response(502)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
            except (ConnectionAbortedError, ConnectionResetError, BrokenPipeError):
                pass


if __name__ == '__main__':
    os.makedirs(SAVES_DIR, exist_ok=True)
    # 工作目录设为脚本所在目录，直接提供静态文件
    os.chdir(BASE_DIR)
    # 使用 ThreadingHTTPServer：Ollama 代理请求可能阻塞数十秒，
    # 多线程确保 ping/存档等请求不受影响，避免前端误判断线
    server = http.server.ThreadingHTTPServer(('0.0.0.0', PORT), GameServer)
    # 线程池模式：限制最大线程数，防止 Ollama 并发过高耗尽资源
    server.daemon_threads = True
    print(f' 商海浮沉 游戏服务器已启动 (多线程模式)')
    print(f'   打开浏览器访问: http://localhost:{PORT}')
    print(f'   游戏目录: {BASE_DIR}')
    print(f'   存档目录: {SAVES_DIR}')
    print(f'   按 Ctrl+C 停止服务器')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\n服务器已停止')
        server.server_close()
