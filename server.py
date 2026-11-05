# Author: Fisheep.L
# server.py - 商海浮沉本地服务器：静态资源、SQLite 存档 API 与 LLM 代理
import argparse
import gzip
import http.client
import http.server
import io
import json
import os
import secrets
import socketserver
import sys
import time
import urllib.parse
from concurrent.futures import ThreadPoolExecutor

sys.dont_write_bytecode = True
import db

DEFAULT_PORT = 8765
EXPECTED_PORT = DEFAULT_PORT
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SAVES_DIR = os.path.join(BASE_DIR, 'saves')
OLLAMA_BASE = 'http://localhost:11434'
LMSTUDIO_BASE = 'http://localhost:1234'
SESSION_TOKEN = secrets.token_urlsafe(32)
API_TOKEN_HEADER = 'X-Shanghaifc-Token'
MAX_SAVE_BYTES = 5 * 1024 * 1024
MAX_REQUEST_BYTES = 10 * 1024 * 1024
MAX_UPSTREAM_BYTES = 12 * 1024 * 1024
UPSTREAM_TIMEOUT_SECONDS = 180
SERVER_TIMEOUT_SECONDS = 30
ALLOWED_HOSTS = {'localhost', '127.0.0.1', '::1'}
ALLOWED_STATIC_SUFFIXES = {
    '', '.html', '.css', '.js', '.ico', '.png', '.jpg', '.jpeg',
    '.gif', '.webp', '.svg', '.mp3', '.ogg', '.wav',
}
SECURITY_HEADERS = (
    ('X-Content-Type-Options', 'nosniff'),
    ('Referrer-Policy', 'same-origin'),
    ('Permissions-Policy', 'camera=(), microphone=(), geolocation=()'),
    (
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline'; "
        "style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; "
        "font-src 'self' data:; connect-src 'self'; media-src 'self'; "
        "object-src 'none'; base-uri 'self'; form-action 'self'"
    ),
)


def _host_without_port(value):
    value = (value or '').strip().lower()
    if value.startswith('['):
        end = value.find(']')
        return value[:end + 1] if end > 0 else value
    return value.split(':', 1)[0]


def _host_is_allowed(host_header):
    host = _host_without_port(host_header)
    if host in ALLOWED_HOSTS:
        return True
    if host.startswith('127.') and host.count('.') == 3:
        return all(part.isdigit() and 0 <= int(part) <= 255 for part in host.split('.'))
    return False


def _normalize_base(value):
    try:
        parsed = urllib.parse.urlsplit((value or '').strip())
        port = parsed.port
        hostname = parsed.hostname
    except ValueError:
        return None
    if parsed.scheme not in ('http', 'https') or not hostname:
        return None
    if parsed.username or parsed.password or parsed.query or parsed.fragment:
        return None
    path = (parsed.path or '/').rstrip('/') or '/'
    netloc = parsed.netloc if port else hostname
    return urllib.parse.urlunsplit((parsed.scheme, netloc, path, '', ''))


def _base_matches_target(target, registered_base):
    try:
        target_parts = urllib.parse.urlsplit(target)
        base_parts = urllib.parse.urlsplit(registered_base)
        target_port = target_parts.port
        base_port = base_parts.port
    except ValueError:
        return False
    if target_parts.scheme != base_parts.scheme:
        return False
    if (target_parts.hostname or '').lower() != (base_parts.hostname or '').lower():
        return False
    default_port = 443 if target_parts.scheme == 'https' else 80
    if (target_port or default_port) != (base_port or default_port):
        return False
    target_path = (target_parts.path or '/').rstrip('/')
    base_path = (base_parts.path or '/').rstrip('/')
    return target_path == base_path or target_path.startswith(base_path + '/')


def _origin_is_allowed(origin):
    if not origin:
        return True
    try:
        parsed = urllib.parse.urlsplit(origin)
        port = parsed.port
    except ValueError:
        return False
    if parsed.scheme not in ('http', 'https') or parsed.username or parsed.password:
        return False
    if parsed.path not in ('', '/') or parsed.query or parsed.fragment:
        return False
    effective_port = port or (443 if parsed.scheme == 'https' else 80)
    return _host_is_allowed(parsed.netloc) and effective_port == EXPECTED_PORT


class GameServer(http.server.SimpleHTTPRequestHandler):
    server_version = 'ShanghaiFC/1.1'
    protocol_version = 'HTTP/1.1'

    def setup(self):
        super().setup()
        self.connection.settimeout(SERVER_TIMEOUT_SECONDS)

    def translate_path(self, path):
        old_dir = os.getcwd()
        try:
            os.chdir(BASE_DIR)
            translated = super().translate_path(path)
        finally:
            os.chdir(old_dir)
        real_path = os.path.realpath(translated)
        real_base = os.path.realpath(BASE_DIR)
        if not real_path.startswith(real_base + os.sep) and real_path != real_base:
            raise PermissionError('unsafe path')
        return translated

    def is_sensitive_static(self, path):
        try:
            translated = self.translate_path(urllib.parse.urlsplit(path).path)
            relative = os.path.relpath(os.path.realpath(translated), os.path.realpath(BASE_DIR))
        except (PermissionError, ValueError):
            return True
        if relative == '.':
            return False
        parts = relative.replace('\\', '/').split('/')
        if parts[0] == 'saves' or any(part.startswith('.') for part in parts):
            return True
        suffix = os.path.splitext(parts[-1])[1].lower()
        return suffix not in ALLOWED_STATIC_SUFFIXES

    def handle_error(self, request, client_address):
        exc_type = sys.exc_info()[0]
        if exc_type and issubclass(exc_type, (
            ConnectionAbortedError, ConnectionResetError, BrokenPipeError,
            TimeoutError, OSError,
        )):
            return
        super().handle_error(request, client_address)

    def end_headers(self):
        origin = self.headers.get('Origin')
        if origin and _origin_is_allowed(origin):
            self.send_header('Access-Control-Allow-Origin', origin)
            self.send_header('Access-Control-Allow-Credentials', 'false')
            self.send_header('Vary', 'Origin')
        for name, value in SECURITY_HEADERS:
            self.send_header(name, value)

        path = urllib.parse.urlsplit(self.path).path
        suffix = os.path.splitext(path)[1].lower()
        if path == '/' or path.startswith('/api/') or suffix in ('.html', '.css', '.js'):
            self.send_header('Cache-Control', 'no-store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
        elif suffix in ('.wav', '.mp3', '.ogg', '.png', '.jpg', '.jpeg', '.webp', '.gif'):
            self.send_header('Cache-Control', 'public, max-age=86400')
        else:
            self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def _reject_request(self):
        self._send_json(403, {'ok': False, 'error': 'request_origin_not_allowed'})

    def _request_host_allowed(self):
        fetch_site = (self.headers.get('Sec-Fetch-Site') or '').lower()
        return (
            fetch_site != 'cross-site'
            and _host_is_allowed(self.headers.get('Host'))
            and _origin_is_allowed(self.headers.get('Origin'))
        )

    def _api_token_ok(self):
        supplied = (self.headers.get(API_TOKEN_HEADER) or '').encode('utf-8')
        return secrets.compare_digest(supplied, SESSION_TOKEN.encode('utf-8'))

    def do_OPTIONS(self):
        try:
            if not self._request_host_allowed():
                self._reject_request()
                return
            self.send_response(204)
            self.send_header('Allow', 'GET, HEAD, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type, Accept, ' + API_TOKEN_HEADER)
            self.send_header('Access-Control-Max-Age', '600')
            self.send_header('Content-Length', '0')
            self.end_headers()
        except (ConnectionAbortedError, ConnectionResetError, BrokenPipeError):
            pass

    def do_GET(self):
        try:
            if not self._request_host_allowed():
                self._reject_request()
                return
            parsed = urllib.parse.urlsplit(self.path)
            self._route_get(parsed.path, parsed.query)
        except (ConnectionAbortedError, ConnectionResetError, BrokenPipeError):
            pass

    def do_HEAD(self):
        try:
            if not self._request_host_allowed():
                self._reject_request()
                return
            path = urllib.parse.urlsplit(self.path).path
            if path.startswith('/api/'):
                self._send_json(405, {'ok': False, 'error': 'head_not_allowed'})
            elif self.is_sensitive_static(self.path):
                self._send_json(404, {'ok': False, 'error': 'not_found'})
            else:
                super().do_HEAD()
        except (ConnectionAbortedError, ConnectionResetError, BrokenPipeError):
            pass

    def do_POST(self):
        try:
            if not self._request_host_allowed():
                self._reject_request()
                return
            parsed = urllib.parse.urlsplit(self.path)
            self._route_post(parsed.path, parsed.query)
        except (ConnectionAbortedError, ConnectionResetError, BrokenPipeError):
            pass

    def _route_get(self, path, query):
        if path == '/api/ping':
            self._send_json(200, {'ok': True})
        elif path == '/api/session':
            self._send_json(200, {
                'ok': True,
                'token': SESSION_TOKEN,
                'tokenHeader': API_TOKEN_HEADER,
            })
        elif path == '/api/preload':
            self.handle_preload()
        elif path == '/api/load':
            self.handle_load(query)
        elif path == '/api/relay/config':
            self.handle_relay_config(query)
        elif path == '/api/relay':
            self.handle_relay_proxy('GET', query)
        elif path.startswith('/api/ollama/'):
            self.handle_ollama_proxy('GET', path)
        elif path.startswith('/api/lmstudio/'):
            self.handle_lmstudio_proxy('GET', path)
        elif self.is_sensitive_static(self.path):
            self._send_json(404, {'ok': False, 'error': 'not_found'})
        else:
            super().do_GET()

    def _route_post(self, path, query):
        if path == '/api/save':
            self.handle_save(query)
        elif path == '/api/delete':
            self.handle_delete(query)
        elif path == '/api/relay/config':
            self.handle_relay_config_update(query)
        elif path == '/api/relay':
            self.handle_relay_proxy('POST', query)
        elif path.startswith('/api/ollama/'):
            self.handle_ollama_proxy('POST', path)
        elif path.startswith('/api/lmstudio/'):
            self.handle_lmstudio_proxy('POST', path)
        else:
            self.send_response(405)
            self.send_header('Allow', 'GET, HEAD, POST, OPTIONS')
            self.send_header('Content-Length', '0')
            self.end_headers()

    def handle_preload(self):
        if not self._api_token_ok():
            self._send_json(401, {'ok': False, 'error': 'invalid_session_token'})
            return
        try:
            values = db.get_all()
            values.pop('_migrated', None)
            values.pop('_relay_bases', None)
            self._send_json(200, {
                'ok': True,
                'storageStatus': 'ready' if values else 'empty',
                'values': values,
            })
        except Exception:
            self._send_json(503, {
                'ok': False,
                'error': 'storage_unavailable',
                'storageStatus': 'unavailable',
            })

    def _safe_key(self, query_string):
        params = urllib.parse.parse_qs(query_string)
        key = (params.get('key', [''])[0] or '')
        if not key or not all(c.isalnum() or c in '_-' for c in key):
            return None
        return key

    def _read_body(self, max_bytes):
        try:
            content_length = int(self.headers.get('Content-Length', '0'))
        except ValueError:
            self._send_json(400, {'ok': False, 'error': 'invalid_content_length'})
            return None
        if content_length < 0 or content_length > max_bytes:
            self._send_json(413, {'ok': False, 'error': 'request_body_too_large'})
            return None
        return self.rfile.read(content_length)

    def _read_gzip_limited(self, compressed, max_bytes):
        output = bytearray()
        with gzip.GzipFile(fileobj=io.BytesIO(compressed), mode='rb') as archive:
            while True:
                chunk = archive.read(65536)
                if not chunk:
                    break
                output.extend(chunk)
                if len(output) > max_bytes:
                    raise ValueError('decompressed_payload_too_large')
        return bytes(output)

    def handle_load(self, query_string):
        if not self._api_token_ok():
            self._send_json(401, {'ok': False, 'error': 'invalid_session_token'})
            return
        key = self._safe_key(query_string)
        if not key:
            self._send_json(400, {'ok': False, 'error': 'invalid_key'})
            return
        try:
            content = db.get(key)
            if content is None:
                self._send_json(404, {'ok': False, 'error': 'not_found'})
                return
            raw = content.encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'text/plain; charset=utf-8')
            self.send_header('Content-Length', str(len(raw)))
            self.end_headers()
            self.wfile.write(raw)
        except Exception:
            self._send_json(503, {'ok': False, 'error': 'storage_unavailable'})

    def handle_save(self, query_string):
        if not self._api_token_ok():
            self._send_json(401, {'ok': False, 'error': 'invalid_session_token'})
            return
        key = self._safe_key(query_string)
        if not key:
            self._send_json(400, {'ok': False, 'error': 'invalid_key'})
            return

        params = urllib.parse.parse_qs(query_string)
        revision = None
        force = params.get('force', ['0'])[0] == '1'
        if 'rev' in params:
            try:
                revision = int(params['rev'][0])
            except ValueError:
                self._send_json(400, {'ok': False, 'error': 'invalid_revision'})
                return

        body = self._read_body(MAX_REQUEST_BYTES)
        if body is None:
            return

        if 'gzip' in self.headers.get('Content-Encoding', ''):
            try:
                body = self._read_gzip_limited(body, MAX_SAVE_BYTES)
            except (OSError, ValueError, EOFError):
                self._send_json(400, {'ok': False, 'error': 'invalid_gzip_payload'})
                return

        try:
            body_str = body.decode('utf-8')
        except UnicodeDecodeError:
            self._send_json(400, {'ok': False, 'error': 'invalid_utf8_payload'})
            return
        if len(body_str) > MAX_SAVE_BYTES:
            self._send_json(413, {'ok': False, 'error': 'payload_too_large'})
            return

        if revision is not None and not force:
            try:
                existing = db.get(key)
                stored_revision = None
                if existing is not None:
                    existing_data = json.loads(existing)
                    if isinstance(existing_data, dict):
                        stored_revision = existing_data.get('saveRevision')
                if isinstance(stored_revision, int) and revision <= stored_revision:
                    self._send_json(409, {
                        'ok': False,
                        'error': 'stale_revision',
                        'storedRevision': stored_revision,
                    })
                    return
            except Exception:
                # 旧版存档没有 revision 字段时，允许首次升级到版本化协议。
                pass

        try:
            db.set(key, body_str)
            self._send_json(200, {
                'ok': True,
                'storedRevision': revision if revision is not None else None,
            })
        except Exception:
            self._send_json(503, {'ok': False, 'error': 'storage_write_failed'})

    def handle_delete(self, query_string):
        if not self._api_token_ok():
            self._send_json(401, {'ok': False, 'error': 'invalid_session_token'})
            return
        key = self._safe_key(query_string)
        if not key:
            self._send_json(400, {'ok': False, 'error': 'invalid_key'})
            return
        try:
            db.delete(key)
            self._send_json(200, {'ok': True})
        except Exception:
            self._send_json(503, {'ok': False, 'error': 'storage_write_failed'})

    def _relay_bases(self):
        raw = db.get('_relay_bases')
        if not raw:
            return []
        try:
            value = json.loads(raw)
        except (TypeError, ValueError):
            return []
        return value if isinstance(value, list) else []

    def handle_relay_config(self, query_string):
        if not self._api_token_ok():
            self._send_json(401, {'ok': False, 'error': 'invalid_session_token'})
            return
        self._send_json(200, {'ok': True, 'bases': self._relay_bases()})

    def handle_relay_config_update(self, query_string):
        if not self._api_token_ok():
            self._send_json(401, {'ok': False, 'error': 'invalid_session_token'})
            return
        params = urllib.parse.parse_qs(query_string)
        action = params.get('action', ['add'])[0]
        raw_base = params.get('base', [''])[0]

        body = self._read_body(MAX_REQUEST_BYTES)
        if body is None:
            return
        if body:
            try:
                payload = json.loads(body.decode('utf-8'))
            except (UnicodeDecodeError, ValueError):
                self._send_json(400, {'ok': False, 'error': 'invalid_json_payload'})
                return
            raw_base = payload.get('base', raw_base)
            action = payload.get('action', action)

        if action == 'clear':
            bases = []
        else:
            normalized = _normalize_base(raw_base)
            if not normalized:
                self._send_json(400, {'ok': False, 'error': 'invalid_relay_base'})
                return
            bases = self._relay_bases()
            if action == 'remove':
                bases = [item for item in bases if item != normalized]
            elif normalized not in bases:
                bases.append(normalized)

        try:
            bases = sorted(set(bases))
            db.set('_relay_bases', json.dumps(bases, ensure_ascii=False))
            self._send_json(200, {'ok': True, 'bases': bases})
        except Exception:
            self._send_json(503, {'ok': False, 'error': 'storage_write_failed'})

    def _read_limited_response(self, response, deadline):
        total = 0
        chunks = []
        try:
            declared = int(response.getheader('Content-Length') or '0')
        except ValueError:
            return None
        if declared > MAX_UPSTREAM_BYTES:
            return None
        while total < MAX_UPSTREAM_BYTES:
            if time.monotonic() >= deadline:
                return None
            chunk = response.read(min(65536, MAX_UPSTREAM_BYTES - total))
            if not chunk:
                break
            total += len(chunk)
            chunks.append(chunk)
        return b''.join(chunks) if total <= MAX_UPSTREAM_BYTES else None

    def _proxy_to(self, method, path, prefix, service_name, host, port):
        if not self._api_token_ok():
            self._send_json(401, {'ok': False, 'error': 'invalid_session_token'})
            return
        target_path = path.replace(prefix, '', 1) or '/'
        body = self._read_body(MAX_REQUEST_BYTES)
        if body is None:
            return

        deadline = time.monotonic() + UPSTREAM_TIMEOUT_SECONDS
        connection = None
        try:
            connection = http.client.HTTPConnection(
                host, port, timeout=max(1.0, deadline - time.monotonic())
            )
            headers = {'Accept': 'application/json', 'Connection': 'keep-alive'}
            if body:
                headers['Content-Type'] = 'application/json'
            connection.request(method, target_path, body=body or None, headers=headers)
            response = connection.getresponse()
            raw = self._read_limited_response(response, deadline)
            if raw is None:
                self._send_json(504, {'ok': False, 'error': f'{service_name}_response_too_large_or_timeout'})
                return
            self.send_response(response.status)
            self.send_header('Content-Type', response.getheader('Content-Type', 'application/json'))
            self.send_header('Content-Length', str(len(raw)))
            self.end_headers()
            self.wfile.write(raw)
        except TimeoutError:
            self._send_json(504, {'ok': False, 'error': f'{service_name}_response_timeout'})
        except (ConnectionRefusedError, OSError):
            self._send_json(502, {'ok': False, 'error': f'{service_name}_unavailable'})
        except Exception:
            self._send_json(502, {'ok': False, 'error': f'{service_name}_proxy_failed'})
        finally:
            if connection is not None:
                try:
                    connection.close()
                except Exception:
                    pass

    def handle_ollama_proxy(self, method, path):
        self._proxy_to(method, path, '/api/ollama', 'Ollama', 'localhost', 11434)

    def handle_lmstudio_proxy(self, method, path):
        self._proxy_to(method, path, '/api/lmstudio', 'LM Studio', 'localhost', 1234)

    def _send_json(self, status, payload):
        try:
            raw = json.dumps(payload, ensure_ascii=False).encode('utf-8')
            self.send_response(status)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(raw)))
            self.end_headers()
            self.wfile.write(raw)
        except (ConnectionAbortedError, ConnectionResetError, BrokenPipeError):
            pass

    def handle_relay_proxy(self, method, query_string):
        if not self._api_token_ok():
            self._send_json(401, {'ok': False, 'error': 'invalid_session_token'})
            return

        params = urllib.parse.parse_qs(query_string)
        target = (params.get('target', [''])[0] or '').strip()
        normalized_target = _normalize_base(target)
        registered_bases = self._relay_bases()
        if not normalized_target or not any(_base_matches_target(target, base) for base in registered_bases):
            self._send_json(403, {'ok': False, 'error': 'relay_base_not_registered'})
            return

        body = self._read_body(MAX_REQUEST_BYTES)
        if body is None:
            return

        try:
            parsed = urllib.parse.urlsplit(target)
            use_tls = parsed.scheme == 'https'
            default_port = 443 if use_tls else 80
            port = parsed.port or default_port
            hostname = parsed.hostname
            target_path = parsed.path or '/'
            if parsed.query:
                target_path += '?' + parsed.query
        except ValueError:
            self._send_json(400, {'ok': False, 'error': 'invalid_relay_target'})
            return

        headers = {'User-Agent': 'shanghaifc-relay/1.1', 'Accept': 'application/json'}
        for name in ('Authorization', 'Content-Type'):
            value = self.headers.get(name)
            if value:
                headers[name] = value
        if body and 'Content-Type' not in headers:
            headers['Content-Type'] = 'application/json'

        deadline = time.monotonic() + UPSTREAM_TIMEOUT_SECONDS
        connection = None
        try:
            connection_class = http.client.HTTPSConnection if use_tls else http.client.HTTPConnection
            connection = connection_class(
                hostname, port, timeout=max(1.0, deadline - time.monotonic())
            )
            connection.request(method, target_path, body=body or None, headers=headers)
            response = connection.getresponse()
            raw = self._read_limited_response(response, deadline)
            if raw is None:
                self._send_json(504, {'ok': False, 'error': 'upstream_response_too_large_or_timeout'})
                return
            self.send_response(response.status)
            self.send_header('Content-Type', response.getheader('Content-Type', 'application/json'))
            self.send_header('Content-Length', str(len(raw)))
            self.end_headers()
            self.wfile.write(raw)
        except TimeoutError:
            self._send_json(504, {'ok': False, 'error': 'upstream_response_timeout'})
        except (ConnectionRefusedError, OSError):
            self._send_json(502, {'ok': False, 'error': 'upstream_unreachable'})
        except Exception:
            self._send_json(502, {'ok': False, 'error': 'upstream_request_failed'})
        finally:
            if connection is not None:
                try:
                    connection.close()
                except Exception:
                    pass


class BoundedHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    allow_reuse_address = True
    daemon_threads = True
    request_queue_size = 32

    def __init__(self, server_address, handler_cls, max_workers=16):
        self._executor = ThreadPoolExecutor(max_workers=max_workers)
        self._shanghaifc_port = server_address[1]
        super().__init__(server_address, handler_cls)

    def process_request(self, request, client_address):
        self._executor.submit(self.process_request_thread, request, client_address)

    def server_close(self):
        super().server_close()
        self._executor.shutdown(wait=False)


def parse_args():
    parser = argparse.ArgumentParser(description='商海浮沉本地游戏服务器')
    parser.add_argument('--host', default='127.0.0.1', help='默认只绑定本机；LAN 使用时须显式指定')
    parser.add_argument('--port', type=int, default=DEFAULT_PORT)
    parser.add_argument('--allow-host', action='append', default=[], help='LAN 模式额外允许的主机名/IP')
    parser.add_argument('--verbose', action='store_true', help='记录非 API 请求')
    return parser.parse_args()


def main():
    global EXPECTED_PORT
    args = parse_args()
    EXPECTED_PORT = args.port
    for value in args.allow_host:
        ALLOWED_HOSTS.add(_host_without_port(value))

    os.makedirs(SAVES_DIR, exist_ok=True)
    db.init_db()
    db.migrate_from_json()
    os.chdir(BASE_DIR)

    server = BoundedHTTPServer((args.host, args.port), GameServer)
    server._verbose = args.verbose
    print('商海浮沉 游戏服务器已启动')
    print(f'   监听地址: {args.host}:{args.port}')
    print(f'   允许主机: {", ".join(sorted(ALLOWED_HOSTS))}')
    print(f'   游戏目录: {BASE_DIR}')
    print(f'   存档数据库: {db.DB_PATH}')
    print(f'   打开浏览器访问: http://localhost:{args.port}')
    print('   按 Ctrl+C 停止服务器')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\n服务器已停止')
    finally:
        db.close()
        server.server_close()


if __name__ == '__main__':
    main()
