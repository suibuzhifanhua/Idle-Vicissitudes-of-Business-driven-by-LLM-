# Author: Fisheep.L
# db.py - SQLite 轻量数据库层，封装游戏存档的实时存取
import os
import sqlite3
import threading
import time

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SAVES_DIR = os.path.join(BASE_DIR, 'saves')
DB_PATH = os.path.join(SAVES_DIR, 'game.db')

_local = threading.local()
_write_lock = threading.Lock()
_write_count = 0
_WRITE_CHECKPOINT_INTERVAL = 50


def _get_conn():
    if not hasattr(_local, 'conn') or _local.conn is None:
        _local.conn = sqlite3.connect(DB_PATH, check_same_thread=False)
        _local.conn.row_factory = sqlite3.Row
        _local.conn.execute("PRAGMA journal_mode=WAL")
        _local.conn.execute("PRAGMA synchronous=FULL")
        _local.conn.execute("PRAGMA busy_timeout=5000")
    return _local.conn


def init_db():
    conn = _get_conn()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS kv_store (
            key         TEXT PRIMARY KEY,
            value       TEXT NOT NULL,
            updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.execute('''
        CREATE INDEX IF NOT EXISTS idx_kv_updated
        ON kv_store(updated_at)
    ''')
    conn.commit()


def get(key):
    conn = _get_conn()
    row = conn.execute("SELECT value FROM kv_store WHERE key = ?", (key,)).fetchone()
    return row['value'] if row else None


def set(key, value):
    global _write_count
    conn = _get_conn()
    conn.execute(
        "INSERT INTO kv_store (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) "
        "ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP",
        (key, value),
    )
    conn.commit()
    with _write_lock:
        _write_count += 1
        should_checkpoint = _write_count % _WRITE_CHECKPOINT_INTERVAL == 0
    if should_checkpoint:
        conn.execute("PRAGMA wal_checkpoint(TRUNCATE)")


def set_many(kv_dict):
    global _write_count
    if not kv_dict:
        return
    conn = _get_conn()
    conn.execute("BEGIN")
    try:
        for key, value in kv_dict.items():
            conn.execute(
                "INSERT INTO kv_store (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) "
                "ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP",
                (key, value),
            )
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    with _write_lock:
        _write_count += len(kv_dict)
        should_checkpoint = _write_count % _WRITE_CHECKPOINT_INTERVAL == 0
    if should_checkpoint:
        conn.execute("PRAGMA wal_checkpoint(TRUNCATE)")


def delete(key):
    conn = _get_conn()
    conn.execute("DELETE FROM kv_store WHERE key = ?", (key,))
    conn.commit()


def get_all():
    conn = _get_conn()
    rows = conn.execute("SELECT key, value FROM kv_store ORDER BY key").fetchall()
    return {row['key']: row['value'] for row in rows}


def migrate_from_json():
    """逐文件迁移旧 JSON，并在回读校验全部成功后才保留可恢复备份。"""
    if not os.path.isdir(SAVES_DIR):
        return

    json_files = sorted(
        fname for fname in os.listdir(SAVES_DIR)
        if fname.endswith('.json') and not fname.endswith('.corrupt')
    )
    if not json_files:
        if get('_migrated') is None:
            set('_migrated', '1')
        return

    backup_suffix = '.pre-sqlite-' + time.strftime('%Y%m%d%H%M%S')
    completed = []
    failures = []

    for fname in json_files:
        source = os.path.join(SAVES_DIR, fname)
        key = fname[:-5]
        try:
            with open(source, 'r', encoding='utf-8') as stream:
                content = stream.read()

            existing = get(key)
            if existing is not None and existing != content:
                raise ValueError('database already contains a different value')
            if existing is None:
                set(key, content)
                if get(key) != content:
                    raise ValueError('readback verification failed')

            destination = source + backup_suffix
            os.replace(source, destination)
            completed.append(fname)
        except Exception as error:
            failures.append(f'{fname} ({error})')

    if failures:
        print('[DB] JSON 迁移未全部完成，原文件均保留: ' + '; '.join(failures[:10]))
        return

    if completed:
        print(f'[DB] 已迁移并备份 {len(completed)} 个 JSON 存档文件')
    set('_migrated', '1')


def close():
    if hasattr(_local, 'conn') and _local.conn is not None:
        try:
            _local.conn.execute("PRAGMA wal_checkpoint(TRUNCATE)")
            _local.conn.execute("PRAGMA optimize")
        except Exception:
            pass
        _local.conn.close()
        _local.conn = None
