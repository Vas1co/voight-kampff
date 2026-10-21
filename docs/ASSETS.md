# Asset listesi

Şu an tüm görseller ve sesler **prosedürel yer tutucudur** (kodla üretilir). Aşağıdaki dosyalardan
birini ilgili klasöre koyduğunda oyun onu otomatik kullanır; kod değişikliği gerekmez.
Geliştirme sunucusu açıksa sayfa kendiliğinden yenilenir.

Tespit `src/core/assets.js` içindeki `import.meta.glob('/assets/**')` ile yapılır.
Aynı ad için öncelik: görselde `webp → png → avif → jpg`, videoda `webm → mp4 → mov`,
seste `ogg → opus → mp3 → m4a → wav`.

> **Telif:** Film karelerini (klasördeki `v*.JPG` dosyaları) asset olarak kullanma; yalnızca stil
> referansıdır ve `.gitignore` ile depodan dışlanmıştır. Tüm görseller özgün olmalı.

---

## 1. Oda katmanları — `assets/images/room/`

Katmanlar Three.js düzlemlerine dokudur. Saydam olanlar **PNG (RGBA)** ya da **WebP (alfa)** olmalı.
Boyutlar önerilen en az değerlerdir; oran korunmalı. Renk uzayı sRGB.

| Dosya | Boyut (px) | Alfa | Düzlem (m) | Not |
|---|---|---|---|---|
| `wall` | 4096 × 1760 | hayır | 14 × 6 | Arka duvar. Pencere ayrı katman. |
| `window` | 2048 × 224 | hayır | 6.2 × 0.63 | Aşırı parlak pencere şeridi (bloom yakalar). 4 eşit bölme, kirişler koyu. |
| `mirror` | 1024 × 768 | hayır | 2.4 × 1.5 | Sol arka duvardaki tek yönlü ayna cam. |
| `desk` | 2048 × 1536 | hayır | 4 × 3 | Masa üstü, **tepeden** düz doku. Uzak kenar görüntünün üstünde. |
| `desk-edge` | 1024 × 64 | hayır | 4 × 0.06 | Masanın uzak kenar kalınlığı. |
| `folder` | 1024 × 1320 | evet | 0.30 × 0.39 | Kapalı vaka klasörü, tepeden. |
| `report` | 1024 × 1400 | hayır | 0.25 × 0.34 | Masadaki rapor kâğıdı, tepeden. |
| `ashtray` | 512 × 256 | evet | 0.20 × 0.10 | Küllük + sigara, yandan. Sigara ucu sağda (duman çıkışı ~ x %80, y %45). |
| `cassette` | 1024 × 400 | evet | 0.27 × 0.105 | Masadaki kaset çalar, önden. |
| `pencup` | 256 × 384 | evet | 0.09 × 0.135 | Kalemlik. |
| `chair-left`, `chair-right` | 768 × 2048 | evet | 0.62 × 1.65 | Ön plandaki boş yüksek sırtlı sandalyeler. |
| `machine` | 4096 × 2560 | **evet** | 1.0 × 0.625 | Makine ön yüzü (90'lar krem plastik kasalar). **Ekran, LED ve körük alanları boş/koyu bırakılmalı**; dinamik katmanlar üstüne oturur. |

| `machine-key`, `machine-key-lit` | 256 × 256 | hayır | — | CRT'nin sağındaki tuşlar (normal / amber yanan). |

> Tavan pervanesi ilk prototipteki çizimle her karede kodla çizilir (`src/scene/fan.js`); dosyayla değiştirilmez.

> **Düzenlemeye başlamak için:** geliştirme sunucusu açıkken `http://localhost:5173/?disa-aktar`
> adresi tüm prosedürel dokuları 2× çözünürlükte `tasarim/` klasörüne yazar (makine için rehber
> katmanı dahil). Akış: `tasarim/OKU.md`.

### Göz — `assets/images/eye/`
| Dosya | Boyut (px) | Alfa | Not |
|---|---|---|---|
| `iris` | 1024 × 1024 | **evet** | İris, merkezde daire. Göz bebeği, yansımalar ve kapaklar oyunda üstüne çizilir. |
| `sclera` | 1440 × 1120 | hayır | Göz akı ve damarlar; göz bakışla birlikte hafifçe kayar. |

### Makine yerleşimi (2048 × 1280 ölçeği, 4096'lık dosyada 2× ile çarp)
| Alan | x | y | g | y |
|---|---|---|---|---|
| Ana CRT (4:3) | 744 | 472 | 560 | 420 |
| Sol ekran (solunum/nabız) | 104 | 612 | 488 | 372 |
| Sağ ekran (tepki analizi) | 1456 | 612 | 488 | 372 |
| LED çubuğu | 772 | 384 | 504 | 30 |
| Körük (yukarıda, saydam) | 864 | 36 | 320 | 300 |

Koordinatların kaynağı: `src/machine/layout.js`.

---

## 2. Göz videoları — `assets/video/eyes/`

CRT'deki göz oyuncunun gözüdür. CRT shader'ı üstüne tarama çizgisi, bombe ve fosfor ekler; video temiz olmalı.

| Dosya | Biçim | Çözünürlük | Süre | İçerik |
|---|---|---|---|---|
| `player-loop` | WebM (VP9) veya MP4 (H.264), sessiz | 1280 × 960 (4:3) | 6–12 sn, **kusursuz döngü** | Makro göz, normal bebek çapı, hafif sakkad ve 1–2 kırpma. |
| `player-dilate` | aynı | 1280 × 960 | 2–4 sn | Bebeğin normal çaptan ~%30 genişlemesi. Son karesi döngünün ilk karesine yakın olmalı. |

Video varsa prosedürel göz devre dışı kalır; genişleme klibi her göz bebeği tepkisinde,
tepki büyüklüğüne göre 0.5×–2× hızda oynatılır.

---

## 3. Ses — `assets/audio/`

44.1 veya 48 kHz, tercihen **OGG Vorbis** (Safari için aynı adla MP3 de konabilir; OGG önceliklidir).

### Efektler — `assets/audio/sfx/`
Dosya yoksa sentezlenmiş sürüm çalar.

| Ad | Kullanım |
|---|---|
| `room-tone` | Oda uğultusu (döngü, 20–60 sn, kusursuz) |
| `relay`, `relays` | Röle tıkırtısı (tek / dizi) |
| `switchOn`, `switchOff` | Sorgucunun makineyi açıp kapaması |
| `crtOn`, `crtOff` | CRT açılış/kapanış |
| `static`, `glitch` | Sinyal parazitleri |
| `chirp` | Soru sorulduğunda kısa sinyal |
| `dialTick` | Cevap süresi akarken tik (son 4 saniyede yüksek) |
| `bellows` | Körük nefesi (~1.4 sn çekiş) |
| `heartbeat` | Tek kalp atışı (ölçüm sırasında nabza göre tekrarlanır) |
| `cassetteIn` | Kayıt başlarken kaset mekanizması |
| `warm`, `buzz` | Cevaptan sonraki makine tonu |
| `analyze` | Sorgu sonu analiz |
| `stamp`, `paper` | Rapor ve damga |
| `anomaly` | Açıklanamayan okuma |

### Müzik — `assets/audio/music/`
| Ad | Kullanım |
|---|---|
| `ambient` | Varsa sentez akorların yerine düşük seviyede döngü çalar (kusursuz döngü, 2–4 dk). |

### Seslendirme — `assets/audio/voice/`
Altyazı satırının metin anahtarı, noktalar tireye çevrilerek dosya adı olur.
Çok satırlı sahnelerde satır sırası `-0`, `-1` ekiyle verilir.

| Örnek dosya | Satır |
|---|---|
| `lines-sit.ogg` | Sorgucu: "Otur lütfen." |
| `questions-q1-lines-0.ogg` … `questions-q1-lines-2.ogg` | 1. sorunun sahne satırları |
| `questions-q1-prompt.ogg` | 1. sorunun son cümlesi |
| `lines-next-2.ogg` | Geçiş satırlarının 3.'sü |
| `lines-verdict-human.ogg` | Sorgucunun karar satırı |

Seslendirme varsa altyazı süresi kayda göre uzar; altyazı her zaman görünür kalır.

---

## 4. Fontlar — `assets/fonts/` (yerel, mevcut)

| Aile | Kullanım | Lisans |
|---|---|---|
| IBM Plex Mono (`Plex Mono`) | Göstergeler, HUD, makine etiketleri | SIL OFL 1.1 |
| Jost | İnce, geniş aralıklı başlıklar | SIL OFL 1.1 |
| Courier Prime | Daktilo: rapor | SIL OFL 1.1 |
| Source Sans 3 | Altyazılar, cevaplar | SIL OFL 1.1 |

Latin ve Latin-ext alt kümeleri (Türkçe karakterler dahil). Tanımlar: `src/styles/fonts.css`.
