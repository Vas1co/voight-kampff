// Son geçiş: film greni, vinyet, kenar renk kayması, titreme ve renk derecelendirme.
import * as THREE from 'three';

export const FilmShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uGrain: { value: 0.03 },
    uVignette: { value: 0.5 },
    uChroma: { value: 0.00025 },
    uFlicker: { value: 0.01 },
    uFade: { value: 0 },
    uMotion: { value: 1 },
    uLift: { value: new THREE.Vector3(0.004, 0.012, 0.016) },
    uContrast: { value: 0.32 },
    uRedFlash: { value: 0 },
  },
  vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime, uGrain, uVignette, uChroma, uFlicker, uFade, uMotion, uRedFlash, uContrast;
    uniform vec3 uLift;
    varying vec2 vUv;
    float h(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
    void main(){
      vec2 c = vUv - 0.5;
      float r2 = dot(c, c);
      vec2 off = c * r2 * uChroma * 40.0;
      vec3 col;
      col.r = texture2D(tDiffuse, vUv + off).r;
      col.g = texture2D(tDiffuse, vUv).g;
      col.b = texture2D(tDiffuse, vUv - off).b;

      // derecelendirme: gölgeler petrol mavisine, genel doygunluk biraz düşük
      float l = dot(col, vec3(0.299, 0.587, 0.114));
      col = mix(col, col * vec3(0.93, 1.02, 1.04), 0.6);
      col += uLift * (1.0 - smoothstep(0.0, 0.35, l));
      col = mix(vec3(l), col, 0.88);
      // S eğrisi: siyahlar derinleşir, ışık alan yerler parlak kalır
      vec3 sc = clamp(col, 0.0, 1.0);
      col = mix(col, sc * sc * (3.0 - 2.0 * sc), uContrast) + max(col - 1.0, 0.0);

      float vig = smoothstep(0.95, 0.18, sqrt(r2) * (1.0 + uVignette * 0.6));
      col *= mix(1.0, vig, uVignette);

      float ft = uMotion > 0.5 ? floor(uTime * 24.0) : 0.0;
      float g = h(vUv * vec2(1931.0, 1171.0) + ft * 17.13) - 0.5;
      g += (h(vUv * vec2(733.0, 977.0) + ft * 3.7) - 0.5) * 0.6;
      col += g * uGrain * (0.55 + 0.45 * (1.0 - l));

      col *= 1.0 - uFlicker * h(vec2(ft, 7.0)) * uMotion;
      col = mix(col, vec3(0.0), uFade);
      col += vec3(0.5, 0.04, 0.02) * uRedFlash * (0.4 + r2);
      gl_FragColor = vec4(col, 1.0);
    }`,
};
