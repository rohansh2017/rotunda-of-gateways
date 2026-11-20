import * as THREE from 'three';
import { TAU, clamp, lerp, mulberry, fract, hash2, vnoise, fbm, canvasTex, spriteTex } from './util.js';
import { rotunda, R, onWall } from './rotunda.js';
import { REALMS, previewTex } from './realms/catalog.js';
import { buildGate } from './portal.js';

const DOOR_DEFS=[
  {name:'Ring of Sparks',shape:0,angle:210},
  {name:'Ashen Arch',    shape:1,angle:270},
  {name:'Runed Lintel',  shape:2,angle:330}
];
const doors=DOOR_DEFS.map((def,i)=>{
  const realms=[];REALMS.forEach((r,k)=>{if(r.door===i)realms.push(k);});
  const gate=buildGate(def.shape,REALMS[realms[0]].accent,previewTex(realms[0]));
  const p=onWall(def.angle,R-.1);gate.group.position.copy(p);gate.group.lookAt(0,0,0);
  rotunda.add(gate.group);
  gate.group.traverse(o=>{o.userData.door=i;if(o.isMesh&&o.material.isMeshStandardMaterial)o.castShadow=true;});
  const d={i,def,gate,realms,choice:0,hover:0,sel:0,selected:false,trans:null,prevZ:1,
    realmIndex(){return realms[d.choice];},
    setChoice(k){
      if(k===d.choice)return;
      gate.u.uTexA.value=previewTex(realms[d.choice]);gate.u.uTexB.value=previewTex(realms[k]);gate.u.uMix.value=0;
      d.trans={t:0};d.choice=k;gate.setAccent(REALMS[realms[k]].accent);
    },
    update(t,dt,hovered){
      d.hover=lerp(d.hover,hovered?1:0,1-Math.exp(-dt*8));
      d.sel=lerp(d.sel,d.selected?1:0,1-Math.exp(-dt*6));
      gate.u.uHover.value=d.hover;gate.u.uSel.value=d.sel;
      if(d.trans){d.trans.t+=dt/.9;const e=clamp(d.trans.t,0,1);gate.u.uMix.value=e*e*(3-2*e);
        if(d.trans.t>=1){gate.u.uTexA.value=gate.u.uTexB.value;gate.u.uMix.value=1;d.trans=null;}}
      gate.update(t,dt,Math.max(d.hover*.6,d.sel));
    }
  };
  return d;
});
rotunda.updateMatrixWorld(true);
const doorGroups=doors.map(d=>d.gate.group);


export { DOOR_DEFS, doors, doorGroups };
