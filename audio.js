// ==================================================
// audio.js - Web Audio 音效与生命周期管理
// ==================================================
window.AudioFX = (() => {
  let ctx = null;
  let enabled = true;
  const scheduledTimers = [];

  function init() {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        ctx = null;
        return;
      }
      ctx = new AudioContextClass();
      refreshEnabled();
    } catch (_) {
      ctx = null;
    }
  }

  function refreshEnabled() {
    try {
      if (typeof Storage !== 'undefined' && Storage.isReady && Storage.isReady()) {
        const saved = Storage.get('shfc_audio_enabled');
        if (saved !== null) enabled = saved === 'true';
      }
    } catch (_) {
      // 音频开关读取失败时保持当前值，不影响游戏。
    }
    return enabled;
  }

  function clearScheduledTimers() {
    while (scheduledTimers.length) {
      clearTimeout(scheduledTimers.pop());
    }
  }

  function resumeCtx() {
    if (enabled && ctx && ctx.state === 'suspended') {
      const resumed = ctx.resume();
      if (resumed && resumed.catch) resumed.catch(() => {});
    }
  }

  function suspendCtx() {
    if (ctx && ctx.state === 'running') {
      const suspended = ctx.suspend();
      if (suspended && suspended.catch) suspended.catch(() => {});
    }
  }

  function toggle() {
    enabled = !enabled;
    if (enabled) resumeCtx();
    else suspendCtx();
    if (typeof Storage !== 'undefined' && Storage.isReady && Storage.isReady()) {
      try { Storage.set('shfc_audio_enabled', String(enabled)); } catch (_) {}
    }
    return enabled;
  }

  function isEnabled() { return enabled; }

  function _schedule(delay, callback) {
    const timer = setTimeout(() => {
      const index = scheduledTimers.indexOf(timer);
      if (index >= 0) scheduledTimers.splice(index, 1);
      callback();
    }, delay);
    scheduledTimers.push(timer);
  }

  function _playNote(freq, startAt, duration, wave, volume) {
    if (!enabled || !ctx) return;
    resumeCtx();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = wave || 'sine';
    oscillator.frequency.setValueAtTime(freq, startAt);
    gain.gain.setValueAtTime(Math.max(0.0001, volume || 0.12), startAt);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.onended = () => {
      try { oscillator.disconnect(); } catch (_) {}
      try { gain.disconnect(); } catch (_) {}
    };
    oscillator.start(startAt);
    oscillator.stop(startAt + duration);
  }

  function playTone(freq, duration, wave, volume, rampDown) {
    _playNote(freq, ctx ? ctx.currentTime : 0, duration, wave, rampDown === false ? volume : volume || 0.15);
  }

  function playClick() {
    _playNote(800, ctx ? ctx.currentTime : 0, 0.08, 'square', 0.08);
  }

  function playEarn() {
    if (!enabled || !ctx) return;
    const base = ctx.currentTime;
    [523, 659, 784, 1047].forEach((freq, index) => {
      _playNote(freq, base + index * 0.1, 0.2, 'sine', 0.12);
    });
  }

  function playEvent() {
    if (!enabled || !ctx) return;
    const base = ctx.currentTime;
    _playNote(660, base, 0.15, 'triangle', 0.15);
    _playNote(880, base + 0.1, 0.12, 'triangle', 0.12);
  }

  function playAchievement() {
    if (!enabled || !ctx) return;
    const base = ctx.currentTime;
    const notes = [523, 659, 784, 1047, 784, 1047];
    const offsets = [0, 0.15, 0.3, 0.45, 0.75, 0.9];
    const durations = [0.15, 0.15, 0.15, 0.3, 0.15, 0.5];
    notes.forEach((freq, index) => {
      _playNote(freq, base + offsets[index], durations[index], 'triangle', 0.18);
    });
  }

  function playNotify() {
    if (!enabled || !ctx) return;
    const base = ctx.currentTime;
    _playNote(440, base, 0.1, 'sine', 0.1);
    _playNote(660, base + 0.1, 0.15, 'sine', 0.1);
  }

  let firstInteractionBound = false;
  function onFirstInteraction() {
    if (!ctx) init();
    resumeCtx();
    refreshEnabled();
    if (firstInteractionBound) {
      document.removeEventListener('click', onFirstInteraction, { capture: true });
      document.removeEventListener('keydown', onFirstInteraction, { capture: true });
      firstInteractionBound = false;
    }
  }

  if (!firstInteractionBound) {
    document.addEventListener('click', onFirstInteraction, { capture: true, once: true });
    document.addEventListener('keydown', onFirstInteraction, { capture: true, once: true });
    firstInteractionBound = true;
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) suspendCtx();
    else if (enabled) resumeCtx();
  });

  init();

  return {
    get enabled() { return enabled; },
    toggle,
    isEnabled,
    refreshEnabled,
    resume: resumeCtx,
    suspend: suspendCtx,
    clear: clearScheduledTimers,
    playClick,
    playEarn,
    playEvent,
    playAchievement,
    playNotify,
    init,
  };
})();
