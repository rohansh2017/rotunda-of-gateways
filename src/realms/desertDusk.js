import * as THREE from 'three';
import { TAU, clamp, lerp, mulberry, fract, hash2, vnoise, fbm, canvasTex, spriteTex } from '../util.js';
import { followers, skyDome, starField } from '../sky.js';
import { brass, floorTex } from '../rotunda.js';
import { drift, jagged, crackTex, flicker } from './common.js';

/* 4 Desert Dusk */
export default function build(){
  const g=new THREE.Group(),r=mulberry(85);
  g.add(skyDome([[0,'#241446'],[.3,'#5a2a6a'],[.44,'#e0683f'],[.499,'#ffb868'],[.5,'#c9743f'],[1,'#7d3a24']]));
  const sunG=new THREE.Group();followers.push(sunG);g.add(sunG);
  const halo=new THREE.Mesh(new THREE.PlaneGeometry(260,260),new THREE.MeshBasicMaterial({map:spriteTex,color:0xffc07a,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}));
  halo.position.set(-60,26,-380);const disc=new THREE.Mesh(new THREE.CircleGeometry(20,40),new THREE.MeshBasicMaterial({color:0xfff1c9,fog:false}));disc.position.set(-60,26,-379);
  sunG.add(halo,disc);
  const N=170,geo=new THREE.PlaneGeometry(700,700,N,N);geo.rotateX(-Math.PI/2);
  const p=geo.attributes.position,c=new Float32Array(p.count*3);
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),z=p.getZ(i),d=Math.hypot(x,z),k=clamp((d-18)/40,0,1),s=k*k*(3-2*k);
    const h=(Math.pow(fbm(x*.011,z*.013,4),1.5)*44+fbm(x*.05,z*.05,2)*2.4)*s;
    p.setY(i,h-.05*(1-s));
    const t=clamp(h/22+(vnoise(x*.2,z*.2)-.5)*.25,0,1);
    c[i*3]=lerp(.66,.93,t);c[i*3+1]=lerp(.34,.66,t);c[i*3+2]=lerp(.2,.4,t);
  }
  geo.setAttribute('color',new THREE.BufferAttribute(c,3));geo.computeVertexNormals();
  g.add(new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1})));
  const sand=new THREE.MeshStandardMaterial({color:0xb98a62,roughness:.95,flatShading:true});
  for(let i=0;i<11;i++){const a=i/11*TAU+r()*.3,d=11+r()*5,h=2.5+r()*5;const pl=new THREE.Mesh(jagged(new THREE.CylinderGeometry(.6,.75,h,10,4),.25,1.2,i),sand);pl.position.set(Math.cos(a)*d,h/2,Math.sin(a)*d);g.add(pl);}
  [-3,3].forEach(x=>{const pl=new THREE.Mesh(new THREE.CylinderGeometry(.7,.85,8,12),sand);pl.position.set(x,4,-10);g.add(pl);});
  const lin=new THREE.Mesh(new THREE.BoxGeometry(8.4,1,1.6),sand);lin.position.set(0,8.5,-10);g.add(lin);
  const fall=new THREE.Mesh(new THREE.CylinderGeometry(.7,.7,6,12),sand);fall.rotation.z=Math.PI/2;fall.position.set(6,.7,-5);g.add(fall);
  for(let i=0;i<14;i++){const a=r()*TAU,d=7+r()*13,b=new THREE.Mesh(new THREE.DodecahedronGeometry(.3+r()*.9),sand);b.position.set(Math.cos(a)*d,.1,Math.sin(a)*d);g.add(b);}
  g.add(new THREE.HemisphereLight(0xffc08a,0x6a3a2a,.85));
  const sun=new THREE.DirectionalLight(0xff9a55,1.5);sun.position.set(-60,30,-380).normalize().multiplyScalar(100);g.add(sun);
  const dust=drift(520,{sx:70,h:12,sz:70,y0:.2,vy:.1,sway:3,size:.15,color:0xffd7a8,opacity:.55});g.add(dust.points);
  return {group:g,fog:{color:0xd88a5a,density:.007},bg:0xd88a5a,spawn:{x:0,z:12,yaw:0},gateZ:19,bounds:20.5,update:(t,dt)=>dust.update(t,dt)};
}
