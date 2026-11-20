import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

reset()
D = 0.25  # half depth


def inner(t):  # opening curve, right side (x>=0): exactly the spec
    return (1.6 * (1 - t ** 1.6), 3.0 + 2.0 * t)


def outer(t):  # same curve scaled to 4.1 wide, 5.55 tall (starts at jamb top z=3.0)
    return (2.05 * (1 - t ** 1.6), 3.0 + 2.55 * t)


def shrink(pts, g):
    cx = sum(p[0] for p in pts) / len(pts); cz = sum(p[1] for p in pts) / len(pts)
    out = []
    for x, z in pts:
        dx, dz = x - cx, z - cz; L = math.hypot(dx, dz) or 1
        out.append((x - dx / L * g, z - dz / L * g))
    return out


def seg(t0, t1, n=5, mirror=False):
    a = [inner(t0 + (t1 - t0) * i / n) for i in range(n + 1)]
    b = [outer(t0 + (t1 - t0) * i / n) for i in range(n + 1)]
    p = a + b[::-1]
    return [(-x, z) for x, z in p[::-1]] if mirror else p


# --- mortar core, slightly inside the stone so the joints are dark rather than see-through
ts = [i / 40 for i in range(41)]
R_out = [(2.0 * (1 - t ** 1.6), 3.0 + 2.5 * t) for t in ts]
R_in = [(1.64 * (1 - t ** 1.6), 3.0 + 2.04 * t) for t in ts]
poly = [(-2.0, 0.0)] + [(-x, z) for x, z in R_out] + R_out[::-1][1:] + [(2.0, 0.0), (1.64, 0.0)] \
    + R_in + [(-x, z) for x, z in R_in[::-1]][1:] + [(-1.64, 0.0)]
extrude_xz("mortar", poly, -0.13, 0.13, (0, 0, 0), "Stone", 0.0)

# --- jamb ashlar courses: staggered heights, alternating front depth (back flush)
hs = [0.42, 0.58, 0.45, 0.55, 0.5, 0.5]
for s in (-1, 1):
    z = 0.0
    for i, h in enumerate(hs):
        dep = 0.5 if (i + (s > 0)) % 2 == 0 else 0.46
        box("ashlar", (0.45 - 0.016, dep, h - 0.016), (s * 1.825, D - dep / 2, z + h / 2), "Stone", 0.012)
        z += h

# --- voussoirs (6 per side) and keystone
edges = [0, .14, .28, .42, .56, .70, .84]
for s in (1, -1):
    for a, b in zip(edges, edges[1:]):
        p = shrink(seg(a, b, mirror=(s < 0)), 0.008)
        extrude_xz("vous", p, -D, D, (0, 0, 0), "Stone", 0.012)
rin = [inner(0.84 + 0.16 * i / 6) for i in range(7)]
rout = [outer(0.84 + 0.16 * i / 6) for i in range(7)]
kp = rin[:-1] + [(0.0, 5.0)] + [(-x, z) for x, z in rin[-2::-1]] + [(-x, z) for x, z in rout[:-1]] \
    + [(0.0, 5.55)] + rout[-2::-1]
kp = shrink(kp, 0.008)
extrude_xz("keystone", kp, -D - 0.02, D, (0, 0, 0), "Stone", 0.015)

# --- brass bases at the foot of each jamb (0.5 x 0.3 x 0.7, centred x=+-2.05)
for s in (-1, 1):
    box("brass_base", (0.5, 0.3, 0.7), (s * 2.05, -0.25, 0.35), "Brass", 0.025)
    box("brass_cap", (0.56, 0.36, 0.05), (s * 2.05, -0.25, 0.72), "Brass", 0.015)
finish("door_arch", view=(0.45, -0.85, 0.25))
