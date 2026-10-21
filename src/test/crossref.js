// Çapraz referans: aynı duygusal çekirdeğe (pair) ait okumaları yan yana toplar.
// Yalnızca ham veri ve göz bebeği aralığı (max − min) döner; yorum yapmaz.
export function crossReference(readings) {
  const groups = new Map();
  for (const r of readings) {
    if (!r.pair || !r.dev) continue;
    if (!groups.has(r.pair)) groups.set(r.pair, []);
    groups.get(r.pair).push(r);
  }
  const out = [];
  for (const [pair, list] of groups) {
    if (list.length < 2) continue;
    const pupils = list.map((r) => r.dev.pupil);
    out.push({ pair, list, spread: Math.max(...pupils) - Math.min(...pupils) });
  }
  return out;
}
