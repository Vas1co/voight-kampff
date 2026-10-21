// Vaka dosyası: masadaki klasör. Açılınca kâğıt olarak okunur.
import { $, h } from './dom.js';
import { t } from '../core/strings.js';
import { bus } from '../core/events.js';
import { sfx } from '../audio/sfx.js';

export const casefile = {
  el: $('#casefile'),
  subject: null,
  get open() { return !this.el.hidden; },

  setSubject(subject) { this.subject = subject; },

  show() {
    const s = this.subject;
    if (!s) return;
    const base = `subjects.${s.id}`;
    const cf = t(`${base}.casefile`);
    const close = () => this.hide();
    const paper = h('article', { class: 'paper' },
      h('i', { class: 'folder-tab', 'aria-hidden': 'true' }),
      h('button', { class: 'close', type: 'button', onclick: close, text: '×', 'aria-label': t('casefile.close') }),
      h('p', { class: 'unit', text: t('casefile.unit') }),
      h('h2', { id: 'casefile-title', text: t('casefile.title') }),
      h('p', { class: 'code', text: t(`${base}.label`) }),
      h('span', { class: 'stamp-mini', 'aria-hidden': 'true', text: t('brand.unit').toUpperCase() }),
      h('table', {}, h('tbody', {}, cf.rows.map(([k, v]) => h('tr', {}, h('th', { scope: 'row', text: k }), h('td', { text: v }))))),
      h('p', { class: 'sect', text: t('casefile.observation') }),
      h('p', { class: 'body', text: cf.observation }),
      h('p', { class: 'sect', text: t('casefile.order') }),
      h('p', { class: 'body', text: cf.order }),
      h('p', { class: 'attach', text: t('casefile.attachment') }),
      h('div', { class: 'actions' }, h('button', { type: 'button', onclick: close, text: t('casefile.close') })),
    );
    this.el.replaceChildren(paper);
    this.el.hidden = false;
    this.el.onclick = (e) => { if (e.target === this.el) close(); };
    sfx.play('paper');
    paper.querySelector('.actions button').focus();
    bus.emit('casefile:open');
  },

  hide() {
    if (this.el.hidden) return;
    this.el.hidden = true;
    sfx.play('paper');
    bus.emit('casefile:close');
  },

  toggle() { this.open ? this.hide() : this.show(); },
};
