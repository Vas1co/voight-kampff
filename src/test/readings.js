// Okuma üretimi (denek = oyuncu). Seçilen cevabın duygusal içeriği ve oyuncunun
// GERÇEK tepki süresi fizyolojik bir tepkiye çevrilir, üstüne makine katmanı
// (kalibrasyon hatası, gürültü, anomali) eklenir. Makine yorum üretmez.
import { clamp } from '../core/rng.js';

export const CHANNELS = ['pupil', 'blush', 'pulse', 'resp', 'latency', 'particles'];

// Sapma: göz bebeği/kızarma/parçacık yüzde, nabız/solunum mutlak, tepki süresi saniye farkı.
export function deviation(raw, base) {
  if (!base) return null;
  const pct = (a, b) => (b ? (a / b - 1) * 100 : 0);
  return {
    pupil: pct(raw.pupil, base.pupil),
    blush: pct(raw.blush, base.blush),
    particles: pct(raw.particles, base.particles),
    pulse: raw.pulse - base.pulse,
    resp: raw.resp - base.resp,
    latency: raw.latency != null && base.latency != null ? raw.latency - base.latency : 0,
  };
}

// Temel ölçüm sırasında alınan dinlenim örneği.
export function restSample({ subject, calib, rng }) {
  const V = subject.vitals, e = calib ? calib.error() : 0;
  return {
    pupil: V.pupil * (1 + e * 0.01) + rng.gauss(0, 0.03),
    blush: V.blush * (1 + e * 0.013) + rng.gauss(0, 0.2),
    pulse: V.pulse + e * 0.35 + rng.gauss(0, 1.2),
    resp: V.resp + rng.gauss(0, 0.4),
    latency: null,
    particles: V.particles + rng.gauss(0, 8),
  };
}

// score: 0–2 (null = cevap yok), rt: saniye
export function answerReading({ subject, q, score, rt, calib, rng, baseline }) {
  const V = subject.vitals;
  const none = score == null;
  // uyarılma: cevabın empatik içeriği × sorunun kışkırtıcılığı
  let a = none ? 0.05 : (0.15 + score * 0.42) * (0.6 + q.provocation * 0.6);
  a = clamp(a * (1 + rng.gauss(0, 0.12)), 0, 1.3);
  // çok hızlı cevap: refleks; tepki düz kalır
  if (!none && rt < 1.0) a *= 0.55;

  const e = calib ? calib.error() : 0;
  const raw = {
    pupil: V.pupil * (1 + a * 0.3) * (1 + e * 0.01) + rng.gauss(0, 0.03),
    blush: V.blush * (1 + a * 0.4) * (1 + e * 0.013) + rng.gauss(0, 0.2),
    pulse: V.pulse + a * 14 + e * 0.35 + rng.gauss(0, 1.2),
    resp: V.resp + a * 4 + rng.gauss(0, 0.35),
    latency: rt,
    particles: V.particles * (1 + a * 0.18 + rng.gauss(0, 0.04)),
  };
  const onset = none ? rng.range(1.4, 2.0) : rng.range(0.28, 0.6);

  let anomaly = null;
  if (rng.chance(subject.machine?.anomalyRate ?? 0)) {
    anomaly = rng.pick(['pupil', 'blush', 'pulse', 'particles']);
    const s = rng.chance(0.5) ? 1 : -1;
    if (anomaly === 'pupil') raw.pupil *= 1 + s * rng.range(0.12, 0.22);
    if (anomaly === 'blush') raw.blush *= 1 + s * rng.range(0.2, 0.35);
    if (anomaly === 'pulse') raw.pulse += s * rng.range(10, 16);
    if (anomaly === 'particles') raw.particles *= 1 + s * rng.range(0.25, 0.4);
  }

  return {
    qid: q.id, pair: q.pair ?? null, score, rt, none, raw, onset, anomaly,
    dev: deviation(raw, baseline),
  };
}
