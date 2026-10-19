"""Optimises the heroes' pictures for the app (`pnpm heroes:images`, needs Pillow with WebP).

Reads the concept art of docs/design/personnages/poses/<hero>-<pose>.png (1024 px, transparent
background) and writes apps/mobile/assets/heroes/<hero>/<pose>.webp in three densities: Metro
picks @2x or @3x by the phone's screen (React Native's density suffixes). Run it again after a
change of the art; the app's test checks every file is there.
"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
SOURCE = ROOT / "docs/design/personnages/poses"
TARGET = ROOT / "apps/mobile/assets/heroes"

HEROES = ["nova", "juno", "mika", "kai", "taro", "leo"]
# The app's pose names, and the art's.
POSES = {"bust": "buste", "victory": "victoire", "encourage": "encouragement", "think": "reflexion"}
# Height at 1x, in points: the largest size a screen shows (the bust is square).
HEIGHTS = {"bust": 160, "victory": 240, "encourage": 240, "think": 240}
DENSITIES = {"": 1, "@2x": 2, "@3x": 3}


def main() -> None:
    total = 0
    for hero in HEROES:
        (TARGET / hero).mkdir(parents=True, exist_ok=True)
        for pose, art in POSES.items():
            source = Image.open(SOURCE / f"{hero}-{art}.png").convert("RGBA")
            for suffix, scale in DENSITIES.items():
                height = HEIGHTS[pose] * scale
                width = round(source.width * height / source.height)
                image = source.resize((width, height), Image.Resampling.LANCZOS)
                path = TARGET / hero / f"{pose}{suffix}.webp"
                image.save(path, "WEBP", quality=82, alpha_quality=90, method=6)
                total += path.stat().st_size
    print(f"{len(HEROES) * len(POSES) * len(DENSITIES)} images, {total // 1024} KB in {TARGET}")


if __name__ == "__main__":
    main()
