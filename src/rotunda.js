import * as THREE from 'three';
import { TAU, clamp, lerp, mulberry, fract, hash2, vnoise, fbm, canvasTex, spriteTex } from './util.js';

/* ---------- the rotunda ---------- */
const rotunda=new THREE.Group();
const R=9.6,H=8;
const brass=new THREE.MeshStandardMaterial({color:0xb8893a,metalness:.85,roughness:.35});
const darkWood=new THREE.MeshStandardMaterial({color:0x2a1912,roughness:.7,metalness:.05});
const toRad=d=>d*Math.PI/180;
const onWall=(deg,r)=>new THREE.Vector3(Math.cos(toRad(deg))*r,0,Math.sin(toRad(deg))*r);

/* floor with brass inlay */
const floorTex=canvasTex(1024,1024,(g,w,h)=>{
  const c=w/2,r=mulberry(7);
  g.fillStyle='#24150f';g.fillRect(0,0,w,h);
  for(let i=0;i<90;i++){
    const a=i/90*TAU;
    g.strokeStyle='rgba('+(60+r()*30|0)+','+(34+r()*16|0)+','+(20+r()*10|0)+',.6)';g.lineWidth=2+r()*5;
    g.beginPath();g.moveTo(c+Math.cos(a)*40,c+Math.sin(a)*40);g.lineTo(c+Math.cos(a)*c,c+Math.sin(a)*c);g.stroke();
  }
  const ring=(rad,lw,col)=>{g.strokeStyle=col;g.lineWidth=lw;g.beginPath();g.arc(c,c,rad,0,TAU);g.stroke();};
  ring(c*.97,10,'#b98a3a');ring(c*.9,3,'#d7b165');ring(c*.64,6,'#b98a3a');ring(c*.6,2,'#d7b165');ring(c*.3,5,'#b98a3a');
  g.strokeStyle='#d7b165';g.lineWidth=2;
  for(let i=0;i<96;i++){const a=i/96*TAU;g.beginPath();g.moveTo(c+Math.cos(a)*c*.91,c+Math.sin(a)*c*.91);g.lineTo(c+Math.cos(a)*c*.95,c+Math.sin(a)*c*.95);g.stroke();}
  g.lineWidth=3;g.beginPath();
  for(let i=0;i<=8;i++){const a=i*3*TAU/8-Math.PI/2;const x=c+Math.cos(a)*c*.6,y=c+Math.sin(a)*c*.6;i?g.lineTo(x,y):g.moveTo(x,y);}
  g.stroke();
  for(let i=0;i<24;i++){const a=i/24*TAU;g.beginPath();g.arc(c+Math.cos(a)*c*.77,c+Math.sin(a)*c*.77,9,0,TAU);g.stroke();}
  for(let i=0;i<3;i++){const a=i/3*TAU-Math.PI/2;g.beginPath();g.arc(c+Math.cos(a)*c*.1,c+Math.sin(a)*c*.1,c*.16,0,TAU);g.stroke();}
  g.fillStyle='#d7b165';g.beginPath();g.arc(c,c,8,0,TAU);g.fill();
});
const floor=new THREE.Mesh(new THREE.CircleGeometry(R+.15,96),new THREE.MeshStandardMaterial({map:floorTex,roughness:.55,metalness:.05}));
floor.rotation.x=-Math.PI/2;rotunda.add(floor);

/* walls */
const wallTex=canvasTex(1024,512,(g,w,h)=>{
  const r=mulberry(3);
  g.fillStyle='#6a4635';g.fillRect(0,0,w,h);
  for(let i=0;i<5000;i++){g.fillStyle='rgba('+(r()<.5?20:140)+','+(r()<.5?10:90)+','+(r()<.5?8:60)+',.05)';g.fillRect(r()*w,r()*h*.6,3+r()*10,3+r()*10);}
  const wy=h*.58;
  g.fillStyle='#2b1912';g.fillRect(0,wy,w,h-wy);
  const pw=w/2;
  for(let i=0;i<2;i++){
    const x=i*pw+14;
    g.strokeStyle='#4a2d20';g.lineWidth=6;g.strokeRect(x,wy+22,pw-28,h-wy-44);
    g.strokeStyle='#8a6a3a';g.lineWidth=2;g.strokeRect(x+10,wy+32,pw-48,h-wy-64);
  }
  g.fillStyle='#b98a3a';g.fillRect(0,wy-6,w,6);g.fillStyle='#e0bc72';g.fillRect(0,wy-6,w,2);
  g.fillStyle='#3a2217';g.fillRect(0,0,w,28);g.fillStyle='#b98a3a';g.fillRect(0,28,w,3);
  const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'rgba(0,0,0,.5)');gr.addColorStop(.4,'rgba(0,0,0,0)');
  g.fillStyle=gr;g.fillRect(0,0,w,h);
},{repeat:[6,1]});
wallTex.offset.set(1/12,0);
const wall=new THREE.Mesh(new THREE.CylinderGeometry(R,R,H,96,1,true),new THREE.MeshStandardMaterial({map:wallTex,roughness:.85,side:THREE.BackSide}));
wall.position.y=H/2;rotunda.add(wall);

/* coffered dome */
const ceilTex=canvasTex(1024,512,(g,w,h)=>{
  g.fillStyle='#3a2318';g.fillRect(0,0,w,h);
  for(let i=0;i<24;i++){
    const x=i*w/24;
    g.fillStyle='#8a6428';g.fillRect(x-4,0,8,h);
    g.strokeStyle='rgba(185,138,58,.5)';g.lineWidth=2;g.strokeRect(x+14,h*.08,w/24-28,h*.84);
  }
  for(let j=1;j<5;j++){g.fillStyle='#8a6428';g.fillRect(0,j*h/5-3,w,6);}
  const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'rgba(0,0,0,.35)');gr.addColorStop(1,'rgba(255,205,130,.3)');
  g.fillStyle=gr;g.fillRect(0,0,w,h);
});
const domePts=[];
for(let i=0;i<=24;i++){const t=i/24;domePts.push(new THREE.Vector2(1+(R-1)*Math.cos(t*Math.PI/2),H+4.4*Math.sin(t*Math.PI/2)));}
const dome=new THREE.Mesh(new THREE.LatheGeometry(domePts,72),new THREE.MeshStandardMaterial({map:ceilTex,roughness:.8,emissive:0x2a1608,side:THREE.BackSide}));
rotunda.add(dome);
const oculus=new THREE.Mesh(new THREE.CircleGeometry(1.05,40),new THREE.MeshBasicMaterial({color:0xfff0cc}));
oculus.rotation.x=Math.PI/2;oculus.position.y=H+4.38;rotunda.add(oculus);
[[.3],[.6]].forEach(a=>{
  const p=domePts[Math.round(a[0]*24)];
  const t=new THREE.Mesh(new THREE.TorusGeometry(p.x,.1,8,96),brass);t.rotation.x=Math.PI/2;t.position.y=p.y;rotunda.add(t);
});
[[H,.2],[4.55,.12]].forEach(a=>{
  const t=new THREE.Mesh(new THREE.TorusGeometry(R-.05,a[1],10,120),brass);t.rotation.x=Math.PI/2;t.position.y=a[0];rotunda.add(t);
});

/* pilasters between the openings */
for(let k=0;k<12;k++){
  const a=15+30*k,p=onWall(a,R-.22);
  const col=new THREE.Group();col.position.copy(p);col.lookAt(0,0,0);
  const shaft=new THREE.Mesh(new THREE.BoxGeometry(.7,H,.45),darkWood);shaft.position.y=H/2;
  const cap=new THREE.Mesh(new THREE.BoxGeometry(.95,.35,.6),brass);cap.position.y=H-.2;
  const base=new THREE.Mesh(new THREE.BoxGeometry(.95,.4,.6),brass);base.position.y=.2;
  const inlay=new THREE.Mesh(new THREE.BoxGeometry(.08,H-1.2,.05),brass);inlay.position.set(0,H/2,.24);
  col.add(shaft,cap,base,inlay);rotunda.add(col);
}

/* arched windows */
const windowTex=canvasTex(256,512,(g,w,h)=>{
  const path=()=>{g.beginPath();g.moveTo(8,h-8);g.lineTo(8,w/2+8);g.arc(w/2,w/2+8,w/2-8,Math.PI,0);g.lineTo(w-8,h-8);g.closePath();};
  path();
  const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#fff6df');gr.addColorStop(.5,'#cfe3ff');gr.addColorStop(1,'#9fc2ee');
  g.fillStyle=gr;g.fill();
  g.strokeStyle='#2a1a12';g.lineWidth=7;g.beginPath();
  g.moveTo(w/2,8);g.lineTo(w/2,h-8);g.moveTo(8,h*.42);g.lineTo(w-8,h*.42);g.moveTo(8,h*.7);g.lineTo(w-8,h*.7);g.stroke();
  g.beginPath();g.arc(w/2,w/2+8,w/4,Math.PI,0);g.stroke();
  path();g.strokeStyle='#b98a3a';g.lineWidth=12;g.stroke();
});
[0,30,60,120,150,180,240,300].forEach(a=>{
  const w=new THREE.Mesh(new THREE.PlaneGeometry(2,4),new THREE.MeshBasicMaterial({map:windowTex,transparent:true,alphaTest:.4,color:0xffffff}));
  const grp=new THREE.Group();grp.position.copy(onWall(a,R-.04));grp.position.y=5.5;grp.lookAt(0,5.5,0);
  grp.add(w);rotunda.add(grp);
});

/* round window, warm key light behind the spawn point */
const roundTex=canvasTex(512,512,(g,w,h)=>{
  const c=w/2;g.beginPath();g.arc(c,c,c-6,0,TAU);g.clip();
  const gr=g.createRadialGradient(c,c,10,c,c,c);gr.addColorStop(0,'#fff8e0');gr.addColorStop(.6,'#ffe3a3');gr.addColorStop(1,'#e9b765');
  g.fillStyle=gr;g.fillRect(0,0,w,h);
  g.strokeStyle='#2a1a12';g.lineWidth=8;
  for(let i=0;i<12;i++){const a=i/12*TAU;g.beginPath();g.moveTo(c,c);g.lineTo(c+Math.cos(a)*c,c+Math.sin(a)*c);g.stroke();}
  [c*.78,c*.5,c*.22].forEach(r=>{g.beginPath();g.arc(c,c,r,0,TAU);g.stroke();});
  g.lineWidth=5;
  for(let i=0;i<3;i++){const a=i/3*TAU-Math.PI/2;g.beginPath();g.arc(c+Math.cos(a)*c*.1,c+Math.sin(a)*c*.1,c*.14,0,TAU);g.stroke();}
  for(let i=0;i<12;i++){const a=(i+.5)/12*TAU;g.beginPath();g.arc(c+Math.cos(a)*c*.64,c+Math.sin(a)*c*.64,14,0,TAU);g.stroke();}
});
{
  const grp=new THREE.Group();grp.position.copy(onWall(90,R-.05));grp.position.y=5.3;grp.lookAt(0,5.3,0);
  const disc=new THREE.Mesh(new THREE.CircleGeometry(2.4,64),new THREE.MeshBasicMaterial({map:roundTex,transparent:true,color:0xffffff}));
  const rim=new THREE.Mesh(new THREE.TorusGeometry(2.4,.13,12,96),brass);
  grp.add(disc,rim);rotunda.add(grp);
  const spot=new THREE.SpotLight(0xffe2ad,2.2,34,.55,.7,1);
  spot.position.copy(grp.position).multiplyScalar(.85);spot.position.y=5.3;
  spot.target.position.set(0,0,-3);rotunda.add(spot,spot.target);
}

/* sconces */
const flames=[];
[45,105,165,225,285,345].forEach(a=>{
  const p=onWall(a,R-.7);
  const g=new THREE.Group();g.position.set(p.x,2.9,p.z);g.lookAt(0,2.9,0);
  const arm=new THREE.Mesh(new THREE.CylinderGeometry(.05,.07,.5,8),brass);arm.rotation.x=Math.PI/2;arm.position.z=-.1;
  const cup=new THREE.Mesh(new THREE.CylinderGeometry(.12,.07,.14,12),brass);cup.position.set(0,.05,.15);
  const flame=new THREE.Mesh(new THREE.SphereGeometry(.09,10,10),new THREE.MeshBasicMaterial({color:0xffc070}));flame.position.set(0,.2,.15);
  const light=new THREE.PointLight(0xffa24a,.9,15,1.6);light.position.set(0,.35,.4);
  g.add(arm,cup,flame,light);rotunda.add(g);flames.push({light,base:.9,seed:Math.random()*10});
});

/* the central eye */
const eye=new THREE.Group();eye.position.y=1.9;rotunda.add(eye);
{
  const ped=new THREE.Mesh(new THREE.CylinderGeometry(.55,.85,1.1,24),darkWood);ped.position.y=.55;
  const band=new THREE.Mesh(new THREE.TorusGeometry(.72,.05,10,48),brass);band.rotation.x=Math.PI/2;band.position.y=1.08;
  rotunda.add(ped,band);
  const gold=new THREE.MeshBasicMaterial({color:0xffd27a});
  [[0,0],[1.1,0],[0,1.1]].forEach((r,i)=>{
    const t=new THREE.Mesh(new THREE.TorusGeometry(.5+i*.14,.025,8,64),gold);t.rotation.set(r[0],r[1],i*.7);eye.add(t);
  });
  const core=new THREE.Mesh(new THREE.SphereGeometry(.17,20,20),new THREE.MeshBasicMaterial({color:0x9bffd0}));eye.add(core);
  const l=new THREE.PointLight(0xc8ffd8,.9,10,1.5);eye.add(l);
}

const hemi=new THREE.HemisphereLight(0xffe2bf,0x2a1810,.5);
const keyLight=new THREE.PointLight(0xffd9a0,.55,26,1.2);keyLight.position.set(0,H-.8,0);
rotunda.add(hemi,keyLight);

function updateRotunda(t){
  eye.children.forEach((c,i)=>{if(c.geometry&&c.geometry.type==='TorusGeometry'){c.rotation.x+=.004*(i+1);c.rotation.y+=.003*(3-i);}});
  eye.position.y=1.95+Math.sin(t*1.2)*.06;
  flames.forEach(f=>{f.light.intensity=f.base*(.85+.15*Math.sin(t*9+f.seed)*Math.sin(t*3.7+f.seed*2));});
}
rotunda.updateMatrixWorld(true);


export { rotunda, R, H, brass, darkWood, onWall, floorTex, updateRotunda };
