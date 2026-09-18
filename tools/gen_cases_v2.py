#!/usr/bin/env python3
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import math

ROOT = Path(__file__).resolve().parents[1]
CASES = ROOT / "assets" / "cases"
BANNER = ROOT / "assets" / "banner.png"
CASES.mkdir(parents=True, exist_ok=True)

def font(size):
    try:
        return ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", size)
    except Exception:
        return ImageFont.load_default()

def crate(path, title, c1, c2, w=720, h=560):
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    # glow floor
    glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    g = ImageDraw.Draw(glow)
    g.ellipse((90, 390, 630, 530), fill=(*c1, 70))
    glow = glow.filter(ImageFilter.GaussianBlur(28))
    img = Image.alpha_composite(img, glow)

    box = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(box)
    # isometric-ish crate
    # front
    d.rounded_rectangle((190, 180, 530, 430), 18, fill=(18, 14, 12, 255), outline=c1 + (255,), width=6)
    # lid
    d.rounded_rectangle((175, 120, 545, 210), 16, fill=c1 + (255,))
    d.rounded_rectangle((190, 132, 530, 198), 12, fill=c2 + (255,))
    # lock
    d.rounded_rectangle((330, 188, 390, 248), 8, fill=(255, 211, 106, 255))
    d.ellipse((342, 200, 378, 236), outline=(80, 40, 10, 255), width=4)
    # stripes
    d.rectangle((190, 300, 530, 318), fill=c1 + (180,))
    tfont = font(28)
    bbox = d.textbbox((0, 0), title, font=tfont)
    tw = bbox[2] - bbox[0]
    d.text(((w - tw) / 2, 350), title, font=tfont, fill=(255, 255, 255, 255))
    img = Image.alpha_composite(img, box)
    img.save(path)

specs = [
    ("case-auto.png", "AUTO", (255, 138, 0), (255, 200, 80)),
    ("case-moto.png", "MOTO", (70, 150, 255), (160, 210, 255)),
    ("case-skins.png", "SKINS", (170, 80, 255), (230, 170, 255)),
    ("case-acc.png", "ACC", (50, 210, 140), (170, 255, 210)),
    ("case-universal.png", "ULTRA", (255, 50, 70), (255, 160, 80)),
]
for name, title, a, b in specs:
    crate(CASES / name, title, a, b)

# banner
w, h = 1600, 520
bn = Image.new("RGB", (w, h), (10, 8, 7))
px = bn.load()
for y in range(h):
    for x in range(w):
        t = y / h
        r = int(12 + 40 * t + 18 * math.sin(x * 0.01))
        g = int(8 + 18 * t)
        b = int(6 + 8 * t)
        if y > 300:
            r = min(255, r + 30)
            g = min(255, g + 10)
        px[x, y] = (r, g, b)
d = ImageDraw.Draw(bn)
d.ellipse((-80, -80, 360, 280), fill=(255, 120, 20))
bn = bn.filter(ImageFilter.GaussianBlur(1))
d = ImageDraw.Draw(bn)
d.text((80, 150), "ARIZONA BLAND DROP", font=font(42), fill=(255, 210, 120))
d.text((80, 210), "Кейсы сервера. Машины, скины, аксы.", font=font(22), fill=(230, 200, 160))
bn.save(BANNER)
print("ok")
