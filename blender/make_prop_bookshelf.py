import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

reset()
random.seed(7)
W, H, Dp = 2.2, 3.2, 0.5
# carcass
for s in (-1, 1):
    box("side", (0.08, Dp, 2.7), (s * (W / 2 - 0.04), 0, 1.5), "DarkWood", 0.008)
box("plinth", (W, Dp, 0.15), (0, 0, 0.075), "DarkWood", 0.012)
box("plinth_brass", (W + 0.02, Dp + 0.02, 0.025), (0, 0, 0.16), "Brass", 0.006)
# arched crown (segmental arc, sagitta 0.35) as an extruded profile
sag, z0 = 0.35, 2.85
Rr = (W * W / 4 + sag * sag) / (2 * sag); zc = z0 + sag - Rr
arc = [(-W / 2 + W * i / 24, zc + math.sqrt(Rr * Rr - (-W / 2 + W * i / 24) ** 2)) for i in range(25)]
extrude_xz("crown", [(-W / 2, z0)] + arc + [(W / 2, z0)], -Dp / 2, Dp / 2, (0, 0, 0), "DarkWood", 0.01)
arc2 = [(x, z - 0.001) for x, z in arc]
inn = [(x, z - 0.045) for x, z in arc]
extrude_xz("arc_trim", arc2 + inn[::-1], -Dp / 2 - 0.02, -Dp / 2 + 0.01, (0, 0, 0), "Brass", 0.005)
extrude_xz("back", [(-W / 2 + 0.08, 0.15)] + [(x, z - 0.03) for x, z in arc[1:-1]] + [(W / 2 - 0.08, 0.15)],
           Dp / 2 - 0.05, Dp / 2 - 0.02, (0, 0, 0), "DarkWood", 0.0)
for s in (-1, 1):  # brass vertical trim strips + finials
    box("trim", (0.03, 0.02, 2.7), (s * (W / 2 - 0.095), -Dp / 2 - 0.005, 1.5), "Brass", 0.004)
    sphere("finial", 0.05, (s * (W / 2 - 0.04), -Dp / 2 + 0.05, 2.9), "Brass", 14)
# shelves
SH = [0.17, 0.77, 1.37, 1.97, 2.57]
for z in SH:
    box("shelf", (W - 0.16, Dp - 0.04, 0.04), (0, 0.0, z), "DarkWood", 0.006)
    box("shelf_lip", (W - 0.16, 0.012, 0.045), (0, -Dp / 2 + 0.012, z), "Brass", 0.003)
# books
cols = ["Leather", "Book1", "Book2", "Book3", "Leather", "DarkWood", "Book1", "Leather"]
x0, x1 = -W / 2 + 0.1, W / 2 - 0.1
for i, z in enumerate(SH[:-1]):
    top = z + 0.02
    x = x0
    if i % 2 == 1:  # a stack lying flat at the left
        for k in range(3):
            w, d, h = 0.34 - k * 0.03, 0.24 - k * 0.01, 0.05 + 0.01 * (k % 2)
            box("flat", (w, d, h), (x + w / 2, 0.06, top + sum(0.055 for _ in range(k)) + h / 2),
                random.choice(cols[:4]), 0.004, rot=(0, 0, radians(random.uniform(-5, 5))))
        x += 0.42
    n = 0
    while x < x1 - 0.12:
        w = random.uniform(0.035, 0.08); h = random.uniform(0.32, 0.52); d = random.uniform(0.22, 0.32)
        if x + w > x1 - 0.1:
            break
        box("book", (w, d, h), (x + w / 2, 0.19 - d / 2, top + h / 2), cols[(n + i) % len(cols)], 0.004)
        if random.random() < 0.35:  # brass spine band
            box("band", (w + 0.004, 0.012, 0.02), (x + w / 2, 0.19 - d - 0.002, top + h * 0.8), "Brass", 0.002)
        x += w + 0.003; n += 1
    # leaning book at the end of the row
    h = 0.42; th = radians(14)
    if x1 - x > 0.1:
        box("lean", (0.06, 0.26, h), (x + 0.07 - (h / 2) * sin(th), 0.06, top + (h / 2) * cos(th)), "Book3", 0.004, rot=(0, -th, 0))
# top compartment: scroll tubes lying down
for k, (xx, zz) in enumerate([(-0.5, 0.0), (-0.5, 0.095), (-0.38, 0.0), (0.4, 0.0), (0.4, 0.095), (0.52, 0.0)]):
    L = 0.5
    cyl("scroll", 0.042, L, (xx, 0, SH[-1] + 0.02 + 0.042 + zz), "Paper", 14, rot=(0, pi / 2, 0))
    for e in (-1, 1):
        cyl("scroll_cap", 0.046, 0.025, (xx + e * (L / 2 + 0.005), 0, SH[-1] + 0.02 + 0.042 + zz), "Brass", 14, rot=(0, pi / 2, 0))
finish("prop_bookshelf", view=(0.5, -0.85, 0.3))
