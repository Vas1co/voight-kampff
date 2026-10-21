// Alt kontrol paneli (DOM): soru kartları, SÜRDÜR / ÜSTÜNE GİT, TEST şalteri,
// KALİBRASYON kadranı ve iğnesi, ARA VER, gerginlik göstergesi, kaset, dosya/rapor.
// Her eylem 'control' olayı olarak yayılır; oyun akışı (core/game.js) karar verir.
import { h, $ } from '../ui/dom.js';
import { t } from '../core/strings.js';
import { bus } from '../core/events.js';
import { questions } from '../test/questions.js';

const emit = (type, extra = {}) => bus.emit('control', { type, ...extra });

export class Controls {
  constructor() {
    this.el = $('#deck');
    this.el.setAttribute('aria-label', t('controls.deck'));
    this.dial = 0;
    this.tapeCount = 0;
    this.build();
    new ResizeObserver(() => this.measure()).observe(this.el);
  }

  measure() {
    const hgt = this.el.hidden || this.el.classList.contains('away') ? 0 : this.el.getBoundingClientRect().height;
    document.documentElement.style.setProperty('--deck-h', `${Math.round(hgt)}px`);
    bus.emit('deck:resize', hgt);
  }

  build() {
    const kbd = (k) => h('span', { class: 'kbd', 'aria-hidden': 'true', text: k });
    this.cardsEl = h('div', { class: 'cards', role: 'group', 'aria-label': t('controls.cards') });
    
    this.nextBtn = h('button', { type: 'button', class: 'mkey amber', onclick: () => emit('next') }, t('controls.next'), kbd('↵'));
    this.pressBtn = h('button', { type: 'button', class: 'mkey', onclick: () => emit('press') }, t('controls.press'), kbd('B'));
    const flow = h('div', { class: 'mod flow' }, h('div', { class: 'row' }, this.nextBtn, this.pressBtn));
    const tray = h('div', { class: 'tray' }, h('span', { class: 'engr', text: t('controls.cards') }), h('div', { class: 'trayrow' }, this.cardsEl, flow));

    this.switchBtn = h('button', { type: 'button', class: 'switch', role: 'switch', 'aria-checked': 'false', 'aria-label': t('controls.test'), onclick: () => emit('switch') },
      h('span', { class: 'st on', text: t('controls.on') }), h('span', { class: 'lever' }), h('span', { class: 'st off', text: t('controls.off') }));
    const sw = h('div', { class: 'mod sw' }, h('span', { class: 'engr' }, t('controls.test'), kbd('T')), this.switchBtn);

    this.dialEl = h('div', { class: 'dial', role: 'slider', tabindex: 0, 'aria-label': t('controls.calibAria'), 'aria-valuemin': -24, 'aria-valuemax': 24, 'aria-valuenow': 0 }, h('i', { class: 'mark' }));
    this.needleEl = h('i', { class: 'needle' });
    const meter = h('div', { class: 'meter', 'aria-hidden': 'true' }, h('i', { class: 'zero' }), this.needleEl, h('span', { class: 'lbl', text: t('machine.calib') }));
    const calib = h('div', { class: 'mod calib' }, h('span', { class: 'engr' }, t('controls.calib'), kbd('← →')), h('div', { class: 'row' }, this.dialEl, meter));
    this.bindDial();

    this.pauseBtn = h('button', { type: 'button', class: 'mkey', onclick: () => emit('pause') }, t('controls.pause'), kbd('P'));
    const pause = h('div', { class: 'mod pause' }, h('span', { class: 'engr', text: ' ' }), this.pauseBtn);

    this.stressEl = h('div', { class: 'stressbar', role: 'meter', 'aria-label': t('controls.stress'), 'aria-valuemin': 0, 'aria-valuemax': 100 }, Array.from({ length: 10 }, () => h('i')));
    const stress = h('div', { class: 'mod stress' }, h('span', { class: 'engr', text: t('controls.stress') }), this.stressEl);

    this.recBtn = h('button', { type: 'button', class: 'recbtn', 'aria-label': `${t('controls.cassette')} ${t('controls.rec')}`, 'aria-pressed': 'false', onclick: () => emit('cassette') });
    this.counterEl = h('span', { class: 'counter', text: '000' });
    const cassette = h('div', { class: 'mod cas' }, h('span', { class: 'engr' }, t('controls.cassette'), kbd('C')),
      h('div', { class: 'cassette' }, h('div', { class: 'tape', 'aria-hidden': 'true' }, h('i', { class: 'reel l' }), h('i', { class: 'reel r' })), this.counterEl, this.recBtn));

    this.fileBtn = h('button', { type: 'button', class: 'tab file', onclick: () => emit('file') }, t('controls.file'), kbd('D'));
    this.reportBtn = h('button', { type: 'button', class: 'tab', onclick: () => emit('report') }, t('controls.report'), kbd('R'));
    const papers = h('div', { class: 'mod' }, h('span', { class: 'engr', text: ' ' }), h('div', { class: 'papers' }, this.fileBtn, this.reportBtn));

    this.mods = { flow, sw, calib, pause, stress, cassette, papers, tray };
    this.el.replaceChildren(tray, h('div', { class: 'hw' }, sw, calib, pause, stress, cassette, papers));
  }

  bindDial() {
    const el = this.dialEl;
    let drag = null, acc = 0;
    const step = (d) => { if (el.getAttribute('aria-disabled') === 'true') return; emit('dial', { delta: d }); };
    el.addEventListener('pointerdown', (e) => { if (el.getAttribute('aria-disabled') === 'true') return; drag = { x: e.clientX, y: e.clientY }; el.setPointerCapture(e.pointerId); el.style.cursor = 'grabbing'; });
    el.addEventListener('pointermove', (e) => {
      if (!drag) return;
      acc += (e.clientX - drag.x) - (e.clientY - drag.y);
      drag = { x: e.clientX, y: e.clientY };
      while (Math.abs(acc) >= 6) { step(Math.sign(acc) * 0.5); acc -= Math.sign(acc) * 6; }
    });
    const end = () => { drag = null; el.style.cursor = ''; };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
    el.addEventListener('wheel', (e) => { e.preventDefault(); step(e.deltaY < 0 ? 0.5 : -0.5); }, { passive: false });
    el.addEventListener('keydown', (e) => {
      const map = { ArrowRight: 0.5, ArrowUp: 0.5, ArrowLeft: -0.5, ArrowDown: -0.5, PageUp: 3, PageDown: -3 };
      if (map[e.key] != null) { e.preventDefault(); step(map[e.key]); }
    });
  }

  // ---- durum ----
  show(on) { this.el.hidden = !on; requestAnimationFrame(() => this.measure()); }
  away(on) { this.el.classList.toggle('away', on); setTimeout(() => this.measure(), on ? 0 : 820); }

  setCards(cards, used, { enabled = false, active = null } = {}) {
    this.cards = cards;
    this.cardsEl.replaceChildren(...cards.map((c, i) => {
      const isUsed = used.has(c.id);
      const b = h('button', {
        type: 'button', class: `card${isUsed ? ' used' : ''}${active === c.id ? ' active' : ''}`,
        disabled: !enabled || isUsed, 'data-used': t('controls.cardUsed'),
        style: { '--rot': `${((i * 37) % 5) - 2}deg` },
        'aria-label': `${i + 1}. ${t(`themes.${c.theme}`)}: ${questions.cardTitle(c.id)}`,
        onclick: () => emit('card', { id: c.id }),
      },
      h('span', { class: 'theme', text: t(`themes.${c.theme}`) }),
      h('span', { class: 'title', text: questions.cardTitle(c.id) }),
      h('span', { class: 'meta' }, h('span', { text: t('controls.cardCount', { n: c.subs.length }) }), h('span', { text: String(i + 1) })));
      return b;
    }));
  }

  setFlow({ next = false, press = false } = {}) {
    this.nextBtn.disabled = !next;
    this.pressBtn.disabled = !press;
  }

  setSwitch(on, enabled = true) {
    this.switchBtn.setAttribute('aria-checked', String(on));
    this.switchBtn.disabled = !enabled;
  }

  setCassette(recording, enabled = true) {
    this.recBtn.setAttribute('aria-pressed', String(recording));
    this.recBtn.disabled = !enabled;
    document.documentElement.classList.toggle('recording', recording);
  }

  setDialEnabled(on) { this.dialEl.setAttribute('aria-disabled', String(!on)); }
  setPauseEnabled(on) { this.pauseBtn.disabled = !on; }

  setDial(v) {
    this.dial = v;
    this.dialEl.querySelector('.mark').style.transform = `rotate(${v * 5.5}deg)`;
    this.dialEl.setAttribute('aria-valuenow', v.toFixed(1));
  }

  setNeedle(v) { this.needleEl.style.transform = `rotate(${v * 62}deg)`; }

  setStress(value) {
    const n = Math.round(Math.min(100, value) / 10);
    [...this.stressEl.children].forEach((el, i) => { el.classList.toggle('on', i < n); el.classList.toggle('hot', i >= 8); });
    this.stressEl.setAttribute('aria-valuenow', Math.round(value));
  }

  tickTape(dt, recording) {
    if (!recording) return;
    this.tapeCount += dt * 1.7;
    this.counterEl.textContent = String(Math.floor(this.tapeCount) % 1000).padStart(3, '0');
  }

  highlight(name) {
    for (const [k, m] of Object.entries(this.mods)) m.classList.toggle('hl', k === name);
  }

  ping(which) {
    const b = which === 'report' ? this.reportBtn : this.fileBtn;
    b.classList.remove('ping'); void b.offsetWidth; b.classList.add('ping');
  }
}
