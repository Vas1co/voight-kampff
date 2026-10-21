// Küçük olay sistemi. Modüller birbirini import etmeden haberleşir.
export class Emitter {
  constructor() { this.map = new Map(); }
  on(type, fn) {
    if (!this.map.has(type)) this.map.set(type, new Set());
    this.map.get(type).add(fn);
    return () => this.off(type, fn);
  }
  once(type, fn) {
    const off = this.on(type, (...a) => { off(); fn(...a); });
    return off;
  }
  off(type, fn) { this.map.get(type)?.delete(fn); }
  emit(type, payload) {
    const set = this.map.get(type);
    if (set) for (const fn of [...set]) fn(payload);
  }
  // Bir olayı bir kez bekleyen promise. İptal jetonu ölürse reddedilir.
  wait(type, token, filter) {
    return new Promise((resolve, reject) => {
      const off = this.on(type, (p) => {
        if (filter && !filter(p)) return;
        off(); token?.offCancel?.(cancel); resolve(p);
      });
      const cancel = () => { off(); reject(ABORT); };
      token?.onCancel?.(cancel);
    });
  }
}

export const ABORT = Symbol('abort');
export const bus = new Emitter();
