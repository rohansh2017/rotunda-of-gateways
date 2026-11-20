// Usage: node blender/validate_glb.mjs [files...]  (default: all public/models/*.glb)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "models");
const files = process.argv.length > 2 ? process.argv.slice(2) : fs.readdirSync(dir).filter(f => f.endsWith(".glb")).map(f => path.join(dir, f));
let total = 0;
for (const f of files) {
  const b = fs.readFileSync(f);
  if (b.readUInt32LE(0) !== 0x46546c67) throw new Error(f + ": not a GLB");
  const len = b.readUInt32LE(12);
  const j = JSON.parse(b.toString("utf8", 20, 20 + len));
  let tris = 0, lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9], verts = 0, uv = false;
  for (const m of j.meshes) for (const p of m.primitives) {
    tris += j.accessors[p.indices].count / 3;
    const pa = j.accessors[p.attributes.POSITION];
    verts += pa.count; uv ||= "TEXCOORD_0" in p.attributes;
    for (let i = 0; i < 3; i++) { lo[i] = Math.min(lo[i], pa.min[i]); hi[i] = Math.max(hi[i], pa.max[i]); }
  }
  total += b.length;
  const r = a => a.map(x => +x.toFixed(3));
  console.log(`${path.basename(f)}  ${(b.length / 1024).toFixed(0)} KB  meshes=${j.meshes.map(m => m.name)}  prims=${j.meshes.flatMap(m => m.primitives).length}  verts=${verts}  tris=${tris}  uv=${uv}`);
  console.log(`  bbox(glTF Y-up) min=${r(lo)} max=${r(hi)}`);
  console.log(`  materials: ${(j.materials || []).map(m => m.name + (m.alphaMode && m.alphaMode !== "OPAQUE" ? `[${m.alphaMode}]` : "") + (m.emissiveFactor ? "[emissive]" : "")).join(", ")}`);
}
console.log(`TOTAL ${(total / 1024).toFixed(0)} KB`);
