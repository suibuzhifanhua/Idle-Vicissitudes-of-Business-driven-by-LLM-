import gzip
import http.client
import json
import os
import shutil
import tempfile
import threading
import unittest

import db


class ServerApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.original_db_path = db.DB_PATH
        cls.original_saves_dir = db.SAVES_DIR
        cls.temporary_dir = tempfile.mkdtemp(prefix="shanghaifc-api-test-")
        cls.original_db_dir = os.path.join(cls.temporary_dir, "saves")
        db.SAVES_DIR = cls.original_db_dir
        db.DB_PATH = os.path.join(cls.original_db_dir, "game.db")
        os.makedirs(db.SAVES_DIR, exist_ok=True)

        import server

        cls.server_module = server
        cls.server_module.SESSION_TOKEN = "unit-test-token"
        cls.db = db
        db.init_db()

        cls.http_server = server.BoundedHTTPServer(("127.0.0.1", 0), server.GameServer)
        cls.port = cls.http_server.server_address[1]
        server.EXPECTED_PORT = cls.port
        cls.thread = threading.Thread(target=cls.http_server.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.http_server.shutdown()
        cls.http_server.server_close()
        cls.thread.join(timeout=5)
        db.close()
        db.DB_PATH = cls.original_db_path
        db.SAVES_DIR = cls.original_saves_dir
        shutil.rmtree(cls.temporary_dir, ignore_errors=True)

    def setUp(self):
        self.db.set_many({key: value for key, value in self.db.get_all().items()})
        for key in self.db.get_all():
            if key != "_migrated":
                self.db.delete(key)

    def _request(self, method, path, body=None, headers=None):
        request_headers = {
            "Host": f"127.0.0.1:{self.port}",
            "Accept": "application/json",
        }
        if headers:
            request_headers.update(headers)
        if body is not None and "Content-Length" not in request_headers:
            request_headers["Content-Length"] = str(len(body))

        connection = http.client.HTTPConnection("127.0.0.1", self.port, timeout=5)
        try:
            connection.request(method, path, body=body, headers=request_headers)
            response = connection.getresponse()
            raw = response.read()
            payload = None
            if raw:
                try:
                    payload = json.loads(raw.decode("utf-8"))
                except (UnicodeDecodeError, json.JSONDecodeError):
                    payload = raw.decode("utf-8", errors="replace")
            return response.status, payload
        finally:
            connection.close()

    def test_preload_requires_session_token(self):
        status, _ = self._request("GET", "/api/preload")
        self.assertEqual(status, 401)
        status, payload = self._request(
            "GET", "/api/preload", headers={"X-Shanghaifc-Token": self.server_module.SESSION_TOKEN}
        )
        self.assertEqual(status, 200)
        self.assertIn(payload["storageStatus"], {"ready", "empty"})

    def test_cross_origin_write_is_rejected(self):
        status, payload = self._request(
            "POST",
            "/api/save?key=test_slot&rev=1",
            body=b'{"saveRevision":1}',
            headers={
                "X-Shanghaifc-Token": self.server_module.SESSION_TOKEN,
                "Origin": "http://evil.test",
            },
        )
        self.assertEqual(status, 403)
        self.assertEqual(payload["error"], "request_origin_not_allowed")

    def test_save_revision_rejects_stale_write(self):
        headers = {"X-Shanghaifc-Token": self.server_module.SESSION_TOKEN, "Content-Type": "text/plain"}
        first_body = json.dumps({"saveRevision": 1, "G": {}}).encode("utf-8")
        second_body = json.dumps({"saveRevision": 1, "G": {}}).encode("utf-8")
        third_body = json.dumps({"saveRevision": 2, "G": {}}).encode("utf-8")

        self.assertEqual(self._request("POST", "/api/save?key=test_slot&rev=1", first_body, headers)[0], 200)
        stale_status, stale_payload = self._request("POST", "/api/save?key=test_slot&rev=1", second_body, headers)
        self.assertEqual(stale_status, 409)
        self.assertEqual(stale_payload["storedRevision"], 1)
        self.assertEqual(self._request("POST", "/api/save?key=test_slot&rev=2", third_body, headers)[0], 200)

    def test_save_accepts_gzip_and_rejects_decompression_bomb(self):
        headers = {
            "X-Shanghaifc-Token": self.server_module.SESSION_TOKEN,
            "Content-Type": "text/plain",
            "Content-Encoding": "gzip",
        }
        safe_body = gzip.compress(json.dumps({"saveRevision": 1, "G": {}}).encode("utf-8"))
        self.assertEqual(self._request("POST", "/api/save?key=gzip_test&rev=1", safe_body, headers)[0], 200)

        bomb = gzip.compress(b"0" * (6 * 1024 * 1024), compresslevel=1)
        status, payload = self._request("POST", "/api/save?key=bomb_test&rev=1", bomb, headers)
        self.assertEqual(status, 400)
        self.assertEqual(payload["error"], "invalid_gzip_payload")

    def test_sensitive_static_files_are_not_served(self):
        status, _ = self._request("GET", "/saves/game.db")
        self.assertEqual(status, 404)
        status, _ = self._request("GET", "/server.py")
        self.assertEqual(status, 404)

    def test_relay_config_and_proxy_require_session_token(self):
        # 无令牌访问 relay 注册与转发端点一律 401
        status, _ = self._request("POST", "/api/relay/config", b'{"action":"clear"}')
        self.assertEqual(status, 401)
        unregistered = "/api/relay?target=" + "http%3A%2F%2Fevil.test%2Fv1"
        status, _ = self._request("GET", unregistered)
        self.assertEqual(status, 401)

    def test_relay_blocks_metadata_and_linklocal_targets(self):
        token = {"X-Shanghaifc-Token": self.server_module.SESSION_TOKEN}
        # 注册云元数据/链路本地目标必须被拒绝，且不进入注册表
        for blocked_base in ("http://169.254.169.254/latest/meta-data",
                             "http://100.100.100.200/latest/meta-data"):
            body = json.dumps({"action": "add", "base": blocked_base}).encode("utf-8")
            status, payload = self._request(
                "POST", "/api/relay/config", body,
                {**token, "Content-Type": "application/json"},
            )
            self.assertEqual(status, 403, blocked_base)
            self.assertEqual(payload["error"], "relay_target_blocked")
        status, listed = self._request("GET", "/api/relay/config", headers=token)
        self.assertEqual(status, 200)
        self.assertEqual(listed["bases"], [])

        # 助手函数：元数据/链路本地拦截，回环与公网放行（回环本地推理是合法场景）
        check = self.server_module._host_ip_blocked
        self.assertTrue(check("169.254.169.254"))
        self.assertTrue(check("100.100.100.200"))
        self.assertFalse(check("127.0.0.1"))
        self.assertFalse(check("8.8.8.8"))
        self.assertTrue(check(""))

    def test_relay_requires_registered_base(self):
        token = {"X-Shanghaifc-Token": self.server_module.SESSION_TOKEN}
        unregistered = "/api/relay?target=" + "http%3A%2F%2Fevil.test%2Fv1%2Fmodels"
        status, payload = self._request("GET", unregistered, headers=token)
        self.assertEqual(status, 403)
        self.assertEqual(payload["error"], "relay_base_not_registered")

        register_body = json.dumps({"action": "add", "base": "http://api.invalid.test/v1"}).encode("utf-8")
        status, registered = self._request(
            "POST", "/api/relay/config", register_body,
            {**token, "Content-Type": "application/json"},
        )
        self.assertEqual(status, 200)
        self.assertIn("http://api.invalid.test/v1", registered["bases"])

        clear_body = json.dumps({"action": "clear"}).encode("utf-8")
        self.assertEqual(self._request("POST", "/api/relay/config", clear_body, {
            **token,
            "Content-Type": "application/json",
        })[0], 200)


if __name__ == "__main__":
    unittest.main(verbosity=2)
