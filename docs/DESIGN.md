# SAPMA — Tasarım Planı

Tarayıcıda çalışan, sinematik bir empati sorgusu oyunu. Makine **yalan ölçmez**, empatik
tepkiyi ölçer ve **hüküm vermez**: yalnızca temel ölçüme göre **sapma** gösterir. Kararı oyuncu verir.

> Test adı ("Voight-Kampff") yalnızca saygı göndermesidir ve tek bir yerden yönetilir:
> `data/strings.tr.json → brand.testName`. Oyun adı `brand.gameTitle` ("SAPMA").
> Metinlerde `{test}` / `{game}` yer tutucularıyla kullanılır.

---

## 1. Teknik mimari

| Katman | Klasör | Sorumluluk |
|---|---|---|
| Çekirdek | `src/core/` | olay sistemi (`events`), durum makinesi (`fsm`), döngü (`loop`), kayıt (`save`), metinler (`strings`), asset manifesti (`assets`), giriş (`input`), akış yöneticisi (`game`) |
| Sahne | `src/scene/` | Three.js sahnesi, katmanlar, kamera planları ve paralaks, duman, ışık hüzmeleri, pervane, toz, CRT ışık sızması |
| Makine | `src/machine/` | CRT (shader), göz, göstergeler, körük, LED çubuğu, kontrol paneli (DOM) |
| Test | `src/test/` | temel ölçüm, soru deposu, çapraz referans, okuma üretimi, stres, kalibrasyon |
| Arayüz | `src/ui/` | altyazı, vaka dosyası, kâğıt rapor, ayarlar, üst bilgi, giriş ekranı |
| Ses | `src/audio/` | Web Audio motoru, müzik, efektler, ortam, seslendirme |
| Efekt | `src/fx/` | shader'lar (CRT, film greni/vinyet, hüzme, duman) ve post-processing zinciri |

- **Asset tespiti:** `import.meta.glob('/assets/**')` derleme/geliştirme anında var olan dosyaların
  listesini çıkarır. Bir dosya yoksa prosedürel yer tutucu kullanılır; dosya klasöre konduğunda
  Vite modülü yeniler ve oyun gerçek dosyayı kullanır. (Bkz. `docs/ASSETS.md`.)
- **Metinler:** tüm görünür metin `data/strings.tr.json` içindedir. Veri dosyaları (`questions.json`,
  `subjects/*.json`) yalnızca yapı ve sayısal parametre taşır; metne kimlikle (`id`) bağlanır.
- **Render:** tamamen ışıksız (unlit) düzlemler + özel shader'lar. Gerçek perspektif kamera,
  katmanlar farklı derinlikte durduğu için paralaks kendiliğinden oluşur.
  Post-processing: `RenderPass → UnrealBloom → OutputPass → Film (gren, vinyet, renk kayması, titreme)`.

---

## 2. Veri modeli

### Denek (`data/subjects/s1.json`)
```jsonc
{
  "id": "s1",
  "kind": "replicant" | "human",        // gizli gerçek; makine bunu asla göstermez
  "targetQuestions": 24,                 // sayaçtaki payda (SORU 07 / 24)
  "minQuestions": 12,                    // karar damgası bu sayıdan sonra açılır
  "cards": ["k01", ...],                 // masadaki soru kartları
  "baseline": ["b01", ...],              // nötr ısınma soruları
  "vitals":  { "resp": 14, "pulse": 68, "blush": 22, "pupil": 3.6, "latency": 0.9, "particles": 410 },
  "response": {
    "empathy": 0.25,                     // genel duygusal kazanç
    "themeGain": { "aile": 0.2, ... },   // tema bazlı ezme
    "formGain":  { "dogrudan": 0.7, "varsayim": 0.35, "dolayli": 0.15, "ani": 0.05 },
    "noise": 0.35,                       // aynı tema farklı biçimde sorulunca dağılma (tutarsızlık)
    "onset": [1.4, 2.4],                 // göz bebeği tepki gecikmesi (sn)
    "latency": { "base": 2.3, "perProvocation": 0.1, "jitter": 0.1 },
    "blushCoupling": 0.1,                // kılcal genişlemenin göz bebeğiyle bağı
    "particleCoupling": 0.0, "particleNoise": 14
  },
  "stress": { "volatility": 1.25, "break": "attack" | "abort" },
  "machine": { "driftRate": 0.6, "anomalyRate": 0.04 },
  "eye": { "iris": ["#..."], "seed": 7 },
  "silhouette": { "build": "broad" }
}
```

### Soru kartı ve alt soru (`data/questions.json`)
```jsonc
{
  "baseline": [{ "id": "b01" }],
  "cards": [{
    "id": "k01", "theme": "hayvan",
    "subs": [{ "id": "k01a", "form": "dogrudan", "provocation": 0.55, "pair": "yavru" }]
  }]
}
```
- **theme:** `hayvan | aile | beden | ani` (hayvanlar, aile, beden, anılar).
- **form:** aynı duygusal çekirdeğin soruluş biçimi — `dogrudan`, `varsayim`, `dolayli`, `ani`.
- **pair:** çapraz referans anahtarı. Aynı `pair` farklı kartlarda farklı biçimde tekrar sorulur.
- Metinler: `strings.questions.<id>` (soru), `strings.subjects.<denek>.answers.<id>` (cevap).

### Okuma (`src/test/readings.js` çıktısı)
```jsonc
{
  "n": 7, "qid": "k02b", "theme": "aile", "form": "ani", "pair": "ebeveyn", "pressed": false,
  "raw":   { "resp": 15.1, "pulse": 74, "blush": 23.0, "pupil": 3.71, "latency": 2.4, "particles": 402 },
  "dev":   { "resp": +1.1, "pulse": +6, "blush": +1.8, "pupil": +2.9, "latency": +1.5, "particles": -1.9 },
  "onset": 1.9,          // göz bebeği tepkisinin başladığı an (sn)
  "anomaly": null | "pupil" | "blush" | ...,
  "drift": 0.8           // o andaki gerçek kalibrasyon hatası (gizli)
}
```
`dev` birimleri: göz bebeği ve kızarma **%**, nabız **atım/dk**, solunum **nefes/dk**,
tepki süresi **sn**, parçacık **%**. Oyuncuya yalnızca `raw`/`dev`/`onset`/`anomaly` görünür.

---

## 3. Durum makinesi

```
TITLE ──Başla──▶ INTRO ──▶ CASEFILE ──▶ SETUP ──▶ BASELINE ──▶ TESTING ◀──┐
                                         │                    │  │       │
                       (kaset + şalter + kadran)   CARD_RUNNING ─┘  │ PAUSE ┘
                                                              │
                                    stres ≥ 100 ──▶ BREAK ──▶ DECISION
                                    oyuncu raporu damgalar ──▶ DECISION ──▶ STAMP ──▶ OUTCOME ──▶ NEXT
```
- **SETUP:** kaset kaydı başlatılır, TEST şalteri indirilir (röle, körük, CRT ısınması),
  kalibrasyon iğnesi kadranla ortalanır.
- **BASELINE:** 4 nötr soru. Makine her kanalın ortalamasını **temel** olarak saklar. O sırada
  kalibrasyon kaymışsa temel de kayık alınır (oyuncu hatası sonraki tüm sapmalara yansır).
- **TESTING / CARD_RUNNING:** oyuncu kart seçer; kart 4 alt soru taşır, sayaç her alt soruda artar.
  Her cevaptan sonra oyuncu **SÜRDÜR** ya da **ÜSTÜNE GİT** (aynı soruyu sertleştirerek tekrar;
  daha güçlü sinyal, daha çok stres) seçer. **ARA VER** stresi düşürür ama makine ısınır, kayma artar.
- **BREAK:** stres eşiği aşılırsa denek saldırır ya da sorguyu terk eder; eldeki veriyle karar verilir.
- **DECISION/STAMP:** kâğıt rapora İNSAN / REPLİKANT / BELİRSİZ damgası. Karar kayda yazılır
  ve sonraki bölümlerde geri döner (`save.decisions`, `save.flags`).

Akışlar `async` dizilerdir; her durum bir iptal jetonu taşır, durum değişince bekleyen adımlar düşer.

---

## 4. Okumaların üretimi

Her alt soru için (`p` = kışkırtma 0–1):

1. **Uyarılma:** `a = p × empathy × themeGain[tema] × formGain[biçim] × (1 + N(0, noise))`
   - İnsan: tüm biçimlerde benzer kazanç, düşük gürültü → aynı `pair` okumaları **tutarlı**.
   - Replikant (6. kuşak): doğrudan sorulara öğrenilmiş tepki, dolaylı/anı biçimlerinde düz;
     yüksek gürültü → **tutarsız**. Göz bebeği **gecikmeli** başlar, kızarma göz bebeğine eşlik etmez.
   - Sahte anılı ileri model (Bölüm 3): anı temalarında insan gibi tutarlı; yalnızca ince
     ayrıntılarda (tepki süresinin kışkırtmayla değişmemesi gibi) sapma.
   - Travmalı insan (Bölüm 2): travmayla ilgili temada bastırılmış (düz) okumalar → replikant gibi görünür.
2. **Kanallar:** göz bebeği `a×28%`, kızarma `a×40%×blushCoupling`, nabız `a×14 + stres×0.12`,
   solunum `a×5 + stres×0.04`, tepki süresi `latency.base + p×perProvocation ± jitter`.
3. **Körük / parçacık:** her soruda körük havayı çeker; parçacık değeri ancak çekiş bitince
   gelir: `particleCoupling × a × 25% + N(0, particleNoise)`.
4. **Makine katmanı (güvenilmezlik):**
   - **Kalibrasyon kayması:** rastgele yürüyüş; ARA VER ve zaman ile artar. Göz bebeği,
     kızarma ve nabza yanlılık ekler. Kadran iğnesi kaymanın yalnızca **gürültülü bir tahminini**
     gösterir; tam sıfırlamak mümkün değildir.
   - **Anomali:** `anomalyRate` olasılığıyla bir kanalda açıklanamayan sıçrama (kırmızı ANOMALİ).
   - **Hatalı pozitif:** kayma büyükken replikant da insan gibi okunabilir — ya da tersi.
5. **Sapma:** `dev = ölçülen − temel` (temel, BASELINE'da o anki kalibrasyonla alınmıştır).
6. **Çapraz referans:** rapor, aynı `pair` okumalarını yan yana listeler (biçim, göz bebeği Δ,
   kızarma Δ, tepki süresi, göz bebeği gecikmesi). Makine yorum yapmaz.

### Stres
`stres += p × volatility × 18` (+14 ÜSTÜNE GİT), düşük kışkırtmalı sorularda −4, ARA VER −30.
60: uyarı lambası, 85: düşmanca cevaplar, 100: kopma (saldırı/terk).

---

## 5. Bölümler

| Bölüm | Denek | Amaç | Durum |
|---|---|---|---|
| 1 | Açık replikant | Eğitim: mekanikleri öğretir, hoparlörden amir yönlendirir | **bu aşama** |
| 2 | Travmalı insan | Makine onu replikant gibi okur; şüphe tohumu | onaydan sonra |
| 3 | Sahte anılı ileri model | Sayaç 30'u geçip 100'e tırmanır, kalibrasyon hataları | onaydan sonra |
| Final | Oyuncunun kendisi | CRT'deki göz oyuncunun gözü; **gerçek** tepki süresi ve tutarlılık ölçülür, önceki kararlar etkiler | onaydan sonra |

## 6. Sahne ve kamera

- Katmanlar (arkadan öne): arka duvar + pencere ışığı → ayna cam → pervane (yatay, dönen) →
  ışık hüzmeleri (pervane gölgeli) → sis düzlemleri → denek silueti → masa → makine → masa objeleri →
  ön plan toz/duman.
- Planlar: `wide` (oda), `machine` (konsol, oyunun ana planı), `crt` (göz yakın planı), `subject`.
  Planlar arasında kesme; her planda yavaş içeri kayma. Fare/jiroskop paralaksı.
  "Hareketi azalt" açıkken kayma, paralaks, titreme ve gren hareketi kapanır.

## 7. Ses

Web Audio: master → (müzik, efekt, ortam, ses) + konvolüsyon yankı. Her efekt sentezlenir;
`assets/audio/sfx/<ad>.ogg|mp3|wav` varsa dosya çalınır. Altyazı satırlarının kimliği vardır;
`assets/audio/voice/<kimlik>.ogg|mp3` varsa seslendirme çalınır. Ses yalnızca "Başla" ile açılır.
