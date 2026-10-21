// Soru deposu. İlk soru sabit, diğerleri her oyunda karışır; cevap seçeneklerinin sırası da karışır.
import data from '../../data/questions.json';
import { t, lines } from '../core/strings.js';

const byId = new Map(data.questions.map((q) => [q.id, q]));

function shuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng.next() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export const questions = {
  timeLimit: data.timeLimit,
  get: (id) => byId.get(id),
  // Bu oyunun soru sırası
  order(rng) {
    const rest = data.questions.filter((q) => q.id !== data.first);
    return [byId.get(data.first), ...shuffle(rest, rng)];
  },
  options(q, rng) {
    return shuffle(q.options, rng).map((o) => ({ ...o, text: t(`questions.${q.id}.options.${o.id}`) }));
  },
  lines: (id) => lines(`questions.${id}.lines`),
  prompt: (id) => t(`questions.${id}.prompt`),
  short: (id) => t(`questions.${id}.short`),
};
