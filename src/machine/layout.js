// Makine ön yüzünün piksel düzeni (2048 × 1280 tuval = 1.0 × 0.625 m).
// Gövde dokusu ve üstüne yerleşen dinamik parçalar aynı koordinatları kullanır.
export const BODY = { W: 2048, H: 1280, worldW: 1.0 };
BODY.worldH = BODY.worldW * (BODY.H / BODY.W);

export const L = {
  left: { x: 104, y: 612, w: 488, h: 372 },
  right: { x: 1456, y: 612, w: 488, h: 372 },
  crt: { x: 700, y: 572, w: 580, h: 332 },   // yatay dikdörtgen (ekran tuvali 768 × 440)
  led: { x: 760, y: 484, w: 528, h: 30 },
  // yelpaze körük: sağda menteşe, plakalar sola doğru açılır (orta modülün üstünde)
  bellows: { x: 700, y: 100, w: 640, h: 350 },
  intake: { x: 881, y: 235 },
  keys: [{ x: 1344, y: 742 }, { x: 1344, y: 806 }, { x: 1344, y: 870 }],
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
