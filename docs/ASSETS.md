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

| Ad | Boyut (px) | Alfa | Yeri |
|---|---|---|---|
| `lamp` | 2400×288 | hayır | Tavandaki floresan armatür (alttan görünüş). Işığı oyun hesaplar; dosya yalnızca görünüş |
| `wall` | 2880×1280 | **evet** | Arka duvar (7.2×3.2 m). Ortadaki gözlem camının yeri **saydam** kalmalı (x 680–2200, y 260–900) |
| `side-wall` | 2720×1280 | hayır | Sol ve sağ yan duvarlar |
| `ceiling` | 2048×2048 | hayır | Tavan |
| `behind-room` | 2400×1280 | hayır | Gözlem camının arkasındaki loş bitişik oda |
| `chair-behind` | 640×1160 | evet | Camın arkasındaki boş sorgu sandalyesi (silüet) |
| `glass` | 1520×640 | evet (yarı) | Gözlem camı: yansıma çizgileri, kir; büyük ölçüde saydam |
| `door` | 760×1720 | hayır | Sol: metal kapı, dar dikey pencere, "VK TEST ODASI 03" |
| `access-panel` | 256×384 | evet | Kapının sağındaki küçük erişim paneli (yeşil gösterge ışığı oyunda) |
| `cabinet` | 640×1080 | evet | Sağ: metal dosya dolabı |
| `vent` | 480×280 | evet | Sağ: havalandırma ızgarası |
| `sign` | 660×456 | evet | Sağ: soluk prosedür tabelası |
| `camera` | 660×456 | evet | Sağ üst köşe: güvenlik kamerası, aşağı ve masaya bakar (kırmızı kayıt ışığı oyunda) |
| `desk` | 2048×1536 | hayır | Masa üstü, koyu metal (4×3 m, tepeden) |
| `desk-edge` | 1024×64 | hayır | Masanın uzak kenarı |
| `files` | 960×416 | evet | Masanın solu: test dosyaları ve manila klasör yığını (önden, hafif yukarıdan) |
| `sheet` | 600×800 | hayır | Masanın sol önü: basılı test verisi sayfası (tepeden) |
| `pen` | 680×48 | evet | Kâğıdın üstünde çapraz duran siyah kalem (tepeden) |
| `machine` | 4096×2560 | evet | Masanın ortası: test makinesinin ön yüzü |
| `machine-key` | 256×256 | hayır | CRT'nin sağındaki tuşlar; `machine-key-lit.png` amber yanan |
| `cassette` | 1024×400 | evet | Masanın sağı: kompakt kaset ses kaydedici (önden) |
| `mug` | 352×480 | evet | Masanın sağı: sade metal kupa |
| `ashtray` | 512×256 | evet | Masanın sağ önü: küçük yuvarlak küllük ve sigara (duman sigara ucundan çıkar) |
| `chair-front` | 1000×750 | evet | Ön plan: alt kenardaki sandalye sırtı silüeti (yalnızca geniş planda) |

Oda yerleşimi (konsept şemasına göre): tavanda floresan armatür; arka duvarda solda kapı + erişim paneli,
ortada gözlem camı (arkasında loş oda ve boş sandalye), sağda dolap, havalandırma, tabela; sağ üst köşede kamera.
Masada solda dosyalar, kâğıt ve kalem; ortada makine; sağda kaset, kupa, küllük. Ön planda sandalye sırtı.

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
