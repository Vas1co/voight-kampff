// Sahnede kullanılan özel malzemeler. Hepsi ışıksız (unlit) ve ortak
// floresan armatür / CRT uniform'larını paylaşır.
import * as THREE from 'three';
import { NOISE, LIGHT, VERT_WORLD, lightUniforms } from './shaders/common.js';

// CRT'nin yeşil ışığının çevreye sızması için ortak uniform'lar.
export const crtUniforms = {
  uCrtPos: { value: new THREE.Vector3(0, 1.05, -0.4) },
  uCrtColor: { value: new THREE.Color('#7dffc4') },
  uCrtI: { value: 0.0 },
};

export const roomUniforms = {
  uTime: { value: 0 },
  uLampColor: { value: new THREE.Color('#dbe9e4') },
};

const shared = () => ({ ...lightUniforms, ...crtUniforms, ...roomUniforms });

// Duvarlar, masa, makine, objeler: doku × (ortam + floresan + CRT sızıntısı).
export function litMaterial(map, {
  ambient = 0.35, lamp = 1.0, crt = 1.0, tint = '#ffffff', transparent = true,
  alphaTest = 0.0, emissiveMap = null, side = THREE.FrontSide,
} = {}) {
  return new THREE.ShaderMaterial({
    transparent,
    side,
    depthWrite: !transparent || alphaTest > 0.4,
    uniforms: {
      ...shared(),
      map: { value: map },
      emissiveMap: { value: emissiveMap },
      uHasEmissive: { value: emissiveMap ? 1 : 0 },
      uAmb: { value: ambient },
      uLampK: { value: lamp },
      uCrtK: { value: crt },
      uTint: { value: new THREE.Color(tint) },
      uAlphaTest: { value: alphaTest },
      uOpacity: { value: 1 },
    },
    vertexShader: VERT_WORLD,
    fragmentShader: /* glsl */ `
      ${LIGHT}
      uniform sampler2D map; uniform sampler2D emissiveMap; uniform float uHasEmissive;
      uniform float uAmb, uLampK, uCrtK, uAlphaTest, uOpacity, uCrtI;
      uniform vec3 uTint, uLampColor, uCrtPos, uCrtColor;
      varying vec2 vUv; varying vec3 vWorld;
      void main(){
        vec4 tex = texture2D(map, vUv);
        if (tex.a < uAlphaTest) discard;
        vec3 toCrt = vWorld - uCrtPos;
        float front = smoothstep(-0.12, 0.06, toCrt.z);
        float crt = uCrtI * front / (1.0 + dot(toCrt, toCrt) * 22.0);
        vec3 light = uTint * uAmb + uLampColor * lamp(vWorld) * uLampK + uCrtColor * crt * uCrtK;
        vec3 col = tex.rgb * light;
        if (uHasEmissive > 0.5) col += texture2D(emissiveMap, vUv).rgb;
        gl_FragColor = vec4(col, tex.a * uOpacity);
      }`,
  });
}

// Havada asılı ince duman/toz perdesi: gürültü × armatür ışığı, toplamalı.
export function fogMaterial({ density = 0.2, scale = 0.55, speed = 1, seed = 0, ambient = 0.05, lampK = 0.6, color = '#9fb9b4' } = {}) {
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
      uFogLamp: { value: lampK },
      uFogColor: { value: new THREE.Color(color) },
    },
    vertexShader: VERT_WORLD,
    fragmentShader: /* glsl */ `
      ${NOISE}
      ${LIGHT}
      uniform float uTime, uDensity, uScale, uSpeed, uSeed, uFogAmb, uFogLamp, uCrtI;
      uniform vec3 uFogColor, uLampColor, uCrtPos, uCrtColor;
      varying vec2 vUv; varying vec3 vWorld;
      void main(){
        float t = uTime * uSpeed;
        vec2 p = vWorld.xy * uScale + vec2(uSeed * 3.1 + t * 0.03, uSeed * 1.7 - t * 0.01);
        vec2 warp = vec2(fbm(p + vec2(0.0, t * 0.02)), fbm(p + vec2(5.2, 1.3) - t * 0.015));
        float n = smoothstep(0.3, 0.95, fbm(p + warp * 1.6));
        float edge = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x)
                   * smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.7, vUv.y);
        vec3 toCrt = vWorld - uCrtPos;
        float crt = uCrtI / (1.0 + dot(toCrt, toCrt) * 10.0);
        vec3 col = uFogColor * uFogAmb + uLampColor * lamp(vWorld) * uFogLamp * 0.35 + uCrtColor * crt * 0.4;
        gl_FragColor = vec4(col * n * edge * uDensity, 1.0);
      }`,
  });
}

// Basit toplamalı parıltı (lamba, gösterge ışığı).
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
