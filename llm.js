# Author: Fisheep.L
# server.py - 商海浮沉 游戏服务器（静态文件 + SQLite 存档数据库 API）
import argparse
import sys
sys.dont_write_bytecode = True
import http.server
import json
import os
import gzip
import urllib.parse
import urllib.request
import http.client

import db

PORT = 8765
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SAVES_DIR = os.path.join(BASE_DIR, 'saves')
# OLLAMA_BASE / LMSTUDIO_BASE 常量仅作文档用途，代理中硬编码端口号
OLLAMA_BASE = 'http://localhost:11434'
LMSTUDIO_BASE = 'http://localhost:1234'

class GameServer(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        """Override to add realpath path-traversal protection."""
        translated = super().translate_path(path)
        real_path = os.path.realpath(translated)
        real_base = os.path.realpath(BASE_DIR)
        if not real_path.startswith(real_base + os.sep) and real_path != real_base:
            raise PermissionError('Path traversal detected: ' + path)
        return translated

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
        self.send_header('Access-Control-Allow-Origin', 'http://localhost:8765')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        # 防止浏览器缓存 JS/CSS/HTML，确保代码更新立即生效
        if self.path and (self.path.endswith('.js') or self.path.endswith('.css') or self.path.endswith('.html') or self.path == '/'):
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
        super().end_headers()

    def do_OPTIONS(self):
        try:
            self.send_response(200)
            self.end_headers()
        except (ConnectionAbortedError, ConnectionResetError, BrokenPipeError):
            pass

    def log_message(self, format, *args):
        # 仅在有 --verbose 标志或 /api/ 请求时打印日志
        if (hasattr(self, 'server') and getattr(self.server, '_verbose', False)) or \
           (hasattr(self, 'requestline') and '/api/' in self.requestline):
            super().log_message(format, *args)

    def do_GET(self):
        try:
            parsed = urllib.parse.urlparse(self.path)

            if parsed.path == '/api/ping':
                self.handle_ping()
            elif parsed.path == '/api/preload':
                self.handle_preload()
            elif parsed.path == '/api/load':
                self.handle_load(parsed.query)
            elif parsed.path.startswith('/api/ollama/'):
                self.handle_ollama_proxy('GET', parsed.path)
            elif parsed.path.startswith('/api/lmstudio/'):
                self.handle_lmstudio_proxy('GET', parsed.path)
            else:
                super().do_GET()
        except (ConnectionAbortedError, ConnectionResetError, BrokenPipeError):
            pass

    def do_POST(self):
        try:
            parsed = urllib.parse.urlparse(self.path)

            if parsed.path == '/api/save':
                self.handle_save(parsed.query)
            elif parsed.path == '/api/delete':
                self.handle_delete(parsed.query)
            elif parsed.path.startswith('/api/ollama/'):
                self.handle_ollama_proxy('POST', parsed.path)
            elif parsed.path.startswith('/api/lmstudio/'):
                self.handle_lmstudio_proxy('POST', parsed.path)
            else:
                self.send_response(405)
                self.end_headers()
        except (ConnectionAbortedError, ConnectionResetError, BrokenPipeError):
            pass

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
        """GET /api/preload → 返回所有存档 key-value（排除内部标记）"""
        try:
            result = db.get_all()
            # 移除内部标记 key
            result.pop('_migrated', None)
            raw_body = json.dumps(result, ensure_ascii=False).encode('utf-8')

            accept_encoding = self.headers.get('Accept-Encoding', '')
            if 'gzip' in accept_encoding and len(raw_body) > 1024:
                raw_body = gzip.compress(raw_body)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.send_header('Content-Encoding', 'gzip')
                self.end_headers()
                self.wfile.write(raw_body)
            else:
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(raw_body)
        except Exception as e:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(str(e).encode('utf-8'))

    def handle_load(self, query_string):
        """GET /api/load?key=xxx → 从 SQLite 读取单个存档"""
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

        try:
            content = db.get(key)
            if content is None:
                self.send_response(404)
                self.end_headers()
                return
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
        """POST /api/save?key=xxx → 保存存档到 SQLite（body 为内容）"""
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
        if content_length > self.MAX_BODY_SIZE * 2:  # gzip 可能稍大
            self.send_response(413)
            self.end_headers()
            self.wfile.write(b'Request body too large (max 10MB)')
            return
        body = self.rfile.read(content_length)

        # gzip 解压
        content_encoding = self.headers.get('Content-Encoding', '')
        if 'gzip' in content_encoding:
            try:
                body = gzip.decompress(body)
            except Exception as e:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(('gzip decompress failed: ' + str(e)).encode('utf-8'))
                return

        body_str = body.decode('utf-8')
        if len(body_str) > self.MAX_BODY_SIZE:
            self.send_response(413)
            self.end_headers()
            self.wfile.write(b'Request body too large (max 5MB)')
            return

        try:
            db.set(key, body_str)
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b'ok')
        except Exception as e:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(str(e).encode('utf-8'))

    def handle_delete(self, query_string):
        """POST /api/delete?key=xxx → 从 SQLite 删除存档"""
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

        try:
            db.delete(key)
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b'ok')
        except Exception as e:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(str(e).encode('utf-8'))


    def _proxy_to(self, method, path, prefix, service_name, host, port, extra_headers=None):
        """通用 LLM 代理：转发 /api/<prefix>/* → host:port"""
        target_path = path.replace(prefix, '', 1)
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length) if content_length > 0 else None
        try:
            conn = http.client.HTTPConnection(host, port, timeout=120)
            headers = dict(extra_headers) if extra_headers else {}
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
                pass
            conn.close()
        except TimeoutError:
            try:
                self.send_response(504)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': f'{service_name} response timeout'}).encode('utf-8'))
            except (ConnectionAbortedError, ConnectionResetError, BrokenPipeError):
                pass
        except (ConnectionRefusedError, OSError) as e:
            try:
                self.send_response(502)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': f'{service_name} not running: {e}'}).encode('utf-8'))
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

    def handle_ollama_proxy(self, method, path):
        self._proxy_to(method, path, '/api/ollama', 'Ollama', 'localhost', 11434)

    def handle_lmstudio_proxy(self, method, path):
        self._proxy_to(method, path, '/api/lmstudio', 'LM Studio', 'localhost', 1234, {'Connection': 'keep-alive'})


if __name__ == '__main__':
    os.makedirs(SAVES_DIR, exist_ok=True)
    # 初始化数据库并自动迁移旧 JSON 存档
    db.init_db()
    db.migrate_from_json()
    # 工作目录设为脚本所在目录，直接提供静态文件
    os.chdir(BASE_DIR)
    # 使用 ThreadingHTTPServer + 线程池限制并发数
    from concurrent.futures import ThreadPoolExecutor
    import socketserver
    class ThreadPoolHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
        allow_reuse_address = True
        daemon_threads = True
        def __init__(self, *args, **kwargs):
            self._executor = ThreadPoolExecutor(max_workers=16)
            super().__init__(*args, **kwargs)
        def process_request(self, request, client_address):
            self._executor.submit(self.process_request_thread, request, client_address)
    server = ThreadPoolHTTPServer(('0.0.0.0', PORT), GameServer)
    print(f' 商海浮沉 游戏服务器已启动 (多线程模式, 最大16并发)')
    print(f'   打开浏览器访问: http://localhost:{PORT}')
    print(f'   游戏目录: {BASE_DIR}')
    print(f'   存档目录: {SAVES_DIR}')
    print(f'   按 Ctrl+C 停止服务器')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\n服务器已停止')
    finally:
        db.close()
        server.server_close()
