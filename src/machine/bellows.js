// Körük: makinenin üstünde nefes alır. Her soruda havayı çeker ve
// parçacık göstergesini besler. Çekiş sırasında yakındaki toz zerreleri
// emiş ağzına doğru akar (scene/dust.js bu durumu okur).
import * as THREE from 'three';
import { mk, rr, lg } from '../scene/paint.js';
import { damp } from '../core/rng.js';

export class Bellows {
  constructor() {
    this.canvas = mk(320, 300);
    this.x = this.canvas.getContext('2d');
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.ext = 0.25;      // 0: kapalı, 1: tam açık
    this.target = 0.25;
    this.t = 0;
    this.inhaleT = -1;
    this.active = false;  // makine açık mı
    this.reduce = false;
    this.onBreath = null; // ses için
  }

  // Hızlı genişleme (hava çekme) ardından yavaş sönme.
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
      this.target = k < 1.4 ? 0.25 + 0.7 * Math.sin((k / 1.4) * Math.PI / 2) : 0.95 - Math.min(1, (k - 1.4) / 2.6) * 0.7;
      if (k > 4) this.inhaleT = -1;
    } else if (this.active) {
      const amp = this.reduce ? 0.03 : 0.12;
      this.target = 0.28 + amp * (0.5 + 0.5 * Math.sin((this.t * Math.PI * 2) / 5.5));
    } else {
      this.target = 0.18;
    }
    this.ext = damp(this.ext, this.target, 5, dt);
    this.draw();
  }

  draw() {
    const x = this.x, W = 320, H = 300;
    x.clearRect(0, 0, W, H);
    const base = H - 8, h = 70 + this.ext * 190, top = base - h, n = 7, p = (h - 22) / n;
    // körük katları
    for (let i = 0; i < n; i++) {
      const y = base - (i + 1) * p;
      const wide = i % 2 === 0;
      const w0 = wide ? 250 : 216, w1 = wide ? 216 : 250;
      x.fillStyle = lg(x, (W - 250) / 2, 0, (W + 250) / 2, 0, [[0, '#0b1011'], [0.35, '#2e3a3c'], [0.55, '#3a4749'], [1, '#0b1011']]);
      x.beginPath();
      x.moveTo((W - w0) / 2, y + p); x.lineTo((W + w0) / 2, y + p);
      x.lineTo((W + w1) / 2, y); x.lineTo((W - w1) / 2, y);
      x.closePath(); x.fill();
      x.fillStyle = wide ? 'rgba(200,230,225,0.10)' : 'rgba(0,0,0,0.4)';
      x.fillRect((W - w1) / 2, y, w1, 1.5);
    }
    // üst plaka ve emiş ızgarası
    x.fillStyle = lg(x, 0, top, 0, top + 22, [[0, '#5c6b6d'], [1, '#232c2e']]);
    rr(x, 20, top, W - 40, 22, 5); x.fill();
    x.fillStyle = '#060909';
    for (let i = 0; i < 9; i++) rr(x, 92 + i * 15, top + 6, 8, 10, 2), x.fill();
    // taban
    x.fillStyle = '#1c2425';
    rr(x, 14, base - 4, W - 28, 12, 3); x.fill();
    this.texture.needsUpdate = true;
  }
}
