// Tohumlu rastgele sayı üreteci (mulberry32) ve yardımcılar.
export function rng(seed = 1) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const r = {
    next,
    range: (a0, b0) => a0 + (b0 - a0) * next(),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    // Box–Muller normal dağılım
    gauss: (mean = 0, sd = 1) => {
      const u = Math.max(1e-9, next()), v = next();
      return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    },
    chance: (p) => next() < p,
  };
  return r;
}

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const damp = (cur, target, rate, dt) => cur + (target - cur) * (1 - Math.exp(-rate * dt));
export const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
