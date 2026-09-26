#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["pillow>=11"]
# ///
"""Generate the White Knights icons and logos for the web UI from the squadron crest.

Run from anywhere; writes into web/static (favicons, PWA icons) and web/src/lib/hmm/assets
(logos used by the UI). Re-run after changing the crest, colors or wordmark:

    uv run hmm/branding/make_branding.py
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
WEB = HERE.parent.parent / "web"
STATIC = WEB / "static"
ASSETS = WEB / "src" / "lib" / "hmm" / "assets"

CREST = HERE / "crest-source.png"  # HMM-165 patch, transparent background
FONT = HERE / "Oswald-wght.ttf"  # variable font, weight axis 200-700

NAVY = "#1b4a7a"
NAVY_DARK = "#14283e"
GOLD = "#e0a500"
WHITE = "#ffffff"

NAME = "WHITE KNIGHTS"
SUBTITLE = "HMM-165"


def crest() -> Image.Image:
    im = Image.open(CREST).convert("RGBA")
    return im.crop(im.getbbox())


def fit(im: Image.Image, box: int) -> Image.Image:
    """Scale to fit a box x box square, keeping the aspect ratio."""
    scale = box / max(im.size)
    return im.resize((max(1, round(im.width * scale)), max(1, round(im.height * scale))), Image.LANCZOS)


def square(im: Image.Image, size: int, fill: float = 1.0, background: str | None = None) -> Image.Image:
    """The crest centred on a size x size canvas, occupying `fill` of it."""
    canvas = Image.new("RGBA", (size, size), background or (0, 0, 0, 0))
    art = fit(im, round(size * fill))
    canvas.alpha_composite(art, ((size - art.width) // 2, (size - art.height) // 2))
    return canvas


def maskable(im: Image.Image, size: int) -> Image.Image:
    # Android may crop maskable icons to a circle of 80% diameter; keep the crest inside it.
    return square(im, size, fill=0.72, background=NAVY)


def font(px: int, weight: int) -> ImageFont.FreeTypeFont:
    f = ImageFont.truetype(str(FONT), px)
    f.set_variation_by_axes([weight])
    return f


def wordmark(im: Image.Image, height: int, name_color: str, sub_color: str) -> Image.Image:
    """Crest on the left, "WHITE KNIGHTS" over "HMM-165" on the right; transparent background."""
    art = fit(im, height)
    name_font = font(round(height * 0.46), 600)
    sub_font = font(round(height * 0.26), 500)
    tracking = round(height * 0.06)

    def text_width(text: str, f: ImageFont.FreeTypeFont, spacing: int) -> int:
        return sum(round(f.getlength(ch)) for ch in text) + spacing * (len(text) - 1)

    name_w = text_width(NAME, name_font, 0)
    sub_w = text_width(SUBTITLE, sub_font, tracking)
    gap = round(height * 0.22)
    width = art.width + gap + max(name_w, sub_w) + 4
    canvas = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    canvas.alpha_composite(art, (0, (height - art.height) // 2))

    draw = ImageDraw.Draw(canvas)
    x = art.width + gap
    draw.text((x, round(height * 0.08)), NAME, font=name_font, fill=name_color)
    cx = x
    for ch in SUBTITLE:
        draw.text((cx, round(height * 0.60)), ch, font=sub_font, fill=sub_color)
        cx += round(sub_font.getlength(ch)) + tracking
    return canvas


def save(im: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, optimize=True)
    print(f"wrote {path.relative_to(HERE.parent.parent)} {im.width}x{im.height}")


def main() -> None:
    c = crest()

    # Browser tab and bookmark icons (replace Immich's files of the same names).
    for px in (16, 32, 48, 96, 144):
        save(square(c, px), STATIC / f"favicon-{px}.png")
    save(square(c, 512), STATIC / "favicon.png")
    ico = square(c, 256)
    ico.save(STATIC / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
    print("wrote web/static/favicon.ico 16/32/48/64")

    # iOS home screen: opaque, with a margin.
    save(square(c, 180, fill=0.82, background=WHITE), STATIC / "apple-icon-180.png")

    # Android / installed-app icons.
    save(maskable(c, 192), STATIC / "manifest-icon-192.maskable.png")
    save(maskable(c, 512), STATIC / "manifest-icon-512.maskable.png")

    # Loading screen shown before the app starts (web/src/app.html).
    save(square(c, 300), STATIC / "hmm-crest.png")

    # Logos swapped into @immich/ui's <Logo> (see web/src/lib/hmm/branding.ts).
    save(square(c, 512), ASSETS / "crest.png")
    save(wordmark(c, 144, NAVY_DARK, NAVY), ASSETS / "wordmark-light.png")
    save(wordmark(c, 144, WHITE, GOLD), ASSETS / "wordmark-dark.png")


if __name__ == "__main__":
    main()
