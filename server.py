# server.py - 商海浮沉 游戏服务器（静态文件 + 存档文件读写 API）
import http.server
import json
import os
import sys
import urllib.parse

PORT = 8765
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SAVES_DIR = os.path.join(BASE_DIR, 'saves')
PUBLIC_DIR = os.path.join(BASE_DIR, 'public')

class GameServer(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def log_message(self, format, *args):
        # 只显示存档相关的日志，减少噪音
        if '/api/' in (args[0] if args else ''):
            super().log_message(format, *args)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)

        if parsed.path == '/api/preload':
            self.handle_preload()
        elif parsed.path == '/api/load':
            self.handle_load(parsed.query)
        else:
            super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)

        if parsed.path == '/api/save':
            self.handle_save(parsed.query)
        elif parsed.path == '/api/delete':
            self.handle_delete(parsed.query)
        else:
            self.send_response(405)
            self.end_headers()

    def handle_preload(self):
        """GET /api/preload → 返回所有存档文件的 JSON"""
        try:
            result = {}
            if os.path.isdir(SAVES_DIR):
                for fname in os.listdir(SAVES_DIR):
                    if fname.endswith('.json'):
                        key = fname[:-5]  # 去掉 .json
                        fpath = os.path.join(SAVES_DIR, fname)
                        with open(fpath, 'r', encoding='utf-8') as f:
                            result[key] = f.read()
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


if __name__ == '__main__':
    os.makedirs(SAVES_DIR, exist_ok=True)
    # 工作目录设为 public/，让 SimpleHTTPRequestHandler 从这里提供静态文件
    os.chdir(PUBLIC_DIR)
    server = http.server.HTTPServer(('0.0.0.0', PORT), GameServer)
    print(f' 商海浮沉 游戏服务器已启动')
    print(f'   打开浏览器访问: http://localhost:{PORT}')
    print(f'   存档目录: {SAVES_DIR}')
    print(f'   按 Ctrl+C 停止服务器')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\n服务器已停止')
        server.server_close()
