// Kalıcı kayıt (localStorage). Erişilemezse bellekte çalışır.
const KEY = 'sapma.save.v1';

const prefersReduced = () => {
  try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
};

const defaults = () => ({
  version: 1,
  settings: {
    master: 0.85,
    music: 0.6,
    sfx: 0.8,
    ambience: 0.7,
    voice: 1.0,
    muted: false,
    reduceMotion: prefersReduced(),
    quality: (navigator.hardwareConcurrency || 4) <= 4 || /Mobi|Android/i.test(navigator.userAgent) ? 'low' : 'high',
    subSize: 'normal',
  },
  chapter: 1,
  decisions: {},  // { s1: 'replicant' | 'human' | 'unsure' }
  flags: {},      // sonraki bölümlere taşınan sonuçlar
  notes: {},      // { s1: { 'r7': {tag, text} } }
  stats: {},      // denek başına özet
});

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function merge(base, over) {
  if (!over || typeof over !== 'object') return base;
  for (const k of Object.keys(over)) {
    if (base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) merge(base[k], over[k]);
    else base[k] = over[k];
  }
  return base;
}

export const save = {
  data: merge(defaults(), read()),
  write() {
    try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch { /* özel pencere vb. */ }
  },
  reset() {
    const settings = this.data.settings;
    this.data = defaults();
    this.data.settings = settings;
    this.write();
  },
  get settings() { return this.data.settings; },
};
