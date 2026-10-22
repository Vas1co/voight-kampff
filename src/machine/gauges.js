// Yan ekranlar.
// Sol: solunum ve nabız (kayan çizgiler, yeşil fosfor).
// Sağ: tepki analizi — göz bebeği, kızarma, tepki süresi, parçacık (soluk LCD).
// Tüm sayılar temele göre SAPMA olarak gösterilir. Hüküm yok.
import * as THREE from 'three';
import { mk, rr } from '../scene/paint.js';
import { t } from '../core/strings.js';
import { EKRAN } from './tema.js';

const MONO = '"Plex Mono", ui-monospace, monospace';
const MINUS = '−';
export const sgn = (v, d = 1) => (v >= 0 ? '+' : MINUS) + Math.abs(v).toFixed(d);

function tex(canvas) {
  const tx = new THREE.CanvasTexture(canvas);
  tx.colorSpace = THREE.SRGBColorSpace;
  tx.minFilter = THREE.LinearFilter;
  tx.generateMipmaps = false;
  return tx;
}

function statusText(s) {
  return {
    off: t('machine.off'), warming: t('machine.warming'), idle: t('machine.idle'),
    sampling: t('machine.sampling'), bellows: t('machine.bellows'),
  }[s.status] ?? '';
}

export class LeftMonitor {
  constructor() {
    this.canvas = mk(512, 390);
    this.x = this.canvas.getContext('2d');
    this.texture = tex(this.canvas);
    this.blink = 0;
  }

  draw(s, dt) {
    const x = this.x, W = 512, H = 390;
    this.blink += dt;
    const ink = EKRAN.mon(), dim = EKRAN.mon(0.35), faint = EKRAN.mon(0.08);
    x.fillStyle = '#021110';
    x.fillRect(0, 0, W, H);
    x.strokeStyle = faint; x.lineWidth = 1;
    x.beginPath();
    for (let gx = 0; gx < W; gx += 32) { x.moveTo(gx + 0.5, 44); x.lineTo(gx + 0.5, H - 34); }
    for (let gy = 44; gy < H - 30; gy += 32) { x.moveTo(0, gy + 0.5); x.lineTo(W, gy + 0.5); }
    x.stroke();

    x.font = `600 20px ${MONO}`;
    x.fillStyle = ink; x.textBaseline = 'middle';
    x.fillText(t('machine.panelLeft'), 16, 22);
    x.textAlign = 'right';
    const st = statusText(s);
    if (s.status !== 'warming' || (this.blink % 1) < 0.6) x.fillText(st, W - 16, 22);
    x.textAlign = 'left';
    x.fillStyle = dim; x.fillRect(0, 42, W, 1.5);

    if (s.power < 0.5) { this.texture.needsUpdate = true; return; }

    const dev = s.dev();
    const band = (label, value, unit, d, ring, y0, h, scale) => {
      x.strokeStyle = ink; x.lineWidth = 2.2; x.beginPath();
      for (let i = 0; i < 256; i++) {
        const px = (i / 255) * W, py = y0 + h / 2 - ring.at(i) * h * scale;
        i ? x.lineTo(px, py) : x.moveTo(px, py);
      }
      x.stroke();
      x.fillStyle = 'rgba(2,17,16,0.75)';
      x.fillRect(8, y0 + 2, 250, 34);
      x.fillStyle = ink; x.font = `600 24px ${MONO}`;
      x.fillText(`${label} ${value}`, 14, y0 + 19);
      x.font = `400 16px ${MONO}`; x.fillStyle = dim;
      x.fillText(unit, 14 + x.measureText(`${label} ${value}`).width * 1.55 + 8, y0 + 21);
      x.textAlign = 'right'; x.font = `600 24px ${MONO}`; x.fillStyle = ink;
      x.fillStyle = 'rgba(2,17,16,0.75)'; x.fillRect(W - 170, y0 + 2, 162, 34);
      x.fillStyle = ink;
      x.fillText(d, W - 14, y0 + 19);
      x.textAlign = 'left';
    };
    const noBase = t('machine.noBaseline');
    band(t('channels.resp').slice(0, 3), s.cur.resp.toFixed(1), t('units.resp'), dev ? `Δ ${sgn(dev.resp)}` : noBase, s.traces.resp, 50, 150, 0.32);
    band(t('channels.pulse').slice(0, 3), Math.round(s.cur.pulse), t('units.pulse'), dev ? `Δ ${sgn(dev.pulse, 0)}` : noBase, s.traces.pulse, 205, 150, 0.36);

    x.fillStyle = dim; x.fillRect(0, H - 34, W, 1.5);
    x.font = `400 17px ${MONO}`; x.fillStyle = dim;
    const b = s.base;
    x.fillText(b ? `${t('machine.baseline')}  ${b.resp.toFixed(1)}  ·  ${Math.round(b.pulse)}` : `${t('machine.baseline')}  —`, 16, H - 16);
    this.texture.needsUpdate = true;
  }
}

export class RightMonitor {
  constructor() {
    this.canvas = mk(512, 390);
    this.x = this.canvas.getContext('2d');
    this.texture = tex(this.canvas);
    this.blink = 0;
  }

  draw(s, dt) {
    const x = this.x, W = 512, H = 390;
    this.blink += dt;
    const bg = '#b7cdc8', ink = '#10282a', mid = 'rgba(16,40,42,0.55)', faint = 'rgba(16,40,42,0.14)', red = '#c2271c';
    x.fillStyle = bg; x.fillRect(0, 0, W, H);
    x.textBaseline = 'middle';
    x.font = `600 20px ${MONO}`; x.fillStyle = ink;
    x.fillText(t('machine.panelRight'), 16, 22);
    x.textAlign = 'right';
    if (s.status !== 'warming' || (this.blink % 1) < 0.6) x.fillText(statusText(s), W - 16, 22);
    x.textAlign = 'left';
    x.fillStyle = mid; x.fillRect(0, 42, W, 1.5);
    if (s.power < 0.5) { x.fillStyle = 'rgba(0,0,0,0.75)'; x.fillRect(0, 0, W, H); this.texture.needsUpdate = true; return; }

    const dev = s.dev();
    const noBase = t('machine.noBaseline');
    const flag = (ch) => s.anomaly === ch && (this.blink % 0.5) < 0.32;
    const label = (txt, y) => { x.font = `400 15px ${MONO}`; x.fillStyle = mid; x.fillText(txt, 16, y); };
    const big = (txt, px, y, align = 'left', col = ink) => { x.font = `600 25px ${MONO}`; x.fillStyle = col; x.textAlign = align; x.fillText(txt, px, y); x.textAlign = 'left'; };

    // 1) göz bebeği: kesit + iz
    label(t('channels.pupil'), 60);
    const cx = 62, cy = 112, irisR = 38;
    x.strokeStyle = mid; x.lineWidth = 2;
    x.beginPath(); x.arc(cx, cy, irisR, 0, Math.PI * 2); x.stroke();
    const pr = irisR * Math.min(0.95, s.cur.pupil / 11.7 * 2.1);
    x.fillStyle = ink;
    x.beginPath();
    for (let i = 0; i <= 40; i++) {
      const a = (i / 40) * Math.PI * 2, w = 1 + 0.05 * Math.sin(a * 3 + this.blink * 2);
      const px = cx + Math.cos(a) * pr * w, py = cy + Math.sin(a) * pr * w;
      i ? x.lineTo(px, py) : x.moveTo(px, py);
    }
    x.fill();
    if (s.base) {
      const br = irisR * Math.min(0.95, s.base.pupil / 11.7 * 2.1);
      x.setLineDash([4, 4]); x.strokeStyle = mid;
      x.beginPath(); x.arc(cx, cy, br, 0, Math.PI * 2); x.stroke(); x.setLineDash([]);
    }
    const tx0 = 120, tw = 220, ty = 112, th = 70;
    x.strokeStyle = faint; x.lineWidth = 1;
    x.beginPath(); x.moveTo(tx0, ty); x.lineTo(tx0 + tw, ty); x.stroke();
    x.strokeStyle = ink; x.lineWidth = 2;
    x.beginPath();
    for (let i = 0; i < 256; i++) {
      const px = tx0 + (i / 255) * tw, py = ty - Math.max(-1, Math.min(1, s.traces.pupil.at(i) / 35)) * th / 2;
      i ? x.lineTo(px, py) : x.moveTo(px, py);
    }
    x.stroke();
    big(dev ? `${sgn(dev.pupil)}%` : noBase, W - 16, 86, 'right', flag('pupil') ? red : ink);
    x.font = `400 17px ${MONO}`; x.fillStyle = mid; x.textAlign = 'right';
    x.fillText(`${t('report.cols.onset')} ${s.onset != null ? s.onset.toFixed(2) + ' ' + t('units.sec') : '—'}`, W - 16, 122);
    x.fillText(`${s.cur.pupil.toFixed(2)} ${t('units.mm')}`, W - 16, 148);
    x.textAlign = 'left';
    x.fillStyle = faint; x.fillRect(0, 168, W, 1);

    // 2) kızarma
    label(t('channels.blush'), 184);
    const bx = 16, bw = 330, by = 204, bh = 16, zero = bx + bw / 2;
    x.strokeStyle = mid; x.lineWidth = 1.5; x.strokeRect(bx, by, bw, bh);
    x.fillStyle = mid; x.fillRect(zero - 1, by - 4, 2, bh + 8);
    if (dev) {
      const v = Math.max(-1, Math.min(1, dev.blush / 40));
      x.fillStyle = flag('blush') ? red : ink;
      x.fillRect(v >= 0 ? zero : zero + v * bw / 2, by + 3, Math.abs(v) * bw / 2, bh - 6);
    }
    big(dev ? `${sgn(dev.blush)}%` : noBase, W - 16, 206, 'right', flag('blush') ? red : ink);
    x.fillStyle = faint; x.fillRect(0, 232, W, 1);

    // 3) tepki süresi
    label(t('channels.latency'), 248);
    big(s.latency != null ? `${s.latency.toFixed(2)} ${t('units.sec')}` : '— ', 16, 276);
    if (dev && s.latency != null && s.base?.latency != null) big(`Δ ${sgn(s.latency - s.base.latency, 2)}`, W - 16, 276, 'right');
    x.fillStyle = faint; x.fillRect(0, 298, W, 1);

    // 4) parçacık (körükten)
    label(`${t('channels.particles')} · ${t('machine.bellows')}`, 314);
    const hx = 16, hy = 360, hw = 300, hh = 28;
    x.fillStyle = faint; x.fillRect(hx, hy, hw, 1);
    const hist = s.particleHistory;
    hist.forEach((v, i) => {
      const bwid = hw / 16 - 3, px = hx + i * (hw / 16);
      const vv = Math.max(-1, Math.min(1, v / 25));
      x.fillStyle = i === hist.length - 1 ? ink : mid;
      x.fillRect(px, vv >= 0 ? hy - vv * hh : hy, bwid, Math.abs(vv) * hh + 1);
    });
    const pd = dev && s.particles != null ? `${sgn(dev.particles)}%` : (s.status === 'bellows' ? '…' : '—');
    big(pd, W - 16, 352, 'right', flag('particles') ? red : ink);

    if (s.anomaly && (this.blink % 0.5) < 0.32) {
      x.font = `600 18px ${MONO}`; x.fillStyle = red; x.textAlign = 'right';
      x.fillText(t('machine.anomaly'), W - 16, 56);
      x.textAlign = 'left';
    }
    this.texture.needsUpdate = true;
  }
}

// LED seviye çubuğu (CRT'nin üstünde).
export class LedBar {
  constructor() {
    this.canvas = mk(512, 32);
    this.x = this.canvas.getContext('2d');
    this.texture = tex(this.canvas);
    this.n = 24;
  }
  draw(level, power) {
    const x = this.x, W = 512, H = 32, n = this.n, sw = W / n;
    x.fillStyle = '#010202'; x.fillRect(0, 0, W, H);
    const lit = Math.round(level * n);
    for (let i = 0; i < n; i++) {
      const zone = i >= n - 3 ? 'r' : i >= n - 6 ? 'a' : 'g';
      const on = power > 0.5 && i < lit;
      x.fillStyle = on
        ? (zone === 'r' ? '#ff5040' : zone === 'a' ? '#ffc070' : '#5dff9c')
        : (zone === 'r' ? '#2a0d0b' : zone === 'a' ? '#2a1e0b' : '#0b2a17');
      rr(x, i * sw + 2, 6, sw - 4, H - 12, 2); x.fill();
    }
    this.texture.needsUpdate = true;
  }
}
