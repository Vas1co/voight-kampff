// Sorgu odası katmanları (arkadan öne): duvar + pencere → ayna cam → pervane →
// ışık hüzmeleri ve sis → masa → masa objeleri → ön plan.
// Her katmanın dokusu assets/images/room/<ad>.png ile değiştirilebilir.
import * as THREE from 'three';
import { textureOr } from '../core/assets.js';
import { litMaterial, fogMaterial, shaftMaterial, wallMaterial, glowMaterial, roomUniforms } from '../fx/materials.js';
import { lightUniforms } from '../fx/shaders/common.js';
import * as P from './procedural.js';
import { Dust, Smoke } from './particles.js';
import { CeilingFan } from './fan.js';
import { damp } from '../core/rng.js';

const DESK_Y = 0.76;

function plane(w, h, mat) { return new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); }
function flat(mesh) { mesh.rotation.x = -Math.PI / 2; return mesh; }

export class Room {
  constructor({ quality = 'high' } = {}) {
    this.group = new THREE.Group();
    this.quality = quality;
    this.fanAngle = 0;
    this.fanSpeed = 1.05;     // rad/sn (prototipteki hız)
    this.fanTarget = 1.05;
    this.reduce = false;
    // Saydam katmanlar derinliğe göre (arkadan öne) sıralanır; renderOrder kullanılmaz.
    const add = (m) => { this.group.add(m); return m; };

    // 1) arka duvar
    const wall = add(plane(14, 6, wallMaterial(textureOr('images/room', 'wall', P.paintWall))), -10);
    wall.position.set(0, 1.7, -6);
    // zemin ve yan duvarlar
    const floorMat = new THREE.MeshBasicMaterial({ color: 0x050b0c });
    const floor = add(flat(plane(14, 9, floorMat)), -10); floor.position.set(0, 0, -1.5);
    for (const s of [-1, 1]) {
      const side = add(plane(9, 6, new THREE.MeshBasicMaterial({ color: 0x040909 })), -10);
      side.rotation.y = -s * Math.PI / 2; side.position.set(s * 4.7, 1.7, -1.5);
    }

    // 2) pencere (aşırı parlak; bloom bunu yakalar)
    const winTex = textureOr('images/room', 'window', P.paintWindow);
    this.windowMat = new THREE.MeshBasicMaterial({ map: winTex, color: new THREE.Color(1.3, 1.28, 1.22) });
    const w = lightUniforms.uWindow.value;
    const win = add(plane(w.y - w.x, w.w - w.z, this.windowMat), -9);
    win.position.set((w.x + w.y) / 2, (w.z + w.w) / 2, lightUniforms.uWindowZ.value - 0.03);

    // 3) ayna cam
    const mirror = add(plane(2.4, 1.5, new THREE.MeshBasicMaterial({ map: textureOr('images/room', 'mirror', P.paintMirror) })), -9);
    mirror.position.set(-3.3, 1.55, -5.95);

    // 4) pervane: ilk prototipteki çizim, pencerenin önünde. Gölgeyi düşüren
    // sanal pervane (lightUniforms.uFanPos) ışık yolunun içindedir; ikisi aynı açıyla döner.
    this.fan = new CeilingFan({ width: 5.4 });
    this.fan.place(0, 2.47, -2.9);
    add(this.fan.mesh);

    // 5) ışık hüzmeleri ve sis
    this.volumes = [];
    const shaftZ = quality === 'high' ? [-5.2, -4.4, -3.6, -2.8, -2.0, -1.2] : [-4.8, -3.4, -2.0, -1.0];
    shaftZ.forEach((z, i) => {
      const m = add(plane(10, 4.4, shaftMaterial({ intensity: quality === 'high' ? 0.16 : 0.26, seed: i * 1.7 })), 1 + i * 2);
      m.position.set(0, 1.9, z);
      this.volumes.push(m);
    });
    const fogDefs = quality === 'high'
      ? [[-5.5, 0.24, 0.45], [-4.4, 0.2, 0.5], [-3.3, 0.17, 0.55], [-2.6, 0.14, 0.6], [-1.7, 0.1, 0.65], [-0.9, 0.05, 0.75]]
      : [[-5.0, 0.28, 0.45], [-3.0, 0.2, 0.55], [-1.4, 0.1, 0.7]];
    fogDefs.forEach(([z, d, sc], i) => {
      const m = add(plane(11, 4.6, fogMaterial({ density: d, scale: sc, seed: i * 2.3, speed: 1 + i * 0.15 })), 2 + i * 2);
      m.position.set(0, 1.85, z);
      this.volumes.push(m);
    });

    // 7) masa
    const deskMat = litMaterial(textureOr('images/room', 'desk', P.paintDesk), { ambient: 0.5, beam: 0.85, crt: 1.8, transparent: false });
    const desk = add(flat(plane(4, 3, deskMat)), 20);
    desk.position.set(0, DESK_Y, -0.1);
    const edge = add(plane(4, 0.06, litMaterial(textureOr('images/room', 'desk-edge', P.paintDeskEdge), { ambient: 0.45, beam: 0.6, transparent: false })), 19);
    edge.position.set(0, DESK_Y - 0.03, -1.6);

    // 8) masa objeleri
    const prop = (name, painter, w, h, opts = {}) => litMaterial(textureOr('images/room', name, painter), { ambient: 0.55, beam: 0.85, crt: 1.6, alphaTest: 0.02, ...opts });
    this.folder = add(flat(plane(0.3, 0.39, prop('folder', () => P.paintFolder())) ), 22);
    this.folder.position.set(-0.86, DESK_Y + 0.002, -0.05); this.folder.rotation.z = 0.12;
    this.report = add(flat(plane(0.25, 0.34, prop('report', P.paintReportPaper))), 23);
    this.report.position.set(-0.5, DESK_Y + 0.003, 0.32); this.report.rotation.z = -0.08;
    const ash = add(plane(0.2, 0.1, prop('ashtray', P.paintAshtray)), 24);
    ash.position.set(0.74, DESK_Y + 0.048, -0.05);
    const cas = add(plane(0.27, 0.105, prop('cassette', P.paintCassettePlayer)), 24);
    cas.position.set(0.52, DESK_Y + 0.05, 0.3);
    this.cassetteRec = add(plane(0.03, 0.03, glowMaterial('#ff3a2a', 0)), 25);
    this.cassetteRec.position.set(0.52 - 0.135 + 0.27 * (343 / 512), DESK_Y + 0.05 + 0.105 * (0.5 - 80 / 200), 0.302);
    const pens = add(plane(0.09, 0.135, prop('pencup', P.paintPenCup)), 22);
    pens.position.set(-0.62, DESK_Y + 0.066, -0.6);

    // sigara közü + duman
    const tip = new THREE.Vector3(0.74 + 0.2 * (206 / 256 - 0.5), DESK_Y + 0.048 + 0.1 * (0.5 - 57 / 128), -0.048);
    this.ember = add(plane(0.05, 0.05, glowMaterial('#ff8a3a', 1.2)), 26);
    this.ember.position.copy(tip).add(new THREE.Vector3(0, 0, 0.003));
    this.smoke = new Smoke(tip, { max: quality === 'high' ? 80 : 40 });
    add(this.smoke.points, 30);

    // 9) ön plan: çerçeve kenarındaki sandalyeler, toz
    for (const s of [-1, 1]) {
      const ch = add(plane(0.62, 1.65, litMaterial(textureOr('images/room', s < 0 ? 'chair-left' : 'chair-right', () => P.paintChairBack(s > 0)), { ambient: 0.4, beam: 0.3, crt: 0.3, alphaTest: 0.02 })), 40);
      ch.position.set(s * 1.85, 1.0, -0.2);
    }
    this.dust = new Dust(quality === 'high' ? 280 : 140);
    add(this.dust.points, 31);
  }

  update(dt, t, { recording = false } = {}) {
    const motion = this.reduce ? 0.35 : 1;
    this.fanSpeed = damp(this.fanSpeed, this.fanTarget, 0.8, dt);
    this.fanAngle += this.fanSpeed * dt * motion;
    this.fan.draw(this.fanAngle);
    lightUniforms.uFanAngle.value = -this.fanAngle;
    roomUniforms.uTime.value = t;
    // pencere ışığı pervane geçişiyle hafifçe dalgalanır
    const fl = 0.93 + 0.07 * (0.5 + 0.5 * Math.cos(5 * this.fanAngle));
    roomUniforms.uBeamColor.value.setRGB(0.62 * fl, 0.8 * fl, 0.76 * fl);

    this.ember.material.uniforms.uI.value = 0.8 + 0.4 * Math.sin(t * 1.7) * Math.sin(t * 0.7 + 1);
    this.cassetteRec.material.uniforms.uI.value = recording ? 0.6 + 0.3 * Math.sin(t * 3) : 0;
    this.smoke.fanBoost = this.fanSpeed / 1.05;
    this.smoke.update(dt, t, motion);
    this.dust.update(dt, t, motion);
  }
}
