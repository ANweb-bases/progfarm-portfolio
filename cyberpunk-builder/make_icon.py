"""Рисует icon.ico: тёмный скошенный значок с жёлтым неоновым CP."""
import pathlib

from PIL import Image, ImageDraw, ImageFilter, ImageFont

S = 256
img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
d = ImageDraw.Draw(img)
cut = 46
poly = [(0, 0), (S - cut, 0), (S, cut), (S, S), (cut, S), (0, S - cut)]
d.polygon(poly, fill=(8, 10, 18, 255))
glow = Image.new("RGBA", (S, S), (0, 0, 0, 0))
ImageDraw.Draw(glow).line(poly + [poly[0]], fill=(252, 238, 9, 255), width=10)
img = Image.alpha_composite(img, glow.filter(ImageFilter.GaussianBlur(6)))
d = ImageDraw.Draw(img)
d.line(poly + [poly[0]], fill=(252, 238, 9, 255), width=6)
d.line([(24, 214), (110, 214)], fill=(0, 240, 255, 255), width=6)  # голубая «неоновая» черта
font = next((ImageFont.truetype(f, 120) for f in ("C:/Windows/Fonts/bahnschrift.ttf", "C:/Windows/Fonts/arialbd.ttf") if pathlib.Path(f).exists()), ImageFont.load_default())
d.text((S / 2 + 2, S / 2 - 10), "CP", font=font, fill=(0, 240, 255, 255), anchor="mm")
d.text((S / 2 - 3, S / 2 - 14), "CP", font=font, fill=(252, 238, 9, 255), anchor="mm")
img.save(pathlib.Path(__file__).parent / "icon.ico", sizes=[(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)])
