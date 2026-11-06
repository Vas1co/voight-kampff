// Giriş noktası: sahneyi, sesi, arayüzü ve akış yöneticisini bağlar.
import './styles/fonts.css';
import './styles/base.css';
import './styles/typography.css';
import './styles/ui.css';
import './styles/result.css';

import { Stage } from './scene/stage.js';
import { Loop } from './core/loop.js';
import { bus } from './core/events.js';
import { save } from './core/save.js';
import { initInput } from './core/input.js';
import { Game } from './core/game.js';
import { Subtitles } from './ui/subtitles.js';
import { hud } from './ui/overlay.js';
import { settingsUI } from './ui/settings.js';
import { audio } from './audio/engine.js';


// Kanvas yazıları (göstergeler, gövde etiketleri) için fontlar hazır olmalı.
await Promise.race([
  Promise.all(['400 20px "Plex Mono"', '600 20px "Plex Mono"', '700 20px "Courier Prime"'].map((f) => document.fonts.load(f))),
  new Promise((r) => setTimeout(r, 2500)),
]).catch(() => {});

const s = save.settings;
const root = document.documentElement;
const applyClasses = () => {
  root.classList.toggle('reduce', !!s.reduceMotion);
  root.classList.toggle('sub-large', s.subSize === 'large');
};
applyClasses();

const stage = new Stage(document.getElementById('scene'), { quality: s.quality, reduceMotion: s.reduceMotion });
const subs = new Subtitles();
const game = new Game({ stage, subs });

hud.init({
  onSound: () => { s.muted = !s.muted; save.write(); audio.apply(s); hud.sound(!s.muted); },
  onSettings: () => settingsUI.toggle(),
});
hud.sound(!s.muted);

bus.on('settings', ({ key }) => {
  audio.apply(s);
  hud.sound(!s.muted);
  if (key === 'reduceMotion') stage.setReduceMotion(s.reduceMotion);
  applyClasses();
});

// Altyazı ve seçenekler için görüntünün altı boş kalır; sahne yukarı kayar.
const insets = () => stage.setInsets(40, Math.round(Math.min(260, Math.max(120, innerHeight * 0.24))));
insets();
addEventListener('resize', insets);

initInput();

const loop = new Loop();
loop.add((dt, t) => {
  game.frame(dt);
  stage.update(dt, t, { recording: game.machine.recording });
  stage.render();
});
loop.start();
game.start();

document.addEventListener('visibilitychange', () => { if (!document.hidden) audio.resume(); });

if (import.meta.env.DEV) {
  window.__sapma = { stage, game, save };
  // Geliştirme: ?hizli ile altyazılar hızlanır (test için).
  if (new URLSearchParams(location.search).has('hizli')) subs.speed = 5;
  // Geliştirme: ?disa-aktar ile dokular düzenlenebilir PNG olarak tasarim/ klasörüne yazılır.
  if (new URLSearchParams(location.search).has('disa-aktar')) import('./dev/export.js').then((m) => setTimeout(() => m.runExport(stage), 1500));
}
