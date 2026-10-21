# SAPMA

Tarayıcıda çalışan, sinematik bir empati sorgusu oyunu. Makine yalan ölçmez; empatik tepkiyi
ölçer ve yalnızca temele göre sapmayı gösterir. Kararı oyuncu verir.

## Çalıştırma

**En kolayı:** klasördeki `baslat.bat` dosyasına çift tıkla. Tarayıcı kendiliğinden açılır
(`http://localhost:5173`). **Kapatmak için** açılan siyah pencereyi kapat (ya da içinde Ctrl+C, sonra `E`).

Komut satırından:

```bash
npm run dev
```

Sunucu yalnızca bu bilgisayardan erişilebilir. Aynı ağdaki telefondan açmak için
`npm run dev:telefon` kullan ve terminalde görünen `Network:` adresini aç.

Yayımlanabilir statik sürüm:

```bash
npm run build
```

`dist/` klasörü statik olarak her yerde yayımlanabilir.

## Belgeler

- [docs/DESIGN.md](docs/DESIGN.md) — veri modeli, durum makinesi, okumaların üretimi
- [docs/ASSETS.md](docs/ASSETS.md) — eklenebilecek görsel, video ve ses dosyaları

Tüm metinler `data/strings.tr.json` içindedir. Test adı yalnızca `brand.testName` alanında geçer.
