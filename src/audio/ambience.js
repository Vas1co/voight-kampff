// Sürekli sesler: oda uğultusu, pervane, floresan vızıltısı, CRT vızıltısı, makine motoru, kaset motoru.
// assets/audio/sfx/room-tone varsa oda uğultusu yerine dosya döngüde çalar.
import { audio } from './engine.js';

export class Ambience {
  constructor() { this.on = false; }

  async start() {
    if (this.on || !audio.ready) return;
    this.on = true;
    const ctx = audio.ctx, out = audio.amb;
    const roomFile = await audio.load('sfx', 'room-tone');
    if (roomFile) audio.playBuffer(roomFile, out, { loop: true, gain: 0.8 });
    else {
      const s = audio.loopNoise(audio.brown);
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 300;
      const g = ctx.createGain(); g.gain.value = 0.09;
      s.connect(f); f.connect(g); g.connect(out);
      const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = 59;
      const of = ctx.createBiquadFilter(); of.type = 'lowpass'; of.frequency.value = 160;
      const og = ctx.createGain(); og.gain.value = 0.012;
      o.connect(of); of.connect(og); og.connect(out); o.start();
    }

    // pervane: kanat geçişiyle yavaşça dalgalanan hava
    const fs = audio.loopNoise(audio.white);
    const ff = ctx.createBiquadFilter(); ff.type = 'bandpass'; ff.frequency.value = 600; ff.Q.value = 0.6;
    this.fanGain = ctx.createGain(); this.fanGain.gain.value = 0.008;
    fs.connect(ff); ff.connect(this.fanGain); this.fanGain.connect(out);
    this.fanLfo = ctx.createOscillator(); this.fanLfo.frequency.value = (0.75 * 5) / (Math.PI * 2);
    const flg = ctx.createGain(); flg.gain.value = 0.006;
    this.fanLfo.connect(flg); flg.connect(this.fanGain.gain); this.fanLfo.start();

    // floresan armatür: balast vızıltısı (100/200 Hz) ve hafif cızırtı
    this.lampGain = ctx.createGain(); this.lampGain.gain.value = 0.006;
    this.lampGain.connect(out);
    for (const [fr, a] of [[100, 1], [200, 0.5], [300, 0.2]]) {
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = fr;
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 600;
      const g = ctx.createGain(); g.gain.value = a * 0.25; o.connect(f); f.connect(g); g.connect(this.lampGain); o.start();
    }
    const ls = audio.loopNoise(audio.white);
    const lf = ctx.createBiquadFilter(); lf.type = 'bandpass'; lf.frequency.value = 4200; lf.Q.value = 2;
    const lg = ctx.createGain(); lg.gain.value = 0.25; ls.connect(lf); lf.connect(lg); lg.connect(this.lampGain);

    // CRT vızıltısı + makine motoru (güçle açılır)
    this.hum = ctx.createGain(); this.hum.gain.value = 0;
    this.hum.connect(out);
    for (const [fr, a] of [[120, 1], [240, 0.4], [360, 0.15]]) {
      const o = ctx.createOscillator(); o.frequency.value = fr;
      const g = ctx.createGain(); g.gain.value = a; o.connect(g); g.connect(this.hum); o.start();
    }
    const whine = ctx.createOscillator(); whine.frequency.value = 7800;
    const wg = ctx.createGain(); wg.gain.value = 0.06; whine.connect(wg); wg.connect(this.hum); whine.start();
    const ms = audio.loopNoise(audio.brown);
    const mf = ctx.createBiquadFilter(); mf.type = 'bandpass'; mf.frequency.value = 180; mf.Q.value = 2;
    const mg = ctx.createGain(); mg.gain.value = 0.6; ms.connect(mf); mf.connect(mg); mg.connect(this.hum);

    // kaset motoru (kayıt sırasında)
    const ts = audio.loopNoise(audio.white);
    const tf = ctx.createBiquadFilter(); tf.type = 'highpass'; tf.frequency.value = 5000;
    this.tape = ctx.createGain(); this.tape.gain.value = 0;
    ts.connect(tf); tf.connect(this.tape); this.tape.connect(out);
    const tm = ctx.createOscillator(); tm.type = 'square'; tm.frequency.value = 31;
    const tmf = ctx.createBiquadFilter(); tmf.type = 'lowpass'; tmf.frequency.value = 120;
    const tmg = ctx.createGain(); tmg.gain.value = 0.2; tm.connect(tmf); tmf.connect(tmg); tmg.connect(this.tape); tm.start();
  }

  // Makine gücü (0–1) ve ölçüm durumu
  machine(power, close = false) {
    if (!this.hum) return;
    this.hum.gain.setTargetAtTime(power * (close ? 0.014 : 0.006), audio.now, 0.3);
  }

  fan(speed) {
    if (!this.fanLfo) return;
    this.fanLfo.frequency.setTargetAtTime((speed * 5) / (Math.PI * 2), audio.now, 0.5);
  }

  // Floresanın titremesi vızıltıya da yansır.
  lamp(level) {
    if (!this.lampGain) return;
    this.lampGain.gain.setTargetAtTime(0.006 * (0.4 + 0.6 * level), audio.now, 0.02);
  }

  recording(on) { this.tape?.gain.setTargetAtTime(on ? 0.008 : 0, audio.now, 0.1); }
}

export const ambience = new Ambience();
