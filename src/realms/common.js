import * as THREE from 'three';
import { TAU, clamp, lerp, mulberry, fract, hash2, vnoise, fbm, canvasTex, spriteTex } from '../util.js';

function drift(n,o){
  const pos=new Float32Array(n*3),ph=new Float32Array(n);
  for(let i=0;i<n;i++){pos[i*3]=(Math.random()-.5)*o.sx;pos[i*3+1]=o.y0+Math.random()*o.h;pos[i*3+2]=(Math.random()-.5)*o.sz;ph[i]=Math.random()*TAU;}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const m=new THREE.PointsMaterial({color:o.color,size:o.size,map:spriteTex,transparent:true,depthWrite:false,blending:o.add?THREE.AdditiveBlending:THREE.NormalBlending,opacity:o.opacity||1});
  const pts=new THREE.Points(g,m);pts.frustumCulled=false;
  return {points:pts,update(t,dt){
    for(let i=0;i<n;i++){
      pos[i*3+1]+=o.vy*dt*(.7+.6*Math.sin(ph[i]*3));
      pos[i*3]+=Math.sin(t*.7+ph[i])*(o.sway||0)*dt;
      pos[i*3+2]+=Math.cos(t*.6+ph[i])*(o.sway||0)*dt;
      if(pos[i*3+1]<o.y0)pos[i*3+1]+=o.h;else if(pos[i*3+1]>o.y0+o.h)pos[i*3+1]-=o.h;
    }
    g.attributes.position.needsUpdate=true;
  }};
}
function jagged(geo,amp,fq,seed){
  const p=geo.attributes.position;
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
    const n=(fbm(x*fq+seed,z*fq+y*fq*.6,3)-.5)*amp;
    p.setXYZ(i,x+n,y+n*.3,z+n);
  }
  geo.computeVertexNormals();return geo;
}
const crackTex=canvasTex(512,512,(g,w,h)=>{
  const r=mulberry(77);g.fillStyle='#000';g.fillRect(0,0,w,h);g.lineCap='round';
  for(let k=0;k<26;k++){
    let x=r()*w,y=r()*h,a=r()*TAU;g.strokeStyle='rgb(255,'+(70+r()*70|0)+',20)';g.lineWidth=1+r()*3;g.beginPath();g.moveTo(x,y);
    for(let s=0;s<14;s++){a+=(r()-.5)*1.1;x+=Math.cos(a)*(14+r()*22);y+=Math.sin(a)*(14+r()*22);g.lineTo(x,y);}
    g.stroke();
  }
});
const flicker=(light,base,t,s)=>{light.intensity=base*(.8+.2*Math.sin(t*8+s)*Math.sin(t*3.1+s*2));};


export { drift, jagged, crackTex, flicker };
