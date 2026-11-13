// Asset manifesti. import.meta.glob, assets/ altındaki dosyaları geliştirme ve
// derleme anında listeler. Klasöre yeni bir dosya konduğunda Vite bu modülü
// yeniler; oyun prosedürel yer tutucu yerine gerçek dosyayı kullanır.
import * as THREE from 'three';

const files = import.meta.glob(
  '/assets/**/*.{png,jpg,jpeg,webp,avif,mp4,webm,mov,ogg,mp3,wav,m4a,opus}',
  { query: '?url', import: 'default', eager: true },
);

const IMAGE = ['webp', 'png', 'avif', 'jpg', 'jpeg'];
const VIDEO = ['webm', 'mp4', 'mov'];
const AUDIO = ['ogg', 'opus', 'mp3', 'm4a', 'wav'];

function find(dir, base, exts) {
  for (const e of exts) {
    const k = `/assets/${dir}/${base}.${e}`;
    if (files[k]) return files[k];
  }
  return null;
}

export const assets = {
  image: (dir, base) => find(dir, base, IMAGE),
  video: (dir, base) => find(dir, base, VIDEO),
  audio: (dir, base) => find(`audio/${dir}`, base, AUDIO),
  list: (prefix) => Object.keys(files).filter((k) => k.startsWith(`/assets/${prefix}`)),
};

const loader = new THREE.TextureLoader();

// Varsa PNG'yi, yoksa prosedürel tuvali döndürür.
export function textureOr(dir, base, makeCanvas) {
  const url = assets.image(dir, base);
  if (url) {
    const tex = loader.load(url);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    tex.userData.fromFile = true;
    return tex;
  }
  const tex = new THREE.CanvasTexture(makeCanvas());
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// Döngüsel video dokusu (göz kayıtları için).
export function videoTexture(url, { loop = true } = {}) {
  const v = document.createElement('video');
  v.src = url;
  v.loop = loop;
  v.muted = true;
  v.playsInline = true;
  v.crossOrigin = 'anonymous';
  v.preload = 'auto';
  const tex = new THREE.VideoTexture(v);
  tex.colorSpace = THREE.SRGBColorSpace;
  return { video: v, texture: tex };
}

if (import.meta.hot) import.meta.hot.accept(() => location.reload());
