"""Seslendirme sonrası işlemler (aday2.py ve seslendir.py ortak kullanır)."""

import librosa
import numpy as np
from scipy.signal import butter, sosfilt


def hizlandir(y: np.ndarray, oran: float) -> np.ndarray:
    """Perdeyi bozmadan hızlandırır (1.12 = %12 hızlı)."""
    return y if abs(oran - 1) < 1e-3 else librosa.effects.time_stretch(y, rate=oran)


def hoparlor(y: np.ndarray, sr: int) -> np.ndarray:
    """Duvar hoparlörü: dar bant, hafif doyum, küçük oda yankısı."""
    sos = butter(4, [280, 4200], btype="band", fs=sr, output="sos")
    k = sosfilt(sos, y)
    k = np.tanh(k * 2.2) / np.tanh(2.2)
    rng = np.random.default_rng(3)
    n = int(sr * 0.22)
    ir = rng.standard_normal(n) * np.exp(-np.linspace(0, 9, n))
    ir[0] = 6.0
    yanki = np.convolve(k, ir)[: len(k)]
    return 0.8 * k + 0.2 * yanki / max(np.abs(yanki).max(), 1e-6) * np.abs(k).max()
