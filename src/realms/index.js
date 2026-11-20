import * as THREE from 'three';
import { REALMS, previewTex } from './catalog.js';
import { buildGate } from '../portal.js';
import { followers } from '../sky.js';
import snowPeak from './snowPeak.js';
import auroraLake from './auroraLake.js';
import iceCavern from './iceCavern.js';
import darkDimension from './darkDimension.js';
import desertDusk from './desertDusk.js';
import emberCanyon from './emberCanyon.js';
import neonRooftop from './neonRooftop.js';
import nebulaDais from './nebulaDais.js';
import mirrorDimension from './mirrorDimension.js';

const BUILDERS = [snowPeak, auroraLake, iceCavern, darkDimension, desertDusk, emberCanyon, neonRooftop, nebulaDais, mirrorDimension];
const ENV_CACHE = {};

/* Builds a realm the first time it is visited into its own scene (with its own sky followers) and caches it. */
export function getEnv(i){
  if(ENV_CACHE[i])return ENV_CACHE[i];
  const n=followers.length,e=BUILDERS[i]();
  e.followers=followers.splice(n);
  e.scene=new THREE.Scene();e.scene.background=new THREE.Color(e.bg);e.scene.fog=new THREE.FogExp2(e.fog.color,e.fog.density);e.scene.add(e.group);
  const gate=buildGate(0,REALMS[i].accent,previewTex(9),{floorRing:false,sparks:150});
  gate.group.scale.setScalar(.8);gate.group.position.set(0,0,e.gateZ);gate.group.lookAt(0,0,0);
  e.group.add(gate.group);e.group.updateMatrixWorld(true);
  e.gate=gate;e.prevZ=1;ENV_CACHE[i]=e;return e;
}
