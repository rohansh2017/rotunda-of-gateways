import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

reset()
CZ = 0.85
lathe("base", [(0, 0), (0.32, 0), (0.32, 0.03), (0.3, 0.06), (0.22, 0.09), (0.12, 0.14), (0.06, 0.2), (0.07, 0.3), (0.045, 0.4),
               (0.035, 0.8), (0, 0.8)], (0, 0, 0), "DarkWood", 32, 0.003)
torus("base_ring", 0.3, 0.012, (0, 0, 0.055), "Brass", ns=40, nr=8)
for k in range(3):  # splayed wooden legs up to the horizon ring
    a = pi / 2 + 2 * pi * k / 3
    between("leg", (0.2 * cos(a), 0.2 * sin(a), 0.1), (0.5 * cos(a), 0.5 * sin(a), 0.84), 0.03, 0.02, "DarkWood", 12)
lathe("horizon", [(0.46, 0.82), (0.56, 0.82), (0.56, 0.86), (0.46, 0.86), (0.46, 0.82)], (0, 0, 0), "DarkWood", 64, 0.004)
torus("horizon_brass", 0.47, 0.008, (0, 0, 0.865), "Brass", ns=64, nr=8)
# armillary rings, built around the origin then tilted 23.5 deg and lifted to CZ
r = []
r.append(torus("equator", 0.38, 0.014, (0, 0, 0), "Brass", ns=64, nr=8))
r.append(torus("merid1", 0.38, 0.014, (0, 0, 0), "Brass", rot=(pi / 2, 0, 0), ns=64, nr=8))
r.append(torus("merid2", 0.38, 0.014, (0, 0, 0), "Brass", rot=(pi / 2, 0, pi / 2), ns=64, nr=8))
r.append(torus("ecliptic", 0.4, 0.012, (0, 0, 0), "Brass", rot=(radians(23.5), 0, 0), ns=64, nr=8))
for z in (-0.22, 0.22):
    r.append(torus("tropic", math.sqrt(0.38 ** 2 - z * z), 0.009, (0, 0, z), "Brass", ns=48, nr=6))
r.append(between("axis", (0, 0, -0.54), (0, 0, 0.54), 0.012, 0.012, "Brass", 12))
r.append(cyl("cap_top", 0.03, 0.04, (0, 0, 0.56), "Brass", 12, r2=0.008))
r.append(cyl("cap_bot", 0.03, 0.04, (0, 0, -0.56), "Brass", 12, r2=0.008, rot=(pi, 0, 0)))
r.append(sphere("core", 0.07, (0, 0, 0), "Glow", 16))
for k in range(4):  # little planet beads on the equator
    a = 2 * pi * k / 4 + 0.4
    r.append(sphere("bead", 0.028, (0.38 * cos(a), 0.38 * sin(a), 0), "Brass", 10))
group_xform(r, Matrix.Translation((0, 0, CZ)) @ Matrix.Rotation(radians(23.5), 4, "Y"))
sphere("joint", 0.045, (0, 0, 0.8), "Brass", 12)
finish("prop_globe", view=(0.65, -0.75, 0.3))
