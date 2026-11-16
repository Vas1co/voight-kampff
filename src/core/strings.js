// Tüm görünür metinler data/strings.<dil>.json içindedir (tr, en).
// t('a.b.c', {n: 3}) → yer tutucular doldurulmuş metin (ya da dizi).
// Dil açılışta bir kez seçilir (dokular o dille çizilir); adres belirler:
//   / İngilizce (varsayılan) · /tr/ Türkçe · ?lang=tr|en geliştirme için zorlar
// İngilizcede eksik anahtar Türkçeden gelir.
import tr from '../../data/strings.tr.json';
import en from '../../data/strings.en.json';

const PACKS = { tr, en };
function pickLang() {
  if (typeof location === 'undefined') return 'en';
  const q = new URLSearchParams(location.search).get('lang');
  if (PACKS[q]) return q;
  return /^\/tr(\/|$)/.test(location.pathname) ? 'tr' : 'en';
}
export const LANG = pickLang();
const data = PACKS[LANG];
if (typeof document !== 'undefined') document.documentElement.lang = LANG;

export const langHref = (lang) => (lang === 'tr' ? '/tr/' : '/');

// Dili değiştirir: oyunu o dilin adresinde yeniden açar.
export function setLang(lang) {
  if (!PACKS[lang] || lang === LANG) return;
  location.href = langHref(lang);
}

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

function lookupIn(pack, path) {
  let cur = pack;
  for (const k of path.split('.')) {
    if (cur == null) return undefined;
    cur = cur[k];
  }
  return cur;
}
const lookup = (path) => lookupIn(data, path) ?? lookupIn(tr, path);

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
