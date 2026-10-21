// Akış yöneticisi. Bir sorgunun döngüsü:
// vaka dosyası → kurulum (kaset, şalter, kalibrasyon) → temel ölçüm → soru kartları
// (çapraz referanslı) → makine okumaları → raporda not → karar → damgalı rapor → sonuç sahnesi.
import { FSM } from './fsm.js';
import { bus } from './events.js';
import { sleep, guard } from './async.js';
import { t, voiceId } from './strings.js';
import { save } from './save.js';
import { rng as makeRng } from './rng.js';
import { Session } from '../test/session.js';
import { questions } from '../test/questions.js';
import { STRESS } from '../test/stress.js';
import { hud, hint, screen } from '../ui/overlay.js';
import { casefile } from '../ui/casefile.js';
import { report } from '../ui/report.js';
import { settingsUI } from '../ui/settings.js';
import { gate } from '../ui/gate.js';
import { audio } from '../audio/engine.js';
import { sfx } from '../audio/sfx.js';
import { ambience } from '../audio/ambience.js';
import { music } from '../audio/music.js';

// data/subjects/*.json otomatik kaydolur.
const SUBJECTS = Object.fromEntries(
  Object.values(import.meta.glob('../../data/subjects/*.json', { eager: true, import: 'default' })).map((s) => [s.id, s]),
);

const CHAPTERS = ['s1']; // Bu aşamada yalnızca Denek 1 (deneme bölümü).

export class Game {
  constructor({ stage, controls, subs }) {
    this.stage = stage;
    this.machine = stage.machine;
    this.controls = controls;
    this.subs = subs;
    this.session = null;
    this.flags = {};
    this.rand = makeRng(Date.now() & 0xffff);
    this.fsm = new FSM(this.states(), bus);
    this.bindGlobal();
  }

  start() { this.fsm.go('TITLE'); }

  // ---------- yardımcılar ----------
  get S() { return this.session; }
  say(path, opts = {}) {
    const text = t(path, opts.vars);
    return this.subs.say(Array.isArray(text) ? text.join(' ') : text, { voiceId: voiceId(path), ...opts });
  }
  intercom(key, token) { return this.say(`lines.tutorial.${key}`, { speaker: 'intercom', token }); }
  officer(key, token, opts = {}) { return this.say(`lines.officer.${key}`, { speaker: 'officer', token, ...opts }); }
  cut(name) { this.stage.rig.cut(name); }
  waitControl(token, ...types) { return bus.wait('control', token, (p) => types.includes(p.type)); }
  tutorial(fn) { if (this.S?.subject.tutorial) return fn(); return null; }
  once(flag, fn) { if (this.flags[flag]) return null; this.flags[flag] = true; return fn(); }

  updateCounter() {
    const S = this.S;
    if (!S) return;
    if (!S.baseline) hud.counter(`${t('hud.baseline')} ${S.baselineReadings.length} / ${S.subject.baseline.length}`);
    else hud.counter(`${t('hud.question')} ${String(S.count).padStart(2, '0')} / ${S.target}`, S.count > S.target);
  }

  setCards({ enabled = false, active = null } = {}) {
    const S = this.S;
    this.controls.setCards(S.cards, S.usedCards, { enabled, active });
  }

  setDeck({ cards = false, active = null, next = false, press = false, pause = false, dial = null, sw = null, cassette = null } = {}) {
    const S = this.S;
    this.setCards({ enabled: cards, active });
    this.controls.setFlow({ next, press });
    this.controls.setPauseEnabled(pause);
    if (dial != null) this.controls.setDialEnabled(dial);
    if (sw != null) this.controls.setSwitch(S.power, sw);
    if (cassette != null) this.controls.setCassette(S.recording, cassette);
  }

  // ---------- genel girişler ----------
  bindGlobal() {
    bus.on('control', (p) => {
      if (p.type === 'file') { if (this.S) { casefile.toggle(); } return; }
      if (p.type === 'report') { if (this.S) { report.toggle(); } return; }
      if (p.type === 'dial') {
        if (!this.S || this.controls.dialEl.getAttribute('aria-disabled') === 'true') return;
        this.S.calib.nudge(p.delta);
        this.controls.setDial(this.S.calib.dial);
        sfx.play('dialTick');
      }
    });
    bus.on('pick', (what) => bus.emit('control', { type: what }));
    bus.on('input', ({ action, index }) => {
      if (settingsUI.open && action !== 'escape') return;
      if (action === 'escape') {
        if (settingsUI.open) settingsUI.hide();
        else if (casefile.open) casefile.hide();
        else if (report.open) report.hide();
        else if (this.fsm.current !== 'TITLE') settingsUI.show();
        return;
      }
      if (action === 'skip') { this.subs.skip(); return; }
      if (!this.S || this.fsm.is('TITLE')) return;
      if (action === 'card') {
        const c = this.S.cards[index];
        if (c && !this.controls.cardsEl.children[index]?.disabled) bus.emit('control', { type: 'card', id: c.id });
        return;
      }
      const btn = { next: this.controls.nextBtn, press: this.controls.pressBtn, pause: this.controls.pauseBtn, cassette: this.controls.recBtn, switch: this.controls.switchBtn }[action];
      if (btn) { if (!btn.disabled) btn.click(); return; }
      if (action === 'dialUp' || action === 'dialDown') bus.emit('control', { type: 'dial', delta: action === 'dialUp' ? 0.5 : -0.5 });
      if (action === 'report' || action === 'file') bus.emit('control', { type: action });
    });
    bus.on('decision', (kind) => {
      if (this.fsm.is('TESTING', 'DECISION') && this.S && !this.S.busy && !this.S.decision) this.fsm.go('STAMP', kind);
    });
    // altyazıya tıklayınca geç
    document.getElementById('subtitles').addEventListener('pointerdown', () => this.subs.skip());
  }

  // Her karede (main.js çağırır)
  frame(dt) {
    const S = this.S;
    if (!S) return;
    const measuring = this.machine.signals.status === 'sampling' || this.machine.signals.status === 'bellows';
    S.update(dt, measuring);
    const needle = S.calib.needle();
    this.controls.setNeedle(S.calib.enabled ? needle : 0);
    this.controls.setStress(S.stress.value);
    this.controls.tickTape(dt, S.recording);
    this.machine.calError = S.calib.enabled ? needle : 0;
    this.machine.stress = S.stress.value;
    this.machine.recording = S.recording;
    ambience.machine(this.machine.crt.power, this.stage.rig.name === 'crt' || this.stage.rig.name === 'machine');
    ambience.fan(this.stage.room.fanSpeed);
    // eğitim: kalibrasyon yeniden kaydıysa uyar
    if (S.baseline && !S.busy && Math.abs(needle) > 0.5 && this.fsm.is('TESTING')) {
      this.once('drift', () => { this.intercom('drift'); this.controls.highlight('calib'); setTimeout(() => this.controls.highlight(null), 6000); });
    }
  }

  newSession(id) {
    const subject = SUBJECTS[id];
    this.session = new Session(subject);
    this.flags = {};
    this.machine.setSubject(subject);
    this.stage.room.resetSubject();
    this.machine.setPower(false);
    this.machine.signals.setBaseline(null);
    this.machine.signals.particleHistory = [];
    casefile.setSubject(subject);
    report.bind(this.session);
    this.controls.setDial(0);
    this.controls.tapeCount = 0;
    this.controls.setSwitch(false, false);
    this.controls.setCassette(false, false);
    this.controls.setDialEnabled(false);
    hud.subject(subject.number);
    this.updateCounter();
    return this.session;
  }

  // ---------- durumlar ----------
  states() {
    const G = this;
    return {
      TITLE: {
        enter() {
          screen.fade(0.55, 600);
          G.controls.show(false);
          hud.show(false);
          gate.show({
            canContinue: false,
            onStart: () => {
              audio.start(save.settings);
              ambience.start();
              music.start();
              bus.emit('audio:started');
              gate.hide();
              G.fsm.go('INTRO', { id: CHAPTERS[0] });
            },
            onSettings: () => settingsUI.show(),
          });
        },
      },

      INTRO: {
        async enter({ id }, tk) {
          const S = G.newSession(id);
          G.cut('wide');
          screen.cinema(true);
          screen.fade(1, 900);
          await sleep(1000, tk);
          music.sting('title');
          await screen.card({ kicker: t('brand.unit'), title: t('brand.era') }, 3200, tk);
          await screen.card({ kicker: t(`chapter.${S.subject.chapter}.kicker`), title: t(`chapter.${S.subject.chapter}.title`) }, 2800, tk);
          screen.fade(0, 3200);
          hud.show(true);
          hud.resetClock();
          await sleep(2200, tk);
          await G.officer('sit', tk);
          G.cut('subject');
          await G.officer('explain', tk);
          G.cut('wide');
          await G.tutorial(() => G.intercom('welcome', tk));
          screen.cinema(false);
          G.controls.show(true);
          G.controls.away(false);
          G.setDeck();
          G.fsm.go('CASEFILE');
        },
      },

      CASEFILE: {
        async enter(_, tk) {
          G.cut('desk');
          await G.tutorial(() => G.intercom('readFile', tk));
          hint.show(`${t('casefile.open')} (D)`);
          G.controls.highlight('papers');
          G.controls.ping('file');
          if (!casefile.open) await bus.wait('casefile:open', tk);
          hint.hide();
          G.controls.highlight(null);
          await bus.wait('casefile:close', tk);
          G.fsm.go('SETUP');
        },
      },

      SETUP: {
        async enter(_, tk) {
          const S = G.S;
          G.cut('machine');
          // 1) kaset
          G.controls.setCassette(false, true);
          G.controls.highlight('cassette');
          hint.show(`${t('controls.cassette')} · ${t('controls.rec')} (C)`);
          await G.tutorial(() => G.intercom('cassette', tk));
          await G.waitControl(tk, 'cassette');
          S.recording = true;
          G.controls.setCassette(true, false);
          sfx.play('cassetteIn');
          ambience.recording(true);
          G.controls.highlight(null);
          hint.hide();
          await sleep(700, tk);

          // 2) TEST şalteri
          G.controls.setSwitch(false, true);
          G.controls.highlight('sw');
          hint.show(`${t('controls.test')} (T)`);
          await G.tutorial(() => G.intercom('switch', tk));
          await G.waitControl(tk, 'switch');
          hint.hide();
          G.controls.highlight(null);
          S.power = true;
          G.controls.setSwitch(true, false);
          sfx.play('switchOn');
          G.stage.rig.kick(0.4);
          setTimeout(() => sfx.play('crtOn'), 250);
          G.machine.setPower(true);
          G.stage.room.fanTarget = 6.4;
          S.calib.enabled = true;
          await sleep(1200, tk);
          G.cut('crt');
          await sleep(1800, tk);
          G.cut('machine');

          // 3) kalibrasyon
          G.controls.setDialEnabled(true);
          G.controls.highlight('calib');
          hint.show(`${t('controls.calib')} (← →)`);
          await G.tutorial(() => G.intercom('calibrate', tk));
          G.controls.dialEl.focus({ preventScroll: true });
          let held = 0;
          const t0 = performance.now();
          while (held < 900 && performance.now() - t0 < 25000) {
            await sleep(100, tk);
            held = Math.abs(S.calib.needle()) < 0.12 ? held + 100 : 0;
          }
          G.controls.highlight(null);
          hint.hide();
          sfx.play('relay');
          await G.tutorial(() => G.intercom('calibrateDone', tk));
          G.fsm.go('BASELINE');
        },
      },

      BASELINE: {
        async enter(_, tk) {
          const S = G.S;
          G.setDeck({ pause: false, dial: true });
          await G.tutorial(() => G.intercom('baseline', tk));
          await G.officer('baselineStart', tk);
          S.busy = true;
          for (const qid of S.subject.baseline) {
            await G.ask(qid, { token: tk, baseline: true });
            await sleep(500, tk);
          }
          S.finishBaseline();
          G.machine.signals.setBaseline(S.baseline);
          G.machine.signals.release();
          S.busy = false;
          sfx.play('typeLine');
          report.update();
          G.updateCounter();
          await G.tutorial(() => G.intercom('baselineDone', tk));
          G.fsm.go('TESTING');
        },
      },

      TESTING: {
        async enter(_, tk) {
          const S = G.S;
          G.cut('machine');
          G.machine.signals.release();
          const left = S.cards.filter((c) => !S.usedCards.has(c.id));
          G.setDeck({ cards: true, pause: true, dial: true });
          report.update();
          if (S.canDecide) {
            await G.once('enough', () => { G.controls.ping('report'); return G.tutorial(() => G.intercom('enough', tk)); });
          }
          if (!left.length) { G.fsm.go('DECISION'); return; }
          if (!S.readings.length) {
            G.controls.highlight('tray');
            hint.show(`${t('controls.cards')} (1–${S.cards.length})`);
            await G.tutorial(() => G.intercom('pickCard', tk));
          }
          for (;;) {
            const p = await G.waitControl(tk, 'card', 'pause');
            if (p.type === 'pause') { await G.pause(tk); G.setDeck({ cards: true, pause: true, dial: true }); continue; }
            hint.hide();
            G.controls.highlight(null);
            G.fsm.go('CARD', p.id);
            return;
          }
        },
      },

      CARD: {
        async enter(cardId, tk) {
          const S = G.S;
          const card = questions.card(cardId);
          S.busy = true;
          G.setDeck({ active: cardId, dial: true });
          sfx.play('paper');
          G.cut('wide');
          if (S.usedCards.size === 0) await G.officer('cardIntro', tk);
          for (let i = 0; i < card.subs.length; i++) {
            const sub = card.subs[i];
            let reading = await G.ask(sub.id, { token: tk, first: i === 0 });
            if (await G.checkBreak(tk)) return;
            let presses = 0;
            // akış seçimi: SÜRDÜR / ÜSTÜNE GİT / ARA VER
            for (;;) {
              G.setDeck({ active: cardId, next: true, press: presses < 2, pause: true, dial: true });
              if (!G.flags.flowHint) {
                G.flags.flowHint = true;
                hint.show(`${t('controls.next')} (Enter) · ${t('controls.press')} (B)`);
                G.controls.highlight('flow');
                await G.tutorial(() => G.intercom('afterAnswer', tk));
              }
              const p = await G.waitControl(tk, 'next', 'press', 'pause');
              hint.hide();
              G.controls.highlight(null);
              G.setDeck({ active: cardId, dial: true });
              if (p.type === 'next') { sfx.play('key'); break; }
              if (p.type === 'pause') { await G.pause(tk); continue; }
              sfx.play('key');
              presses++;
              reading = await G.ask(sub.id, { token: tk, pressed: true });
              if (await G.checkBreak(tk)) return;
            }
            G.machine.signals.release();
          }
          S.usedCards.add(cardId);
          S.busy = false;
          G.setDeck({ dial: true });
          // eğitim notları
          if (S.usedCards.size === 1) { G.controls.ping('report'); hint.show(`${t('controls.report')} (R)`); await G.tutorial(() => G.intercom('report', tk)); hint.hide(); }
          if (S.usedCards.size === 2 && S.crossref().length) await G.tutorial(() => G.intercom('crossref', tk));
          G.fsm.go('TESTING');
        },
      },

      BREAK: {
        async enter(_, tk) {
          const S = G.S;
          S.broken = true;
          S.busy = true;
          G.setDeck({});
          G.machine.signals.release();
          const lines = t(`subjects.${S.subject.id}.break`);
          G.cut('subject');
          music.setMood('silent');
          await G.subs.say(lines[0], { speaker: 'subject', token: tk, min: 900 });
          sfx.play('chair');
          G.stage.room.attack();
          G.stage.film.uRedFlash.value = 0.0;
          await sleep(300, tk);
          sfx.play('impact');
          G.stage.rig.kick(3);
          G.machine.crt.kick(1, 1.2);
          G.stage.film.uRedFlash.value = 0.6;
          setTimeout(() => { G.stage.film.uRedFlash.value = 0; }, 160);
          await sleep(350, tk);
          screen.fade(1, 0);
          sfx.play('alarm');
          screen.cinema(true);
          await sleep(900, tk);
          await screen.card({ lines: lines.slice(1) }, 4200, tk);
          G.stage.room.resetSubject();
          G.stage.room.subject.visible = false;
          screen.cinema(false);
          screen.fade(0, 1600);
          G.cut('machine');
          S.busy = false;
          G.fsm.go('DECISION');
        },
      },

      DECISION: {
        async enter(_, tk) {
          const S = G.S;
          G.setDeck({ dial: true });
          music.setMood('silent');
          G.controls.ping('report');
          hint.show(`${t('report.decisionTitle')} · ${t('controls.report')} (R)`);
          if (!S.broken) await G.officer('end', tk);
          report.show();
        },
      },

      STAMP: {
        async enter(kind, tk) {
          const S = G.S;
          S.decision = kind;
          hint.hide();
          sfx.play('stamp');
          G.stage.rig.kick(0.5);
          report.show();
          save.data.decisions[S.subject.id] = kind;
          save.data.notes[S.subject.id] = S.notes;
          save.data.stats[S.subject.id] = { questions: S.count, broken: S.broken, stress: Math.round(S.stress.value) };
          // yanlış kararlar sonraki bölümlerde geri döner
          const correct = (S.subject.kind === 'replicant' && kind === 'replicant') || (S.subject.kind === 'human' && kind === 'human');
          save.data.flags[`${S.subject.id}_${kind}`] = true;
          if (!correct && kind !== 'unsure') save.data.flags[`${S.subject.id}_wrong`] = true;
          save.write();
          await sleep(1600, tk);
          music.sting('decision');
          await G.tutorial(() => G.intercom('decided', tk));
          await sleep(800, tk);
          G.fsm.go('OUTCOME', kind);
        },
      },

      OUTCOME: {
        async enter(kind, tk) {
          const S = G.S;
          report.hide();
          casefile.hide();
          await sleep(500, tk);
          G.controls.setSwitch(false, false);
          sfx.play('switchOff');
          G.machine.setPower(false);
          setTimeout(() => sfx.play('crtOff'), 120);
          S.power = false;
          await sleep(900, tk);
          S.recording = false;
          G.controls.setCassette(false, false);
          sfx.play('cassetteStop');
          ambience.recording(false);
          G.stage.room.fanTarget = 5.6;
          G.controls.away(true);
          hud.show(false);
          G.cut('wide');
          screen.cinema(true);
          await sleep(1200, tk);
          screen.fade(1, 2600);
          await sleep(2800, tk);
          music.sting(kind === 'replicant' ? 'resolve' : 'dread');
          await screen.card({ lines: t(`subjects.${S.subject.id}.outcome.${kind}`) }, 7000, tk);
          await screen.card({ kicker: t('chapter.end'), title: t('chapter.fileClosed') }, 2600, tk);
          G.fsm.go('END');
        },
      },

      END: {
        async enter(_, tk) {
          screen.cardEl.style.pointerEvents = 'auto';
          await screen.card({ kicker: t('chapter.demoEnd'), title: t('chapter.next') });
          const btn = document.createElement('button');
          btn.className = 'ghost';
          btn.type = 'button';
          btn.textContent = t('chapter.replay');
          btn.style.marginTop = '24px';
          btn.addEventListener('click', () => location.reload());
          screen.cardEl.append(btn);
          btn.focus();
          await guard(new Promise(() => {}), tk);
        },
        exit() { screen.cardEl.style.pointerEvents = ''; screen.hideCard(); },
      },
    };
  }

  // ---------- bir alt sorunun tamamı ----------
  async ask(qid, { token, baseline = false, pressed = false, first = false } = {}) {
    const S = this.S, M = this.machine, subjectId = S.subject.id;
    this.machine.signals.release();
    M.crt.kick(0.35, 0.18);
    sfx.play('static', { d: 0.2 });
    await sleep(260, token);

    // memurun okuduğu satırlar
    if (pressed) {
      this.cut('subject');
      const lines = t('lines.officer.press');
      const k = this.rand.next() * lines.length | 0;
      await this.subs.say(lines[k], { speaker: 'officer', voiceId: voiceId('lines.officer.press', k), token });
    } else {
      const lines = questions.text(qid);
      for (let i = 0; i < lines.length; i++) {
        const last = i === lines.length - 1;
        this.cut(baseline ? 'machine' : first && i === 0 ? 'wide' : last ? 'crt' : 'subject');
        const vid = voiceId(`questions.${qid}`, lines.length > 1 ? i : null);
        await this.subs.say(lines[i], { speaker: 'officer', voiceId: vid, token, hold: last, min: last ? 0 : 0 });
        if (last) await this.subs.wait(Math.max(900, this.subs.duration(lines[i]) * 0.75), token);
      }
    }

    // ölçüm
    if (!baseline) this.cut('crt');
    M.bellows.inhale();
    sfx.play('bellows');
    sfx.play('sample');
    const reading = S.measure(qid, { pressed });
    const answerText = pressed ? this.pressAnswer() : questions.answer(subjectId, qid);
    const answerVoice = pressed ? null : voiceId(`subjects.${subjectId}.answers.${qid}`);
    let answered = null;
    const settled = new Promise((resolve) => {
      M.signals.sample(reading, {
        onPupil: () => M.crt.pupil(reading.raw.pupil, 2.4),
        onAnswer: () => { answered = this.subs.say(answerText, { speaker: 'subject', voiceId: answerVoice, token, hold: true }); },
        onAnomaly: () => { sfx.play('anomaly'); this.pendingAnomaly = true; },
        onSettled: resolve,
      });
    });
    M.signals.onBeat = () => sfx.play('heartbeat', { v: 0.5 });
    setTimeout(() => { if (token.alive && !baseline) this.cut('machine'); }, 1900);
    await guard(settled, token);
    if (answered) await guard(answered, token);
    await this.subs.wait(Math.max(1400, this.subs.duration(answerText) * 0.8), token);
    M.signals.onBeat = null;
    this.subs.hide();
    sfx.play('typeLine');
    this.updateCounter();
    report.update();

    if (!baseline) {
      // gerginlik eşikleri
      const st = S.stress.value;
      if (st >= STRESS.danger && st < STRESS.break) {
        const hostile = t(`subjects.${subjectId}.hostile`);
        await this.subs.say(hostile[this.rand.next() * hostile.length | 0], { speaker: 'subject', token });
      }
      if (st >= STRESS.warn) {
        music.setMood('tense');
        await this.once('stressWarn', () => {
          sfx.play('warn');
          this.controls.highlight('pause');
          setTimeout(() => this.controls.highlight(null), 6000);
          return this.tutorial(() => this.intercom('stress', token));
        });
      }
      if (this.pendingAnomaly) {
        this.pendingAnomaly = false;
        await this.once('anomalyHint', () => this.tutorial(() => this.intercom('anomaly', token)));
      }
    }
    return reading;
  }

  pressAnswer() {
    const list = t(`subjects.${this.S.subject.id}.press`);
    return list[this.rand.next() * list.length | 0];
  }

  async checkBreak() {
    if (this.S.stress.value >= STRESS.break) { this.fsm.go('BREAK'); return true; }
    return false;
  }

  // ARA VER: gerginlik düşer, makine ısınır (kalibrasyon kayar).
  async pause(tk) {
    const S = this.S;
    S.busy = true;
    sfx.play('button');
    this.setDeck({ dial: true });
    this.machine.signals.release();
    this.cut('wide');
    await this.officer('pause', tk);
    await this.officer('pauseOffer', tk);
    await this.subs.say(t(`subjects.${S.subject.id}.pause`), { speaker: 'subject', token: tk, min: 1600 });
    S.stress.pause();
    S.calib.heat += 0.5;
    S.calib.kick(this.rand.gauss(0, 3));
    this.machine.crt.kick(0.5, 0.4);
    sfx.play('glitch');
    await sleep(900, tk);
    await this.officer('resume', tk);
    this.cut('machine');
    if (S.stress.value < STRESS.warn) music.setMood('calm');
    S.busy = false;
  }
}
