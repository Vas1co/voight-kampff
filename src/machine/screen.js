// Ana CRT'nin ekran arayüzü: göz görüntüsünü yeşil monokrom "tarama"ya çevirir ve
// üstüne arayüz ögelerini çizer. Ekran durumları:
//   off       kapalı
//   idle      DENEK BEKLENİYOR (göz simgesi)
//   scan      göz + başlık, denek kimliği, soru no, nişangâh, tarama katmanı, ilerleme, sıcaklık
//   complete  tarama bitti (ANALİZ TAMAMLANDI)
//   data      okumanın ham değerleri + duygusal tepki izi (makine yorum yapmaz)
//   error     kırmızı uyarı (göz takibi kayboldu / açıklanamayan okuma)
// Tüm metinler strings.tr.json → screen.*
import { mk, rr } from '../scene/paint.js';
import { t } from '../core/strings.js';
import { sgn } from './gauges.js';
import { EKRAN } from './tema.js';

// yatay dikdörtgen ekran; göz tuvali de aynı boyutta (crt.js)
export const W = 768, H = 440;
const INK = EKRAN.ink(), DIM = EKRAN.ink(0.45), FAINT = EKRAN.ink(0.16);
const RED = '#ff4a3a', RED_DIM = 'rgba(255,74,58,0.45)';
const MONO = '"Plex Mono", ui-monospace, monospace';
const TAU = Math.PI * 2;

export class CrtScreen {
  constructor(eye) {
    this.eye = eye;
    this.canvas = mk(W, H);
    this.x = this.canvas.getContext('2d');
    this.mode = 'off';
    this.t = 0; this.modeT = 0;
    this.progress = 0; this.progressDur = 6;
    this.opts = {};
    this.id = '04-000A';
    this.temp = 36.6;
    this.signals = null;   // machine.js bağlar (duygusal tepki izi ve sıcaklık için)
    this.source = null;    // varsa video öğesi (göz kaydı); yoksa prosedürel göz
    // göz görüntüsünün ekrandaki kutusu (bombeli CRT kenarına yazı için yer kalsın)
    this.eyeBox = { s: 0.78, ox: W * 0.11, oy: H * 0.11 + 10 };
  }

  set(mode, opts = {}) {
    this.mode = mode;
    this.opts = opts;
    this.modeT = 0;
    if (mode === 'scan') { this.progress = opts.progress ?? 0; this.progressDur = opts.progressDur ?? 6; }
    if (mode === 'complete') this.progress = 1;
  }

  get usesEye() { return this.mode === 'scan' || this.mode === 'complete'; }

  update(dt) {
    this.t += dt; this.modeT += dt;
    if (this.mode === 'scan') this.progress = Math.min(0.97, this.progress + dt / this.progressDur);
    // vücut sıcaklığı: kızarma sapmasıyla hafifçe oynar (ham değer)
    const dev = this.signals?.dev();
    const target = 36.5 + (dev ? dev.blush * 0.01 : 0);
    this.temp += (target - this.temp) * Math.min(1, dt * 0.8);
  }

  // ---- çizim yardımcıları
  text(s, px, py, { size = 18, color = INK, align = 'left', weight = 500, spacing = 0.06 } = {}) {
    const x = this.x;
    x.font = `${weight} ${size}px ${MONO}`;
    x.textAlign = align; x.textBaseline = 'middle';
    if ('letterSpacing' in x) x.letterSpacing = `${spacing * size}px`;
    x.fillStyle = color; x.fillText(s, px, py);
    if ('letterSpacing' in x) x.letterSpacing = '0px';
  }

  corners(x0, y0, x1, y1, len = 22, color = INK, w = 2) {
    const x = this.x;
    x.strokeStyle = color; x.lineWidth = w;
    for (const [px, py, sx, sy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]]) {
      x.beginPath(); x.moveTo(px, py + sy * len); x.lineTo(px, py); x.lineTo(px + sx * len, py); x.stroke();
    }
  }

  header(color = DIM) {
    const x = this.x;
    x.fillStyle = color === RED_DIM ? 'rgba(255,74,58,0.8)' : INK;
    x.fillRect(58, 30, 9, 9); x.fillRect(71, 30, 9, 9);
    this.text(t('screen.header').toUpperCase(), 92, 35, { size: 13, color, spacing: 0.14 });
    this.text(t('screen.model'), W - 58, 35, { size: 13, color, align: 'right', spacing: 0.14 });
    x.fillStyle = color === RED_DIM ? 'rgba(255,74,58,0.25)' : FAINT;
    x.fillRect(58, 48, W - 116, 1.5);
  }

  // Göz görüntüsünü yeşil monokroma çevirip ekrana basar.
  drawEye() {
    const x = this.x;
    const src = this.source && this.source.readyState >= 2 ? this.source : this.eye.canvas;
    x.globalCompositeOperation = 'source-over';
    const { s: S, ox, oy } = this.eyeBox;
    x.drawImage(src, ox, oy, W * S, H * S);
    x.globalCompositeOperation = 'color';
    x.fillStyle = EKRAN.tint; x.fillRect(0, 0, W, H);
    x.globalCompositeOperation = 'multiply';
    x.fillStyle = EKRAN.wash; x.fillRect(0, 0, W, H);
    x.globalCompositeOperation = 'source-over';
    // kenarlara doğru kararma
    const v = x.createRadialGradient(W / 2, H / 2 + 8, H * 0.22, W / 2, H / 2 + 8, H * 0.62);
    v.addColorStop(0, 'rgba(1,8,6,0)'); v.addColorStop(1, 'rgba(1,8,6,0.9)');
    x.fillStyle = v; x.fillRect(0, 0, W, H);
    // yazıların okunması için üst ve alt bantları karart
    let g = x.createLinearGradient(0, 0, 0, 130);
    g.addColorStop(0, 'rgba(1,8,6,0.97)'); g.addColorStop(0.7, 'rgba(1,8,6,0.75)'); g.addColorStop(1, 'rgba(1,8,6,0)');
    x.fillStyle = g; x.fillRect(0, 0, W, 130);
    g = x.createLinearGradient(0, H - 120, 0, H);
    g.addColorStop(0, 'rgba(1,8,6,0)'); g.addColorStop(0.4, 'rgba(1,8,6,0.8)'); g.addColorStop(1, 'rgba(1,8,6,0.97)');
    x.fillStyle = g; x.fillRect(0, H - 120, W, 120);
  }

  // Nişangâh, halkalar, tarama katmanı.
  reticle() {
    const x = this.x, e = this.eye;
    const { s: S, ox, oy } = this.eyeBox;
    const cx = ox + e.cx * S, cy = oy + e.cy * S, R = e.R * S, pr = e.pr * S;
    // ızgara (tarama katmanı)
    x.strokeStyle = EKRAN.ink(0.06); x.lineWidth = 1;
    x.beginPath();
    for (let gx = 40; gx < W; gx += 40) { x.moveTo(gx, 96); x.lineTo(gx, H - 70); }
    for (let gy = 96; gy < H - 70; gy += 40) { x.moveTo(40, gy); x.lineTo(W - 40, gy); }
    x.stroke();
    // artı çizgileri göz bebeği merkezinden
    x.strokeStyle = EKRAN.ink(0.5); x.lineWidth = 1.3;
    x.beginPath(); x.moveTo(70, cy); x.lineTo(W - 70, cy); x.moveTo(cx, 112); x.lineTo(cx, H - 80); x.stroke();
    // halkalar
    x.strokeStyle = EKRAN.ink(0.55); x.lineWidth = 1.5;
    x.beginPath(); x.arc(cx, cy, R * 1.02, 0, TAU); x.stroke();
    x.setLineDash([4, 6]);
    x.beginPath(); x.arc(cx, cy, R * 1.28, 0, TAU); x.stroke();
    x.setLineDash([]);
    x.strokeStyle = EKRAN.ink(0.75);
    x.beginPath(); x.arc(cx, cy, pr * 1.35, 0, TAU); x.stroke();
    // halka üstünde açı işaretleri
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * TAU, l = i % 9 === 0 ? 12 : 5;
      x.beginPath();
      x.moveTo(cx + Math.cos(a) * R * 1.28, cy + Math.sin(a) * R * 1.28);
      x.lineTo(cx + Math.cos(a) * (R * 1.28 + l), cy + Math.sin(a) * (R * 1.28 + l));
      x.stroke();
    }
    // merkez işareti
    x.strokeStyle = INK; x.lineWidth = 2;
    x.beginPath(); x.moveTo(cx - 9, cy); x.lineTo(cx + 9, cy); x.moveTo(cx, cy - 9); x.lineTo(cx, cy + 9); x.stroke();
    // odak köşeleri
    this.corners(84, 116, W - 84, H - 84, 26, EKRAN.ink(0.8));
    // tarama bandı
    if (this.mode === 'scan') {
      const sy = 120 + ((this.t * 90) % (H - 210));
      const g = x.createLinearGradient(0, sy - 30, 0, sy + 4);
      g.addColorStop(0, EKRAN.ink(0)); g.addColorStop(1, EKRAN.ink(0.22));
      x.fillStyle = g; x.fillRect(84, sy - 30, W - 168, 34);
      x.fillStyle = EKRAN.hi(0.5); x.fillRect(84, sy + 3, W - 168, 1.5);
    }
  }

  topRows() {
    const o = this.opts;
    this.text(o.title ?? t('screen.scanTitle'), 58, 72, { size: 19, weight: 600 });
    this.text(t('screen.id', { id: this.id }), W - 58, 72, { size: 19, weight: 600, align: 'right' });
    this.text(o.phase != null ? t('screen.phase', { n: o.phase }) : t('screen.phaseBaseline'), 58, 96, { size: 16, color: INK });
    // küçük nabız simgesi
    const x = this.x;
    x.strokeStyle = DIM; x.lineWidth = 1.5;
    x.beginPath(); x.moveTo(98, 96); x.lineTo(106, 96); x.lineTo(110, 88); x.lineTo(115, 104); x.lineTo(119, 96); x.lineTo(128, 96); x.stroke();
    this.text(t('screen.subject'), W - 58, 96, { size: 16, color: INK, align: 'right' });
  }

  bottomRow() {
    const x = this.x, y = H - 50;
    if (this.mode === 'complete') {
      const on = this.modeT < 1.2 ? Math.floor(this.modeT * 6) % 2 === 0 : true;
      if (on) this.text(t('screen.complete'), 58, y, { size: 17, weight: 600 });
    } else {
      const p = Math.round(this.progress * 100);
      this.text(`${t('screen.scan')} %${String(p).padStart(2, '0')}`, 58, y, { size: 17, weight: 600 });
      const n = 12, bx = 200, bw = 9, gap = 3;
      for (let i = 0; i < n; i++) {
        x.fillStyle = i < Math.round(this.progress * n) ? INK : FAINT;
        x.fillRect(bx + i * (bw + gap), y - 8, bw, 16);
      }
    }
    this.text(t('screen.temp', { t: this.temp.toFixed(1) }), W - 58, y, { size: 17, weight: 600, align: 'right' });
  }

  drawIdle() {
    const x = this.x;
    this.header();
    const blink = this.t % 1.6 < 1.15;
    this.corners(210, 128, W - 210, 330, 22, DIM);
    if (blink) this.text(t('screen.awaiting'), W / 2, 185, { size: 20, weight: 600, align: 'center', spacing: 0.12 });
    // göz simgesi
    const cx = W / 2, cy = 255;
    x.strokeStyle = INK; x.lineWidth = 3;
    x.beginPath(); x.moveTo(cx - 44, cy); x.quadraticCurveTo(cx, cy - 36, cx + 44, cy); x.quadraticCurveTo(cx, cy + 36, cx - 44, cy); x.stroke();
    x.beginPath(); x.arc(cx, cy, 14, 0, TAU); x.stroke();
    x.fillStyle = INK; x.beginPath(); x.arc(cx, cy, 6, 0, TAU); x.fill();
  }

  drawData() {
    const x = this.x, o = this.opts, r = o.reading;
    this.header();
    this.text(t('screen.dataTitle'), 58, 76, { size: 19, weight: 600 });
    this.text(t('screen.id', { id: this.id }), W - 58, 76, { size: 17, color: DIM, align: 'right' });
    x.fillStyle = FAINT; x.fillRect(58, 92, W - 116, 1.5);
    const rows = r ? [
      [t('screen.rows.pupil'), `${sgn(r.dev.pupil)}%`],
      [t('screen.rows.blush'), `${sgn(r.dev.blush)}%`],
      [t('screen.rows.pulse'), `${sgn(r.dev.pulse, 0)}`],
      [t('screen.rows.latency'), r.none ? '—' : `${r.rt.toFixed(2)} sn`],
    ] : [];
    rows.forEach(([k, v], i) => {
      if (this.modeT < i * 0.18) return; // satır satır yazılır
      const y = 124 + i * 42;
      this.text(k, 70, y, { size: 19 });
      this.text(v, W - 70, y, { size: 19, weight: 600, align: 'right' });
      x.fillStyle = FAINT; x.fillRect(70, y + 20, W - 140, 1);
    });
    // duygusal tepki izi (göz bebeği sapmasının son saniyeleri)
    const y0 = H - 104;
    this.corners(58, y0 - 30, W - 58, H - 52, 14, DIM, 1.5);
    this.text(t('screen.response'), 72, y0 - 4, { size: 15, color: DIM });
    const tr = this.signals?.traces.pupil;
    if (tr && this.modeT > 0.7) {
      x.strokeStyle = INK; x.lineWidth = 2;
      x.beginPath();
      for (let i = 0; i < 256; i++) {
        const px = 270 + (i / 255) * (W - 350), v = Math.max(-1, Math.min(1, tr.at(i) / 35));
        const py = y0 + 14 - v * 26;
        i ? x.lineTo(px, py) : x.moveTo(px, py);
      }
      x.stroke();
    }
  }

  drawError() {
    const x = this.x, o = this.opts;
    x.fillStyle = 'rgba(40,4,2,0.55)'; x.fillRect(0, 0, W, H);
    this.header(RED_DIM);
    this.corners(84, 70, W - 84, H - 64, 26, RED, 2.5);
    const on = Math.floor(this.modeT * 3) % 2 === 0;
    this.text(t('screen.error'), W / 2, 112, { size: 26, weight: 600, align: 'center', color: RED, spacing: 0.2 });
    // uyarı üçgeni
    const cx = W / 2, cy = 196;
    x.strokeStyle = on ? RED : RED_DIM; x.lineWidth = 4; x.lineJoin = 'round';
    x.beginPath(); x.moveTo(cx, cy - 40); x.lineTo(cx + 46, cy + 36); x.lineTo(cx - 46, cy + 36); x.closePath(); x.stroke();
    x.lineWidth = 5; x.beginPath(); x.moveTo(cx, cy - 12); x.lineTo(cx, cy + 12); x.stroke();
    x.fillStyle = on ? RED : RED_DIM; x.beginPath(); x.arc(cx, cy + 24, 3.5, 0, TAU); x.fill();
    const lines = o.kind === 'anomaly' ? [t('screen.errorAnomaly'), t('screen.errorRecheck')] : [t('screen.errorLost'), t('screen.errorAdjust')];
    this.text(lines[0], W / 2, 282, { size: 20, weight: 600, align: 'center', color: RED, spacing: 0.08 });
    this.text(lines[1], W / 2, 312, { size: 20, weight: 600, align: 'center', color: RED, spacing: 0.08 });
  }

  render() {
    const x = this.x;
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = 1;
    x.fillStyle = '#020a08'; x.fillRect(0, 0, W, H);
    switch (this.mode) {
      case 'idle': this.drawIdle(); break;
      case 'scan':
      case 'complete':
        this.drawEye(); this.reticle(); this.header(); this.topRows(); this.bottomRow(); break;
      case 'data': this.drawData(); break;
      case 'error': this.drawError(); break;
      default: break;
    }
  }
}
