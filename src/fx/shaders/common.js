// Ortak GLSL parçaları: gürültü, pencere ışığı (hüzme) ve pervane gölgesi.
// Pencereden gelen ışık tek bir yönle modellenir. Bir noktanın aydınlanıp
// aydınlanmadığı, o noktadan ışığın tersine gidip pencere düzlemine ulaşan
// ışının pencereye düşüp düşmediğiyle bulunur. Aynı ışın pervane düzlemini
// keserken bir kanada çarpıyorsa nokta gölgededir. Böylece hüzmeler, sis,
// masa ve denek aynı dönen gölgeyi paylaşır.
import * as THREE from 'three';

export const NOISE = /* glsl */ `
float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  float a = hash12(i), b = hash12(i+vec2(1,0)), c = hash12(i+vec2(0,1)), d = hash12(i+vec2(1,1));
  return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
}
float fbm(vec2 p){
  float s = 0.0, a = 0.5;
  for(int i=0;i<5;i++){ s += a*vnoise(p); p = p*2.03 + vec2(1.7, 9.2); a *= 0.5; }
  return s;
}
`;

export const LIGHT = /* glsl */ `
uniform vec3 uLightDir;     // pencereden odaya, birim vektör (aşağı ve öne)
uniform vec4 uWindow;       // xMin, xMax, yMin, yMax (pencere düzleminde)
uniform float uWindowZ;
uniform vec3 uFanPos;
uniform float uFanR;
uniform float uFanAngle;
uniform float uBladeW;
uniform float uFanShadow;
uniform float uMullions;

float beam(vec3 p){
  float t = (p.z - uWindowZ) / uLightDir.z;
  if (t < 0.0) return 0.0;
  vec3 w = p - uLightDir * t;
  float soft = 0.06 + t * 0.035;
  float m = smoothstep(uWindow.x - soft, uWindow.x + soft, w.x) * (1.0 - smoothstep(uWindow.y - soft, uWindow.y + soft, w.x))
          * smoothstep(uWindow.z - soft, uWindow.z + soft, w.y) * (1.0 - smoothstep(uWindow.w - soft, uWindow.w + soft, w.y));
  // pencere kayıtları (dikey kirişler) ışığı şeritlere böler
  float span = uWindow.y - uWindow.x;
  float mx = fract((w.x - uWindow.x) / span * uMullions);
  float mull = smoothstep(0.0, 0.05 + t*0.004, mx) * smoothstep(1.0, 0.95 - t*0.004, mx);
  return m * mix(1.0, mull, 0.55);
}

float fanShadow(vec3 p){
  if (p.y > uFanPos.y - 0.01) return 1.0;
  float s = (p.y - uFanPos.y) / uLightDir.y;
  vec3 q = p - uLightDir * s;
  vec2 d = q.xz - uFanPos.xz;
  float r = length(d);
  float a = atan(d.y, d.x) - uFanAngle;
  float seg = 6.2831853 / 5.0;
  float ang = a - seg * floor(a / seg + 0.5);
  float perp = abs(r * sin(ang));
  float soft = 0.012 + s * 0.03;
  float halfW = uBladeW * 0.5 * (0.7 + 0.3 * smoothstep(0.1, uFanR, r));
  float blade = (1.0 - smoothstep(halfW - soft, halfW + soft, perp)) * step(0.0, cos(ang))
              * (1.0 - smoothstep(uFanR - soft, uFanR + soft, r));
  float hub = 1.0 - smoothstep(0.11 - soft, 0.11 + soft, r);
  return 1.0 - max(blade, hub) * uFanShadow;
}
`;

// Bütün ışık kullanan malzemelerin paylaştığı uniform nesneleri.
export const lightUniforms = {
  uLightDir: { value: new THREE.Vector3(0.1, -0.31, 1).normalize() },
  uWindow: { value: new THREE.Vector4(-3.1, 3.1, 2.55, 3.18) },
  uWindowZ: { value: -5.9 },
  uFanPos: { value: new THREE.Vector3(0, 2.62, -4.85) },
  uFanR: { value: 0.86 },
  uFanAngle: { value: 0 },
  uBladeW: { value: 0.13 },
  uFanShadow: { value: 0.62 },
  uMullions: { value: 4 },
};

export const VERT_WORLD = /* glsl */ `
varying vec2 vUv;
varying vec3 vWorld;
void main(){
  vUv = uv;
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;
