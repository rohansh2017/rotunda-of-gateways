import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *
from common import _add

reset()
# pillars: 0.5 x 0.7 x 5.1 at x=+-1.75 with base block, capital, and 3 flutes front and back
for s in (-1, 1):
    x = s * 1.75
    shaft = box("pillar", (0.5, 0.7, 4.6), (x, 0, 2.5), "Stone", 0.012)
    cs = []
    for fx in (-0.14, 0, 0.14):
        for fy in (-0.35, 0.35):
            c = cyl("flute", 0.05, 3.9, (x + fx, fy, 2.5), "Stone", 12)
            cs.append(c)
    cut(shaft, cs)
    xo = s * 1.78  # base/capital grow outward only so the opening stays x in [-1.5, 1.5]
    box("base", (0.56, 0.8, 0.2), (xo, 0, 0.1), "Stone", 0.015)
    box("base2", (0.53, 0.75, 0.1), (s * 1.765, 0, 0.25), "Stone", 0.012)
    box("cap1", (0.53, 0.75, 0.1), (s * 1.765, 0, 4.85), "Stone", 0.012)
    box("cap2", (0.56, 0.8, 0.15), (xo, 0, 4.975), "Stone", 0.015)
# lintel beam 4.5 x 0.8 x 0.7 centred z=4.75
box("lintel", (4.5, 0.8, 0.7), (0, 0, 4.75), "Stone", 0.015)
box("lintel_lip", (4.4, 0.84, 0.05), (0, 0, 4.425), "Stone", 0.01)  # lower moulding
box("cornice1", (4.62, 0.88, 0.06), (0, 0, 5.04), "Stone", 0.012)  # cornice
box("cornice2", (4.54, 0.84, 0.05), (0, 0, 4.975), "Stone", 0.01)
# RuneBand: thin panel inlaid in the front face; its front face carries clean 0..1 UVs
W, H, Z = 3.9, 0.44, 4.74
bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0)
bmesh.ops.scale(bm, vec=(W, 0.04, H), verts=bm.verts)
bmesh.ops.translate(bm, vec=(0, -0.40 - 0.01 + 0.02 - 0.0, Z), verts=bm.verts)  # front face at y=-0.41
uvl = bm.loops.layers.uv.new("UVMap")
for f in bm.faces:
    for l in f.loops:
        v = l.vert.co
        if f.normal.y < -0.5:
            l[uvl].uv = ((v.x + W / 2) / W, (v.z - (Z - H / 2)) / H)
        else:
            l[uvl].uv = (0.0, 0.0)
_add("runeband", bm, "RuneBand", 0.0)
# brass cap 4.9 x 0.18 x 0.95 on top
box("brass_cap", (4.9, 0.95, 0.18), (0, 0, 5.19), "Brass", 0.02)
# low step in front: 4.3 x 1.3 x 0.12, top at z=0.12, centred y=-0.35
box("step", (4.3, 1.3, 0.12), (0, -0.35, 0.06), "Stone", 0.012)
finish("door_lintel", view=(0.45, -0.85, 0.25))
