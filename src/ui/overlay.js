// Üst bilgi (HUD), sahne başlıkları, kararma ve sinema bantları.
import { $, h } from './dom.js';
import { t } from '../core/strings.js';
import { sleep } from '../core/async.js';

export const hud = {
  el: $('#hud'),
  start: performance.now(),
  init({ onSound, onSettings }) {
    $('#hud-rec').textContent = t('hud.rec');
    $('#btn-settings').textContent = t('hud.settings');
    $('#btn-sound').addEventListener('click', onSound);
    $('#btn-settings').addEventListener('click', onSettings);
    setInterval(() => this.tick(), 42);
  },
  show(on = true) { this.el.hidden = !on; },
  subject(n) { $('#hud-subject').textContent = t('hud.subject', { n }); },
  counter(text, over = false) { const c = $('#hud-counter'); c.textContent = text; c.classList.toggle('over', over); },
  sound(on) {
    const b = $('#btn-sound');
    b.textContent = `${t('hud.sound')} · ${on ? t('hud.soundOn') : t('hud.soundOff')}`;
    b.setAttribute('aria-pressed', String(on));
  },
  resetClock() { this.start = performance.now(); },
  tick() {
    const e = (performance.now() - this.start) / 1000, p = (v) => String(Math.floor(v)).padStart(2, '0');
    $('#hud-tc').textContent = `${p(e / 3600)}:${p((e / 60) % 60)}:${p(e % 60)}:${p((e * 24) % 24)}`;
  },
};

export const screen = {
  fadeEl: $('#fade'),
  cardEl: $('#titlecard'),
  fade(opacity, ms = 1400) {
    this.fadeEl.style.transitionDuration = `${ms}ms`;
    this.fadeEl.style.opacity = String(opacity);
  },
  cinema(on) { document.documentElement.classList.toggle('cinema', on); },
  async card({ kicker = '', title = '', lines = [] }, hold, token) {
    this.cardEl.replaceChildren(...[
      kicker ? h('p', { class: 'small t-kicker', text: kicker }) : null,
      title ? h('p', { class: 'big', text: title }) : null,
      lines.length ? h('div', { class: 'lines' }, lines.map((l) => h('p', { text: l }))) : null,
    ].filter(Boolean));
    this.cardEl.classList.add('on');
    if (hold == null) return;
    await sleep(hold, token);
    this.cardEl.classList.remove('on');
    await sleep(1300, token);
  },
  hideCard() { this.cardEl.classList.remove('on'); },
};
