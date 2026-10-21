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
| `wall` | 4096 × 1760 | hayır | 14 × 6 | Arka duvar. Pencere ayrı katman; orta üst bölge pencerenin arkasında kalır. |
| `window` | 2048 × 224 | hayır | 6.2 × 0.63 | Aşırı parlak pencere şeridi (bloom yakalar). 4 eşit bölme, kirişler koyu. |
| `mirror` | 1024 × 768 | hayır | 2.4 × 1.5 | Sol arka duvardaki tek yönlü ayna cam. |
| `fan` | 1024 × 1024 | **evet** | 2.5 × 2.5 | Pervane, **üstten görünüş**, merkez = dönme ekseni. 5 kanat. |
| `fan-motor` | 256 × 256 | evet | 0.5 × 0.5 | Pervane gövdesi, yandan. |
| `subject-s1` | 1024 × 1536 | **evet** | 0.95 × 1.42 | Denek 1 silueti, sandalyede oturur, arkadan ışıklı. Baş üstü görüntünün üst %19'unda. Alt kısım masanın arkasında kalır. Diğer denekler: `subject-s2`, `subject-s3`… |
| `desk` | 2048 × 1536 | hayır | 4 × 3 | Masa üstü, **tepeden** düz doku. Uzak kenar görüntünün üstünde. |
| `desk-edge` | 1024 × 64 | hayır | 4 × 0.06 | Masanın uzak kenar kalınlığı. |
| `folder` | 1024 × 1320 | evet | 0.30 × 0.39 | Kapalı vaka klasörü, tepeden. Tıklanabilir. |
| `report` | 1024 × 1400 | hayır | 0.25 × 0.34 | Masadaki rapor kâğıdı, tepeden. Tıklanabilir. |
| `ashtray` | 512 × 256 | evet | 0.20 × 0.10 | Küllük + sigara, yandan. Sigara ucu sağda (dumanın çıktığı nokta ~ x %80, y %45). |
| `cassette` | 1024 × 400 | evet | 0.27 × 0.105 | Masadaki kaset çalar, önden. |
| `pencup` | 256 × 384 | evet | 0.09 × 0.135 | Kalemlik. |
| `chair-left`, `chair-right` | 768 × 2048 | evet | 0.62 × 1.65 | Ön plandaki boş yüksek sırtlı sandalyeler (çerçeve kenarları). |
| `machine` | 4096 × 2560 | **evet** | 1.0 × 0.625 | Makine ön yüzü. **Ekran, LED ve körük alanları boş/koyu bırakılmalı**; dinamik katmanlar üstüne oturur. Yerleşim piksel koordinatları `src/machine/layout.js` içinde (2048 × 1280 ölçeğinde verilmiştir, 2× ile çarp). |

### Makine yerleşimi (2048 × 1280 ölçeği)
| Alan | x | y | g | y |
|---|---|---|---|---|
| Ana CRT (4:3) | 744 | 472 | 560 | 420 |
| Sol ekran (solunum/nabız) | 104 | 612 | 488 | 372 |
| Sağ ekran (tepki analizi) | 1456 | 612 | 488 | 372 |
| LED çubuğu | 772 | 384 | 504 | 30 |
| Körük (yukarıda, saydam) | 864 | 36 | 320 | 300 |

---

## 2. Göz videoları — `assets/video/eyes/`

Her denek için iki klip. CRT shader'ı üstüne tarama çizgisi, bombe ve fosfor ekler; video temiz olmalı.

| Dosya | Biçim | Çözünürlük | Süre | İçerik |
|---|---|---|---|---|
| `<denek>-loop` (ör. `s1-loop.webm`) | WebM (VP9) veya MP4 (H.264), sessiz | 1280 × 960 (4:3) | 6–12 sn, **kusursuz döngü** | Makro göz, normal bebek çapı, hafif sakkad ve 1–2 kırpma. |
| `<denek>-dilate` (ör. `s1-dilate.webm`) | aynı | 1280 × 960 | 2–4 sn | Bebeğin normal çaptan ~%30 genişlemesi. Son karesi döngünün ilk karesine yakın olmalı. |

Video varsa prosedürel göz devre dışı kalır; genişleme klibi her göz bebeği tepkisinde,
tepki büyüklüğüne göre 0.5×–2× hızda oynatılır. Final bölümü için `player-loop`/`player-dilate`
(oyuncunun gözü) ileride eklenecek.

---

## 3. Ses — `assets/audio/`

44.1 veya 48 kHz, tercihen **OGG Vorbis** (Safari için MP3 de konabilir; aynı adla ikisi birden olabilir, OGG önceliklidir).

### Efektler — `assets/audio/sfx/`
Dosya yoksa sentezlenmiş sürüm çalar.

| Ad | Kullanım |
|---|---|
| `room-tone` | Oda uğultusu (döngü, 20–60 sn, kusursuz) |
| `relay`, `relays` | Röle tıkırtısı (tek / dizi) |
| `switchOn`, `switchOff` | TEST şalteri |
| `button`, `key` | Mekanik tuş |
| `dialTick` | Kalibrasyon kadranı tırtığı |
| `crtOn`, `crtOff` | CRT açılış/kapanış |
| `static`, `glitch` | Sinyal parazitleri |
| `chirp`, `sample` | Ölçüm başlangıcı |
| `bellows` | Körük nefesi (~1.4 sn çekiş) |
| `heartbeat` | Tek kalp atışı (ölçüm sırasında nabza göre tekrarlanır) |
| `cassetteIn`, `cassetteStop` | Kaset mekanizması |
| `typeKey`, `typeLine` | Daktilo (rapora satır yazılırken) |
| `stamp` | Rapor damgası |
| `paper` | Kâğıt/klasör |
| `warn`, `anomaly`, `alarm` | Uyarı sesleri |
| `impact`, `chair` | Saldırı anı |

### Müzik — `assets/audio/music/`
| Ad | Kullanım |
|---|---|
| `ambient` | Varsa sentez akorların yerine düşük seviyede döngü çalar (kusursuz döngü, 2–4 dk). |

### Seslendirme — `assets/audio/voice/`
Altyazı satırının metin anahtarı, noktalar tireye çevrilerek dosya adı olur.
Çok satırlı sorularda satır sırası `-0`, `-1` ekiyle verilir.

| Örnek dosya | Satır |
|---|---|
| `lines-officer-sit.ogg` | Memur: "Otur lütfen." |
| `lines-tutorial-welcome.ogg` | Hoparlör (amir): karşılama |
| `questions-k01a-0.ogg`, `questions-k01a-1.ogg` | Kart sorusu k01a'nın iki satırı |
| `questions-b01.ogg` | Temel soru b01 (tek satır) |
| `subjects-s1-answers-k01a.ogg` | Denek 1'in k01a cevabı |
| `lines-officer-press-2.ogg` | Bastırma satırlarının 3.'sü |

Seslendirme varsa altyazı süresi kayda göre uzar; altyazı her zaman görünür kalır.

---

## 4. Fontlar — `assets/fonts/` (yerel, mevcut)

| Aile | Kullanım | Lisans |
|---|---|---|
| IBM Plex Mono (`Plex Mono`) | Göstergeler, HUD | SIL OFL 1.1 |
| Jost | İnce, geniş aralıklı başlıklar | SIL OFL 1.1 |
| Courier Prime | Daktilo: rapor, dosya, kartlar | SIL OFL 1.1 |
| Source Sans 3 | Altyazılar | SIL OFL 1.1 |

Latin ve Latin-ext alt kümeleri (Türkçe karakterler dahil). Tanımlar: `src/styles/fonts.css`.
