import * as THREE from 'three';
import { TAU, clamp, lerp, mulberry, fract, hash2, vnoise, fbm, canvasTex, spriteTex } from '../util.js';
import { followers, skyDome, starField } from '../sky.js';
import { brass, floorTex } from '../rotunda.js';
import { drift, jagged, crackTex, flicker } from './common.js';

/* 5 Ember Canyon */
export default function build(){
  const g=new THREE.Group(),r=mulberry(96);
  g.add(skyDome([[0,'#120402'],[.45,'#6a2208'],[.49,'#c4521a'],[.5,'#1a0804'],[1,'#1a0804']]));
  const ct=crackTex.clone();ct.needsUpdate=true;ct.wrapS=ct.wrapT=THREE.RepeatWrapping;ct.repeat.set(2,16);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(26,260),new THREE.MeshStandardMaterial({color:0x3e1c10,roughness:1,emissive:0xffffff,emissiveMap:ct,emissiveIntensity:.55}));
  floor.rotation.x=-Math.PI/2;floor.position.z=-60;g.add(floor);
  for(let side=-1;side<=1;side+=2){
    for(let k=0;k<30;k++){
      const w=8+r()*7,h=22+r()*30,d=11,x=side*(9.6+w/2+r()*2);
      const geo=jagged(new THREE.BoxGeometry(w,h,d,3,8,3),4,.22,k+side*9);
      const col=new THREE.Color().setHSL(.04+r()*.03,.6,.18+r()*.1);
      const m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:col,roughness:1,flatShading:true}));
      m.position.set(x,h/2-1,-150+k*9);g.add(m);
    }
  }
  const post=new THREE.MeshStandardMaterial({color:0x2a160e,roughness:.9});
  const flames=[];
  [4,-14,-32,-50,-68,-86].forEach((z,i)=>{
    [-1,1].forEach(s=>{
      const p=new THREE.Mesh(new THREE.CylinderGeometry(.1,.14,2.4,6),post);p.position.set(s*6.4,1.2,z);g.add(p);
      const f=new THREE.Mesh(new THREE.SphereGeometry(.22,10,10),new THREE.MeshBasicMaterial({color:0xff9a3a}));f.position.set(s*6.4,2.6,z);g.add(f);
    });
    const l=new THREE.PointLight(0xff7a2a,1.5,24,1.4);l.position.set(0,3,z);g.add(l);flames.push([l,i]);
  });
  for(let i=0;i<10;i++){
    const s=new THREE.Mesh(new THREE.PlaneGeometry(.25,6+r()*8),new THREE.MeshBasicMaterial({color:0xff6a1c,transparent:true,opacity:.8,blending:THREE.AdditiveBlending,depthWrite:false}));
    s.rotation.x=-Math.PI/2;s.rotation.z=(r()-.5)*.6;s.position.set((r()-.5)*10,.04,-r()*80);g.add(s);
  }
  g.add(new THREE.HemisphereLight(0xff9a5a,0x2a0c04,.4));
  const em=drift(800,{sx:30,h:32,sz:170,y0:0,vy:2.2,sway:.6,size:.16,color:0xff8a3a,add:true});em.points.position.z=-60;g.add(em.points);
  const clampFn=p=>{p.x=clamp(p.x,-7.2,7.2);p.z=clamp(p.z,-100,12.6);};
  return {group:g,fog:{color:0x2a0e05,density:.018},bg:0x2a0e05,spawn:{x:0,z:7.5,yaw:0},gateZ:11.5,clamp:clampFn,update:(t,dt)=>{em.update(t,dt);flames.forEach(f=>flicker(f[0],1.5,t,f[1]));}};
}
