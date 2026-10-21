// Temel ölçüm: nötr ısınma sorularının ham değerlerinin ortalaması.
// O anki kalibrasyon hatası da temele girer; sonraki tüm sapmalar buna göredir.
import { CHANNELS } from './readings.js';

export function computeBaseline(readings) {
  if (!readings.length) return null;
  const base = {};
  for (const ch of CHANNELS) base[ch] = readings.reduce((s, r) => s + r.raw[ch], 0) / readings.length;
  return base;
}
