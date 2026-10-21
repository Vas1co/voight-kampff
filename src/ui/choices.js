// Cevap seçenekleri: altyazı alanının üstünde, numaralı. Süre çubuğu daralır.
// Gerçek tepki süresi (ms) burada ölçülür: seçenekler göründüğü andan seçime kadar.
import { $, h } from './dom.js';
import { t } from '../core/strings.js';
import { bus, ABORT } from '../core/events.js';

export const choices = {
  el: $('#choices'),
  timerEl: $('#timer'),
  shadeEl: $('#shade'),
  cancel: null,

  // Seçimi bekler. Döner: { option | null, rt (sn) }
  ask(options, limitSec, token, { onTick } = {}) {
    return new Promise((resolve, reject) => {
      const bar = this.timerEl.firstElementChild;
      const buttons = options.map((o, k) => h('button', {
        type: 'button', class: 'ch', id: `ch${k}`, onclick: () => done(k),
      }, h('span', { class: 'num', 'aria-hidden': 'true', text: String(k + 1) }), o.text));
      this.el.replaceChildren(...buttons);
      this.el.setAttribute('aria-label', t('choices.aria'));
      this.el.classList.add('on');
      this.timerEl.classList.add('on');
      this.shadeEl.classList.add('on');
      const t0 = performance.now();
      let raf = 0, lastSec = 0, fin = false;

      const onKey = ({ action, index }) => { if (action === 'choice' && index < options.length) done(index); };
      const off = bus.on('input', onKey);
      const step = (now) => {
        if (fin) return;
        const e = (now - t0) / 1000;
        bar.style.transform = `scaleX(${Math.max(0, 1 - e / limitSec)})`;
        const sec = Math.floor(e);
        if (sec > lastSec) { lastSec = sec; onTick?.(sec, limitSec); }
        if (e >= limitSec) { done(-1); return; }
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
      // arka planda rAF durursa süre yine de dolsun
      const guardTimer = setTimeout(() => done(-1), limitSec * 1000 + 400);

      const cleanup = () => {
        fin = true;
        cancelAnimationFrame(raf);
        clearTimeout(guardTimer);
        off();
        token?.offCancel(cancelFn);
        this.hide();
      };
      function done(k) {
        if (fin) return;
        const rt = (performance.now() - t0) / 1000;
        if (k >= 0) buttons[k].classList.add('picked');
        cleanup();
        document.activeElement?.blur?.();
        resolve({ option: k >= 0 ? options[k] : null, rt: k >= 0 ? rt : limitSec });
      }
      const cancelFn = () => { if (fin) return; cleanup(); reject(ABORT); };
      token?.onCancel(cancelFn);
    });
  },

  hide() {
    this.el.classList.remove('on');
    this.timerEl.classList.remove('on');
    this.shadeEl.classList.remove('on');
  },
};
