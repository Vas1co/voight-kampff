// Temel ölçüm: dinlenim örneklerinin ortalaması.
// O anki kalibrasyon hatası da temele girer; sonraki tüm sapmalar buna göredir.
const CH = ['pupil', 'blush', 'pulse', 'resp', 'particles'];

export function computeBaseline(samples) {
  if (!samples.length) return null;
  const base = { latency: null };
  for (const ch of CH) base[ch] = samples.reduce((s, r) => s + r[ch], 0) / samples.length;
  return base;
}
