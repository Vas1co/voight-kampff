// Tüm görünür metinler data/strings.<dil>.json içindedir (tr, en).
// t('a.b.c', {n: 3}) → yer tutucular doldurulmuş metin (ya da dizi).
// Dil açılışta bir kez seçilir (dokular o dille çizilir); değiştirmek sayfayı yeniler:
//   /en/ adresi her zaman İngilizce · ?lang=tr|en · kayıtlı tercih · tarayıcı dili (tr değilse en)
// İngilizcede eksik anahtar Türkçeden gelir.
import tr from '../../data/strings.tr.json';
import en from '../../data/strings.en.json';

const PACKS = { tr, en };
const SAVE_KEY = 'sapma.save.v1';
const savedLang = () => { try { return JSON.parse(localStorage.getItem(SAVE_KEY))?.settings?.lang ?? null; } catch { return null; } };
function pickLang() {
  if (typeof location === 'undefined') return 'tr';
  if (/^\/en(\/|$)/.test(location.pathname)) return 'en';
  const q = new URLSearchParams(location.search).get('lang');
  if (PACKS[q]) return q;
  const s = savedLang();
  if (PACKS[s]) return s;
  const langs = navigator.languages?.length ? navigator.languages : [navigator.language || 'en'];
  return /^tr\b/i.test(langs[0]) ? 'tr' : 'en';
}
export const LANG = pickLang();
const data = PACKS[LANG];
if (typeof document !== 'undefined') document.documentElement.lang = LANG;

// Dili değiştirir: tercihi kaydeder ve oyunu o dilde yeniden açar.
export function setLang(lang) {
  if (!PACKS[lang] || lang === LANG) return;
  try {
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY)) || { settings: {} };
    (raw.settings ||= {}).lang = lang;
    localStorage.setItem(SAVE_KEY, JSON.stringify(raw));
  } catch { /* kayıt yoksa adres yeter */ }
  location.href = lang === 'en' ? '/en/' : '/?lang=tr';
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
