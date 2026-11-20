import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/* Blender-made glTF models. The glob (instead of one import per file) keeps the app working if src/models is missing:
   no files -> empty map -> every user of instance() falls back to its procedural geometry. */
const URLS = import.meta.glob('./models/*.glb', { query: '?url', import: 'default', eager: true });
const models = {};

export async function loadModels() {
  const loader = new GLTFLoader();
  await Promise.all(Object.entries(URLS).map(async ([path, url]) => {
    const name = path.replace(/^.*\/|\.glb$/g, '');
    try {
      // single-file build inlines models as data: URLs; decode them here so hosts whose CSP blocks fetch(data:) still work
      const gltf = url.startsWith('data:')
        ? await new Promise((res, rej) => loader.parse(Uint8Array.from(atob(url.slice(url.indexOf(',') + 1)), c => c.charCodeAt(0)).buffer, '', res, rej))
        : await loader.loadAsync(url);
      models[name] = gltf.scene;
    }
    catch (err) { console.warn('model "' + name + '" failed to load, using procedural fallback:', err); }
  }));
}

/* fresh clone of a loaded model (materials shared with the original), or null if it is not available */
export const instance = name => (models[name] ? models[name].clone(true) : null);
