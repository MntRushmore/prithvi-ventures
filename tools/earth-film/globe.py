"""Rotating-Earth header film from NASA DSCOVR/EPIC imagery (public domain).

    python3 -m venv .venv && .venv/bin/pip install numpy pillow
    .venv/bin/python tools/earth-film/globe.py --date 2026-09-26 --out public/video/earth-epic.mp4

1. Downloads one day of full-disk EPIC photos (about 13 frames).
2. Reprojects each into an equirectangular map, weighting every point by how
   head-on its frame saw it, which yields one daylit map of the planet.
3. Renders an orthographic globe turning a full 360 degrees: a seamless loop.
   Frame 0 faces --start-lon (80 = India), also saved as a poster .jpg.

Requires ffmpeg on PATH.
"""
import argparse, json, math, subprocess, sys, urllib.request
from pathlib import Path
import numpy as np
from PIL import Image

CACHE = Path(__file__).parent / ".cache"
MW, MH = 4096, 2048
API = "https://epic.gsfc.nasa.gov"


def fetch(date):
    day = CACHE / date
    day.mkdir(parents=True, exist_ok=True)
    frames = json.load(urllib.request.urlopen(f"{API}/api/natural/date/{date}"))
    y, m, d = date.split("-")
    out = []
    for f in frames:
        png = day / f"{f['image']}.png"
        if not png.exists():
            print("download", f["image"], file=sys.stderr)
            urllib.request.urlretrieve(f"{API}/archive/natural/{y}/{m}/{d}/png/{f['image']}.png", png)
        c = f["centroid_coordinates"]
        out.append((png, c["lat"], c["lon"]))
    return out


def disc(img):
    lum = img.mean(axis=2)
    ys, xs = np.nonzero(lum > 18)
    cx, cy = (xs.min() + xs.max()) / 2, (ys.min() + ys.max()) / 2
    r = ((xs.max() - xs.min()) + (ys.max() - ys.min())) / 4
    return cx, cy, r * 0.985


def bilinear(img, x, y):
    h, w = img.shape[:2]
    x = np.clip(x, 0, w - 1.001); y = np.clip(y, 0, h - 1.001)
    x0 = x.astype(np.int32); y0 = y.astype(np.int32)
    fx = (x - x0)[..., None]; fy = (y - y0)[..., None]
    a = img[y0, x0]; b = img[y0, x0 + 1]; c = img[y0 + 1, x0]; d = img[y0 + 1, x0 + 1]
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy


def build_mosaic(frames):
    lon = np.radians(np.linspace(-180, 180, MW, endpoint=False) + 180 / MW)
    lat = np.radians(np.linspace(90, -90, MH, endpoint=False) - 90 / MH)
    LON, LAT = np.meshgrid(lon, lat)
    acc = np.zeros((MH, MW, 3)); wsum = np.zeros((MH, MW))
    for png, clat, clon in frames:
        img = np.asarray(Image.open(png).convert("RGB"), dtype=np.float32)
        cx, cy, R = disc(img)
        p0, l0 = math.radians(clat), math.radians(clon)
        dl = LON - l0
        cosc = math.sin(p0) * np.sin(LAT) + math.cos(p0) * np.cos(LAT) * np.cos(dl)
        x = R * np.cos(LAT) * np.sin(dl)
        y = R * (math.cos(p0) * np.sin(LAT) - math.sin(p0) * np.cos(LAT) * np.cos(dl))
        w = np.clip(cosc, 0, 1) ** 4
        acc += bilinear(img, cx + x, cy - y) * w[..., None]; wsum += w
    return (acc / np.maximum(wsum, 1e-6)[..., None]).astype(np.float32)


def grade(c):
    # gentle S-curve and a touch of saturation: EPIC natural colour is hazy
    c = np.clip((c / 255.0 - 0.035) * 1.12, 0, 1)
    c = c * c * (3 - 2 * c) * 0.55 + c * 0.45
    g = c.mean(axis=-1, keepdims=True)
    return np.clip(g + (c - g) * 1.18, 0, 1)


def render(mosaic, W, H, lon0, lat0, gx, gy, R, sun):
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
    x = (xs - gx) / R; y = (gy - ys) / R
    rho = np.sqrt(x * x + y * y)
    inside = rho < 1
    out = np.zeros((H, W, 3), np.float32)

    xi, yi, ri = x[inside], y[inside], np.maximum(rho[inside], 1e-6)
    c = np.arcsin(np.clip(ri, 0, 1))
    sinc, cosc = np.sin(c), np.cos(c)
    p0, l0 = math.radians(lat0), math.radians(lon0)
    lat = np.arcsin(np.clip(cosc * math.sin(p0) + yi * sinc * math.cos(p0) / ri, -1, 1))
    lon = l0 + np.arctan2(xi * sinc, ri * math.cos(p0) * cosc - yi * math.sin(p0) * sinc)
    u = ((np.degrees(lon) + 180) % 360) / 360 * MW - 0.5
    v = (90 - np.degrees(lat)) / 180 * MH - 0.5
    col = grade(bilinear(mosaic, u, v))

    nz = np.sqrt(np.clip(1 - ri * ri, 0, 1))
    ndl = xi * sun[0] + yi * sun[1] + nz * sun[2]
    light = np.clip((ndl + 0.12) / 0.55, 0, 1); light = light * light * (3 - 2 * light)
    col = col * (0.06 + 0.94 * light)[:, None] * (0.78 + 0.22 * nz)[:, None]
    col = col + np.array([0.55, 0.72, 1.0]) * ((1 - nz) ** 3 * 0.55 * light)[:, None]
    out[inside] = col

    ring = (rho >= 1) & (rho < 1.06)
    xr, yr, rr = x[ring], y[ring], rho[ring]
    side = np.clip((xr / rr * sun[0] + yr / rr * sun[1]) * 0.8 + 0.45, 0, 1)
    out[ring] = np.array([0.45, 0.65, 1.0]) * (np.exp(-(rr - 1) * 70) * side)[:, None] * 0.9

    out = np.clip(out, 0, 1)
    out = np.where(out.sum(-1, keepdims=True) > 0, out, np.array([2, 5, 4]) / 255.0)
    return (out * 255).astype(np.uint8)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--date", default="2026-09-26")
    ap.add_argument("--out", default="public/video/earth-epic.mp4")
    ap.add_argument("--seconds", type=int, default=36)
    ap.add_argument("--start-lon", type=float, default=80)
    args = ap.parse_args()

    cache = CACHE / f"mosaic-{args.date}.npy"
    if cache.exists():
        mosaic = np.load(cache)
    else:
        mosaic = build_mosaic(fetch(args.date))
        np.save(cache, mosaic)

    W, H, FPS = 1920, 1080, 24
    sun = np.array([-0.62, 0.30, 0.72]); sun /= np.linalg.norm(sun)
    ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
                           "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "slow",
                           "-crf", "24", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", args.out],
                          stdin=subprocess.PIPE)
    n = FPS * args.seconds
    for f in range(n):
        t = f / n
        lon0 = args.start_lon - 360 * t        # the Earth turns west to east
        breathe = 0.5 - 0.5 * math.cos(2 * math.pi * t)
        frame = render(mosaic, W, H, lon0, 14, W * 0.64, H * 0.60, H * (0.60 + 0.025 * breathe), sun)
        ff.stdin.write(frame.tobytes())
        if f == 0:
            Image.fromarray(frame).save(Path(args.out).with_suffix(".jpg"), quality=86)
    ff.stdin.close()
    ff.wait()


if __name__ == "__main__":
    main()
