"""Run every generator headless: python blender/build_all.py [blender.exe]"""
import subprocess, sys, os
here = os.path.dirname(os.path.abspath(__file__))
exe = sys.argv[1] if len(sys.argv) > 1 else r"C:\Program Files\Blender Foundation\Blender 5.1\blender.exe"
for n in ("door_ring", "door_arch", "door_lintel", "prop_bookshelf", "prop_relic_case", "prop_lectern", "prop_pedestal", "prop_globe"):
    print("==", n, flush=True)
    subprocess.run([exe, "-b", "--factory-startup", "-P", os.path.join(here, f"make_{n}.py")], check=True, stdout=subprocess.DEVNULL)
subprocess.run(["node", os.path.join(here, "validate_glb.mjs")], check=True)
