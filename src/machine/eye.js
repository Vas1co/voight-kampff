// Makro göz görüntüsü (prosedürel). CRT dokusu olarak her karede yeniden çizilir.
// İris piksel piksel üretilir: açısal periyodik gürültüden radyal lifler, kriptler,
// kollaret halkası, kasılma çizgileri ve koyu limbal halka. Korneada odadaki
// pencerenin yansıması görünür. Göz bebeği çapı milimetre olarak sürülür;
// sakkad, kırpma ve hippus (doğal titreşim) eklenir.
import { mk, seeded } from '../scene/paint.js';
import { clamp, lerp } from '../core/rng.js';

const IRIS_MM = 11.7;
const TAU = Math.PI * 2;

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix3 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const sstep = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

// Açıda periyodik (P hücre) 2B değer gürültüsü.
function periodicNoise(seed) {
  const h = (i, j) => {
    let n = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(seed, 2147483647)) | 0;
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  };
  return (u, v, P) => {
    const i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j;
    const su = fu * fu * (3 - 2 * fu), sv = fv * fv * (3 - 2 * fv);
    const i0 = ((i % P) + P) % P, i1 = (i0 + 1) % P;
    const a = h(i0, j), b = h(i1, j), c = h(i0, j + 1), d = h(i1, j + 1);
    return a + (b - a) * su + (c - a) * sv + (a - b - c + d) * su * sv;
  };
}

function makeIris(size, p, seed) {
  const c = mk(size, size), x = c.getContext('2d');
  const img = x.createImageData(size, size), d = img.data;
  const N = periodicNoise(seed), R = seeded(seed * 7 + 1);
  const pal = p.iris.map(hex), fleck = hex(p.fleck);
  const half = size / 2;
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const dx = (px + 0.5 - half) / half, dy = (py + 0.5 - half) / half;
      const r = Math.hypot(dx, dy);
      const k = (py * size + px) * 4;
      if (r > 1) { d[k + 3] = 0; continue; }
      const th = (Math.atan2(dy, dx) + Math.PI) / TAU; // 0..1
      // radyal lifler: açıda yüksek, yarıçapta düşük frekans
      const f1 = N(th * 180, r * 3, 180), f2 = N(th * 360 + 17, r * 5, 360), f3 = N(th * 90 + 5, r * 2, 90);
      const fib = f1 * 0.45 + f2 * 0.35 + f3 * 0.2;
      // kollaret: dalgalı halka
      const rc = 0.4 + 0.035 * Math.sin(th * TAU * 7 + 1.3) + 0.02 * (N(th * 24, 3.5, 24) - 0.5);
      const coll = Math.exp(-Math.pow((r - rc) / 0.028, 2));
      // kriptler: orta bölgede koyu boşluklar
      const crypt = sstep(0.66, 0.86, N(th * 64 + 9, r * 9, 64) * 0.7 + N(th * 128 + 3, r * 14, 128) * 0.3) * sstep(0.44, 0.52, r) * (1 - sstep(0.76, 0.86, r));
      // temel renk: iç bölge sıcak, dış bölge yeşilimsi gri
      let col = r < rc ? mix3(pal[0], pal[1], sstep(0.15, rc, r)) : mix3(pal[2], pal[3], sstep(rc, 0.86, r));
      col = col.map((v) => v * (0.35 + Math.pow(fib, 1.4) * 1.45));
      col = mix3(col, [255, 236, 190], coll * 0.32);
      col = col.map((v) => v * (1 - crypt * 0.38));
      // kasılma çizgileri
      const furrow = 0.92 + 0.08 * Math.sin(r * 88 + N(th * 40, r * 2, 40) * 6);
      col = col.map((v) => v * furrow);
      // pigment benekleri
      if (r > 0.3 && r < 0.84 && N(th * 140 + 31, r * 22, 140) > 0.86) col = mix3(col, fleck, 0.45);
      // limbal halka
      const limb = sstep(0.8, 0.97, r);
      col = mix3(col, pal[4], limb * 0.92);
      const n = (R() - 0.5) * 14;
      d[k] = clamp(col[0] + n, 0, 255); d[k + 1] = clamp(col[1] + n, 0, 255); d[k + 2] = clamp(col[2] + n, 0, 255);
      d[k + 3] = 255 * (1 - sstep(0.975, 1, r));
    }
  }
  x.putImageData(img, 0, 0);
  return c;
}

function makeSclera(w, h, R) {
  const c = mk(w, h), x = c.getContext('2d'), cx = w / 2, cy = h / 2;
  let g = x.createRadialGradient(cx, cy, h * 0.18, cx, cy, w * 0.6);
  g.addColorStop(0, '#ece4d8'); g.addColorStop(0.35, '#d9cbbd'); g.addColorStop(0.65, '#b8968a'); g.addColorStop(1, '#7a4c44');
  x.fillStyle = g; x.fillRect(0, 0, w, h);
  // ince damarlar köşelerden içeri
  x.lineCap = 'round';
  const vein = (px, py, a, wid, len, depth) => {
    x.strokeStyle = `rgba(${165 + R() * 40 | 0},${35 + R() * 30 | 0},${40 + R() * 20 | 0},${0.18 + R() * 0.3})`;
    x.lineWidth = wid; x.beginPath(); x.moveTo(px, py);
    for (let i = 0; i < len; i++) {
      a += (R() - 0.5) * 0.45; px += Math.cos(a) * 5; py += Math.sin(a) * 5; x.lineTo(px, py);
      if (depth < 3 && R() < 0.08) { x.stroke(); vein(px, py, a + (R() - 0.5) * 1.7, wid * 0.62, len * 0.55 | 0, depth + 1); x.beginPath(); x.moveTo(px, py); }
    }
    x.stroke();
  };
  for (let i = 0; i < 46; i++) {
    const left = R() < 0.5;
    const px = left ? R() * w * 0.2 : w - R() * w * 0.2, py = cy + (R() - 0.5) * h * 0.55;
    vein(px, py, left ? (R() - 0.5) * 0.7 : Math.PI + (R() - 0.5) * 0.7, 0.8 + R() * 1.8, 16 + R() * 30 | 0, 0);
  }
  // nem: yumuşak lekeli parlaklık
  g = x.createRadialGradient(cx * 0.7, cy * 0.75, 0, cx * 0.7, cy * 0.75, w * 0.3);
  g.addColorStop(0, 'rgba(255,255,255,0.12)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, w, h);
  return c;
}

// Cilt için lekeli doku (göz kapakları).
function makeSkin(w, h, R) {
  const c = mk(w, h), x = c.getContext('2d');
  const img = x.createImageData(w, h), d = img.data;
  const N = periodicNoise(91);
  for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) {
    const k = (py * w + px) * 4;
    const v = N(px / 9, py / 9, 4096) * 0.5 + N(px / 3, py / 3, 4096) * 0.3 + R() * 0.2;
    const g = 128 + (v - 0.5) * 70;
    d[k] = g; d[k + 1] = g; d[k + 2] = g; d[k + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  return c;
}

const qP = (A, C, B, u) => { const m = 1 - u; return [m * m * A[0] + 2 * m * u * C[0] + u * u * B[0], m * m * A[1] + 2 * m * u * C[1] + u * u * B[1]]; };
const qT = (A, C, B, u) => [2 * (1 - u) * (C[0] - A[0]) + 2 * u * (B[0] - C[0]), 2 * (1 - u) * (C[1] - A[1]) + 2 * u * (B[1] - C[1])];

export class Eye {
  constructor(params, { width = 640, height = 480 } = {}) {
    this.W = width; this.H = height;
    this.canvas = mk(width, height);
    this.x = this.canvas.getContext('2d');
    this.R = Math.round(height * 0.34);
    this.setSubject(params);
    this.pupilMM = 3.6; this.targetMM = 3.6; this.rate = 2.2;
    this.gx = 0; this.gy = 0; this.gxT = 0; this.gyT = 0; this.sacAt = 0;
    this.open = 1; this.blinkAt = 2.5; this.blinkT = -1;
    this.focus = 1; this.reduce = false; this.overlay = '';
    this.time = 0;
  }

  setSubject(p) {
    this.p = {
      seed: 23, iris: ['#5a3818', '#a07436', '#8c7a44', '#636443', '#17160d'], fleck: '#ead08a',
      skin: ['#a8705c', '#4a2a20'], blinkEvery: [3, 7], ...p,
    };
    const R = seeded(this.p.seed);
    this.rand = seeded(this.p.seed * 31 + 5);
    this.iris = makeIris(512, this.p, this.p.seed);
    this.sclera = makeSclera(this.W + 80, this.H + 80, R);
    this.skin = makeSkin(this.W, this.H, R);
    this.lash = Array.from({ length: 150 }, () => { const u = 0.08 + R() * 0.84; return { u, len: (30 + R() * 46) * (1 - Math.abs(u - 0.55) * 1.05), w: 1.3 + R() * 1.7, curl: 0.2 + R() * 0.35, jit: (R() - 0.5) * 0.25 }; });
    this.llash = Array.from({ length: 46 }, () => ({ u: 0.15 + R() * 0.72, len: 7 + R() * 15, w: 0.9 + R() * 0.9 }));
    this.ruff = Array.from({ length: 64 }, () => 0.85 + R() * 0.3);
  }

  setPupil(mm, rate = 2.2) { this.targetMM = mm; this.rate = rate; }
  snapPupil(mm) { this.pupilMM = this.targetMM = mm; }

  update(dt, measuring) {
    const R = this.rand;
    this.time += dt;
    const t = this.time;
    if (t > this.sacAt) {
      const amp = measuring ? 4 : 14;
      this.gxT = (R() - 0.5) * 2 * amp; this.gyT = (R() - 0.5) * amp * 0.7;
      this.sacAt = t + 0.6 + R() * 2.6;
    }
    const ks = 1 - Math.pow(0.0004, dt);
    this.gx += (this.gxT - this.gx) * ks; this.gy += (this.gyT - this.gy) * ks;
    const hip = this.reduce ? 0 : 0.05 * Math.sin(t * 1.3) + 0.03 * Math.sin(t * 3.7 + 1);
    this.pupilMM += (this.targetMM + hip - this.pupilMM) * (1 - Math.exp(-this.rate * dt));
    if (!this.reduce) {
      if (this.blinkT < 0 && t > this.blinkAt) this.blinkT = 0;
      if (this.blinkT >= 0) {
        this.blinkT += dt;
        const p = this.blinkT / 0.15;
        this.open = p < 1 ? 1 - p : p < 2.4 ? (p - 1) / 1.4 : 1;
        if (p >= 2.4) { this.open = 1; this.blinkT = -1; const [a, b] = this.p.blinkEvery; this.blinkAt = t + a + R() * (b - a); }
      }
    }
  }

  render() {
    const x = this.x, W = this.W, H = this.H, R = this.R;
    const cx = W / 2 + this.gx, cy = H / 2 + 10 + this.gy;
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = 1;

    // göz küresi
    x.drawImage(this.sclera, this.gx * 0.45 - 40, this.gy * 0.45 - 40);
    // irisin etrafındaki hafif gölge (kornea kenarı)
    let g = x.createRadialGradient(cx, cy, R * 0.96, cx, cy, R * 1.25);
    g.addColorStop(0, 'rgba(60,40,30,0.35)'); g.addColorStop(1, 'rgba(60,40,30,0)');
    x.fillStyle = g; x.beginPath(); x.arc(cx, cy, R * 1.25, 0, TAU); x.fill();
    x.drawImage(this.iris, cx - R, cy - R, R * 2, R * 2);

    // göz bebeği + kenar fırfırı
    const pr = R * clamp(this.pupilMM / IRIS_MM, 0.12, 0.72);
    x.fillStyle = 'rgba(52,30,14,0.85)';
    x.beginPath();
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * TAU, rr2 = pr * (1.07 + 0.05 * (this.ruff[i % 64] - 1));
      const px = cx + Math.cos(a) * rr2, py = cy + Math.sin(a) * rr2;
      i ? x.lineTo(px, py) : x.moveTo(px, py);
    }
    x.fill();
    g = x.createRadialGradient(cx, cy, pr * 0.7, cx, cy, pr * 1.02);
    g.addColorStop(0, '#020101'); g.addColorStop(0.85, '#050302'); g.addColorStop(1, 'rgba(20,10,4,0.9)');
    x.fillStyle = g; x.beginPath(); x.arc(cx, cy, pr, 0, TAU); x.fill();

    // kornea: genel parlaklık
    g = x.createRadialGradient(cx - R * 0.4, cy - R * 0.45, 0, cx, cy, R * 1.15);
    g.addColorStop(0, 'rgba(255,255,255,0.16)'); g.addColorStop(0.5, 'rgba(255,255,255,0.03)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.beginPath(); x.arc(cx, cy, R * 1.05, 0, TAU); x.fill();

    // korneada pencere yansıması (dört bölmeli parlak şerit, kavisli)
    const wx = cx - R * 0.18, wy = cy - R * 0.5, ww = R * 0.82, wh = R * 0.15;
    x.save();
    x.translate(wx, wy); x.rotate(-0.08);
    g = x.createRadialGradient(0, 0, 0, 0, 0, ww * 0.75);
    g.addColorStop(0, 'rgba(240,255,250,0.35)'); g.addColorStop(1, 'rgba(240,255,250,0)');
    x.fillStyle = g; x.fillRect(-ww, -wh * 3, ww * 2, wh * 6);
    x.beginPath();
    x.moveTo(-ww / 2, -wh / 2 + 3);
    x.quadraticCurveTo(0, -wh / 2 - 8, ww / 2, -wh / 2 + 3);
    x.lineTo(ww / 2 - 4, wh / 2);
    x.quadraticCurveTo(0, wh / 2 - 7, -ww / 2 + 4, wh / 2);
    x.closePath();
    x.fillStyle = 'rgba(252,255,250,0.92)'; x.fill();
    x.fillStyle = 'rgba(40,52,52,0.55)';
    for (let i = 1; i < 4; i++) x.fillRect(-ww / 2 + (ww * i) / 4 - 1.5, -wh / 2 - 4, 3, wh + 6);
    x.restore();
    // küçük ikinci parlama
    x.fillStyle = 'rgba(255,255,250,0.85)';
    x.beginPath(); x.arc(cx + R * 0.42, cy + R * 0.22, R * 0.03, 0, TAU); x.fill();

    // göz kapakları
    const op = this.open, yE = cy + R * 0.06, xL = cx - R * 2.1, xR = cx + R * 2.1;
    const yU = lerp(cy + R * 0.2, cy - R * 0.95, op), yL = lerp(cy + R * 0.24, cy + R * 1.04, op);
    const A = [xR, yE], CU = [cx - R * 0.15, 2 * yU - yE], B = [xL, yE + R * 0.08], CL = [cx + R * 0.1, 2 * yL - yE];
    const [skinA, skinB] = this.p.skin;

    // üst kapağın göz küresine düşen gölgesi
    g = x.createLinearGradient(0, yU - R * 0.05, 0, yU + R * 0.6);
    g.addColorStop(0, 'rgba(20,10,6,0.85)'); g.addColorStop(0.4, 'rgba(20,10,6,0.35)'); g.addColorStop(1, 'rgba(20,10,6,0)');
    x.fillStyle = g;
    x.beginPath(); x.moveTo(A[0], A[1]); x.quadraticCurveTo(CU[0], CU[1] + R * 0.5, B[0], B[1]); x.lineTo(B[0], B[1] - R * 2); x.lineTo(A[0], A[1] - R * 2); x.closePath(); x.fill();

    // iç köşe (karunkül)
    const kx = B[0] + R * 0.3, ky = B[1] + R * 0.0;
    g = x.createRadialGradient(kx, ky, 0, kx, ky, R * 0.32);
    g.addColorStop(0, 'rgba(200,118,108,0.6)'); g.addColorStop(0.6, 'rgba(180,100,92,0.3)'); g.addColorStop(1, 'rgba(180,100,92,0)');
    x.fillStyle = g; x.beginPath(); x.ellipse(kx, ky, R * 0.24, R * 0.16 * Math.max(0.2, op), 0, 0, TAU); x.fill();

    // üst kapak
    const upper = new Path2D();
    upper.moveTo(-40, -40); upper.lineTo(W + 40, -40); upper.lineTo(A[0], A[1]);
    upper.quadraticCurveTo(CU[0], CU[1], B[0], B[1]); upper.closePath();
    g = x.createLinearGradient(0, yU - R * 1.3, 0, yU);
    g.addColorStop(0, skinB); g.addColorStop(0.55, skinA); g.addColorStop(1, skinA);
    x.fillStyle = g; x.fill(upper);
    // kapak kıvrımı (kırışık çizgisi)
    const crease = R * (0.3 + 0.18 * op);
    x.strokeStyle = 'rgba(45,20,12,0.55)'; x.lineWidth = 7;
    x.beginPath(); x.moveTo(A[0] - R * 0.2, A[1] - crease * 0.9); x.quadraticCurveTo(CU[0], CU[1] - crease * 1.15, B[0] + R * 0.3, B[1] - crease * 0.8); x.stroke();
    x.strokeStyle = 'rgba(255,215,190,0.18)'; x.lineWidth = 5;
    x.beginPath(); x.moveTo(A[0] - R * 0.2, A[1] - crease * 0.9 - 7); x.quadraticCurveTo(CU[0], CU[1] - crease * 1.15 - 7, B[0] + R * 0.3, B[1] - crease * 0.8 - 7); x.stroke();
    // cilt dokusu
    x.save(); x.clip(upper);
    x.globalCompositeOperation = 'overlay'; x.globalAlpha = 0.35; x.drawImage(this.skin, 0, 0);
    x.restore();
    // kapak kenarı (ıslak, pembe)
    x.strokeStyle = 'rgba(150,70,58,0.95)'; x.lineWidth = 9;
    x.beginPath(); x.moveTo(A[0], A[1]); x.quadraticCurveTo(CU[0], CU[1], B[0], B[1]); x.stroke();
    x.strokeStyle = '#1c0d08'; x.lineWidth = 4;
    x.beginPath(); x.moveTo(A[0], A[1] + 3); x.quadraticCurveTo(CU[0], CU[1] + 3, B[0], B[1] + 3); x.stroke();
    // kirpikler
    x.lineCap = 'round';
    for (const Ls of this.lash) {
      const P = qP(A, CU, B, Ls.u), T = qT(A, CU, B, Ls.u);
      let nx = T[1], ny = -T[0]; const m = Math.hypot(nx, ny) || 1; nx /= m; ny /= m; if (ny > 0) { nx = -nx; ny = -ny; }
      const len = Ls.len * (0.45 + 0.55 * op), sx = (P[0] - cx) / R * 0.3 + Ls.jit;
      x.strokeStyle = `rgba(14,8,5,${0.75 + Ls.w * 0.08})`;
      x.lineWidth = Ls.w;
      x.beginPath(); x.moveTo(P[0], P[1] + 2);
      x.quadraticCurveTo(P[0] + nx * len * 0.5 + sx * len * 0.3, P[1] + ny * len * 0.5 + len * Ls.curl, P[0] + nx * len + sx * len, P[1] + ny * len + len * 0.1);
      x.stroke();
    }

    // alt kapak
    const lower = new Path2D();
    lower.moveTo(-40, H + 40); lower.lineTo(W + 40, H + 40); lower.lineTo(A[0], A[1] + 4);
    lower.quadraticCurveTo(CL[0], CL[1], B[0], B[1] + 4); lower.closePath();
    g = x.createLinearGradient(0, yL, 0, yL + R * 1.1);
    g.addColorStop(0, '#b47f6c'); g.addColorStop(0.25, skinA); g.addColorStop(1, skinB);
    x.fillStyle = g; x.fill(lower);
    x.save(); x.clip(lower);
    x.globalCompositeOperation = 'overlay'; x.globalAlpha = 0.3; x.drawImage(this.skin, 0, 0);
    x.restore();
    // ıslak su çizgisi
    x.strokeStyle = 'rgba(225,160,148,0.95)'; x.lineWidth = 7;
    x.beginPath(); x.moveTo(A[0], A[1] + 3); x.quadraticCurveTo(CL[0], CL[1] - 3, B[0], B[1] + 3); x.stroke();
    x.strokeStyle = 'rgba(255,245,240,0.7)'; x.lineWidth = 1.6;
    x.beginPath(); x.moveTo(A[0] - R * 0.3, A[1] + 1); x.quadraticCurveTo(CL[0], CL[1] - 5, B[0] + R * 0.6, B[1] + 1); x.stroke();
    x.strokeStyle = 'rgba(30,16,10,0.75)';
    for (const Ls of this.llash) {
      const P = qP([A[0], A[1] + 6], CL, [B[0], B[1] + 6], Ls.u);
      x.lineWidth = Ls.w; x.beginPath(); x.moveTo(P[0], P[1] + 3); x.lineTo(P[0] + (P[0] - cx) / R * Ls.len * 0.5, P[1] + 3 + Ls.len); x.stroke();
    }
    x.lineCap = 'butt';

    // odak kayması (makine ölçerken netleşir)
    if (this.focus < 0.98) {
      x.globalAlpha = (1 - this.focus) * 0.5;
      x.drawImage(this.canvas, -3, 0); x.drawImage(this.canvas, 3, 0);
      x.globalAlpha = 1;
    }

    // ekran üstü işaretler
    x.strokeStyle = 'rgba(210,255,230,0.32)'; x.lineWidth = 2;
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
