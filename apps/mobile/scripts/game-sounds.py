"""Synthesizes the mini-games' sound effects (short, soft, kawaii) into assets/games/sounds/*.wav.

No sound bank to license: every sound is computed here, with the standard library only.
Run: python3 apps/mobile/scripts/game-sounds.py
"""
import math
import random
import struct
import wave
from pathlib import Path

RATE = 22050
OUT = Path(__file__).resolve().parent.parent / "assets" / "games" / "sounds"
random.seed(9)


def envelope(t, length, attack=0.005):
    """Fast attack, smooth exponential release: nothing clicks."""
    if t < attack:
        return t / attack
    return math.exp(-5 * (t - attack) / max(length - attack, 1e-6))


def tone(freq_start, freq_end, length, wave_kind="sine", volume=0.5):
    samples = []
    phase = 0.0
    count = int(RATE * length)
    for i in range(count):
        t = i / RATE
        freq = freq_start + (freq_end - freq_start) * (i / count)
        phase += 2 * math.pi * freq / RATE
        value = math.sin(phase)
        if wave_kind == "soft-square":
            value = math.tanh(3 * value)
        samples.append(value * envelope(t, length) * volume)
    return samples


def noise(length, volume=0.4, smooth=0.85):
    samples = []
    last = 0.0
    count = int(RATE * length)
    for i in range(count):
        last = smooth * last + (1 - smooth) * random.uniform(-1, 1)
        samples.append(last * envelope(i / RATE, length) * volume * 3)
    return samples


def sequence(*parts, gap=0.0):
    out = []
    for part in parts:
        out.extend(part)
        out.extend([0.0] * int(RATE * gap))
    return out


def mix(*tracks):
    length = max(len(track) for track in tracks)
    return [sum(track[i] if i < len(track) else 0.0 for track in tracks) for i in range(length)]


def save(name, samples):
    peak = max(1e-6, max(abs(value) for value in samples))
    scale = 0.5 / peak  # about -6 dBFS: soft, never loud
    with wave.open(str(OUT / f"{name}.wav"), "wb") as file:
        file.setnchannels(1)
        file.setsampwidth(2)
        file.setframerate(RATE)
        file.writeframes(b"".join(struct.pack("<h", int(value * scale * 32767)) for value in samples))


SOUNDS = {
    # A right answer: a bright two-note chime.
    "right": sequence(tone(988, 988, 0.09), tone(1319, 1319, 0.18), gap=0.0),
    # A wrong answer: a gentle falling « boop », never a buzzer.
    "wrong": tone(440, 330, 0.22, volume=0.4),
    # A bubble or a gem caught.
    "pop": tone(600, 1250, 0.08),
    # A croquette: tiny crunch.
    "crunch": sequence(noise(0.03, smooth=0.5), noise(0.03, smooth=0.5), gap=0.015),
    # The fish bites, the float dives.
    "splash": mix(noise(0.22, smooth=0.9), tone(300, 180, 0.12, volume=0.2)),
    # A wing beat.
    "flap": noise(0.09, volume=0.3, smooth=0.95),
    # A bomb or an obstacle: a soft thud.
    "thud": tone(160, 60, 0.2, volume=0.6),
    # A memory card turns.
    "flip": tone(1500, 900, 0.05, volume=0.3),
    # End of the round: a little fanfare.
    "win": sequence(
        tone(523, 523, 0.11, "soft-square", 0.35),
        tone(659, 659, 0.11, "soft-square", 0.35),
        tone(784, 784, 0.11, "soft-square", 0.35),
        tone(1047, 1047, 0.3, "soft-square", 0.35),
    ),
}

if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for name, samples in SOUNDS.items():
        save(name, samples)
        print(f"{name}.wav")
