// Ana CRT: ekran arayüzünü (screen.js) CRT shader'ı ile gösterir. Göz görüntüsü
// prosedürel çizilir; assets/video/eyes/<denek>-loop.(webm|mp4) varsa döngüsel video,
// <denek>-dilate varsa göz bebeği genişleme klibi kullanılır. Her iki durumda da
// görüntü yeşil monokrom taramaya çevrilir ve arayüz üstüne çizilir.
import * as THREE from 'three';
import { crtMaterial } from '../fx/shaders/crt.js';
import { assets, videoTexture } from '../core/assets.js';
import { Eye } from './eye.js';
import { CrtScreen } from './screen.js';
import { damp } from '../core/rng.js';

export class Crt {
  constructor(w, h) {
    this.eye = new Eye({});
    this.screen = new CrtScreen(this.eye);
    this.tex = new THREE.CanvasTexture(this.screen.canvas);
    this.tex.colorSpace = THREE.SRGBColorSpace;
    this.tex.minFilter = THREE.LinearFilter;
    this.tex.generateMipmaps = false;
    this.material = crtMaterial(this.tex, { tint: '#f2fff8', bright: 1.25 });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), this.material);
    this.power = 0; this.powerTarget = 0;
    this.glitch = 0; this.glitchT = 0;
    this.video = null;
    this.measuring = false;
    this.reduce = false;
    this.nextRandomGlitch = 8;
  }

  setSubject(subject) {
    this.eye.setSubject(subject.eye ?? {});
    this.eye.snapPupil(subject.vitals.pupil);
    this.useVideo(subject.id);
  }

  useVideo(id) {
    const loopUrl = assets.video('video/eyes', `${id}-loop`);
    const dilateUrl = assets.video('video/eyes', `${id}-dilate`);
    if (this.video) { this.video.loop.video.pause(); this.video = null; }
    this.screen.source = null;
    if (!loopUrl) return;
    const loop = videoTexture(loopUrl);
    const dilate = dilateUrl ? videoTexture(dilateUrl, { loop: false }) : null;
    this.video = { loop, dilate };
    loop.video.play().catch(() => {});
    this.screen.source = loop.video;
    if (dilate) dilate.video.addEventListener('ended', () => { this.screen.source = loop.video; });
  }

  // Göz bebeği tepkisi (prosedürel gözde çap, videoda genişleme klibi).
  pupil(mm, rate) {
    this.eye.setPupil(mm, rate);
    const v = this.video;
    if (v?.dilate && mm > this.eye.pupilMM * 1.03) {
      v.dilate.video.currentTime = 0;
      v.dilate.video.playbackRate = Math.min(2, Math.max(0.5, rate / 2));
      v.dilate.video.play().catch(() => {});
      this.screen.source = v.dilate.video;
    }
  }

  setPower(on) {
    this.powerTarget = on ? 1 : 0;
    if (!on) this.screen.set('off');
    else if (this.screen.mode === 'off') this.screen.set('idle');
  }

  kick(amount = 0.6, dur = 0.35) { this.glitch = Math.max(this.glitch, amount); this.glitchT = Math.max(this.glitchT, dur); }

  update(dt, time) {
    const u = this.material.uniforms;
    // açılış yavaş (ısınma), kapanış hızlı
    if (this.powerTarget > this.power) this.power = Math.min(this.powerTarget, this.power + dt / 2.6);
    else if (this.powerTarget < this.power) this.power = damp(this.power, this.powerTarget, 9, dt);
    if (this.glitchT > 0) this.glitchT -= dt; else this.glitch = damp(this.glitch, 0, 6, dt);
    // ara sıra kendiliğinden sinyal bozulması
    if (this.power > 0.9 && !this.reduce) {
      this.nextRandomGlitch -= dt;
      if (this.nextRandomGlitch <= 0) { this.kick(0.25 + Math.random() * 0.35, 0.12 + Math.random() * 0.2); this.nextRandomGlitch = 6 + Math.random() * 14; }
    }
    u.uPower.value = this.power;
    u.uGlitch.value = this.glitch;
    u.uTime.value = time;
    u.uMotion.value = this.reduce ? 0 : 1;
    u.uFlicker.value = this.measuring ? 0.08 : 0.03;
    this.eye.reduce = this.reduce;
    this.eye.focus = this.measuring ? 1 : 0.92;
    this.eye.update(dt, this.measuring);
    this.screen.update(dt);
    if (this.power > 0.02) {
      if (this.screen.usesEye && !this.screen.source) this.eye.render();
      this.screen.render();
      this.tex.needsUpdate = true;
    }
  }
}
