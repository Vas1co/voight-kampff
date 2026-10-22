// Tavan pervanesi (3B): beş eğimli kanat, pirinç motor gövdesi, tavan çubuğu.
// Floresan armatürün hemen altında ve önünde durur; yavaş döner. Kanatların
// ışıkta bıraktığı gölge shader'da hesaplanır (fx/shaders/common.js → fanShadow),
// bu sınıf yalnızca görünen gövdeyi ve dönüş açısını yönetir.
import * as THREE from 'three';

const TAU = Math.PI * 2;

// Kürek biçimli kanat (göbekten uca doğru genişler, ucu yuvarlak).
function bladeShape(r0, r1, w0, w1) {
  const s = new THREE.Shape();
  s.moveTo(r0, -w0 / 2);
  s.lineTo(r1 - w1 * 0.5, -w1 / 2);
  s.quadraticCurveTo(r1 + w1 * 0.05, -w1 / 2, r1, 0);
  s.quadraticCurveTo(r1 + w1 * 0.05, w1 / 2, r1 - w1 * 0.5, w1 / 2);
  s.lineTo(r0, w0 / 2);
  s.closePath();
  return s;
}

export class CeilingFan {
  constructor({ ceilY = 3.2, hubY = 2.72, radius = 0.78, blades = 5 } = {}) {
    this.group = new THREE.Group();
    this.rotor = new THREE.Group();
    this.group.add(this.rotor);
    this.angle = 0;

    const brass = new THREE.MeshStandardMaterial({ color: '#6b5232', metalness: 0.7, roughness: 0.42 });
    const dark = new THREE.MeshStandardMaterial({ color: '#16130f', metalness: 0.4, roughness: 0.6 });
    const wood = new THREE.MeshStandardMaterial({ color: '#2a221b', metalness: 0.05, roughness: 0.75, side: THREE.DoubleSide });

    // tavan kapağı ve çubuk
    const canopy = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.06, 24), brass);
    canopy.position.y = ceilY - 0.03;
    const rodLen = ceilY - 0.06 - (hubY + 0.11);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, rodLen, 12), dark);
    rod.position.y = hubY + 0.11 + rodLen / 2;
    this.group.add(canopy, rod);

    // motor gövdesi (dönen kısım)
    const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.12, 32), brass);
    housing.position.y = hubY + 0.06;
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.172, 0.172, 0.025, 32), dark);
    band.position.y = hubY + 0.005;
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.05, 0.05, 24), brass);
    cap.position.y = hubY - 0.03;
    this.rotor.add(housing, band, cap);

    // kanat kolları ve kanatlar (hafif eğimli)
    const geo = new THREE.ShapeGeometry(bladeShape(0.2, radius, 0.09, 0.16), 8);
    const arm = new THREE.BoxGeometry(0.14, 0.012, 0.03);
    for (let i = 0; i < blades; i++) {
      const pivot = new THREE.Group();
      pivot.rotation.y = (i * TAU) / blades;
      const b = new THREE.Mesh(geo, wood);
      b.rotation.x = -Math.PI / 2 + 0.16;     // kanat eğimi
      b.position.y = hubY - 0.005;
      const a = new THREE.Mesh(arm, dark);
      a.position.set(0.19, hubY, 0);
      pivot.add(b, a);
      this.rotor.add(pivot);
    }

    // yalnızca pervaneyi aydınlatan ışık (diğer malzemeler ışıksız shader)
    this.group.add(new THREE.AmbientLight('#8fa6a2', 0.35));
    this.light = new THREE.PointLight('#dbe9e4', 1.4, 0, 2);
    this.group.add(this.light);
  }

  place(x, z, lampPos) {
    this.group.position.set(x, 0, z);
    // armatür pervanenin üstünde: kanatların üst yüzü aydınlanır, alttan siluet görünür
    this.light.position.set(lampPos.x - x, lampPos.y - 0.02, lampPos.z - z);
  }

  update(dt, speed) {
    this.angle += speed * dt;
    this.rotor.rotation.y = this.angle;
  }
}
