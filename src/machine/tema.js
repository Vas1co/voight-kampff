// Ekran ve kontrol ışığı renkleri. Seçili renk şeması (kasalar/mevcut.js) kendi ekran
// yeşilini (ink) ve amberini (amber) verebilir; vermezse varsayılan fosfor ve amber.
import { RENK } from './kasalar/mevcut.js';

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
const css = (c, a = 1) => (a >= 1 ? `rgb(${c})` : `rgba(${c},${a})`);
const WHITE = [255, 255, 255], BLACK = [0, 0, 0];

const own = !!RENK.ink;
const INK = hex(RENK.ink ?? '#6dffc9');
const HI = own ? mix(INK, WHITE, 0.35) : [160, 255, 220];
const MON = own ? mix(INK, WHITE, 0.15) : [141, 255, 207];

export const EKRAN = {
  ink: (a = 1) => css(INK, a),                                  // ana CRT yazı ve çizgileri
  hi: (a = 1) => css(HI, a),                                    // tarama bandının parlak çizgisi
  tint: own ? css(mix(INK, BLACK, 0.22)) : '#1fc796',           // göz görüntüsünü boyayan renk
  wash: own ? css(mix(INK, BLACK, 0.4)) : '#4f9f87',            // göz görüntüsünü karartan renk
  mon: (a = 1) => css(MON, a),                                  // sol monitör
};

export const AMBER = RENK.amber ?? '#ffb35a';
export const AMBER_LIT = RENK.amber ? css(mix(hex(RENK.amber), WHITE, 0.35)) : '#ffd08e';
