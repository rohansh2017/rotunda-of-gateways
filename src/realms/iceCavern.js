import * as THREE from 'three';
import { TAU, clamp, lerp, mulberry, fract, hash2, vnoise, fbm, canvasTex, spriteTex } from '../util.js';
import { followers, skyDome, starField } from '../sky.js';
import { brass, floorTex } from '../rotunda.js';
import { drift, jagged, crackTex, flicker } from './common.js';

/* 2 Ice Cavern */
export default function build(){
  const g=new THREE.Group(),r=mulberry(63);
  const shell=jagged(new THREE.IcosahedronGeometry(26,3),9,.09,4);
  const sm=new THREE.Mesh(shell,new THREE.MeshStandardMaterial({color:0x7fc6e6,roughness:.25,metalness:.1,flatShading:true,side:THREE.BackSide,emissive:0x0a2a40}));sm.position.y=6;g.add(sm);
  const fl=new THREE.Mesh(new THREE.CircleGeometry(25.5,64),new THREE.MeshStandardMaterial({color:0x9fd8f0,roughness:.12,metalness:.3,emissive:0x061a28}));fl.rotation.x=-Math.PI/2;g.add(fl);
  const cm=new THREE.MeshStandardMaterial({color:0x7fe3ff,emissive:0x1b7ca6,emissiveIntensity:.7,transparent:true,opacity:.88,flatShading:true,roughness:.1});
  for(let i=0;i<46;i++){
    const a=r()*TAU,d=7+r()*17,h=3+r()*7,cr=new THREE.Mesh(new THREE.ConeGeometry(.5+r()*.9,h,5),cm);
    cr.position.set(Math.cos(a)*d,h/2-.3,Math.sin(a)*d);cr.rotation.set((r()-.5)*.5,r()*TAU,(r()-.5)*.5);g.add(cr);
  }
  for(let i=0;i<34;i++){
    const a=r()*TAU,d=r()*20,len=4+r()*7,top=6+Math.sqrt(Math.max(1,676-d*d)),st=new THREE.Mesh(new THREE.ConeGeometry(.5+r()*.7,len,6),cm);
    st.rotation.x=Math.PI;st.position.set(Math.cos(a)*d,top-len/2+.5,Math.sin(a)*d);g.add(st);
  }
  g.add(new THREE.HemisphereLight(0x7ac8ee,0x0b3550,.6));
  const pls=[[0x66e0ff,-10,4,-8],[0x4a8cff,11,5,-6],[0x7affea,0,5,-16],[0x5ab0ff,-13,3,6],[0x9a9aff,12,4,4]].map(c=>{const l=new THREE.PointLight(c[0],1.4,24,1.4);l.position.set(c[1],c[2],c[3]);g.add(l);return l;});
  const sp=drift(300,{sx:40,h:20,sz:40,y0:0,vy:.15,sway:.4,size:.11,color:0xc8f4ff,add:true});g.add(sp.points);
  return {group:g,fog:{color:0x0b2f48,density:.02},bg:0x0b2f48,spawn:{x:0,z:8,yaw:0},gateZ:14.2,bounds:15,update:(t,dt)=>{sp.update(t,dt);pls.forEach((l,i)=>{l.intensity=1.3+.35*Math.sin(t*1.3+i*1.7);});}};
}
