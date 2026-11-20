import * as THREE from 'three';
import { TAU, clamp, lerp, mulberry, fract, hash2, vnoise, fbm, canvasTex, spriteTex } from '../util.js';
import { followers, skyDome, starField } from '../sky.js';
import { brass, floorTex } from '../rotunda.js';
import { drift, jagged, crackTex, flicker } from './common.js';

/* 3 Dark Dimension */
export default function build(){
  const g=new THREE.Group(),r=mulberry(74);
  g.add(skyDome([[0,'#0b0102'],[.45,'#4a0b08'],[.49,'#8a2208'],[.5,'#2a0403'],[1,'#2a0403']]));
  const slab=new THREE.Mesh(new THREE.CylinderGeometry(13,10,1.4,8),new THREE.MeshStandardMaterial({color:0x1b1210,roughness:.9,emissive:0xffffff,emissiveMap:crackTex,emissiveIntensity:.8}));slab.position.y=-.7;g.add(slab);
  const top=new THREE.Mesh(new THREE.CircleGeometry(13,8),new THREE.MeshStandardMaterial({color:0x1a1210,roughness:.9,emissive:0xffffff,emissiveMap:crackTex,emissiveIntensity:.9}));top.rotation.x=-Math.PI/2;top.rotation.z=Math.PI/8;top.position.y=.01;g.add(top);
  const LFS=['varying vec2 vP;uniform float uTime;',
    'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
    'float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}',
    'float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p*=2.03;a*=.5;}return v;}',
    'void main(){float n=fbm(vP*.05+vec2(uTime*.03,0.));n+=fbm(vP*.11-vec2(0.,uTime*.045))*.6;n*=.7;float l=smoothstep(.3,.75,n);vec3 c=mix(vec3(.12,.02,.01),vec3(1.,.33,.05),l);c+=vec3(1.,.75,.2)*smoothstep(.62,.8,n);gl_FragColor=vec4(c,1.);}'].join('\n');
  const LT={value:0};
  const lava=new THREE.Mesh(new THREE.PlaneGeometry(1000,1000),new THREE.ShaderMaterial({uniforms:{uTime:LT},vertexShader:'varying vec2 vP;void main(){vP=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:LFS}));
  lava.rotation.x=-Math.PI/2;lava.position.y=-2;g.add(lava);
  const rocks=[];
  for(let i=0;i<30;i++){
    const a=r()*TAU,d=20+r()*80,s=1+r()*5,m=new THREE.Mesh(jagged(new THREE.DodecahedronGeometry(s,1),s*.5,.4,i),new THREE.MeshStandardMaterial({color:0x1c1412,roughness:1,flatShading:true,emissive:0x2a0804}));
    m.position.set(Math.cos(a)*d,3+r()*32,Math.sin(a)*d);g.add(m);rocks.push({m,y:m.position.y,ph:r()*TAU,sp:.3+r()*.5});
  }
  const rings=[[60,0xff5a2a],[46,0xff9a3a],[32,0xff3a1a]].map((c,i)=>{
    const rg=new THREE.Mesh(new THREE.RingGeometry(c[0],c[0]+2.2,72,1),new THREE.MeshBasicMaterial({color:c[1],transparent:true,opacity:.55,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,depthWrite:false,fog:false}));
    rg.position.set(0,50,-150-i*4);g.add(rg);
    const sp=new THREE.Mesh(new THREE.TorusGeometry(c[0]*.7,.5,4,i+5),new THREE.MeshBasicMaterial({color:c[1],transparent:true,opacity:.45,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}));
    sp.position.copy(rg.position);g.add(sp);return [rg,sp,i%2?1:-1];
  });
  g.add(new THREE.HemisphereLight(0x6a2418,0x1a0503,.5));
  const l1=new THREE.PointLight(0xff6a28,1.5,34,1.4);l1.position.set(0,3,0);g.add(l1);
  const l2=new THREE.PointLight(0xff3a18,1.2,30,1.4);l2.position.set(-8,2,-6);g.add(l2);
  const em=drift(520,{sx:70,h:42,sz:70,y0:-2,vy:3,sway:.5,size:.18,color:0xff8a3a,add:true});g.add(em.points);
  return {group:g,fog:{color:0x240504,density:.012},bg:0x240504,spawn:{x:0,z:5,yaw:0},gateZ:10.5,bounds:11.2,update:(t,dt)=>{
    LT.value=t;em.update(t,dt);flicker(l1,1.5,t,2);
    rocks.forEach(o=>{o.m.position.y=o.y+Math.sin(t*o.sp+o.ph)*1.2;o.m.rotation.y+=dt*.1;});
    rings.forEach(o=>{o[0].rotation.z+=dt*.05*o[2];o[1].rotation.z-=dt*.08*o[2];});
  }};
}
