// Seslendirme: assets/audio/voice/<kimlik>.(ogg|mp3|wav) varsa satırla birlikte çalar.
// Kimlik = metin anahtar yolu, noktalar tireye dönüşür (ör. lines-tutorial-welcome,
// questions-k01a-0, subjects-s1-answers-k01a). Dosya yoksa hiçbir şey çalmaz.
import { audio } from './engine.js';

let current = null;

export const voice = {
  has: (id) => !!id && audio.ready && audio.has('voice', id),
  // Çalınan sesin süresini (sn) döndürür, yoksa null.
  async play(id) {
    if (!this.has(id)) return null;
    const buf = await audio.load('voice', id);
    if (!buf) return null;
    current?.stop(0.05);
    current = audio.playBuffer(buf, audio.voice);
    return buf.duration;
  },
  stop() { current?.stop(0.08); current = null; },
};
