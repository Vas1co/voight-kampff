# Dokuları Photoshop'ta düzenleme

Bu klasördeki PNG'ler oyundaki prosedürel çizimlerin **2× çözünürlüklü** kopyalarıdır.
Dosya adları oyunun beklediği adlarla aynıdır.

## Akış

1. `tasarim/` içinden bir dosyayı Photoshop'ta aç (ör. `oda/machine.png`).
2. Düzenle. Rehber gerekiyorsa `_rehber/machine-rehber.png`'yi en üste katman olarak sürükle,
   işin bitince gizle/sil.
3. **Aynı adla** oyunun klasörüne PNG olarak kaydet:
   - `oda/*.png` → `assets/images/room/`
   - `goz/*.png` → `assets/images/eye/`

   Photoshop: *Dosya → Dışa Aktar → Farklı Dışa Aktar… → PNG*, **Saydamlık açık**, boyut %100.
4. Oyunu tarayıcıda yenile. Dosya varsa oyun çizimi bırakıp senin dosyanı kullanır.

Geri almak için dosyayı `assets/images/...` klasöründen sil; oyun çizime döner.

Bu klasörü yeniden üretmek için geliştirme sunucusu açıkken `http://localhost:5173/?disa-aktar`
adresini aç. **Var olan dosyalara dokunmaz**, yalnızca eksikleri yazar. Hepsinin üzerine yazmak
istersen: `http://localhost:5173/?disa-aktar&uzerine` (önce düzenlediklerini yedekle).

## Kurallar

- **Boyut oranını koru.** Piksel boyutu büyüyebilir (ör. 2× daha), oran aynı kalmalı.
- **Saydam alanlar saydam kalmalı** (makine, sandalyeler, klasör, küllük, kaset, kalemlik, iris).
- Renk profili **sRGB**.
- Makinede rehberdeki **mor alanlar** oyunda canlı parçalarla örtülür:
  ekranlar ve LED çubuğu koyu kalsın; **körük alanı saydam** kalsın (körük gövdenin arkasında ayrı katman).
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
