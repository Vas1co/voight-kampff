# Dokuları Photoshop'ta düzenleme

Bu klasördeki PNG'ler oyundaki prosedürel çizimlerin **2× çözünürlüklü** kopyalarıdır.
Dosya adları oyunun beklediği adlarla aynıdır.

## Akış

1. Oyunu aç (`baslat.bat` ya da `npm run dev`). Sunucu açık kalsın.
2. `tasarim/` içinden bir dosyayı Photoshop'ta aç (ör. `oda/machine.png`), düzenle ve **aynı yere,
   aynı adla** kaydet (PNG, saydamlık açık). Rehber gerekiyorsa `_rehber/machine-rehber.png`'yi
   üste katman olarak sürükle, kaydetmeden önce gizle.
3. Kaydettiğin anda dosya oyuna kopyalanır (`oda/` → `assets/images/room/`, `goz/` → `assets/images/eye/`)
   ve tarayıcı kendiliğinden yenilenir. Sunucu kapalıyken kaydettiysen, bir sonraki açılışta uygulanır.

Yalnızca **senin değiştirdiğin** dosyalar oyuna geçer; dokunmadıkların kodla çizilmeye devam eder.

Geri almak için dosyayı `assets/images/...` klasöründen sil; oyun çizime döner.

Bu klasörü yeniden üretmek için geliştirme sunucusu açıkken `http://localhost:5173/?disa-aktar`
adresini aç. **Var olan dosyalara dokunmaz**, yalnızca eksikleri yazar. Hepsinin üzerine yazmak
istersen: `http://localhost:5173/?disa-aktar&uzerine` (önce düzenlediklerini yedekle).

## Kurallar

- **Boyut oranını koru.** Piksel boyutu büyüyebilir (ör. 2× daha), oran aynı kalmalı.
- **Saydam alanlar saydam kalmalı** (tabloda "evet" olanlar). Arka duvardaki gözlem camı boşluğu özellikle.
- Renk profili **sRGB**.
- Makinede rehberdeki **mor alanlar** oyunda canlı parçalarla örtülür:
  ekranlar, LED çubuğu ve CRT'nin sağındaki üç tuş oyunda canlı katmanla kaplanır (oraya çizdiklerin görünmez);
  **körük alanı saydam** kalsın (körük gövdenin arkasında ayrı katman). Tuşların görünüşü için `machine-key*.png`.
  Kasayı, çerçeveleri, üst kapakları, eğimleri, yazıları serbestçe değiştirebilirsin.
- Masa (`desk`) tepeden düz bir dokudur; perspektifi oyun verir. Üst kenar = masanın uzak ucu.

## Dosyalar

Her katmanın odada nerede durduğu: **`_rehber/oda-yerlesim.png`** (geniş plan, katman adları üstünde).
Makinenin canlı parçaları: `_rehber/machine-rehber.png`.

| Dosya | Boyut | Saydam | Odadaki yeri |
|---|---|---|---|
| `oda/lamp.png` | 2400×288 | hayır | Tavandaki floresan armatür (alttan görünüş). Işığı oyun hesaplar; dosya yalnızca görünüş |
| `oda/wall.png` | 2880×1280 | **evet** | Arka duvar (7.2×3.2 m). Ortadaki gözlem camının yeri **saydam** kalmalı (x 680–2200, y 260–900) |
| `oda/side-wall.png` | 2720×1280 | hayır | Sol ve sağ yan duvarlar |
| `oda/ceiling.png` | 2048×2048 | hayır | Tavan |
| `oda/behind-room.png` | 2400×1280 | hayır | Gözlem camının arkasındaki loş bitişik oda |
| `oda/chair-behind.png` | 640×1160 | evet | Camın arkasındaki boş sorgu sandalyesi (silüet) |
| `oda/glass.png` | 1520×640 | evet (yarı) | Gözlem camı: yansıma çizgileri, kir; büyük ölçüde saydam |
| `oda/door.png` | 760×1720 | hayır | Sol: metal kapı, dar dikey pencere, "VK TEST ODASI 03" |
| `oda/access-panel.png` | 256×384 | evet | Kapının sağındaki küçük erişim paneli (yeşil gösterge ışığı oyunda) |
| `oda/cabinet.png` | 640×1080 | evet | Sağ: metal dosya dolabı |
| `oda/vent.png` | 480×280 | evet | Sağ: havalandırma ızgarası |
| `oda/sign.png` | 660×456 | evet | Sağ: soluk prosedür tabelası |
| `oda/camera.png` | 660×456 | evet | Sağ üst köşe: güvenlik kamerası, aşağı ve masaya bakar (kırmızı kayıt ışığı oyunda) |
| `oda/desk.png` | 2048×1536 | hayır | Masa üstü, koyu metal (4×3 m, tepeden) |
| `oda/desk-edge.png` | 1024×64 | hayır | Masanın uzak kenarı |
| `oda/files.png` | 960×416 | evet | Masanın solu: test dosyaları ve manila klasör yığını (önden, hafif yukarıdan) |
| `oda/sheet.png` | 600×800 | hayır | Masanın sol önü: basılı test verisi sayfası (tepeden) |
| `oda/pen.png` | 680×48 | evet | Kâğıdın üstünde çapraz duran siyah kalem (tepeden) |
| `oda/machine.png` | 4096×2560 | evet | Masanın ortası: test makinesinin ön yüzü |
| `oda/machine-key.png` | 256×256 | hayır | CRT'nin sağındaki tuşlar; `machine-key-lit.png` amber yanan |
| `oda/cassette.png` | 1024×400 | evet | Masanın sağı: kompakt kaset ses kaydedici (önden) |
| `oda/mug.png` | 352×480 | evet | Masanın sağı: sade metal kupa |
| `oda/ashtray.png` | 512×256 | evet | Masanın sağ önü: küçük yuvarlak küllük ve sigara (duman sigara ucundan çıkar) |
| `oda/chair-front.png` | 1000×750 | evet | Ön plan: alt kenardaki sandalye sırtı silüeti (yalnızca geniş planda) |
| `goz/iris.png` | 1024×1024 | evet | CRT'deki gözün irisi (merkezde daire; göz bebeği oyunda çizilir) |
| `goz/sclera.png` | 1440×1120 | hayır | Göz akı ve damarlar |

Not: Göz kapakları, ekran içerikleri, yelpaze körük, LED'ler ve gösterge ışıkları her karede kodla çizilir;
bunlar dosyayla değiştirilmez.
