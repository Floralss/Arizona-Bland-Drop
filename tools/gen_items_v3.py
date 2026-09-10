#!/usr/bin/env python3
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import math

ROOT = Path(__file__).resolve().parents[1]
PRED = ROOT / "assets" / "predmeti"
CASES = ROOT / "assets" / "cases"
PRED.mkdir(parents=True, exist_ok=True)
CASES.mkdir(parents=True, exist_ok=True)

def font(sz):
    try:
        return ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", sz)
    except Exception:
        return ImageFont.load_default()

PAL = {
    "car": ((20, 14, 10), (255, 154, 46), (255, 220, 140)),
    "moto": ((10, 14, 22), (70, 160, 255), (180, 220, 255)),
    "skin": ((16, 10, 24), (180, 90, 255), (230, 180, 255)),
    "acc": ((10, 18, 14), (50, 220, 150), (180, 255, 210)),
    "admin": ((22, 8, 8), (255, 60, 60), (255, 180, 120)),
}

def card(path, title, kind, w=640, h=400):
    bg, ac, lt = PAL[kind]
    img = Image.new("RGB", (w, h), bg)
    px = img.load()
    for y in range(h):
        for x in range(w):
            t = y / h
            n = 0.06 * math.sin((x * 0.03) + y * 0.02)
            r = int(bg[0]*(1-t*0.35) + ac[0]*(0.12+n))
            g = int(bg[1]*(1-t*0.35) + ac[1]*(0.10+n))
            b = int(bg[2]*(1-t*0.25) + ac[2]*0.06)
            px[x, y] = (max(0,min(255,r)), max(0,min(255,g)), max(0,min(255,b)))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((16,16,w-17,h-17), 22, outline=ac, width=4)
    cx, cy = w//2, 150
    if kind == "car":
        d.polygon([(cx-70,cy+10),(cx-40,cy-35),(cx+30,cy-35),(cx+75,cy+10)], fill=ac)
        d.rounded_rectangle((cx-80,cy+8,cx+80,cy+38), 10, fill=lt)
        d.ellipse((cx-58,cy+28,cx-28,cy+58), fill=bg, outline=lt, width=6)
        d.ellipse((cx+28,cy+28,cx+58,cy+58), fill=bg, outline=lt, width=6)
    elif kind == "moto":
        d.ellipse((cx-70,cy+5,cx-25,cy+50), outline=ac, width=8)
        d.ellipse((cx+25,cy+5,cx+70,cy+50), outline=ac, width=8)
        d.line((cx-30,cy+18,cx+35,cy+12), fill=lt, width=7)
        d.line((cx+18,cy+12,cx+40,cy-28), fill=lt, width=6)
    elif kind == "skin":
        d.ellipse((cx-28,cy-48,cx+28,cy+8), fill=ac)
        d.rounded_rectangle((cx-40,cy+10,cx+40,cy+70), 18, fill=lt)
    elif kind == "acc":
        d.ellipse((cx-40,cy-20,cx+40,cy+60), outline=ac, width=10)
        d.rectangle((cx-10,cy-38,cx+10,cy-14), fill=lt)
    else:
        d.polygon([(cx,cy-50),(cx+42,cy+40),(cx-42,cy+40)], outline=ac, width=8)
        d.ellipse((cx-12,cy-8,cx+12,cy+16), fill=lt)
    f = font(26)
    t = title if len(title) < 28 else title[:26]+"…"
    tw = d.textbbox((0,0), t, font=f)[2]
    d.text(((w-tw)/2, 250), t, font=f, fill=(255,255,255))
    img = img.filter(ImageFilter.SMOOTH)
    img.save(path)

items = [
    ("Машина - Mercedes AMG (0000).png", "Mercedes AMG", "car"),
    ("Машина - BMW M5 F90 (0001).png", "BMW M5 F90", "car"),
    ("Машина - Toyota Camry (0002).png", "Toyota Camry", "car"),
    ("Машина - Lada Priora (0003).png", "Lada Priora", "car"),
    ("Машина - Lamborghini Urus (0004).png", "Lamborghini Urus", "car"),
    ("Машина - Rolls-Royce Cullinan (0005).png", "Rolls-Royce Cullinan", "car"),
    ("Машина - Tesla Model S (0006).png", "Tesla Model S", "car"),
    ("Машина - Nissan GTR (0007).png", "Nissan GTR", "car"),
    ("Мото - Yamaha R1 (1000).png", "Yamaha R1", "moto"),
    ("Мото - Honda CBR 1000 (1001).png", "Honda CBR 1000", "moto"),
    ("Мото - Kawasaki Ninja (1002).png", "Kawasaki Ninja", "moto"),
    ("Мото - Harley Davidson (1003).png", "Harley Davidson", "moto"),
    ("Мото - Suzuki GSX-R (1004).png", "Suzuki GSX-R", "moto"),
    ("Скин - Business Black (2000).png", "Business Black", "skin"),
    ("Скин - Street Hoodie (2001).png", "Street Hoodie", "skin"),
    ("Скин - Police Officer (2002).png", "Police Officer", "skin"),
    ("Скин - Desert Cowboy (2003).png", "Desert Cowboy", "skin"),
    ("Скин - Neon Night (2004).png", "Neon Night", "skin"),
    ("Скин - Winter Parka (2005).png", "Winter Parka", "skin"),
    ("Акс - Rolex Daytona (3000).png", "Rolex Daytona", "acc"),
    ("Акс - Chrome Chain (3001).png", "Chrome Chain", "acc"),
    ("Акс - Black Glasses (3002).png", "Black Glasses", "acc"),
    ("Акс - Gold Ring (3003).png", "Gold Ring", "acc"),
    ("Акс - Arizona Cap (3004).png", "Arizona Cap", "acc"),
    ("Админ - Helper Rights (9999).png", "Helper Rights", "admin"),
]
for name, title, kind in items:
    card(PRED / name, title, kind)

# nicer crates
def crate(path, title, c1, c2):
    w,h=720,560
    img=Image.new("RGBA",(w,h),(0,0,0,0))
    glow=Image.new("RGBA",(w,h),(0,0,0,0))
    ImageDraw.Draw(glow).ellipse((110,400,610,530), fill=c1+(80,))
    img=Image.alpha_composite(img, glow.filter(ImageFilter.GaussianBlur(26)))
    d=ImageDraw.Draw(img)
    d.rounded_rectangle((200,190,520,430),18,fill=(16,14,18,255),outline=c1+(255,),width=7)
    d.rounded_rectangle((185,125,535,205),16,fill=c1+(255,))
    d.rounded_rectangle((205,140,515,190),12,fill=c2+(255,))
    d.rounded_rectangle((332,186,388,248),8,fill=(255,211,106,255))
    f=font(30)
    tw=d.textbbox((0,0),title,font=f)[2]
    d.text(((w-tw)/2, 330), title, font=f, fill=(255,255,255,255))
    img.save(path)

crate(CASES/"case-auto.png","AUTO",(255,138,0),(255,210,90))
crate(CASES/"case-moto.png","MOTO",(70,150,255),(160,210,255))
crate(CASES/"case-skins.png","SKINS",(170,80,255),(230,170,255))
crate(CASES/"case-acc.png","ACC",(50,210,140),(170,255,210))
crate(CASES/"case-universal.png","ULTRA",(255,50,70),(255,160,80))
print("ok")
