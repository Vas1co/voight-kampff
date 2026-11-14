"""Sorgucunun İngilizce repliklerini seslendirir (VoxCPM2, Desktop\\voice-loop).

data/strings.en.json'daki seslendirilen satırları okur, her birini
tools/ses/referans-en.wav sesiyle üretir ve assets/audio/voice/en/<kimlik>.mp3 yazar.
Kimlik, oyunun voiceId() kuralıdır: anahtar yolu, noktalar tire (lines-sit, questions-q1-lines-0).

Çalıştırma (PowerShell):
  $env:PYTHONUTF8=1
  & "$env:USERPROFILE\\Desktop\\voice-loop\\freya-env\\Scripts\\python.exe" tools\\ses\\seslendir.py
Seçenekler:
  --sadece lines-sit,questions-q3-prompt   yalnızca bunları (yeniden) üret
  --tohum 7                                farklı okuma için
  --hepsi                                  var olanların da üzerine yaz
  --hiz 1.12 / --hoparlor 1                sonradan işlem (varsayılan: %12 hızlı, hoparlörlü)

Ses: referans-en.wav = tasarim/ses-adaylari/2-pruzlu-yorgun-23.wav (yalnızca yazılı tarifle
tasarlandı, kimsenin sesi klonlanmadı). Eski ses: referans-en-soguk.wav, --hiz 1 --hoparlor 0.
"""

import argparse
import json
import sys
from pathlib import Path

VOICE_LOOP = Path.home() / "Desktop" / "voice-loop"
sys.path.insert(0, str(VOICE_LOOP / "araclar"))

import numpy as np
import soundfile as sf

sys.path.insert(0, str(Path(__file__).resolve().parent))
from islem import hizlandir, hoparlor

PROJE = Path(__file__).resolve().parents[2]
REFERANS = Path(__file__).resolve().parent / "referans-en.wav"
CIKTI = PROJE / "assets" / "audio" / "voice" / "en"

# Oyunda sorgucunun seslendirilen satırları (src/core/game.js ile aynı anahtarlar).
TEK = ["sit", "relax", "eye", "speed", "baseline", "baselineDone", "noAnswer", "fast", "end"]


def satirlar(veri: dict) -> dict[str, str]:
    out = {}
    L = veri["lines"]
    for k in TEK:
        out[f"lines-{k}"] = L[k]
    for k, v in L["verdict"].items():
        out[f"lines-verdict-{k}"] = v
    for i, v in enumerate(L["next"]):
        out[f"lines-next-{i}"] = v
    for qid, q in veri["questions"].items():
        for i, v in enumerate(q["lines"]):
            out[f"questions-{qid}-lines-{i}"] = v
        out[f"questions-{qid}-prompt"] = q["prompt"]
    return out


def kirp(y: np.ndarray, sr: int, esik: float = 0.015) -> np.ndarray:
    """Baştaki ve sondaki sessizliği atar, kısa bir pay bırakır."""
    zarf = np.convolve(np.abs(y), np.ones(int(sr * 0.01)) / (sr * 0.01), mode="same")
    ses = np.where(zarf > esik * zarf.max())[0]
    if not len(ses):
        return y
    a = max(0, ses[0] - int(sr * 0.04))
    b = min(len(y), ses[-1] + int(sr * 0.12))
    y = y[a:b].copy()
    sonu = int(sr * 0.05)  # sonda tık olmasın
    y[-sonu:] *= np.linspace(1, 0, sonu)
    return y


def seviyele(y: np.ndarray, hedef_rms: float = 0.085, tepe: float = 0.95) -> np.ndarray:
    """Bütün replikler aynı yükseklikte duyulsun: RMS'e göre, tepeyi aşmadan."""
    konusma = y[np.abs(y) > 0.02]
    rms = np.sqrt(np.mean(konusma ** 2)) if len(konusma) else 1e-6
    y = y * (hedef_rms / max(rms, 1e-6))
    m = np.abs(y).max()
    return y * (tepe / m) if m > tepe else y


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--sadece", default="")
    p.add_argument("--tohum", type=int, default=5)
    p.add_argument("--hepsi", action="store_true")
    p.add_argument("--cfg", type=float, default=2.0)
    p.add_argument("--hiz", type=float, default=1.12)
    p.add_argument("--hoparlor", type=int, default=1)
    p.add_argument("--referans", default=str(REFERANS))
    a = p.parse_args()

    referans = Path(a.referans)
    if not referans.exists():
        raise SystemExit(f"HATA: {referans} yok. Önce aday.py ile bir ses seçip buraya kopyalayın.")

    from hisirti_temizle import temizle
    from voxcpm_motor import ornekleme_hizi, parca_seslendir

    veri = json.loads((PROJE / "data" / "strings.en.json").read_text(encoding="utf-8"))
    hepsi = satirlar(veri)
    secili = [s.strip() for s in a.sadece.split(",") if s.strip()]
    for s in secili:
        if s not in hepsi:
            raise SystemExit(f"HATA: bilinmeyen kimlik {s}. Geçerli olanlar:\n  " + "\n  ".join(hepsi))
    is_listesi = {k: v for k, v in hepsi.items() if not secili or k in secili}

    CIKTI.mkdir(parents=True, exist_ok=True)
    sr = ornekleme_hizi()
    for n, (kimlik, metin) in enumerate(is_listesi.items(), 1):
        yol = CIKTI / f"{kimlik}.mp3"
        if yol.exists() and not (a.hepsi or secili):
            print(f"  [{n}/{len(is_listesi)}] {kimlik}: var, geçildi", flush=True)
            continue
        ses = parca_seslendir(metin, referans=str(referans), tohum=a.tohum + n, cfg=a.cfg)
        ses = hizlandir(kirp(temizle(ses, sr, 1.2), sr), a.hiz)
        if a.hoparlor:
            ses = hoparlor(ses, sr)
        ses = seviyele(ses)
        sf.write(yol, ses, sr, format="MP3")
        print(f"  [{n}/{len(is_listesi)}] {kimlik}: {len(ses) / sr:.1f} sn  \"{metin}\"", flush=True)
    print("BİTTİ")


if __name__ == "__main__":
    main()
