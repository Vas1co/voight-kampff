// Seslendirme: assets/audio/voice/<dil>/<kimlik>.(ogg|mp3|wav) varsa satırla birlikte çalar.
// Kimlik = metin anahtar yolu, noktalar tireye dönüşür (ör. lines-sit, questions-q1-lines-0).
// Önce oyunun dilindeki kayıt aranır, yoksa İngilizce kayıt çalar (Türkçe altyazıyla,
// filmdeki gibi). Hiç kayıt yoksa hiçbir şey çalmaz.
import { audio } from './engine.js';
import { LANG } from '../core/strings.js';

let current = null;

function dir(id) {
  if (!id || !audio.ready) return null;
  for (const d of [`voice/${LANG}`, 'voice/en']) if (audio.has(d, id)) return d;
  return null;
}

export const voice = {
  has: (id) => !!dir(id),
  // Çalınan sesin süresini (sn) döndürür, yoksa null.
  async play(id) {
    const d = dir(id);
    if (!d) return null;
    const buf = await audio.load(d, id);
    if (!buf) return null;
    current?.stop(0.05);
    current = audio.playBuffer(buf, audio.voice);
    return buf.duration;
  },
  stop() { current?.stop(0.08); current = null; },
};
