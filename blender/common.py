"""Shared Blender helpers for the Rotunda of Gateways assets (Blender 5.x)."""
import bpy, bmesh, math, os, sys, random
from math import pi, sin, cos, radians
from mathutils import Vector, Matrix

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS = os.path.join(ROOT, "src", "models")
DOCS = os.path.join(ROOT, "docs", "blender")
BLEND = os.path.join(ROOT, "blender")


def lin(h):
    c = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return [(x / 12.92 if x <= .04045 else ((x + .055) / 1.055) ** 2.4) for x in c] + [1.0]


MATS = {
    "Brass": dict(c="#b8893a", m=.85, r=.35),
    "DarkWood": dict(c="#2a1912", r=.7),
    "Stone": dict(c="#3a2a22", r=.6, m=.25),
    "RuneBand": dict(c="#241a16", r=.65, m=.2),
    "Leather": dict(c="#5a2418", r=.55),
    "Paper": dict(c="#e8dcc0", r=.9),
    "Glass": dict(c="#ffffff", r=.05, a=.25),
    "Glow": dict(c="#ffffff", r=.5, e=3.0),
    "Book1": dict(c="#27465c", r=.6),
    "Book2": dict(c="#3b5a2c", r=.6),
    "Book3": dict(c="#8a6a22", r=.6),
}


def mat(name):
    m = bpy.data.materials.get(name)
    if m:
        return m
    d = MATS[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = lin(d["c"])
    b.inputs["Metallic"].default_value = d.get("m", 0.0)
    b.inputs["Roughness"].default_value = d["r"]
    if "a" in d:
        b.inputs["Alpha"].default_value = d["a"]
        m.blend_method = "BLEND"  # exporter -> alphaMode BLEND
        if hasattr(m, "surface_render_method"):
            m.surface_render_method = "BLENDED"
    if "e" in d:
        b.inputs["Emission Color"].default_value = (1, 1, 1, 1)
        b.inputs["Emission Strength"].default_value = d["e"]
    m.diffuse_color = lin(d["c"])
    return m


# ---------------------------------------------------------------- scene
OBJS, CUTS = [], {}


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    OBJS.clear(); CUTS.clear()


def _add(name, bm, m, bev=0.0, loc=(0, 0, 0), rot=(0, 0, 0)):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me); bm.free()
    me.materials.append(mat(m))
    o = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(o)
    o.location, o.rotation_euler = loc, rot
    o["bev"] = bev
    OBJS.append(o)
    return o


def _fin(bm):
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    return bm


def box(name, size, loc, m, bev=0.01, rot=(0, 0, 0)):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=size, verts=bm.verts)
    return _add(name, bm, m, bev, loc, rot)


def cyl(name, r, h, loc, m, seg=32, r2=None, bev=0.0, rot=(0, 0, 0)):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=seg,
                          radius1=r, radius2=r if r2 is None else r2, depth=h)
    return _add(name, bm, m, bev, loc, rot)


def sphere(name, r, loc, m, seg=24, scale=(1, 1, 1)):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=seg // 2, radius=r)
    bmesh.ops.scale(bm, vec=scale, verts=bm.verts)
    return _add(name, bm, m, 0, loc)


def torus(name, R, r, loc, m, rot=(0, 0, 0), ns=64, nr=12):
    bm = bmesh.new(); rows = []
    for i in range(ns):
        a = 2 * pi * i / ns
        rows.append([bm.verts.new(((R + r * cos(b)) * cos(a), (R + r * cos(b)) * sin(a), r * sin(b)))
                     for b in (2 * pi * j / nr for j in range(nr))])
    for i in range(ns):
        for j in range(nr):
            bm.faces.new((rows[i][j], rows[i][(j + 1) % nr], rows[(i + 1) % ns][(j + 1) % nr], rows[(i + 1) % ns][j]))
    return _add(name, _fin(bm), m, 0, loc, rot)


def lathe(name, prof, loc, m, seg=48, bev=0.0, rot=(0, 0, 0)):
    """prof = [(r, z), ...]; start and end should have r=0 for a closed solid."""
    bm = bmesh.new(); rows = []
    for r, z in prof:
        rows.append([bm.verts.new((r * cos(2 * pi * k / seg), r * sin(2 * pi * k / seg), z)) for k in range(seg)])
    for p in range(len(prof) - 1):
        for k in range(seg):
            bm.faces.new((rows[p][k], rows[p][(k + 1) % seg], rows[p + 1][(k + 1) % seg], rows[p + 1][k]))
    bmesh.ops.remove_doubles(bm, verts=bm.verts[:], dist=1e-5)
    return _add(name, _fin(bm), m, bev, loc, rot)


def extrude_xz(name, pts, y0, y1, loc, m, bev=0.01):
    """Polygon pts [(x,z)] extruded along Y from y0..y1."""
    bm = bmesh.new()
    f = bm.faces.new([bm.verts.new((x, y0, z)) for x, z in pts])
    ex = bmesh.ops.extrude_face_region(bm, geom=[f])
    vs = [e for e in ex["geom"] if isinstance(e, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, vec=(0, y1 - y0, 0), verts=vs)
    return _add(name, _fin(bm), m, bev, loc)


def tube(name, pts, r, m, cyclic=False, res=3, loc=(0, 0, 0), rot=(0, 0, 0)):
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"; cu.bevel_depth = r; cu.bevel_resolution = res; cu.use_fill_caps = True
    sp = cu.splines.new("POLY"); sp.points.add(len(pts) - 1)
    for p, c in zip(sp.points, pts):
        p.co = (c[0], c[1], c[2], 1)
    sp.use_cyclic_u = cyclic
    cu.materials.append(mat(m))
    o = bpy.data.objects.new(name, cu)
    bpy.context.scene.collection.objects.link(o)
    o.location, o.rotation_euler = loc, rot
    o["bev"] = 0.0
    OBJS.append(o)
    return o


def between(name, p1, p2, r1, r2, m, seg=16, bev=0.0):
    p1, p2 = Vector(p1), Vector(p2)
    d = p2 - p1
    o = cyl(name, r1, d.length, (p1 + p2) / 2, m, seg, r2, bev)
    o.rotation_euler = d.to_track_quat("Z", "Y").to_euler()
    return o


def spiral(cx, cz, r0, turns, y, pts=24, flip=1, a0=0):
    """Scroll curve points in the XZ plane (for tube())."""
    out = []
    for i in range(pts):
        t = i / (pts - 1); a = a0 + flip * turns * 2 * pi * t; r = r0 * (1 - .85 * t)
        out.append((cx + r * cos(a), y, cz + r * sin(a)))
    return out


def cut(o, cutters):
    CUTS.setdefault(o.name, []).extend(cutters)
    for c in cutters:
        if c in OBJS:
            OBJS.remove(c)
    return o


def group_xform(objs, M):
    for o in objs:
        o.matrix_basis = M @ o.matrix_basis


# ---------------------------------------------------------------- finish
def _realize(o, dg):
    me = bpy.data.meshes.new_from_object(o.evaluated_get(dg))
    me.transform(o.matrix_basis)
    n = bpy.data.objects.new(o.name, me)
    bpy.context.scene.collection.objects.link(n)
    return n


def build(name, smooth=35):
    """Apply booleans/bevels, join everything into one object `name`, shade smooth by angle."""
    cutters = [c for v in CUTS.values() for c in v]
    for o in OBJS:
        for c in CUTS.get(o.name, []):
            md = o.modifiers.new("Cut", "BOOLEAN"); md.object = c; md.operation = "DIFFERENCE"; md.solver = "EXACT"
        if o.get("solid", 0) > 0:
            md = o.modifiers.new("Solid", "SOLIDIFY"); md.thickness = o["solid"]; md.offset = 0
        if o.get("bev", 0) > 0:
            md = o.modifiers.new("Bevel", "BEVEL")
            md.width = o["bev"]; md.segments = 2; md.limit_method = "ANGLE"; md.angle_limit = radians(35)
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    new = [_realize(o, dg) for o in OBJS]
    for o in OBJS + cutters:
        bpy.data.objects.remove(o)
    first = new[0]
    with bpy.context.temp_override(active_object=first, object=first, selected_editable_objects=new, selected_objects=new):
        bpy.ops.object.join()
    first.name = first.data.name = name
    me = first.data
    for p in me.polygons:
        p.use_smooth = True
    bm = bmesh.new(); bm.from_mesh(me)
    ang = radians(smooth)
    for e in bm.edges:
        e.smooth = e.is_manifold and e.calc_face_angle(0) < ang
    bm.to_mesh(me); bm.free()
    bpy.ops.object.select_all(action="DESELECT")
    first.select_set(True); bpy.context.view_layer.objects.active = first
    OBJS.clear(); CUTS.clear()
    return first


def stats(o):
    me = o.data; me.calc_loop_triangles()
    z = [v.co for v in me.vertices]
    return len(me.loop_triangles), [min(v[i] for v in z) for i in range(3)], [max(v[i] for v in z) for i in range(3)]


def export(o, name):
    os.makedirs(MODELS, exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT"); o.select_set(True)
    bpy.context.view_layer.objects.active = o
    bpy.ops.export_scene.gltf(
        filepath=os.path.join(MODELS, name + ".glb"), export_format="GLB", use_selection=True,
        export_apply=True, export_yup=True, export_cameras=False, export_lights=False,
        export_draco_mesh_compression_enable=False, export_materials="EXPORT",
        export_normals=True, export_texcoords=True, export_animations=False)


def render(o, name, view=(0.65, -0.75, 0.32), res=800, dist_mul=1.08):
    sc = bpy.context.scene
    tri, lo, hi = stats(o)
    c = (Vector(lo) + Vector(hi)) / 2
    R = (Vector(hi) - Vector(lo)).length / 2
    bm = bmesh.new(); bmesh.ops.create_circle(bm, cap_ends=True, segments=64, radius=R * 3)
    me = bpy.data.meshes.new("ground"); bm.to_mesh(me); bm.free()
    g = bpy.data.objects.new("ground", me); sc.collection.objects.link(g)
    gm = bpy.data.materials.new("ground"); gm.use_nodes = True
    gb = gm.node_tree.nodes["Principled BSDF"]
    gb.inputs["Base Color"].default_value = (.16, .16, .18, 1); gb.inputs["Roughness"].default_value = .9
    me.materials.append(gm); g.location.z = lo[2] - 0.002
    w = bpy.data.worlds.new("w"); sc.world = w; w.use_nodes = True
    bg = w.node_tree.nodes["Background"]; bg.inputs[0].default_value = (.30, .32, .36, 1); bg.inputs[1].default_value = 1.0

    def light(kind, loc, energy, size):
        l = bpy.data.lights.new("L", kind); l.energy = energy
        if kind == "SUN":
            l.angle = radians(8)
        else:
            l.size = size
        ob = bpy.data.objects.new("L", l); sc.collection.objects.link(ob)
        ob.location = loc; ob.rotation_euler = (c - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    light("SUN", c + Vector((4, -5, 8)) * R / 3, 4.0, 0)
    light("AREA", c + Vector((-5, -4, 3)) * R / 3, 600 * R * R / 9, R * 2)
    light("AREA", c + Vector((0, 6, 4)) * R / 3, 300 * R * R / 9, R * 2)
    cam = bpy.data.cameras.new("cam"); cam.lens = 50
    co = bpy.data.objects.new("cam", cam); sc.collection.objects.link(co); sc.camera = co
    fov = 2 * math.atan(18 / 50)
    co.location = c + Vector(view).normalized() * (R / math.sin(fov / 2)) * dist_mul
    co.rotation_euler = (c - co.location).to_track_quat("-Z", "Y").to_euler()
    sc.render.resolution_x = sc.render.resolution_y = res
    sc.view_settings.view_transform = "Standard"
    if os.environ.get("RENDER") == "workbench":
        sc.render.engine = "BLENDER_WORKBENCH"; sc.display.shading.color_type = "MATERIAL"
    else:
        sc.render.engine = "BLENDER_EEVEE"; sc.eevee.taa_render_samples = 32
    os.makedirs(DOCS, exist_ok=True)
    sc.render.filepath = os.path.join(DOCS, name + ".png")
    bpy.ops.render.render(write_still=True)


def finish(name, view=(0.65, -0.75, 0.32), dist_mul=1.08):
    o = build(name)
    export(o, name)
    tri, lo, hi = stats(o)
    print("STATS", name, "tris", tri, "min", [round(x, 3) for x in lo], "max", [round(x, 3) for x in hi])
    render(o, name, view, dist_mul=dist_mul)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(BLEND, name + ".blend"))
    return o
