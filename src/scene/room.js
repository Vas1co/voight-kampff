// Sorgu odası. Kamera masaya karşıdan, göz hizasından bakar; oda simetrik.
//
//  TAVAN ── uzun floresan armatür
//  ARKA DUVAR ── sol: metal kapı + erişim paneli │ orta: gözlem camı (arkasında loş oda,
//               boş sandalye) │ sağ: dosya dolabı, havalandırma, tabela │ sağ üst köşe: kamera
//  MASA ── sol: dosya yığını, test kâğıdı + kalem │ orta: test makinesi (stage.js)
//          │ sağ: kaset kaydedici, metal kupa, küllük (aralarında boşluk)
//  ÖN PLAN ── sandalye sırtı silüeti
//
// Her katmanın dokusu assets/images/room/<ad>.png ile değiştirilebilir.
import * as THREE from 'three';
import { textureOr } from '../core/assets.js';
import { litMaterial, fogMaterial, glowMaterial, roomUniforms } from '../fx/materials.js';
import { lightUniforms } from '../fx/shaders/common.js';
import * as P from './procedural.js';
import { Dust, Smoke } from './particles.js';

export const DESK_Y = 0.76;
const BACK_Z = -4.2;
const CEIL_Y = 3.2;

function plane(w, h, mat) { return new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); }
function flat(mesh) { mesh.rotation.x = -Math.PI / 2; return mesh; }
const tex = (name, painter) => textureOr('images/room', name, painter);

export class Room {
  constructor({ quality = 'high' } = {}) {
    this.group = new THREE.Group();
    this.quality = quality;
    this.reduce = false;
    this.flickT = 4;
    this.flick = 1;
    const add = (m, x = 0, y = 0, z = 0) => { m.position.set(x, y, z); this.group.add(m); return m; };
    // dikey katman: alt kenarı verilen yükseklikte duran düzlem
    const stand = (name, painter, w, h, x, bottom, z, opts = {}) => {
      const m = add(plane(w, h, litMaterial(tex(name, painter), { alphaTest: 0.02, ...opts })), x, bottom + h / 2, z);
      m.name = name; // yerleşim rehberinde etiket
      return m;
    };
    const named = (m, name) => { m.name = name; return m; };

    // --- oda kabuğu
    const W = 7.2, H = CEIL_Y;
    named(add(plane(W, H, litMaterial(tex('wall', P.paintWall), { ambient: 0.55, alphaTest: 0.5 })), 0, H / 2, BACK_Z), 'wall')
      .userData.labelAt = new THREE.Vector3(-1.2, 2.85, BACK_Z); // etiket yeri (yerleşim rehberi)
    for (const s of [-1, 1]) {
      const side = add(plane(7, H, litMaterial(tex('side-wall', P.paintSideWall), { ambient: 0.22, transparent: false })), s * W / 2, H / 2, BACK_Z + 3.5);
      side.rotation.y = -s * Math.PI / 2;
    }
    const ceil = add(plane(W, 7, litMaterial(tex('ceiling', P.paintCeiling), { ambient: 0.2, lamp: 0.8, transparent: false })), 0, H, BACK_Z + 3.5);
    ceil.rotation.x = Math.PI / 2;
    add(flat(plane(W, 9, new THREE.MeshBasicMaterial({ color: 0x040707 }))), 0, 0, -2);

    // --- gözlem camının arkası: loş bitişik oda ve boş sandalye
    const behindZ = -6.4;
    named(add(plane(6, H, litMaterial(tex('behind-room', P.paintBehindRoom), { ambient: 1.6, lamp: 0.1, transparent: false })), 0, H / 2, behindZ), 'behind-room');
    for (const s of [-1, 1]) {
      const sw = add(plane(2.2, H, new THREE.MeshBasicMaterial({ color: 0x050909 })), s * 3, H / 2, (BACK_Z + behindZ) / 2);
      sw.rotation.y = -s * Math.PI / 2;
    }
    add(flat(plane(6, 2.2, new THREE.MeshBasicMaterial({ color: 0x030505 }))), 0, 0.001, (BACK_Z + behindZ) / 2);
    stand('chair-behind', P.paintEmptyChair, 0.8, 1.45, 0, 0, -5.7, { ambient: 1.0, lamp: 0.1 });
    // cam: hafif yansımalar
    named(add(plane(3.8, 1.6, new THREE.MeshBasicMaterial({ map: tex('glass', P.paintGlass), transparent: true, depthWrite: false })), 0, 1.75, BACK_Z + 0.01), 'glass');

    // --- sol duvar: metal kapı ve erişim paneli (yeşil gösterge)
    stand('door', P.paintDoor, 0.95, 2.15, -2.85, 0, BACK_Z + 0.02, { ambient: 0.55, transparent: false });
    stand('access-panel', P.paintAccessPanel, 0.16, 0.24, -2.2, 1.13, BACK_Z + 0.02, { ambient: 0.35 });
    this.panelLed = add(plane(0.05, 0.05, glowMaterial('#5dff9c', 0.9)), -2.2, 1.3, BACK_Z + 0.03);

    // --- sağ duvar: dosya dolabı, havalandırma, tabela
    stand('cabinet', P.paintCabinet, 0.8, 1.35, 2.85, 0, BACK_Z + 0.2, { ambient: 0.55 });
    stand('vent', P.paintVent, 0.6, 0.35, 2.85, 1.575, BACK_Z + 0.02, { ambient: 0.3 });
    stand('sign', P.paintSign, 0.55, 0.38, 2.75, 2.11, BACK_Z + 0.02, { ambient: 0.32, lamp: 0.8 });

    // --- sağ üst köşe: güvenlik kamerası (kırmızı kayıt ışığı)
    stand('camera', P.paintWallCamera, 0.72, 0.5, 2.55, 2.5, -3.9, { ambient: 0.5 });
    this.camLed = add(plane(0.06, 0.06, glowMaterial('#ff3a2a', 0.8)), 2.73, 2.82, -3.89);

    // --- tavan: floresan armatür (aşağı bakar)
    const lp = lightUniforms.uLampPos.value;
    this.lampMat = new THREE.MeshBasicMaterial({ map: tex('lamp', P.paintLamp), color: new THREE.Color(1.5, 1.52, 1.48) });
    const lampMesh = add(plane(3.0, 0.36, this.lampMat), lp.x, CEIL_Y - 0.03, lp.z);
    lampMesh.rotation.x = Math.PI / 2;
    lampMesh.name = 'lamp';

    // --- havada ince duman perdesi (çok hafif)
    this.volumes = [];
    const fogDefs = quality === 'high' ? [[-3.8, 0.16, 0.45], [-2.6, 0.12, 0.55], [-1.3, 0.08, 0.65]] : [[-3.2, 0.18, 0.5], [-1.4, 0.1, 0.65]];
    fogDefs.forEach(([z, d, sc], i) => {
      this.volumes.push(add(plane(7, 3.2, fogMaterial({ density: d, scale: sc, seed: i * 2.3, speed: 1 + i * 0.15 })), 0, 1.7, z));
    });

    // --- masa (koyu metal)
    named(add(flat(plane(4, 3, litMaterial(tex('desk', P.paintDesk), { ambient: 0.45, crt: 1.8, transparent: false }))), 0, DESK_Y, -0.1), 'desk')
      .userData.labelAt = new THREE.Vector3(-0.3, DESK_Y, 1.0);
    add(plane(4, 0.06, litMaterial(tex('desk-edge', P.paintDeskEdge), { ambient: 0.3, transparent: false })), 0, DESK_Y - 0.03, -1.6);

    // --- masanın solu: dosya yığını, test kâğıdı ve çapraz kalem
    stand('files', P.paintFiles, 0.6, 0.26, -1.18, DESK_Y, 0.02, { ambient: 0.38, crt: 1.2 });
    const sheet = add(flat(plane(0.3, 0.4, litMaterial(tex('sheet', P.paintSheet), { ambient: 0.4, crt: 1.4, transparent: false }))), -0.82, DESK_Y + 0.002, 0.82);
    sheet.rotation.z = 0.2;
    sheet.name = 'sheet';
    const pen = add(flat(plane(0.17, 0.012, litMaterial(tex('pen', P.paintPen), { ambient: 0.4, crt: 1.2, alphaTest: 0.1 }))), -0.8, DESK_Y + 0.005, 0.84);
    pen.rotation.z = -0.65;
    pen.name = 'pen';

    // --- masanın sağı: kaset kaydedici, metal kupa, küllük (aralarında boşluk)
    const CAS = new THREE.Vector3(0.98, DESK_Y + 0.0525, 0.08);
    stand('cassette', P.paintCassettePlayer, 0.27, 0.105, CAS.x, DESK_Y, CAS.z, { ambient: 0.4, crt: 1.4 });
    this.cassetteRec = add(plane(0.03, 0.03, glowMaterial('#ff3a2a', 0)), CAS.x - 0.135 + 0.27 * 0.68, CAS.y + 0.105 * (0.5 - 0.37), CAS.z + 0.003);
    stand('mug', P.paintMug, 0.11, 0.15, 1.2, DESK_Y, 0.45, { ambient: 0.55, crt: 1.0 });
    const ASH = new THREE.Vector3(0.9, DESK_Y + 0.048, 0.92);
    stand('ashtray', P.paintAshtray, 0.2, 0.1, ASH.x, DESK_Y - 0.002, ASH.z, { ambient: 0.4, crt: 1.2 });
    const tip = new THREE.Vector3(ASH.x + 0.2 * (206 / 256 - 0.5), ASH.y + 0.1 * (0.5 - 57 / 128), ASH.z + 0.002);
    this.ember = add(plane(0.05, 0.05, glowMaterial('#ff8a3a', 1.0)), tip.x, tip.y, tip.z + 0.003);
    this.smoke = new Smoke(tip, { max: quality === 'high' ? 70 : 35, rate: 5 });
    this.group.add(this.smoke.points);

    // --- ön plan: sandalye sırtı (alt kenarda)
    // yalnızca geniş planda görünür (yakın planlarda kameranın önüne girer)
    this.chairFront = stand('chair-front', P.paintChairFront, 0.72, 0.48, 0, 0.8, 1.75, { ambient: 0.25, lamp: 0.2, crt: 0.3 });

    this.dust = new Dust(quality === 'high' ? 200 : 100);
    this.group.add(this.dust.points);
  }

  update(dt, t, { recording = false } = {}) {
    const motion = this.reduce ? 0.35 : 1;
    roomUniforms.uTime.value = t;
    // yaşlı floresan: hafif dalgalanma ve ara sıra kısa titreme
    this.flickT -= dt;
    if (this.flickT <= 0 && !this.reduce) { this.flick = 0.55 + Math.random() * 0.3; this.flickT = Math.random() < 0.3 ? 0.06 : 5 + Math.random() * 12; }
    this.flick += (1 - this.flick) * Math.min(1, dt * 14);
    const hum = 0.985 + 0.015 * Math.sin(t * 2 * Math.PI * 0.7);
    lightUniforms.uLampI.value = this.flick * hum * 2.1;
    this.lampMat.color.setRGB(1.5, 1.52, 1.48).multiplyScalar(this.flick * hum);

    this.ember.material.uniforms.uI.value = 0.7 + 0.35 * Math.sin(t * 1.7) * Math.sin(t * 0.7 + 1);
    this.cassetteRec.material.uniforms.uI.value = recording ? 0.6 + 0.3 * Math.sin(t * 3) : 0;
    this.camLed.material.uniforms.uI.value = 0.45 + 0.4 * (Math.sin(t * 3.1) > 0 ? 1 : 0.2);
    this.smoke.update(dt, t, motion);
    this.dust.update(dt, t, motion);
  }
}
