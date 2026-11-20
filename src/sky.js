import * as THREE from 'three';
import { TAU, clamp, lerp, mulberry, fract, hash2, vnoise, fbm, canvasTex, spriteTex } from './util.js';

const followers=[]; /* meshes that stay centred on the camera (sky domes) */
function skyDome(stops){
  const tex=canvasTex(8,256,(g,w,h)=>{
    const gr=g.createLinearGradient(0,0,0,h);
    stops.forEach(s=>gr.addColorStop(s[0],s[1]));
    g.fillStyle=gr;g.fillRect(0,0,w,h);
  });
  const m=new THREE.Mesh(new THREE.SphereGeometry(520,32,24),new THREE.MeshBasicMaterial({map:tex,side:THREE.BackSide,fog:false,depthWrite:false}));
  m.renderOrder=-10;m.frustumCulled=false;followers.push(m);return m;
}
function starField(n,radius,size,tint){
  const p=new Float32Array(n*3),r=mulberry(11);
  for(let i=0;i<n;i++){
    const u=r()*TAU,v=Math.acos(1-r()*1.6); /* upper hemisphere bias */
    p[i*3]=Math.sin(v)*Math.cos(u)*radius;p[i*3+1]=Math.cos(v)*radius;p[i*3+2]=Math.sin(v)*Math.sin(u)*radius;
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));
  const s=new THREE.Points(g,new THREE.PointsMaterial({color:tint||0xffffff,size:size||1.6,sizeAttenuation:false,map:spriteTex,transparent:true,depthWrite:false,fog:false,blending:THREE.AdditiveBlending}));
  s.frustumCulled=false;followers.push(s);return s;
}

export { followers, skyDome, starField };
