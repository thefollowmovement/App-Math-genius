"""Optimises the heroes' pictures for the app (`pnpm heroes:images`, needs Pillow with WebP).

Reads the concept art of docs/design/personnages/poses/<hero>-<pose>.png (1024 px, transparent
background) and the hero on stage, docs/design/personnages/<hero>.png (the hero picker's card),
and writes apps/mobile/assets/heroes/<hero>/<picture>.webp in three densities: Metro picks @2x
or @3x by the phone's screen (React Native's density suffixes). Run it again after a change of
the art; the app's test checks every file is there.
"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
ART = ROOT / "docs/design/personnages"
SOURCE = ART / "poses"
TARGET = ROOT / "apps/mobile/assets/heroes"

HEROES = ["nova", "juno", "mika", "kai", "taro", "leo"]
# The app's pose names, and the art's.
POSES = {"bust": "buste", "victory": "victoire", "encourage": "encouragement", "think": "reflexion"}
# Height at 1x, in points: the largest size a screen shows (the bust is square).
HEIGHTS = {"bust": 160, "victory": 240, "encourage": 240, "think": 240, "card": 160}
DENSITIES = {"": 1, "@2x": 2, "@3x": 3}


def main() -> None:
    total = 0
    for hero in HEROES:
        (TARGET / hero).mkdir(parents=True, exist_ok=True)
        sources = {pose: SOURCE / f"{hero}-{art}.png" for pose, art in POSES.items()}
        # The hero on stage, opaque.
        sources["card"] = ART / f"{hero}.png"
        for picture, file in sources.items():
            source = Image.open(file).convert("RGBA")
            for suffix, scale in DENSITIES.items():
                height = HEIGHTS[picture] * scale
                width = round(source.width * height / source.height)
                image = source.resize((width, height), Image.Resampling.LANCZOS)
                path = TARGET / hero / f"{picture}{suffix}.webp"
                image.save(path, "WEBP", quality=82, alpha_quality=90, method=6)
                total += path.stat().st_size
    count = len(HEROES) * (len(POSES) + 1) * len(DENSITIES)
    print(f"{count} images, {total // 1024} KB in {TARGET}")


if __name__ == "__main__":
    main()
