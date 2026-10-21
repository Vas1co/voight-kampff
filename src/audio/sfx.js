// Efektler. Her ses sentezlenir; assets/audio/sfx/<ad>.(ogg|mp3|wav) varsa dosya çalınır.
import { audio } from './engine.js';

const A = () => audio.ctx;

function tone(f, d, v, type = 'sine', when = 0, out) {
  const ctx = A(), t = ctx.currentTime + when;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.value = f;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(v, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g); g.connect(out ?? audio.sfx);
  o.start(t); o.stop(t + d + 0.05);
  return o;
}

function noise(d, v, type, freq, q = 0.7, when = 0, { attack = 0.002, buf, out, sweep } = {}) {
  const ctx = A(), t = ctx.currentTime + when;
  const s = ctx.createBufferSource(); s.buffer = buf ?? audio.white;
  const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
  if (sweep) f.frequency.exponentialRampToValueAtTime(sweep, t + d);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(v, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  s.connect(f); f.connect(g); g.connect(out ?? audio.sfx);
  s.start(t, Math.random() * 2); s.stop(t + d + 0.05);
}

const synth = {
  relay() { noise(0.018, 0.2, 'highpass', 1800); tone(140, 0.03, 0.03, 'square'); noise(0.012, 0.1, 'bandpass', 4200, 2, 0.05); },
  relays({ n = 5 } = {}) { for (let i = 0; i < n; i++) { noise(0.012, 0.09 + Math.random() * 0.05, 'bandpass', 3000 + Math.random() * 1500, 2, i * (0.05 + Math.random() * 0.05)); } },
  switchOn() { noise(0.05, 0.35, 'lowpass', 900, 0.8); tone(70, 0.12, 0.12, 'triangle'); noise(0.02, 0.2, 'highpass', 2500, 1, 0.03); synth.relays({ n: 4 }); },
  switchOff() { noise(0.05, 0.3, 'lowpass', 700, 0.8); tone(60, 0.1, 0.1, 'triangle'); },
  key() { noise(0.02, 0.14, 'bandpass', 2400, 1.5); tone(220, 0.03, 0.02, 'square'); },
  button() { noise(0.03, 0.22, 'lowpass', 1200, 0.9); tone(110, 0.05, 0.05, 'triangle'); },
  dialTick() { noise(0.008, 0.07, 'bandpass', 5200, 4); },
  crtOn() {
    noise(0.08, 0.2, 'lowpass', 400, 0.7);
    const ctx = A(), t = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(3000, t); o.frequency.exponentialRampToValueAtTime(7800, t + 2.2);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.006, t + 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + 3);
    o.connect(g); g.connect(audio.sfx); o.start(t); o.stop(t + 3.1);
    noise(1.2, 0.04, 'bandpass', 2500, 0.5, 0.1, { attack: 0.3 });
  },
  crtOff() { noise(0.25, 0.12, 'bandpass', 1500, 0.6); tone(90, 0.3, 0.06, 'sine'); },
  static({ d = 0.25 } = {}) { noise(d, 0.05, 'bandpass', 3200, 0.4); },
  glitch() { for (let i = 0; i < 4; i++) noise(0.03, 0.05, 'bandpass', 1500 + Math.random() * 3000, 1, i * 0.04); },
  chirp() { tone(2350, 0.05, 0.016); tone(1760, 0.06, 0.016, 'sine', 0.08); },
  bellows() { noise(1.4, 0.07, 'lowpass', 500, 0.6, 0, { attack: 0.5, buf: audio.brown }); noise(1.2, 0.02, 'bandpass', 1800, 0.4, 0.1, { attack: 0.4, sweep: 900 }); tone(46, 1.2, 0.02, 'sine'); },
  heartbeat({ v = 1 } = {}) { tone(52, 0.16, 0.11 * v, 'sine'); tone(44, 0.18, 0.08 * v, 'sine', 0.17); },
  cassetteIn() {
    noise(0.04, 0.35, 'lowpass', 1500, 0.8); tone(95, 0.08, 0.1, 'square');
    noise(0.03, 0.25, 'bandpass', 2200, 2, 0.12);
    noise(0.6, 0.03, 'bandpass', 600, 0.8, 0.18, { attack: 0.2 });
  },
  cassetteStop() { noise(0.04, 0.3, 'lowpass', 1300, 0.8); tone(85, 0.06, 0.08, 'square'); },
  typeKey() { noise(0.02, 0.18 + Math.random() * 0.08, 'bandpass', 1800 + Math.random() * 900, 1.2); tone(160 + Math.random() * 40, 0.025, 0.03, 'square'); },
  typeLine() { for (let i = 0; i < 6 + (Math.random() * 6 | 0); i++) { const w = i * (0.05 + Math.random() * 0.04); noise(0.018, 0.16, 'bandpass', 1700 + Math.random() * 900, 1.2, w); } noise(0.12, 0.08, 'bandpass', 3000, 0.5, 0.8, { sweep: 1200 }); tone(1300, 0.25, 0.012, 'sine', 0.85); },
  stamp() { noise(0.09, 0.6, 'lowpass', 500, 0.8); tone(58, 0.25, 0.25, 'sine'); noise(0.03, 0.2, 'bandpass', 2800, 1, 0.01); },
  paper() { noise(0.35, 0.09, 'bandpass', 3800, 0.4, 0, { attack: 0.05, sweep: 2200 }); noise(0.2, 0.05, 'highpass', 5000, 0.4, 0.15); },
  warn() { tone(880, 0.12, 0.018, 'square'); tone(880, 0.12, 0.018, 'square', 0.24); },
  anomaly() { tone(1320, 0.08, 0.012, 'square'); tone(990, 0.08, 0.012, 'square', 0.1); tone(1320, 0.08, 0.012, 'square', 0.2); },
  alarm() { for (let i = 0; i < 3; i++) { tone(68, 0.5, 0.05, 'sawtooth', i * 0.55); tone(71, 0.5, 0.04, 'sawtooth', i * 0.55); } },
  impact() { noise(0.6, 0.9, 'lowpass', 300, 0.7); tone(40, 0.6, 0.4, 'sine'); noise(0.4, 0.4, 'bandpass', 1200, 0.6, 0.05); noise(0.8, 0.15, 'highpass', 3000, 0.4, 0.1); },
  chair() { noise(0.7, 0.12, 'bandpass', 700, 3, 0, { attack: 0.08, sweep: 400 }); },
  pageTurn() { synth.paper(); },
  sample() { synth.relays({ n: 6 }); synth.chirp(); },
};

export const sfx = {
  async play(name, opts = {}) {
    if (!audio.ready) return;
    if (audio.has('sfx', name)) {
      const buf = await audio.load('sfx', name);
      if (buf) { audio.playBuffer(buf, audio.sfx, { gain: opts.gain ?? 1, rate: opts.rate ?? 1 }); return; }
    }
    synth[name]?.(opts);
  },
};
