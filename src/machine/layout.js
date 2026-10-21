// Makine ön yüzünün piksel düzeni (2048 × 1280 tuval = 1.0 × 0.625 m).
// Gövde dokusu ve üstüne yerleşen dinamik parçalar aynı koordinatları kullanır.
export const BODY = { W: 2048, H: 1280, worldW: 1.0 };
BODY.worldH = BODY.worldW * (BODY.H / BODY.W);

export const L = {
  left: { x: 104, y: 612, w: 488, h: 372 },
  right: { x: 1456, y: 612, w: 488, h: 372 },
  crt: { x: 744, y: 472, w: 560, h: 420 },
  led: { x: 772, y: 384, w: 504, h: 30 },
  bellows: { x: 864, y: 36, w: 320, h: 300 },
  keys: [{ x: 1326, y: 760 }, { x: 1326, y: 830 }, { x: 1326, y: 900 }],
  keySize: { w: 52, h: 50 },
  alarm: { x: 128, y: 1046, w: 300, h: 34 },
  stressLamp: { x: 540, y: 1064 },
  recLamp: { x: 1846, y: 214 },
  calLamp: { x: 1510, y: 1064 },
};

// Tuval pikselinden makine-yerel dünya koordinatına (gövde düzleminin merkezi orijin).
export function toLocal(px, py) {
  return {
    x: (px / BODY.W - 0.5) * BODY.worldW,
    y: (0.5 - py / BODY.H) * BODY.worldH,
  };
}

export function rectLocal(r) {
  const c = toLocal(r.x + r.w / 2, r.y + r.h / 2);
  return { x: c.x, y: c.y, w: (r.w / BODY.W) * BODY.worldW, h: (r.h / BODY.H) * BODY.worldH };
}
