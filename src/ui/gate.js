// Giriş ekranı. Ses yalnızca "Başla"ya basıldığında açılır.
import { $, h } from './dom.js';
import { t, LANG, setLang, langHref } from '../core/strings.js';
import eyeUrl from '/assets/images/brand/eye.png';
import wordmarkUrl from '/assets/images/brand/wordmark.png';

export const gate = {
  el: $('#gate'),
  show({ canContinue = false, onStart, onContinue, onSettings }) {
    const start = h('button', { type: 'button', class: 'ghost', text: t('title.start'), onclick: () => onStart() });
    this.el.replaceChildren(
      h('img', { class: 'logo-eye', src: eyeUrl, alt: '', width: 640, height: 352, decoding: 'async' }),
      h('p', { class: 't-kicker', text: t('title.kicker') }),
      // başlık: yazı logosu (metin alt'ta; arama motorları ve ekran okuyucular için h1 kalır)
      h('h1', { lang: 'en' }, h('img', { class: 'wordmark', src: wordmarkUrl, alt: t('brand.gameTitle'), width: 1400, height: 117, decoding: 'async' })),
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
          h('a', { href: langHref(LANG === 'en' ? 'tr' : 'en'), hreflang: LANG === 'en' ? 'tr' : 'en', lang: LANG === 'en' ? 'tr' : 'en', text: t('title.otherLang'),
            onclick: (e) => { e.preventDefault(); setLang(LANG === 'en' ? 'tr' : 'en'); } })),
        h('p', { class: 'credit' }, '© 2026 ', h('a', { href: 'https://peekdock.com/', text: 'peekdock.com' }))),
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
