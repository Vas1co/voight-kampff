// Web Audio motoru: veri yolları (müzik, efekt, ortam, ses), yankı, gecikme,
// dosya önbelleği. Bağlam yalnızca kullanıcı "Başla"ya bastığında kurulur.
import { assets } from '../core/assets.js';

function impulse(ctx, sec, decay) {
  const L = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(2, L, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = b.getChannelData(c);
    for (let i = 0; i < L; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / L, decay);
  }
  return b;
}

function noise(ctx, sec, brown) {
  const b = ctx.createBuffer(1, Math.floor(ctx.sampleRate * sec), ctx.sampleRate), d = b.getChannelData(0);
  let l = 0;
  for (let i = 0; i < d.length; i++) {
    const w = Math.random() * 2 - 1;
    if (brown) { l = (l + 0.02 * w) / 1.02; d[i] = l * 3.5; } else d[i] = w;
  }
  return b;
}

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.cache = new Map();
    this.settings = null;
  }

  get ready() { return !!this.ctx; }
  get now() { return this.ctx ? this.ctx.currentTime : 0; }

  start(settings) {
    if (this.ctx) { this.resume(); return true; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try { this.ctx = new AC(); } catch { return false; }
    const ctx = this.ctx;
    this.master = ctx.createGain(); this.master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.knee.value = 10; comp.ratio.value = 3; comp.attack.value = 0.01; comp.release.value = 0.3;
    this.master.connect(comp); comp.connect(ctx.destination);

    this.reverb = ctx.createConvolver(); this.reverb.buffer = impulse(ctx, 4.5, 2.6);
    const revOut = ctx.createGain(); revOut.gain.value = 0.7;
    this.reverb.connect(revOut); revOut.connect(this.master);

    this.delay = ctx.createDelay(2); this.delay.delayTime.value = 0.46;
    const fb = ctx.createGain(); fb.gain.value = 0.36;
    const dlf = ctx.createBiquadFilter(); dlf.type = 'lowpass'; dlf.frequency.value = 2200;
    this.delay.connect(dlf); dlf.connect(fb); fb.connect(this.delay);
    const dOut = ctx.createGain(); dOut.gain.value = 0.45; dlf.connect(dOut); dOut.connect(this.master); dOut.connect(this.reverb);

    const bus = (wet) => {
      const g = ctx.createGain(); g.connect(this.master);
      const s = ctx.createGain(); s.gain.value = wet; g.connect(s); s.connect(this.reverb);
      return g;
    };
    this.music = bus(0.9);
    this.sfx = bus(0.22);
    this.amb = bus(0.08);
    this.voice = bus(0.12);
    this.white = noise(ctx, 3, false);
    this.brown = noise(ctx, 4, true);
    this.apply(settings);
    this.master.gain.setTargetAtTime(1, ctx.currentTime, 0.4);
    return true;
  }

  resume() { if (this.ctx?.state === 'suspended') this.ctx.resume(); }

  apply(s) {
    this.settings = s;
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const m = s.muted ? 0 : s.master;
    this.master.gain.setTargetAtTime(m, t, 0.1);
    this.music.gain.setTargetAtTime(s.music, t, 0.1);
    this.sfx.gain.setTargetAtTime(s.sfx, t, 0.1);
    this.amb.gain.setTargetAtTime(s.ambience, t, 0.1);
    this.voice.gain.setTargetAtTime(s.voice, t, 0.1);
  }

  // Asset dosyasını çöz ve önbellekte tut. Yoksa null.
  async load(dir, name) {
    const url = assets.audio(dir, name);
    if (!url || !this.ctx) return null;
    if (this.cache.has(url)) return this.cache.get(url);
    const p = fetch(url).then((r) => r.arrayBuffer()).then((ab) => this.ctx.decodeAudioData(ab)).catch(() => null);
    this.cache.set(url, p);
    return p;
  }

  has(dir, name) { return !!assets.audio(dir, name); }

  playBuffer(buf, out, { gain = 1, rate = 1, loop = false, when = 0 } = {}) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = buf; src.loop = loop; src.playbackRate.value = rate;
    const g = ctx.createGain(); g.gain.value = gain;
    src.connect(g); g.connect(out);
    src.start(ctx.currentTime + when);
    return { src, gain: g, stop: (fade = 0.05) => { const t = ctx.currentTime; g.gain.setTargetAtTime(0, t, fade); src.stop(t + fade * 6); } };
  }

  loopNoise(buf, out) {
    const s = this.ctx.createBufferSource();
    s.buffer = buf; s.loop = true; s.start(0, Math.random() * buf.duration);
    if (out) s.connect(out);
    return s;
  }
}

export const audio = new AudioEngine();
