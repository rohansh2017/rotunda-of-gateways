// Records a scripted demo video of the app -> video/rotunda-demo-720p.mp4 (or -1080p.mp4)
//   node tools/record.mjs [--quick] [--1080] [--only=<segment id>] [--port=5299]
// Deterministic: playwright's page.clock fakes performance.now / rAF / setTimeout and is stepped
// 1000/FPS ms per captured frame; every frame is screenshotted, then encoded with ffmpeg-static.
// CSS transitions (the travel fade) ignore the fake clock, so they are paused and driven by hand each step.
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import ffmpeg from 'ffmpeg-static';
import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, existsSync, copyFileSync } from 'node:fs';

const arg = n => process.argv.find(a => a === `--${n}` || a.startsWith(`--${n}=`));
const quick = !!arg('quick'), hd = !!arg('1080');
const only = arg('only')?.split('=')[1];
const port = +(arg('port')?.split('=')[1] || 5299);
const FPS = 30, W = hd ? 1920 : 1280, H = hd ? 1080 : 720, Q = quick ? 0.25 : 1;
const FR = 'video/frames';

// ---- the tour -------------------------------------------------------------------------------
// secs = target length; c = helpers: c.idle(s) c.hold(keys, s) c.look(dxPx, dyPx, s) c.key(k)
// c.go(fn) runs page code, c.until(fn) steps frames until the page predicate is true.
const tourRealm = (id, door, realm, title, sub) => ({
  id, secs: 4.5, caption: [`${door} → ${realm}`, sub],
  async run(c) {
    await c.go(([d, k]) => { const R = window.__rotunda; R.doors[d].choice = k; R.travel('env', d); }, [DOOR[door], REALM_K[realm]]);
    await c.skip(0.75);                                // rotunda fading out: hide it, start on the swapped realm
    await c.until(() => !window.__rotunda.state.busy);
    await c.look(-150, 0, 1.4); await c.look(300, 0, 1.6);
    await c.go(() => window.__rotunda.travel('rotunda'));
    await c.idle(0.7);                                 // fade to colour, then the rest happens off-camera
    await c.skip.until(() => !window.__rotunda.state.busy);
  },
});
const DOOR = { 'Ring of Sparks': 0, 'Ashen Arch': 1, 'Runed Lintel': 2 };
const REALM_K = { 'Snow Peak': 0, 'Aurora Lake': 1, 'Ice Cavern': 2, 'Dark Dimension': 0, 'Desert Dusk': 1, 'Ember Canyon': 2, 'Neon Rooftop': 0, 'Nebula Dais': 1, 'Mirror Dimension': 2 };

const SEGMENTS = [
  { id: 'title', secs: 3, caption: ['Rotunda of Gateways', 'Computer Graphics final project · a Sanctum-inspired WebGL scene'],
    async run(c) { await c.key('o'); await c.idle(3); } },
  { id: 'rotunda', secs: 15, caption: ['The rotunda', 'Procedural dome, oculus, windows and sconces + Blender-modeled props and door frames'],
    async run(c) {
      await c.key('o'); await c.idle(0.2);
      await c.face(0, 0.5, 1.2); await c.face(0.35, 0.45, 1.2); await c.face(0, 0, 1.2); // up to the dome / oculus, back level
      await c.face(-1.12, 0.05, 1.6); await c.idle(0.7);                // right: lectern + bookshelves
      await c.face(0, 0, 1.4); await c.face(1.12, 0.05, 1.6); await c.idle(0.7); // left: globe
      await c.face(1.45, 0.05, 1.0); await c.idle(0.6);                 // relic case + bookshelf
      await c.face(0.68, 0, 1.2); await c.idle(0.4);                    // Ring of Sparks frame
      await c.face(0, 0, 0.8); await c.idle(0.3);                       // Ashen Arch frame
      await c.face(-0.68, 0, 0.8); await c.idle(0.4);                   // Runed Lintel frame
      await c.face(0, 0, 0.8);
    } },
  { id: 'choose', secs: 11, caption: ['Select a door, choose where it leads', 'Keys 1–3 pick a door · [ and ] cycle its realms'],
    async run(c) {
      await c.key('2'); await c.idle(1.1); await c.key(']'); await c.idle(1.3);
      await c.key('3'); await c.idle(1.1); await c.key(']'); await c.idle(1.3);
      await c.key('1'); await c.idle(1.2);
      for (let i = 0; i < 3; i++) { await c.key(']'); await c.idle(1.4); } // Snow > Aurora > Ice > back to Snow
    } },
  { id: 'step', secs: 8, caption: ['Ring of Sparks → Snow Peak', 'Cold sun, falling snow particles, exponential fog'],
    async run(c) {
      await c.key('Enter');
      await c.until(() => window.__rotunda.state.loc === 'env' && !window.__rotunda.state.busy);
      await c.idle(0.5); await c.look(-200, 0, 1.6); await c.look(400, 0, 2); await c.look(-200, 0, 1.2);
    } },
  { id: 'return', secs: 5, caption: ['Return through the ring', 'Walking back through the gate re-enters the rotunda'],
    async run(c) {
      await c.look(-748, 0, 1.2);                     // turn around to face the return ring
      await c.hold(['Shift', 'w'], 6, () => window.__rotunda.state.busy);
      await c.until(() => !window.__rotunda.state.busy);
      await c.idle(0.3);
    } },
  tourRealm('aurora', 'Ring of Sparks', 'Aurora Lake', '', 'Night sky, shimmering aurora curtains, mirrored lake, fireflies'),
  tourRealm('ice', 'Ring of Sparks', 'Ice Cavern', '', 'Faceted ice walls, glowing crystals, drifting frost sparks'),
  tourRealm('dark', 'Ashen Arch', 'Dark Dimension', '', 'Glowing cracked rock, lava glow, rising embers'),
  tourRealm('desert', 'Ashen Arch', 'Desert Dusk', '', 'Low sun disc, dune haze, drifting dust'),
  tourRealm('ember', 'Ashen Arch', 'Ember Canyon', '', 'Canyon walls lit by flames, rising embers'),
  tourRealm('neon', 'Runed Lintel', 'Neon Rooftop', '', 'Neon signs, lit windows, moving traffic lights, rain'),
  tourRealm('nebula', 'Runed Lintel', 'Nebula Dais', '', 'Animated nebula sky shader, ringed planet, floating dais'),
  tourRealm('mirror', 'Runed Lintel', 'Mirror Dimension', '', 'Glossy checker floor, floating mirror shards'),
  { id: 'effects', secs: 8, caption: ['Effects close-up', 'Noise-warped portal shader with cross-fade · additive sparks · rune floor ring · per-door coloured light'],
    async run(c) {
      await c.key('Escape');
      await c.place(210, 3.2); await c.face(c.yaw0 + 0.1, 0.02, 4);   // Ring of Sparks: sparks + portal fill the frame
      await c.place(330, 3.4); await c.face(c.yaw0 - 0.1, 0.12, 4);   // Runed Lintel: rune band and portal
    } },
  { id: 'outro', secs: 4, caption: ['three.js r128 · Blender 5.1', '<span style="text-transform:none">Live demo: claude.ai/artifact/EGchN9THVw5VQ3Z4Af9aW7</span><br>Sri Ashitha Gadamsetty · Rohan Sharma'],
    async run(c) { await c.key('o'); await c.idle(0.8); await c.key('f'); await c.idle(2.6); await c.key('f'); } },
];

// ---- plumbing -------------------------------------------------------------------------------
const server = await createServer({ server: { port, strictPort: true, hmr: false, watch: null } });
await server.listen();
const browser = await chromium.launch({ channel: 'msedge', args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: W, height: H } });
page.on('pageerror', e => console.log('[pageerror]', e.message));
await page.clock.install({ time: 0 });
await page.goto(`http://localhost:${port}/`);
// the page starts "running" on the fake clock; step it until the app is ready
for (let i = 0; i < 600 && !(await page.evaluate(() => !!window.__rotunda)); i++) await page.clock.runFor(100);
await page.addStyleTag({ content: `
body{user-select:none}
#hint{display:none!important}
#cap{position:absolute;left:16px;top:84px;max-width:460px;padding:12px 20px 13px;background:rgba(10,6,4,.72);
 border:1px solid rgba(201,162,75,.42);backdrop-filter:blur(6px);pointer-events:none;z-index:50;transition:none;opacity:0}
#cap b{display:block;font:400 1.25rem 'Marcellus',var(--f-display,serif);letter-spacing:.2em;text-transform:uppercase;color:#e8d9b4;font-weight:400}
#cap i{display:block;margin-top:6px;font:normal .78rem var(--f-mono,monospace);letter-spacing:.1em;text-transform:uppercase;color:#b9a98a}` });
await page.evaluate(() => { const d = document.createElement('div'); d.id = 'cap'; d.innerHTML = '<b></b><i></i>'; document.body.appendChild(d); });
await page.clock.runFor(500);

const STEP = 1000 / FPS;
let vnow = 0, n = 0, capturing = true;
const step = async () => {
  await page.clock.runFor(STEP); vnow += STEP;
  // drive CSS transitions by virtual time (they otherwise run on the real clock)
  await page.evaluate(v => { for (const a of document.getAnimations()) { if (a.__v === undefined) { a.__v = v - 1; a.pause(); } a.currentTime = v - a.__v; } }, vnow);
};
const shot = async () => { await page.screenshot({ path: `${FR}/f${String(n++).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 95 }); };
const frame = async () => { await step(); if (capturing) await shot(); };
const frames = async s => { for (let i = 0, k = Math.round(s * Q * FPS); i < k; i++) await frame(); };

const c = {
  idle: frames,
  key: async k => { await page.keyboard.press(k); },
  go: (fn, a) => page.evaluate(fn, a),
  look: async (dx, dy, s) => { // pointermove deltas steer the camera; ease so the pan starts and stops softly
    const k = Math.max(1, Math.round(s * Q * FPS)), cx = W / 2, cy = H / 2, sm = x => x * x * (3 - 2 * x);
    await page.mouse.move(cx, cy); await page.mouse.down();
    for (let i = 1; i <= k; i++) { await page.mouse.move(cx + dx * sm(i / k), cy + dy * sm(i / k)); await frame(); }
    await page.mouse.up();
  },
  face: async (yaw, pitch, s) => { // set yaw/pitch directly (smoothstep from the current look direction)
    const [y0, p0] = await page.evaluate(() => [window.__rotunda.player.yaw, window.__rotunda.player.pitch]);
    const k = Math.max(1, Math.round(s * Q * FPS)), sm = x => x * x * (3 - 2 * x);
    for (let i = 1; i <= k; i++) {
      await page.evaluate(([y, p]) => { const P = window.__rotunda.player; P.yaw = y; P.pitch = p; }, [y0 + (yaw - y0) * sm(i / k), p0 + (pitch - p0) * sm(i / k)]);
      await frame();
    }
  },
  place: async (deg, dist) => { // stand `dist` m in front of the door at wall angle `deg`, facing it; c.yaw0 = that yaw
    c.yaw0 = await page.evaluate(([d, m]) => {
      const a = d * Math.PI / 180, dx = Math.cos(a), dz = Math.sin(a), P = window.__rotunda.player;
      P.pos.set(dx * (9.5 - m), 1.7, dz * (9.5 - m)); P.vel.set(0, 0, 0); P.yaw = Math.atan2(-dx, -dz); P.pitch = 0; return P.yaw;
    }, [deg, dist]);
  },
  hold: async (keys, maxS, stopFn) => {
    for (const k of keys) await page.keyboard.down(k);
    for (let i = 0, m = Math.round(maxS * Q * FPS); i < m; i++) { await frame(); if (await page.evaluate(stopFn)) break; }
    for (const k of keys) await page.keyboard.up(k);
  },
  until: async (fn, maxS = 20) => { for (let i = 0; i < maxS * FPS && !(await page.evaluate(fn)); i++) await frame(); },
  skip: async s => { capturing = false; await frames(s); capturing = true; },
};
c.skip.until = async fn => { capturing = false; await c.until(fn); capturing = true; };

rmSync(FR, { recursive: true, force: true }); mkdirSync(FR, { recursive: true });
const marks = [], t0 = Date.now(), chosen = SEGMENTS.filter(s => !only || s.id === only);
if (!chosen.length) throw new Error('no such segment: ' + SEGMENTS.map(s => s.id).join(', '));
if (only) { // standalone segment: the tour state it assumes is not set up, so only the first segments work alone
  console.log('note: --only runs the segment without its predecessors');
}
for (const s of chosen) {
  const start = n;
  await page.evaluate(([t, sub]) => { const e = document.getElementById('cap'); e.firstChild.textContent = t; e.lastChild.innerHTML = sub; e.style.opacity = 1; }, s.caption);
  await s.run(c);
  const pad = Math.round(s.secs * Q * FPS) - (n - start);
  if (pad > 0) await frames(pad / FPS / Q);
  marks.push([s.id, start, n - 1]);
  console.log(`${s.id}: ${n - start} frames`);
}
await browser.close(); await server.close();

mkdirSync('video', { recursive: true });
const out = `video/rotunda-demo-${hd ? '1080p' : '720p'}.mp4`;
const r = spawnSync(ffmpeg, ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', `${FR}/f%05d.jpg`, '-vf', `scale=${W}:${H}`,
  '-c:v', 'libx264', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: 'inherit' });
if (r.status) process.exit(r.status);
// keep two sampled frames per segment for eyeballing, then drop the rest
rmSync('video/frames-sample', { recursive: true, force: true }); mkdirSync('video/frames-sample', { recursive: true });
for (const [id, a, b] of marks) for (const [j, f] of [[0, a + 0.3 * (b - a)], [1, a + 0.75 * (b - a)]]) copyFileSync(`${FR}/f${String(Math.floor(f)).padStart(5, '0')}.jpg`, `video/frames-sample/${id}-${j}.jpg`);
rmSync(FR, { recursive: true, force: true });
console.log(`done: ${n} frames (${(n / FPS).toFixed(1)} s) -> ${out}, capture ${((Date.now() - t0) / 1000).toFixed(0)} s`);
process.exit(0);
