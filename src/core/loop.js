// requestAnimationFrame döngüsü. dt saniye cinsinden, takılmalara karşı sınırlı.
export class Loop {
  constructor() {
    this.subs = [];
    this.time = 0;
    this.last = 0;
    this.running = false;
    this.tick = this.tick.bind(this);
  }
  add(fn, order = 0) {
    this.subs.push({ fn, order });
    this.subs.sort((a, b) => a.order - b.order);
    return () => { this.subs = this.subs.filter((s) => s.fn !== fn); };
  }
  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    requestAnimationFrame(this.tick);
  }
  tick(now) {
    if (!this.running) return;
    const dt = Math.min(0.05, Math.max(0, (now - this.last) / 1000));
    this.last = now;
    this.time += dt;
    for (const s of this.subs) s.fn(dt, this.time, now);
    requestAnimationFrame(this.tick);
  }
}
