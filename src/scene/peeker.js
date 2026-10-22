// Kapı penceresinin ardındaki koridor ve oradan geçen adam (takım elbise, güneş gözlüğü).
// Pencere ayrı, küçük bir katmandır (kapı dokusu sabit kalır). Adam sağdan, yürüdüğü yöne
// dönük gelir, pencerenin önünde durur, kafasını çevirip doğrudan içeri bakar, yeniden
// yana döner ve sola yürüyüp gider; araları rastgele uzunlukta. Buzlu, tel örgülü camın
// arkasında bulanık görünür; cam ve tel keskin kalır. Hareketi azalt açıkken görünmez.
import * as THREE from 'three';
import { mk, lg, rg, seeded } from './paint.js';

const TAU = Math.PI * 2;
// Kapı dokusu 380 × 860 (0.95 × 2.15 m); ince uzun pencere sağ üst köşeye yakın.
export const DOOR = { W: 380, H: 860, win: { x: 280, y: 74, w: 44, h: 280 } };
const S = 2;                     // pencere tuvalinin çözünürlük çarpanı
const { win: WIN } = DOOR;

// Profil (sola bakıyor). (cx, cy) kulak hizasında baş merkezi, s ölçek, tilt öne eğilme.
// detail: arka ışık ve yaka ayrıntılarının görünürlüğü (dönüşte söner).
function profile(x, cx, cy, s, { tilt = 0, rim = 0.3, detail = 1 } = {}) {
  const ink = '#020303', rl = (a) => `rgba(205,214,198,${a * detail * rim / 0.4})`;
  const P = (px, py) => [cx + px * s, cy + py * s];
  x.save();
  x.fillStyle = ink;
  x.beginPath();
  x.moveTo(...P(-14, 52)); x.lineTo(...P(-30, 76)); x.quadraticCurveTo(...P(-40, 120), ...P(-42, 400));
  x.lineTo(...P(90, 400)); x.lineTo(...P(80, 100)); x.quadraticCurveTo(...P(60, 66), ...P(16, 54)); x.closePath(); x.fill();
  x.fillStyle = `rgba(150,162,156,${0.18 * detail})`;
  x.beginPath(); x.moveTo(...P(-14, 52)); x.lineTo(...P(-22, 66)); x.lineTo(...P(-12, 64)); x.lineTo(...P(-6, 54)); x.closePath(); x.fill();
  x.strokeStyle = rl(0.35); x.lineWidth = 2 * s;
  x.beginPath(); x.moveTo(...P(16, 54)); x.quadraticCurveTo(...P(60, 64), ...P(80, 100)); x.stroke();

  x.translate(cx + 2 * s, cy + 50 * s); x.rotate(-tilt); x.translate(-(cx + 2 * s), -(cy + 50 * s));
  x.fillStyle = ink;
  const head = () => {
    x.beginPath();
    x.moveTo(...P(-2, -48));
    x.bezierCurveTo(...P(-16, -48), ...P(-24, -38), ...P(-25, -26));
    x.quadraticCurveTo(...P(-27, -14), ...P(-26, -11));
    x.quadraticCurveTo(...P(-23, -6), ...P(-25, -3));
    x.lineTo(...P(-34, 9));
    x.quadraticCurveTo(...P(-33, 12), ...P(-27, 13));
    x.quadraticCurveTo(...P(-29, 16), ...P(-28, 19));
    x.quadraticCurveTo(...P(-25, 21), ...P(-28, 24));
    x.quadraticCurveTo(...P(-26, 28), ...P(-25, 30));
    x.quadraticCurveTo(...P(-26, 38), ...P(-20, 40));
    x.quadraticCurveTo(...P(-10, 44), ...P(-10, 48));
    x.lineTo(...P(-14, 60)); x.lineTo(...P(16, 60));
    x.lineTo(...P(18, 34));
    x.bezierCurveTo(...P(26, 22), ...P(30, 4), ...P(29, -16));
    x.bezierCurveTo(...P(28, -38), ...P(14, -48), ...P(-2, -48));
    x.closePath();
  };
  head(); x.fill();
  x.beginPath(); x.ellipse(...P(7, 2), 5.5 * s, 9.5 * s, 0.15, 0, TAU); x.fill();
  // geriye taranmış saç
  x.beginPath();
  x.moveTo(...P(-24, -28)); x.bezierCurveTo(...P(-22, -46), ...P(-6, -53), ...P(8, -51));
  x.bezierCurveTo(...P(24, -48), ...P(33, -32), ...P(31, -10)); x.lineTo(...P(26, -6));
  x.bezierCurveTo(...P(24, -24), ...P(12, -36), ...P(-4, -38)); x.quadraticCurveTo(...P(-16, -38), ...P(-24, -28)); x.closePath(); x.fill();
  // yüz kenarında arka ışık
  x.save(); head(); x.clip();
  x.strokeStyle = rl(0.5); x.lineWidth = 2.2 * s;
  x.beginPath(); x.moveTo(...P(-6, -50)); x.bezierCurveTo(...P(-18, -49), ...P(-25, -38), ...P(-25.5, -26));
  x.quadraticCurveTo(...P(-27, -14), ...P(-26, -11)); x.stroke();
  x.strokeStyle = rl(0.32); x.lineWidth = 1.6 * s;
  x.beginPath(); x.moveTo(...P(-27, -1)); x.lineTo(...P(-34, 9)); x.quadraticCurveTo(...P(-33, 12), ...P(-27, 13)); x.stroke();
  x.beginPath(); x.moveTo(...P(-28, 19)); x.quadraticCurveTo(...P(-25, 21), ...P(-28, 24)); x.quadraticCurveTo(...P(-26, 28), ...P(-25, 30)); x.quadraticCurveTo(...P(-26, 38), ...P(-20, 40)); x.stroke();
  x.restore();
  x.strokeStyle = rl(0.35); x.lineWidth = 1.6 * s;
  x.beginPath(); x.moveTo(...P(-20, -40)); x.bezierCurveTo(...P(-10, -51), ...P(6, -52), ...P(18, -46)); x.stroke();
  // kulaklık kablosu
  x.strokeStyle = rl(0.3); x.lineWidth = 1 * s;
  x.beginPath(); x.moveTo(...P(10, 8));
  for (let i = 1; i <= 24; i++) { const k = i / 24; x.lineTo(...P(12 + Math.sin(k * TAU * 4) * 2 + k * 4, 8 + k * 50)); }
  x.stroke();
  // mat siyah güneş gözlüğü (yandan)
  x.fillStyle = '#000';
  x.beginPath(); x.moveTo(...P(-29, -11)); x.lineTo(...P(-17, -11)); x.quadraticCurveTo(...P(-16, -3), ...P(-20, -1)); x.lineTo(...P(-26, -1)); x.quadraticCurveTo(...P(-30, -3), ...P(-29, -11)); x.closePath(); x.fill();
  x.strokeStyle = '#000'; x.lineWidth = 2 * s; x.beginPath(); x.moveTo(...P(-17, -9)); x.lineTo(...P(3, -6)); x.stroke();
  x.restore();
}

// Önden (içeri, bize bakıyor).
function front(x, cx, cy, s, { rim = 0.3, detail = 1 } = {}) {
  const ink = '#020303', rl = (a) => `rgba(205,214,198,${a * detail * rim / 0.4})`;
  const P = (px, py) => [cx + px * s, cy + py * s];
  x.save();
  x.fillStyle = ink;
  x.beginPath(); x.moveTo(...P(-24, 42));
  x.quadraticCurveTo(...P(-90, 50), ...P(-116, 92)); x.lineTo(...P(-134, 400)); x.lineTo(...P(134, 400)); x.lineTo(...P(116, 92));
  x.quadraticCurveTo(...P(90, 50), ...P(24, 42)); x.closePath(); x.fill();
  x.fillRect(cx - 15 * s, cy + 18 * s, 30 * s, 30 * s);
  x.beginPath(); x.moveTo(...P(-25, -4));
  x.bezierCurveTo(...P(-26, 22), ...P(-14, 42), ...P(0, 44)); x.bezierCurveTo(...P(14, 42), ...P(26, 22), ...P(25, -4));
  x.bezierCurveTo(...P(25, -30), ...P(14, -40), ...P(0, -40)); x.bezierCurveTo(...P(-14, -40), ...P(-25, -30), ...P(-25, -4)); x.closePath(); x.fill();
  for (const d of [-1, 1]) { x.beginPath(); x.ellipse(...P(d * 26.5, 2), 4.5 * s, 8.5 * s, d * 0.15, 0, TAU); x.fill(); }
  const hair = () => { x.beginPath(); x.moveTo(...P(-27, -6));
    x.bezierCurveTo(...P(-30, -30), ...P(-20, -50), ...P(-4, -51)); x.bezierCurveTo(...P(14, -52), ...P(29, -42), ...P(28, -8));
    x.lineTo(...P(24, -14)); x.bezierCurveTo(...P(20, -32), ...P(4, -36), ...P(-10, -33)); x.bezierCurveTo(...P(-20, -30), ...P(-24, -20), ...P(-24, -10)); x.closePath(); };
  hair(); x.fill();
  x.save(); hair(); x.clip();
  x.strokeStyle = rl(0.5); x.lineWidth = 2.2 * s;
  x.beginPath(); x.moveTo(...P(-26, -20)); x.bezierCurveTo(...P(-26, -40), ...P(-14, -50), ...P(-4, -50.5)); x.bezierCurveTo(...P(14, -51), ...P(28, -40), ...P(27.5, -12)); x.stroke();
  x.restore();
  x.fillStyle = `rgba(150,162,156,${0.15 * detail})`;
  x.beginPath(); x.moveTo(...P(-18, 44)); x.lineTo(...P(0, 92)); x.lineTo(...P(18, 44)); x.lineTo(...P(8, 44)); x.lineTo(...P(0, 58)); x.lineTo(...P(-8, 44)); x.closePath(); x.fill();
  x.fillStyle = ink; x.beginPath(); x.moveTo(...P(-5, 55)); x.lineTo(...P(5, 55)); x.lineTo(...P(8, 150)); x.lineTo(...P(0, 162)); x.lineTo(...P(-8, 150)); x.closePath(); x.fill();
  x.strokeStyle = rl(0.4); x.lineWidth = 2 * s;
  x.beginPath(); x.moveTo(...P(26, 45)); x.quadraticCurveTo(...P(90, 52), ...P(114, 96)); x.stroke();
  x.beginPath(); x.moveTo(...P(-26, 45)); x.quadraticCurveTo(...P(-90, 52), ...P(-114, 96)); x.stroke();
  x.strokeStyle = rl(0.3); x.lineWidth = 1 * s;
  x.beginPath(); x.moveTo(...P(28, 8));
  for (let i = 1; i <= 22; i++) { const k = i / 22; x.lineTo(...P(30 + Math.sin(k * TAU * 4) * 2.2 + k * 4, 8 + k * 52)); }
  x.stroke();
  // mat siyah güneş gözlüğü
  x.fillStyle = '#000';
  for (const lx of [-24, 3]) {
    x.beginPath(); x.moveTo(...P(lx, -8)); x.lineTo(...P(lx + 21, -8)); x.quadraticCurveTo(...P(lx + 22, -8), ...P(lx + 21, -3)); x.quadraticCurveTo(...P(lx + 19, 3), ...P(lx + 12, 3)); x.lineTo(...P(lx + 6, 3)); x.quadraticCurveTo(...P(lx, 3), ...P(lx - 0.5, -3)); x.quadraticCurveTo(...P(lx - 1, -8), ...P(lx, -8)); x.closePath(); x.fill();
  }
  x.strokeStyle = '#000'; x.lineWidth = 2 * s; x.beginPath(); x.moveTo(...P(-3, -6)); x.lineTo(...P(3, -6)); x.stroke();
  x.restore();
}

// Profil ile önden görünüş arası dönüş (turn: 0 profil, 1 önden): iki siluet yatayda
// daralıp genişler, ayrıntılar yer değiştirir.
function figure(x, cxProfile, cxFront, cy, s, { turn = 0, tilt = 0 } = {}) {
  const k = turn, cx = cxProfile + (cxFront - cxProfile) * k;
  if (k < 0.75) {
    x.save(); x.translate(cx, 0); x.scale(1 - 0.5 * k, 1); x.translate(-cx, 0);
    profile(x, cx, cy, s, { tilt, detail: 1 - Math.min(1, k / 0.6) });
    x.restore();
  }
  if (k > 0.25) {
    x.save(); x.translate(cx, 0); x.scale(0.5 + 0.5 * k, 1); x.translate(-cx, 0);
    front(x, cx, cy, s, { detail: Math.min(1, (k - 0.25) / 0.6) });
    x.restore();
  }
}

// Bir geçişin zaman çizelgesi (t: geçişin başından beri saniye; ~10 sn sürer).
const ease = (k) => k * k * (3 - 2 * k);
const seg = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));
export const PASS_DURATION = 9.9;
function pass(t, time) {
  let peek = 0, turn = 0, tilt = 0, walk = 0;
  if (t < 2.5) peek = ease(seg(t, 0, 2.5));
  else if (t < PASS_DURATION) peek = 1;
  if (t >= 3.7 && t < 4.5) turn = ease(seg(t, 3.7, 4.5));
  else if (t >= 4.5 && t < 7) turn = 1;
  else if (t >= 7 && t < 7.7) turn = 1 - ease(seg(t, 7, 7.7));
  if (t >= 2.5 && t < 3.7) tilt = 0.06 * Math.sin(Math.PI * seg(t, 2.5, 3.7));
  if (t >= 7.7) { const k = seg(t, 7.7, PASS_DURATION); walk = k * k * (2 - k); }
  const bob = peek * (walk > 0 && walk < 1 ? Math.abs(Math.sin(time * 6)) * -2.2 : Math.sin(time * 1.7) * 1.2);
  return { peek, turn, tilt, walk, bob };
}

// Koridor (pencere içi, adam olmadan). Kapı dokusu da aynısını çizer.
export function paintCorridor(x, wx, wy, ww, wh) {
  x.fillStyle = lg(x, 0, wy, 0, wy + wh, [[0, '#5e6a5e'], [0.45, '#333d37'], [1, '#111614']]); x.fillRect(wx, wy, ww, wh);
  x.fillStyle = rg(x, wx + ww * 0.3, wy - 30, 4, wx + ww * 0.3, wy - 30, 170, [[0, 'rgba(220,210,170,0.45)'], [1, 'rgba(220,210,170,0)']]); x.fillRect(wx, wy, ww, wh);
  x.fillStyle = 'rgba(0,0,0,0.3)'; x.fillRect(wx + ww - 5, wy, 5, wh);
}

// Buzlu cam, tel örgü ve yansıma (pencere içinin en üst katmanı).
export function paintFrostedGlass(x, wx, wy, ww, wh) {
  const R = seeded(29);
  x.fillStyle = lg(x, 0, wy, 0, wy + wh, [[0, 'rgba(190,200,185,0.16)'], [0.6, 'rgba(150,160,150,0.08)'], [1, 'rgba(120,130,120,0.05)']]); x.fillRect(wx, wy, ww, wh);
  for (let i = 0; i < 260; i++) { x.fillStyle = `rgba(${R() < 0.6 ? '210,215,200' : '20,24,22'},${0.03 + R() * 0.06})`; x.fillRect(wx + R() * ww, wy + R() * wh, 1 + R() * 1.5, 1 + R() * 1.5); }
  for (let i = 0; i < 5; i++) { const sx = wx + R() * ww, sy = wy + R() * wh * 0.5; x.fillStyle = lg(x, 0, sy, 0, sy + 60 + R() * 80, [[0, 'rgba(60,66,58,0.12)'], [1, 'rgba(60,66,58,0)']]); x.fillRect(sx, sy, 2 + R() * 3, 140); }
  x.strokeStyle = 'rgba(150,175,170,0.16)'; x.lineWidth = 1; x.beginPath();
  for (let d = -wh; d < ww + wh; d += 12) { x.moveTo(wx + d, wy); x.lineTo(wx + d + wh, wy + wh); x.moveTo(wx + d, wy); x.lineTo(wx + d - wh, wy + wh); }
  x.stroke();
  x.fillStyle = lg(x, wx, wy, wx + ww, wy + wh, [[0, 'rgba(170,205,200,0)'], [0.45, 'rgba(170,205,200,0.09)'], [0.5, 'rgba(170,205,200,0.02)'], [1, 'rgba(170,205,200,0.05)']]); x.fillRect(wx, wy, ww, wh);
}

export class DoorWindow {
  constructor() {
    const { w, h } = WIN;
    // koridor ve cam bir kez çizilir; her karede yalnızca adam yeniden çizilir
    this.back = mk(w * S, h * S);
    this.glass = mk(w * S, h * S);
    for (const [c, paint] of [[this.back, paintCorridor], [this.glass, paintFrostedGlass]]) {
      const x = c.getContext('2d'); x.scale(S, S); paint(x, 0, 0, w, h);
    }
    this.fig = mk(w * S, h * S);
    this.canvas = mk(w * S, h * S);
    this.x = this.canvas.getContext('2d');
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.reduce = false;
    this.time = 0;
    this.t = -(6 + Math.random() * 8);  // ilk geçişten önce bekleme
    this.visible = true;
    this.compose(null);
  }

  compose(st) {
    const x = this.x, { w, h } = WIN;
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.clearRect(0, 0, w * S, h * S);
    x.drawImage(this.back, 0, 0);
    if (st && st.peek > 0.001) {
      // adam ayrı katmanda çizilip bulanıklaştırılır (buzlu camın arkası)
      const s = 1.05, hidden = w + 37 * s, shown = w * 0.42 + 34 * s, gone = -95 * s;
      const cx = hidden + (shown - hidden) * st.peek + (gone - shown) * st.walk, cy = 100 + st.bob;
      const fx = this.fig.getContext('2d');
      fx.setTransform(1, 0, 0, 1, 0, 0); fx.clearRect(0, 0, w * S, h * S);
      fx.setTransform(S, 0, 0, S, 0, 0);
      figure(fx, cx, w / 2, cy, s, st);
      x.filter = `blur(${2.2 * S}px)`; x.globalAlpha = 0.9;
      x.drawImage(this.fig, 0, 0);
      x.filter = 'none'; x.globalAlpha = 1;
    }
    x.drawImage(this.glass, 0, 0);
    this.texture.needsUpdate = true;
  }

  update(dt) {
    this.time += dt;
    if (this.reduce) { if (this.visible) { this.visible = false; this.compose(null); } return; }
    this.t += dt;
    if (this.t >= PASS_DURATION) { this.t = -(12 + Math.random() * 22); }   // sonraki geçişe kadar
    if (this.t >= 0) { this.visible = true; this.compose(pass(this.t, this.time)); }
    else if (this.visible) { this.visible = false; this.compose(null); }
  }
}
