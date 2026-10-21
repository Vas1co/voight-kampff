// Canlı sinyal simülasyonu: göstergelerin gösterdiği ham değerler.
// Bir okuma örneklenirken hedefler zamanlanmış olarak değişir
// (göz bebeği gecikmesi, körük çekişi, cevap süresi).
import { damp, clamp } from '../core/rng.js';
import { deviation } from '../test/readings.js';

const RING = 256;
const ring = () => ({ a: new Float32Array(RING), i: 0, push(v) { this.a[this.i] = v; this.i = (this.i + 1) % RING; }, at(k) { return this.a[(this.i + k) % RING]; } });

export class Signals {
  constructor() {
    this.power = 0;
    this.status = 'off';          // off | warming | idle | sampling | bellows
    this.base = null;             // temel (makine)
    this.idle = { pupil: 3.4, blush: 22, pulse: 66, resp: 13, particles: 400 };
    this.cur = { ...this.idle };
    this.target = { ...this.idle };
    this.latency = null;          // son cevap süresi (sn)
    this.onset = null;            // son göz bebeği gecikmesi
    this.particles = null;        // son parçacık değeri (körükten sonra)
    this.anomaly = null; this.anomalyT = 0;
    this.particleHistory = [];
    this.respPhase = 0; this.pulsePhase = 0; this.beat = 0;
    this.traces = { resp: ring(), pulse: ring(), pupil: ring() };
    this.level = 0;
    this.events = [];
    this.clock = 0;
    this.sampleT = -1;
    this.stress = 0;
    this.noise = 1;
    this.onBeat = null;
  }

  setBaseline(base) { this.base = base; }

  // Denek otururken (ölçüm dışı) gösterilen değerler.
  setIdle(v) { Object.assign(this.idle, v); if (this.status !== 'sampling') Object.assign(this.target, this.idle); }

  at(delay, fn) { this.events.push({ t: this.clock + delay, fn }); }

  // Okumayı canlı olarak oynat. callbacks: onBellows, onPupil, onAnswerTime, onDone
  sample(reading, cb = {}) {
    this.events = [];
    this.status = 'bellows';
    this.sampleT = 0;
    this.latency = null; this.onset = null; this.particles = null;
    this.anomaly = null;
    const r = reading.raw;
    // solunum/nabız hemen tırmanmaya başlar (yumuşakça)
    this.at(0.4, () => { this.target.resp = r.resp; this.target.pulse = r.pulse; });
    this.at(1.6, () => {
      this.status = 'sampling';
      this.particles = r.particles;
      this.particleHistory.push(reading.dev ? reading.dev.particles : 0);
      if (this.particleHistory.length > 16) this.particleHistory.shift();
      cb.onBellowsDone?.();
    });
    this.at(reading.onset, () => { this.target.pupil = r.pupil; this.onset = reading.onset; cb.onPupil?.(); });
    this.at(reading.onset + 0.35, () => { this.target.blush = r.blush; });
    this.at(r.latency, () => { this.latency = r.latency; cb.onAnswer?.(); });
    if (reading.anomaly) this.at(1.2 + Math.random() * 2, () => { this.anomaly = reading.anomaly; this.anomalyT = 3.5; cb.onAnomaly?.(reading.anomaly); });
    const end = Math.max(3.4, reading.onset + 1.6, r.latency + 0.4);
    this.at(end, () => cb.onSettled?.());
  }

  // Ölçüm bitti: değerler yavaşça boşta değerlerine döner.
  release() {
    this.events = [];
    this.status = this.power > 0.5 ? 'idle' : 'off';
    Object.assign(this.target, this.idle);
    this.sampleT = -1;
  }

  update(dt) {
    this.clock += dt;
    if (this.events.length) {
      const due = this.events.filter((e) => e.t <= this.clock);
      this.events = this.events.filter((e) => e.t > this.clock);
      for (const e of due) e.fn();
    }
    if (this.sampleT >= 0) this.sampleT += dt;
    const c = this.cur, tg = this.target;
    c.resp = damp(c.resp, tg.resp, 0.9, dt);
    c.pulse = damp(c.pulse, tg.pulse, 1.1, dt);
    c.blush = damp(c.blush, tg.blush, 1.2, dt);
    c.pupil = damp(c.pupil, tg.pupil, 2.6, dt);
    c.particles = damp(c.particles, this.particles ?? tg.particles, 2, dt);
    if (this.anomalyT > 0) { this.anomalyT -= dt; if (this.anomalyT <= 0) this.anomaly = null; }

    // dalga biçimleri
    this.respPhase += dt * (c.resp / 60) * Math.PI * 2;
    const prevBeat = this.pulsePhase;
    this.pulsePhase += dt * (c.pulse / 60);
    if (Math.floor(this.pulsePhase) !== Math.floor(prevBeat)) this.onBeat?.();
    const n = this.noise;
    const respV = Math.sin(this.respPhase) * (0.6 + 0.4 * (c.resp - this.idle.resp + 4) / 8) + (Math.random() - 0.5) * 0.05 * n;
    const ph = this.pulsePhase % 1;
    let pulseV = 0;
    if (ph < 0.04) pulseV = ph / 0.04; else if (ph < 0.08) pulseV = 1 - (ph - 0.04) / 0.04 * 1.35; else if (ph < 0.12) pulseV = -0.35 + (ph - 0.08) / 0.04 * 0.35;
    else if (ph > 0.25 && ph < 0.4) pulseV = 0.18 * Math.sin((ph - 0.25) / 0.15 * Math.PI);
    pulseV += (Math.random() - 0.5) * 0.04 * n;
    this.traces.resp.push(this.power > 0.5 ? respV : 0);
    this.traces.pulse.push(this.power > 0.5 ? pulseV : 0);
    const dev = this.dev();
    this.traces.pupil.push(dev ? dev.pupil : 0);

    // LED seviyesi: uyarılma büyüklüğü
    let lv = 0.06 + Math.random() * 0.04;
    if (dev && this.status !== 'idle' && this.status !== 'off') {
      lv = Math.abs(dev.pupil) / 32 + Math.abs(dev.blush) / 55 + Math.max(0, dev.pulse) / 40 + (Math.random() - 0.5) * 0.08;
    } else if (dev) {
      lv = 0.08 + Math.abs(dev.pupil) / 60 + (Math.random() - 0.5) * 0.04;
    }
    this.level = damp(this.level, clamp(lv, 0, 1) * this.power, 8, dt);
  }

  dev() {
    if (!this.base) return null;
    return deviation({ ...this.cur, latency: this.latency ?? this.base.latency }, this.base);
  }
}
