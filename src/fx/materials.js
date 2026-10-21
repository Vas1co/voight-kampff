// Sahnede kullanılan özel malzemeler. Hepsi ışıksız (unlit) ve
// ortak pencere/pervane/CRT uniform'larını paylaşır.
import * as THREE from 'three';
import { NOISE, LIGHT, VERT_WORLD, lightUniforms } from './shaders/common.js';

// CRT'nin yeşil ışığının sahneye sızması için ortak uniform'lar.
export const crtUniforms = {
  uCrtPos: { value: new THREE.Vector3(0, 1.05, -0.4) },
  uCrtColor: { value: new THREE.Color('#7dffc4') },
  uCrtI: { value: 0.0 },
};

export const roomUniforms = {
  uTime: { value: 0 },
  uBeamColor: { value: new THREE.Color('#cfe9e2') },
  uAmbient: { value: 1.0 },
};

const shared = () => ({ ...lightUniforms, ...crtUniforms, ...roomUniforms });

// Masa, makine gövdesi, objeler ve siluet için: doku × (ortam + pencere ışığı + CRT).
export function litMaterial(map, {
  ambient = 0.55, beam = 0.9, crt = 1.0, tint = '#ffffff', transparent = true,
  alphaTest = 0.0, emissiveMap = null, rim = 0.0, beamShadowed = true,
} = {}) {
  return new THREE.ShaderMaterial({
    transparent,
    depthWrite: !transparent,
    uniforms: {
      ...shared(),
      map: { value: map },
      emissiveMap: { value: emissiveMap },
      uHasEmissive: { value: emissiveMap ? 1 : 0 },
      uAmb: { value: ambient },
      uBeamK: { value: beam },
      uCrtK: { value: crt },
      uTint: { value: new THREE.Color(tint) },
      uAlphaTest: { value: alphaTest },
      uRim: { value: rim },
      uOpacity: { value: 1 },
      uShadowed: { value: beamShadowed ? 1 : 0 },
    },
    vertexShader: VERT_WORLD,
    fragmentShader: /* glsl */ `
      ${NOISE}
      ${LIGHT}
      uniform sampler2D map; uniform sampler2D emissiveMap; uniform float uHasEmissive;
      uniform float uAmb, uBeamK, uCrtK, uAlphaTest, uRim, uOpacity, uShadowed, uTime, uCrtI;
      uniform vec3 uTint, uBeamColor, uCrtPos, uCrtColor;
      varying vec2 vUv; varying vec3 vWorld;
      void main(){
        vec4 tex = texture2D(map, vUv);
        if (tex.a < uAlphaTest) discard;
        float b = beam(vWorld);
        if (uShadowed > 0.5) b *= fanShadow(vWorld);
        vec3 toCrt = vWorld - uCrtPos;
        float d2 = dot(toCrt, toCrt);
        float front = smoothstep(-0.12, 0.06, toCrt.z);
        float crt = uCrtI * front / (1.0 + d2 * 22.0);
        vec3 light = uTint * uAmb + uBeamColor * b * uBeamK + uCrtColor * crt * uCrtK;
        vec3 col = tex.rgb * light;
        // siluetler için kenar ışığı: dokunun alfa kenarına yakın bölgeler pencere ışığı alır
        col += uBeamColor * b * uRim * (1.0 - tex.a * 0.0) * 0.25;
        if (uHasEmissive > 0.5) col += texture2D(emissiveMap, vUv).rgb;
        gl_FragColor = vec4(col, tex.a * uOpacity);
      }`,
  });
}

// Hacimsel sis düzlemi: gürültü × (ortam + hüzme × pervane gölgesi), toplamalı.
export function fogMaterial({ density = 0.25, scale = 0.55, speed = 1, seed = 0, ambient = 0.09, beamK = 1.1, color = '#9fc4c0' } = {}) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      ...shared(),
      uDensity: { value: density },
      uScale: { value: scale },
      uSpeed: { value: speed },
      uSeed: { value: seed },
      uFogAmb: { value: ambient },
      uFogBeam: { value: beamK },
      uFogColor: { value: new THREE.Color(color) },
    },
    vertexShader: VERT_WORLD,
    fragmentShader: /* glsl */ `
      ${NOISE}
      ${LIGHT}
      uniform float uTime, uDensity, uScale, uSpeed, uSeed, uFogAmb, uFogBeam, uCrtI;
      uniform vec3 uFogColor, uBeamColor, uCrtPos, uCrtColor;
      varying vec2 vUv; varying vec3 vWorld;
      void main(){
        float t = uTime * uSpeed;
        vec2 p = vWorld.xy * uScale + vec2(uSeed * 3.1 + t * 0.035, uSeed * 1.7 - t * 0.012);
        vec2 warp = vec2(fbm(p + vec2(0.0, t * 0.02)), fbm(p + vec2(5.2, 1.3) - t * 0.015));
        float n = fbm(p + warp * 1.6);
        n = smoothstep(0.28, 0.95, n);
        n *= mix(0.3, 1.0, smoothstep(0.9, 2.3, vWorld.y));
        float edge = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x)
                   * smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.7, vUv.y);
        float b = beam(vWorld) * fanShadow(vWorld);
        vec3 toCrt = vWorld - uCrtPos;
        float crt = uCrtI / (1.0 + dot(toCrt, toCrt) * 10.0);
        vec3 col = uFogColor * uFogAmb + uBeamColor * b * uFogBeam + uCrtColor * crt * 0.5;
        gl_FragColor = vec4(col * n * edge * uDensity, 1.0);
      }`,
  });
}

// Işık hüzmesi dilimi: odayı derinlik boyunca kesen dikey düzlem.
// Her nokta için pencere ışığını (beam) ve pervane gölgesini hesaplar;
// farklı derinlikteki dilimler üst üste binince eğik, hacimli hüzme oluşur.
export function shaftMaterial({ intensity = 0.1, seed = 0 } = {}) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { ...shared(), uI: { value: intensity }, uSeed: { value: seed } },
    vertexShader: VERT_WORLD,
    fragmentShader: /* glsl */ `
      ${NOISE}
      ${LIGHT}
      uniform float uTime, uI, uSeed;
      uniform vec3 uBeamColor;
      varying vec2 vUv; varying vec3 vWorld;
      void main(){
        float b = beam(vWorld);
        if (b < 0.002) { gl_FragColor = vec4(0.0); return; }
        // ışık yönünde uzayan çizgiler: toz yoğunluğu
        vec2 sp = vec2(vWorld.x * 2.6 - vWorld.y * 0.35 + uSeed, vWorld.y * 0.3 - uTime * 0.018);
        float streak = 0.35 + 0.65 * fbm(sp + vec2(0.0, uSeed));
        float edge = smoothstep(0.0, 0.12, vUv.x) * smoothstep(1.0, 0.88, vUv.x) * smoothstep(0.0, 0.1, vUv.y);
        float pulse = 0.85 + 0.15 * sin(uTime * 0.21 + uSeed * 4.0);
        float sh = fanShadow(vWorld);
        gl_FragColor = vec4(uBeamColor * uI * b * streak * sh * edge * pulse, 1.0);
      }`,
  });
}

// Arka duvar: doku + pencere çevresindeki saçılma.
export function wallMaterial(map) {
  return new THREE.ShaderMaterial({
    uniforms: { ...shared(), map: { value: map } },
    vertexShader: VERT_WORLD,
    fragmentShader: /* glsl */ `
      ${NOISE}
      ${LIGHT}
      uniform sampler2D map; uniform float uTime, uAmbient;
      uniform vec3 uBeamColor;
      varying vec2 vUv; varying vec3 vWorld;
      void main(){
        vec3 col = texture2D(map, vUv).rgb * uAmbient;
        float wx = clamp(vWorld.x, uWindow.x, uWindow.y);
        float dy = vWorld.y - (uWindow.z - 0.05);
        float dx = vWorld.x - wx;
        float glow = exp(-max(0.0, -dy) * 1.6) * exp(-abs(dx) * 1.2) * step(dy, 0.0);
        col += uBeamColor * glow * 0.22;
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
}

// Basit toplamalı parıltı (lamba, ışıma halesi).
export function glowMaterial(color = '#ffffff', intensity = 1) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uColor: { value: new THREE.Color(color) }, uI: { value: intensity } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uI; varying vec2 vUv;
      void main(){
        float d = length(vUv - 0.5) * 2.0;
        float g = exp(-d * d * 4.0) + 0.6 * exp(-d * d * 40.0);
        gl_FragColor = vec4(uColor * g * uI, 1.0);
      }`,
  });
}

export function updateRoomTime(t) { roomUniforms.uTime.value = t; }
