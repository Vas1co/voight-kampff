// Klavye eşlemesi. Eylemler olay sistemine 'input' olarak gider.
// 1–4: cevap seç · Boşluk: altyazıyı geç · Esc: ayarlar / kapat
import { bus } from './events.js';

const MAP = { Space: 'skip', Escape: 'escape' };

export function initInput() {
  addEventListener('keydown', (e) => {
    const tag = (e.target?.tagName || '').toLowerCase();
    if (tag === 'textarea' || (tag === 'input' && !['range', 'checkbox', 'radio', 'button'].includes(e.target.type))) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const digit = /^(?:Digit|Numpad)([1-9])$/.exec(e.code);
    if (digit) { bus.emit('input', { action: 'choice', index: +digit[1] - 1, event: e }); return; }
    const action = MAP[e.code];
    if (!action) return;
    // Odaklanmış bir düğme Boşluk'u kendisi işler.
    if (action === 'skip' && (tag === 'button' || tag === 'select')) return;
    if (action === 'skip') e.preventDefault();
    bus.emit('input', { action, event: e });
  });
}
