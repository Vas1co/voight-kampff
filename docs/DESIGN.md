# Voight-Kampff — Tasarım Planı

Tarayıcıda çalışan, sinematik bir empati sorgusu. **Oyuncu denektir**: masaya oturur, karşıdaki
sorgucu sorular sorar, oyuncu cevaplar. Makine yalan ölçmez; empatik tepkiyi ölçer ve **hüküm vermez**,
yalnızca temel ölçüme göre **sapma** gösterir. Kararı makine değil, sorgucu verir.

> Test adı ("Voight-Kampff") yalnızca saygı göndermesidir ve tek bir yerden yönetilir:
> `data/strings.<dil>.json → brand.testName`. Oyun adı `brand.gameTitle` ("Voight-Kampff").

---

## 1. Teknik mimari

| Katman | Klasör | Sorumluluk |
|---|---|---|
| Çekirdek | `src/core/` | olay sistemi, durum makinesi, döngü, kayıt, metinler, asset manifesti, klavye, akış (`game.js`) |
| Sahne | `src/scene/` | Three.js sahnesi, oda katmanları, prototip pervanesi, kamera planları ve paralaks, duman, toz |
| Makine | `src/machine/` | krem plastik gövde, CRT (shader), göz, göstergeler, körük, LED çubuğu, canlı sinyaller |
| Test | `src/test/` | soru deposu, sorgu oturumu (`interview.js`), okuma üretimi, temel ölçüm, çapraz referans, kalibrasyon kayması |
| Arayüz | `src/ui/` | altyazı, cevap seçenekleri, sonuç raporu, ayarlar, giriş ekranı, HUD |
| Ses | `src/audio/` | Web Audio motoru, müzik, efektler, ortam, seslendirme |
| Efekt | `src/fx/` | shader'lar (CRT, film greni + kontrast, hüzme, sis) ve post-processing |

- Asset tespiti `import.meta.glob('/assets/**')` ile; dosya yoksa prosedürel yer tutucu. (Bkz. `docs/ASSETS.md`.)
- Tüm görünür metin `data/strings.tr.json`; `data/questions.json` yalnızca yapı ve puan taşır.

## 2. Veri modeli

### Soru (`data/questions.json`)
```jsonc
{ "id": "q1", "origin": "film" | "ozgun", "theme": "hayvan", "pair": "hayvan-aci", "provocation": 0.75,
  "options": [{ "id": "a", "score": 2 }, { "id": "b", "score": 1 }, { "id": "c", "score": 0 }, { "id": "d", "score": 0 }] }
```
- 7 soru: 5'i filmdeki sahnelerden esinlenir (kaplumbağa, cüzdan, kelebek koleksiyonu, arı, ziyafet),
  2'si özgündür (tilki, fotoğraf). Metinler özgün ifadeyle yazılmıştır, film diyaloğu çevirisi değildir.
- **İlk soru sabit (kaplumbağa)**, diğerleri ve cevap seçeneklerinin sırası her oyunda karışır.
- `score`: 2 empatik, 1 kaçamak, 0 soğuk. `pair`: çapraz referans çekirdeği.

### Denek (`data/subjects/player.json`)
Oyuncunun dinlenim değerleri (`vitals`), makine güvenilmezliği (`machine`) ve göz parametreleri (`eye`).

### Okuma
```jsonc
{ "qid": "q3", "score": 2, "rt": 2.41, "none": false, "onset": 0.42, "anomaly": null,
  "raw": { "pupil": 4.4, "blush": 31.2, "pulse": 84, "resp": 16.1, "latency": 2.41, "particles": 455 },
  "dev": { "pupil": +24.1, "blush": +32.5, "pulse": +12, ... } }
```

## 3. Durum makinesi

```
TITLE → INTRO (sorgucu oturtur, makineyi açar, kaydı başlatır)
      → BASELINE (sessiz temel ölçüm: körük çeker, dinlenim örnekleri)
      → QUESTION ×7 (sahne satırları → soru → cevap seçenekleri + süre → makine okur)
      → ANALYZE → VERDICT (sorgucunun kararı + damgalı rapor) → AGAIN → INTRO
```

## 4. Okumaların üretimi

1. **Uyarılma:** `a = (0.15 + puan × 0.42) × (0.6 + kışkırtma × 0.6) × (1 ± gürültü)`.
   Cevap yoksa `a ≈ 0.05`; 1 saniyeden kısa cevapta tepki düz kalır (`a × 0.55`).
2. **Kanallar:** göz bebeği `+a×30%`, kızarma `+a×40%`, nabız `+a×14`, solunum `+a×4`, parçacık `+a×18%`.
   Tepki süresi oyuncunun **gerçek** süresidir.
3. **Makine katmanı:** kalibrasyon kayması (göz bebeği/kızarma/nabıza yanlılık), gürültü, ara sıra anomali.
4. **Sapma:** `ölçülen − temel` (temel, sorgu başındaki sessiz ölçümde o anki kalibrasyonla alınır).

### Sorgucunun kararı (makinenin değil)
`etkin = toplam puan − 1.5 × (cevapsız + 1 sn altı) − 2 × (aynı çekirdekte 2 puan fark)`
14 üzerinden: ≥ %68 İNSAN, ≤ %36 REPLİKANT, arası BELİRSİZ. Rapor ham veriyi ve damgayı gösterir.

## 5. Sahne

Konsept şemasına göre, masaya karşıdan ve göz hizasından bakan simetrik oda:

- **Tavan:** tek, uzun, yaşlı floresan armatür. Işık modeli: tavandaki dikdörtgen alan ışığı
  (`src/fx/shaders/common.js` → `lamp()`); hüzme, renkli ışık ve güçlü bloom yok. Ara sıra titreme.
- **Arka duvar:** solda metal kapı + erişim paneli, ortada kalın çerçeveli gözlem camı (arkasında loş
  bitişik oda ve boş sandalye), sağda dosya dolabı, havalandırma ve prosedür tabelası; sağ üst köşede
  masaya bakan güvenlik kamerası (kırmızı kayıt ışığı).
- **Masa (koyu metal):** solda dosya yığını, test kâğıdı ve çapraz kalem; ortada test makinesi
  (%20 büyük, baskın); sağda kaset kaydedici, metal kupa ve küllük, aralarında boşluk.
- **Ön plan:** alt kenarda sandalye sırtı silüeti (yalnızca geniş planda).
- Planlar: `wide`, `machine`, `crt`. Sahne satırlarında geniş plan, soru ve cevapta göz yakın planı,
  okumalarda makine planı. Her planda yavaş içeri kayma; fare/jiroskop paralaksı.
- Her katman `tasarim/` üzerinden düzenlenebilir; yerleşim: `tasarim/_rehber/oda-yerlesim.png`.

## 6. CRT ekranı

Göz görüntüsü yeşil monokrom bir taramaya çevrilir ve üstüne arayüz çizilir (`src/machine/screen.js`).
Durumlar: **bekleme** (DENEK BEKLENİYOR), **tarama** (başlık, denek kimliği, soru no, nişangâh, halkalar,
tarama bandı, ilerleme, sıcaklık), **tamamlandı**, **veri** (cevabın ham sapmaları + duygusal tepki izi),
**hata** (kırmızı: cevapsız soruda göz takibi kayboldu, anomalide açıklanamayan okuma).
Akış: makine açılınca bekleme → temel ölçümde tarama → her soruda tarama → okuma bitince tamamlandı ve
~3 sn veri (ya da hata). Makine yine hüküm vermez; yalnızca ham değer gösterir.

