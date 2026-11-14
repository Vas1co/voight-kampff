"""İkinci tur aday sesler: "2-pruzlu-yorgun-23" tabanı ve hızlı, kesik, klinik bir
sınav görevlisi tarzı. Her biri ayrıca "hoparlör" işlemli hâliyle de yazılır
(sesin odadaki bir duvar hoparlöründen gelmesi).

Gerçek bir kişinin sesi klonlanmaz; sesler yalnızca yazılı tarifle tasarlanır.
"""

import sys
from pathlib import Path

VOICE_LOOP = Path.home() / "Desktop" / "voice-loop"
sys.path.insert(0, str(VOICE_LOOP / "araclar"))

import numpy as np
import soundfile as sf

from hisirti_temizle import temizle
from voxcpm_motor import ornekleme_hizi, parca_seslendir

sys.path.insert(0, str(Path(__file__).resolve().parent))
from islem import hizlandir, hoparlor

PROJE = Path(__file__).resolve().parents[2]
ADAY = PROJE / "tasarim" / "ses-adaylari"
CIKTI = ADAY / "tur2"

DENEME = ("Sit down, please. Relax. I'm going to ask you a few questions, that's all. "
          "A hot afternoon. You're walking along a dry creek bed. And you just walk on. Why?")

TARIFLER = {
    "B-kesik-klinik": "A male examiner with a crisp, clipped, emotionless voice, speaking fast and precisely in short bursts, cold, flat and demanding, like reading a test protocol",
    "C-sert-hizli": "A middle-aged man with a slightly raspy, tired but sharp voice, rapid and impatient delivery, clinical and detached, every word clipped",
    "D-pruzlu-kesik": "A deep, slightly raspy male voice, tired and detached, clipped and precise, faster pace, cold authority, like an interrogator who has done this a thousand times",
}


def yaz(ad: str, ses: np.ndarray, sr: int):
    ses = ses / max(np.abs(ses).max(), 1e-6) * 0.9
    sf.write(CIKTI / f"{ad}.wav", ses, sr)
    print(f"  {ad}.wav  {len(ses) / sr:.1f} sn", flush=True)


def main():
    CIKTI.mkdir(parents=True, exist_ok=True)
    sr = ornekleme_hizi()

    # A: beğenilen ses aynen, bir de biraz hızlandırılmış ve hoparlörlü hâli
    a = sf.read(ADAY / "2-pruzlu-yorgun-23.wav")[0].astype(np.float32)
    hizli = hizlandir(a, 1.12)
    yaz("A-pruzlu-yorgun-23-hizli", hizli, sr)
    yaz("A-pruzlu-yorgun-23-hoparlor", hoparlor(a, sr), sr)
    yaz("A-pruzlu-yorgun-23-hizli-hoparlor", hoparlor(hizli, sr), sr)

    for ad, tarif in TARIFLER.items():
        for tohum in (31, 47):
            ses = temizle(parca_seslendir(DENEME, tarif=tarif, tohum=tohum), sr, 1.2)
            yaz(f"{ad}-{tohum}", ses, sr)
            yaz(f"{ad}-{tohum}-hoparlor", hoparlor(ses, sr), sr)


if __name__ == "__main__":
    main()
