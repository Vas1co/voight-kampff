// Klavye eşlemesi. Eylemler olay sistemine 'input' olarak gider.
import { bus } from './events.js';

const MAP = {
  Enter: 'next', NumpadEnter: 'next',
  KeyB: 'press', KeyP: 'pause',
  ArrowLeft: 'dialDown', ArrowRight: 'dialUp',
  BracketLeft: 'dialDown', BracketRight: 'dialUp',
  KeyC: 'cassette', KeyT: 'switch',
  KeyR: 'report', KeyD: 'file',
  Space: 'skip', Escape: 'escape',
};

export function initInput() {
  addEventListener('keydown', (e) => {
    const tag = (e.target?.tagName || '').toLowerCase();
    const typing = tag === 'textarea' || (tag === 'input' && !['range', 'checkbox', 'radio', 'button'].includes(e.target.type)) || e.target?.isContentEditable;
    if (typing) {
      if (e.code === 'Escape') { e.target.blur(); }
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const digit = /^Digit([1-9])$/.exec(e.code) || /^Numpad([1-9])$/.exec(e.code);
    if (digit) { bus.emit('input', { action: 'card', index: +digit[1] - 1, event: e }); return; }
    const action = MAP[e.code];
    if (!action) return;
    // Odaklanmış bir düğme Enter/Boşluk'u kendisi işler.
    if ((action === 'next' || action === 'skip') && (tag === 'button' || tag === 'select')) return;
    // Odaklanmış kaydırıcı ok tuşlarını kendisi kullanır.
    if ((action === 'dialDown' || action === 'dialUp') && (tag === 'input' || e.target?.getAttribute?.('role') === 'slider')) return;
    if (action === 'skip' || action.startsWith('dial')) e.preventDefault();
    bus.emit('input', { action, event: e });
  });
}
