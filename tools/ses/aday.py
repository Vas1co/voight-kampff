"""Sorgucu sesi için aday sesler tasarlar (VoxCPM2, Desktop\\voice-loop).

Her tarif, aynı deneme metnini iki farklı tohumla okur. Beğenilen dosya
tools/ses/referans-en.wav olarak kopyalanır; seslendir.py bütün replikleri o sesle üretir.

Çalıştırma (PowerShell):
  $env:PYTHONUTF8=1
  & "$env:USERPROFILE\\Desktop\\voice-loop\\freya-env\\Scripts\\python.exe" tools\\ses\\aday.py
"""

import sys
from pathlib import Path

VOICE_LOOP = Path.home() / "Desktop" / "voice-loop"
sys.path.insert(0, str(VOICE_LOOP / "araclar"))

import numpy as np
import soundfile as sf

from hisirti_temizle import temizle
from voxcpm_motor import ornekleme_hizi, parca_seslendir

PROJE = Path(__file__).resolve().parents[2]
CIKTI = PROJE / "tasarim" / "ses-adaylari"

TARIFLER = {
    "1-soguk-sorgucu": "A middle-aged man with a low, calm, cold voice, speaking slowly and evenly, like a weary police interrogator",
    "2-pruzlu-yorgun": "A deep, slightly raspy male voice, tired and detached, quiet and measured, like a film noir detective",
    "3-klinik": "A man in his fifties with a soft but firm voice, clinical and emotionless, precise diction, American accent",
    "4-burokrat": "A man in his forties with a dry, flat, bureaucratic voice, polite but quietly unsettling, slow pace",
}

DENEME = [
    "Sit down, please. Relax. I'm going to ask you a few questions, that's all.",
    "A hot afternoon. You're walking along a dry creek bed.",
    "And you just walk on. Why?",
]


def main():
    CIKTI.mkdir(parents=True, exist_ok=True)
    sr = ornekleme_hizi()
    metin = " ".join(DENEME)  # tek parça: ses cümleden cümleye değişmesin
    for ad, tarif in TARIFLER.items():
        for tohum in (11, 23):
            ses = temizle(parca_seslendir(metin, tarif=tarif, tohum=tohum), sr, 1.2)
            ses = ses / max(np.abs(ses).max(), 1e-6) * 0.9
            yol = CIKTI / f"{ad}-{tohum}.wav"
            sf.write(yol, ses, sr)
            print(f"  {yol.name}  {len(ses) / sr:.1f} sn", flush=True)


if __name__ == "__main__":
    main()
