"""Optimises the heroes' and companions' pictures for the app (`pnpm heroes:images`, needs Pillow
with WebP).

Heroes: reads the concept art of docs/design/personnages/poses/<hero>-<pose>.png (1024 px,
transparent background) and the hero on stage, docs/design/personnages/<hero>.png (the hero
picker's card), and writes apps/mobile/assets/heroes/<hero>/<picture>.webp.

Companions: reads docs/design/compagnons/<companion>.png (transparent background), crops it to
the drawing, centers it in a square and writes apps/mobile/assets/companions/<companion>/
stage-1.webp (one picture per stage of evolution: only the first for now).

Every picture comes in three densities: Metro picks @2x or @3x by the phone's screen (React
Native's density suffixes). Run it again after a change of the art; the app's tests check every
file is there.
"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
ART = ROOT / "docs/design/personnages"
SOURCE = ART / "poses"
TARGET = ROOT / "apps/mobile/assets/heroes"
COMPANION_ART = ROOT / "docs/design/compagnons"
COMPANION_TARGET = ROOT / "apps/mobile/assets/companions"

HEROES = ["nova", "juno", "mika", "kai", "taro", "leo"]
# The app's pose names, and the art's.
POSES = {"bust": "buste", "victory": "victoire", "encourage": "encouragement", "think": "reflexion"}
# Height at 1x, in points: the largest size a screen shows (the bust is square).
HEIGHTS = {"bust": 160, "victory": 240, "encourage": 240, "think": 240, "card": 160}
COMPANIONS = ["hibou", "lapin", "dragon", "licorne", "tigre", "renard", "chat", "phenix"]
# Companions are square, the largest one shown on their sheet.
COMPANION_SIZE = 160
# Margin around the drawing, as a share of the square: room for a floating companion.
COMPANION_MARGIN = 0.04
DENSITIES = {"": 1, "@2x": 2, "@3x": 3}


def save(image: Image.Image, path: Path) -> int:
    image.save(path, "WEBP", quality=82, alpha_quality=90, method=6)
    return path.stat().st_size


def heroes() -> int:
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
                total += save(image, TARGET / hero / f"{picture}{suffix}.webp")
    return total


def square(source: Image.Image) -> Image.Image:
    """The drawing alone (the faint halo of the cut-out left out), centered in a square."""
    alpha = source.getchannel("A").point(lambda value: 255 if value > 16 else 0)
    drawing = source.crop(alpha.getbbox())
    side = round(max(drawing.size) / (1 - 2 * COMPANION_MARGIN))
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.alpha_composite(drawing, ((side - drawing.width) // 2, (side - drawing.height) // 2))
    return canvas


def companions() -> int:
    total = 0
    for companion in COMPANIONS:
        (COMPANION_TARGET / companion).mkdir(parents=True, exist_ok=True)
        source = square(Image.open(COMPANION_ART / f"{companion}.png").convert("RGBA"))
        for suffix, scale in DENSITIES.items():
            size = COMPANION_SIZE * scale
            image = source.resize((size, size), Image.Resampling.LANCZOS)
            total += save(image, COMPANION_TARGET / companion / f"stage-1{suffix}.webp")
    return total


def main() -> None:
    total = heroes()
    count = len(HEROES) * (len(POSES) + 1) * len(DENSITIES)
    print(f"{count} images, {total // 1024} KB in {TARGET}")
    total = companions()
    count = len(COMPANIONS) * len(DENSITIES)
    print(f"{count} images, {total // 1024} KB in {COMPANION_TARGET}")


if __name__ == "__main__":
    main()
