// Ortak GLSL parçaları: gürültü ve tavandaki floresan armatürün ışığı.
// Işık, dikdörtgen bir alan ışığı gibi yaklaşık hesaplanır: armatürün altındaki
// noktalar en çok, uzaklaştıkça yumuşakça azalan ışık alır. Işık hüzmesi,
// renkli ışık ya da sert gölge yok; oda kurumsal ve loş.
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
uniform vec3 uLampPos;    // armatürün merkezi (tavanda)
uniform vec2 uLampHalf;   // armatürün yarı genişliği (x) ve yarı derinliği (z)
uniform float uLampI;     // anlık parlaklık (titreme dahil)

float lamp(vec3 p){
  vec3 d = p - uLampPos;
  float h = max(0.05, -d.y);
  vec2 q = max(abs(d.xz) - uLampHalf, 0.0);
  float r2 = dot(q, q) + h * h;
  return uLampI / (1.0 + r2 * 0.42);
}
`;

// Bütün ışık kullanan malzemelerin paylaştığı uniform nesneleri.
export const lightUniforms = {
  uLampPos: { value: new THREE.Vector3(0, 3.14, -2.4) },
  uLampHalf: { value: new THREE.Vector2(1.5, 0.18) },
  uLampI: { value: 1.0 },
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
