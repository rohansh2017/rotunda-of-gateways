import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

reset()
prof = [(0, 0), (0.30, 0), (0.30, 0.04), (0.27, 0.07), (0.2, 0.09), (0.09, 0.14), (0.075, 0.2), (0.095, 0.27), (0.075, 0.34),
        (0.07, 0.5), (0.07, 0.8), (0.09, 0.84), (0.075, 0.88), (0.12, 0.92), (0.12, 0.98), (0, 0.98)]
lathe("column", prof, (0, 0, 0), "DarkWood", 40, 0.004)
torus("ring_base", 0.27, 0.012, (0, 0, 0.075), "Brass", ns=40, nr=8)
torus("ring_mid", 0.085, 0.012, (0, 0, 0.265), "Brass", ns=32, nr=8)
torus("ring_top", 0.12, 0.012, (0, 0, 0.93), "Brass", ns=32, nr=8)
# desk assembly in desk-local space, tilted 22 degrees (back higher)
parts = []
parts.append(box("desk", (0.74, 0.5, 0.05), (0, 0, 0), "DarkWood", 0.008))
parts.append(box("ledge", (0.74, 0.04, 0.07), (0, -0.24, 0.045), "DarkWood", 0.008))
parts.append(box("ledge_brass", (0.742, 0.012, 0.012), (0, -0.262, 0.078), "Brass", 0.003))
parts.append(box("backrail", (0.74, 0.03, 0.05), (0, 0.235, 0.04), "DarkWood", 0.006))
parts.append(box("cover", (0.62, 0.4, 0.02), (0, 0.0, 0.035), "Leather", 0.004))
parts.append(box("pg_l", (0.28, 0.34, 0.03), (-0.145, 0.0, 0.06), "Paper", 0.003, rot=(0, 0.07, 0)))
parts.append(box("pg_r", (0.28, 0.34, 0.03), (0.145, 0.0, 0.06), "Paper", 0.003, rot=(0, -0.07, 0)))
for sx in (-1, 1):
    for sy in (-1, 1):
        parts.append(box("corner", (0.05, 0.05, 0.024), (sx * 0.305, sy * 0.195, 0.036), "Brass", 0.004))
group_xform(parts, Matrix.Translation((0, 0, 1.03)) @ Matrix.Rotation(radians(22), 4, "X"))
box("wedge", (0.2, 0.12, 0.1), (0, 0.0, 0.99), "DarkWood", 0.006)
# brass candle holder on an arm to the right
between("arm", (0.1, 0, 0.87), (0.5, 0, 0.87), 0.014, 0.014, "Brass", 12)
between("arm_up", (0.5, 0, 0.87), (0.5, 0, 1.0), 0.014, 0.014, "Brass", 12)
lathe("dish", [(0, 0), (0.09, 0), (0.1, 0.015), (0.06, 0.03), (0.03, 0.035), (0.03, 0.07), (0.045, 0.085), (0.0, 0.085)],
      (0.5, 0, 1.0), "Brass", 24)
cyl("candle", 0.022, 0.17, (0.5, 0, 1.15), "Paper", 16, bev=0.002)
sphere("flame", 0.014, (0.5, 0, 1.265), "Glow", 10, scale=(1, 1, 2.0))
finish("prop_lectern", view=(0.65, -0.75, 0.25))
