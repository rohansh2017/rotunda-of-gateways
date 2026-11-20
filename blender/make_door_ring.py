import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

reset()
C = 2.5  # opening centre height (Blender Z)
torus("hoop", 2.2, 0.15, (0, 0, C), "Brass", rot=(pi / 2, 0, 0), ns=72, nr=16)
torus("outer", 2.48, 0.05, (0, 0, C), "Brass", rot=(pi / 2, 0, 0), ns=72, nr=10)
for s in (-1, 1):  # bead rings on both faces of the hoop
    torus("bead", 2.2, 0.045, (0, s * 0.16, C), "Brass", rot=(pi / 2, 0, 0), ns=72, nr=8)
for k in range(16):  # radial tabs + bolt knuckles
    th = 2 * pi * k / 16 + pi / 16
    box("tab", (0.22, 0.1, 0.09), (2.375 * cos(th), 0, C + 2.375 * sin(th)), "Brass", 0.012, rot=(0, -th, 0))
    sphere("bolt", 0.045, (2.3 * cos(th), -0.075, C + 2.3 * sin(th)), "Brass", 12)
# sling-ring scrolls + knuckles on the outer ring (skip top: gem, bottom: stand)
for k in range(8):
    if k in (2, 6):
        continue
    th = 2 * pi * k / 8
    for fl in (1, -1):
        ax = th + fl * 0.09
        tube("scroll", spiral(0, 0, 0.14, 1.5, -0.045, flip=fl), 0.013, "Brass",
             loc=(2.56 * cos(ax), 0, C + 2.56 * sin(ax)))
    sphere("knuckle", 0.07, (2.58 * cos(th), -0.04, C + 2.58 * sin(th)), "Brass", 14)
# base: plinth, feet, collars cradling the ring
box("plinth", (2.7, 0.7, 0.2), (0, 0, 0.1), "Brass", 0.03)
box("plinth_top", (2.0, 0.55, 0.06), (0, 0, 0.23), "Brass", 0.02)
for s in (-1, 1):
    th = -pi / 2 + s * 0.42
    box("collar", (0.4, 0.5, 0.2), (2.4 * cos(th), 0, C + 2.4 * sin(th)), "Brass", 0.02, rot=(0, -th - pi / 2, 0))
    box("foot", (0.5, 0.7, 0.28), (s * 1.3, 0, 0.14), "Brass", 0.03)
finish("door_ring", view=(0.45, -0.85, 0.25))
