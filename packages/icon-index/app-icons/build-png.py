"""Build the shippable icon set from the raw 1024px artwork.

Emits, for every app, a squircle-masked RGBA PNG and the untouched opaque
square, at each size in SIZES. Masters are the 1024px downloads; everything
smaller is Lanczos-downsampled from those rather than refetched.
"""
import json, os, sys
from concurrent.futures import ProcessPoolExecutor
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "raw")
DIST = os.path.join(HERE, "png")
SIZES = [1024, 512, 256, 128]

def squircle_mask(size, n=5.0, ss=4):
    """Superellipse |x|^n+|y|^n=1 at n=5 ~ Apple's continuous-curvature mask.
    Rasterised at ss x then downsampled, which antialiases the edge."""
    r = size * ss / 2
    mask = Image.new("L", (size * ss, size * ss), 0)
    px = mask.load()
    for y in range(size * ss):
        dy = abs((y + 0.5 - r) / r) ** n
        if dy > 1:
            continue
        half = ((1 - dy) ** (1 / n)) * r   # one span per row
        for x in range(max(0, int(round(r - half))), min(size * ss, int(round(r + half)))):
            px[x, y] = 255
    return mask.resize((size, size), Image.LANCZOS)

MASKS = {}

def init():
    for s in SIZES:
        MASKS[s] = squircle_mask(s)

def build(app):
    src = os.path.join(SRC, app["file"])
    if not os.path.exists(src):
        return (app["slug"], "missing", 0)
    base = Image.open(src).convert("RGBA")
    premasked = base.getpixel((0, 0))[3] == 0   # macOS artwork ships rounded
    written = 0
    for s in SIZES:
        im = base if base.size == (s, s) else base.resize((s, s), Image.LANCZOS)
        sq = os.path.join(DIST, "square", str(s))
        rd = os.path.join(DIST, "rounded", str(s))
        im.convert("RGB").save(os.path.join(sq, app["file"]), optimize=True)
        out = im.copy()
        if not premasked:
            out.putalpha(MASKS[s])
        out.save(os.path.join(rd, app["file"]), optimize=True)
        written += 2
    return (app["slug"], "premasked" if premasked else "masked", written)

if __name__ == "__main__":
    manifest = json.load(open(os.path.join(HERE, "manifest.json")))
    for variant in ("square", "rounded"):
        for s in SIZES:
            os.makedirs(os.path.join(DIST, variant, str(s)), exist_ok=True)
    with ProcessPoolExecutor(initializer=init) as ex:
        results = list(ex.map(build, manifest["apps"], chunksize=8))
    counts = {}
    for _, status, _ in results:
        counts[status] = counts.get(status, 0) + 1
    print("apps:", len(results), counts)
    print("files:", sum(w for _, _, w in results))
