# Author: Fisheep.L
# db.py - SQLite 轻量数据库层，封装游戏存档的实时存取
import os
import sqlite3
import threading

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SAVES_DIR = os.path.join(BASE_DIR, 'saves')
DB_PATH = os.path.join(SAVES_DIR, 'game.db')

# 线程本地连接池（每个线程持有自己的连接和游标，避免并发冲突）
_local = threading.local()

# WAL checkpoint 计数器（模块级，所有线程共享写次数统计）
_write_count = 0
_WRITE_CHECKPOINT_INTERVAL = 50


def _get_conn():
    """获取当前线程的数据库连接（惰性创建）"""
    if not hasattr(_local, 'conn') or _local.conn is None:
        _local.conn = sqlite3.connect(DB_PATH, check_same_thread=False)
        _local.conn.row_factory = sqlite3.Row
        _local.conn.execute("PRAGMA journal_mode=WAL")
        _local.conn.execute("PRAGMA synchronous=NORMAL")
        _local.conn.execute("PRAGMA busy_timeout=5000")
    return _local.conn


def init_db():
    """初始化数据库表结构（幂等操作，多次调用安全）"""
    conn = _get_conn()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS kv_store (
            key     TEXT PRIMARY KEY,
            value   TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.execute('''
        CREATE INDEX IF NOT EXISTS idx_kv_updated
        ON kv_store(updated_at)
    ''')
    conn.commit()


def get(key):
    """读取单个 key 的值。不存在返回 None。"""
    conn = _get_conn()
    row = conn.execute("SELECT value FROM kv_store WHERE key = ?", (key,)).fetchone()
    return row['value'] if row else None


def set(key, value):
    """写入/更新 key 的值（UPSERT）。"""
    global _write_count
    conn = _get_conn()
    conn.execute(
        "INSERT INTO kv_store (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) "
        "ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP",
        (key, value)
    )
    conn.commit()
    _write_count += 1
    if _write_count % _WRITE_CHECKPOINT_INTERVAL == 0:
        conn.execute("PRAGMA wal_checkpoint(TRUNCATE)")


def set_many(kv_dict):
    """批量写入多个 key-value，包裹在单个事务中。"""
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
                (key, value)
            )
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    _write_count += len(kv_dict)
    if _write_count % _WRITE_CHECKPOINT_INTERVAL == 0:
        conn.execute("PRAGMA wal_checkpoint(TRUNCATE)")


def delete(key):
    """删除指定 key。"""
    conn = _get_conn()
    conn.execute("DELETE FROM kv_store WHERE key = ?", (key,))
    conn.commit()


def get_all():
    """返回所有 key-value 对，格式为 {key: value, ...}"""
    conn = _get_conn()
    rows = conn.execute("SELECT key, value FROM kv_store ORDER BY key").fetchall()
    return {row['key']: row['value'] for row in rows}


def _cleanup_json_files():
    """清理 saves/ 下残留的 JSON 文件（迁移后 / 已迁移状态的清理）"""
    if not os.path.isdir(SAVES_DIR):
        return
    for fname in sorted(os.listdir(SAVES_DIR)):
        if fname.endswith('.json'):
            fpath = os.path.join(SAVES_DIR, fname)
            try:
                os.remove(fpath)
                print(f'[DB] cleaned up: {fname}')
            except Exception as e:
                print(f'[DB] cleanup warning: {fname} ({e})')


def migrate_from_json():
    """
    首次启动时自动将 saves/ 下的旧 JSON 文件迁移到 SQLite。
    仅迁移数据库中尚不存在的 key（幂等安全）。
    迁移成功后在数据库内写入 _migrated 标记，防止重复迁移。
    """
    if not os.path.isdir(SAVES_DIR):
        return

    # 检查是否已迁移：是则仅清理可能残留的 JSON 文件
    if get('_migrated') == '1':
        _cleanup_json_files()
        return

    migrated_count = 0
    for fname in sorted(os.listdir(SAVES_DIR)):
        if not fname.endswith('.json'):
            continue
        key = fname[:-5]  # 去掉 .json
        # 如果数据库中已有该 key，跳过（避免覆盖已有数据）
        if get(key) is not None:
            continue
        fpath = os.path.join(SAVES_DIR, fname)
        try:
            with open(fpath, 'r', encoding='utf-8') as f:
                content = f.read()
            set(key, content)
            migrated_count += 1
        except Exception as e:
            print(f'[DB] migrate warning: {fname} skipped ({e})')

    # 写入迁移标记
    set('_migrated', '1')
    if migrated_count > 0:
        print(f'[DB] migrated {migrated_count} JSON file(s) to SQLite')
        # 迁移成功后删除原始 JSON 文件，避免用户误以为仍在生成 JSON
        _cleanup_json_files()


def close():
    """关闭当前线程的数据库连接"""
    if hasattr(_local, 'conn') and _local.conn is not None:
        try:
            _local.conn.execute("PRAGMA wal_checkpoint(TRUNCATE)")
            _local.conn.execute("PRAGMA optimize")
        except Exception:
            pass
        _local.conn.close()
        _local.conn = None
