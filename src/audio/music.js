// Müzik: az ve seyrek. Geniş synth akorları, çanlar, gerilimde alçak bir drone.
// assets/audio/music/ambient.* varsa sentez akorların yerine o döngü çalar.
import { audio } from './engine.js';

const CHORDS = [
  [73.42, 110, 174.61, 329.63],
  [58.27, 87.31, 146.83, 220],
  [49, 73.42, 116.54, 220],
  [55, 82.41, 146.83, 164.81],
  [55, 82.41, 138.59, 164.81],
];
const BELLS = [587.33, 698.46, 880, 1046.5, 1174.66, 783.99];

function pad(fs, amp = 1, bright = 1, dur = 13.5) {
  const ctx = audio.ctx, t = ctx.currentTime + 0.05;
  const flt = ctx.createBiquadFilter(); flt.type = 'lowpass'; flt.Q.value = 2.5;
  flt.frequency.setValueAtTime(220, t);
  flt.frequency.linearRampToValueAtTime(1100 * bright, t + dur * 0.28);
  flt.frequency.linearRampToValueAtTime(520 * bright, t + dur * 0.66);
  flt.frequency.linearRampToValueAtTime(260, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.045 * amp, t + dur * 0.24);
  g.gain.linearRampToValueAtTime(0.034 * amp, t + dur * 0.6);
  g.gain.linearRampToValueAtTime(0, t + dur);
  flt.connect(g); g.connect(audio.music);
  const vib = ctx.createOscillator(); vib.frequency.value = 5.1;
  const vg = ctx.createGain(); vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(3.5, t + 4);
  vib.connect(vg); vib.start(t); vib.stop(t + dur + 0.5);
  fs.forEach((f, i) => {
    for (const dt of [-8, 6]) {
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = dt;
      vg.connect(o.detune);
      const og = ctx.createGain(); og.gain.value = i === 0 ? 0.9 : 0.55;
      o.connect(og); og.connect(flt); o.start(t); o.stop(t + dur + 0.5);
    }
  });
}

function bell(f, v = 0.025) {
  const ctx = audio.ctx, t = ctx.currentTime + 0.02;
  const c = ctx.createOscillator(); c.frequency.value = f;
  const m = ctx.createOscillator(); m.frequency.value = f * 2.76;
  const mg = ctx.createGain(); mg.gain.setValueAtTime(f * 2.2, t); mg.gain.exponentialRampToValueAtTime(1, t + 3);
  m.connect(mg); mg.connect(c.frequency);
  const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + 6);
  c.connect(g); g.connect(audio.music); g.connect(audio.delay);
  c.start(t); m.start(t); c.stop(t + 6.2); m.stop(t + 6.2);
}

function drone(dur = 14) {
  const ctx = audio.ctx, t = ctx.currentTime;
  const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(90, t); f.frequency.linearRampToValueAtTime(260, t + dur * 0.3);
  const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.1, t + 3); g.gain.linearRampToValueAtTime(0.07, t + dur * 0.6); g.gain.linearRampToValueAtTime(0, t + dur);
  f.connect(g); g.connect(audio.music);
  for (const fr of [36.71, 36.95, 55, 73.9]) {
    const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = fr; o.connect(f); o.start(t); o.stop(t + dur + 0.5);
  }
}

export class Music {
  constructor() { this.mood = 'silent'; this.timer = null; this.bellTimer = null; this.i = 0; this.file = null; }

  async start() {
    if (!audio.ready) return;
    const buf = await audio.load('music', 'ambient');
    if (buf) { this.file = audio.playBuffer(buf, audio.music, { loop: true, gain: 0.0 }); }
    this.setMood('calm');
  }

  setMood(mood) {
    if (!audio.ready || mood === this.mood) return;
    this.mood = mood;
    clearTimeout(this.timer); clearTimeout(this.bellTimer);
    if (this.file) this.file.gain.gain.setTargetAtTime(mood === 'silent' ? 0 : mood === 'tense' ? 0.5 : 0.8, audio.now, 2);
    if (mood === 'silent' || this.file) return;
    const every = mood === 'tense' ? 16000 : 26000;
    const loop = () => {
      if (mood === 'tense') { drone(12); if (Math.random() < 0.5) bell(BELLS[0] * 0.5, 0.02); }
      else pad(CHORDS[this.i++ % CHORDS.length], 0.8);
      this.timer = setTimeout(loop, every + Math.random() * 8000);
    };
    this.timer = setTimeout(loop, 1500);
    const bl = () => { bell(BELLS[Math.random() * BELLS.length | 0], 0.018); this.bellTimer = setTimeout(bl, 14000 + Math.random() * 16000); };
    this.bellTimer = setTimeout(bl, 9000);
  }

  // Tek seferlik vurgular
  sting(kind) {
    if (!audio.ready) return;
    if (kind === 'title') { pad([73.42, 110, 174.61, 220, 329.63], 1, 1.2, 16); bell(1174.66, 0.02); }
    if (kind === 'decision') { pad([146.83, 196, 220, 293.66], 0.9, 1.1, 12); bell(880, 0.02); }
    if (kind === 'dread') { drone(14); bell(622.25, 0.03); setTimeout(() => bell(880, 0.025), 900); }
    if (kind === 'resolve') { pad([146.83, 220, 277.18, 369.99, 440], 1, 1.4, 14); bell(1174.66, 0.025); }
  }
}

export const music = new Music();
