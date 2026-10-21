// Makro göz görüntüsü (prosedürel). CRT dokusu olarak her karede yeniden çizilir.
// Göz bebeği çapı milimetre olarak sürülür; sakkad, kırpma ve hippus (doğal
// titreşim) eklenir. Denek başına iris rengi ve tohum data/subjects/*.json'dan gelir.
import { mk, rr, seeded } from '../scene/paint.js';
import { clamp, lerp } from '../core/rng.js';

const IRIS_MM = 11.7;
const TAU = Math.PI * 2;

function makeIris(size, p, R) {
  const c = mk(size, size), x = c.getContext('2d'), Rr = size / 2, C = Rr;
  const pal = p.iris;
  let g = x.createRadialGradient(C, C, Rr * 0.1, C, C, Rr);
  [[0, pal[0]], [0.3, pal[1]], [0.5, pal[2]], [0.75, pal[3]], [1, pal[4]]].forEach(([o, cl]) => g.addColorStop(o, cl));
  x.fillStyle = g; x.beginPath(); x.arc(C, C, Rr, 0, TAU); x.fill();
  x.lineCap = 'round';
  for (let i = 0; i < 3200; i++) {
    const a = R() * TAU, r0 = Rr * (0.16 + R() * 0.2), r1 = Rr * (0.5 + R() * 0.48), tn = R();
    x.strokeStyle = tn < 0.35 ? `rgba(232,200,120,${0.08 + R() * 0.2})`
      : tn < 0.6 ? `rgba(160,172,92,${0.1 + R() * 0.2})`
      : tn < 0.86 ? `rgba(30,36,16,${0.12 + R() * 0.26})` : `rgba(250,232,172,${0.06 + R() * 0.14})`;
    x.lineWidth = (0.5 + R() * 1.6) * size / 600;
    x.beginPath();
    let aa = a;
    for (let k = 0; k <= 5; k++) {
      const r = r0 + (r1 - r0) * k / 5; aa += (R() - 0.5) * 0.025;
      const px = C + Math.cos(aa) * r, py = C + Math.sin(aa) * r;
      k ? x.lineTo(px, py) : x.moveTo(px, py);
    }
    x.stroke();
  }
  // kollaret halkası
  x.beginPath();
  for (let k = 0; k <= 180; k++) {
    const a = k / 180 * TAU, r = Rr * (0.41 + 0.035 * Math.sin(a * 9 + 1) + 0.02 * Math.sin(a * 23) + (R() - 0.5) * 0.02);
    const px = C + Math.cos(a) * r, py = C + Math.sin(a) * r;
    k ? x.lineTo(px, py) : x.moveTo(px, py);
  }
  x.closePath();
  x.strokeStyle = p.fleck + '73'; x.lineWidth = Rr * 0.024; x.stroke();
  // kriptler
  for (let i = 0; i < 60; i++) {
    const a = R() * TAU, r = Rr * (0.3 + R() * 0.36);
    x.save(); x.translate(C + Math.cos(a) * r, C + Math.sin(a) * r); x.rotate(a);
    x.fillStyle = `rgba(24,18,8,${0.22 + R() * 0.3})`;
    x.beginPath(); x.ellipse(0, 0, Rr * (0.02 + R() * 0.05), Rr * (0.008 + R() * 0.015), 0, 0, TAU); x.fill();
    x.restore();
  }
  g = x.createRadialGradient(C, C, Rr * 0.8, C, C, Rr);
  g.addColorStop(0, 'rgba(10,14,6,0)'); g.addColorStop(0.75, 'rgba(10,14,6,.55)'); g.addColorStop(1, 'rgba(10,14,6,.95)');
  x.fillStyle = g; x.beginPath(); x.arc(C, C, Rr, 0, TAU); x.fill();
  return c;
}

function makeSclera(w, h, R) {
  const c = mk(w, h), x = c.getContext('2d'), cx = w / 2, cy = h / 2;
  const g = x.createRadialGradient(cx, cy, h * 0.3, cx, cy, w * 0.62);
  g.addColorStop(0, '#ece4da'); g.addColorStop(0.45, '#d8c4b6'); g.addColorStop(1, '#9a6a5e');
  x.fillStyle = g; x.fillRect(0, 0, w, h);
  x.lineCap = 'round';
  const vein = (px, py, a, wid, len, depth) => {
    x.strokeStyle = `rgba(${150 + R() * 40 | 0},${30 + R() * 25 | 0},35,${0.2 + R() * 0.25})`;
    x.lineWidth = wid; x.beginPath(); x.moveTo(px, py);
    for (let i = 0; i < len; i++) {
      a += (R() - 0.5) * 0.5; px += Math.cos(a) * 6; py += Math.sin(a) * 6; x.lineTo(px, py);
      if (depth < 3 && R() < 0.07) { x.stroke(); vein(px, py, a + (R() - 0.5) * 1.6, wid * 0.6, len * 0.5 | 0, depth + 1); x.beginPath(); x.moveTo(px, py); }
    }
    x.stroke();
  };
  for (let i = 0; i < 34; i++) {
    const left = R() < 0.5;
    const px = left ? R() * w * 0.14 : w - R() * w * 0.14, py = cy + (R() - 0.5) * h * 0.5;
    vein(px, py, left ? (R() - 0.5) * 0.8 : Math.PI + (R() - 0.5) * 0.8, 1 + R() * 1.6, 18 + R() * 26 | 0, 0);
  }
  return c;
}

const qP = (A, C, B, u) => { const m = 1 - u; return [m * m * A[0] + 2 * m * u * C[0] + u * u * B[0], m * m * A[1] + 2 * m * u * C[1] + u * u * B[1]]; };
const qT = (A, C, B, u) => [2 * (1 - u) * (C[0] - A[0]) + 2 * u * (B[0] - C[0]), 2 * (1 - u) * (C[1] - A[1]) + 2 * u * (B[1] - C[1])];

export class Eye {
  constructor(params, { width = 640, height = 480 } = {}) {
    this.W = width; this.H = height;
    this.canvas = mk(width, height);
    this.x = this.canvas.getContext('2d');
    this.R = Math.round(height * 0.4);
    this.setSubject(params);
    this.pupilMM = 3.4; this.targetMM = 3.4; this.rate = 2.2;
    this.gx = 0; this.gy = 0; this.gxT = 0; this.gyT = 0; this.sacAt = 0;
    this.open = 1; this.blinkAt = 2.5; this.blinkT = -1;
    this.focus = 1; this.reduce = false; this.overlay = '';
    this.time = 0;
  }

  setSubject(p) {
    this.p = {
      seed: 7, iris: ['#5a3a14', '#b07a2c', '#9c8c3e', '#6c7b3a', '#1a2010'], fleck: '#ecce84',
      skin: ['#7d4b3c', '#3a2119'], blinkEvery: [3, 7], ...p,
    };
    const R = seeded(this.p.seed);
    this.rand = seeded(this.p.seed * 31 + 5);
    this.iris = makeIris(512, this.p, R);
    this.sclera = makeSclera(this.W + 60, this.H + 60, R);
    this.lash = Array.from({ length: 110 }, () => { const u = 0.12 + R() * 0.76; return { u, len: (26 + R() * 38) * (1 - Math.abs(u - 0.5) * 1.1), w: 1.4 + R() * 1.4 }; });
    this.llash = Array.from({ length: 36 }, () => ({ u: 0.2 + R() * 0.6, len: 8 + R() * 12, w: 1 + R() }));
  }

  // Göz bebeği hedefi (mm). rate: genişleme hızı (1/sn).
  setPupil(mm, rate = 2.2) { this.targetMM = mm; this.rate = rate; }
  snapPupil(mm) { this.pupilMM = this.targetMM = mm; }

  update(dt, measuring) {
    const R = this.rand;
    this.time += dt;
    const t = this.time;
    if (t > this.sacAt) {
      const amp = measuring ? 4 : 16;
      this.gxT = (R() - 0.5) * 2 * amp; this.gyT = (R() - 0.5) * amp;
      this.sacAt = t + 0.7 + R() * 2.6;
    }
    const ks = 1 - Math.pow(0.0005, dt);
    this.gx += (this.gxT - this.gx) * ks; this.gy += (this.gyT - this.gy) * ks;
    const hip = this.reduce ? 0 : 0.05 * Math.sin(t * 1.3) + 0.03 * Math.sin(t * 3.7 + 1);
    this.pupilMM += (this.targetMM + hip - this.pupilMM) * (1 - Math.exp(-this.rate * dt));
    if (!this.reduce) {
      if (this.blinkT < 0 && t > this.blinkAt) this.blinkT = 0;
      if (this.blinkT >= 0) {
        this.blinkT += dt;
        const p = this.blinkT / 0.17;
        this.open = p < 1 ? 1 - p : p < 2 ? p - 1 : 1;
        if (p >= 2) { this.open = 1; this.blinkT = -1; const [a, b] = this.p.blinkEvery; this.blinkAt = t + a + R() * (b - a); }
      }
    }
  }

  render() {
    const x = this.x, W = this.W, H = this.H, R = this.R;
    const cx = W / 2 + this.gx, cy = H / 2 + 8 + this.gy;
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = 1;
    x.drawImage(this.sclera, this.gx * 0.4 - 30, this.gy * 0.4 - 30);
    x.drawImage(this.iris, cx - R, cy - R, R * 2, R * 2);
    const pr = R * clamp(this.pupilMM / IRIS_MM, 0.12, 0.8);
    let g = x.createRadialGradient(cx, cy, pr * 0.85, cx, cy, pr * 1.22);
    g.addColorStop(0, 'rgba(8,5,3,1)'); g.addColorStop(0.5, 'rgba(48,28,10,.6)'); g.addColorStop(1, 'rgba(48,28,10,0)');
    x.fillStyle = g; x.beginPath(); x.arc(cx, cy, pr * 1.22, 0, TAU); x.fill();
    x.fillStyle = '#040303'; x.beginPath(); x.arc(cx, cy, pr * 0.92, 0, TAU); x.fill();
    // kornea parlaması
    g = x.createRadialGradient(cx - R * 0.35, cy - R * 0.4, 0, cx, cy, R * 1.1);
    g.addColorStop(0, 'rgba(255,255,255,.12)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.beginPath(); x.arc(cx, cy, R, 0, TAU); x.fill();
    x.save(); x.translate(cx - R * 0.2, cy - R * 0.48); x.rotate(-0.1);
    x.fillStyle = 'rgba(255,255,248,.78)'; rr(x, -R * 0.25, -R * 0.04, R * 0.5, R * 0.08, R * 0.04); x.fill();
    x.restore();
    x.fillStyle = 'rgba(255,255,250,.8)'; x.beginPath(); x.arc(cx + R * 0.36, cy - R * 0.18, R * 0.026, 0, TAU); x.fill();

    // göz kapakları
    const op = this.open, yE = cy + R * 0.04, xL = cx - R * 1.95, xR = cx + R * 1.95;
    const yU = lerp(cy + R * 0.16, cy - R * 0.92, op), yL = lerp(cy + R * 0.2, cy + R * 1.02, op);
    const A = [xR, yE], CU = [cx, 2 * yU - yE], B = [xL, yE], CL = [cx, 2 * yL - yE];
    const [skinA, skinB] = this.p.skin;
    g = x.createLinearGradient(0, yU, 0, yU + R * 0.55);
    g.addColorStop(0, 'rgba(25,12,6,.6)'); g.addColorStop(1, 'rgba(25,12,6,0)');
    x.fillStyle = g; x.fillRect(0, yU - R * 0.2, W, R * 0.8);
    x.beginPath(); x.moveTo(-20, -20); x.lineTo(W + 20, -20); x.lineTo(A[0], A[1]); x.quadraticCurveTo(CU[0], CU[1], B[0], B[1]); x.closePath();
    g = x.createLinearGradient(0, yU - R * 1.1, 0, yU); g.addColorStop(0, skinB); g.addColorStop(0.7, skinA); g.addColorStop(1, skinA);
    x.fillStyle = g; x.fill();
    x.strokeStyle = '#160c08'; x.lineWidth = 8; x.beginPath(); x.moveTo(A[0], A[1]); x.quadraticCurveTo(CU[0], CU[1], B[0], B[1]); x.stroke();
    x.strokeStyle = 'rgba(18,10,7,.88)'; x.lineCap = 'round';
    for (const Ls of this.lash) {
      const P = qP(A, CU, B, Ls.u), T = qT(A, CU, B, Ls.u);
      let nx = T[1], ny = -T[0]; const m = Math.hypot(nx, ny) || 1; nx /= m; ny /= m; if (ny > 0) { nx = -nx; ny = -ny; }
      const len = Ls.len * (0.4 + 0.6 * op), sx = (P[0] - cx) / R * 0.35;
      x.lineWidth = Ls.w; x.beginPath(); x.moveTo(P[0], P[1]);
      x.quadraticCurveTo(P[0] + nx * len * 0.45 + sx * len * 0.3, P[1] + ny * len * 0.45 + len * 0.28, P[0] + nx * len + sx * len, P[1] + ny * len + len * 0.05);
      x.stroke();
    }
    x.beginPath(); x.moveTo(-20, H + 20); x.lineTo(W + 20, H + 20); x.lineTo(A[0], A[1] + 4); x.quadraticCurveTo(CL[0], CL[1], B[0], B[1] + 4); x.closePath();
    g = x.createLinearGradient(0, yL, 0, yL + R * 0.9); g.addColorStop(0, '#a97464'); g.addColorStop(0.3, '#87584a'); g.addColorStop(1, '#4d2d23');
    x.fillStyle = g; x.fill();
    x.strokeStyle = 'rgba(214,150,140,.85)'; x.lineWidth = 7; x.beginPath(); x.moveTo(A[0], A[1] + 2); x.quadraticCurveTo(CL[0], CL[1] - 2, B[0], B[1] + 2); x.stroke();
    x.strokeStyle = 'rgba(30,16,10,.75)';
    for (const Ls of this.llash) {
      const P = qP([A[0], A[1] + 4], CL, [B[0], B[1] + 4], Ls.u);
      x.lineWidth = Ls.w; x.beginPath(); x.moveTo(P[0], P[1] + 4); x.lineTo(P[0] + (P[0] - cx) / R * Ls.len * 0.5, P[1] + 4 + Ls.len); x.stroke();
    }
    x.lineCap = 'butt';

    // odak kayması (makine ölçerken netleşir)
    if (this.focus < 0.98) {
      x.globalAlpha = (1 - this.focus) * 0.5;
      x.drawImage(this.canvas, -3, 0); x.drawImage(this.canvas, 3, 0);
      x.globalAlpha = 1;
    }

    // ekran üstü işaretler
    x.strokeStyle = 'rgba(210,255,230,0.35)'; x.lineWidth = 2;
    const m = 26, l = 34;
    for (const [px, py, sx, sy] of [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]]) {
      x.beginPath(); x.moveTo(px, py + sy * l); x.lineTo(px, py); x.lineTo(px + sx * l, py); x.stroke();
    }
    x.beginPath(); x.moveTo(W / 2 - 12, H / 2); x.lineTo(W / 2 + 12, H / 2); x.moveTo(W / 2, H / 2 - 12); x.lineTo(W / 2, H / 2 + 12); x.stroke();
    if (this.overlay) {
      x.font = '400 18px "Plex Mono", monospace';
      x.fillStyle = 'rgba(210,255,230,0.6)';
      x.fillText(this.overlay, m + 6, H - m - 10);
    }
  }
}
