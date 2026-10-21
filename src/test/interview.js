// Oyuncunun sorgusu: soru sırası, temel, okumalar ve sorgucunun kararı.
// Karar makineden değil, sorgucudan gelir: cevapların içeriği, gerçek tepki
// süreleri ve aynı duygusal çekirdeğe verilen cevapların tutarlılığı tartılır.
import { rng as makeRng } from '../core/rng.js';
import { Calibration } from './calibration.js';
import { questions } from './questions.js';
import { restSample, answerReading } from './readings.js';
import { computeBaseline } from './baseline.js';
import { crossReference } from './crossref.js';

export class Interview {
  constructor(subject, seed = Date.now() & 0xffff) {
    this.subject = subject;
    this.rng = makeRng(seed);
    this.calib = new Calibration(subject.machine ?? {}, this.rng);
    this.calib.enabled = true;
    this.list = questions.order(this.rng);
    this.rest = [];
    this.baseline = null;
    this.readings = [];
  }

  get total() { return this.list.length; }

  sampleRest() { this.rest.push(restSample({ subject: this.subject, calib: this.calib, rng: this.rng })); }
  finishBaseline() { this.baseline = computeBaseline(this.rest); return this.baseline; }

  answer(q, option, rt) {
    const r = answerReading({
      subject: this.subject, q, score: option ? option.score : null, rt,
      calib: this.calib, rng: this.rng, baseline: this.baseline,
    });
    r.n = this.readings.length + 1;
    r.option = option?.id ?? null;
    this.readings.push(r);
    return r;
  }

  crossref() { return crossReference(this.readings); }

  // Sorgucunun değerlendirmesi (oyuncuya yalnızca sonuç ve ham veri gösterilir).
  verdict() {
    const R = this.readings;
    const total = R.reduce((s, r) => s + (r.score ?? 0), 0);
    const odd = R.filter((r) => r.none || r.rt < 1.0).length;
    const inconsistent = this.crossref().filter((g) => {
      const s = g.list.map((r) => r.score ?? 0);
      return Math.max(...s) - Math.min(...s) >= 2;
    }).length;
    const eff = total - odd * 1.5 - inconsistent * 2;
    const max = R.length * 2;
    const kind = eff >= max * 0.68 ? 'human' : eff <= max * 0.36 ? 'replicant' : 'unsure';
    return { kind, total, odd, inconsistent };
  }

  update(dt) { this.calib.update(dt); }
}
