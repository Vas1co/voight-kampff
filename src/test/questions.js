// Soru deposu: kartlar, alt sorular ve nötr temel soruları.
import data from '../../data/questions.json';
import { t, lines, has } from '../core/strings.js';

const cards = new Map(data.cards.map((c) => [c.id, c]));
const subs = new Map();
for (const c of data.cards) for (const s of c.subs) subs.set(s.id, { ...s, theme: c.theme, card: c.id });
for (const b of data.baseline) subs.set(b.id, { ...b, card: null, pair: null });

export const questions = {
  card: (id) => cards.get(id),
  sub: (id) => subs.get(id),
  cardTitle: (id) => t(`cards.${id}`),
  // Sorgucunun okuduğu satırlar
  text: (id) => lines(`questions.${id}`),
  // Deneğin cevabı (denek bazlı)
  answer: (subjectId, id) => (has(`subjects.${subjectId}.answers.${id}`) ? t(`subjects.${subjectId}.answers.${id}`) : '…'),
};
