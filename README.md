# SAPMA

Tarayıcıda çalışan, sinematik bir empati sorgusu oyunu. Makine yalan ölçmez; empatik tepkiyi
ölçer ve yalnızca temele göre sapmayı gösterir. Kararı oyuncu verir.

## Çalıştırma

```bash
npm install
npm run dev
```

Tarayıcıda `http://localhost:5173` adresini aç. Aynı ağdaki telefondan açmak için terminalde
görünen `Network:` adresini kullan.

```bash
npm run build
```

`dist/` klasörü statik olarak her yerde yayımlanabilir.

## Belgeler

- [docs/DESIGN.md](docs/DESIGN.md) — veri modeli, durum makinesi, okumaların üretimi
- [docs/ASSETS.md](docs/ASSETS.md) — eklenebilecek görsel, video ve ses dosyaları

Tüm metinler `data/strings.tr.json` içindedir. Test adı yalnızca `brand.testName` alanında geçer.
