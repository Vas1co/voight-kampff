// Kamera planları, kesmeler, her planda yavaş içeri kayma, paralaks ve sarsıntı.
// Her plan, bakılan noktadaki uzaklıkta görünmesi gereken genişlik/yüksekliği
// tanımlar; görüş açısı ekran oranına göre hesaplanır. Alttaki kontrol paneli
// için görüntü merkezi yukarı kaydırılır (setViewOffset).
import * as THREE from 'three';
import { damp } from '../core/rng.js';

export const SHOTS = {
  wide: { pos: [0, 1.55, 2.6], look: [0, 1.62, -3.0], w: 6.9, h: 3.7, push: 0.04 },
  machine: { pos: [0, 1.29, 2.5], look: [0, 1.21, 0.35], w: 1.68, h: 1.07, push: 0.035 },
  crt: { pos: [0, 1.18, 1.35], look: [0, 1.18, 0.36], w: 0.49, h: 0.37, push: 0.05 },
  desk: { pos: [-0.2, 1.6, 2.0], look: [-0.4, 0.8, 0.5], w: 1.8, h: 1.1, push: 0.03 },
};

export class CameraRig {
  constructor() {
    this.camera = new THREE.PerspectiveCamera(40, 1, 0.03, 60);
    this.name = 'wide';
    this.shotT = 0;
    this.from = null; this.blend = 1; this.blendDur = 0;
    this.pointer = new THREE.Vector2();
    this.par = new THREE.Vector2();
    this.shake = 0;
    this.reduce = false;
    this.size = { w: 1, h: 1, top: 0, bottom: 0 };
    this.tmpPos = new THREE.Vector3();
    this.tmpLook = new THREE.Vector3();
    addEventListener('pointermove', (e) => {
      this.pointer.set((e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1);
    }, { passive: true });
    addEventListener('deviceorientation', (e) => {
      if (e.gamma == null) return;
      this.pointer.set(Math.max(-1, Math.min(1, e.gamma / 25)), Math.max(-1, Math.min(1, (e.beta - 45) / 25)));
    }, { passive: true });
  }

  cut(name) {
    if (!SHOTS[name]) return;
    this.name = name; this.shotT = 0; this.blend = 1; this.from = null;
  }

  // Yumuşak geçiş (nadiren; çoğunlukla kesme kullanılır).
  move(name, dur = 1.6) {
    if (!SHOTS[name]) return;
    this.from = this.current();
    this.name = name; this.shotT = 0; this.blend = 0; this.blendDur = dur;
  }

  kick(amount = 1) { if (!this.reduce) this.shake = Math.max(this.shake, amount); }

  setInsets(top, bottom) { this.size.top = top; this.size.bottom = bottom; this.apply(); }

  resize(w, h) { this.size.w = w; this.size.h = h; this.apply(); }

  current() {
    const s = SHOTS[this.name];
    const pos = new THREE.Vector3(...s.pos), look = new THREE.Vector3(...s.look);
    const k = this.reduce ? 0 : Math.min(1, this.shotT / 22) * s.push;
    pos.lerp(look, k);
    return { pos, look, w: s.w * (1 - k * 0.8), h: s.h * (1 - k * 0.8) };
  }

  apply() {
    const { w, h, top, bottom } = this.size;
    if (!w || !h) return;
    const cam = this.camera;
    let cur = this.current();
    if (this.from && this.blend < 1) {
      const e = this.blend * this.blend * (3 - 2 * this.blend);
      cur = {
        pos: this.from.pos.clone().lerp(cur.pos, e), look: this.from.look.clone().lerp(cur.look, e),
        w: this.from.w + (cur.w - this.from.w) * e, h: this.from.h + (cur.h - this.from.h) * e,
      };
    }
    const d = cur.pos.distanceTo(cur.look);
    const Ha = Math.max(1, h - top - bottom);
    const aspA = w / Ha;
    const tanH = Math.max(cur.h / 2 / d, cur.w / 2 / d / aspA);
    const yc = top + Ha / 2;
    let F, offY;
    if (yc <= h / 2) { F = 2 * (h - yc); offY = h - 2 * yc; } else { F = 2 * yc; offY = 0; }
    const tanF = tanH * (F / Ha);
    cam.fov = (2 * Math.atan(tanF) * 180) / Math.PI;
    cam.aspect = w / F;
    cam.setViewOffset(w, F, 0, offY, w, h);
    cam.updateProjectionMatrix();
    this.viewHeightPx = F;

    // paralaks + el kamerası salınımı + sarsıntı
    const amp = this.reduce ? 0 : d * 0.018;
    const t = performance.now() / 1000;
    const hand = this.reduce ? 0 : d * 0.0025;
    this.tmpPos.copy(cur.pos);
    this.tmpPos.x += this.par.x * amp + Math.sin(t * 0.13) * hand + (Math.random() - 0.5) * this.shake * 0.02;
    this.tmpPos.y += -this.par.y * amp * 0.6 + Math.sin(t * 0.11 + 1) * hand + (Math.random() - 0.5) * this.shake * 0.02;
    this.tmpPos.z += cur.pos.z > cur.look.z ? 0 : 0;
    cam.position.copy(this.tmpPos);
    this.tmpLook.copy(cur.look);
    this.tmpLook.x += this.par.x * amp * 0.25;
    cam.lookAt(this.tmpLook);
  }

  update(dt) {
    this.shotT += dt;
    if (this.blend < 1) this.blend = Math.min(1, this.blend + dt / Math.max(0.01, this.blendDur));
    const target = this.reduce ? new THREE.Vector2() : this.pointer;
    this.par.x = damp(this.par.x, target.x, 2.2, dt);
    this.par.y = damp(this.par.y, target.y, 2.2, dt);
    this.shake = damp(this.shake, 0, 5, dt);
    this.apply();
  }
}
