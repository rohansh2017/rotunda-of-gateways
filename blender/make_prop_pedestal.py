import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

reset()
prof = [(0, 0), (0.85, 0), (0.85, 0.08), (0.82, 0.1), (0.82, 0.14), (0.76, 0.17), (0.72, 0.21), (0.7, 0.26),
        (0.67, 0.3), (0.64, 0.55), (0.61, 0.85), (0.63, 0.88), (0.69, 0.92), (0.66, 0.95), (0.7, 0.98),
        (0.72, 1.0), (0.72, 1.1), (0, 1.1)]
ped = lathe("pedestal", prof, (0, 0, 0), "Stone", 64, 0.0)
cut(ped, [cyl("flute", 0.045, 0.5, (0.64 * cos(2 * pi * k / 12), 0.64 * sin(2 * pi * k / 12), 0.6), "Stone", 12) for k in range(12)])
torus("band", 0.72, 0.03, (0, 0, 1.08), "Brass", ns=64, nr=10)
torus("band_mid", 0.66, 0.02, (0, 0, 0.3), "Brass", ns=64, nr=8)
torus("band_foot", 0.82, 0.018, (0, 0, 0.12), "Brass", ns=64, nr=8)
for k in range(8):  # brass studs on the plinth
    a = 2 * pi * (k + 0.5) / 8
    sphere("stud", 0.03, (0.85 * cos(a), 0.85 * sin(a), 0.045), "Brass", 10)
finish("prop_pedestal", view=(0.65, -0.75, 0.3))
