import { Token, isAbort } from './async.js';

// Durum makinesi. Her durumun enter(payload, token) fonksiyonu async olabilir.
// Yeni duruma geçildiğinde eski durumun jetonu iptal edilir.
export class FSM {
  constructor(states, bus) {
    this.states = states;
    this.bus = bus;
    this.current = null;
    this.token = null;
    this.history = [];
  }
  is(...names) { return names.includes(this.current); }
  go(name, payload) {
    const next = this.states[name];
    if (!next) throw new Error(`Bilinmeyen durum: ${name}`);
    const prev = this.current;
    if (prev) this.states[prev].exit?.(name);
    this.token?.cancel();
    const token = (this.token = new Token());
    this.current = name;
    this.history.push(name);
    this.bus?.emit('state', { name, prev });
    Promise.resolve()
      .then(() => next.enter?.(payload, token))
      .catch((e) => { if (!isAbort(e)) console.error(`[durum:${name}]`, e); });
  }
}
