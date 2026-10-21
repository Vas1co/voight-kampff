// Canvas2D yardımcıları (prosedürel yer tutucu dokular için).
// Çizim ölçeği: dışa aktarımda dokular 2× çözünürlükte, aynı mantıksal koordinatlarla çizilir.
let SCALE = 1;
export function withScale(s, fn) {
  const prev = SCALE;
  SCALE = s;
  try { return fn(); } finally { SCALE = prev; }
}

export const mk = (w, h) => {
  const c = document.createElement('canvas');
  c.width = Math.round(w * SCALE); c.height = Math.round(h * SCALE);
  if (SCALE !== 1) c.getContext('2d').scale(SCALE, SCALE);
  return c;
};

export function rr(x, px, py, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  x.beginPath();
  x.moveTo(px + r, py);
  x.arcTo(px + w, py, px + w, py + h, r);
  x.arcTo(px + w, py + h, px, py + h, r);
  x.arcTo(px, py + h, px, py, r);
  x.arcTo(px, py, px + w, py, r);
  x.closePath();
}

export function lg(x, x0, y0, x1, y1, stops) {
  const g = x.createLinearGradient(x0, y0, x1, y1);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

export function rg(x, x0, y0, r0, x1, y1, r1, stops) {
  const g = x.createRadialGradient(x0, y0, r0, x1, y1, r1);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

// Tohumlu basit rastgele (dokular her açılışta aynı görünsün).
export function seeded(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Mevcut piksellere ince gren ekler (yalnızca opak/yarı opak alanlara).
export function grain(x, w, h, amount = 14, seed = 3) {
  const R = seeded(seed);
  // gerçek piksel boyutu (ölçekli çizimde mantıksal w/h'den büyük olabilir)
  const id = x.getImageData(0, 0, x.canvas.width, x.canvas.height), d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    if (!d[i + 3]) continue;
    const n = (R() - 0.5) * amount;
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
  }
  x.putImageData(id, 0, 0);
}

// Kir lekeleri: yumuşak, düşük opaklıkta daireler.
export function grime(x, w, h, count, color, maxR, alpha, seed = 5) {
  const R = seeded(seed);
  for (let i = 0; i < count; i++) {
    const px = R() * w, py = R() * h, r = maxR * (0.2 + R() * 0.8);
    const g = x.createRadialGradient(px, py, 0, px, py, r);
    g.addColorStop(0, color.replace('A', String(alpha * (0.3 + R() * 0.7))));
    g.addColorStop(1, color.replace('A', '0'));
    x.fillStyle = g;
    x.fillRect(px - r, py - r, r * 2, r * 2);
  }
}

// Kazınmış (gravürlü) etiket yazısı.
export function engrave(x, text, px, py, { size = 18, font = 'Plex Mono', spacing = 0.18, align = 'left', color = 'rgba(190,215,210,0.42)' } = {}) {
  x.save();
  x.font = `400 ${size}px "${font}", ui-monospace, monospace`;
  x.textAlign = align;
  x.textBaseline = 'middle';
  if ('letterSpacing' in x) x.letterSpacing = `${spacing * size}px`;
  x.fillStyle = 'rgba(0,0,0,0.55)';
  x.fillText(text, px + 1, py + 1.5);
  x.fillStyle = color;
  x.fillText(text, px, py);
  x.restore();
}
