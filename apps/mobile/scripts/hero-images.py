"""Optimises the pictures of the heroes, their outfits and the companions for the app
(`pnpm heroes:images`, needs Pillow with WebP).

Heroes: reads the concept art of docs/design/personnages/poses/<hero>-<pose>.png (1024 px,
transparent background) and the hero on stage, docs/design/personnages/<hero>.png (the hero
picker's card), and writes apps/mobile/assets/heroes/<hero>/<picture>.webp.

Outfits: reads docs/design/tenues/<hero>-<outfit>-<pose>.png and writes
apps/mobile/assets/heroes/<hero>/<outfit>/<pose>.webp, the same poses as the stage outfit. Their
bust is a portrait (2 × 3): it is set at the top of a square 1.2 times as wide, as the stage bust
frames the hero.

Companions: reads docs/design/compagnons/<companion>.png (transparent background), crops it to
the drawing, centers it in a square and writes apps/mobile/assets/companions/<companion>/
stage-1.webp (one picture per stage of evolution: only the first for now).

Mini-games: reads docs/design/jeux/<picture>.png. The objects (transparent background) are
cropped to the drawing and fit in GAME_SPRITE pixels; the backgrounds and the cloud pillar keep
their size. One file each in apps/mobile/assets/games/: Skia draws them at any size.

Every hero and companion picture comes in three densities: Metro picks @2x or @3x by the phone's
screen (React Native's density suffixes). Run it again after a change of the art; the app's tests
check every file is there.
"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
ART = ROOT / "docs/design/personnages"
SOURCE = ART / "poses"
TARGET = ROOT / "apps/mobile/assets/heroes"
OUTFIT_ART = ROOT / "docs/design/tenues"
COMPANION_ART = ROOT / "docs/design/compagnons"
COMPANION_TARGET = ROOT / "apps/mobile/assets/companions"

HEROES = ["nova", "juno", "mika", "kai", "taro", "leo"]
# The app's pose names, and the art's.
POSES = {"bust": "buste", "victory": "victoire", "encourage": "encouragement", "think": "reflexion"}
# Height at 1x, in points: the largest size a screen shows (the bust is square).
HEIGHTS = {"bust": 160, "victory": 240, "encourage": 240, "think": 240, "card": 160}
OUTFITS = ["sport", "astronaute", "magie"]
# Width of the square an outfit's bust is set in, against the picture's.
OUTFIT_BUST_SQUARE = 1.2
COMPANIONS = ["hibou", "lapin", "dragon", "licorne", "tigre", "renard", "chat", "phenix"]
# Companions are square, the largest one shown on their sheet.
COMPANION_SIZE = 160
# Margin around the drawing, as a share of the square: room for a floating companion.
COMPANION_MARGIN = 0.04
DENSITIES = {"": 1, "@2x": 2, "@3x": 3}
GAME_ART = ROOT / "docs/design/jeux"
GAME_TARGET = ROOT / "apps/mobile/assets/games"
GAME_SPRITES = ["poisson", "bouchon", "gemme", "croquettes", "bombe", "coeur", "bulle"]
GAME_BACKGROUNDS = ["fond-peche", "fond-pluie", "fond-vol"]
# Largest side of an object, in pixels: about 85 points on a 3x screen.
GAME_SPRITE = 256


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


def bust_square(source: Image.Image) -> Image.Image:
    """A portrait bust at the top of a square, centered, the sides transparent."""
    side = round(source.width * OUTFIT_BUST_SQUARE)
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.alpha_composite(source, ((side - source.width) // 2, 0))
    return canvas


def outfits() -> int:
    total = 0
    for hero in HEROES:
        for outfit in OUTFITS:
            (TARGET / hero / outfit).mkdir(parents=True, exist_ok=True)
            for pose, art in POSES.items():
                source = Image.open(OUTFIT_ART / f"{hero}-{outfit}-{art}.png").convert("RGBA")
                if pose == "bust":
                    source = bust_square(source)
                for suffix, scale in DENSITIES.items():
                    height = HEIGHTS[pose] * scale
                    width = round(source.width * height / source.height)
                    image = source.resize((width, height), Image.Resampling.LANCZOS)
                    total += save(image, TARGET / hero / outfit / f"{pose}{suffix}.webp")
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


def crop(source: Image.Image) -> Image.Image:
    """The drawing alone, without the transparent margin."""
    alpha = source.getchannel("A").point(lambda value: 255 if value > 16 else 0)
    return source.crop(alpha.getbbox())


def games() -> int:
    total = 0
    GAME_TARGET.mkdir(parents=True, exist_ok=True)
    for sprite in GAME_SPRITES:
        image = crop(Image.open(GAME_ART / f"{sprite}.png").convert("RGBA"))
        image.thumbnail((GAME_SPRITE, GAME_SPRITE), Image.Resampling.LANCZOS)
        total += save(image, GAME_TARGET / f"{sprite}.webp")
    for background in GAME_BACKGROUNDS:
        image = Image.open(GAME_ART / f"{background}.png").convert("RGB")
        image.save(GAME_TARGET / f"{background}.webp", "WEBP", quality=80, method=6)
        total += (GAME_TARGET / f"{background}.webp").stat().st_size
    pillar = crop(Image.open(GAME_ART / "pilier-nuage.png").convert("RGBA"))
    total += save(pillar, GAME_TARGET / "pilier-nuage.webp")
    return total


def main() -> None:
    total = heroes()
    count = len(HEROES) * (len(POSES) + 1) * len(DENSITIES)
    print(f"{count} images, {total // 1024} KB in {TARGET}")
    total = outfits()
    count = len(HEROES) * len(OUTFITS) * len(POSES) * len(DENSITIES)
    print(f"{count} outfit images, {total // 1024} KB in {TARGET}")
    total = companions()
    count = len(COMPANIONS) * len(DENSITIES)
    print(f"{count} images, {total // 1024} KB in {COMPANION_TARGET}")
    total = games()
    count = len(GAME_SPRITES) + len(GAME_BACKGROUNDS) + 1
    print(f"{count} images, {total // 1024} KB in {GAME_TARGET}")


if __name__ == "__main__":
    main()
