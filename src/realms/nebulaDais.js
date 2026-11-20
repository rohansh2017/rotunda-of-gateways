import * as THREE from 'three';
import { TAU, clamp, lerp, mulberry, fract, hash2, vnoise, fbm, canvasTex, spriteTex } from '../util.js';
import { followers, skyDome, starField } from '../sky.js';
import { brass, floorTex } from '../rotunda.js';
import { drift, jagged, crackTex, flicker } from './common.js';

/* 7 Nebula Dais */
export default function build(){
  const g=new THREE.Group(),r=mulberry(118);
  const NT={value:0};
  const sky=new THREE.Mesh(new THREE.SphereGeometry(520,48,32),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:{uTime:NT},
    vertexShader:'varying vec3 vD;void main(){vD=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:['varying vec3 vD;uniform float uTime;',
      'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
      'float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}',
      'float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p*=2.03;a*=.5;}return v;}',
      'void main(){vec3 d=normalize(vD);vec2 sp=vec2(atan(d.z,d.x),asin(clamp(d.y,-1.,1.)));',
      'float n1=fbm(sp*vec2(1.6,2.4)+uTime*.01);float n2=fbm(sp*vec2(2.6,3.6)+7.+vec2(-uTime*.015,0.));',
      'vec3 c=vec3(.02,.01,.07)+vec3(.55,.12,.62)*smoothstep(.38,.85,n1)+vec3(.04,.45,.55)*smoothstep(.45,.9,n2)*.8;',
      'vec2 cell=floor(sp*vec2(70.,70.));float st=step(.988,hash(cell))*(.5+.5*hash(cell+3.));c+=vec3(st);',
      'gl_FragColor=vec4(c,1.);}'].join('\n')}));
  sky.frustumCulled=false;followers.push(sky);g.add(sky);
  const fm=new THREE.MeshStandardMaterial({map:floorTex,color:0xb7a8d6,roughness:.45,metalness:.25});
  const dais=new THREE.Mesh(new THREE.CylinderGeometry(12,12,1.2,64),new THREE.MeshStandardMaterial({color:0x2c2440,roughness:.5,metalness:.3}));dais.position.y=-.6;g.add(dais);
  const topD=new THREE.Mesh(new THREE.CircleGeometry(12,64),fm);topD.rotation.x=-Math.PI/2;topD.position.y=.01;g.add(topD);
  const under=new THREE.Mesh(jagged(new THREE.ConeGeometry(12,16,24,5),2.5,.3,3),new THREE.MeshStandardMaterial({color:0x1a1428,roughness:1,flatShading:true}));under.rotation.x=Math.PI;under.position.y=-9.2;g.add(under);
  const stone=new THREE.MeshStandardMaterial({color:0x4a3f66,roughness:.7,flatShading:true});
  for(let i=0;i<7;i++){const a=i/7*TAU,h=2.5+r()*4,p=new THREE.Mesh(jagged(new THREE.CylinderGeometry(.5,.6,h,8,3),.2,1.5,i),stone);p.position.set(Math.cos(a)*9,h/2,Math.sin(a)*9);g.add(p);}
  const planet=new THREE.Mesh(new THREE.SphereGeometry(40,48,32),new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,map:canvasTex(16,256,(c,w,h)=>{const gr=c.createLinearGradient(0,0,0,h);['#7a4a8a','#d9967a','#b86a8a','#f0c0a0','#8a5a9a','#e6a98a','#6a4a86'].forEach((s,i,a)=>gr.addColorStop(i/(a.length-1),s));c.fillStyle=gr;c.fillRect(0,0,w,h);for(let y=0;y<h;y+=5){c.fillStyle='rgba(255,255,255,'+r()*.12+')';c.fillRect(0,y,w,2);}})}));
  planet.position.set(-130,50,-220);g.add(planet);
  const rg=new THREE.RingGeometry(54,86,96,1);const rp=rg.attributes.position,ru=rg.attributes.uv;
  for(let i=0;i<rp.count;i++){ru.setXY(i,(Math.hypot(rp.getX(i),rp.getY(i))-54)/32,.5);}
  const ringTex=canvasTex(256,2,(c,w,h)=>{for(let x=0;x<w;x++){c.fillStyle='rgba(235,205,240,'+(.15+.6*Math.abs(Math.sin(x*.21)*Math.sin(x*.047)))+')';c.fillRect(x,0,1,h);}});
  const ring=new THREE.Mesh(rg,new THREE.MeshBasicMaterial({map:ringTex,transparent:true,side:THREE.DoubleSide,depthWrite:false,fog:false}));
  ring.position.copy(planet.position);ring.rotation.x=Math.PI/2.4;ring.rotation.y=.3;g.add(ring);
  const moon=new THREE.Mesh(new THREE.SphereGeometry(8,32,24),new THREE.MeshStandardMaterial({color:0xc8c0d8,roughness:1}));moon.position.set(90,30,-150);g.add(moon);
  const shards=[];
  for(let i=0;i<40;i++){const a=r()*TAU,d=15+r()*28,s=.3+r()*1.5,m=new THREE.Mesh(new THREE.OctahedronGeometry(s),stone);m.position.set(Math.cos(a)*d,-6+r()*22,Math.sin(a)*d);g.add(m);shards.push({m,y:m.position.y,ph:r()*TAU});}
  g.add(new THREE.HemisphereLight(0xa890ff,0x1a1030,.6));
  const key=new THREE.DirectionalLight(0xffe6f4,1.1);key.position.set(-60,40,-80);g.add(key);
  const gold=new THREE.PointLight(0xffd890,1,22,1.3);gold.position.set(0,4,0);g.add(gold);
  const sp=drift(300,{sx:40,h:20,sz:40,y0:-2,vy:.2,sway:.6,size:.13,color:0xf0d0ff,add:true});g.add(sp.points);
  return {group:g,fog:{color:0x120a2a,density:.0015},bg:0x120a2a,spawn:{x:0,z:5,yaw:0},gateZ:10.2,bounds:10.8,update:(t,dt)=>{
    NT.value=t;sp.update(t,dt);planet.rotation.y+=dt*.01;
    shards.forEach(o=>{o.m.position.y=o.y+Math.sin(t*.5+o.ph)*.8;o.m.rotation.x+=dt*.2;o.m.rotation.y+=dt*.15;});
  }};
}
