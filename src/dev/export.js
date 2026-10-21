// Geliştirme aracı: prosedürel dokuları düzenlenebilir PNG olarak tasarim/ klasörüne yazar.
// Çalıştırma: geliştirme sunucusu açıkken http://localhost:5173/?disa-aktar
// Dosyalar 2× çözünürlükte çizilir; adları oyunun beklediği adlarla aynıdır.
import * as P from '../scene/procedural.js';
import { withScale, mk, seeded } from '../scene/paint.js';
import { paintBody, paintKey, SCHEME_NAME } from '../machine/body.js';
import { makeIris, makeSclera } from '../machine/eye.js';
import { BODY, L } from '../machine/layout.js';
import { t } from '../core/strings.js';
import player from '../../data/subjects/player.json';

const S = 2;

// [klasör, ad, üretici]
const JOBS = [
  ['oda', 'wall', () => withScale(S, P.paintWall)],
  ['oda', 'window', () => withScale(S, P.paintWindow)],
  ['oda', 'mirror', () => withScale(S, P.paintMirror)],
  ['oda', 'desk', () => withScale(S, P.paintDesk)],
  ['oda', 'desk-edge', () => withScale(S, P.paintDeskEdge)],
  ['oda', 'folder', () => withScale(S, () => P.paintFolder())],
  ['oda', 'report', () => withScale(S, P.paintReportPaper)],
  ['oda', 'ashtray', () => withScale(S, P.paintAshtray)],
  ['oda', 'cassette', () => withScale(S, P.paintCassettePlayer)],
  ['oda', 'pencup', () => withScale(S, P.paintPenCup)],
  ['oda', 'chair-left', () => withScale(S, () => P.paintChairBack(false))],
  ['oda', 'chair-right', () => withScale(S, () => P.paintChairBack(true))],
  ['oda', 'machine', () => withScale(S, paintBody)],
  // seçili renk şeması ayrıca kendi adıyla (karşılaştırma için)
  ['oda', `machine-${SCHEME_NAME}`, () => withScale(S, paintBody)],
  ['oda', 'machine-key', () => withScale(4, () => paintKey(false))],
  ['oda', 'machine-key-lit', () => withScale(4, () => paintKey(true))],
  ['goz', 'iris', () => makeIris(1024, { fleck: '#ead08a', ...player.eye }, player.eye.seed)],
  ['goz', 'sclera', () => withScale(S, () => makeSclera(720, 560, seeded(player.eye.seed)))],
  ['_rehber', 'machine-rehber', () => withScale(S, machineGuide)],
];

// Makine gövdesinin üstüne konacak rehber katman: canlı parçaların yerleri.
function machineGuide() {
  const c = mk(BODY.W, BODY.H), x = c.getContext('2d');
  const G = (k) => t(`dev.guide.${k}`);
  const box = (r, label, dashed = false) => {
    x.fillStyle = 'rgba(200,0,200,0.28)';
    x.fillRect(r.x, r.y, r.w, r.h);
    x.strokeStyle = 'rgba(255,0,255,0.95)'; x.lineWidth = 3;
    x.setLineDash(dashed ? [12, 8] : []);
    x.strokeRect(r.x, r.y, r.w, r.h);
    x.setLineDash([]);
    x.font = '600 20px "Plex Mono", monospace';
    x.fillStyle = '#fff'; x.strokeStyle = '#000'; x.lineWidth = 4;
    const ly = Math.max(r.y, 0) + 26;
    x.strokeText(label, r.x + 8, ly); x.fillText(label, r.x + 8, ly);
  };
  const dot = (p, r, label) => box({ x: p.x - r, y: p.y - r, w: r * 2, h: r * 2 }, label);
  box(L.crt, G('crt'));
  box(L.left, G('left'));
  box(L.right, G('right'));
  box(L.led, G('led'));
  box(L.bellows, G('bellows'), true);
  L.keys.forEach((k, i) => box({ x: k.x, y: k.y, w: L.keySize.w, h: L.keySize.h }, i === 0 ? G('keys') : ''));
  box(L.alarm, G('alarm'));
  dot(L.stressLamp, 22, G('stress'));
  dot(L.calLamp, 17, G('cal'));
  dot(L.recLamp, 16, G('rec'));
  x.font = '400 22px "Plex Mono", monospace';
  x.fillStyle = '#fff'; x.strokeStyle = '#000'; x.lineWidth = 4;
  x.strokeText(G('note'), 40, 30); x.fillText(G('note'), 40, 30);
  return c;
}

const toBlob = (canvas) => new Promise((r) => canvas.toBlob(r, 'image/png'));

export async function runExport() {
  const box = document.createElement('div');
  Object.assign(box.style, { position: 'fixed', left: '16px', bottom: '16px', zIndex: 99, padding: '10px 14px', background: '#000c', color: '#e8bf7a', font: '12px monospace' });
  box.textContent = t('dev.exportTitle');
  document.body.append(box);
  // ?disa-aktar&uzerine ile var olan dosyaların üzerine yazılır; yoksa atlanır.
  const overwrite = new URLSearchParams(location.search).has('uzerine');
  const done = { n: 0, s: 0, k: 0 };
  for (const [dir, name, make] of JOBS) {
    try {
      const canvas = make();
      const blob = await toBlob(canvas);
      const q = `yol=${encodeURIComponent(`${dir}/${name}.png`)}${overwrite ? '&uzerine=1' : ''}`;
      const res = await fetch(`/__disa-aktar?${q}`, { method: 'POST', body: blob });
      if (res.status === 409) done.s++;
      else if (!res.ok) done.k++;
      else done.n++;
    } catch { done.k++; }
    box.textContent = `${t('dev.exportTitle')} ${done.n + done.s + done.k}/${JOBS.length} · ${name}`;
  }
  box.textContent = t('dev.exportDone', done);
  return done;
}
