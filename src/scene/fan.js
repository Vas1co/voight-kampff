// Tavan pervanesi: ilk prototipteki çizim. Uzun ince beş kanat, alttan basık
// elips yörüngede döner; hareket bulanıklığı için arkada soluk kopyalar.
// Her karede tuvale çizilir ve pencerenin önünde duran bir düzleme doku olur.
import * as THREE from 'three';
import { mk } from './paint.js';

const W = 1024, H = 340;
const FX = 512, FY = 220;          // göbek
const FL = 470, SQ = 0.17, BW = 30; // kanat boyu, basıklık, kanat genişliği
const TAU = Math.PI * 2;

export class CeilingFan {
  constructor({ width = 3.3 } = {}) {
    this.canvas = mk(W, H);
    this.x = this.canvas.getContext('2d');
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    const h = width * (H / W);
    this.mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(width, h),
      new THREE.MeshBasicMaterial({ map: this.texture, transparent: true, depthWrite: false }),
    );
    // göbeğin düzlem içindeki dikey konumu (merkeze göre)
    this.hubOffset = (0.5 - FY / H) * h;
  }

  // Göbek dünya konumuna yerleştir.
  place(x, y, z) { this.mesh.position.set(x, y - this.hubOffset, z); }

  blade(a) {
    const x = this.x, c = Math.cos(a), s = Math.sin(a), px = -s * BW, py = c * BW * SQ;
    const x0 = FX + c * 58, y0 = FY + s * 58 * SQ, x1 = FX + c * FL, y1 = FY + s * FL * SQ;
    x.beginPath();
    x.moveTo(x0 + px * 0.35, y0 + py * 0.35 - 2);
    x.lineTo(x1 + px, y1 + py - 3);
    x.lineTo(x1 - px * 0.85, y1 - py * 0.85 + 3);
    x.lineTo(x0 - px * 0.35, y0 - py * 0.35 + 2);
    x.closePath();
    x.fill();
  }

  draw(angle) {
    const x = this.x;
    x.clearRect(0, 0, W, H);
    // tavana uzanan çubuk
    x.fillStyle = '#0a1011';
    x.fillRect(FX - 4, 0, 8, FY - 20);
    // kanatlar + hareket bulanıklığı
    x.fillStyle = '#0b1112';
    for (let k = 3; k >= 0; k--) {
      x.globalAlpha = k ? 0.16 / k : 1;
      for (let b = 0; b < 5; b++) this.blade(angle - k * 0.03 + (b * TAU) / 5);
    }
    x.globalAlpha = 1;
    // pirinç motor gövdesi
    const g = x.createLinearGradient(FX - 62, 0, FX + 62, 0);
    g.addColorStop(0, '#140f09'); g.addColorStop(0.35, '#5b4428'); g.addColorStop(0.55, '#7a5c36'); g.addColorStop(1, '#120d08');
    x.fillStyle = g;
    x.fillRect(FX - 62, FY - 18, 124, 24);
    x.beginPath(); x.ellipse(FX, FY + 6, 62, 10, 0, 0, TAU); x.fillStyle = '#0c0a07'; x.fill();
    x.beginPath(); x.ellipse(FX, FY - 18, 62, 9, 0, 0, TAU); x.fillStyle = '#3b2d1b'; x.fill();
    x.fillStyle = '#1a140d';
    x.fillRect(FX - 14, FY - 34, 28, 16);
    this.texture.needsUpdate = true;
  }
}
