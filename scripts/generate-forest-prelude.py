"""Reproduce the original welcome soundscape. Offline authoring only; requires NumPy.

Wind, synthetic bird calls and an original sparse pentatonic flute phrase.
No game recording, sound library, external sample or copied game melody is used.
The shipped WAV needs no Python or audio generation at runtime.
"""
from pathlib import Path
import wave
import numpy as np

RATE, SECONDS = 22050, 40
count = RATE * SECONDS
t = np.arange(count) / RATE
rng = np.random.default_rng(31809)
noise = rng.normal(0, 1, count)
frequencies = np.fft.rfftfreq(count, 1 / RATE)
spectrum = np.fft.rfft(noise)
spectrum *= np.exp(-(frequencies / 1000) ** 2) * np.minimum(frequencies / 75, 1)
wind = np.fft.irfft(spectrum, n=count)
wind /= max(np.max(np.abs(wind)), 1e-9)
sound = wind * (.045 + .014 * np.sin(2 * np.pi * t / 17))

# Original short phrase; long spaces allow the wind and birds to lead.
notes = [(1.0, 293.665, 3.1), (5.4, 440.0, 3.4), (10.6, 369.994, 3.3),
         (15.2, 493.883, 3.1), (20.5, 659.255, 3.6), (25.8, 440.0, 3.7),
         (31.6, 329.628, 3.1), (35.5, 293.665, 3.6)]
for start, pitch, duration in notes:
    begin, length = int(start * RATE), int(duration * RATE)
    local = np.arange(length) / RATE
    envelope = np.minimum(local / .65, 1) * np.minimum((duration - local) / 1.5, 1)
    phase = 2 * np.pi * pitch * local + .018 * np.sin(2 * np.pi * 4.3 * local)
    voice = np.sin(phase) + .16 * np.sin(phase * 2) + .035 * np.sin(phase * 3)
    sound[begin:begin + length] += voice * envelope * .075

for start in [2.4, 8.1, 13.8, 18.3, 23.6, 29.2, 34.6]:
    for repeat in range(2):
        begin = int((start + repeat * .29) * RATE)
        local = np.arange(int(.22 * RATE)) / RATE
        envelope = np.sin(np.pi * local / .22) ** 2
        phase = 2 * np.pi * (2400 * local + 1900 * local ** 2 - 3300 * local ** 3)
        sound[begin:begin + len(local)] += np.sin(phase) * envelope * .026

# A gentle seam; finite bounded PCM with headroom and no normalization jump.
fade = np.minimum(t / 1.6, 1) * np.minimum((SECONDS - t) / 1.6, 1)
sound *= fade
assert np.isfinite(sound).all() and np.max(np.abs(sound)) < .3
pcm = (sound * 32767).astype('<i2')
target = Path(__file__).resolve().parents[1] / 'public/audio/forest-prelude.wav'
target.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(target), 'wb') as output:
    output.setnchannels(1)
    output.setsampwidth(2)
    output.setframerate(RATE)
    output.writeframes(pcm.tobytes())
print(f'Created {target.name}: {SECONDS}s, {RATE}Hz, mono PCM')
