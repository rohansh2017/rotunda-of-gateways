import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *
from common import _add

reset()
# wooden base with mouldings (0..0.5)
box("foot", (1.04, 0.64, 0.1), (0, 0, 0.05), "DarkWood", 0.012)
box("body", (0.96, 0.56, 0.32), (0, 0, 0.26), "DarkWood", 0.01)
box("body_panel", (0.7, 0.02, 0.2), (0, -0.285, 0.26), "DarkWood", 0.006)
box("mould", (1.04, 0.64, 0.08), (0, 0, 0.46), "DarkWood", 0.012)
box("mould_brass", (1.0, 0.6, 0.02), (0, 0, 0.51), "Brass", 0.006)
# brass frame (0.5..2.0)
for sx in (-1, 1):
    for sy in (-1, 1):
        box("post", (0.045, 0.045, 1.42), (sx * 0.46, sy * 0.26, 1.23), "Brass", 0.008)
        sphere("finial", 0.035, (sx * 0.46, sy * 0.26, 1.96), "Brass", 12)
for z in (0.55, 1.92):
    for sy in (-1, 1):
        box("rail_x", (0.96, 0.04, 0.04), (0, sy * 0.26, z), "Brass", 0.006)
    for sx in (-1, 1):
        box("rail_y", (0.04, 0.48, 0.04), (sx * 0.46, 0, z), "Brass", 0.006)
box("top", (1.0, 0.6, 0.06), (0, 0, 1.97), "DarkWood", 0.01)
box("top_brass", (0.8, 0.4, 0.03), (0, 0, 2.0), "Brass", 0.006)
# glass panes
gz, gh = 1.235, 1.32
box("gl_f", (0.87, 0.01, gh), (0, -0.26, gz), "Glass", 0.0)
box("gl_b", (0.87, 0.01, gh), (0, 0.26, gz), "Glass", 0.0)
for sx in (-1, 1):
    box("gl_s", (0.01, 0.47, gh), (sx * 0.46, 0, gz), "Glass", 0.0)
# display stand: brass disc, rod, shoulder bar
cyl("stand_base", 0.16, 0.03, (0, 0.03, 0.535), "Brass", 28, bev=0.006)
cyl("rod", 0.014, 1.26, (0, 0.03, 1.15), "Brass", 12)
cyl("bar", 0.012, 0.62, (0, 0.03, 1.76), "Brass", 10, rot=(0, pi / 2, 0))
for sx in (-1, 1):
    sphere("bar_end", 0.022, (sx * 0.31, 0.03, 1.76), "Brass", 10)
# draped cloak: 2D grid with folds, then solidified
nu, nv = 28, 24
bm = bmesh.new(); g = []
for j in range(nv + 1):
    v = j / nv; row = []
    for i in range(nu + 1):
        u = i / nu * 2 - 1
        fold = 0.03 * v * sin(5 * pi * u + 0.6) + 0.015 * v * sin(11 * pi * u)
        x = u * (0.22 + 0.14 * v)
        y = 0.03 - 0.07 * v * (1 - 0.5 * abs(u)) + fold
        z = 1.74 - 0.9 * v - 0.07 * u * u * (1 - v) - 0.02 * v * cos(5 * pi * u + 0.6)
        row.append(bm.verts.new((x, y, z)))
    g.append(row)
for j in range(nv):
    for i in range(nu):
        bm.faces.new((g[j][i], g[j][i + 1], g[j + 1][i + 1], g[j + 1][i]))
cl = _add("cloak", bm, "Leather", 0.0)
cl["solid"] = 0.012
# collar, clasp and Eye-of-Agamotto style amulet on chains
cyl("collar", 0.075, 0.1, (0, 0.03, 1.74), "Leather", 20, r2=0.095, bev=0.004)
torus("clasp", 0.04, 0.008, (0, -0.045, 1.66), "Brass", rot=(pi / 2, 0, 0), ns=24, nr=8)
torus("amulet", 0.07, 0.014, (0, -0.095, 1.45), "Brass", rot=(pi / 2, 0, 0), ns=36, nr=8)
sphere("eye", 0.04, (0, -0.095, 1.45), "Glow", 14, scale=(1, 0.45, 1))
for sx in (-1, 1):
    between("chain", (sx * 0.2, 0.0, 1.76), (sx * 0.01, -0.09, 1.52), 0.005, 0.005, "Brass", 6)
    sphere("pin", 0.014, (sx * 0.2, 0.0, 1.76), "Brass", 8)
finish("prop_relic_case", view=(0.55, -0.8, 0.2))
