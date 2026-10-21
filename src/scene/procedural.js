// Oda katmanları için prosedürel yer tutucular. Her fonksiyon bir canvas döndürür.
// Gerçek görseller assets/images/room/ altına konduğunda bunların yerini alır
// (dosya adları ve boyutlar için docs/ASSETS.md).
import { mk, rr, lg, rg, seeded, grain, grime } from './paint.js';

// Arka duvar: 14 × 6 m düzlem. Ortada pencere (ayrı katman), yanlarda ahşap çıtalar.
export function paintWall() {
  const W = 2048, H = 880, c = mk(W, H), x = c.getContext('2d');
  x.fillStyle = lg(x, 0, 0, 0, H, [[0, '#071012'], [0.18, '#0c1b1d'], [0.45, '#1d3c3e'], [0.7, '#183234'], [1, '#081314']]);
  x.fillRect(0, 0, W, H);
  // orta panel biraz daha açık (ışık alan sıva)
  x.fillStyle = rg(x, W / 2, H * 0.38, 40, W / 2, H * 0.45, W * 0.42, [[0, 'rgba(70,120,118,0.55)'], [1, 'rgba(70,120,118,0)']]);
  x.fillRect(0, 0, W, H);
  // ahşap çıtalı yan paneller
  const R = seeded(9);
  for (const side of [0, 1]) {
    const x0 = side ? W * 0.76 : 0, x1 = side ? W : W * 0.24;
    x.fillStyle = side ? lg(x, x0, 0, x1, 0, [[0, 'rgba(10,22,23,0.2)'], [1, 'rgba(3,8,9,0.85)']]) : lg(x, x0, 0, x1, 0, [[0, 'rgba(3,8,9,0.85)'], [1, 'rgba(10,22,23,0.2)']]);
    x.fillRect(x0, 0, x1 - x0, H);
    for (let y = 40; y < H; y += 26 + R() * 4) {
      x.fillStyle = 'rgba(150,190,186,0.05)';
      x.fillRect(x0, y, x1 - x0, 2);
      x.fillStyle = 'rgba(0,0,0,0.25)';
      x.fillRect(x0, y + 2, x1 - x0, 3);
    }
  }
  // dikey panel derzleri
  x.fillStyle = 'rgba(0,0,0,0.28)';
  for (const fx of [0.24, 0.39, 0.61, 0.76]) x.fillRect(W * fx - 2, H * 0.42, 4, H);
  // süpürgelik
  x.fillStyle = 'rgba(0,0,0,0.55)';
  x.fillRect(0, H * 0.93, W, H * 0.07);
  grime(x, W, H, 60, 'rgba(0,0,0,A)', 140, 0.18, 4);
  grain(x, W, H, 10, 2);
  return c;
}

// Pencere: aşırı parlak şerit; birkaç kiriş ve kir.
export function paintWindow() {
  const W = 1024, H = 112, c = mk(W, H), x = c.getContext('2d');
  x.fillStyle = lg(x, 0, 0, 0, H, [[0, '#fffaf0'], [0.6, '#f3efe2'], [1, '#d9dccf']]);
  x.fillRect(0, 0, W, H);
  x.fillStyle = rg(x, W * 0.5, H * 0.4, 10, W * 0.5, H * 0.4, W * 0.6, [[0, 'rgba(255,255,255,0)'], [1, 'rgba(150,170,165,0.35)']]);
  x.fillRect(0, 0, W, H);
  // kirişler (common.js uMullions = 4 ile aynı)
  x.fillStyle = 'rgba(40,52,52,0.85)';
  for (let i = 1; i < 4; i++) x.fillRect((W * i) / 4 - 4, 0, 8, H);
  x.fillRect(0, H - 6, W, 6);
  x.fillRect(0, 0, W, 4);
  grime(x, W, H, 30, 'rgba(90,100,95,A)', 60, 0.25, 7);
  return c;
}

// Ayna cam (tek yönlü): koyu, hafif yansıma çizgileri.
export function paintMirror() {
  const W = 512, H = 384, c = mk(W, H), x = c.getContext('2d');
  x.fillStyle = lg(x, 0, 0, W, H, [[0, '#0d1b1d'], [0.5, '#0a1517'], [1, '#050b0c']]);
  x.fillRect(0, 0, W, H);
  x.globalCompositeOperation = 'lighter';
  for (const [a, w, o] of [[0.2, 60, 0.06], [0.42, 22, 0.05], [0.7, 90, 0.035]]) {
    x.save();
    x.translate(W * a, 0);
    x.rotate(0.35);
    x.fillStyle = lg(x, -w, 0, w, 0, [[0, 'rgba(160,200,195,0)'], [0.5, `rgba(160,200,195,${o})`], [1, 'rgba(160,200,195,0)']]);
    x.fillRect(-w, -100, w * 2, H * 2);
    x.restore();
  }
  x.globalCompositeOperation = 'source-over';
  x.strokeStyle = 'rgba(0,0,0,0.8)';
  x.lineWidth = 14;
  x.strokeRect(0, 0, W, H);
  x.strokeStyle = 'rgba(150,185,180,0.12)';
  x.lineWidth = 2;
  x.strokeRect(9, 9, W - 18, H - 18);
  return c;
}

// Masa üstü: açık gri-teal laminat, ortada ek yeri, çizikler, fincan izi.
export function paintDesk() {
  const W = 1024, H = 1024, c = mk(W, H), x = c.getContext('2d');
  x.fillStyle = lg(x, 0, 0, 0, H, [[0, '#7c9896'], [0.5, '#6d8988'], [1, '#55706f']]);
  x.fillRect(0, 0, W, H);
  const R = seeded(21);
  x.strokeStyle = 'rgba(30,48,48,0.10)';
  x.lineWidth = 1;
  for (let i = 0; i < 160; i++) {
    const px = R() * W, py = R() * H, l = 20 + R() * 120, a = (R() - 0.5) * 0.6;
    x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke();
  }
  // iki masanın ek yeri
  x.fillStyle = 'rgba(15,28,29,0.45)';
  x.fillRect(W * 0.5 - 2, 0, 4, H);
  x.fillStyle = 'rgba(210,235,230,0.08)';
  x.fillRect(W * 0.5 + 2, 0, 2, H);
  // fincan izi
  x.strokeStyle = 'rgba(60,40,25,0.18)';
  x.lineWidth = 5;
  x.beginPath(); x.ellipse(W * 0.78, H * 0.6, 34, 34, 0, 0.3, Math.PI * 1.8); x.stroke();
  grime(x, W, H, 40, 'rgba(20,35,35,A)', 120, 0.12, 8);
  grain(x, W, H, 12, 6);
  return c;
}

// Masanın ön/arka kenarı (dikey şerit).
export function paintDeskEdge() {
  const W = 512, H = 32, c = mk(W, H), x = c.getContext('2d');
  x.fillStyle = lg(x, 0, 0, 0, H, [[0, '#a9c3c0'], [0.2, '#5a7473'], [1, '#1b2a2b']]);
  x.fillRect(0, 0, W, H);
  return c;
}

// Vaka dosyası (masada kapalı duran manila klasör).
export function paintFolder(label = 'DENEK 04') {
  const W = 512, H = 660, c = mk(W, H), x = c.getContext('2d');
  // içerden taşan kâğıtlar
  x.fillStyle = '#d7d3c4';
  x.save(); x.translate(W / 2, H / 2); x.rotate(0.03); x.fillRect(-W * 0.44, -H * 0.47, W * 0.86, H * 0.9); x.restore();
  x.fillStyle = '#e2ddcc';
  x.save(); x.translate(W / 2, H / 2); x.rotate(-0.025); x.fillRect(-W * 0.45, -H * 0.46, W * 0.88, H * 0.9); x.restore();
  // kapak
  x.fillStyle = lg(x, 0, 0, W, H, [[0, '#c7a86c'], [1, '#a88a52']]);
  rr(x, 12, 30, W - 24, H - 42, 8); x.fill();
  x.fillStyle = '#b89a5e';
  rr(x, 30, 12, W * 0.38, 40, 8); x.fill();
  // etiket
  x.fillStyle = '#e9e4d2';
  x.fillRect(W * 0.18, H * 0.2, W * 0.64, 70);
  x.fillStyle = '#2b2a26';
  x.font = '700 34px "Courier Prime", "Courier New", monospace';
  x.textAlign = 'center';
  x.fillText(label, W / 2, H * 0.2 + 47);
  // ataç
  x.strokeStyle = '#8f9693';
  x.lineWidth = 5;
  rr(x, W * 0.78, 18, 28, 90, 12); x.stroke();
  grime(x, W, H, 20, 'rgba(80,60,30,A)', 90, 0.15, 12);
  grain(x, W, H, 14, 13);
  return c;
}

// Masadaki kâğıt rapor (yazılı satırlar).
export function paintReportPaper() {
  const W = 512, H = 700, c = mk(W, H), x = c.getContext('2d');
  x.fillStyle = '#ebe7d9';
  x.fillRect(0, 0, W, H);
  x.fillStyle = '#3a3934';
  x.font = '700 30px "Courier Prime", "Courier New", monospace';
  x.fillText('SORGU RAPORU', 40, 70);
  const R = seeded(31);
  x.fillStyle = 'rgba(40,40,36,0.55)';
  for (let y = 120; y < H - 60; y += 26) {
    const w = 120 + R() * (W - 200);
    x.fillRect(40, y, w, 7);
  }
  x.strokeStyle = 'rgba(40,40,36,0.3)';
  x.strokeRect(36, 100, W - 72, H - 150);
  grain(x, W, H, 10, 17);
  return c;
}

// Küllük (yandan görünüş).
export function paintAshtray() {
  const W = 256, H = 128, c = mk(W, H), x = c.getContext('2d');
  x.fillStyle = lg(x, 0, 60, 0, 128, [[0, '#1a2526'], [1, '#050909']]);
  x.beginPath(); x.ellipse(W / 2, 92, 110, 30, 0, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#030606';
  x.beginPath(); x.ellipse(W / 2, 80, 84, 16, 0, 0, Math.PI * 2); x.fill();
  x.strokeStyle = 'rgba(190,220,215,0.35)';
  x.lineWidth = 3;
  x.beginPath(); x.ellipse(W / 2, 80, 108, 22, 0, Math.PI * 1.05, Math.PI * 1.95); x.stroke();
  // sigara
  x.lineCap = 'round';
  x.strokeStyle = '#d9d3c2';
  x.lineWidth = 9;
  x.beginPath(); x.moveTo(90, 80); x.lineTo(200, 58); x.stroke();
  x.strokeStyle = '#b88a52';
  x.beginPath(); x.moveTo(90, 80); x.lineTo(112, 76); x.stroke();
  x.strokeStyle = '#4a4440';
  x.lineWidth = 8;
  x.beginPath(); x.moveTo(198, 58); x.lineTo(206, 56.5); x.stroke();
  return c;
}

// Kalemlik.
export function paintPenCup() {
  const W = 128, H = 192, c = mk(W, H), x = c.getContext('2d');
  x.strokeStyle = '#0a1011';
  x.lineWidth = 5;
  x.beginPath(); x.moveTo(44, 110); x.lineTo(30, 10); x.moveTo(64, 110); x.lineTo(72, 0); x.moveTo(84, 110); x.lineTo(108, 40); x.stroke();
  x.fillStyle = lg(x, 20, 0, 108, 0, [[0, '#071011'], [0.6, '#1a2728'], [1, '#0b1415']]);
  rr(x, 20, 96, 88, 96, 8); x.fill();
  x.fillStyle = 'rgba(190,220,215,0.2)';
  x.fillRect(22, 96, 84, 3);
  return c;
}

// Masadaki kaset çalar (önden görünüş).
export function paintCassettePlayer() {
  const W = 512, H = 200, c = mk(W, H), x = c.getContext('2d');
  x.fillStyle = lg(x, 0, 0, 0, H, [[0, '#2b3536'], [0.15, '#151c1d'], [1, '#080c0d']]);
  rr(x, 6, 20, W - 12, H - 26, 12); x.fill();
  x.fillStyle = 'rgba(200,230,225,0.12)';
  x.fillRect(14, 22, W - 28, 3);
  // kaset penceresi
  x.fillStyle = '#060909';
  rr(x, 40, 52, 260, 110, 6); x.fill();
  x.fillStyle = '#c9c1aa';
  rr(x, 54, 64, 232, 86, 4); x.fill();
  x.fillStyle = '#1a1714';
  for (const cx of [114, 226]) { x.beginPath(); x.arc(cx, 106, 26, 0, Math.PI * 2); x.fill(); }
  // tuşlar
  for (let i = 0; i < 5; i++) {
    x.fillStyle = i === 0 ? '#5a2018' : '#a9ada4';
    rr(x, 330 + i * 32, 60, 26, 40, 3); x.fill();
  }
  // hoparlör
  x.fillStyle = '#040707';
  for (let r = 0; r < 4; r++) for (let q = 0; q < 10; q++) { x.beginPath(); x.arc(334 + q * 15, 122 + r * 12, 2.4, 0, Math.PI * 2); x.fill(); }
  return c;
}

// Ön plan: çerçeve kenarlarındaki yüksek sırtlı boş sandalyeler.
export function paintChairBack(right = false) {
  const W = 384, H = 1024, c = mk(W, H), x = c.getContext('2d');
  x.fillStyle = lg(x, 0, 0, W, 0, right ? [[0, '#142122'], [0.08, '#0a1314'], [1, '#030707']] : [[0, '#030707'], [0.92, '#0a1314'], [1, '#142122']]);
  rr(x, 0, 30, W, H, 60); x.fill();
  x.strokeStyle = 'rgba(0,0,0,0.4)';
  x.lineWidth = 3;
  for (const f of [0.33, 0.66]) { x.beginPath(); x.moveTo(W * f, 80); x.lineTo(W * f, H); x.stroke(); }
  x.fillStyle = 'rgba(170,210,205,0.16)';
  x.fillRect(right ? 4 : W - 7, 80, 3, H * 0.8);
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
