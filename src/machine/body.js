// Makine gövdesi: kasanın biçimi, rengi ve canlı parçaların yerleşimi (L)
// kasalar/mevcut.js'te; ekranlar, LED çubuğu, körük, tuşlar ve lambalar bu
// yerleşime göre gövdenin üstüne oturur.
import { mk, rr } from '../scene/paint.js';
import { BODY } from './layout.js';
import mevcut from './kasalar/mevcut.js';
import { AMBER_LIT } from './tema.js';

export const KASA = mevcut;

export function paintBody(renk) {
  const c = mk(BODY.W, BODY.H), x = c.getContext('2d');
  KASA.paint(x, BODY.W, BODY.H, renk);
  return c;
}

// Ön paneldeki üç tuş (biri amber yanar).
export function paintKey(lit) {
  const c = mk(64, 64), x = c.getContext('2d');
  x.fillStyle = lit ? AMBER_LIT : KASA.key;
  rr(x, 2, 2, 60, 60, 8); x.fill();
  x.fillStyle = 'rgba(40,40,36,0.35)';
  x.fillRect(2, 48, 60, 14);
  x.fillStyle = 'rgba(255,255,255,0.5)';
  x.fillRect(5, 5, 54, 4);
  return c;
}
