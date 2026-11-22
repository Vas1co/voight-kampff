// Giriş ekranı. Ses yalnızca "Odaya gir"e basıldığında açılır.
// #gate iki bölümdür: .gate-hero (ilk ekran; JS her açılışta yeniden kurar) ve #guide
// (nasıl oynanır, sorular, SSS). #guide index.html / tr/index.html içinde statik durur,
// böylece JavaScript çalışmadan da okunur; JS ona dokunmaz, yalnızca [data-start]
// düğmelerini oyuna bağlar. Statik .gate-hero ile buradaki yapı aynı tutulmalı.
import { $, h } from './dom.js';
import { t, LANG, setLang, langHref } from '../core/strings.js';

const EYE = '/brand/eye.png';
const WORDMARK = '/brand/wordmark.png';

export const gate = {
  el: $('#gate'),
  show({ canContinue = false, onStart, onContinue, onSettings }) {
    const start = h('button', { type: 'button', class: 'ghost', text: t('title.start'), onclick: () => onStart() });
    let hero = this.el.querySelector('.gate-hero');
    if (!hero) { hero = h('div', { class: 'gate-hero' }); this.el.prepend(hero); }
    hero.replaceChildren(
      h('img', { class: 'logo-eye', src: EYE, alt: '', width: 640, height: 352, decoding: 'async' }),
      h('p', { class: 't-kicker', text: t('title.kicker') }),
      // başlık: yazı logosu (metin alt'ta; arama motorları ve ekran okuyucular için h1)
      h('h1', {}, h('img', { class: 'wordmark', src: WORDMARK, alt: t('title.heading'), width: 1400, height: 117, decoding: 'async' })),
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
          h('a', { href: '#guide', text: t('title.guideLink'), onclick: (e) => { e.preventDefault(); this.el.querySelector('#guide')?.scrollIntoView({ behavior: 'smooth' }); } }),
          h('a', { href: t('title.aboutHref'), text: t('title.about') }),
          h('a', { href: langHref(LANG === 'en' ? 'tr' : 'en'), hreflang: LANG === 'en' ? 'tr' : 'en', lang: LANG === 'en' ? 'tr' : 'en', text: t('title.otherLang'),
            onclick: (e) => { e.preventDefault(); setLang(LANG === 'en' ? 'tr' : 'en'); } })),
        h('p', { class: 'credit' }, '© 2026 ', h('a', { href: 'https://peekdock.com/', text: 'peekdock.com' }))),
    );
    // rehberin sonundaki "Odaya gir" düğmeleri
    for (const b of this.el.querySelectorAll('[data-start]')) { b.disabled = false; b.onclick = () => onStart(); }
    this.el.scrollTop = 0;
    this.el.hidden = false;
    this.el.classList.remove('gone');
    start.focus({ preventScroll: true });
  },
  hide() {
    this.el.classList.add('gone');
    setTimeout(() => { this.el.hidden = true; }, 1000);
  },
};
