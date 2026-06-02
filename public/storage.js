// storage.js - 文件存档适配层（通过 server.py API 读写游戏目录下的 saves/ 文件夹）
window.Storage = (() => {
  // 缓存：从 __preloadData 初始化，之后同步读写
  const cache = {};
  let serverReady = false;

  // 从预加载数据填充缓存（index.html 中的内联脚本已同步获取）
  if (window.__preloadData) {
    Object.assign(cache, window.__preloadData);
    serverReady = true;
  }

  // 异步确认服务器状态
  fetch('/api/preload')
    .then(r => { if (r.ok) serverReady = true; })
    .catch(() => { serverReady = false; });

  function get(key) {
    if (key in cache) return cache[key];
    // 兜底：尝试 localStorage（迁移旧存档或无服务器时）
    try { return localStorage.getItem(key); } catch(e) { return null; }
  }

  function set(key, value) {
    cache[key] = value;
    // 写入服务器文件
    if (serverReady) {
      fetch('/api/save?key=' + encodeURIComponent(key), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        body: value
      }).catch(() => {});
    }
    // 同时写 localStorage 做双保险
    try { localStorage.setItem(key, value); } catch(e) {}
  }

  function remove(key) {
    delete cache[key];
    if (serverReady) {
      fetch('/api/delete?key=' + encodeURIComponent(key), { method: 'POST' }).catch(() => {});
    }
    try { localStorage.removeItem(key); } catch(e) {}
  }

  // 迁移：首次运行时把旧 localStorage 存档同步到文件
  function migrateFromLocalStorage() {
    if (!serverReady) return;
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('shfc_') || k.startsWith('shanghaifc_'))) {
        keys.push(k);
      }
    }
    keys.forEach(k => {
      if (!(k in cache)) {
        const v = localStorage.getItem(k);
        if (v) {
          cache[k] = v;
          fetch('/api/save?key=' + encodeURIComponent(k), {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            body: v
          }).catch(() => {});
        }
      }
    });
  }

  // 延迟执行迁移（等服务器确认连通后）
  setTimeout(migrateFromLocalStorage, 2000);

  return { get, set, remove };
})();
