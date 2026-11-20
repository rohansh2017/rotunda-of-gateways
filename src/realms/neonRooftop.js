import * as THREE from 'three';
import { TAU, clamp, lerp, mulberry, fract, hash2, vnoise, fbm, canvasTex, spriteTex } from '../util.js';
import { followers, skyDome, starField } from '../sky.js';
import { brass, floorTex } from '../rotunda.js';
import { drift, jagged, crackTex, flicker } from './common.js';

/* 6 Neon Rooftop */
export default function build(){
  const g=new THREE.Group(),r=mulberry(107);
  g.add(skyDome([[0,'#07021a'],[.35,'#240b4a'],[.48,'#a02a86'],[.499,'#ff7ab0'],[.5,'#1a0a30'],[1,'#1a0a30']]));g.add(starField(500,480,1.8));
  const moonG=new THREE.Group();followers.push(moonG);g.add(moonG);
  const moon=new THREE.Mesh(new THREE.CircleGeometry(16,40),new THREE.MeshBasicMaterial({color:0xfff1ff,fog:false}));moon.position.set(120,170,-300);moon.lookAt(0,0,0);moonG.add(moon);
  const roofTex=canvasTex(512,512,(c,w,h)=>{c.fillStyle='#2b2b36';c.fillRect(0,0,w,h);for(let i=0;i<4000;i++){c.fillStyle='rgba(255,255,255,'+r()*.05+')';c.fillRect(r()*w,r()*h,2,2);}
    c.strokeStyle='rgba(255,230,120,.75)';c.lineWidth=8;c.beginPath();c.arc(w/2,h/2,w*.32,0,TAU);c.stroke();c.lineWidth=4;c.strokeRect(24,24,w-48,h-48);});
  const roof=new THREE.Mesh(new THREE.BoxGeometry(18,1.2,18),new THREE.MeshStandardMaterial({map:roofTex,roughness:.75}));roof.position.y=-.6;g.add(roof);
  const par=new THREE.MeshStandardMaterial({color:0x1a1a22,roughness:.8});
  [[0,-9.25,18.6,.5],[0,9.25,18.6,.5],[-9.25,0,.5,18.6],[9.25,0,.5,18.6]].forEach((a,i)=>{
    const b=new THREE.Mesh(new THREE.BoxGeometry(a[2],1.1,a[3]),par);b.position.set(a[0],.55,a[1]);g.add(b);
    const n=new THREE.Mesh(new THREE.BoxGeometry(a[2]>1?a[2]:.1,.08,a[3]>1?a[3]:.1),new THREE.MeshBasicMaterial({color:i%2?0x4ff0ff:0xff4fd8}));n.position.set(a[0],1.14,a[1]);g.add(n);
  });
  const ac=new THREE.MeshStandardMaterial({color:0x4a4a56,roughness:.6,metalness:.5});
  [[-5.5,-5,2.6,1.6,2.2],[5.2,-4.5,2.2,1.4,2]].forEach(a=>{const b=new THREE.Mesh(new THREE.BoxGeometry(a[2],a[3],a[4]),ac);b.position.set(a[0],a[3]/2,a[1]);g.add(b);});
  const mast=new THREE.Mesh(new THREE.CylinderGeometry(.06,.1,9,6),ac);mast.position.set(7,4.5,-7);g.add(mast);
  const beacon=new THREE.Mesh(new THREE.SphereGeometry(.18,10,10),new THREE.MeshBasicMaterial({color:0xff2a2a}));beacon.position.set(7,9.1,-7);g.add(beacon);
  const sign=new THREE.Group();sign.position.set(0,4.4,-8.2);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(2.6,.12,10,64),new THREE.MeshBasicMaterial({color:0x4ff0ff}));
  const tri=new THREE.Mesh(new THREE.TorusGeometry(1.6,.1,8,3),new THREE.MeshBasicMaterial({color:0xff4fd8}));
  const lg=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,3.4,6),ac);lg.position.set(0,-2.6,-.1);sign.add(ring,tri,lg);g.add(sign);
  const win=canvasTex(64,128,(c,w,h)=>{c.fillStyle='#000';c.fillRect(0,0,w,h);for(let x=0;x<8;x++)for(let y=0;y<16;y++){if(r()<.42){c.fillStyle=['#ffd88a','#ff7ac8','#7af0ff','#ffffff'][Math.floor(r()*4)];c.fillRect(x*8+1,y*8+2,5,4);}}});
  win.wrapS=win.wrapT=THREE.RepeatWrapping;
  const bm=new THREE.MeshStandardMaterial({color:0x140c22,roughness:.8,emissive:0xffffff,emissiveMap:win,emissiveIntensity:.9});
  for(let i=0;i<260;i++){
    const a=r()*TAU,d=48+Math.pow(r(),.8)*200,w=8+r()*14,dd=8+r()*14,h=14+r()*(30+d*.45);
    const geo=new THREE.BoxGeometry(w,h,dd);const uv=geo.attributes.uv;
    for(let k=0;k<uv.count;k++){uv.setXY(k,uv.getX(k)*w/14,uv.getY(k)*h/20);}
    const b=new THREE.Mesh(geo,bm);b.position.set(Math.cos(a)*d,h/2-2.6,Math.sin(a)*d);g.add(b);
  }
  const NT=110,tp=new Float32Array(NT*3),tc=new Float32Array(NT*3),ts=[];
  for(let i=0;i<NT;i++){ts.push({x:(r()-.5)*420,y:12+r()*34,z:-90+Math.floor(r()*5)*40-60,v:(8+r()*16)*(r()<.5?-1:1)});const c=r()<.5?[1,.8,.5]:[1,.3,.3];tc[i*3]=c[0];tc[i*3+1]=c[1];tc[i*3+2]=c[2];}
  const tg=new THREE.BufferGeometry();tg.setAttribute('position',new THREE.BufferAttribute(tp,3));tg.setAttribute('color',new THREE.BufferAttribute(tc,3));
  const traffic=new THREE.Points(tg,new THREE.PointsMaterial({size:.9,map:spriteTex,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));traffic.frustumCulled=false;g.add(traffic);
  g.add(new THREE.HemisphereLight(0x7a5aff,0x2a0a3a,.55));
  const pk=new THREE.PointLight(0xff3fd0,2.2,24,1.4);pk.position.set(-6,3,-4);g.add(pk);
  const cy=new THREE.PointLight(0x30f0ff,2.2,24,1.4);cy.position.set(6,3,-4);g.add(cy);
  const rain=drift(1300,{sx:40,h:30,sz:40,y0:0,vy:-22,sway:0,size:.07,color:0xaad0ff,opacity:.5});g.add(rain.points);
  const clampFn=p=>{p.x=clamp(p.x,-8.3,8.3);p.z=clamp(p.z,-8.3,8.3);};
  return {group:g,fog:{color:0x2a0a4a,density:.0075},bg:0x2a0a4a,spawn:{x:0,z:2,yaw:0},gateZ:7.8,clamp:clampFn,update:(t,dt)=>{
    rain.update(t,dt);ring.rotation.z+=dt*.3;tri.rotation.z-=dt*.5;
    pk.intensity=2.2+.5*Math.sin(t*3.2);cy.intensity=2.2+.5*Math.sin(t*2.7+1);beacon.visible=Math.sin(t*3)>0;
    for(let i=0;i<NT;i++){const o=ts[i];o.x+=o.v*dt;if(o.x>210)o.x=-210;if(o.x<-210)o.x=210;tp[i*3]=o.x;tp[i*3+1]=o.y;tp[i*3+2]=o.z;}
    tg.attributes.position.needsUpdate=true;
  }};
}
