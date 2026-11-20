import { loadModels } from './models.js';

/* the rotunda and doors are built synchronously on import, so the models must be in memory first */
loadModels().then(() => import('./main.js'));
