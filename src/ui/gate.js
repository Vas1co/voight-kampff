// Giriş ekranı. Ses yalnızca "Başla"ya basıldığında açılır.
import { $, h } from './dom.js';
import { t, LANG, setLang } from '../core/strings.js';

export const gate = {
  el: $('#gate'),
  show({ canContinue = false, onStart, onContinue, onSettings }) {
    const start = h('button', { type: 'button', class: 'ghost', text: t('title.start'), onclick: () => onStart() });
    this.el.replaceChildren(
      h('p', { class: 't-kicker', text: t('title.kicker') }),
      h('h1', { lang: 'en', text: t('brand.gameTitle') }),   // büyük harfte i → İ olmasın
      h('p', { class: 'inspired', text: t('title.inspired') }),
      h('p', { class: 'note', text: t('title.note') }),
      h('div', { class: 'row' },
        start,
        canContinue ? h('button', { type: 'button', class: 'ghost', text: t('title.continue'), onclick: () => onContinue() }) : null,
        h('button', { type: 'button', class: 'ghost quiet', text: t('title.settings'), onclick: () => onSettings() })),
      h('p', { class: 'hint', text: t('title.hint') }),
      h('div', { class: 'disclaimer' },
        h('p', { lang: 'en', text: t('title.disclaimer') }),
        h('nav', { class: 'links' },
          h('a', { href: t('title.aboutHref'), text: t('title.about') }),
          h('a', { href: LANG === 'en' ? '/?lang=tr' : '/en/', hreflang: LANG === 'en' ? 'tr' : 'en', lang: LANG === 'en' ? 'tr' : 'en', text: t('title.otherLang'),
            onclick: (e) => { e.preventDefault(); setLang(LANG === 'en' ? 'tr' : 'en'); } }))),
    );
    this.el.hidden = false;
    this.el.classList.remove('gone');
    start.focus();
  },
  hide() {
    this.el.classList.add('gone');
    setTimeout(() => { this.el.hidden = true; }, 1000);
  },
};
