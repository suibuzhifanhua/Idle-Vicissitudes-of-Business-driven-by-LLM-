// Author: Fisheep.L
// storage.js - 文件存档适配层（仅通过 server.py API 读写游戏目录下的 saves/ 文件夹）
window.Storage = (() => {
  // 缓存：从 __preloadPromise 异步初始化
  const cache = {};
  let serverReady = false;

  // 单一异步预加载入口（不阻塞页面渲染），暴露 ready Promise 供 main.js 等待
  const _readyPromise = (window.__preloadPromise || Promise.resolve(null))
    .then(data => {
      if (data && typeof data === 'object') {
        Object.assign(cache, data);
        serverReady = true;
        console.log('[Storage] preload ok, keys:', Object.keys(data));
      }
      return serverReady;
    })
    .catch((e) => {
      serverReady = false;
      console.warn('[Storage] preload failed:', e.message || e);
      return false;
    });

  // 预加载已覆盖所有 key，缓存未命中说明 key 不存在
  function get(key) {
    if (key in cache) return cache[key];
    console.warn('[Storage] key not in preload cache:', key);
    return null;
  }

  function set(key, value) {
    const prev = cache[key];
    cache[key] = value;
    fetch('/api/save?key=' + encodeURIComponent(key), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      body: value
    }).then((r) => {
      if (!r.ok) throw new Error('HTTP ' + r.status);
    }).catch((e) => {
      console.warn('[Storage] save failed for key "' + key + '":', e.message || e);
      // Rollback cache on write failure
      if (prev === undefined) { delete cache[key]; }
      else { cache[key] = prev; }
    });
  }

  function remove(key) {
    delete cache[key];
    fetch('/api/delete?key=' + encodeURIComponent(key), { method: 'POST' }).catch((e) => {
      console.warn('[Storage] delete failed for key "' + key + '":', e.message || e);
    });
  }

  function ready() { return _readyPromise; }

  return { get, set, remove, ready };
})();
