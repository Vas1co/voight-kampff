// Oda katmanları için prosedürel yer tutucular. Her fonksiyon bir canvas döndürür.
// Gerçek görseller assets/images/room/<ad>.png olarak konduğunda bunların yerini alır
// (dosya adları ve boyutlar için docs/ASSETS.md, düzenleme için tasarim/OKU.md).
//
// Ölçek: duvarlarda ~200 px = 1 m (dışa aktarımda 2×).
// Palet: koyu kömür metal, doygunluğu düşük teal-gri duvar, soluk krem kâğıt,
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

// Arka duvar (7.2 × 3.2 m). Ortada gözlem camı için saydam boşluk ve kalın metal çerçeve.
export const WALL = { W: 1440, H: 640, win: { x: 340, y: 130, w: 760, h: 320 }, frame: 26 };
export function paintWall() {
  const { W, H, win, frame } = WALL;
  const c = mk(W, H), x = c.getContext('2d');
  // dikey panel sırası
  const R = seeded(9);
  const cols = [0, 150, 300, 340, 1100, 1140, 1290, 1440];
  x.fillStyle = lg(x, 0, 0, 0, H, [[0, '#141b1b'], [0.4, '#1f2a2a'], [0.85, '#1a2323'], [1, '#0c1111']]);
  x.fillRect(0, 0, W, H);
  for (let i = 0; i < cols.length - 1; i++) {
    const px = cols[i], w = cols[i + 1] - cols[i];
    if (w < 60) continue;
    metalPanel(x, px + 2, 6, w - 4, H - 70, ['#253131', '#1b2424'], 10 + i);
  }
  // yatay bant ve süpürgelik
  x.fillStyle = '#0d1313'; x.fillRect(0, H - 62, W, 62);
  x.fillStyle = 'rgba(170,190,186,0.08)'; x.fillRect(0, H - 62, W, 2);
  x.fillStyle = '#121919'; x.fillRect(0, 0, W, 8);
  // gözlem camı: kalın çerçeve
  const fx = win.x - frame, fy = win.y - frame, fw = win.w + frame * 2, fh = win.h + frame * 2;
  x.fillStyle = 'rgba(0,0,0,0.5)'; x.fillRect(fx + 6, fy + 8, fw, fh);
  x.fillStyle = lg(x, 0, fy, 0, fy + fh, [[0, '#3a4544'], [0.5, '#262f2f'], [1, '#161c1c']]);
  x.fillRect(fx, fy, fw, fh);
  x.strokeStyle = 'rgba(190,210,205,0.18)'; x.lineWidth = 2; x.strokeRect(fx + 2, fy + 2, fw - 4, fh - 4);
  x.strokeStyle = 'rgba(0,0,0,0.7)'; x.lineWidth = 4; x.strokeRect(win.x - 3, win.y - 3, win.w + 6, win.h + 6);
  for (let i = 0; i < 10; i++) {
    const bx = fx + 14 + (i * (fw - 28)) / 9;
    for (const by of [fy + 12, fy + fh - 12]) { x.fillStyle = 'rgba(160,175,170,0.3)'; x.beginPath(); x.arc(bx, by, 3, 0, TAU); x.fill(); }
  }
  // yaşlanma
  grime(x, W, H, 40, 'rgba(0,0,0,A)', 160, 0.22, 4);
  for (let i = 0; i < 26; i++) {
    const px = R() * W, py = 40 + R() * (H - 120);
    x.strokeStyle = `rgba(0,0,0,${0.08 + R() * 0.12})`; x.lineWidth = 1 + R() * 2;
    x.beginPath(); x.moveTo(px, py); x.lineTo(px + (R() - 0.5) * 6, py + 20 + R() * 60); x.stroke();
  }
  grain(x, W, H, 10, 2);
  // camın yeri saydam
  x.clearRect(win.x, win.y, win.w, win.h);
  return c;
}

// Yan duvarlar (koridor gibi derinliğe uzanan koyu paneller).
export function paintSideWall() {
  const W = 1360, H = 640, c = mk(W, H), x = c.getContext('2d');
  x.fillStyle = '#0e1414'; x.fillRect(0, 0, W, H);
  for (let i = 0; i < 8; i++) metalPanel(x, i * 170 + 2, 6, 166, H - 70, ['#1b2424', '#121919'], 30 + i);
  x.fillStyle = '#0a0f0f'; x.fillRect(0, H - 62, W, 62);
  grain(x, W, H, 8, 3);
  return c;
}

// Tavan: koyu, ince panel çizgileri.
export function paintCeiling() {
  const W = 1024, H = 1024, c = mk(W, H), x = c.getContext('2d');
  x.fillStyle = '#0d1212'; x.fillRect(0, 0, W, H);
  x.strokeStyle = 'rgba(0,0,0,0.6)'; x.lineWidth = 3;
  for (let i = 0; i <= 8; i++) { x.beginPath(); x.moveTo(i * 128, 0); x.lineTo(i * 128, H); x.stroke(); x.beginPath(); x.moveTo(0, i * 128); x.lineTo(W, i * 128); x.stroke(); }
  grain(x, W, H, 8, 5);
  return c;
}

// Gözlem camının arkasındaki loş bitişik oda (arka duvar).
export function paintBehindRoom() {
  const W = 1200, H = 640, c = mk(W, H), x = c.getContext('2d');
  x.fillStyle = lg(x, 0, 0, 0, H, [[0, '#0b1112'], [0.45, '#162324'], [0.8, '#101818'], [1, '#070b0b']]);
  x.fillRect(0, 0, W, H);
  // ortada tek, zayıf tavan ışığının duvara düşen lekesi
  x.fillStyle = rg(x, W / 2, H * 0.2, 10, W / 2, H * 0.35, W * 0.4, [[0, 'rgba(120,160,155,0.28)'], [1, 'rgba(120,160,155,0)']]);
  x.fillRect(0, 0, W, H);
  for (let i = 0; i < 7; i++) { x.fillStyle = 'rgba(0,0,0,0.3)'; x.fillRect(i * 180 + 90, 0, 3, H); }
  x.fillStyle = '#050808'; x.fillRect(0, H - 90, W, 90);
  grain(x, W, H, 10, 6);
  return c;
}

// Camın arkasındaki boş sorgu sandalyesi (silüet).
export function paintEmptyChair() {
  const W = 320, H = 580, c = mk(W, H), x = c.getContext('2d');
  const ink = '#070b0b';
  x.fillStyle = ink;
  rr(x, 50, 20, 220, 300, 22); x.fill();            // yüksek sırt
  x.fillRect(40, 330, 240, 40);                      // oturak
  x.fillRect(30, 300, 24, 90); x.fillRect(266, 300, 24, 90); // kolçaklar
  x.fillRect(150, 370, 20, 140);                     // ayak
  x.fillRect(70, 500, 180, 14);                      // taban
  x.fillStyle = 'rgba(130,165,160,0.12)';            // üstten gelen zayıf ışık
  x.fillRect(56, 22, 208, 3);
  x.fillRect(42, 330, 236, 2);
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
  return c;
}

// ---------------------------------------------------------------- duvar objeleri

// Metal kapı: tel camlı pencere (arkasında koridordan gözetleyen bir siluet), kol,
// soluk boya yazı (0.95 × 2.15 m).
export function paintDoor() {
  const W = 380, H = 860, c = mk(W, H), x = c.getContext('2d');
  // kasa
  x.fillStyle = '#0c1111'; x.fillRect(0, 0, W, H);
  x.fillStyle = lg(x, 0, 0, W, 0, [[0, '#1a2222'], [0.5, '#2a3434'], [1, '#161d1d']]);
  x.fillRect(16, 16, W - 32, H - 16);
  // kapı kanadı
  metalPanel(x, 30, 30, W - 60, H - 30, ['#2b3636', '#1d2626'], 21);
  // takviye panelleri
  for (const [py, ph] of [[70, 260], [560, 230]]) {
    x.strokeStyle = 'rgba(0,0,0,0.45)'; x.lineWidth = 3; x.strokeRect(54, py, W - 108, ph);
    x.strokeStyle = 'rgba(170,190,186,0.08)'; x.lineWidth = 1; x.strokeRect(57, py + 3, W - 114, ph - 6);
  }
  // pencere: koridor ışığı, gözetleyen siluet, tel cam
  const wx = W / 2 - 50, wy = 92, ww = 100, wh = 216;
  x.fillStyle = '#050707'; rr(x, wx - 8, wy - 8, ww + 16, wh + 16, 5); x.fill();
  x.save();
  rr(x, wx, wy, ww, wh, 3); x.clip();
  x.fillStyle = lg(x, 0, wy, 0, wy + wh, [[0, '#6a7868'], [0.4, '#3c4740'], [1, '#161d19']]);
  x.fillRect(wx, wy, ww, wh);
  x.fillStyle = rg(x, wx + ww * 0.7, wy - 10, 4, wx + ww * 0.7, wy - 10, 120, [[0, 'rgba(215,205,165,0.5)'], [1, 'rgba(215,205,165,0)']]);
  x.fillRect(wx, wy, ww, wh);
  // siluet: kenardan içeri bakan baş ve omuz (arkadan aydınlık, önü karanlık)
  const hx = wx + ww * 0.36, hy = wy + 92;
  x.fillStyle = '#050706';
  x.beginPath(); x.ellipse(hx, hy, 25, 31, -0.08, 0, TAU); x.fill();
  x.beginPath(); x.moveTo(hx - 12, hy + 24); x.lineTo(hx - 14, hy + 44); x.lineTo(hx + 12, hy + 44); x.lineTo(hx + 10, hy + 24); x.fill();
  x.beginPath();
  x.moveTo(wx - 4, wy + wh); x.lineTo(wx - 4, hy + 62);
  x.quadraticCurveTo(hx - 34, hy + 40, hx - 10, hy + 42);
  x.lineTo(hx + 12, hy + 42); x.quadraticCurveTo(hx + 44, hy + 46, hx + 58, hy + 76);
  x.lineTo(hx + 70, wy + wh); x.closePath(); x.fill();
  // saç ve omuz kenarında arka ışık
  x.strokeStyle = 'rgba(190,200,170,0.22)'; x.lineWidth = 2;
  x.beginPath(); x.ellipse(hx, hy, 25, 31, -0.08, Math.PI * 1.15, Math.PI * 1.85); x.stroke();
  x.beginPath(); x.moveTo(hx + 14, hy + 43); x.quadraticCurveTo(hx + 44, hy + 47, hx + 58, hy + 76); x.stroke();
  // gözlerde belli belirsiz parıltı
  x.fillStyle = 'rgba(210,220,200,0.32)';
  x.fillRect(hx - 11, hy - 1, 4, 2); x.fillRect(hx + 7, hy - 2, 4, 2);
  // tel cam ve yansıma
  x.strokeStyle = 'rgba(150,175,170,0.13)'; x.lineWidth = 1;
  x.beginPath();
  for (let d = -wh; d < ww + wh; d += 14) { x.moveTo(wx + d, wy); x.lineTo(wx + d + wh, wy + wh); x.moveTo(wx + d, wy); x.lineTo(wx + d - wh, wy + wh); }
  x.stroke();
  x.fillStyle = lg(x, wx, wy, wx + ww, wy + wh, [[0, 'rgba(160,200,195,0)'], [0.42, 'rgba(160,200,195,0.1)'], [0.5, 'rgba(160,200,195,0.02)'], [1, 'rgba(160,200,195,0.06)']]);
  x.fillRect(wx, wy, ww, wh);
  x.restore();
  x.strokeStyle = 'rgba(170,190,186,0.14)'; x.lineWidth = 1.5; rr(x, wx - 8, wy - 8, ww + 16, wh + 16, 5); x.stroke();
  // kol
  x.fillStyle = '#0a0e0e'; rr(x, W - 92, 420, 22, 90, 4); x.fill();
  x.fillStyle = lg(x, 0, 445, 0, 470, [[0, '#7a8584'], [1, '#2f3838']]); rr(x, W - 140, 448, 70, 18, 7); x.fill();
  // soluk boya yazı
  const sign = t('room.doorSign');
  stencil(x, sign[0], W / 2, 400, { size: 96, align: 'center', color: 'rgba(160,178,174,0.2)', spacing: 0.2 });
  stencil(x, sign[1], W / 2, 444, { size: 26, align: 'center', color: 'rgba(160,178,174,0.24)', weight: 600, spacing: 0.12 });
  stencil(x, t('room.doorStencil'), W / 2, 760, { size: 18, align: 'center', color: 'rgba(160,178,174,0.16)', weight: 600, spacing: 0.25 });
  grain(x, W, H, 10, 22);
  return c;
}

// Kapı yanındaki küçük erişim paneli (yeşil gösterge ışığı ayrı katman).
export function paintAccessPanel() {
  const W = 128, H = 192, c = mk(W, H), x = c.getContext('2d');
  metalPanel(x, 4, 4, W - 8, H - 8, ['#232d2d', '#161d1d'], 31);
  bolts(x, 4, 4, W - 8, H - 8, 12, 4);
  x.fillStyle = '#050707'; rr(x, 36, 30, 56, 34, 4); x.fill();      // gösterge yuvası
  for (let r = 0; r < 3; r++) for (let q = 0; q < 3; q++) { x.fillStyle = '#0b0f0f'; rr(x, 30 + q * 24, 84 + r * 26, 18, 18, 3); x.fill(); x.fillStyle = 'rgba(170,190,186,0.12)'; x.fillRect(31 + q * 24, 85 + r * 26, 16, 2); }
  stencil(x, t('room.panel'), W / 2, 176, { size: 12, align: 'center', color: 'rgba(160,178,174,0.35)', weight: 600, spacing: 0.2, font: 'Plex Mono' });
  return c;
}

// Metal dosya dolabı (0.8 × 1.35 m), önden.
export function paintCabinet() {
  const W = 320, H = 540, c = mk(W, H), x = c.getContext('2d');
  x.fillStyle = 'rgba(0,0,0,0.5)'; x.fillRect(8, 10, W - 8, H - 10);
  metalPanel(x, 0, 0, W - 6, H - 6, ['#2a3434', '#1c2424'], 41);
  const labels = t('room.cabinet');
  for (let i = 0; i < 3; i++) {
    const dy = 22 + i * 170;
    x.fillStyle = lg(x, 0, dy, 0, dy + 150, [[0, '#2e3939'], [1, '#202929']]);
    x.fillRect(16, dy, W - 38, 150);
    x.strokeStyle = 'rgba(0,0,0,0.6)'; x.lineWidth = 2; x.strokeRect(16, dy, W - 38, 150);
    x.fillStyle = '#d6cfb8'; x.fillRect(W / 2 - 40, dy + 24, 72, 26);      // etiket kartı
    x.fillStyle = '#4a463c'; x.font = '700 16px "Courier Prime", monospace'; x.textAlign = 'center';
    x.fillText(labels[i + 1], W / 2 - 4, dy + 43);
    x.fillStyle = lg(x, 0, dy + 70, 0, dy + 86, [[0, '#7a8584'], [1, '#2d3535']]);
    rr(x, W / 2 - 44, dy + 70, 80, 16, 6); x.fill();                        // kulp
  }
  x.textAlign = 'left';
  grain(x, W, H, 10, 42);
  return c;
}

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

// Soluk prosedür tabelası.
export function paintSign() {
  const W = 330, H = 228, c = mk(W, H), x = c.getContext('2d');
  x.fillStyle = '#b9b39d'; rr(x, 4, 4, W - 8, H - 8, 6); x.fill();
  x.fillStyle = 'rgba(30,40,40,0.18)'; x.fillRect(4, 4, W - 8, H - 8);
  x.fillStyle = '#2e3434'; x.fillRect(4, 4, W - 8, 40);
  const lines = t('room.sign');
  x.fillStyle = '#c9c3ad'; x.font = '700 17px "Plex Mono", monospace'; x.fillText(lines[0], 16, 31);
  x.fillStyle = 'rgba(40,44,40,0.75)'; x.font = '400 15px "Courier Prime", monospace';
  lines.slice(1).forEach((l, i) => x.fillText(l, 16, 78 + i * 34));
  grime(x, W, H, 18, 'rgba(60,50,30,A)', 70, 0.22, 52);
  bolts(x, 4, 4, W - 8, H - 8, 10, 3);
  grain(x, W, H, 12, 53);
  return c;
}

// Güvenlik kamerası: duvara monte, aşağı ve masaya bakar (kırmızı kayıt ışığı ayrı katman).
export function paintWallCamera() {
  const W = 330, H = 228, c = mk(W, H), x = c.getContext('2d');
  // duvar ayağı
  x.fillStyle = '#1b2222'; rr(x, W - 70, 20, 56, 90, 6); x.fill();
  x.strokeStyle = '#141a1a'; x.lineWidth = 16; x.lineCap = 'round';
  x.beginPath(); x.moveTo(W - 44, 70); x.lineTo(W - 110, 100); x.stroke();
  // gövde (aşağı eğik)
  // gövde aşağı ve sola, masaya doğru eğik (mercek sol alt uçta)
  x.save(); x.translate(150, 120); x.rotate(-0.38);
  x.fillStyle = lg(x, 0, -40, 0, 40, [[0, '#3a4444'], [0.5, '#242c2c'], [1, '#111616']]);
  rr(x, -120, -38, 220, 76, 10); x.fill();
  x.fillStyle = '#0c1010'; rr(x, -138, -32, 26, 64, 6); x.fill();             // ön başlık
  x.fillStyle = '#050707'; x.beginPath(); x.arc(-128, 0, 22, 0, TAU); x.fill(); // lens
  x.fillStyle = rg(x, -134, -6, 0, -128, 0, 20, [[0, 'rgba(120,160,160,0.6)'], [0.4, 'rgba(30,50,50,0.4)'], [1, 'rgba(0,0,0,0)']]);
  x.beginPath(); x.arc(-128, 0, 20, 0, TAU); x.fill();
  x.fillStyle = '#0a0d0d'; x.fillRect(-40, -46, 120, 10);                       // güneşlik
  x.fillStyle = '#1a0605'; x.beginPath(); x.arc(40, -20, 6, 0, TAU); x.fill();  // kayıt ışığı yuvası
  x.restore();
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

// Dağınık test dosyaları yığını ve manila klasörler (önden, hafif yukarıdan; 0.6 × 0.26 m).
export function paintFiles() {
  const W = 480, H = 208, c = mk(W, H), x = c.getContext('2d');
  const R = seeded(61);
  const layers = 9;
  for (let i = 0; i < layers; i++) {
    const y = H - 28 - i * 15, sk = (R() - 0.5) * 18, w = 380 + R() * 40;
    const manila = i % 3 === 1;
    // ön kalınlık
    x.fillStyle = manila ? '#8d7448' : '#b9b3a0';
    x.fillRect(40 + sk, y, w, 14);
    x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillRect(40 + sk, y + 12, w, 2);
    if (i === layers - 1) {
      // üst yüz (kısaltılmış perspektif)
      x.fillStyle = manila ? '#c4a56c' : '#d6d0bc';
      x.beginPath(); x.moveTo(40 + sk, y); x.lineTo(70 + sk, y - 52); x.lineTo(70 + sk + w - 10, y - 52); x.lineTo(40 + sk + w, y); x.closePath(); x.fill();
      x.fillStyle = 'rgba(60,55,45,0.45)';
      for (let k = 0; k < 4; k++) x.fillRect(110 + sk, y - 42 + k * 9, 140 + R() * 120, 3);
      x.fillStyle = '#3a372f'; x.font = '700 15px "Courier Prime", monospace';
      x.fillText(t('room.files'), 110 + sk, y - 14);
    }
  }
  // dışarı taşan kâğıt köşeleri
  for (let i = 0; i < 6; i++) { x.fillStyle = '#ddd7c4'; x.fillRect(30 + R() * 380, 60 + R() * 120, 30 + R() * 30, 4); }
  grain(x, W, H, 10, 62);
  return c;
}

// Basılı test verisi sayfası (tepeden, 0.3 × 0.4 m).
export function paintSheet() {
  const W = 300, H = 400, c = mk(W, H), x = c.getContext('2d');
  x.fillStyle = '#d9d3c0'; x.fillRect(0, 0, W, H);
  x.fillStyle = '#3a3830'; x.font = '700 18px "Courier Prime", monospace'; x.fillText(t('room.sheet'), 22, 38);
  x.strokeStyle = 'rgba(40,40,36,0.45)'; x.lineWidth = 1.5; x.strokeRect(20, 52, W - 40, 150);
  const R = seeded(71);
  x.strokeStyle = 'rgba(40,40,36,0.6)'; x.lineWidth = 1.5; x.beginPath();
  for (let i = 0; i <= 50; i++) { const px = 24 + (i / 50) * (W - 48), py = 128 + Math.sin(i * 0.7) * 20 * R() + (R() - 0.5) * 30; i ? x.lineTo(px, py) : x.moveTo(px, py); }
  x.stroke();
  x.fillStyle = 'rgba(40,40,36,0.5)';
  for (let y = 224; y < H - 24; y += 18) x.fillRect(22, y, 80 + R() * (W - 130), 5);
  grime(x, W, H, 8, 'rgba(90,70,40,A)', 60, 0.12, 72);
  grain(x, W, H, 10, 73);
  return c;
}

// Siyah tükenmez kalem (tepeden).
export function paintPen() {
  const W = 340, H = 24, c = mk(W, H), x = c.getContext('2d');
  x.fillStyle = lg(x, 0, 2, 0, 22, [[0, '#3a3f40'], [0.4, '#121515'], [1, '#050606']]);
  rr(x, 20, 4, 290, 16, 8); x.fill();
  x.fillStyle = '#9aa09a'; x.beginPath(); x.moveTo(310, 6); x.lineTo(336, 12); x.lineTo(310, 18); x.closePath(); x.fill();
  x.fillStyle = '#6e7470'; x.fillRect(40, 2, 70, 5);
  return c;
}

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
