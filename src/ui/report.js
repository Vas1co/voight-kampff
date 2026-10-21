// Kâğıt sorgu raporu: temel ölçüm, okumalar (sapma), kart notları, çapraz referans, karar damgası.
// Makine yorum yapmaz; rapor yalnızca ham veriyi listeler. Damgayı oyuncu vurur.
import { $, h } from './dom.js';
import { t } from '../core/strings.js';
import { bus } from '../core/events.js';
import { sfx } from '../audio/sfx.js';
import { questions } from '../test/questions.js';
import { sgn } from '../machine/gauges.js';

const f1 = (v) => v.toFixed(1);
const f2 = (v) => v.toFixed(2);

export const report = {
  el: $('#report'),
  session: null,
  armed: null,
  lastCount: 0,
  get open() { return !this.el.hidden; },

  bind(session) { this.session = session; this.armed = null; this.lastCount = 0; this.render(); },

  show() {
    if (!this.session) return;
    this.render();
    this.el.hidden = false;
    this.el.classList.remove('closing');
    sfx.play('paper');
    bus.emit('report:open');
    requestAnimationFrame(() => this.el.querySelector('.close')?.focus({ preventScroll: true }));
  },

  hide() {
    if (this.el.hidden) return;
    this.el.classList.add('closing');
    sfx.play('paper');
    setTimeout(() => { this.el.hidden = true; this.el.classList.remove('closing'); }, 380);
    bus.emit('report:close');
  },

  toggle() { this.open ? this.hide() : this.show(); },

  // Yeni okuma geldiğinde ya da durum değiştiğinde yeniden çiz.
  update() { if (this.open) this.render(); },

  render() {
    const S = this.session;
    if (!S) return;
    const active = document.activeElement;
    const focusKey = active && this.el.contains(active) ? active.dataset.key : null;
    const caret = focusKey && active.selectionStart != null ? active.selectionStart : null;
    const scroll = this.el.querySelector('.paper')?.scrollTop ?? 0;

    const C = (k) => t(`report.cols.${k}`);
    const paper = h('article', { class: 'paper' },
      h('button', { class: 'close', type: 'button', onclick: () => this.hide(), text: '×', 'aria-label': t('report.close'), 'data-key': 'close' }),
      h('h2', { id: 'report-title', text: t('report.title') }),
      h('dl', { class: 'meta' },
        h('dt', { text: t('report.subject') }), h('dd', { text: t(`subjects.${S.subject.id}.label`) }),
        h('dt', { text: t('report.operator') }), h('dd', { text: t('report.operatorName') }),
        h('dt', { text: t('report.date') }), h('dd', { text: t('brand.era') }),
      ),
      this.baselineSection(S, C),
      this.readingsSection(S, C),
      this.crossSection(S),
      this.decisionSection(S),
    );
    if (S.decision) paper.append(h('div', { class: `stamped ${S.decision}`, text: t(`report.stamp${S.decision === 'human' ? 'Human' : S.decision === 'replicant' ? 'Replicant' : 'Unsure'}`) }));
    this.el.replaceChildren(paper);
    paper.scrollTop = scroll;
    if (S.readings.length > this.lastCount) {
      const last = paper.querySelector('tr.new');
      last?.scrollIntoView({ block: 'nearest' });
    }
    this.lastCount = S.readings.length;
    if (focusKey) {
      const el = paper.querySelector(`[data-key="${focusKey}"]`);
      if (el) { el.focus({ preventScroll: true }); if (caret != null && el.setSelectionRange) el.setSelectionRange(caret, caret); }
    }
  },

  baselineSection(S, C) {
    const sec = h('section', {}, h('h3', { text: t('report.baselineTitle') }));
    if (!S.baselineReadings.length) { sec.append(h('p', { class: 'empty', text: t('report.noBaseline') })); return sec; }
    const head = h('tr', {}, ['n', 'q', 'pupil', 'blush', 'pulse', 'resp', 'latency', 'particles'].map((k) => h('th', { text: k === 'q' ? '' : k === 'pupil' ? `${t('units.mm')}` : C(k).replace('%', '') })));
    const row = (r, label) => h('tr', {},
      h('td', { text: label ?? r.n }), h('td', { text: '' }),
      h('td', { text: f2(r.raw.pupil) }), h('td', { text: f1(r.raw.blush) }), h('td', { text: Math.round(r.raw.pulse) }),
      h('td', { text: f1(r.raw.resp) }), h('td', { text: f2(r.raw.latency) }), h('td', { text: Math.round(r.raw.particles) }));
    const rows = S.baselineReadings.map((r) => row(r));
    if (S.baseline) {
      const br = row({ raw: S.baseline }, t('machine.baseline'));
      br.style.fontWeight = '700';
      rows.push(br);
    }
    sec.append(h('table', {}, h('thead', {}, head), h('tbody', {}, rows)));
    return sec;
  },

  readingsSection(S, C) {
    const sec = h('section', {}, h('h3', { text: t('report.readingsTitle') }));
    if (!S.readings.length) { sec.append(h('p', { class: 'empty', text: t('report.empty') })); return sec; }
    const head = h('tr', {}, ['n', 'q', 'pupil', 'onset', 'blush', 'pulse', 'resp', 'latency', 'particles'].map((k) => h('th', { text: C(k) })));
    const body = h('tbody');
    const last = S.readings[S.readings.length - 1];
    let card = null;
    const flushNote = (cardId) => {
      if (!cardId) return;
      const note = S.notes[cardId] ?? { tag: 0, text: '' };
      const sel = h('select', { 'aria-label': t('report.noteAria'), 'data-key': `tag-${cardId}`, onchange: (e) => { note.tag = +e.target.value; S.notes[cardId] = note; sfx.play('typeKey'); bus.emit('report:note'); } },
        t('report.notes').map((n, i) => h('option', { value: i, selected: i === note.tag, text: n })));
      const inp = h('input', { type: 'text', value: note.text, placeholder: t('report.freeNotePlaceholder'), 'aria-label': t('report.freeNote'), 'data-key': `txt-${cardId}`, maxlength: 80,
        oninput: (e) => { note.text = e.target.value; S.notes[cardId] = note; if (Math.random() < 0.6) sfx.play('typeKey'); } });
      body.append(h('tr', { class: 'note-row' }, h('td', { colspan: 9 }, h('div', { class: 'wrap' }, sel, inp))));
    };
    for (const r of S.readings) {
      if (r.card !== card) { flushNote(card); card = r.card; }
      const d = r.dev;
      const an = (ch) => (r.anomaly === ch ? 'anom' : null);
      body.append(h('tr', { class: [r === last ? 'new' : '', r.pressed ? 'pressed' : ''].join(' ').trim() || null },
        h('td', { text: String(r.n).padStart(2, '0') }),
        h('td', { class: 'q' }, `${questions.cardTitle(r.card)}`, h('small', { text: `${t(`forms.${r.form}`)}${r.pressed ? ' ' + t('report.pressed') : ''}` })),
        h('td', { class: an('pupil'), text: sgn(d.pupil) }),
        h('td', { text: f1(r.onset) }),
        h('td', { class: an('blush'), text: sgn(d.blush) }),
        h('td', { class: an('pulse'), text: sgn(d.pulse, 0) }),
        h('td', { text: sgn(d.resp) }),
        h('td', { text: f2(r.raw.latency) }),
        h('td', { class: an('particles'), text: sgn(d.particles) }),
      ));
    }
    flushNote(card);
    sec.append(h('table', {}, h('thead', {}, head), body));
    return sec;
  },

  crossSection(S) {
    const sec = h('section', { class: 'cross' }, h('h3', { text: t('report.crossTitle') }), h('p', { class: 'hint', text: t('report.crossHint') }));
    const groups = S.crossref();
    if (!groups.length) { sec.append(h('p', { class: 'empty', text: t('report.crossEmpty') })); return sec; }
    for (const g of groups) {
      sec.append(h('p', { class: 'pair' }, `${t(`pairs.${g.pair}`)} `, h('span', { class: 'spread', text: `· ${t('report.crossSpread')} ${f1(g.spread)}` })));
      const rows = g.list.map((r) => h('tr', {},
        h('td', { text: String(r.n).padStart(2, '0') }),
        h('td', { class: 'q' }, questions.cardTitle(r.card), h('small', { text: t(`forms.${r.form}`) })),
        h('td', { text: `${t('report.cols.pupil')} ${sgn(r.dev.pupil)}` }),
        h('td', { text: `${t('report.cols.blush')} ${sgn(r.dev.blush)}` }),
        h('td', { text: `${t('report.cols.onset')} ${f1(r.onset)}` }),
        h('td', { text: `${t('report.cols.latency')} ${f2(r.raw.latency)}` }),
      ));
      sec.append(h('table', {}, h('tbody', {}, rows)));
    }
    return sec;
  },

  decisionSection(S) {
    const sec = h('section', {}, h('h3', { text: t('report.decisionTitle') }), h('p', { class: 'hint', text: t('report.decisionHint') }));
    if (S.broken) sec.append(h('p', { class: 'confirm', text: t('report.breakNote') }));
    const can = S.canDecide && !S.decision && !S.busy;
    if (!S.canDecide) sec.append(h('p', { class: 'empty', text: t('report.decisionLocked', { n: S.minQuestions, k: S.count }) }));
    const confirmEl = h('p', { class: 'confirm', 'aria-live': 'polite', text: this.armed ? t('report.confirm') : '' });
    const btn = (kind, label) => h('button', {
      type: 'button', class: `stamp-btn${this.armed === kind ? ' arm' : ''}`, disabled: !can, 'data-key': `stamp-${kind}`, text: label,
      onclick: () => {
        if (this.armed !== kind) { this.armed = kind; sfx.play('key'); this.render(); return; }
        this.armed = null;
        bus.emit('decision', kind);
      },
    });
    sec.append(h('div', { class: 'stamps' },
      btn('human', t('report.stampHuman')),
      btn('replicant', t('report.stampReplicant')),
      btn('unsure', t('report.stampUnsure'))), confirmEl);
    return sec;
  },
};
