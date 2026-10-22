// Makine ön yüzünün tuvali (2048 × 1280 = 1.0 × 0.625 m). Canlı parçaların
// yerleşimi (L) her kasanın kendi dosyasında durur (kasalar/*.js).
export const BODY = { W: 2048, H: 1280, worldW: 1.0 };
BODY.worldH = BODY.worldW * (BODY.H / BODY.W);

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
