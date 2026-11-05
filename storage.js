// ==================================================
// storage.js - 服务器端 SQLite 存档适配层
// ==================================================
(function () {
  'use strict';

  const cache = Object.create(null);
  const revisions = Object.create(null);
  const pendingWrites = Object.create(null);
  const activeWrites = Object.create(null);
  const knownKeys = new Set();
  let status = 'unknown';
  let persistentError = false;

  const readyPromise = (window.Network ? window.Network.ready() : Promise.resolve({ status: 'unavailable' }))
    .then(async () => {
      if (!window.Network || !window.Network.hasToken()) {
        status = 'unavailable';
        return false;
      }
      try {
        const response = await window.Network.fetchApi('/api/preload');
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const result = await response.json();
        if (!result || result.ok !== true) throw new Error('invalid_preload_response');
        const values = result.values && typeof result.values === 'object' ? result.values : {};
        Object.keys(values).forEach((key) => {
          cache[key] = values[key];
          knownKeys.add(key);
        });
        status = result.storageStatus === 'empty' ? 'empty' : 'ready';
        return true;
      } catch (error) {
        if (typeof window.SGame !== 'undefined') {
          window.SGame.DEBUG && console.warn('[Storage] preload failed:', error);
        } else {
          console.warn('[Storage] preload failed:', error);
        }
        status = 'unavailable';
        return false;
      }
    })
    .catch(() => {
      status = 'unavailable';
      return false;
    });

  function isUsable() {
    return status === 'ready' || status === 'empty';
  }

  function get(key) {
    if (key in cache) return cache[key];
    if (!isUsable()) {
      console.warn('[Storage] unavailable; key lookup suppressed:', key);
      return null;
    }
    // ready 后 preload 已覆盖全部键；这里不是缓存缺失，而是该键确实不存在。
    return null;
  }

  function has(key) {
    return key in cache;
  }

  function _revisionFor(key, requested) {
    if (Number.isFinite(requested)) {
      revisions[key] = Math.max(0, Math.floor(requested));
      return revisions[key];
    }
    revisions[key] = (revisions[key] || 0) + 1;
    return revisions[key];
  }

  function _conflictRevision(responseData, attempted) {
    const stored = Number(responseData && responseData.storedRevision);
    if (Number.isFinite(stored)) {
      revisions[responseData.key] = stored + 1;
    }
    return attempted;
  }

  async function _runQueue(key) {
    while (Object.prototype.hasOwnProperty.call(pendingWrites, key)) {
      const value = pendingWrites[key];
      delete pendingWrites[key];
      const revision = revisions[key];
      const params = new URLSearchParams({ key });
      params.set('rev', String(revision));
      try {
        const response = await window.Network.fetchApi('/api/save?' + params.toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          body: value,
        });
        if (response.status === 409) {
          const body = await response.json().catch(() => ({}));
          const stored = Number(body && body.storedRevision);
          if (Number.isFinite(stored)) revisions[key] = stored;
          if (Object.prototype.hasOwnProperty.call(pendingWrites, key)) continue;
          persistentError = false;
          return false;
        }
        if (!response.ok) throw new Error('HTTP ' + response.status);
        cache[key] = value;
        knownKeys.add(key);
        persistentError = false;
      } catch (error) {
        persistentError = true;
        try {
          if (typeof UI !== 'undefined' && UI.showToast) {
            UI.showToast('error', '存档保存失败', error.message || '请检查服务端连接');
          }
        } catch (_) {
          // Toast 本身失败不应覆盖原始持久化错误。
        }
        throw error;
      }
    }
    return true;
  }

  function set(key, value, options = {}) {
    if (!isUsable()) {
      return Promise.reject(new Error('storage_unavailable'));
    }
    pendingWrites[key] = value;
    _revisionFor(key, options.revision);
    if (activeWrites[key]) return activeWrites[key];

    const job = _runQueue(key).finally(() => {
      if (activeWrites[key] === job) delete activeWrites[key];
    });
    activeWrites[key] = job;
    return job;
  }

  function remove(key) {
    if (!isUsable()) {
      return Promise.reject(new Error('storage_unavailable'));
    }
    const params = new URLSearchParams({ key });
    return window.Network.fetchApi('/api/delete?' + params.toString(), {
      method: 'POST',
    }).then((response) => {
      if (!response.ok) throw new Error('HTTP ' + response.status);
      delete cache[key];
      delete pendingWrites[key];
      knownKeys.delete(key);
      return true;
    });
  }

  function ready() {
    return readyPromise;
  }

  function getStatus() {
    return status;
  }

  function isReady() {
    return isUsable();
  }

  function hasPersistentError() {
    return persistentError;
  }

  function saveFinal(key, value, revision) {
    return window.Network ? window.Network.saveFinal(key, value, revision) : Promise.resolve(false);
  }

  window.Storage = {
    get,
    has,
    set,
    remove,
    ready,
    getStatus,
    isReady,
    hasPersistentError,
    saveFinal,
  };
})();
