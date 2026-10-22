// Geliştirme aracı: prosedürel dokuları düzenlenebilir PNG olarak tasarim/ klasörüne yazar.
// Çalıştırma: geliştirme sunucusu açıkken http://localhost:5173/?disa-aktar
// Dosyalar 2× çözünürlükte çizilir; adları oyunun beklediği adlarla aynıdır.
import * as P from '../scene/procedural.js';
import { withScale, mk, seeded } from '../scene/paint.js';
import { paintBody, paintKey, KASALAR, KASA_NAME, KASA } from '../machine/body.js';
import { Machine } from '../machine/machine.js';
import { makeIris, makeSclera } from '../machine/eye.js';
import { BODY } from '../machine/layout.js';
import * as THREE from 'three';
import { t } from '../core/strings.js';
import player from '../../data/subjects/player.json';

const S = 2;

// [klasör, ad, üretici] — sıra, odadaki yerleşimi izler (arkadan öne)
const JOBS = [
  // oda kabuğu ve arka duvar
  ['oda', 'wall', () => withScale(S, P.paintWall)],
  ['oda', 'side-wall', () => withScale(S, P.paintSideWall)],
  ['oda', 'ceiling', () => withScale(S, P.paintCeiling)],
  ['oda', 'lamp', () => withScale(S, P.paintLamp)],
  ['oda', 'behind-room', () => withScale(S, P.paintBehindRoom)],
  ['oda', 'chair-behind', () => withScale(S, P.paintEmptyChair)],
  ['oda', 'glass', () => withScale(S, P.paintGlass)],
  ['oda', 'door', () => withScale(S, P.paintDoor)],
  ['oda', 'access-panel', () => withScale(S, P.paintAccessPanel)],
  ['oda', 'cabinet', () => withScale(S, P.paintCabinet)],
  ['oda', 'vent', () => withScale(S, P.paintVent)],
  ['oda', 'sign', () => withScale(S, P.paintSign)],
  ['oda', 'camera', () => withScale(S, P.paintWallCamera)],
  // masa ve üstündekiler
  ['oda', 'desk', () => withScale(S, P.paintDesk)],
  ['oda', 'desk-edge', () => withScale(S, P.paintDeskEdge)],
  ['oda', 'files', () => withScale(S, P.paintFiles)],
  ['oda', 'sheet', () => withScale(S, P.paintSheet)],
  ['oda', 'pen', () => withScale(S, P.paintPen)],
  ['oda', 'cassette', () => withScale(S, P.paintCassettePlayer)],
  ['oda', 'mug', () => withScale(S, P.paintMug)],
  ['oda', 'ashtray', () => withScale(S, P.paintAshtray)],
  ['oda', 'chair-front', () => withScale(S, P.paintChairFront)],
  // makine
  ['oda', 'machine', () => withScale(S, paintBody)],
  ...Object.keys(KASALAR).map((k) => ['oda', `machine-${k}`, () => withScale(S, () => paintBody(k))]),
  ['oda', 'machine-key', () => withScale(4, () => paintKey(false))],
  ['oda', 'machine-key-lit', () => withScale(4, () => paintKey(true))],
  ['goz', 'iris', () => makeIris(1024, { fleck: '#ead08a', ...player.eye }, player.eye.seed)],
  ['goz', 'sclera', () => withScale(S, () => makeSclera(720, 560, seeded(player.eye.seed)))],
  ['_rehber', 'machine-rehber', () => withScale(S, machineGuide)],
  ['_rehber', 'oda-yerlesim', (stage) => layoutGuide(stage)],
  ['_rehber', 'kasa-secenekleri', (stage) => kasaSheet(stage)],
];

// Odanın geniş planını 1920×1080 çizer ve her katmanın üstüne dosya adını yazar.
export function layoutGuide(stage) {
  if (!stage) return null;
  const Wd = 1920, Hd = 1080;
  const { renderer, rig, post } = stage;
  const prevPR = renderer.getPixelRatio();
  const prevShot = rig.name;
  const prevInsets = { ...rig.size };
  renderer.setPixelRatio(1);
  renderer.setSize(Wd, Hd, false);
  post.setSize(Wd, Hd, 1);
  rig.cut('wide');
  // oyundaki gibi: üstte HUD, altta altyazı/cevap boşluğu
  rig.size.top = 40; rig.size.bottom = Math.round(Math.min(260, Math.max(120, Hd * 0.24)));
  rig.resize(Wd, Hd);
  stage.render();
  const c = mk(Wd, Hd), x = c.getContext('2d');
  x.drawImage(renderer.domElement, 0, 0, Wd, Hd);
  // etiketler
  const v = new THREE.Vector3();
  const label = (name, p) => {
    v.copy(p).project(rig.camera);
    if (v.z > 1 || Math.abs(v.x) > 1.05 || Math.abs(v.y) > 1.05) return;
    const sx = (v.x * 0.5 + 0.5) * Wd, sy = (1 - (v.y * 0.5 + 0.5)) * Hd;
    x.font = '600 18px "Plex Mono", monospace';
    const w = x.measureText(name).width + 14;
    x.fillStyle = 'rgba(200,0,200,0.85)'; x.fillRect(sx - w / 2, sy - 13, w, 26);
    x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(name, sx, sy);
  };
  stage.room.group.children.forEach((m) => { if (m.name) label(m.name, m.userData.labelAt ?? m.getWorldPosition(new THREE.Vector3())); });
  label('machine', stage.machine.group.getWorldPosition(new THREE.Vector3()));
  x.font = '400 20px "Plex Mono", monospace'; x.textAlign = 'left'; x.fillStyle = '#fff';
  x.fillText(t('dev.guide.layout'), 24, 34);
  // geri al
  renderer.setPixelRatio(prevPR);
  rig.cut(prevShot);
  rig.size.top = prevInsets.top; rig.size.bottom = prevInsets.bottom;
  stage.resize();
  return c;
}

// Bütün kasaları oda ışığında, makine planında yan yana gösterir (3 × 2 pafta).
export function kasaSheet(stage) {
  if (!stage) return null;
  const names = Object.keys(KASALAR);
  const Wd = 1280, Hd = 720, cols = 3, rows = Math.ceil(names.length / cols);
  const { renderer, rig, post, scene } = stage;
  const own = stage.machine.group;
  const prev = { pr: renderer.getPixelRatio(), shot: rig.name, size: { ...rig.size } };
  renderer.setPixelRatio(1);
  renderer.setSize(Wd, Hd, false);
  post.setSize(Wd, Hd, 1);
  rig.cut('machine');
  rig.size.top = 0; rig.size.bottom = 0;
  rig.resize(Wd, Hd);
  stage.room.chairFront.visible = false;
  own.visible = false;
  const c = mk(Wd * cols, Hd * rows), x = c.getContext('2d');
  x.fillStyle = '#000'; x.fillRect(0, 0, c.width, c.height);
  const time = performance.now() / 1000;
  names.forEach((k, i) => {
    const m = new Machine(k);
    m.group.position.copy(own.position); m.group.scale.copy(own.scale);
    m.setSubject(player);
    m.setPower(true);
    m.crt.power = m.crt.powerTarget = 1;
    m.crt.screen.set('scan', { phase: 2, progress: 0.4 });
    m.update(0.016, time); m.update(0.016, time + 0.02);
    scene.add(m.group);
    stage.render();
    const px = (i % cols) * Wd, py = Math.floor(i / cols) * Hd;
    x.drawImage(renderer.domElement, px, py, Wd, Hd);
    x.font = '600 34px "Plex Mono", monospace'; x.textBaseline = 'top';
    const label = `${i + 1}  ${KASALAR[k].name}${k === KASA_NAME ? '  •' : ''}`;
    x.fillStyle = 'rgba(0,0,0,0.7)'; x.fillRect(px + 20, py + 20, x.measureText(label).width + 32, 54);
    x.fillStyle = '#fff'; x.fillText(label, px + 36, py + 30);
    scene.remove(m.group);
    m.group.traverse((o) => { o.geometry?.dispose(); o.material?.map?.dispose?.(); o.material?.dispose?.(); });
  });
  own.visible = true;
  renderer.setPixelRatio(prev.pr);
  rig.cut(prev.shot);
  rig.size.top = prev.size.top; rig.size.bottom = prev.size.bottom;
  stage.resize();
  return c;
}

// Makine gövdesinin üstüne konacak rehber katman: canlı parçaların yerleri.
function machineGuide() {
  const L = KASA.L;
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

export async function runExport(stage) {
  const box = document.createElement('div');
  Object.assign(box.style, { position: 'fixed', left: '16px', bottom: '16px', zIndex: 99, padding: '10px 14px', background: '#000c', color: '#e8bf7a', font: '12px monospace' });
  box.textContent = t('dev.exportTitle');
  document.body.append(box);
  // ?disa-aktar&uzerine ile var olan dosyaların üzerine yazılır; yoksa atlanır.
  const overwrite = new URLSearchParams(location.search).has('uzerine');
  const done = { n: 0, s: 0, k: 0 };
  for (const [dir, name, make] of JOBS) {
    try {
      const canvas = make(stage);
      if (!canvas) continue;
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
