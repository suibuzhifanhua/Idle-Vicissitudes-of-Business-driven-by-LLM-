// ==================================================
// audio.js — Web Audio API 音效系统（无需音频文件）
// ==================================================

window.AudioFX = (() => {
  let ctx = null;
  let enabled = true;

  function init() {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      // 加载音效开关
      const saved = Storage.get('shfc_audio_enabled');
      if (saved !== null) enabled = saved === 'true';
    } catch(e) {
      ctx = null;
    }
  }

  function resumeCtx() {
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  function toggle() {
    enabled = !enabled;
    try { Storage.set('shfc_audio_enabled', String(enabled)); } catch(e) {}
    return enabled;
  }

  function isEnabled() { return enabled; }

  // 基础音调
  function playTone(freq, duration, type, vol, rampDown) {
    if (!enabled || !ctx) return;
    resumeCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(vol || 0.15, ctx.currentTime);
    if (rampDown) {
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    } else {
      gain.gain.setValueAtTime(0, ctx.currentTime + duration);
    }
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }

  // 点击音效
  function playClick() {
    playTone(800, 0.08, 'square', 0.08, true);
  }

  // 赚钱音效
  function playEarn() {
    if (!enabled || !ctx) return;
    resumeCtx();
    const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
      gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.1);
      osc.stop(ctx.currentTime + i * 0.1 + 0.2);
    });
  }

  // 事件触发音效
  function playEvent() {
    playTone(660, 0.15, 'triangle', 0.15, true);
    setTimeout(() => playTone(880, 0.12, 'triangle', 0.12, true), 100);
  }

  // 成就解锁音效
  function playAchievement() {
    if (!enabled || !ctx) return;
    resumeCtx();
    const notes = [523, 659, 784, 1047, 784, 1047]; // 上行胜利旋律
    const durations = [0.15, 0.15, 0.15, 0.3, 0.15, 0.5];
    let t = 0;
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + t);
      gain.gain.setValueAtTime(0.18, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.3);
      t += durations[i];
    });
  }

  // 通知音
  function playNotify() {
    playTone(440, 0.1, 'sine', 0.1, true);
    setTimeout(() => playTone(660, 0.15, 'sine', 0.1, true), 100);
  }

  // 初始化
  init();

  return {
    get enabled() { return enabled; },
    toggle, isEnabled,
    playClick, playEarn, playEvent, playAchievement, playNotify,
    init,
  };
})();
