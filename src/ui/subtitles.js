// Altyazılar (her zaman açık). Konuşan: memur (oyuncu), denek, hoparlör (amir), anlatım.
// Satırın seslendirmesi varsa (assets/audio/voice) çalar, süre ona göre uzar.
// Boşluk / tıklama satırı erken geçer.
import { $ } from './dom.js';
import { t } from '../core/strings.js';
import { voice } from '../audio/voice.js';
import { sleep } from '../core/async.js';
import { ABORT } from '../core/events.js';

export class Subtitles {
  constructor() {
    this.root = $('#subtitles');
    this.speakerEl = $('#sub-speaker');
    this.lineEl = $('#sub-line');
    this.skipFn = null;
    this.speed = 1;
  }

  skip() { this.skipFn?.(); }

  // Okuma süresi: Türkçe için kelime başına ~0.3 sn, en az 1.6 sn.
  duration(text) { return Math.max(1600, 700 + text.length * 52) / this.speed; }

  show(text, speaker = 'officer') {
    this.root.className = `on ${speaker}`;
    const label = speaker === 'officer' ? '' : t(`speakers.${speaker}`);
    this.speakerEl.textContent = label;
    this.lineEl.textContent = speaker === 'officer' || speaker === 'subject' ? `– ${text}` : text;
  }

  hide() { this.root.className = ''; }

  // Bir satırı göster, süre dolunca ya da geçilince kapat.
  async say(text, { speaker = 'officer', voiceId = null, token, hold = false, min = 0, extra = 0 } = {}) {
    this.show(text, speaker);
    const vd = await voice.play(voiceId);
    const ms = Math.max(min, vd ? vd * 1000 + 250 : this.duration(text)) + extra;
    if (hold) return;
    await this.wait(ms, token);
    this.hide();
    await sleep(160, token);
  }

  wait(ms, token) {
    return new Promise((resolve, reject) => {
      let done = false;
      const finish = () => { if (done) return; done = true; clearTimeout(id); this.skipFn = null; token?.offCancel(cancel); resolve(); };
      const cancel = () => { if (done) return; done = true; clearTimeout(id); this.skipFn = null; voice.stop(); reject(ABORT); };
      const id = setTimeout(finish, ms);
      this.skipFn = () => { voice.stop(); finish(); };
      token?.onCancel(cancel);
    });
  }
}
