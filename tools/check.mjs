// Smoke test: serves the app with Vite, opens it in the installed Edge (GPU on),
// visits the rotunda and all nine realms, records console errors and frame rate,
// and writes screenshots to shots/.
//   node tools/check.mjs            -> dev server
//   node tools/check.mjs --dist     -> serve the production build in dist/
import { createServer, preview } from 'vite';
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const useDist = process.argv.includes('--dist');
const only = process.argv.find(a => a.startsWith('--only='))?.slice(7);
mkdirSync('shots', { recursive: true });

const server = useDist ? await preview({ preview: { port: 4174 } }) : await createServer({ server: { port: 5199 } });
if (!useDist) await server.listen();
const url = useDist ? 'http://localhost:4174/' : 'http://localhost:5199/';

const browser = await chromium.launch({
  channel: 'msedge',
  args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${m.text()}`); });
page.on('response', r => { if (r.status() >= 400) errors.push('[http] ' + r.status() + ' ' + r.url()); });
page.on('pageerror', e => errors.push('[pageerror] ' + e.message));

await page.goto(url);
await page.waitForFunction(() => window.__rotunda, null, { timeout: 30000 });
await page.waitForTimeout(1500);

const gpu = await page.evaluate(() => {
  const gl = window.__rotunda.renderer.getContext();
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
});
console.log('GPU:', gpu);

const fps = () => page.evaluate(() => new Promise(res => {
  let n = 0; const t0 = performance.now();
  const f = () => { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(f); else res(+(n * 1000 / (performance.now() - t0)).toFixed(1)); };
  requestAnimationFrame(f);
}));
const stats = () => page.evaluate(() => { const i = window.__rotunda.renderer.info; return `${i.render.calls} draws, ${(i.render.triangles / 1000).toFixed(0)}k tris, ${i.programs.length} programs`; });
const waitIdle = () => page.waitForFunction(() => !window.__rotunda.state.busy, null, { timeout: 60000 });

const results = [];
if (!only || only === 'rotunda') {
  await page.screenshot({ path: 'shots/rotunda.png' });
  results.push(['Rotunda', await fps(), await stats()]);
}

const realms = await page.evaluate(() => window.__rotunda.REALMS.map(r => r.name));
for (let ri = 0; ri < realms.length; ri++) {
  if (only && !realms[ri].toLowerCase().includes(only.toLowerCase())) continue;
  await page.evaluate(ri => {
    const R = window.__rotunda, door = R.REALMS[ri].door, d = R.doors[door];
    d.choice = d.realms.indexOf(ri);
    R.travel('env', door);
  }, ri);
  await page.waitForTimeout(200); await waitIdle(); await page.waitForTimeout(800);
  const file = 'shots/realm-' + realms[ri].toLowerCase().replace(/\s+/g, '-') + '.png';
  await page.screenshot({ path: file });
  results.push([realms[ri], await fps(), await stats()]);
  await page.evaluate(() => window.__rotunda.travel('rotunda')); await page.waitForTimeout(200); await waitIdle();
}

console.table(results.map(([name, f, s]) => ({ name, fps: f, stats: s })));
console.log(errors.length ? 'CONSOLE:\n' + errors.join('\n') : 'No console errors or warnings.');
await browser.close();
await (useDist ? server.httpServer.close() : server.close());
process.exit(errors.some(e => e.startsWith('[pageerror]') || e.startsWith('[error]')) ? 1 : 0);
