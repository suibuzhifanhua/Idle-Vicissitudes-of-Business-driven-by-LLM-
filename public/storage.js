// storage.js - 文件存档适配层（仅通过 server.py API 读写游戏目录下的 saves/ 文件夹）
window.Storage = (() => {
  // 缓存：从 __preloadData 初始化，之后同步读写
  const cache = {};
  let serverReady = false;

  // 从预加载数据填充缓存（index.html 中的内联脚本已同步获取）
  if (window.__preloadData) {
    Object.assign(cache, window.__preloadData);
    serverReady = true;
  }

  // 异步确认服务器状态，成功后把数据写入缓存
  fetch('/api/preload')
    .then(r => {
      if (r.ok) {
        serverReady = true;
        return r.json();
      }
      throw new Error('preload not ok');
    })
    .then(data => {
      if (data && typeof data === 'object') {
        Object.assign(cache, data);
        console.log('[Storage] async preload ok, keys:', Object.keys(data));
      }
    })
    .catch(() => { serverReady = false; });

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

  return { get, set, remove };
})();
