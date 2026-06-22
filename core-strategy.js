// ==================================================
// state.js — 全局状态管理器
// ==================================================

window.StateManager = (() => {
  let _state = null;
  const _listeners = {};

  function _notify(key) {
    const fns = _listeners[key];
    if (fns) {
      for (let i = 0; i < fns.length; i++) {
        try { fns[i](_state[key], key); } catch(e) { SGame.DEBUG && console.error('[StateManager] listener error:', e); }
      }
    }
  }

  return {
    init(state) { _state = state; },
    getState() { return _state; },
    get(key) { return _state ? _state[key] : undefined; },
    set(key, value) {
      if (_state) {
        _state[key] = value;
        _notify(key);
      }
    },
    subscribe(key, fn) {
      if (!_listeners[key]) _listeners[key] = [];
      _listeners[key].push(fn);
    },
    unsubscribe(key, fn) {
      if (_listeners[key]) {
        _listeners[key] = _listeners[key].filter(f => f !== fn);
      }
    },
    has(key) { return _state && key in _state; },
  };
})();
