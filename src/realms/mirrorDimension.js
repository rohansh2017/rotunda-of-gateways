import * as THREE from 'three';
import { TAU, clamp, lerp, mulberry, fract, hash2, vnoise, fbm, canvasTex, spriteTex } from '../util.js';
import { followers, skyDome, starField } from '../sky.js';
import { brass, floorTex } from '../rotunda.js';
import { drift, jagged, crackTex, flicker } from './common.js';

/* 8 Mirror Dimension */
export default function build(){
  const g=new THREE.Group(),r=mulberry(129);
  g.add(skyDome([[0,'#1a0a40'],[.4,'#8a2a9a'],[.499,'#e0359e'],[.5,'#10c8c0'],[1,'#0a2a4a']]));
  const chk=canvasTex(512,512,(c,w,h)=>{for(let y=0;y<8;y++)for(let x=0;x<8;x++){c.fillStyle=(x+y)%2?'#16062e':'#0f9d96';c.fillRect(x*w/8,y*h/8,w/8,h/8);}},{repeat:[50,50]});
  const fl=new THREE.Mesh(new THREE.CircleGeometry(300,64),new THREE.MeshStandardMaterial({map:chk,roughness:.15,metalness:.6}));fl.rotation.x=-Math.PI/2;g.add(fl);
  const rings=[];
  for(let k=0;k<5;k++){
    const grp=new THREE.Group(),n=12+k*4;
    for(let i=0;i<n;i++){
      const a=i/n*TAU,d=36+k*20+r()*6,s=6+r()*9,hue=(.78+r()*.25+k*.03)%1;
      const cm=new THREE.Color().setHSL(hue,.8,.55);
      const m=new THREE.Mesh(new THREE.BoxGeometry(s,s,s),new THREE.MeshStandardMaterial({color:cm,emissive:cm,emissiveIntensity:.25,transparent:true,opacity:.5,roughness:.1,metalness:.8,flatShading:true,side:THREE.DoubleSide}));
      m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry),new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.6})));
      m.position.set(Math.cos(a)*d,5+r()*38,Math.sin(a)*d);m.rotation.set(r()*3,r()*3,r()*3);grp.add(m);
    }
    g.add(grp);rings.push([grp,(k%2?-1:1)*(.02+k*.008)]);
  }
  const man=[[30,0x4ff0e0],[46,0xff4fd8],[62,0x4ff0e0],[78,0xff9af0]].map((c,i)=>{
    const m=new THREE.Mesh(new THREE.RingGeometry(c[0],c[0]+1.6,i%2?6:48,1),new THREE.MeshBasicMaterial({color:c[1],transparent:true,opacity:.5,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,depthWrite:false,fog:false}));
    m.rotation.x=Math.PI/2;m.position.y=75+i*2;g.add(m);return [m,(i%2?-1:1)*(.1+i*.03)];
  });
  g.add(new THREE.HemisphereLight(0xd070ff,0x08706a,.75));
  const dl=new THREE.DirectionalLight(0xffffff,.8);dl.position.set(30,50,20);g.add(dl);
  const lm=new THREE.PointLight(0xff3fd0,1.8,55,1.2),lc=new THREE.PointLight(0x30f0ff,1.8,55,1.2);g.add(lm,lc);
  return {group:g,fog:{color:0x240b48,density:.006},bg:0x240b48,spawn:{x:0,z:12,yaw:0},gateZ:19,bounds:20,update:(t,dt)=>{
    rings.forEach(o=>{o[0].rotation.y+=dt*o[1];o[0].children.forEach((m,i)=>{m.rotation.x+=dt*.1*(1+i%3);m.rotation.y+=dt*.12;});});
    man.forEach(o=>{o[0].rotation.z+=dt*o[1];});
    lm.position.set(Math.cos(t*.5)*14,6,Math.sin(t*.5)*14);lc.position.set(Math.cos(t*.5+Math.PI)*14,6,Math.sin(t*.5+Math.PI)*14);
  }};
}
