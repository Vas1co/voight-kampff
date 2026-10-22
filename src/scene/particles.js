// Toz zerreleri ve sigara dumanı (THREE.Points, özel shader).
// Toz pencere hüzmesinde parlar; körük çekerken emiş ağzına akar.
import * as THREE from 'three';
import { NOISE, LIGHT, lightUniforms } from '../fx/shaders/common.js';
import { crtUniforms, roomUniforms } from '../fx/materials.js';
import { paintPuff } from './procedural.js';

const puffTex = (() => {
  const t = new THREE.CanvasTexture(paintPuff());
  return t;
})();

function pointsMaterial({ additive = true, baseColor = '#cfe6e0', alpha = 1, lampK = 1, ambient = 0.2 }) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    uniforms: {
      ...lightUniforms, ...crtUniforms, ...roomUniforms,
      map: { value: puffTex },
      uColor: { value: new THREE.Color(baseColor) },
      uAlpha: { value: alpha },
      uLampK: { value: lampK },
      uAmbK: { value: ambient },
      uScale: { value: 600 },
    },
    vertexShader: /* glsl */ `
      attribute float aSize; attribute float aAlpha;
      varying float vA; varying vec3 vWorld;
      uniform float uScale;
      void main(){
        vec4 w = modelMatrix * vec4(position, 1.0);
        vWorld = w.xyz; vA = aAlpha;
        vec4 mv = viewMatrix * w;
        gl_PointSize = aSize * uScale / max(0.1, -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      ${NOISE}
      ${LIGHT}
      uniform sampler2D map; uniform vec3 uColor, uCrtPos, uCrtColor; uniform float uAlpha, uLampK, uAmbK, uCrtI;
      varying float vA; varying vec3 vWorld;
      void main(){
        float m = texture2D(map, gl_PointCoord).a;
        float b = lamp(vWorld);
        vec3 toCrt = vWorld - uCrtPos;
        float crt = uCrtI / (1.0 + dot(toCrt, toCrt) * 25.0);
        vec3 col = uColor * (uAmbK + b * uLampK) + uCrtColor * crt * 0.6;
        gl_FragColor = vec4(col * m * vA * uAlpha, m * vA * uAlpha);
      }`,
  });
}

export class Dust {
  constructor(count = 260) {
    this.count = count;
    const pos = new Float32Array(count * 3), size = new Float32Array(count), alpha = new Float32Array(count);
    this.vel = new Float32Array(count * 3);
    this.phase = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      this.reset(pos, i, true);
      size[i] = 0.004 + Math.random() * 0.01;
      this.phase[i] = Math.random() * Math.PI * 2;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    g.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1));
    this.points = new THREE.Points(g, pointsMaterial({ additive: true, baseColor: '#e6f5f0', lampK: 0.9, ambient: 0.04 }));
    this.points.frustumCulled = false;
    this.attractor = null;
    this.pull = 0;
  }

  reset(pos, i, anywhere) {
    pos[i * 3] = (Math.random() - 0.5) * 4.2;
    pos[i * 3 + 1] = 0.8 + Math.random() * 2.1;
    pos[i * 3 + 2] = -3.6 + Math.random() * 4.6;
    if (!anywhere) pos[i * 3 + 1] = 2.9;
    this.vel[i * 3] = (Math.random() - 0.5) * 0.02;
    this.vel[i * 3 + 1] = (Math.random() - 0.5) * 0.012;
    this.vel[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
  }

  update(dt, t, motion = 1) {
    const g = this.points.geometry, pos = g.attributes.position.array, al = g.attributes.aAlpha.array;
    const A = this.attractor;
    for (let i = 0; i < this.count; i++) {
      const k = i * 3;
      let vx = this.vel[k], vy = this.vel[k + 1], vz = this.vel[k + 2];
      vx += Math.sin(t * 0.3 + this.phase[i]) * 0.002 * dt;
      if (A && this.pull > 0) {
        const dx = A.x - pos[k], dy = A.y - pos[k + 1], dz = A.z - pos[k + 2];
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < 0.5) {
          const f = (this.pull * 0.6) / (0.02 + d2);
          vx += dx * f * dt; vy += dy * f * dt; vz += dz * f * dt;
          if (d2 < 0.0015) { this.reset(pos, i, true); continue; }
        }
      }
      vx *= 0.985; vy *= 0.985; vz *= 0.985;
      this.vel[k] = vx; this.vel[k + 1] = vy; this.vel[k + 2] = vz;
      pos[k] += vx * dt * motion * 6; pos[k + 1] += vy * dt * motion * 6; pos[k + 2] += vz * dt * motion * 6;
      if (pos[k + 1] < 0.6 || pos[k + 1] > 3.1 || Math.abs(pos[k]) > 2.4 || pos[k + 2] > 1.2 || pos[k + 2] < -4) this.reset(pos, i, true);
      al[i] = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * (0.5 + (i % 7) * 0.2) + this.phase[i]));
    }
    g.attributes.position.needsUpdate = true;
    g.attributes.aAlpha.needsUpdate = true;
  }
}

export class Smoke {
  constructor(origin, { max = 70, rate = 7 } = {}) {
    this.origin = origin.clone();
    this.max = max; this.rate = rate; this.acc = 0;
    this.parts = [];
    const pos = new Float32Array(max * 3), size = new Float32Array(max), alpha = new Float32Array(max);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    g.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1));
    this.points = new THREE.Points(g, pointsMaterial({ additive: true, baseColor: '#b9d4cf', lampK: 0.45, ambient: 0.12, alpha: 0.5 }));
    this.points.frustumCulled = false;
    this.fanBoost = 0;
  }

  update(dt, t, motion = 1) {
    this.acc += dt * this.rate;
    while (this.acc > 1 && this.parts.length < this.max) {
      this.acc -= 1;
      this.parts.push({ x: this.origin.x, y: this.origin.y, z: this.origin.z, age: 0, life: 6 + Math.random() * 3, sd: Math.random() * 100 });
    }
    if (this.acc > 1) this.acc = 1;
    const g = this.points.geometry, pos = g.attributes.position.array, size = g.attributes.aSize.array, al = g.attributes.aAlpha.array;
    let n = 0;
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      p.age += dt;
      if (p.age > p.life) { this.parts.splice(i, 1); continue; }
      const sw = Math.sin(p.age * 1.3 + p.sd) * 0.03 + Math.sin(t * 0.3) * 0.012;
      p.x += (sw - 0.01 * this.fanBoost) * dt * motion;
      p.y += (0.07 + p.age * 0.012) * dt * motion;
      p.z += (Math.sin(p.age * 0.7 + p.sd) * 0.01 + 0.004) * dt * motion;
    }
    for (const p of this.parts) {
      const k = p.age / p.life;
      pos[n * 3] = p.x; pos[n * 3 + 1] = p.y; pos[n * 3 + 2] = p.z;
      size[n] = 0.012 + p.age * 0.035;
      al[n] = Math.min(1, p.age / 0.6) * (1 - k) * 0.55;
      n++;
    }
    for (let i = n; i < this.max; i++) al[i] = 0;
    g.attributes.position.needsUpdate = true;
    g.attributes.aSize.needsUpdate = true;
    g.attributes.aAlpha.needsUpdate = true;
  }
}

export function setPointScale(obj, viewportH, fovDeg) {
  // Nokta boyutunu ekran yüksekliğine göre ölçekle.
  obj.material.uniforms.uScale.value = viewportH / (2 * Math.tan((fovDeg * Math.PI) / 360));
}
