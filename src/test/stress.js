// Deneğin gerginliği. Fazla bastırılırsa sorgu kopar.
export const STRESS = { warn: 60, danger: 85, break: 100 };

export class Stress {
  constructor(cfg) {
    this.value = cfg.start ?? 15;
    this.vol = cfg.volatility ?? 1;
    this.pressExtra = cfg.pressExtra ?? 12;
    this.breakKind = cfg.break ?? 'abort';
    this.warned = false;
  }
  // Bir alt soru sonrası artış.
  afterQuestion(provocation, pressed) {
    this.value += provocation * this.vol * 7 + (pressed ? this.pressExtra : 0);
    if (provocation < 0.3 && !pressed) this.value -= 3;
    this.value = Math.max(0, this.value);
  }
  pause() { this.value = Math.max(0, this.value - 30); }
  update(dt, measuring) {
    if (!measuring) this.value = Math.max(0, this.value - dt * 0.12);
  }
  get level() {
    if (this.value >= STRESS.break) return 'break';
    if (this.value >= STRESS.danger) return 'danger';
    if (this.value >= STRESS.warn) return 'warn';
    return 'ok';
  }
  get norm() { return Math.min(1, this.value / STRESS.break); }
}
