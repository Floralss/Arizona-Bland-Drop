#!/usr/bin/env python3
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math

ROOT = Path(__file__).resolve().parents[1]
PRED = ROOT / "assets" / "predmeti"
CASES = ROOT / "assets" / "cases"
PRED.mkdir(parents=True, exist_ok=True)
CASES.mkdir(parents=True, exist_ok=True)

PALETTES = {
    "car": [(18, 14, 10), (255, 138, 0), (255, 210, 90)],
    "moto": [(10, 12, 18), (80, 160, 255), (200, 230, 255)],
    "skin": [(16, 10, 22), (180, 70, 255), (255, 160, 240)],
    "acc": [(12, 16, 14), (70, 220, 150), (200, 255, 220)],
    "admin": [(20, 8, 8), (255, 50, 50), (255, 200, 120)],
    "case": [(12, 10, 8), (255, 150, 20), (255, 220, 140)],
}

def font(size):
    for p in (
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ):
        try:
            return ImageFont.truetype(p, size)
        except Exception:
            pass
    return ImageFont.load_default()

def glow_rect(draw, box, color, r=24, width=3):
    draw.rounded_rectangle(box, radius=r, outline=color, width=width)

def make_card(path, title, subtitle, kind, w=640, h=400):
    bg, accent, light = PALETTES[kind]
    img = Image.new("RGB", (w, h), bg)
    px = img.load()
    for y in range(h):
        for x in range(w):
            t = y / h
            n = 0.08 * math.sin((x + y) * 0.04)
            r = int(bg[0] * (1 - t * 0.4) + accent[0] * (t * 0.18 + n))
            g = int(bg[1] * (1 - t * 0.4) + accent[1] * (t * 0.12 + n))
            b = int(bg[2] * (1 - t * 0.3) + accent[2] * (t * 0.08))
            px[x, y] = (max(0, min(255, r)), max(0, min(255, g)), max(0, min(255, b)))
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    d.ellipse((-80, -60, 260, 220), fill=(*accent, 40))
    d.ellipse((w - 280, h - 200, w + 40, h + 40), fill=(*light, 28))
    img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    draw = ImageDraw.Draw(img)
    glow_rect(draw, (18, 18, w - 19, h - 19), accent, 28, 4)
    glow_rect(draw, (28, 28, w - 29, h - 29), light, 22, 1)
    icon_box = (w // 2 - 70, 70, w // 2 + 70, 210)
    draw.rounded_rectangle(icon_box, radius=20, fill=(0, 0, 0, 80), outline=accent, width=3)
    # simple glyph
    cx, cy = w // 2, 140
    if kind == "car":
        draw.rounded_rectangle((cx - 50, cy - 10, cx + 50, cy + 22), 8, fill=accent)
        draw.ellipse((cx - 38, cy + 14, cx - 18, cy + 34), fill=light)
        draw.ellipse((cx + 18, cy + 14, cx + 38, cy + 34), fill=light)
        draw.polygon([(cx - 30, cy - 10), (cx - 10, cy - 38), (cx + 22, cy - 38), (cx + 42, cy - 10)], fill=light)
    elif kind == "moto":
        draw.ellipse((cx - 48, cy, cx - 18, cy + 30), outline=accent, width=6)
        draw.ellipse((cx + 18, cy, cx + 48, cy + 30), outline=accent, width=6)
        draw.line((cx - 20, cy + 8, cx + 24, cy + 8), fill=light, width=6)
        draw.line((cx + 10, cy + 8, cx + 28, cy - 22), fill=light, width=5)
    elif kind == "skin":
        draw.ellipse((cx - 22, cy - 38, cx + 22, cy + 6), fill=accent)
        draw.rounded_rectangle((cx - 30, cy + 8, cx + 30, cy + 48), 16, fill=light)
    elif kind == "acc":
        draw.ellipse((cx - 28, cy - 18, cx + 28, cy + 38), outline=accent, width=8)
        draw.rectangle((cx - 8, cy - 28, cx + 8, cy - 10), fill=light)
    elif kind == "admin":
        draw.polygon([(cx, cy - 40), (cx + 36, cy + 28), (cx - 36, cy + 28)], outline=accent, width=6)
        draw.ellipse((cx - 10, cy - 8, cx + 10, cy + 12), fill=light)
    else:
        draw.rounded_rectangle((cx - 36, cy - 28, cx + 36, cy + 36), 8, outline=accent, width=6)
        draw.rectangle((cx - 12, cy - 8, cx + 12, cy + 16), fill=light)

    f1 = font(28)
    f2 = font(16)
    # wrap title
    def center_text(text, y, f, fill):
        bbox = draw.textbbox((0, 0), text, font=f)
        tw = bbox[2] - bbox[0]
        draw.text(((w - tw) / 2, y), text, font=f, fill=fill)

    # shrink long titles
    t = title
    if len(t) > 28:
        t = t[:26] + "…"
    center_text(t, 232, f1, (255, 255, 255))
    center_text(subtitle, 274, f2, accent)
    center_text("Arizona Bland Drop", 330, font(14), (180, 160, 130))
    img = img.filter(ImageFilter.SMOOTH)
    img.save(path, "PNG")

ITEMS = [
    ("Машина - Mercedes AMG (0000).png", "Mercedes AMG", "Авто • редкий", "car"),
    ("Машина - BMW M5 F90 (0001).png", "BMW M5 F90", "Авто • эпик", "car"),
    ("Машина - Toyota Camry (0002).png", "Toyota Camry", "Авто • обычный", "car"),
    ("Машина - Lada Priora (0003).png", "Lada Priora", "Авто • обычный", "car"),
    ("Машина - Lamborghini Urus (0004).png", "Lamborghini Urus", "Авто • легенда", "car"),
    ("Машина - Rolls-Royce Cullinan (0005).png", "Rolls-Royce Cullinan", "Авто • легенда", "car"),
    ("Машина - Tesla Model S (0006).png", "Tesla Model S", "Авто • эпик", "car"),
    ("Машина - Nissan GTR (0007).png", "Nissan GTR", "Авто • редкий", "car"),
    ("Мото - Yamaha R1 (1000).png", "Yamaha R1", "Мото • эпик", "moto"),
    ("Мото - Honda CBR 1000 (1001).png", "Honda CBR 1000", "Мото • редкий", "moto"),
    ("Мото - Kawasaki Ninja (1002).png", "Kawasaki Ninja", "Мото • редкий", "moto"),
    ("Мото - Harley Davidson (1003).png", "Harley Davidson", "Мото • эпик", "moto"),
    ("Мото - Suzuki GSX-R (1004).png", "Suzuki GSX-R", "Мото • обычный", "moto"),
    ("Скин - Business Black (2000).png", "Business Black", "Скин • редкий", "skin"),
    ("Скин - Street Hoodie (2001).png", "Street Hoodie", "Скин • обычный", "skin"),
    ("Скин - Police Officer (2002).png", "Police Officer", "Скин • эпик", "skin"),
    ("Скин - Desert Cowboy (2003).png", "Desert Cowboy", "Скин • редкий", "skin"),
    ("Скин - Neon Night (2004).png", "Neon Night", "Скин • легенда", "skin"),
    ("Скин - Winter Parka (2005).png", "Winter Parka", "Скин • обычный", "skin"),
    ("Акс - Rolex Daytona (3000).png", "Rolex Daytona", "Акс • легенда", "acc"),
    ("Акс - Chrome Chain (3001).png", "Chrome Chain", "Акс • редкий", "acc"),
    ("Акс - Black Glasses (3002).png", "Black Glasses", "Акс • обычный", "acc"),
    ("Акс - Gold Ring (3003).png", "Gold Ring", "Акс • эпик", "acc"),
    ("Акс - Arizona Cap (3004).png", "Arizona Cap", "Акс • обычный", "acc"),
    ("Админ - Helper Rights (9999).png", "Helper Rights", "Админ • 0.001%", "admin"),
]

CASES_IMG = [
    ("case-auto.png", "Автомобильный", "Кейс с машинами", "case"),
    ("case-moto.png", "Мото", "Кейс с мото", "case"),
    ("case-skins.png", "Скины", "Кейс со скинами", "case"),
    ("case-acc.png", "Аксессуары", "Кейс с аксами", "case"),
    ("case-universal.png", "Универсальный", "Всё + Helper 0.001%", "admin"),
]

for name, title, sub, kind in ITEMS:
    make_card(PRED / name, title, sub, kind)

for name, title, sub, kind in CASES_IMG:
    make_card(CASES / name, title, sub, kind, 720, 480)

print("generated", len(ITEMS), "items and", len(CASES_IMG), "cases")
