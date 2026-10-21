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
`machine-grisiyah.png` / `machine-krem.png` karşılaştırma içindir, oyuna geçmez; birini kullanmak
istersen `machine.png` adıyla kaydet.

Geri almak için dosyayı `assets/images/...` klasöründen sil; oyun çizime döner.

Bu klasörü yeniden üretmek için geliştirme sunucusu açıkken `http://localhost:5173/?disa-aktar`
adresini aç. **Var olan dosyalara dokunmaz**, yalnızca eksikleri yazar. Hepsinin üzerine yazmak
istersen: `http://localhost:5173/?disa-aktar&uzerine` (önce düzenlediklerini yedekle).

## Kurallar

- **Boyut oranını koru.** Piksel boyutu büyüyebilir (ör. 2× daha), oran aynı kalmalı.
- **Saydam alanlar saydam kalmalı** (makine, sandalyeler, klasör, küllük, kaset, kalemlik, iris).
- Renk profili **sRGB**.
- Makinede rehberdeki **mor alanlar** oyunda canlı parçalarla örtülür:
  ekranlar, LED çubuğu ve CRT'nin sağındaki üç tuş oyunda canlı katmanla kaplanır (oraya çizdiklerin görünmez);
  **körük alanı saydam** kalsın (körük gövdenin arkasında ayrı katman). Tuşların görünüşü için `machine-key*.png`.
  Kasayı, çerçeveleri, üst kapakları, eğimleri, yazıları serbestçe değiştirebilirsin.
- Masa (`desk`) tepeden düz bir dokudur; perspektifi oyun verir. Üst kenar = masanın uzak ucu.

## Dosyalar

| Dosya | Boyut | Saydam | Oyundaki yeri |
|---|---|---|---|
| `oda/machine.png` | 4096×2560 | evet | Masadaki test ünitesinin ön yüzü |
| `oda/machine-grisiyah.png`, `machine-krem.png` | 4096×2560 | evet | Aynı ön yüzün renk şeması sürümleri (karşılaştırma için); hangisini kullanacaksan `machine.png` adıyla kaydet |
| `oda/machine-key.png`, `machine-key-lit.png` | 256×256 | hayır | CRT'nin sağındaki tuşlar (biri amber yanar) |
| `oda/wall.png` | 4096×1760 | hayır | Arka duvar (14×6 m) |
| `oda/window.png` | 2048×224 | hayır | Parlak pencere şeridi |
| `oda/mirror.png` | 1024×768 | hayır | Sol duvardaki ayna cam |
| `oda/desk.png` | 2048×2048 | hayır | Masa üstü (4×3 m; dosya kare, oyunda 4:3'e gerilir) |
| `oda/desk-edge.png` | 1024×64 | hayır | Masanın uzak kenar kalınlığı |
| `oda/folder.png` | 1024×1320 | evet | Sol arkadaki klasör (tepeden) |
| `oda/report.png` | 1024×1400 | hayır | Sol öndeki kâğıt (tepeden) |
| `oda/ashtray.png` | 512×256 | evet | Sağ öndeki küllük (yandan); sigara ucu sağda, duman oradan çıkar |
| `oda/cassette.png` | 1024×400 | evet | Sağ arkadaki kaset çalar (önden) |
| `oda/pencup.png` | 256×384 | evet | Kalemlik |
| `oda/chair-left.png`, `chair-right.png` | 768×2048 | evet | Çerçeve kenarlarındaki sandalyeler |
| `goz/iris.png` | 1024×1024 | evet | CRT'deki gözün irisi (merkezde, daire). Göz bebeği oyunda üstüne çizilir. |
| `goz/sclera.png` | 1440×1120 | hayır | Göz akı ve damarlar (göz kapakları oyunda üstüne çizilir) |

Not: Tavan pervanesi, göz kapakları, ekran içerikleri, yelpaze körük ve LED'ler her karede kodla çizilir;
bunlar dosyayla değiştirilmez.
