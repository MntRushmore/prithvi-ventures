"""City lights and stars for the live globe (js/globe.js).

    .venv/bin/python tools/earth-film/sky.py

1. City lights: NASA Black Marble 2016 (public domain), cut down to just the
   lights and resized to a power-of-two texture.
2. Stars: every star to magnitude 6.2 in the sky behind the Earth as DSCOVR
   saw it on 26 Sep 2026, i.e. around the anti-solar point (Pisces, under the
   Great Square of Pegasus), from the d3-celestial catalogue (Yale BSC/HYG).
   Positions are fractions of the film's 1920x1080 frame.
"""
import json, math, urllib.request
from io import BytesIO
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
LIGHTS_SRC = "https://eoimages.gsfc.nasa.gov/images/imagerecords/144000/144898/BlackMarble_2016_01deg.jpg"
STARS_SRC = "https://raw.githubusercontent.com/ofrohn/d3-celestial/master/data/stars.6.json"

ANTI_SUN = (3.2, 1.4)  # RA, Dec in degrees; the Sun was at RA 183.2, Dec -1.4
FOV = 84  # degrees across the frame
W, H = 1920, 1080


def lights(out):
    raw = urllib.request.urlopen(LIGHTS_SRC).read()
    bm = np.asarray(Image.open(BytesIO(raw)).convert("L")).astype(np.float32) / 255
    keep = np.clip((bm - 0.16) / 0.7, 0, 1) ** 1.3
    img = Image.fromarray((keep * 255).astype(np.uint8)).resize((4096, 2048), Image.LANCZOS)
    img.save(out, quality=80, method=6)


def stars(out):
    data = json.load(urllib.request.urlopen(STARS_SRC))["features"]
    ra0, dec0 = (math.radians(v) for v in ANTI_SUN)
    f = (W / 2) / math.tan(math.radians(FOV / 2))
    keep = []
    for s in data:
        mag = s["properties"]["mag"]
        if mag > 6.2:
            continue
        ra, dec = (math.radians(c) for c in s["geometry"]["coordinates"])
        cosc = math.sin(dec0) * math.sin(dec) + math.cos(dec0) * math.cos(dec) * math.cos(ra - ra0)
        if cosc <= 0.2:
            continue
        # gnomonic projection, north up, east to the left as on the sky
        x = math.cos(dec) * math.sin(ra - ra0) / cosc
        y = (math.cos(dec0) * math.sin(dec) - math.sin(dec0) * math.cos(dec) * math.cos(ra - ra0)) / cosc
        px, py = W / 2 - f * x, H / 2 - f * y
        if -20 <= px <= W + 20 and -20 <= py <= H + 20:
            bv = float(s["properties"].get("bv") or 0.6)
            keep.append([round(px / W, 4), round(py / H, 4), mag, round(bv, 2)])
    keep.sort(key=lambda s: -s[2])  # faint first, so bright stars draw on top
    out.write_text(json.dumps(keep, separators=(",", ":")))


if __name__ == "__main__":
    lights(ROOT / "public/images/earth-lights.webp")
    stars(ROOT / "public/data/stars.json")
