import * as THREE from 'three';
import { TAU, clamp, lerp, mulberry, fract, hash2, vnoise, fbm, canvasTex, spriteTex } from '../util.js';
import { followers, skyDome, starField } from '../sky.js';
import { brass, floorTex } from '../rotunda.js';
import { drift, jagged, crackTex, flicker } from './common.js';

/* 0 Snow Peak */
export default function build(){
  const g=new THREE.Group(),r=mulberry(41);
  g.add(skyDome([[0,'#5b8bd0'],[.4,'#a4c4e8'],[.49,'#f6dccb'],[.5,'#eef2f8'],[1,'#e4ebf4']]));
  const ground=new THREE.Mesh(new THREE.CylinderGeometry(26,26,1.2,72),new THREE.MeshStandardMaterial({color:0xf2f6fb,roughness:.95}));ground.position.y=-.6;g.add(ground);
  const pave=new THREE.Mesh(new THREE.CircleGeometry(7,48),new THREE.MeshStandardMaterial({color:0x757b88,roughness:.9}));pave.rotation.x=-Math.PI/2;pave.position.y=.02;g.add(pave);
  const pr=new THREE.Mesh(new THREE.TorusGeometry(7,.1,6,72),brass);pr.rotation.x=Math.PI/2;pr.position.y=.06;g.add(pr);
  for(let i=0;i<18;i++){
    const rad=11+r()*20,h=22+r()*34,a=i/18*TAU+r()*.3,dist=75+r()*70;
    const geo=jagged(new THREE.ConeGeometry(rad,h,7,6),rad*.5,.12,i*3.1);
    const p=geo.attributes.position,c=new Float32Array(p.count*3);
    for(let k=0;k<p.count;k++){const t=(p.getY(k)+h/2)/h,snow=t>.42+(vnoise(p.getX(k)*.2,p.getZ(k)*.2)-.5)*.2;c[k*3]=snow?.97:.34;c[k*3+1]=snow?.98:.35;c[k*3+2]=snow?1:.42;}
    geo.setAttribute('color',new THREE.BufferAttribute(c,3));
    const m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:1}));
    m.position.set(Math.cos(a)*dist,h/2-3,Math.sin(a)*dist);g.add(m);
  }
  const red=new THREE.MeshStandardMaterial({color:0xb3321f,roughness:.6});
  [-2.8,2.8].forEach(x=>{const p=new THREE.Mesh(new THREE.CylinderGeometry(.34,.4,6.2,16),red);p.position.set(x,3.1,-12);g.add(p);});
  const b1=new THREE.Mesh(new THREE.BoxGeometry(8.4,.5,.7),red);b1.position.set(0,6.1,-12);g.add(b1);
  const b2=new THREE.Mesh(new THREE.BoxGeometry(6.4,.3,.4),red);b2.position.set(0,5.2,-12);g.add(b2);
  const cap=new THREE.Mesh(new THREE.BoxGeometry(9.4,.25,1),new THREE.MeshStandardMaterial({color:0x1a1a1f,roughness:.8}));cap.position.set(0,6.5,-12);g.add(cap);
  for(let i=0;i<30;i++){
    const a=r()*TAU,d=13+r()*11,s=.8+r()*1.8;
    const tr=new THREE.Group();tr.position.set(Math.cos(a)*d,0,Math.sin(a)*d);
    const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.12*s,.18*s,1*s,6),new THREE.MeshStandardMaterial({color:0x3a2a20}));trunk.position.y=.5*s;
    const c1=new THREE.Mesh(new THREE.ConeGeometry(1.1*s,2.6*s,8),new THREE.MeshStandardMaterial({color:0x1f4a36,roughness:.9}));c1.position.y=2*s;
    const c2=new THREE.Mesh(new THREE.ConeGeometry(.75*s,1.8*s,8),new THREE.MeshStandardMaterial({color:0xeef4f8,roughness:.9}));c2.position.y=3.3*s;
    tr.add(trunk,c1,c2);g.add(tr);
  }
  for(let i=0;i<10;i++){const a=r()*TAU,d=9+r()*15,rk=new THREE.Mesh(new THREE.DodecahedronGeometry(.5+r()*1.2),new THREE.MeshStandardMaterial({color:0x7c828d,roughness:1,flatShading:true}));rk.position.set(Math.cos(a)*d,.2,Math.sin(a)*d);g.add(rk);}
  g.add(new THREE.HemisphereLight(0xcfe3ff,0xe8eef6,.9));
  const sun=new THREE.DirectionalLight(0xfff0d6,1.3);sun.position.set(-30,22,-26);g.add(sun);
  const snow=drift(1800,{sx:70,h:30,sz:70,y0:0,vy:-2.4,sway:.8,size:.13,color:0xffffff,opacity:.9});g.add(snow.points);
  return {group:g,fog:{color:0xdfe9f3,density:.011},bg:0xdfe9f3,spawn:{x:0,z:11,yaw:0},gateZ:17.5,bounds:20,update:(t,dt)=>snow.update(t,dt)};
}
