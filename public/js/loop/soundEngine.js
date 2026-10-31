// Client Module: Procedural Web Audio API Skill, Combat, Boss & Crafting Sound Synthesizer
(function () {
  with (window.__POS_CTX__) {
  let audioCtx = null;
  window.__POS_CTX__.sfxMuted = localStorage.getItem('pos_sfx_muted') === '1';
  const lastSfxTime = {};

  function getAudioCtx() {
    if (window.__POS_CTX__.sfxMuted) return null;
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) audioCtx = new Ctx();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  // Unlock AudioContext on first user interaction
  window.addEventListener('pointerdown', () => getAudioCtx(), { once: true });
  window.addEventListener('keydown', () => getAudioCtx(), { once: true });

  function createNoiseBuffer(ctx, duration = 0.25) {
    const len = Math.floor(ctx.sampleRate * duration);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.45));
    }
    return buf;
  }

  function playSkillSfx(kind, sub = '') {
    const ctx = getAudioCtx();
    if (!ctx) return;

    const nowMs = performance.now();
    const minGap = kind === 'proj' ? 135 : kind === 'nova' ? 110 : kind === 'arc' ? 110 : 70;
    const key = `${kind}:${sub}`;
    if (nowMs - (lastSfxTime[key] || 0) < minGap) return;
    if (nowMs - (lastSfxTime._any || 0) < 42) return;
    lastSfxTime[key] = nowMs;
    lastSfxTime._any = nowMs;

    const t = ctx.currentTime;

    try {
      if (kind === 'level_up') {
        const notes = [440, 554.37, 659.25, 880];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, t + idx * 0.06);
          g.gain.setValueAtTime(0.14, t + idx * 0.06);
          g.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.06 + 0.32);
          osc.connect(g).connect(ctx.destination);
          osc.start(t + idx * 0.06);
          osc.stop(t + idx * 0.06 + 0.34);
        });
        return;
      }

      if (kind === 'craft') {
        [1180, 1760].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t + idx * 0.03);
          g.gain.setValueAtTime(0.12, t + idx * 0.03);
          g.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.03 + 0.16);
          osc.connect(g).connect(ctx.destination);
          osc.start(t + idx * 0.03);
          osc.stop(t + idx * 0.03 + 0.18);
        });
        return;
      }

      if (kind === 'boss_warn') {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(110, t);
        osc.frequency.exponentialRampToValueAtTime(72, t + 0.45);
        const flt = ctx.createBiquadFilter();
        flt.type = 'lowpass';
        flt.frequency.setValueAtTime(340, t);
        g.gain.setValueAtTime(0.16, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.48);
        osc.connect(flt).connect(g).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.5);
        return;
      }

      if (kind === 'arc' || sub === 'lightning') {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(920, t);
        osc.frequency.exponentialRampToValueAtTime(190, t + 0.11);
        g.gain.setValueAtTime(0.08, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        osc.connect(g).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.13);
        return;
      }

      if (sub === 'cold' || sub === 'ice_nova' || sub === 'glacial_cascade') {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1240, t);
        osc.frequency.exponentialRampToValueAtTime(520, t + 0.14);
        g.gain.setValueAtTime(0.09, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        osc.connect(g).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.16);
        return;
      }

      if (sub === 'cyclone' || sub === 'blade_vortex' || sub === 'bow') {
        const src = ctx.createBufferSource();
        src.buffer = createNoiseBuffer(ctx, 0.14);
        const flt = ctx.createBiquadFilter();
        flt.type = 'bandpass';
        flt.frequency.setValueAtTime(sub === 'bow' ? 1350 : 780, t);
        flt.frequency.exponentialRampToValueAtTime(320, t + 0.13);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.11, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
        src.connect(flt).connect(g).connect(ctx.destination);
        src.start(t);
        return;
      }

      // Default Fire / Slam / Nova punch
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(155, t);
      osc.frequency.exponentialRampToValueAtTime(42, t + 0.16);
      g.gain.setValueAtTime(0.13, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.17);
      osc.connect(g).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.18);
    } catch {}
  }

  function initSfxMuteButton() {
    const btn = document.getElementById('toggleSfxMuteBtn');
    if (!btn) return;
    const syncBtn = () => {
      btn.textContent = window.__POS_CTX__.sfxMuted ? '🔇 SFX OFF' : '🔊 SFX ON';
      btn.style.color = window.__POS_CTX__.sfxMuted ? '#868e96' : '#ffd43b';
    };
    syncBtn();
    btn.addEventListener('click', () => {
      window.__POS_CTX__.sfxMuted = !window.__POS_CTX__.sfxMuted;
      localStorage.setItem('pos_sfx_muted', window.__POS_CTX__.sfxMuted ? '1' : '0');
      syncBtn();
    });
  }
  initSfxMuteButton();

  Object.assign(window.__POS_CTX__, { playSkillSfx, initSfxMuteButton });
  }
})();
