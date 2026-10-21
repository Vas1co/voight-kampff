// Bir deneğin sorgu oturumu: sayaç, okumalar, temel, stres, kalibrasyon, notlar.
import { rng as makeRng } from '../core/rng.js';
import { Calibration } from './calibration.js';
import { Stress } from './stress.js';
import { generateReading } from './readings.js';
import { computeBaseline } from './baseline.js';
import { crossReference } from './crossref.js';
import { questions } from './questions.js';

export class Session {
  constructor(subject, seed = Date.now() & 0xffff) {
    this.subject = subject;
    this.rng = makeRng(seed);
    this.calib = new Calibration(subject.machine ?? {}, this.rng);
    this.stress = new Stress(subject.stress ?? {});
    this.baselineReadings = [];
    this.baseline = null;
    this.readings = [];
    this.count = 0;
    this.usedCards = new Set();
    this.recording = false;
    this.power = false;
    this.broken = false;
    this.decision = null;
    this.notes = {};
  }

  get target() { return this.subject.targetQuestions; }
  get minQuestions() { return this.subject.minQuestions; }
  get canDecide() { return this.broken || this.count >= this.minQuestions; }
  get cards() { return this.subject.cards.map((id) => questions.card(id)); }

  measure(qid, { pressed = false } = {}) {
    const q = questions.sub(qid);
    const reading = generateReading({
      subject: this.subject, q, pressed,
      stress: this.stress.value, calib: this.calib, rng: this.rng, baseline: this.baseline,
    });
    if (q.theme === 'notr') {
      reading.n = `T${this.baselineReadings.length + 1}`;
      this.baselineReadings.push(reading);
    } else {
      this.count += 1;
      reading.n = this.count;
      this.readings.push(reading);
      this.stress.afterQuestion(q.provocation, pressed);
    }
    return reading;
  }

  finishBaseline() {
    this.baseline = computeBaseline(this.baselineReadings);
    return this.baseline;
  }

  crossref() { return crossReference(this.readings); }

  update(dt, measuring) {
    this.calib.update(dt);
    this.stress.update(dt, measuring);
  }
}
