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
    .catch(() => { serverReady = false; return false; });

  // 同步从服务器读取单个 key（get 的兜底）
  function syncLoadFromServer(key) {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', '/api/load?key=' + encodeURIComponent(key), false);
      xhr.timeout = 3000;
      xhr.send();
      if (xhr.status === 200) {
        cache[key] = xhr.responseText;
        return xhr.responseText;
      }
    } catch (e) {}
    return null;
  }

  function get(key) {
    if (key in cache) return cache[key];
    // 缓存未命中：同步从服务器读取
    return syncLoadFromServer(key);
  }

  function set(key, value) {
    cache[key] = value;
    // 始终尝试写入服务器（不检查 serverReady，因为 set 时应该已经就绪）
    fetch('/api/save?key=' + encodeURIComponent(key), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      body: value
    }).catch(() => {});
    // 不再写入 localStorage
  }

  function remove(key) {
    delete cache[key];
    fetch('/api/delete?key=' + encodeURIComponent(key), { method: 'POST' }).catch(() => {});
    // 不再清除 localStorage
  }

  function ready() { return _readyPromise; }

  return { get, set, remove, ready };
})();
