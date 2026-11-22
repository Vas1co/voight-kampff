// Oda katmanları için prosedürel yer tutucular. Her fonksiyon bir canvas döndürür.
// Gerçek görseller assets/images/room/<ad>.png olarak konduğunda bunların yerini alır
// (dosya adları ve boyutlar için docs/ASSETS.md, düzenleme için tasarim/OKU.md).
//
// Ölçek: duvarlarda ~200 px = 1 m (dışa aktarımda 2×).
// Palet: kirli beyaz klinik duvar ve tavan, koyu metal masa, soluk krem kâğıt,
// küçük amber göstergeler. Kırmızı yalnızca kayıt ışığında.
import { mk, rr, lg, rg, seeded, grain, grime } from './paint.js';
import { t } from '../core/strings.js';

const TAU = Math.PI * 2;

function stencil(x, text, px, py, { size = 40, color = 'rgba(150,170,166,0.22)', align = 'left', weight = 700, spacing = 0.08, font = 'Jost' } = {}) {
  x.save();
  x.font = `${weight} ${size}px "${font}", "Plex Mono", sans-serif`;
  x.textAlign = align; x.textBaseline = 'alphabetic';
  if ('letterSpacing' in x) x.letterSpacing = `${spacing * size}px`;
  x.fillStyle = color; x.fillText(text, px, py);
  x.restore();
}

function bolts(x, px, py, w, h, inset = 10, r = 3.5) {
  for (const [bx, by] of [[px + inset, py + inset], [px + w - inset, py + inset], [px + inset, py + h - inset], [px + w - inset, py + h - inset]]) {
    x.fillStyle = 'rgba(0,0,0,0.55)'; x.beginPath(); x.arc(bx + 1, by + 1, r, 0, TAU); x.fill();
    x.fillStyle = 'rgba(150,165,162,0.35)'; x.beginPath(); x.arc(bx, by, r, 0, TAU); x.fill();
  }
}

// Boyalı metal panel yüzeyi (duvar ve mobilyalar için).
function metalPanel(x, px, py, w, h, base = ['#25302f', '#1a2221'], seed = 1) {
  x.fillStyle = lg(x, 0, py, 0, py + h, [[0, base[0]], [1, base[1]]]);
  x.fillRect(px, py, w, h);
  x.save(); x.translate(px, py);
  grime(x, w, h, Math.max(4, (w * h) / 40000), 'rgba(0,0,0,A)', Math.min(w, h) * 0.6, 0.2, seed);
  x.restore();
  x.strokeStyle = 'rgba(0,0,0,0.6)'; x.lineWidth = 2; x.strokeRect(px + 1, py + 1, w - 2, h - 2);
  x.strokeStyle = 'rgba(170,190,186,0.08)'; x.lineWidth = 1; x.strokeRect(px + 3, py + 3, w - 6, h - 6);
}

// ---------------------------------------------------------------- duvarlar

// Fütüristik krem oda yüzeyi: büyük, köşeleri yuvarlatılmış paneller; aralarında gömme ek
// yerleri; altta duvarın zemine kavisle indiği bant. Ölçek ~200 px = 1 m.
// cols: panel kenarlarının x konumları (px). Arka ve yan duvarlar aynı yüzeyi paylaşır.
function creamWall(x, W, H, cols, seed = 1) {
  const R = seeded(seed);
  const cove = 70, top = 10, seamY = Math.round(H * 0.22); // üstte yatay ek yeri
  x.fillStyle = '#b8b2a2'; x.fillRect(0, 0, W, H);           // ek yeri dibi (paneller arası)
  const panel = (px, py, w, h) => {
    // panel yüzü: yukarıdan hafif aydınlık, kenarlara doğru yumuşak gölge (bombeli his)
    x.save(); rr(x, px, py, w, h, 16); x.clip();
    x.fillStyle = lg(x, 0, py, 0, py + h, [[0, '#ddd7c6'], [0.5, '#e6e0cf'], [1, '#d8d1bf']]);
    x.fillRect(px, py, w, h);
    x.fillStyle = lg(x, px, 0, px + w, 0, [[0, 'rgba(90,80,60,0.12)'], [0.12, 'rgba(90,80,60,0)'], [0.88, 'rgba(90,80,60,0)'], [1, 'rgba(90,80,60,0.14)']]);
    x.fillRect(px, py, w, h);
    x.translate(px, py); // lekeler panelin kendi koordinatında
    grime(x, w, h, 3, 'rgba(120,105,75,A)', Math.min(w, h) * 0.7, 0.06, Math.floor(R() * 1000));
    x.restore();
    // kenar: üstte ince ışık, altta ince gölge
    x.save(); rr(x, px + 0.5, py + 0.5, w - 1, h - 1, 16);
    x.strokeStyle = 'rgba(255,252,240,0.55)'; x.lineWidth = 1.5; x.stroke(); x.restore();
    x.fillStyle = 'rgba(70,62,46,0.25)'; x.fillRect(px + 14, py + h - 2, w - 28, 2);
  };
  for (let i = 0; i < cols.length - 1; i++) {
    const px = cols[i] + 3, w = cols[i + 1] - cols[i] - 6;
    if (w < 40) continue;
    panel(px, top, w, seamY - top - 4);                 // üst şerit
    panel(px, seamY + 2, w, H - cove - seamY - 6);      // ana panel
  }
  // alt kavis: duvar zemine eğrilerek iner (aydınlıktan gölgeye geçen bant)
  const cy = H - cove;
  x.fillStyle = lg(x, 0, cy, 0, H, [[0, '#ddd6c4'], [0.35, '#cfc8b5'], [0.75, '#a9a290'], [1, '#7d776a']]);
  x.fillRect(0, cy, W, cove);
  x.fillStyle = 'rgba(255,252,240,0.5)'; x.fillRect(0, cy, W, 1.5);
  for (let i = 1; i < cols.length - 1; i++) { x.fillStyle = 'rgba(80,72,56,0.25)'; x.fillRect(cols[i] - 1, cy, 2, cove); }
  // genel kullanım izi ve ince toz
  grime(x, W, H, Math.max(4, W / 200), 'rgba(110,98,72,A)', 160, 0.05, seed + 7);
  grain(x, W, H, 6, seed + 11);
}

// Arka duvar (7.2 × 3.2 m). Ortada pencere için saydam boşluk ve krem, yuvarlak köşeli çerçeve.
export const WALL = { W: 1440, H: 640, win: { x: 340, y: 130, w: 760, h: 320 }, frame: 26 };
export function paintWall() {
  const { W, H, win, frame } = WALL;
  const c = mk(W, H), x = c.getContext('2d');
  creamWall(x, W, H, [0, 170, 300, 1140, 1270, 1440], 9);
  // pencere çerçevesi: panelin içine gömülü, yuvarlak köşeli krem çerçeve
  const fx = win.x - frame, fy = win.y - frame, fw = win.w + frame * 2, fh = win.h + frame * 2;
  x.save(); rr(x, fx - 6, fy - 6, fw + 12, fh + 12, 30); x.fillStyle = 'rgba(70,62,46,0.28)'; x.fill(); x.restore();
  x.save(); rr(x, fx, fy, fw, fh, 26);
  x.fillStyle = lg(x, 0, fy, 0, fy + fh, [[0, '#ebe5d4'], [0.5, '#e0d9c7'], [1, '#cbc4b1']]); x.fill();
  x.strokeStyle = 'rgba(255,252,240,0.6)'; x.lineWidth = 2; x.stroke(); x.restore();
  // camın oturduğu iç kenar: koyu, derin
  x.save(); rr(x, win.x - 6, win.y - 6, win.w + 12, win.h + 12, 12); x.fillStyle = '#5e584b'; x.fill(); x.restore();
  // camın yeri saydam
  x.clearRect(win.x, win.y, win.w, win.h);
  return c;
}

// Yan duvarlar: arka duvarla aynı krem panel yüzey.
export function paintSideWall() {
  const W = 1360, H = 640, c = mk(W, H), x = c.getContext('2d');
  creamWall(x, W, H, [0, 230, 460, 690, 920, 1150, 1360], 30);
  return c;
}

// Tavan: krem, büyük düz paneller; ince gömme ek yerleri.
export function paintCeiling() {
  const W = 1024, H = 1024, c = mk(W, H), x = c.getContext('2d');
  x.fillStyle = '#aaa494'; x.fillRect(0, 0, W, H);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    const px = i * 256 + 3, py = j * 256 + 3;
    x.save(); rr(x, px, py, 250, 250, 14); x.fillStyle = '#d6d0bf'; x.fill(); x.restore();
  }
  grime(x, W, H, 8, 'rgba(110,98,72,A)', 160, 0.06, 6);
  grain(x, W, H, 6, 5);
  return c;
}

// Gözlem camı: koyu yansıma çizgileri, kir; büyük ölçüde saydam.
export function paintGlass() {
  const W = 760, H = 320, c = mk(W, H), x = c.getContext('2d');
  x.fillStyle = 'rgba(30,50,52,0.28)'; x.fillRect(0, 0, W, H);
  x.globalCompositeOperation = 'lighter';
  for (const [a, w, o] of [[0.18, 70, 0.08], [0.33, 22, 0.06], [0.62, 110, 0.05], [0.8, 30, 0.07]]) {
    x.save(); x.translate(W * a, 0); x.rotate(0.32);
    x.fillStyle = lg(x, -w, 0, w, 0, [[0, 'rgba(170,200,196,0)'], [0.5, `rgba(170,200,196,${o})`], [1, 'rgba(170,200,196,0)']]);
    x.fillRect(-w, -60, w * 2, H * 2); x.restore();
  }
  // armatürün camdaki yansıması (üstte ince yatay şerit)
  x.fillStyle = lg(x, W * 0.25, 0, W * 0.75, 0, [[0, 'rgba(210,230,226,0)'], [0.5, 'rgba(210,230,226,0.16)'], [1, 'rgba(210,230,226,0)']]);
  x.fillRect(W * 0.2, 18, W * 0.6, 6);
  x.globalCompositeOperation = 'source-over';
  grime(x, W, H, 14, 'rgba(180,190,180,A)', 60, 0.05, 11);
  glassSign(x, t('room.glassSign'), W / 2, 40);
  return c;
}

// Camın üstüne boyanmış şablon yazı: geniş aralıklı ince harfler, şablon köprüleriyle
// kesik, boyası yer yer dökülmüş. Satırlar cx etrafında ortalı; py ilk satırın üstü.
function glassSign(x, lines, cx, py) {
  const size = 34, lead = 46;
  const c = mk(420, 140), y = c.getContext('2d');
  y.font = `400 ${size}px "Jost", "Plex Mono", sans-serif`;
  if ('letterSpacing' in y) y.letterSpacing = `${size * 0.42}px`;
  y.textBaseline = 'top'; y.textAlign = 'center'; y.fillStyle = 'rgba(214,224,220,0.82)';
  // harf aralığı son harften sonra da boşluk bırakır; ortalarken onu telafi et
  lines.forEach((l, i) => y.fillText(l, 210 + size * 0.21, 6 + i * lead));
  // şablon köprüleri ve dökülmüş boya
  const R = seeded(13);
  y.globalCompositeOperation = 'destination-out';
  for (let bx = 10; bx < 420; bx += 13 + R() * 9) { y.fillStyle = 'rgba(0,0,0,0.9)'; y.fillRect(bx, 0, 1.6, 140); }
  for (let i = 0; i < 160; i++) { y.fillStyle = `rgba(0,0,0,${0.3 + R() * 0.6})`; y.fillRect(R() * 420, R() * 140, 1 + R() * 3, 1 + R() * 2); }
  x.save(); x.globalAlpha = 0.85; x.drawImage(c, cx - 210, py, 420, 140); x.restore();
}

// ---------------------------------------------------------------- duvar objeleri

// Havalandırma ızgarası.
export function paintVent() {
  const W = 240, H = 140, c = mk(W, H), x = c.getContext('2d');
  metalPanel(x, 0, 0, W, H, ['#222c2c', '#161d1d'], 51);
  bolts(x, 0, 0, W, H, 10, 3.5);
  for (let i = 0; i < 9; i++) {
    const y = 22 + i * 11;
    x.fillStyle = '#040606'; x.fillRect(22, y, W - 44, 6);
    x.fillStyle = 'rgba(170,190,186,0.12)'; x.fillRect(22, y + 6, W - 44, 1.5);
  }
  return c;
}

// Güvenlik kamerası: tavana asılı siyah taret kamera, merceği bize (masaya ve oyuncuya)
// dönük; kablo ve ayak yok. Dokunun üst kenarı tavana değer. Kırmızı kayıt ışığı ayrı katman,
// yeri CAMERA_LED (doku pikseli).
export const CAMERA_LED = [166, 106];
export function paintWallCamera() {
  const W = 330, H = 228, c = mk(W, H), x = c.getContext('2d');
  const body = (x0, x1) => lg(x, x0, 0, x1, 0, [[0, '#0d0f0f'], [0.25, '#1f2323'], [0.6, '#363c3c'], [0.85, '#1a1d1d'], [1, '#090a0a']]);
  // tavana düşen gölge, taban halkası
  x.fillStyle = 'rgba(0,0,0,0.3)'; x.beginPath(); x.ellipse(166, 2, 64, 7, 0, 0, TAU); x.fill();
  x.fillStyle = body(114, 218); x.fillRect(114, 0, 104, 18);
  x.fillStyle = '#151818'; x.beginPath(); x.ellipse(166, 18, 52, 7, 0, 0, Math.PI); x.fill();
  x.strokeStyle = 'rgba(0,0,0,0.18)'; x.lineWidth = 1; x.beginPath(); x.ellipse(166, 18, 52, 7, 0, 0, Math.PI); x.stroke();
  // gövde (topla aynı genişlikte)
  x.fillStyle = body(118, 214); x.beginPath(); x.moveTo(118, 20); x.lineTo(214, 20); x.lineTo(214, 92); x.ellipse(166, 92, 48, 13, 0, 0, Math.PI); x.closePath(); x.fill();
  x.strokeStyle = 'rgba(255,255,255,0.08)'; x.beginPath(); x.moveTo(118, 36); x.lineTo(214, 36); x.stroke();
  x.fillStyle = 'rgba(255,255,255,0.1)'; x.fillRect(184, 22, 5, 64);
  // top: gövdenin altından ve önünden taşar
  const bx = 150, by = 124, br = 60;
  x.fillStyle = 'rgba(0,0,0,0.3)'; x.beginPath(); x.arc(bx + 4, by + 6, br, 0, TAU); x.fill();
  x.fillStyle = rg(x, bx - 22, by - 26, 4, bx, by, br, [[0, '#4c5353'], [0.5, '#232828'], [1, '#090b0b']]); x.beginPath(); x.arc(bx, by, br, 0, TAU); x.fill();
  x.strokeStyle = 'rgba(0,0,0,0.28)'; x.lineWidth = 6; x.beginPath(); x.arc(bx + 2, by + 2, br - 2, -Math.PI * 0.62, -Math.PI * 0.05); x.stroke();
  // parlak siyah ön yüz, ince açık halka
  const fx = 132, fy = 136;
  x.fillStyle = 'rgba(0,0,0,0.25)'; x.beginPath(); x.ellipse(fx + 2, fy + 3, 43, 45, -0.3, 0, TAU); x.fill();
  x.fillStyle = 'rgba(150,160,158,0.45)'; x.beginPath(); x.ellipse(fx, fy, 44, 46, -0.3, 0, TAU); x.fill();
  x.fillStyle = lg(x, fx - 40, fy - 40, fx + 40, fy + 40, [[0, '#202424'], [1, '#050606']]); x.beginPath(); x.ellipse(fx, fy, 41, 43, -0.3, 0, TAU); x.fill();
  // dikdörtgen mercek penceresi
  x.save(); x.translate(fx, fy); x.rotate(-0.12);
  x.fillStyle = '#121414'; rr(x, -27, -22, 54, 44, 6); x.fill();
  x.strokeStyle = 'rgba(255,255,255,0.12)'; x.lineWidth = 1.2; rr(x, -27, -22, 54, 44, 6); x.stroke();
  x.fillStyle = '#080909'; rr(x, -21, -17, 42, 34, 4); x.fill();
  x.restore();
  // mercek: bilezik, namlu, kaplamalı cam, halkalar, diyafram, lamba yansıması
  const r = 15;
  x.fillStyle = 'rgba(0,0,0,0.45)'; x.beginPath(); x.arc(fx + 2, fy + 3, r + 1, 0, TAU); x.fill();
  x.fillStyle = lg(x, fx - r, fy - r, fx + r, fy + r, [[0, '#5a6262'], [1, '#1c2020']]); x.beginPath(); x.arc(fx, fy, r, 0, TAU); x.fill();
  x.fillStyle = '#060808'; x.beginPath(); x.arc(fx, fy, r * 0.84, 0, TAU); x.fill();
  x.fillStyle = rg(x, fx - r * 0.2, fy - r * 0.25, 0, fx, fy, r * 0.7, [[0, '#28494a'], [0.55, '#0e1d1e'], [1, '#040707']]); x.beginPath(); x.arc(fx, fy, r * 0.7, 0, TAU); x.fill();
  x.strokeStyle = 'rgba(130,170,165,0.25)'; x.lineWidth = 1;
  for (const k of [0.62, 0.48]) { x.beginPath(); x.arc(fx, fy, r * k, 0, TAU); x.stroke(); }
  x.fillStyle = '#020303'; x.beginPath(); x.arc(fx, fy, r * 0.24, 0, TAU); x.fill();
  x.strokeStyle = 'rgba(235,245,240,0.6)'; x.lineWidth = 1.4; x.beginPath(); x.arc(fx, fy, r * 0.56, Math.PI * 1.08, Math.PI * 1.42); x.stroke();
  x.fillStyle = 'rgba(240,248,244,0.75)'; x.beginPath(); x.arc(fx - r * 0.3, fy - r * 0.32, r * 0.08, 0, TAU); x.fill();
  // marka
  x.save(); x.font = 'italic 600 13px "Source Sans 3", sans-serif'; if ('letterSpacing' in x) x.letterSpacing = '0.5px';
  x.fillStyle = 'rgba(190,198,196,0.6)'; x.fillText(t('kasa.maker'), 126, 31); x.restore();
  // kayıt ışığı yuvası
  const [lx, ly] = CAMERA_LED;
  x.fillStyle = '#050606'; x.beginPath(); x.arc(lx, ly, 4.5, 0, TAU); x.fill();
  x.fillStyle = 'rgba(160,40,30,0.55)'; x.beginPath(); x.arc(lx, ly, 2.6, 0, TAU); x.fill();
  return c;
}

// Floresan armatür (alttan görünüş, 3.0 × 0.36 m). Tüpler parlak; ışık oyunda hesaplanır.
export function paintLamp() {
  const W = 1200, H = 144, c = mk(W, H), x = c.getContext('2d');
  x.fillStyle = '#1a1f1f'; rr(x, 0, 0, W, H, 8); x.fill();
  x.fillStyle = '#d8ddd6'; rr(x, 14, 14, W - 28, H - 28, 4); x.fill();            // yansıtıcı iç yüzey
  x.fillStyle = 'rgba(0,0,0,0.2)'; x.fillRect(14, H / 2 - 3, W - 28, 6);
  // iki tüp (biri bir ucunda kararmış: yaşlı)
  for (const [ty, dark] of [[44, 0], [100, 1]]) {
    x.fillStyle = lg(x, 0, ty - 14, 0, ty + 14, [[0, '#f2f6f0'], [0.5, '#ffffff'], [1, '#e6ece6']]);
    rr(x, 40, ty - 14, W - 80, 28, 14); x.fill();
    if (dark) {
      x.fillStyle = lg(x, 40, 0, 260, 0, [[0, 'rgba(70,72,66,0.85)'], [1, 'rgba(70,72,66,0)']]);
      rr(x, 40, ty - 14, 220, 28, 14); x.fill();
    }
    x.fillStyle = '#8a8f8a'; x.fillRect(30, ty - 16, 14, 32); x.fillRect(W - 44, ty - 16, 14, 32);
  }
  // ızgara çubukları
  x.fillStyle = 'rgba(40,46,46,0.5)';
  for (let i = 1; i < 12; i++) x.fillRect((W * i) / 12 - 2, 14, 4, H - 28);
  return c;
}

// ---------------------------------------------------------------- masa

// Masa üstü: koyu kömür metal, aşınmış kenarlar, çizikler (4 × 3 m, tepeden).
export function paintDesk() {
  const W = 1024, H = 768, c = mk(W, H), x = c.getContext('2d');
  x.fillStyle = lg(x, 0, 0, 0, H, [[0, '#2a3131'], [0.5, '#262d2d'], [1, '#1e2424']]);
  x.fillRect(0, 0, W, H);
  const R = seeded(21);
  for (let i = 0; i < 220; i++) {
    const px = R() * W, py = R() * H, l = 20 + R() * 140, a = (R() - 0.5) * 0.5;
    x.strokeStyle = `rgba(${R() < 0.5 ? '190,205,200' : '0,0,0'},${0.03 + R() * 0.05})`; x.lineWidth = 1;
    x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke();
  }
  // kenar şeridi ve aşınma
  x.strokeStyle = 'rgba(160,175,170,0.12)'; x.lineWidth = 6; x.strokeRect(6, 6, W - 12, H - 12);
  x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillRect(W * 0.5 - 1, 0, 2, H);
  // kupa ve kül izleri
  x.strokeStyle = 'rgba(120,100,70,0.12)'; x.lineWidth = 4;
  x.beginPath(); x.ellipse(W * 0.84, H * 0.52, 26, 26, 0, 0.3, Math.PI * 1.8); x.stroke();
  x.fillStyle = 'rgba(150,150,140,0.05)'; x.beginPath(); x.ellipse(W * 0.72, H * 0.8, 50, 22, 0, 0, TAU); x.fill();
  grime(x, W, H, 50, 'rgba(0,0,0,A)', 140, 0.2, 8);
  grain(x, W, H, 10, 6);
  return c;
}

// Masanın uzak kenarı (dikey şerit).
export function paintDeskEdge() {
  const W = 512, H = 32, c = mk(W, H), x = c.getContext('2d');
  x.fillStyle = lg(x, 0, 0, 0, H, [[0, '#4a5454'], [0.25, '#1d2424'], [1, '#0a0e0e']]);
  x.fillRect(0, 0, W, H);
  return c;
}

// Masanın solundaki dosyalar, test formu ve kalem: papers.js
export { paintFiles, paintSheet, paintPen } from './papers.js';

// Sade metal kupa (önden, hafif yukarıdan).
export function paintMug() {
  const W = 226, H = 240, c = mk(W, H), x = c.getContext('2d');
  const L = 14, R = 176, M = (L + R) / 2, RX = (R - L) / 2;
  // kulp
  x.strokeStyle = '#2a3131'; x.lineWidth = 16;
  x.beginPath(); x.ellipse(R + 4, 120, 26, 48, 0, -Math.PI / 2, Math.PI / 2); x.stroke();
  // gövde
  x.fillStyle = lg(x, L, 0, R, 0, [[0, '#1a2020'], [0.3, '#4e5858'], [0.45, '#7a8483'], [0.6, '#3a4343'], [1, '#141919']]);
  x.fillRect(L, 30, R - L, 196);
  x.beginPath(); x.ellipse(M, 226, RX, 13, 0, 0, Math.PI); x.fill();
  // ağız
  x.fillStyle = '#5c6666'; x.beginPath(); x.ellipse(M, 30, RX, 16, 0, 0, TAU); x.fill();
  x.fillStyle = '#0c0f0f'; x.beginPath(); x.ellipse(M, 31, RX - 7, 12, 0, 0, TAU); x.fill();
  stencil(x, t('room.mug'), M - 18, 150, { size: 22, color: 'rgba(170,185,180,0.25)', font: 'Plex Mono', weight: 600 });
  return c;
}

// Küçük yuvarlak küllük + sigara (yandan, hafif yukarıdan).
export function paintAshtray() {
  const W = 256, H = 128, c = mk(W, H), x = c.getContext('2d');
  x.fillStyle = lg(x, 0, 60, 0, 128, [[0, '#2a3131'], [1, '#090c0c']]);
  x.beginPath(); x.ellipse(W / 2, 92, 104, 30, 0, 0, TAU); x.fill();
  x.fillStyle = '#050707';
  x.beginPath(); x.ellipse(W / 2, 80, 82, 16, 0, 0, TAU); x.fill();
  x.strokeStyle = 'rgba(190,210,205,0.3)'; x.lineWidth = 3;
  x.beginPath(); x.ellipse(W / 2, 80, 102, 22, 0, Math.PI * 1.05, Math.PI * 1.95); x.stroke();
  x.lineCap = 'round';
  x.strokeStyle = '#d9d3c2'; x.lineWidth = 9;
  x.beginPath(); x.moveTo(90, 80); x.lineTo(200, 58); x.stroke();
  x.strokeStyle = '#b88a52';
  x.beginPath(); x.moveTo(90, 80); x.lineTo(112, 76); x.stroke();
  x.strokeStyle = '#4a4440'; x.lineWidth = 8;
  x.beginPath(); x.moveTo(198, 58); x.lineTo(206, 56.5); x.stroke();
  return c;
}

// Kompakt kaset ses kaydedici (önden).
export function paintCassettePlayer() {
  const W = 512, H = 200, c = mk(W, H), x = c.getContext('2d');
  x.fillStyle = lg(x, 0, 0, 0, H, [[0, '#2b3536'], [0.15, '#151c1d'], [1, '#080c0d']]);
  rr(x, 6, 20, W - 12, H - 26, 12); x.fill();
  x.fillStyle = 'rgba(200,230,225,0.12)'; x.fillRect(14, 22, W - 28, 3);
  x.fillStyle = '#060909'; rr(x, 40, 52, 260, 110, 6); x.fill();
  x.fillStyle = '#c9c1aa'; rr(x, 54, 64, 232, 86, 4); x.fill();
  x.fillStyle = '#1a1714';
  for (const cx of [114, 226]) { x.beginPath(); x.arc(cx, 106, 26, 0, TAU); x.fill(); }
  for (let i = 0; i < 5; i++) { x.fillStyle = i === 0 ? '#5a2018' : '#a9ada4'; rr(x, 330 + i * 32, 60, 26, 40, 3); x.fill(); }
  x.fillStyle = '#040707';
  for (let r = 0; r < 4; r++) for (let q = 0; q < 10; q++) { x.beginPath(); x.arc(334 + q * 15, 122 + r * 12, 2.4, 0, TAU); x.fill(); }
  return c;
}

// Ön plan: oyuncunun önündeki sorgu sandalyesinin sırtı (alt kenarda silüet).
export function paintChairFront() {
  const W = 500, H = 375, c = mk(W, H), x = c.getContext('2d');
  x.fillStyle = lg(x, 0, 0, 0, H, [[0, '#0b1010'], [1, '#030505']]);
  rr(x, 40, 20, W - 80, H + 40, 70); x.fill();
  x.strokeStyle = 'rgba(150,175,170,0.12)'; x.lineWidth = 4;
  x.beginPath(); x.moveTo(110, 26); x.quadraticCurveTo(W / 2, 14, W - 110, 26); x.stroke();
  x.strokeStyle = 'rgba(0,0,0,0.5)'; x.lineWidth = 3;
  for (const f of [0.36, 0.64]) { x.beginPath(); x.moveTo(W * f, 50); x.lineTo(W * f, H); x.stroke(); }
  return c;
}

// Yumuşak duman/toz parçacığı.
export function paintPuff() {
  const S = 128, c = mk(S, S), x = c.getContext('2d');
  const g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.45, 'rgba(255,255,255,0.35)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, S, S);
  return c;
}
