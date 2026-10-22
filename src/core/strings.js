// Tüm görünür metinler data/strings.tr.json içindedir.
// t('a.b.c', {n: 3}) → yer tutucular doldurulmuş metin (ya da dizi).
import data from '../../data/strings.tr.json';

const brandVars = () => ({
  test: data.brand.testName,
  testShort: data.brand.testShort,
  game: data.brand.gameTitle,
  unit: data.brand.unit,
  era: data.brand.era,
  machine: data.brand.machine,
  model: data.brand.model,
  generation: data.brand.generation,
});

function lookup(path) {
  let cur = data;
  for (const k of path.split('.')) {
    if (cur == null) return undefined;
    cur = cur[k];
  }
  return cur;
}

function fill(s, vars) {
  return s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? String(vars[k]) : m));
}

function interp(v, vars) {
  if (typeof v === 'string') return fill(v, vars);
  if (Array.isArray(v)) return v.map((x) => interp(x, vars));
  return v;
}

export function t(path, vars = {}) {
  const v = lookup(path);
  if (v === undefined) {
    console.warn(`[metin] eksik anahtar: ${path}`);
    return `‹${path}›`;
  }
  return interp(v, { ...brandVars(), ...vars });
}

// Her zaman dizi döndürür (altyazı satırları için).
export function lines(path, vars) {
  const v = t(path, vars);
  return Array.isArray(v) ? v : [v];
}

export const has = (path) => lookup(path) !== undefined;
export const brand = data.brand;

// Seslendirme dosyası kimliği: anahtar yolundaki noktalar tireye dönüşür.
export const voiceId = (path, index) => path.replace(/\./g, '-') + (index != null ? `-${index}` : '');
