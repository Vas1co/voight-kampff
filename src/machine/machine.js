// Makineyi oluşturur: gövde + CRT + yan ekranlar + LED çubuğu + körük + lambalar + tuşlar.
// Gövde dokusu assets/images/room/machine.png ile değiştirilebilir.
import * as THREE from 'three';
import { textureOr } from '../core/assets.js';
import { litMaterial, glowMaterial, crtUniforms } from '../fx/materials.js';
import { crtMaterial } from '../fx/shaders/crt.js';
import { BODY, L, rectLocal, toLocal } from './layout.js';
import { paintBody, paintKey } from './body.js';
import { Crt } from './crt.js';
import { LeftMonitor, RightMonitor, LedBar } from './gauges.js';
import { Bellows } from './bellows.js';
import { Signals } from './signals.js';
import { damp } from '../core/rng.js';

class Lamp {
  constructor(color, r) {
    this.color = new THREE.Color(color);
    this.group = new THREE.Group();
    this.coreMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    this.core = new THREE.Mesh(new THREE.CircleGeometry(r, 20), this.coreMat);
    this.halo = new THREE.Mesh(new THREE.PlaneGeometry(r * 9, r * 9), glowMaterial(color, 0));
    this.halo.position.z = 0.002;
    this.group.add(this.core, this.halo);
    this.level = 0; this.target = 0;
  }
  set(v, color) { this.target = v; if (color) { this.color.set(color); this.halo.material.uniforms.uColor.value.set(color); } }
  update(dt) {
    this.level = damp(this.level, this.target, 18, dt);
    this.coreMat.color.copy(this.color).multiplyScalar(0.08 + this.level * 2.6);
    this.halo.material.uniforms.uI.value = this.level * 0.9;
  }
}

export class Machine {
  constructor() {
    this.group = new THREE.Group();
    this.signals = new Signals();
    this.reduce = false;
    const Z = 0.0015;

    // gövde
    const bodyTex = textureOr('images/room', 'machine', paintBody);
    this.bodyMat = litMaterial(bodyTex, { ambient: 0.66, beam: 0.6, crt: 1.2, alphaTest: 0.02, tint: '#fff0d6' });
    this.body = new THREE.Mesh(new THREE.PlaneGeometry(BODY.worldW, BODY.worldH), this.bodyMat);
    this.group.add(this.body);

    const place = (mesh, r, z = Z) => {
      const p = rectLocal(r);
      mesh.position.set(p.x, p.y, z);
      this.group.add(mesh);
      return p;
    };

    // CRT
    const cr = rectLocal(L.crt);
    this.crt = new Crt(cr.w, cr.h);
    place(this.crt.mesh, L.crt);

    // yan ekranlar
    this.left = new LeftMonitor();
    this.right = new RightMonitor();
    const lr = rectLocal(L.left), rr2 = rectLocal(L.right);
    this.leftMat = crtMaterial(this.left.texture, { curvature: 5.5, scan: 0.35, lines: 200, chroma: 0.8, noise: 0.03, roll: 0.05, tint: '#e6fff2', bright: 1.15, mask: 0.06, reflect: 0.07 });
    this.rightMat = crtMaterial(this.right.texture, { curvature: 7, scan: 0.12, lines: 260, chroma: 0.4, noise: 0.015, roll: 0.0, tint: '#fff8ec', bright: 0.95, mask: 0.03, reflect: 0.09 });
    place(new THREE.Mesh(new THREE.PlaneGeometry(lr.w, lr.h), this.leftMat), L.left);
    place(new THREE.Mesh(new THREE.PlaneGeometry(rr2.w, rr2.h), this.rightMat), L.right);

    // LED çubuğu
    this.led = new LedBar();
    const ledr = rectLocal(L.led);
    this.ledMat = new THREE.MeshBasicMaterial({ map: this.led.texture, color: new THREE.Color(1.9, 1.9, 1.9) });
    place(new THREE.Mesh(new THREE.PlaneGeometry(ledr.w, ledr.h), this.ledMat), L.led);

    // körük
    this.bellows = new Bellows();
    const br = rectLocal(L.bellows);
    this.bellowsMat = litMaterial(this.bellows.texture, { ambient: 0.75, beam: 0.9, crt: 0.6, alphaTest: 0.02 });
    this.bellowsMesh = new THREE.Mesh(new THREE.PlaneGeometry(br.w, br.h), this.bellowsMat);
    place(this.bellowsMesh, L.bellows, -0.002);
    this.intakeLocal = toLocal(L.bellows.x + L.bellows.w / 2, L.bellows.y + 40);

    // tuşlar
    const kw = (L.keySize.w / BODY.W) * BODY.worldW, kh = (L.keySize.h / BODY.H) * BODY.worldH;
    this.keys = L.keys.map((k, i) => {
      const lit = i === 2;
      const tx = new THREE.CanvasTexture(paintKey(lit));
      tx.colorSpace = THREE.SRGBColorSpace;
      const mat = new THREE.MeshBasicMaterial({ map: tx, color: lit ? new THREE.Color(2.2, 2.0, 1.7) : new THREE.Color(0.72, 0.72, 0.66) });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(kw, kh), mat);
      place(m, { x: k.x, y: k.y, w: L.keySize.w, h: L.keySize.h });
      return m;
    });

    // lambalar
    const lampAt = (lamp, px, py) => { const p = toLocal(px, py); lamp.group.position.set(p.x, p.y, Z * 2); this.group.add(lamp.group); return lamp; };
    this.stressLamp = lampAt(new Lamp('#ffb35a', 0.007), L.stressLamp.x, L.stressLamp.y);
    this.calLamp = lampAt(new Lamp('#ffb35a', 0.0055), L.calLamp.x, L.calLamp.y);
    this.recLamp = lampAt(new Lamp('#ff3a2a', 0.006), L.recLamp.x, L.recLamp.y);
    this.alarm = [];
    for (let i = 0; i < 8; i++) {
      this.alarm.push(lampAt(new Lamp('#ff3d30', 0.0042), L.alarm.x + 18 + i * 38, L.alarm.y + L.alarm.h / 2));
    }

    this.recording = false;
    this.stress = 0;
    this.calError = 0;
    this.t = 0;
    this.signals.onBeat = null;
  }

  setSubject(subject) {
    this.crt.setSubject(subject);
    const v = subject.vitals;
    this.signals.setIdle({ pupil: v.pupil, blush: v.blush, pulse: v.pulse, resp: v.resp, particles: v.particles });
    Object.assign(this.signals.cur, this.signals.idle);
  }

  setPower(on) {
    this.crt.setPower(on);
    this.bellows.active = on;
    this.signals.status = on ? 'warming' : 'off';
    this.powerOn = on;
  }

  // Dünya koordinatında körük emiş ağzı (toz parçacıkları için).
  intakeWorld(target = new THREE.Vector3()) {
    return target.set(this.intakeLocal.x, this.intakeLocal.y, 0.02).applyMatrix4(this.group.matrixWorld);
  }

  crtWorld(target = new THREE.Vector3()) {
    return this.crt.mesh.getWorldPosition(target);
  }

  update(dt, time) {
    this.t += dt;
    const s = this.signals;
    // güç: CRT ısınınca makine "boşta" durumuna geçer
    s.power = this.crt.power;
    if (this.powerOn && s.status === 'warming' && this.crt.power >= 1) s.status = 'idle';
    s.update(dt);
    this.crt.reduce = this.reduce;
    this.crt.measuring = s.status === 'sampling' || s.status === 'bellows';
    this.crt.update(dt, time);
    this.bellows.reduce = this.reduce;
    this.bellows.update(dt);
    this.left.draw(s, dt);
    this.right.draw(s, dt);
    this.led.draw(s.level, s.power);
    for (const m of [this.leftMat, this.rightMat]) {
      m.uniforms.uPower.value = this.crt.power;
      m.uniforms.uTime.value = time;
      m.uniforms.uMotion.value = this.reduce ? 0 : 1;
    }
    // ölçüm sırasında orta tuş yanıp söner
    const blink = this.crt.measuring && Math.floor(this.t * 5) % 2 === 0;
    this.keys[1].material.color.setRGB(blink ? 1.8 : 0.72, blink ? 1.8 : 0.72, blink ? 1.7 : 0.66);

    // lambalar
    const st = this.stress;
    if (st >= 85) this.stressLamp.set(0.6 + 0.4 * Math.sin(this.t * 9), '#ff4030');
    else if (st >= 60) this.stressLamp.set(0.55, '#ffb35a');
    else this.stressLamp.set(this.powerOn ? 0.08 : 0, '#ffb35a');
    this.calLamp.set(Math.abs(this.calError) > 0.25 && this.powerOn ? (Math.floor(this.t * 2.5) % 2 ? 0.8 : 0.1) : 0);
    this.recLamp.set(this.recording ? 0.55 + 0.45 * Math.sin(this.t * 3.1) : 0);
    const anomaly = s.anomaly != null;
    this.alarm.forEach((l, i) => l.set(anomaly ? (Math.random() > 0.15 ? 1 : 0.2) : (this.powerOn && i < Math.round(s.level * 3) ? 0.25 : 0)));
    for (const l of [this.stressLamp, this.calLamp, this.recLamp, ...this.alarm]) l.update(dt);

    // CRT ışığı sahneye vurur; ölçüm sırasında titrer
    const flick = this.crt.measuring && !this.reduce ? 0.82 + Math.random() * 0.3 : 1;
    crtUniforms.uCrtI.value = this.crt.power * 0.95 * flick * (1 - this.crt.glitch * 0.4);
  }
}
