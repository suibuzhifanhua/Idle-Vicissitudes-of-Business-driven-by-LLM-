// ==================================================
// network.js - 本机会话令牌与受控 LLM relay 注册
// ==================================================
(function () {
  'use strict';

  const TOKEN_HEADER = 'X-Shanghaifc-Token';
  const state = { status: 'unknown', token: null, port: null };
  const relayRegistrations = Object.create(null);

  const bootstrap = (window.__storageBootstrap || Promise.resolve({ status: 'unavailable' }))
    .then((result) => {
      const safe = result && typeof result === 'object' ? result : {};
      state.status = safe.status || 'unavailable';
      state.token = safe.token || null;
      if (safe.tokenHeader && safe.tokenHeader !== TOKEN_HEADER) {
        state.status = 'unavailable';
        state.token = null;
      }
      return { status: state.status, hasToken: !!state.token };
    })
    .catch(() => {
      state.status = 'unavailable';
      state.token = null;
      return { status: 'unavailable', hasToken: false };
    });

  function _normalizeBase(value) {
    try {
      const url = new URL(String(value || '').trim(), window.location.origin);
      if (!['http:', 'https:'].includes(url.protocol)) return null;
      if (url.username || url.password || url.search || url.hash) return null;
      const pathname = (url.pathname || '/').replace(/\/+$/, '') || '/';
      url.pathname = pathname;
      url.search = '';
      url.hash = '';
      return url.toString().replace(/\/$/, '');
    } catch (_) {
      return null;
    }
  }

  function ready() {
    return bootstrap;
  }

  function getStatus() {
    return state.status;
  }

  function hasToken() {
    return !!state.token;
  }

  function _mergeHeaders(options) {
    const headers = {};
    const source = options && options.headers;
    if (source && typeof source.forEach === 'function' && typeof source.entries === 'function') {
      source.forEach((value, key) => { headers[key] = value; });
    } else if (Array.isArray(source)) {
      source.forEach(([key, value]) => { headers[key] = value; });
    } else if (source && typeof source === 'object') {
      Object.keys(source).forEach((key) => { headers[key] = source[key]; });
    }
    if (state.token) headers[TOKEN_HEADER] = state.token;
    return headers;
  }

  async function fetchApi(path, options = {}) {
    await bootstrap;
    if (String(path).startsWith('/api/') && path !== '/api/ping' && !state.token) {
      throw new Error('storage_unavailable');
    }
    const controller = new AbortController();
    const callerSignal = options && options.signal;
    if (callerSignal) {
      if (callerSignal.aborted) controller.abort();
      else callerSignal.addEventListener('abort', () => controller.abort(), { once: true });
    }
    return window.fetch(path, {
      ...options,
      headers: _mergeHeaders(options),
      signal: controller.signal,
      cache: options && options.cache ? options.cache : 'no-store',
    });
  }

  async function registerRelayBase(base) {
    const normalized = _normalizeBase(base);
    if (!normalized || relayRegistrations[normalized]) {
      return !!relayRegistrations[normalized];
    }
    try {
      const response = await fetchApi('/api/relay/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', base: normalized }),
      });
      if (!response.ok) return false;
      relayRegistrations[normalized] = true;
      return true;
    } catch (_) {
      return false;
    }
  }

  function saveFinal(key, payload, revision) {
    if (!state.token) return Promise.resolve(false);
    const params = new URLSearchParams({ key });
    if (Number.isFinite(revision)) params.set('rev', String(revision));
    return window.fetch('/api/save?' + params.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        [TOKEN_HEADER]: state.token,
      },
      body: payload,
      keepalive: true,
      cache: 'no-store',
    }).then((response) => response.ok).catch(() => false);
  }

  window.Network = {
    ready,
    getStatus,
    hasToken,
    fetchApi,
    registerRelayBase,
    saveFinal,
    normalizeRelayBase: _normalizeBase,
  };
})();
