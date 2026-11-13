// Ayarlar: ayrı ses düzeyleri, sesi kapat, hareketi azalt, görüntü kalitesi, altyazı boyutu.
// Altyazılar her zaman açıktır (kapatma seçeneği yok).
import { $, h } from './dom.js';
import { t, LANG, setLang } from '../core/strings.js';
import { save } from '../core/save.js';
import { bus } from '../core/events.js';

export const settingsUI = {
  el: $('#settings'),
  lastFocus: null,
  get open() { return !this.el.hidden; },

  show() {
    this.lastFocus = document.activeElement;
    const s = save.settings;
    const changed = (key) => { save.write(); bus.emit('settings', { key, settings: s }); };
    const slider = (key) => {
      const out = h('output', { text: `${Math.round(s[key] * 100)}` });
      const id = `set-${key}`;
      return h('div', { class: 'row' },
        h('label', { for: id, text: t(`settings.${key}`) }),
        h('input', { id, type: 'range', min: 0, max: 100, step: 1, value: Math.round(s[key] * 100),
          oninput: (e) => { s[key] = +e.target.value / 100; out.textContent = e.target.value; changed(key); } }),
        out);
    };
    const check = (key) => h('label', { class: 'check' },
      h('input', { type: 'checkbox', checked: !!s[key], onchange: (e) => { s[key] = e.target.checked; changed(key); } }),
      t(`settings.${key}`));
    const seg = (key, opts) => h('div', { class: 'row' },
      h('span', { text: t(`settings.${key}`) }),
      h('div', { class: 'seg', role: 'group', 'aria-label': t(`settings.${key}`) }, opts.map(([v, label]) => h('button', {
        type: 'button', 'aria-pressed': String(s[key] === v), text: label,
        onclick: (e) => { s[key] = v; [...e.target.parentNode.children].forEach((b) => b.setAttribute('aria-pressed', String(b === e.target))); changed(key); },
      }))), h('span'));

    let resetArmed = false;
    const resetBtn = h('button', { type: 'button', class: 'ghost quiet', text: t('settings.reset'), onclick: () => {
      if (!resetArmed) { resetArmed = true; resetBtn.textContent = t('settings.resetConfirm'); return; }
      save.reset(); location.reload();
    } });

    const panel = h('div', { class: 'panel' },
      h('h2', { id: 'settings-title', text: t('settings.title') }),
      h('h3', { text: t('settings.audio') }),
      slider('master'), slider('music'), slider('sfx'), slider('ambience'), slider('voice'),
      check('muted'),
      h('h3', { text: t('settings.display') }),
      check('reduceMotion'),
      seg('quality', [['low', t('settings.qualityLow')], ['high', t('settings.qualityHigh')]]),
      h('p', { class: 'note', text: t('settings.qualityNote') }),
      seg('subSize', [['normal', t('settings.subNormal')], ['large', t('settings.subLarge')]]),
      h('div', { class: 'row' },
        h('span', { text: t('settings.lang') }),
        h('div', { class: 'seg', role: 'group', 'aria-label': t('settings.lang') }, [['en', 'English'], ['tr', 'Türkçe']].map(([v, label]) => h('button', {
          type: 'button', lang: v, 'aria-pressed': String(LANG === v), text: label, onclick: () => setLang(v),
        }))), h('span')),
      h('p', { class: 'note', text: t('settings.subtitlesAlways') }),
      h('h3', { text: t('settings.keysTitle') }),
      h('dl', {}, t('settings.keys').flatMap(([k, d]) => [h('dt', { text: k }), h('dd', { text: d })])),
      h('div', { class: 'actions' }, resetBtn, h('button', { type: 'button', class: 'ghost', text: t('settings.close'), onclick: () => this.hide() })),
    );
    this.el.replaceChildren(panel);
    this.el.hidden = false;
    this.el.onclick = (e) => { if (e.target === this.el) this.hide(); };
    panel.querySelector('input')?.focus();
    bus.emit('settings:open');
  },

  hide() {
    if (this.el.hidden) return;
    this.el.hidden = true;
    this.lastFocus?.focus?.();
    bus.emit('settings:close');
  },

  toggle() { this.open ? this.hide() : this.show(); },
};
