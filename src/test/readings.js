// Okuma üretimi. Önce deneğin gerçek fizyolojik tepkisi hesaplanır,
// sonra makine katmanı (kalibrasyon hatası, gürültü, anomali) eklenir.
// Makine hiçbir zaman yorum üretmez; yalnızca ham değer ve temele göre sapma.
import { clamp } from '../core/rng.js';

export const CHANNELS = ['pupil', 'blush', 'pulse', 'resp', 'latency', 'particles'];

// Sapma hesabı: göz bebeği/kızarma/parçacık yüzde, nabız/solunum mutlak, tepki süresi saniye farkı.
export function deviation(raw, base) {
  if (!base) return null;
  const pct = (a, b) => (b ? (a / b - 1) * 100 : 0);
  return {
    pupil: pct(raw.pupil, base.pupil),
    blush: pct(raw.blush, base.blush),
    particles: pct(raw.particles, base.particles),
    pulse: raw.pulse - base.pulse,
    resp: raw.resp - base.resp,
    latency: raw.latency - base.latency,
  };
}

export function generateReading({ subject, q, pressed = false, stress = 0, calib, rng, baseline }) {
  const R = subject.response;
  const V = subject.vitals;
  const neutral = q.theme === 'notr';
  const p = pressed ? Math.min(1, q.provocation * 1.35 + 0.15) : q.provocation;

  // 1) Gerçek uyarılma
  const themeG = R.themeGain?.[q.theme] ?? 1;
  const formG = R.formGain?.[q.form] ?? 1;
  let a = p * R.empathy * themeG * formG * Math.max(0, 1 + rng.gauss(0, R.noise));
  if (pressed) a *= R.pressGain ?? 1.1;
  a = clamp(a, 0, 1.4);

  const truth = {
    pupil: V.pupil * (1 + a * 0.28) + rng.gauss(0, 0.025),
    blush: V.blush * (1 + a * 0.4 * (R.blushCoupling ?? 1)) + rng.gauss(0, 0.2),
    pulse: V.pulse + a * 14 + stress * (R.stressPulse ?? 0.1) + rng.gauss(0, 1.1),
    resp: V.resp + a * 5 + stress * (R.stressResp ?? 0.03) + rng.gauss(0, 0.35),
    latency: neutral
      ? V.latency + rng.gauss(0, 0.12)
      : R.latency.base + p * R.latency.perProvocation + rng.gauss(0, R.latency.jitter),
    particles: V.particles * (1 + (R.particleCoupling ?? 0) * a * 0.25 + rng.gauss(0, (R.particleNoise ?? 5) / 100)),
  };
  truth.latency = Math.max(0.35, truth.latency);
  const onset = neutral ? rng.range(0.3, 0.6) : rng.range(R.onset[0], R.onset[1]) * (pressed ? 0.92 : 1);

  // 2) Makine katmanı
  const e = calib ? calib.error() : 0;
  const raw = {
    pupil: truth.pupil * (1 + e * 0.01) + rng.gauss(0, 0.012),
    blush: truth.blush * (1 + e * 0.013) + rng.gauss(0, 0.1),
    pulse: truth.pulse + e * 0.35,
    resp: truth.resp + rng.gauss(0, 0.15),
    latency: truth.latency,
    particles: truth.particles + rng.gauss(0, 2),
  };

  let anomaly = null;
  const rate = subject.machine?.anomalyRate ?? 0;
  if (!neutral && rng.chance(rate)) {
    anomaly = rng.pick(['pupil', 'blush', 'pulse', 'particles']);
    const s = rng.chance(0.5) ? 1 : -1;
    if (anomaly === 'pupil') raw.pupil *= 1 + s * rng.range(0.12, 0.24);
    if (anomaly === 'blush') raw.blush *= 1 + s * rng.range(0.2, 0.35);
    if (anomaly === 'pulse') raw.pulse += s * rng.range(10, 18);
    if (anomaly === 'particles') raw.particles *= 1 + s * rng.range(0.25, 0.45);
  }

  return {
    qid: q.id, card: q.card, theme: q.theme, form: q.form, pair: q.pair ?? null,
    provocation: p, pressed, raw, onset, anomaly,
    dev: deviation(raw, baseline),
    hidden: { arousal: a, error: e },
  };
}
