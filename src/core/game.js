// Akış yöneticisi. Oyuncu denektir; sorular karşıdaki sorgucudan gelir.
// giriş → makine açılır → sessiz temel ölçüm → 7 soru (ilki sabit, diğerleri karışık)
// → analiz → sorgucunun kararı ve damgalı rapor.
import { FSM } from './fsm.js';
import { bus } from './events.js';
import { sleep, guard } from './async.js';
import { t, voiceId } from './strings.js';
import { save } from './save.js';
import { Interview } from '../test/interview.js';
import { questions } from '../test/questions.js';
import { hud, screen } from '../ui/overlay.js';
import { choices } from '../ui/choices.js';
import { result } from '../ui/result.js';
import { settingsUI } from '../ui/settings.js';
import { gate } from '../ui/gate.js';
import { audio } from '../audio/engine.js';
import { sfx } from '../audio/sfx.js';
import { ambience } from '../audio/ambience.js';
import { music } from '../audio/music.js';
import player from '../../data/subjects/player.json';

export class Game {
  constructor({ stage, subs }) {
    this.stage = stage;
    this.machine = stage.machine;
    this.subs = subs;
    this.iv = null;
    this.fsm = new FSM(this.states(), bus);
    this.bindGlobal();
  }

  start() { this.fsm.go('TITLE'); }

  // ---------- yardımcılar ----------
  say(path, opts = {}) {
    return this.subs.say(t(path, opts.vars), { speaker: 'interrogator', voiceId: voiceId(path), ...opts });
  }
  cut(name) { this.stage.rig.cut(name); }

  counter() {
    const iv = this.iv;
    if (!iv?.baseline) hud.counter(t('hud.baseline'));
    else hud.counter(`${t('hud.question')} ${Math.min(iv.readings.length + 1, iv.total)} / ${iv.total}`);
  }

  bindGlobal() {
    bus.on('input', ({ action }) => {
      if (action === 'escape') { settingsUI.open ? settingsUI.hide() : (this.fsm.current !== 'TITLE' && settingsUI.show()); return; }
      if (settingsUI.open) return;
      if (action === 'skip') this.subs.skip();
    });
    document.getElementById('subtitles').addEventListener('pointerdown', () => this.subs.skip());
  }

  // Her karede (main.js çağırır)
  frame(dt) {
    if (!this.iv) return;
    this.iv.update(dt);
    const s = this.machine.signals;
    const dev = s.dev();
    this.machine.calError = Math.max(-1, Math.min(1, this.iv.calib.error() / 10));
    this.machine.stress = dev ? Math.max(0, dev.pulse) * 6 : 0;
    ambience.machine(this.machine.crt.power, this.stage.rig.name === 'crt' || this.stage.rig.name === 'machine');
    ambience.lamp(this.stage.room.flick);
  }

  powerOn() {
    sfx.play('switchOn');
    this.stage.rig.kick(0.3);
    setTimeout(() => sfx.play('crtOn'), 250);
    this.machine.setPower(true);
  }

  // ---------- durumlar ----------
  states() {
    const G = this;
    return {
      TITLE: {
        enter() {
          screen.fade(0.55, 600);
          hud.show(false);
          gate.show({
            onStart: () => {
              audio.start(save.settings);
              ambience.start();
              music.start();
              gate.hide();
              G.fsm.go('INTRO', { first: true });
            },
            onSettings: () => settingsUI.show(),
          });
        },
      },

      INTRO: {
        async enter({ first }, tk) {
          G.iv = new Interview(player);
          const M = G.machine;
          M.setSubject(player);
          M.signals.setBaseline(null);
          M.signals.particleHistory = [];
          hud.subject(player.number);
          G.counter();
          G.cut('wide');
          if (first) {
            screen.cinema(true);
            screen.fade(1, 900);
            await sleep(1000, tk);
            music.sting('title');
            await screen.card({ kicker: t('intro.card1'), title: t('intro.card2') }, 3400, tk);
            screen.fade(0, 3600);
            hud.show(true);
            hud.resetClock();
            await sleep(2400, tk);
            await G.say('lines.sit', { token: tk });
            await G.say('lines.relax', { token: tk });
            screen.cinema(false);
          } else {
            screen.fade(0, 1600);
            hud.show(true);
            hud.resetClock();
            await sleep(1200, tk);
          }
          // sorgucu makineyi açar ve kaydı başlatır
          G.cut('machine');
          await sleep(500, tk);
          G.powerOn();
          M.recording = true;
          document.documentElement.classList.add('recording');
          sfx.play('cassetteIn');
          ambience.recording(true);
          await sleep(2200, tk);
          G.cut('crt');
          if (first) {
            await G.say('lines.eye', { token: tk });
            await G.say('lines.speed', { token: tk });
          }
          G.fsm.go('BASELINE');
        },
      },

      BASELINE: {
        async enter(_, tk) {
          const iv = G.iv, M = G.machine;
          G.cut('machine');
          await G.say('lines.baseline', { token: tk });
          M.signals.status = 'sampling';
          for (let i = 0; i < 6; i++) {
            if (i % 3 === 0) { M.bellows.inhale(); sfx.play('bellows'); sfx.play('relays', { n: 3 }); }
            iv.sampleRest();
            await sleep(700, tk);
          }
          iv.finishBaseline();
          M.signals.setBaseline(iv.baseline);
          M.signals.release();
          sfx.play('chirp');
          G.counter();
          await G.say('lines.baselineDone', { token: tk });
          G.fsm.go('QUESTION', 0);
        },
      },

      QUESTION: {
        async enter(i, tk) {
          const iv = G.iv, M = G.machine, q = iv.list[i];
          G.counter();
          M.signals.release();
          M.crt.kick(0.35, 0.2);
          sfx.play('static', { d: 0.25 });
          await sleep(300, tk);

          // sahne satırları: geniş plan; son satır ve soru: göz yakın planı
          const lines = questions.lines(q.id);
          for (let k = 0; k < lines.length; k++) {
            G.cut(k === 0 ? 'wide' : 'machine');
            await G.subs.say(lines[k], { speaker: 'interrogator', voiceId: voiceId(`questions.${q.id}.lines`, k), token: tk });
          }
          G.cut('crt');
          sfx.play('chirp');
          G.subs.say(questions.prompt(q.id), { speaker: 'interrogator', voiceId: voiceId(`questions.${q.id}.prompt`), token: tk, hold: true });
          await sleep(500, tk);

          // cevap: gerçek tepki süresi ölçülür
          const opts = questions.options(q, iv.rng);
          const { option, rt } = await choices.ask(opts, questions.timeLimit, tk, {
            onTick: (sec, lim) => sfx.play('dialTick', { loud: sec >= lim - 4 }),
          });
          const reading = iv.answer(q, option, rt);

          // makine okur
          sfx.play('relay');
          setTimeout(() => sfx.play('relays', { n: 5 }), 120);
          M.bellows.inhale();
          sfx.play('bellows');
          G.subs.show(option ? option.text : t('choices.none'), 'you');
          const settled = new Promise((resolve) => {
            M.signals.sample(reading, {
              onPupil: () => M.crt.pupil(reading.raw.pupil, 2.6),
              onAnomaly: () => sfx.play('anomaly'),
              onSettled: resolve,
            }, { answerAt: 0.15 });
          });
          M.signals.onBeat = () => sfx.play('heartbeat', { v: 0.45 });
          setTimeout(() => { if (tk.alive) G.cut('machine'); }, 1400);
          await guard(settled, tk);
          await G.subs.wait(1200, tk);
          M.signals.onBeat = null;
          G.subs.hide();
          sfx.play(reading.score === 2 ? 'warm' : reading.none || reading.score === 0 ? 'buzz' : 'chirp');
          await sleep(500, tk);

          if (reading.none) await G.say('lines.noAnswer', { token: tk });
          else if (rt < 1.0) await G.say('lines.fast', { token: tk });
          else if (i < iv.total - 1 && iv.rng.chance(0.35)) {
            const next = t('lines.next');
            const k = iv.rng.next() * next.length | 0;
            await G.subs.say(next[k], { speaker: 'interrogator', voiceId: voiceId('lines.next', k), token: tk });
          }
          if (i + 1 < iv.total) G.fsm.go('QUESTION', i + 1);
          else G.fsm.go('ANALYZE');
        },
      },

      ANALYZE: {
        async enter(_, tk) {
          const M = G.machine;
          M.signals.release();
          await G.say('lines.end', { token: tk });
          G.cut('machine');
          sfx.play('analyze');
          M.signals.status = 'sampling';
          for (let k = 0; k < 18; k++) {
            M.signals.level = Math.random() * 0.8;
            if (k % 6 === 0) M.crt.kick(0.3, 0.1);
            await sleep(130, tk);
          }
          M.signals.release();
          await sleep(500, tk);
          G.fsm.go('VERDICT');
        },
      },

      VERDICT: {
        async enter(_, tk) {
          const iv = G.iv;
          const v = iv.verdict();
          save.data.last = { kind: v.kind, at: Date.now() };
          save.write();
          G.cut('wide');
          music.sting(v.kind === 'replicant' ? 'dread' : v.kind === 'human' ? 'resolve' : 'decision');
          await G.say(`lines.verdict.${v.kind}`, { token: tk, min: 2200 });
          sfx.play('paper');
          result.show(iv, v, { onAgain: () => G.fsm.go('AGAIN') });
          setTimeout(() => sfx.play('stamp'), 1650);
          await guard(new Promise(() => {}), tk);
        },
      },

      AGAIN: {
        async enter(_, tk) {
          result.hide();
          const M = G.machine;
          M.setPower(false);
          sfx.play('switchOff');
          M.recording = false;
          document.documentElement.classList.remove('recording');
          ambience.recording(false);
          screen.fade(1, 900);
          await sleep(1100, tk);
          G.fsm.go('INTRO', { first: false });
        },
      },
    };
  }
}
