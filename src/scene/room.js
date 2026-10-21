// Sorgu odası katmanları (arkadan öne): duvar + pencere → ayna cam → pervane →
// ışık hüzmeleri ve sis → denek silueti → masa → masa objeleri → ön plan.
// Her katmanın dokusu assets/images/room/<ad>.png ile değiştirilebilir.
import * as THREE from 'three';
import { textureOr } from '../core/assets.js';
import { litMaterial, fogMaterial, shaftMaterial, wallMaterial, glowMaterial, roomUniforms } from '../fx/materials.js';
import { lightUniforms } from '../fx/shaders/common.js';
import * as P from './procedural.js';
import { Dust, Smoke } from './particles.js';
import { damp } from '../core/rng.js';

const DESK_Y = 0.76;

function plane(w, h, mat) { return new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); }
function flat(mesh) { mesh.rotation.x = -Math.PI / 2; return mesh; }

export class Room {
  constructor({ quality = 'high' } = {}) {
    this.group = new THREE.Group();
    this.quality = quality;
    this.fanAngle = 0;
    this.fanSpeed = 5.6;      // rad/sn
    this.fanTarget = 5.6;
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
    this.windowMat = new THREE.MeshBasicMaterial({ map: winTex, color: new THREE.Color(1.45, 1.42, 1.35) });
    const w = lightUniforms.uWindow.value;
    const win = add(plane(w.y - w.x, w.w - w.z, this.windowMat), -9);
    win.position.set((w.x + w.y) / 2, (w.z + w.w) / 2, lightUniforms.uWindowZ.value - 0.03);

    // 3) ayna cam
    const mirror = add(plane(2.4, 1.5, new THREE.MeshBasicMaterial({ map: textureOr('images/room', 'mirror', P.paintMirror) })), -9);
    mirror.position.set(-3.3, 1.55, -5.95);

    // 4) pervane (yatay düzlem, dönen) + hareket bulanıklığı kopyaları
    // Görünen pervane pencerenin önünde durur; gölgeyi düşüren sanal pervane
    // (lightUniforms.uFanPos) ışık yolunun içindedir. İkisi aynı açıyla döner.
    const fp = new THREE.Vector3(0, 2.42, -3.3);
    const fanTex = textureOr('images/room', 'fan', P.paintFan);
    this.fanBlades = [];
    const fanRoot = new THREE.Group();
    fanRoot.position.copy(fp);
    fanRoot.rotation.x = -Math.PI / 2;
    for (let k = 0; k < 4; k++) {
      const m = plane(2.5, 2.5, new THREE.MeshBasicMaterial({ map: fanTex, transparent: true, side: THREE.DoubleSide, opacity: k ? 0.22 / k : 1, depthWrite: false, color: new THREE.Color(0.35, 0.4, 0.4) }));
      fanRoot.add(m);
      this.fanBlades.push(m);
    }
    this.group.add(fanRoot);
    const motor = add(plane(0.5, 0.5, new THREE.MeshBasicMaterial({ map: textureOr('images/room', 'fan-motor', P.paintFanMotor), transparent: true, depthWrite: false })), -4);
    motor.position.set(fp.x, fp.y + 0.16, fp.z);
    const rod = add(plane(0.03, 2.5, new THREE.MeshBasicMaterial({ color: 0x0a1011 })), -6);
    rod.position.set(fp.x, fp.y + 1.4, fp.z);

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

    // 6) denek silueti
    this.subjectMat = litMaterial(textureOr('images/room', 'subject-s1', () => P.paintSubject()), { ambient: 0.22, beam: 0.5, crt: 0.4, alphaTest: 0.02, rim: 0.4 });
    this.subject = add(plane(0.95, 1.42, this.subjectMat), 5);
    this.subjectHome = new THREE.Vector3(1.05, 1.18, -2.3);
    this.subject.position.copy(this.subjectHome);
    this.subjectLean = 0;
    this.subjectAttack = -1;

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
    this.folder.userData.pick = 'file';
    this.report = add(flat(plane(0.25, 0.34, prop('report', P.paintReportPaper))), 23);
    this.report.position.set(-0.5, DESK_Y + 0.003, 0.32); this.report.rotation.z = -0.08;
    this.report.userData.pick = 'report';
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

  // Masa üstündeki tıklanabilir objeler.
  get pickables() { return [this.folder, this.report]; }

  setSubjectTexture(id, painter) {
    this.subjectMat.uniforms.map.value = textureOr('images/room', `subject-${id}`, painter);
  }

  attack() { this.subjectAttack = 0; }
  resetSubject() { this.subjectAttack = -1; this.subject.position.copy(this.subjectHome); this.subject.scale.set(1, 1, 1); this.subjectMat.uniforms.uOpacity.value = 1; }

  update(dt, t, { stress = 0, recording = false } = {}) {
    const motion = this.reduce ? 0.35 : 1;
    this.fanSpeed = damp(this.fanSpeed, this.fanTarget, 0.8, dt);
    this.fanAngle += this.fanSpeed * dt * motion;
    this.fanBlades.forEach((b, k) => { b.rotation.z = this.fanAngle - k * 0.05; });
    lightUniforms.uFanAngle.value = -this.fanAngle;
    roomUniforms.uTime.value = t;
    // pencere ışığı pervane geçişiyle hafifçe dalgalanır
    const fl = 0.96 + 0.04 * Math.cos(5 * this.fanAngle);
    roomUniforms.uBeamColor.value.setRGB(0.62 * fl, 0.8 * fl, 0.76 * fl);

    // denek: nefes, gerginlikte öne eğilme, saldırı
    const s = this.subject, home = this.subjectHome;
    this.subjectLean = damp(this.subjectLean, Math.max(0, (stress - 50) / 50), 1.5, dt);
    const breath = this.reduce ? 0 : Math.sin(t * (1.2 + stress / 60)) * 0.006;
    if (this.subjectAttack >= 0) {
      this.subjectAttack += dt;
      const k = Math.min(1, this.subjectAttack / 0.55);
      const e = k * k * (3 - 2 * k);
      s.position.set(home.x - 0.7 * e, home.y + 0.05 * e, home.z + 2.6 * e);
      s.scale.setScalar(1 + e * 0.6);
    } else {
      s.position.set(home.x - this.subjectLean * 0.05, home.y + breath - this.subjectLean * 0.02, home.z + this.subjectLean * 0.25);
      s.scale.set(1, 1 + breath * 0.5, 1);
    }

    this.ember.material.uniforms.uI.value = 0.8 + 0.4 * Math.sin(t * 1.7) * Math.sin(t * 0.7 + 1);
    this.cassetteRec.material.uniforms.uI.value = recording ? 0.6 + 0.3 * Math.sin(t * 3) : 0;
    this.smoke.fanBoost = this.fanSpeed / 5.6;
    this.smoke.update(dt, t, motion);
    this.dust.update(dt, t, motion);
  }
}
