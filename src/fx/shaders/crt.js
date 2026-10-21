// CRT ekran shader'ı: bombe, tarama çizgileri, fosfor, renk kayması,
// kayan parazit bandı, sinyal bozulması, açılış/kapanış çizgisi.
import * as THREE from 'three';
import { NOISE } from './common.js';

export function crtMaterial(map, opts = {}) {
  const o = {
    curvature: 3.4, scan: 0.55, lines: 240, chroma: 1.2, noise: 0.04, roll: 0.07,
    tint: '#e4f7e8', bright: 1.3, mask: 0.12, reflect: 0.06, ...opts,
  };
  return new THREE.ShaderMaterial({
    uniforms: {
      map: { value: map },
      uTime: { value: 0 },
      uPower: { value: 0 },
      uGlitch: { value: 0 },
      uRoll: { value: o.roll },
      uCurv: { value: o.curvature },
      uScan: { value: o.scan },
      uLines: { value: o.lines },
      uChroma: { value: o.chroma },
      uNoise: { value: o.noise },
      uBright: { value: o.bright },
      uTint: { value: new THREE.Color(o.tint) },
      uMask: { value: o.mask },
      uReflect: { value: o.reflect },
      uFlicker: { value: 0.03 },
      uMotion: { value: 1 },
    },
    vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */ `
      ${NOISE}
      uniform sampler2D map;
      uniform float uTime, uPower, uGlitch, uRoll, uCurv, uScan, uLines, uChroma, uNoise, uBright, uMask, uReflect, uFlicker, uMotion;
      uniform vec3 uTint;
      varying vec2 vUv;

      vec2 bend(vec2 uv){
        uv = uv * 2.0 - 1.0;
        vec2 off = abs(uv.yx) / vec2(uCurv, uCurv * 0.85);
        uv = uv + uv * off * off;
        return uv * 0.5 + 0.5;
      }

      void main(){
        vec2 uv = bend(vUv);
        float inside = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
        float t = uTime * uMotion;

        // açılış: önce parlak yatay çizgi, sonra dikey açılma
        float p = clamp(uPower, 0.0, 1.0);
        float openY = smoothstep(0.3, 0.9, p);
        float openX = smoothstep(0.02, 0.3, p);
        float xMask = 1.0 - smoothstep(openX * 0.5, openX * 0.5 + 0.02, abs(uv.x - 0.5));
        float halfH = mix(0.003, 0.5, openY);
        float yMask = 1.0 - smoothstep(halfH, halfH + 0.01, abs(uv.y - 0.5));
        float vy = (uv.y - 0.5) * (0.5 / halfH) + 0.5;

        // sinyal bozulması: satır bantlarında yatay kayma
        float band = floor(uv.y * 48.0 + floor(t * 9.0) * 7.0);
        float jump = step(0.82, hash12(vec2(band, floor(t * 17.0))));
        float g = uGlitch * (hash12(vec2(band * 1.7, floor(t * 23.0))) - 0.5) * jump;
        float wobble = sin(uv.y * 140.0 + t * 40.0) * uGlitch * 0.004;
        vec2 suv = vec2(uv.x + g * 0.18 + wobble, mix(0.5, vy, openY));
        suv.y += uGlitch * 0.05 * step(0.9, hash12(vec2(floor(t * 11.0), 3.0))) * (hash12(vec2(floor(t * 11.0), 9.0)) - 0.5);

        float ca = (uChroma + uGlitch * 6.0) / 640.0;
        vec3 col;
        col.r = texture2D(map, suv + vec2(ca, 0.0)).r;
        col.g = texture2D(map, suv).g;
        col.b = texture2D(map, suv - vec2(ca, 0.0)).b;
        // fosfor yayılması
        vec3 halo = texture2D(map, suv + vec2(0.0, 1.5 / uLines)).rgb + texture2D(map, suv - vec2(0.0, 1.5 / uLines)).rgb;
        col = mix(col, halo * 0.5, 0.22);
        col *= uTint;

        float sl = 0.5 + 0.5 * sin(uv.y * uLines * 3.14159265);
        col *= mix(1.0, 0.45 + 0.75 * sl, uScan);
        float m = 0.5 + 0.5 * sin(uv.x * uLines * 4.0 * 3.14159265);
        col *= 1.0 - uMask * m;

        // kayan parazit bandı
        float roll = fract(t * uRoll);
        float rb = exp(-pow((uv.y - roll) * 14.0, 2.0));
        col += vec3(0.05, 0.07, 0.06) * rb;
        col *= 1.0 - rb * 0.1;

        // kar
        float sn = hash12(uv * vec2(640.0, 480.0) + fract(t * 7.3) * 91.0);
        col += (sn - 0.5) * (uNoise + uGlitch * 0.25);

        // tüp kenarı kararması
        vec2 q = uv * (1.0 - uv.yx);
        float vig = pow(clamp(q.x * q.y * 18.0, 0.0, 1.0), 0.35);
        col *= vig;

        float flick = 1.0 - uFlicker * hash12(vec2(floor(t * 50.0), 1.0)) * uMotion;
        col *= uBright * flick;

        col *= mix(yMask * xMask, 1.0, openY) * smoothstep(0.0, 0.04, p);
        // açılış çizgisinin parlaması
        col += vec3(0.7, 1.0, 0.85) * (1.0 - openY) * yMask * xMask * smoothstep(0.0, 0.08, p) * 2.2;

        col *= inside;
        // cam yansıması (tüp kapalıyken de görünür)
        float refl = smoothstep(0.55, 0.0, length((vUv - vec2(0.28, 0.78)) * vec2(1.0, 1.6)));
        col += vec3(0.55, 0.7, 0.68) * refl * uReflect;
        col += vec3(0.012, 0.018, 0.018) * (1.0 - inside);
        gl_FragColor = vec4(max(col, 0.0), 1.0);
      }`,
  });
}
