"""Pencereden görünen sisli şehir: gif'i kare atlasına çevirir.

Kaynak: tasarim/marka/new/mirror.gif (depoda değil). Çıktı:
  assets/images/room/window-city-sis.jpg  (8 sütunlu kare atlası)
  src/scene/window-city.json              (kare sayısı, sütun/satır, fps)

Ayar: --bulanik (px), --renk (0 = gri, 1 = orijinal), --sis (0-1, krem-gri pus).
Çalıştırma: python tools/pencere_atlas.py --bulanik 2 --renk 0.35 --sis 0.35
"""

import argparse
import json
from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter, ImageSequence

PROJE = Path(__file__).resolve().parents[1]


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--gif", default=str(PROJE / "tasarim" / "marka" / "new" / "mirror.gif"))
    p.add_argument("--bulanik", type=float, default=2.0)
    p.add_argument("--renk", type=float, default=0.35)
    p.add_argument("--sis", type=float, default=0.35)
    a = p.parse_args()

    kaynak = Image.open(a.gif)
    kareler = [(f.convert("RGB").copy(), f.info.get("duration", 70)) for f in ImageSequence.Iterator(kaynak)]
    n, FW, FH, cols = len(kareler), 384, 216, 8
    rows = (n + cols - 1) // cols
    atlas = Image.new("RGB", (FW * cols, FH * rows))
    pus = Image.new("RGB", (FW, FH), (150, 148, 140))
    for i, (f, _) in enumerate(kareler):
        f = f.resize((FW, FH), Image.LANCZOS)
        f = ImageEnhance.Color(f).enhance(a.renk)
        if a.bulanik > 0:
            f = f.filter(ImageFilter.GaussianBlur(a.bulanik))
        f = Image.blend(f, pus, a.sis)
        atlas.paste(f, ((i % cols) * FW, (i // cols) * FH))
    atlas.save(PROJE / "assets" / "images" / "room" / "window-city-sis.jpg", quality=80, optimize=True, progressive=True)
    sure = sum(d for _, d in kareler) / n
    meta = {"frames": n, "cols": cols, "rows": rows, "fps": round(1000 / sure, 2)}
    (PROJE / "src" / "scene" / "window-city.json").write_text(json.dumps(meta))
    print(meta)


if __name__ == "__main__":
    main()
