# Rotunda of Gateways

An interactive three.js scene inspired by Doctor Strange's Sanctum. You stand in a circular rotunda with three magical doors; each door can lead to one of three realms (nine realms in total) and you can walk through to explore them.

## Run

```
npm install
npm run dev           # dev server
npm run build         # production build in dist/
npm run build:single  # one self-contained dist-single/index.html
npm run check         # headless Edge smoke test (fps, draw calls, screenshots in shots/)
```

## Controls

- WASD / arrow keys: walk; Shift: run
- Drag: look around
- Click a door, or press 1-3: select it
- `[` / `]`: cycle the realm behind the selected door
- Enter: step through
- O: orbit view

## Source map (`src/`)

- `main.js` - renderer, camera, input, UI, travel between scenes
- `util.js` - math/noise helpers and canvas texture helpers
- `sky.js` - sky dome and followers
- `rotunda.js` - the rotunda room and its per-frame update
- `portal.js` - portal/gate geometry and shaders
- `doors.js` - the three doors and their state
- `style.css` - page and HUD styling
- `realms/catalog.js` - realm definitions and preview textures
- `realms/common.js` - helpers shared by realm builders
- `realms/index.js` - builds each realm's environment (`getEnv`)
- `realms/<name>.js` - one builder per realm: snowPeak, auroraLake, iceCavern, darkDimension, desertDusk, emberCanyon, neonRooftop, nebulaDais, mirrorDimension

`reference/original-artifact.html` is the original single-file version.
