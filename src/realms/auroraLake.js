import * as THREE from 'three';
import { TAU, clamp, lerp, mulberry, fract, hash2, vnoise, fbm, canvasTex, spriteTex } from '../util.js';
import { followers, skyDome, starField } from '../sky.js';
import { brass, floorTex } from '../rotunda.js';
import { drift, jagged, crackTex, flicker } from './common.js';

/* 1 Aurora Lake */
export default function build(){
  const g=new THREE.Group(),r=mulberry(52);
  g.add(skyDome([[0,'#01030a'],[.35,'#041325'],[.49,'#0b2c3c'],[.5,'#02070d'],[1,'#02070d']]));g.add(starField(2200,480,2.2));
  const wood=canvasTex(512,512,(c,w,h)=>{c.fillStyle='#2b1a10';c.fillRect(0,0,w,h);for(let i=0;i<40;i++){c.fillStyle='rgba('+(50+r()*30|0)+',30,18,.6)';c.fillRect(0,i*h/40,w,h/40-3);}for(let i=0;i<30;i++){c.strokeStyle='rgba(0,0,0,.3)';c.beginPath();c.moveTo(r()*w,0);c.lineTo(r()*w,h);c.stroke();}});
  const pier=new THREE.Mesh(new THREE.CylinderGeometry(9.6,9.6,.7,56),new THREE.MeshStandardMaterial({map:wood,roughness:.8}));pier.position.y=-.35;g.add(pier);
  for(let i=0;i<28;i++){const a=i/28*TAU,p=new THREE.Mesh(new THREE.BoxGeometry(.16,1.1,.16),new THREE.MeshStandardMaterial({color:0x1e130c}));p.position.set(Math.cos(a)*9.3,.55,Math.sin(a)*9.3);g.add(p);}
  const rail=new THREE.Mesh(new THREE.TorusGeometry(9.3,.06,6,96),new THREE.MeshStandardMaterial({color:0x2a190e}));rail.rotation.x=Math.PI/2;rail.position.y=1.1;g.add(rail);
  const post=new THREE.Mesh(new THREE.CylinderGeometry(.08,.1,3.4,8),new THREE.MeshStandardMaterial({color:0x1e130c}));post.position.set(-4,1.7,-3);g.add(post);
  const lamp=new THREE.Mesh(new THREE.SphereGeometry(.16,14,14),new THREE.MeshBasicMaterial({color:0xffc880}));lamp.position.set(-4,3.5,-3);g.add(lamp);
  const lampL=new THREE.PointLight(0xffc880,1.3,18,1.6);lampL.position.set(-4,3.4,-3);g.add(lampL);
  const water=new THREE.Mesh(new THREE.PlaneGeometry(900,900),new THREE.MeshStandardMaterial({color:0x04101c,transparent:true,opacity:.88,depthWrite:false,roughness:.1,metalness:.6}));
  water.rotation.x=-Math.PI/2;water.position.y=-.3;water.renderOrder=-1;g.add(water);
  const T={value:0},mirror=new THREE.Group();mirror.scale.y=-1;mirror.position.y=-.6;
  const AVS='varying vec2 vUv;uniform float uTime,uOff;void main(){vUv=uv;vec3 p=position;p.z+=sin(p.x*.035+uTime*.35+uOff)*16.+sin(p.x*.09+uTime*.6)*4.;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}';
  const AFS='varying vec2 vUv;uniform float uTime,uOff,uK;uniform vec3 uA,uB;void main(){float v=vUv.y;float rays=.55+.45*sin(vUv.x*60.+uTime*.8+uOff*3.)*sin(vUv.x*23.-uTime*.5);float fade=smoothstep(0.,.12,v)*pow(1.-v,1.3)*smoothstep(0.,.2,vUv.x)*smoothstep(1.,.8,vUv.x);vec3 c=mix(uA,uB,v);gl_FragColor=vec4(c*rays*fade*uK,1.);}';
  [[-100,0,[.1,1,.55],[.45,.2,1]],[-130,2,[.2,1,.8],[.8,.3,1]],[-165,4,[.1,.9,.5],[.3,.6,1]],[-85,6,[.4,1,.7],[.9,.4,.9]]].forEach(c=>{
    [false,true].forEach(m=>{
      const mat=new THREE.ShaderMaterial({uniforms:{uTime:T,uOff:{value:c[1]},uK:{value:m?.55:1.5},uA:{value:new THREE.Vector3(...c[2])},uB:{value:new THREE.Vector3(...c[3])}},vertexShader:AVS,fragmentShader:AFS,transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,fog:false});
      const mesh=new THREE.Mesh(new THREE.PlaneGeometry(240,36,120,1),mat);mesh.position.set(0,26,c[0]);mesh.frustumCulled=false;(m?mirror:g).add(mesh);
    });
  });
  g.add(mirror);
  for(let i=0;i<70;i++){const a=Math.PI*(1.12+r()*.76),d=95+r()*60,h=7+r()*13,t=new THREE.Mesh(new THREE.ConeGeometry(h*.25,h,7),new THREE.MeshBasicMaterial({color:0x02070a}));t.position.set(Math.cos(a)*d,h/2-1,Math.sin(a)*d);g.add(t);}
  g.add(new THREE.HemisphereLight(0x4a7a9a,0x02060a,.5));
  const moon=new THREE.DirectionalLight(0x9fbfff,.4);moon.position.set(20,30,10);g.add(moon);
  const flies=drift(70,{sx:34,h:5,sz:34,y0:.4,vy:.15,sway:1.2,size:.2,color:0x9dffb8,add:true});g.add(flies.points);
  return {group:g,fog:{color:0x04101a,density:.0035},bg:0x04101a,spawn:{x:0,z:3,yaw:0},gateZ:8.2,bounds:8.9,update:(t,dt)=>{T.value=t;flies.update(t,dt);flicker(lampL,1.3,t,1);}};
}
