// Yelpaze körük: orta modülün üstünde, sağda bir menteşeden açılan üçgen körük.
// Plakalar menteşeden ışınsal çıkar, aralarında koyu körük kumaşı katlanır.
// Boştayken yavaşça nefes alır; her soruda hızla açılıp havayı çeker ve
// parçacık göstergesini besler. Çekiş sırasında yakındaki toz zerreleri emiş
// ağzına doğru akar (scene/particles.js bu durumu okur).
import * as THREE from 'three';
import { mk, lg, rg } from '../scene/paint.js';
import { damp } from '../core/rng.js';

const DEG = Math.PI / 180;
const PLATES = 9;

export class Bellows {
  constructor(w = 640, h = 350) {
    this.W = w; this.H = h;
    this.canvas = mk(w, h);
    this.x = this.canvas.getContext('2d');
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    // menteşe sağ altta; plaka boyu tuvale sığacak şekilde
    this.hx = w - 40; this.hy = h - 28;
    this.len = w - 100;
    this.minA = 7 * DEG; this.maxA = 34 * DEG;
    this.ext = 0.25;      // 0: kapalı, 1: tam açık
    this.target = 0.25;
    this.t = 0;
    this.inhaleT = -1;
    this.active = false;  // makine açık mı
    this.reduce = false;
    this.onBreath = null; // ses için
  }

  // Hızlı açılma (hava çekme) ardından yavaş kapanma.
  inhale() {
    this.inhaleT = 0;
    this.onBreath?.('in', 1.4);
  }

  get pulling() { return this.inhaleT >= 0 && this.inhaleT < 1.5; }

  update(dt) {
    this.t += dt;
    if (this.inhaleT >= 0) {
      this.inhaleT += dt;
      const k = this.inhaleT;
      this.target = k < 1.4 ? 0.25 + 0.75 * Math.sin((k / 1.4) * Math.PI / 2) : 1 - Math.min(1, (k - 1.4) / 2.6) * 0.75;
      if (k > 4) this.inhaleT = -1;
    } else if (this.active) {
      const amp = this.reduce ? 0.03 : 0.14;
      this.target = 0.22 + amp * (0.5 + 0.5 * Math.sin((this.t * Math.PI * 2) / 5.5));
    } else {
      this.target = 0.0;
    }
    this.ext = damp(this.ext, this.target, 5, dt);
    this.draw();
  }

  // a açısındaki, menteşeden r uzaklıktaki nokta (plakalar sola ve yukarı açılır)
  at(a, r) { return [this.hx - Math.cos(a) * r, this.hy - Math.sin(a) * r]; }

  draw() {
    const x = this.x, { W, H, len } = this;
    x.clearRect(0, 0, W, H);
    const open = this.minA + (this.maxA - this.minA) * this.ext;
    const ang = (i) => (open * i) / (PLATES - 1);

    // körük kumaşı: plakalar arası katlanan koyu yüzeyler
    for (let i = 0; i < PLATES - 1; i++) {
      const a0 = ang(i), a1 = ang(i + 1), am = (a0 + a1) / 2;
      const out = i % 2 === 0; // dışa / içe katlanan kıvrım
      const bulge = len * (out ? 1.02 : 0.93);
      const p0 = this.at(a0, len * 0.97), p1 = this.at(a1, len * 0.97), pm = this.at(am, bulge);
      const g = rg(x, this.hx, this.hy, 20, this.hx, this.hy, len, [[0, '#050606'], [0.7, out ? '#1a1c1d' : '#0d0e0f'], [1, out ? '#25282a' : '#101112']]);
      x.fillStyle = g;
      x.beginPath();
      x.moveTo(this.hx, this.hy);
      x.lineTo(p0[0], p0[1]); x.lineTo(pm[0], pm[1]); x.lineTo(p1[0], p1[1]);
      x.closePath(); x.fill();
      // kıvrım sırtı
      const q0 = this.at(am, 40), q1 = this.at(am, bulge - 4);
      x.strokeStyle = out ? 'rgba(170,180,182,0.22)' : 'rgba(0,0,0,0.6)';
      x.lineWidth = out ? 2 : 3;
      x.beginPath(); x.moveTo(q0[0], q0[1]); x.lineTo(q1[0], q1[1]); x.stroke();
    }

    // plakalar (alttan üste)
    for (let i = 0; i < PLATES; i++) {
      const a = ang(i), top = i === PLATES - 1, base = i === 0;
      const t0 = base ? 10 : top ? 10 : 5, t1 = base ? 14 : top ? 22 : 12;
      const [ax, ay] = this.at(a, 34), [bx, by] = this.at(a, len);
      const nx = -Math.sin(a), ny = Math.cos(a); // plakaya dik (aşağı doğru)
      x.fillStyle = lg(x, ax, ay - t1, ax, ay + t1, [[0, top ? '#55595b' : '#3d4143'], [0.5, '#232627'], [1, '#111213']]);
      x.beginPath();
      x.moveTo(ax - nx * t0, ay - ny * t0);
      x.lineTo(bx - nx * t1, by - ny * t1);
      x.quadraticCurveTo(bx - Math.cos(a) * t1 * 0.9, by - Math.sin(a) * t1 * 0.9, bx + nx * t1 * 0.6, by + ny * t1 * 0.6);
      x.lineTo(ax + nx * t0 * 0.6, ay + ny * t0 * 0.6);
      x.closePath(); x.fill();
      // üst kenar ışığı
      x.strokeStyle = top ? 'rgba(255,255,255,0.32)' : 'rgba(255,255,255,0.16)';
      x.lineWidth = 1.6;
      x.beginPath(); x.moveTo(ax - nx * t0, ay - ny * t0); x.lineTo(bx - nx * t1, by - ny * t1); x.stroke();
    }

    // üst plakada emiş ızgarası
    const a = open;
    for (let k = 0; k < 7; k++) {
      const [gx, gy] = this.at(a, len * (0.62 + k * 0.045));
      x.save(); x.translate(gx, gy); x.rotate(-a);
      x.fillStyle = '#040505';
      x.fillRect(-4, -14, 8, 10);
      x.restore();
    }

    // menteşe
    x.fillStyle = rg(x, this.hx - 8, this.hy - 8, 2, this.hx, this.hy, 32, [[0, '#6b6f70'], [0.6, '#2c2f30'], [1, '#121314']]);
    x.beginPath(); x.arc(this.hx, this.hy, 30, 0, Math.PI * 2); x.fill();
    x.strokeStyle = 'rgba(255,255,255,0.25)'; x.lineWidth = 2;
    x.beginPath(); x.arc(this.hx, this.hy, 22, Math.PI * 1.1, Math.PI * 1.9); x.stroke();
    x.fillStyle = '#0b0c0c';
    x.beginPath(); x.arc(this.hx, this.hy, 7, 0, Math.PI * 2); x.fill();
    this.texture.needsUpdate = true;
  }
}
