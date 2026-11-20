// Report screenshots -> docs/media/*.png (1600x900) + contact-sheet.png.   node tools/media.mjs
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import { mkdirSync, readdirSync, writeFileSync, rmSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const OUT = 'docs/media';
mkdirSync(OUT, { recursive: true });
const server = await createServer({ server: { port: 5303, strictPort: true } });
await server.listen();
const browser = await chromium.launch({ channel: 'msedge', args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
page.on('pageerror', e => console.log('[pageerror]', e.message));
await page.goto('http://localhost:5303/');
await page.waitForFunction(() => window.__rotunda, null, { timeout: 30000 });

const idle = async () => { // not travelling, fade overlay gone, then let lights/portals settle
  await page.waitForFunction(() => !window.__rotunda.state.busy && !document.querySelector('#fade.on'));
  await page.waitForTimeout(1200);
};
const shot = async name => { await idle(); await page.screenshot({ path: `${OUT}/${name}.png` }); console.log(name); };
// stand `dist` m in front of the door at wall angle `deg` (or at the spawn point), look at `yaw`/`pitch`
const stand = (x, z, yaw, pitch = 0) => page.evaluate(([x, z, yaw, pitch]) => {
  const P = window.__rotunda.player; P.pos.set(x, 1.7, z); P.vel.set(0, 0, 0); P.yaw = yaw; P.pitch = pitch;
}, [x, z, yaw, pitch]);
const atDoor = (deg, dist) => { const a = deg * Math.PI / 180, dx = Math.cos(a), dz = Math.sin(a); return stand(dx * (9.5 - dist), dz * (9.5 - dist), Math.atan2(-dx, -dz), 0.04); };
const spawn = async () => { await page.keyboard.press('Escape'); await stand(0, 5.5, 0); };

await page.waitForTimeout(1500);
await shot('rotunda-overview');
await stand(0, 5.5, 1.3, 0.05); await shot('rotunda-props');
await atDoor(210, 4); await shot('door-ring');
await atDoor(270, 4); await shot('door-arch');
await atDoor(330, 4); await shot('door-lintel');
await spawn();
await page.keyboard.press('o'); await page.mouse.move(800, 300); await page.mouse.down(); await page.mouse.move(800, 400, { steps: 10 }); await page.mouse.up();
await shot('rotunda-orbit');
await page.keyboard.press('o'); await spawn();
await page.keyboard.press('1'); await page.waitForTimeout(1500); await shot('realm-picker');
await spawn(); await page.waitForTimeout(500);
await page.keyboard.press('f'); await page.waitForTimeout(1500); await shot('fps-overlay'); await page.keyboard.press('f');

const realms = await page.evaluate(() => window.__rotunda.REALMS.map(r => r.name));
for (let ri = 0; ri < realms.length; ri++) {
  await page.evaluate(ri => { const R = window.__rotunda, d = R.doors[R.REALMS[ri].door]; d.choice = d.realms.indexOf(ri); R.travel('env', R.REALMS[ri].door); }, ri);
  await page.waitForTimeout(300); await shot('realm-' + realms[ri].toLowerCase().replace(/\s+/g, '-'));
  await page.evaluate(() => window.__rotunda.travel('rotunda')); await page.waitForTimeout(300); await idle();
}

// contact sheet: every other PNG in a 6-column grid
const files = readdirSync(OUT).filter(f => f.endsWith('.png') && f !== 'contact-sheet.png');
const sheet = await browser.newPage({ viewport: { width: 1920, height: 600 } });
writeFileSync(`${OUT}/_sheet.html`, `<body style="margin:0;background:#120b08;display:grid;grid-template-columns:repeat(6,1fr);gap:8px;padding:8px">${files.map(f =>
  `<figure style="margin:0;position:relative"><img src="${pathToFileURL(process.cwd() + '/' + OUT + '/' + f).href}" style="width:100%;display:block"><figcaption style="position:absolute;left:0;bottom:0;right:0;font:12px monospace;color:#e8d9b4;background:#000a;padding:2px 6px">${f.replace('.png', '')}</figcaption></figure>`).join('')}</body>`);
await sheet.goto(pathToFileURL(process.cwd() + `/${OUT}/_sheet.html`).href);
await sheet.waitForFunction(() => [...document.images].every(i => i.complete));
await sheet.screenshot({ path: `${OUT}/contact-sheet.png`, fullPage: true });
rmSync(`${OUT}/_sheet.html`);
await browser.close(); await server.close(); process.exit(0);
