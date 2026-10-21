// Three.js sahnesi: renderer, oda, makine, kamera, post-processing ve tıklama seçimi.
import * as THREE from 'three';
import { Room } from './room.js';
import { CameraRig } from './camera.js';
import { Machine } from '../machine/machine.js';
import { BODY } from '../machine/layout.js';
import { createPost } from '../fx/post.js';
import { crtUniforms } from '../fx/materials.js';
import { setPointScale } from './particles.js';
import { bus } from '../core/events.js';

export class Stage {
  constructor(canvas, { quality = 'high', reduceMotion = false } = {}) {
    this.canvas = canvas;
    this.quality = quality;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', alpha: false });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.setClearColor(0x020506, 1);

    this.scene = new THREE.Scene();
    this.rig = new CameraRig();
    this.room = new Room({ quality });
    this.scene.add(this.room.group);

    this.machine = new Machine();
    this.machine.group.position.set(-0.1, 0.76 + BODY.worldH / 2, -0.45);


    this.scene.add(this.machine.group);
    this.scene.updateMatrixWorld(true);
    this.machine.crtWorld(crtUniforms.uCrtPos.value);
    crtUniforms.uCrtPos.value.z += 0.03;
    this.room.dust.attractor = this.machine.intakeWorld();

    this.post = createPost(this.renderer, this.scene, this.rig.camera, { quality });
    this.film = this.post.film.uniforms;
    this.setReduceMotion(reduceMotion);

    this.raycaster = new THREE.Raycaster();
    canvas.addEventListener('click', (e) => this.pick(e));
    canvas.addEventListener('pointermove', (e) => this.hover(e));

    this.insets = { top: 0, bottom: 0 };
    this.resize();
    addEventListener('resize', () => this.resize());
  }

  setReduceMotion(on) {
    this.reduce = on;
    this.rig.reduce = on;
    this.room.reduce = on;
    this.machine.reduce = on;
    this.film.uMotion.value = on ? 0 : 1;
  }

  setInsets(top, bottom) {
    this.insets = { top, bottom };
    this.rig.setInsets(top, bottom);
  }

  resize() {
    const w = innerWidth, h = innerHeight;
    const pr = Math.min(window.devicePixelRatio || 1, this.quality === 'high' ? 1.5 : 1);
    this.renderer.setPixelRatio(pr);
    this.renderer.setSize(w, h, false);
    this.post.setSize(w, h, pr);
    this.rig.resize(w, h);
  }

  ndc(e) {
    const r = this.canvas.getBoundingClientRect();
    return new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  }

  hit(e) {
    this.raycaster.setFromCamera(this.ndc(e), this.rig.camera);
    const hits = this.raycaster.intersectObjects(this.room.pickables, false);
    return hits[0]?.object?.userData?.pick ?? null;
  }

  pick(e) {
    const what = this.hit(e);
    if (what) bus.emit('pick', what);
  }

  hover(e) {
    this.canvas.style.cursor = this.hit(e) ? 'pointer' : '';
  }

  update(dt, t, ctx = {}) {
    this.rig.update(dt);
    this.room.dust.pull = this.machine.bellows.pulling ? 1 : 0;
    this.room.update(dt, t, ctx);
    this.machine.update(dt, t);
    this.film.uTime.value = t;
    setPointScale(this.room.dust.points, this.rig.viewHeightPx || innerHeight, this.rig.camera.fov);
    setPointScale(this.room.smoke.points, this.rig.viewHeightPx || innerHeight, this.rig.camera.fov);
  }

  render() { this.post.composer.render(); }
}
