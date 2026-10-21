// Sorgu sonunda masaya bırakılan kâğıt rapor: temel, okumalar, çapraz referans
// ve sorgucunun damgası. Makine yalnızca ham veriyi verir; damga sorgucunundur.
import { $, h } from './dom.js';
import { t } from '../core/strings.js';
import { questions } from '../test/questions.js';
import { sgn } from '../machine/gauges.js';

const f1 = (v) => v.toFixed(1);
const f2 = (v) => v.toFixed(2);

export const result = {
  el: $('#result'),

  show(iv, verdict, { onAgain } = {}) {
    const C = (k) => t(`report.cols.${k}`);
    const b = iv.baseline;
    const rows = iv.readings.map((r) => h('tr', {},
      h('td', { text: String(r.n).padStart(2, '0') }),
      h('td', { class: 'q', text: questions.short(r.qid) }),
      h('td', { text: r.none ? t('report.noAnswer') : `${f2(r.rt)} ${t('units.sec')}` }),
      h('td', { class: r.anomaly === 'pupil' ? 'anom' : null, text: sgn(r.dev.pupil) }),
      h('td', { text: f1(r.onset) }),
      h('td', { class: r.anomaly === 'blush' ? 'anom' : null, text: sgn(r.dev.blush) }),
      h('td', { class: r.anomaly === 'pulse' ? 'anom' : null, text: sgn(r.dev.pulse, 0) }),
      h('td', { class: r.anomaly === 'particles' ? 'anom' : null, text: sgn(r.dev.particles) }),
    ));

    const cross = iv.crossref().map((g) => h('div', { class: 'pairblock' },
      h('p', { class: 'pair' }, `${t(`pairs.${g.pair}`)} `, h('span', { class: 'spread', text: `· Gz ${f1(g.spread)}` })),
      h('p', { class: 'pairline', text: g.list.map((r) => `${questions.short(r.qid)}: Gz ${sgn(r.dev.pupil)} · Kız ${sgn(r.dev.blush)} · ${r.none ? '—' : f2(r.rt) + ' sn'}`).join('   /   ') }),
    ));

    const again = h('button', { type: 'button', class: 'btn', text: t('report.again'), onclick: () => onAgain?.() });
    const paper = h('article', { class: 'paper' },
      h('h2', { id: 'result-title', text: t('report.title') }),
      h('dl', { class: 'meta' },
        h('dt', { text: t('report.subject') }), h('dd', { text: t('hud.subject', { n: iv.subject.number }) }),
        h('dt', { text: t('report.operator') }), h('dd', { text: t('report.operatorName') }),
        h('dt', { text: t('report.date') }), h('dd', { text: t('brand.era') }),
      ),
      h('h3', { text: t('report.baselineTitle') }),
      h('p', { class: 'base', text: b ? `${t('channels.pupil')} ${f2(b.pupil)} ${t('units.mm')} · ${t('channels.blush')} ${f1(b.blush)} · ${t('channels.pulse')} ${Math.round(b.pulse)} · ${t('channels.resp')} ${f1(b.resp)} · ${t('channels.particles')} ${Math.round(b.particles)}` : '—' }),
      h('h3', { text: t('report.readingsTitle') }),
      h('table', {},
        h('thead', {}, h('tr', {}, ['n', 'q', 'rt', 'pupil', 'onset', 'blush', 'pulse', 'particles'].map((k) => h('th', { text: C(k) })))),
        h('tbody', {}, rows)),
      cross.length ? h('h3', { text: t('report.crossTitle') }) : null,
      cross.length ? h('p', { class: 'hint', text: t('report.crossHint') }) : null,
      ...cross,
      h('h3', { text: t('report.decisionTitle') }),
      h('p', { class: 'hint', text: t('report.decisionHint') }),
      h('div', { class: 'actions' }, again),
      h('div', { class: `stamped ${verdict.kind}`, text: t(`report.stamp.${verdict.kind}`) }),
    );
    this.el.replaceChildren(paper);
    this.el.hidden = false;
    requestAnimationFrame(() => this.el.classList.add('on'));
    again.focus({ preventScroll: true });
  },

  hide() {
    this.el.classList.remove('on');
    setTimeout(() => { this.el.hidden = true; }, 600);
  },
};
