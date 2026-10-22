// Masanın solundaki kâğıt işleri: karton dosya yığını (önden), test formu (masada düz) ve
// tükenmez kalem. Yazılar strings.tr.json → room.* (cihaz ve evrak İngilizce).
import { mk, rr, lg, rg, seeded, grain } from './paint.js';
import { t } from '../core/strings.js';

const TAU = Math.PI * 2;
const TYPE = '"Courier Prime", monospace';

const poly = (x, pts) => { x.beginPath(); x.moveTo(...pts[0]); for (const p of pts.slice(1)) x.lineTo(...p); x.closePath(); };
function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16), f = (v) => Math.max(0, Math.min(255, Math.round(v * (1 + k))));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}
function text(x, s, px, py, { size = 12, weight = 700, color = '#2e2b25', rot = 0, spacing = 0 } = {}) {
  x.save(); x.translate(px, py); x.rotate(rot);
  x.font = `${weight} ${size}px ${TYPE}`; x.textBaseline = 'middle';
  if ('letterSpacing' in x) x.letterSpacing = `${spacing}px`;
  x.fillStyle = color; x.fillText(s, 0, 0); x.restore();
}
// el yazısı: eğik, mavi-siyah mürekkep
const hand = (x, s, px, py, size = 13, rot = -0.04) => text(x, s, px, py, { size, weight: 400, color: 'rgba(28,38,72,0.85)', rot });
function scribble(x, R, px, py, w, h, n = 6, color = 'rgba(28,38,72,0.8)') {
  x.strokeStyle = color; x.lineWidth = 1.1; x.lineCap = 'round'; x.beginPath(); x.moveTo(px, py);
  for (let i = 1; i <= n; i++) { const k = i / n; x.quadraticCurveTo(px + w * (k - 0.5 / n), py + (R() - 0.5) * h * 2, px + w * k, py + (R() - 0.5) * h); }
  x.stroke();
}
function paperclip(x, px, py, len = 46, rot = 0) {
  x.save(); x.translate(px, py); x.rotate(rot);
  x.lineCap = 'round';
  const path = () => { x.beginPath(); x.moveTo(4, len - 6); x.lineTo(4, 8); x.arc(9, 8, 5, Math.PI, 0); x.lineTo(14, len - 2); x.arc(8, len - 2, 6, 0, Math.PI); x.lineTo(2, 12); x.arc(6.5, 12, 4.5, Math.PI, 0); x.lineTo(11, len - 12); };
  x.strokeStyle = 'rgba(0,0,0,0.35)'; x.lineWidth = 2.6; x.translate(1, 1.5); path(); x.stroke(); x.translate(-1, -1.5);
  x.strokeStyle = lg(x, 0, 0, 16, 0, [[0, '#8e9796'], [0.5, '#e4ebe8'], [1, '#7c8584']]); x.lineWidth = 1.8; path(); x.stroke();
  x.restore();
}
// mürekkebi yer yer tutmamış damga
function stamp(x, R, s, px, py, rot, size = 22) {
  x.save(); x.translate(px, py); x.rotate(rot);
  x.font = `700 ${size}px ${TYPE}`; if ('letterSpacing' in x) x.letterSpacing = '4px';
  const w = x.measureText(s).width + 18;
  x.strokeStyle = 'rgba(128,36,30,0.62)'; x.lineWidth = 2.4; rr(x, -w / 2, -size * 0.75, w, size * 1.5, 3); x.stroke();
  x.fillStyle = 'rgba(128,36,30,0.6)'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, 0, 1);
  x.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 90; i++) { x.fillStyle = `rgba(0,0,0,${0.3 + R() * 0.5})`; x.fillRect(-w / 2 + R() * w, -size + R() * size * 2, 1 + R() * 3, 1 + R() * 2); }
  x.restore();
}
function coffeeRing(x, cx, cy, r) {
  x.strokeStyle = 'rgba(110,72,32,0.22)'; x.lineWidth = 3; x.beginPath(); x.ellipse(cx, cy, r, r * 0.96, 0.2, 0.3, TAU - 0.6); x.stroke();
  x.strokeStyle = 'rgba(110,72,32,0.12)'; x.lineWidth = 7; x.beginPath(); x.ellipse(cx, cy, r - 3, r * 0.96 - 3, 0.2, 0, TAU); x.stroke();
}

// Karton dosya yığını, önden (0.6 × 0.26 m): renkli dosyalar ve aralarında kâğıt, yandan
// taşan ayraç sekmeleri, lastik bant; üst dosyada etiket, damga, ataş, taşan fotoğraf köşesi.
export function paintFiles() {
  const W = 480, H = 208, c = mk(W, H), x = c.getContext('2d');
  const R = seeded(61);
  const layers = [
    { k: 'paper', h: 10 }, { k: 'folder', h: 13, col: '#7f8a76' }, { k: 'paper', h: 8 }, { k: 'folder', h: 12, col: '#b89a5e', tab: '#c9b98a' },
    { k: 'paper', h: 12 }, { k: 'folder', h: 14, col: '#875a48', tab: '#9a6e5a' }, { k: 'paper', h: 6 }, { k: 'folder', h: 12, col: '#b2955c' },
    { k: 'paper', h: 9 }, { k: 'folder', h: 13, col: '#c0a46b', tab: '#d9c695' },
  ];
  x.fillStyle = 'rgba(0,0,0,0.45)'; x.beginPath(); x.ellipse(250, H - 8, 230, 9, 0, 0, TAU); x.fill();
  let y = H - 10, top = null;
  for (const l of layers) {
    const sk = (R() - 0.5) * 16, x0 = 44 + sk, w = 392 + (R() - 0.5) * 14, yt = y - l.h;
    if (l.k === 'paper') {
      x.fillStyle = '#d8d1bd'; x.fillRect(x0 + 4, yt, w - 6, l.h);
      for (let k = 1; k < l.h; k += 1.6) { x.fillStyle = `rgba(80,72,58,${0.12 + R() * 0.12})`; x.fillRect(x0 + 4 + R() * 6, yt + k, w - 12 - R() * 10, 0.6); }
      if (R() < 0.7) { x.fillStyle = '#e2dcca'; x.fillRect(x0 - 6 - R() * 10, yt + 2, 60 + R() * 60, 2.2); }
    } else {
      x.fillStyle = lg(x, 0, yt, 0, y, [[0, l.col], [1, shade(l.col, -0.25)]]); x.fillRect(x0, yt, w, l.h);
      x.fillStyle = 'rgba(255,255,255,0.12)'; x.fillRect(x0, yt, w, 1);
      x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillRect(x0, y - 1.5, w, 1.5);
      if (l.tab) { x.fillStyle = l.tab; rr(x, x0 - 18, yt + 1, 22, l.h - 2, 2); x.fill(); x.fillStyle = 'rgba(40,36,30,0.55)'; x.fillRect(x0 - 14, yt + l.h / 2 - 1, 9, 1.4); }
    }
    top = { x0, w, yt };
    y = yt;
  }
  // en üst dosyanın üst yüzü (hafif perspektif)
  const { x0, w, yt } = top, d = 58;
  const T = [[x0, yt], [x0 + w, yt], [x0 + w - 10, yt - d], [x0 + 16, yt - d]];
  x.fillStyle = lg(x, 0, yt - d, 0, yt, [[0, '#cdb17a'], [1, '#bd9e64']]); poly(x, T); x.fill();
  x.strokeStyle = 'rgba(90,70,40,0.5)'; x.lineWidth = 1; poly(x, T); x.stroke();
  // altından taşan kâğıt ve fotoğraf köşesi
  x.fillStyle = '#e4dece'; poly(x, [[x0 + w - 40, yt - 8], [x0 + w + 14, yt - 14], [x0 + w + 8, yt - 34], [x0 + w - 30, yt - 30]]); x.fill();
  x.save(); poly(x, [[x0 + 30, yt - 2], [x0 - 4, yt - 20], [x0 + 8, yt - 46], [x0 + 46, yt - 30]]); x.clip();
  x.fillStyle = '#ece8de'; x.fillRect(x0 - 10, yt - 50, 60, 52);
  x.fillStyle = lg(x, x0, yt - 40, x0 + 40, yt, [[0, '#3c3f3e'], [1, '#151716']]); poly(x, [[x0 + 26, yt - 6], [x0 + 2, yt - 19], [x0 + 10, yt - 38], [x0 + 38, yt - 27]]); x.fill();
  x.restore();
  // etiket, damga, ataş
  x.save(); x.translate(x0 + 120, yt - 30); x.rotate(-0.01);
  x.fillStyle = '#ece6d4'; x.fillRect(-70, -12, 150, 24); x.strokeStyle = 'rgba(60,50,30,0.35)'; x.strokeRect(-70, -12, 150, 24);
  text(x, t('room.folderLabel'), -62, 0, { size: 12, color: '#2a2722' }); x.restore();
  stamp(x, R, t('room.classified'), x0 + 290, yt - 30, -0.12, 17);
  paperclip(x, x0 + w - 70, yt - d - 10, 36, 0.05);
  // lastik bant: önden ve üstten geçer
  const bx = x0 + w * 0.72;
  x.fillStyle = 'rgba(70,40,26,0.9)'; x.fillRect(bx, yt, 7, H - 18 - yt);
  poly(x, [[bx, yt], [bx + 7, yt], [bx + 4, yt - d], [bx - 3, yt - d]]); x.fill();
  x.fillStyle = 'rgba(255,220,190,0.12)'; x.fillRect(bx + 1, yt, 1.5, H - 18 - yt);
  grain(x, W, H, 9, 62);
  return c;
}

// Test formu (0.3 × 0.4 m, masada düz): daktilo başlık ve alanlar, 7 soruluk tablo ve el
// yazısıyla ham değerler (biri yuvarlak içinde, yanında soru işareti), notlar, imza,
// ataşlı polaroid göz fotoğrafı, kahve halkası.
export function paintSheet() {
  const W = 300, H = 400, c = mk(W, H), x = c.getContext('2d');
  const R = seeded(71);
  x.fillStyle = lg(x, 0, 0, W, H, [[0, '#e1dbc8'], [1, '#d3ccb6']]); x.fillRect(0, 0, W, H);
  text(x, t('room.form'), 18, 26, { size: 13, spacing: 0.5 });
  x.fillStyle = 'rgba(40,38,32,0.7)'; x.fillRect(18, 38, W - 36, 1.4);
  t('room.formFields').forEach((f, i) => text(x, f, 18, 54 + i * 15, { size: 9.5, weight: 400 }));
  // tablo
  const cols = t('room.formCols'), q = t('room.formRow');
  const tx = 18, ty = 108, tw = W - 36, rh = 19, cw = [36, 62, 58, 46, tw - 202];
  x.strokeStyle = 'rgba(40,38,32,0.55)'; x.lineWidth = 1;
  x.strokeRect(tx, ty, tw, rh * 8);
  for (let r = 1; r < 8; r++) { x.beginPath(); x.moveTo(tx, ty + r * rh); x.lineTo(tx + tw, ty + r * rh); x.stroke(); }
  let cx = tx;
  cw.forEach((w, i) => { if (i) { x.beginPath(); x.moveTo(cx, ty); x.lineTo(cx, ty + rh * 8); x.stroke(); } text(x, cols[i], cx + 3, ty + rh / 2, { size: 7.5 }); cx += w; });
  x.fillStyle = 'rgba(40,38,32,0.08)'; x.fillRect(tx, ty, tw, rh);
  for (let r = 1; r < 8; r++) {
    const yy = ty + r * rh + rh / 2;
    text(x, `${q}${r}`, tx + 4, yy, { size: 8.5, weight: 400 });
    const vals = [`+${(R() * 9).toFixed(1)}`, `${R() < 0.5 ? '+' : '−'}${(R() * 6).toFixed(1)}`, `${Math.round(R() * 9)}`, `${(1 + R() * 4).toFixed(2)}`];
    let xx = tx + cw[0];
    vals.forEach((v, i) => { hand(x, v, xx + 6 + R() * 4, yy + (R() - 0.5) * 2, 10.5, (R() - 0.5) * 0.08); xx += cw[i + 1]; });
  }
  x.strokeStyle = 'rgba(28,38,72,0.8)'; x.lineWidth = 1.3; x.beginPath(); x.ellipse(tx + cw[0] + 30, ty + 5 * rh + rh / 2, 28, 9, -0.05, 0.2, TAU + 0.1); x.stroke();
  hand(x, '?', tx + tw + 2, ty + 5 * rh + rh / 2, 14);
  // notlar ve imza
  text(x, t('room.notes'), 18, 282, { size: 9 });
  for (let i = 0; i < 3; i++) { x.fillStyle = 'rgba(40,38,32,0.25)'; x.fillRect(18, 300 + i * 16, W - 36, 0.8); scribble(x, R, 22, 296 + i * 16, 120 + R() * 120, 3, 9); }
  x.fillStyle = 'rgba(40,38,32,0.5)'; x.fillRect(150, 370, 130, 1);
  text(x, t('room.examiner'), 150, 380, { size: 7.5, weight: 400 });
  scribble(x, R, 160, 362, 90, 9, 7, 'rgba(28,38,72,0.85)');
  // ataşlı polaroid: göz fotoğrafı
  x.save(); x.translate(216, 16); x.rotate(0.08);
  x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(3, 4, 70, 82);
  x.fillStyle = '#efece4'; x.fillRect(0, 0, 70, 82);
  x.fillStyle = lg(x, 0, 6, 0, 64, [[0, '#4a4c48'], [1, '#232523']]); x.fillRect(6, 6, 58, 56);
  x.fillStyle = '#c8c6be'; x.beginPath(); x.ellipse(35, 34, 24, 11, 0, 0, TAU); x.fill();
  x.fillStyle = rg(x, 35, 34, 2, 35, 34, 10, [[0, '#2a2b28'], [0.4, '#5d5f58'], [1, '#3a3b37']]); x.beginPath(); x.arc(35, 34, 9.5, 0, TAU); x.fill();
  x.fillStyle = '#0c0c0b'; x.beginPath(); x.arc(35, 34, 3.6, 0, TAU); x.fill();
  x.fillStyle = 'rgba(255,255,255,0.7)'; x.beginPath(); x.arc(37.5, 31.5, 1.4, 0, TAU); x.fill();
  hand(x, '04', 10, 72, 10, 0);
  x.restore();
  paperclip(x, 226, 2, 40, 0.08);
  coffeeRing(x, 70, 330, 34);
  x.fillStyle = 'rgba(80,70,50,0.12)'; x.fillRect(0, 200, W, 1);   // kat izi
  x.fillStyle = lg(x, 0, 0, 0, H, [[0, 'rgba(90,75,50,0.06)'], [0.5, 'rgba(0,0,0,0)'], [1, 'rgba(90,75,50,0.1)']]); x.fillRect(0, 0, W, H);
  grain(x, W, H, 8, 73);
  return c;
}

// Tükenmez kalem (0.17 × 0.022 m, masada düz): siyah parlak gövde, krom klips, tırtıklı
// kauçuk tutma yeri, krom konik uç, basma düğmesi; altında yumuşak gölge.
export function paintPen() {
  const W = 340, H = 44, c = mk(W, H), x = c.getContext('2d');
  const cy = 22;
  // gölge (sağ alta düşer)
  x.fillStyle = 'rgba(0,0,0,0.3)'; rr(x, 22, cy - 4, 300, 14, 7); x.fill();
  x.fillStyle = 'rgba(0,0,0,0.18)'; rr(x, 18, cy - 7, 308, 20, 10); x.fill();
  // basma düğmesi
  x.fillStyle = lg(x, 0, cy - 6, 0, cy + 6, [[0, '#eef2f0'], [0.5, '#8d9694'], [1, '#3a4040']]); rr(x, 8, cy - 6, 16, 12, 3); x.fill();
  // gövde
  x.fillStyle = lg(x, 0, cy - 9, 0, cy + 9, [[0, '#5a6262'], [0.25, '#1d2121'], [0.7, '#0a0b0b'], [1, '#000']]); rr(x, 22, cy - 9, 222, 18, 9); x.fill();
  x.fillStyle = 'rgba(255,255,255,0.45)'; x.fillRect(32, cy - 6, 200, 1.6);
  // gövde ile tutma yeri arasında krom bilezik
  x.fillStyle = lg(x, 0, cy - 9, 0, cy + 9, [[0, '#f2f6f4'], [0.5, '#9aa3a1'], [1, '#3a4040']]); x.fillRect(244, cy - 9, 7, 18);
  // tırtıklı kauçuk tutma yeri
  x.fillStyle = lg(x, 0, cy - 8, 0, cy + 8, [[0, '#3a3f3f'], [1, '#0b0c0c']]); rr(x, 251, cy - 8, 36, 16, 4); x.fill();
  for (let i = 0; i < 9; i++) { x.fillStyle = 'rgba(0,0,0,0.6)'; x.fillRect(254 + i * 3.6, cy - 7, 1.4, 14); x.fillStyle = 'rgba(255,255,255,0.12)'; x.fillRect(255.4 + i * 3.6, cy - 7, 0.8, 14); }
  // krom konik uç ve bilye
  x.fillStyle = lg(x, 0, cy - 7, 0, cy + 7, [[0, '#f0f4f2'], [0.45, '#a2aaa8'], [1, '#2e3434']]);
  poly(x, [[287, cy - 7], [318, cy - 2.2], [318, cy + 2.2], [287, cy + 7]]); x.fill();
  x.fillStyle = '#c9d0ce'; poly(x, [[318, cy - 1.6], [329, cy - 0.6], [329, cy + 0.6], [318, cy + 1.6]]); x.fill();
  x.fillStyle = '#2a2f2f'; x.beginPath(); x.arc(330, cy, 1.1, 0, TAU); x.fill();
  // krom klips: gövdenin üstünden uzanır, ucunda küçük top
  x.fillStyle = 'rgba(0,0,0,0.45)'; rr(x, 30, cy - 12, 110, 8, 3); x.fill();
  x.fillStyle = lg(x, 0, cy - 14, 0, cy - 6, [[0, '#ffffff'], [0.5, '#b8c0be'], [1, '#5a6262']]); rr(x, 28, cy - 14, 110, 7, 3); x.fill();
  x.fillStyle = rg(x, 137, cy - 11, 0, 138, cy - 10.5, 5, [[0, '#ffffff'], [1, '#6a7272']]); x.beginPath(); x.arc(138, cy - 10.5, 4.5, 0, TAU); x.fill();
  // gövdede ince marka yazısı
  x.save(); x.font = '600 7px "Plex Mono", monospace'; if ('letterSpacing' in x) x.letterSpacing = '1.5px';
  x.fillStyle = 'rgba(220,226,224,0.55)'; x.textBaseline = 'middle'; x.fillText(t('kasa.maker'), 160, cy + 2); x.restore();
  return c;
}
