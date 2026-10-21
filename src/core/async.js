import { ABORT } from './events.js';

// İptal jetonu: durum değişince bekleyen tüm adımlar düşer.
export class Token {
  constructor() { this.alive = true; this.cbs = new Set(); }
  cancel() {
    if (!this.alive) return;
    this.alive = false;
    for (const cb of [...this.cbs]) cb();
    this.cbs.clear();
  }
  onCancel(cb) { if (!this.alive) cb(); else this.cbs.add(cb); }
  offCancel(cb) { this.cbs.delete(cb); }
  check() { if (!this.alive) throw ABORT; }
}

export function sleep(ms, token) {
  return new Promise((resolve, reject) => {
    if (token && !token.alive) return reject(ABORT);
    const id = setTimeout(() => { token?.offCancel(cancel); resolve(); }, ms);
    const cancel = () => { clearTimeout(id); reject(ABORT); };
    token?.onCancel(cancel);
  });
}

// Bir promise'i jetona bağlar.
export function guard(promise, token) {
  return new Promise((resolve, reject) => {
    const cancel = () => reject(ABORT);
    token?.onCancel(cancel);
    promise.then((v) => { token?.offCancel(cancel); resolve(v); },
                 (e) => { token?.offCancel(cancel); reject(e); });
  });
}

export const isAbort = (e) => e === ABORT;
