// Kalibrasyon kayması. Makine güvenilmezdir:
// - drift: zamanla rastgele yürüyen yanlılık (göz bebeği/kızarma/nabız birimlerinde, % cinsinden)
// - hidden: kadran iğnesinin hiç göstermediği gizli bileşen → tam sıfırlama imkânsız
// - dial: oyuncunun kadranla uyguladığı düzeltme
import { clamp } from '../core/rng.js';

export class Calibration {
  constructor(cfg, rng) {
    this.rng = rng;
    this.rate = cfg.driftRate ?? 0.5;
    this.drift = (rng.chance(0.5) ? 1 : -1) * (cfg.initialDrift ?? 3);
    this.hiddenSd = cfg.hiddenDrift ?? 0.8;
    this.hidden = rng.gauss(0, this.hiddenSd);
    this.dial = 0;
    this.heat = 0;     // ARA VER ve uzun ölçümler makineyi ısıtır
    this.jitter = 0;
    this.enabled = false;
  }

  update(dt) {
    if (!this.enabled) return;
    const g = this.rng.gauss(0, 1);
    // Ornstein–Uhlenbeck benzeri: yavaşça sıfıra döner, ama ısı yanlılık ekler
    this.drift += (-0.004 * this.drift + this.heat * 0.12) * dt + g * this.rate * Math.sqrt(dt) * 0.6;
    this.hidden += (-0.02 * this.hidden) * dt + this.rng.gauss(0, this.hiddenSd * 0.08) * Math.sqrt(dt);
    this.heat = Math.max(0, this.heat - dt * 0.004);
    this.jitter += (this.rng.gauss(0, 0.6) - this.jitter) * Math.min(1, dt * 8);
    this.drift = clamp(this.drift, -24, 24);
  }

  // Gerçek hata (okumalara eklenir; oyuncu göremez)
  error() { return this.drift + this.hidden - this.dial; }

  // Kadran iğnesinin gösterdiği: görünür kısım + titreşim. −1..1 aralığına ölçekli.
  needle() { return clamp(((this.drift - this.dial) * 0.92 + this.jitter) / 12, -1, 1); }

  setDial(v) { this.dial = clamp(v, -24, 24); }
  nudge(d) { this.setDial(this.dial + d); }
  kick(amount) { this.drift = clamp(this.drift + amount, -24, 24); }
}
