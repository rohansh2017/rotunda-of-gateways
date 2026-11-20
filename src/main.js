import * as THREE from 'three';
import { TAU, clamp, lerp, mulberry, fract, hash2, vnoise, fbm, canvasTex, spriteTex } from './util.js';
import { followers } from './sky.js';
import { rotunda, H, updateRotunda } from './rotunda.js';
import { REALMS, previewTex } from './realms/catalog.js';
import { doors, doorGroups } from './doors.js';
import { getEnv } from './realms/index.js';

const $=s=>document.querySelector(s);
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const stage=$('#stage');

let renderer;
try{ renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'}); }
catch(err){ $('#nogl').hidden=false; throw err; }
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
renderer.outputEncoding=THREE.sRGBEncoding;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.1;
stage.appendChild(renderer.domElement);

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x070403);
const camera=new THREE.PerspectiveCamera(70,1,0.1,900);
function resize(){
  const w=stage.clientWidth||window.innerWidth,h=stage.clientHeight||window.innerHeight;
  renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
}
window.addEventListener('resize',resize);resize();

scene.add(rotunda);

/* ---------- state, interface, controls ---------- */
const V3=THREE.Vector3;
const state={loc:'rotunda',realm:-1,fromDoor:-1,env:null,mode:'walk',selected:-1,busy:false};
const player={pos:new V3(0,1.7,5.5),yaw:0,pitch:0,vel:new V3(),bob:0};
const orbit={az:0,el:.3,dist:7.5,target:new V3(0,2.6,0),auto:true};
const ORBIT_MAX={2:18,5:6.5,1:16,6:16,0:24,3:20,4:24,7:20,8:30};
const keys={};let auto=null,hoverDoor=-1;
const dock=$('#dock'),cards=$('#cards'),realmsPanel=$('#realms'),whereEl=$('#where'),hint=$('#hint'),fade=$('#fade');
const btnMode=$('#btnMode'),btnReturn=$('#btnReturn');
const tmp=new V3();

const doorBtns=doors.map(d=>{
  const b=document.createElement('button');b.className='door';b.type='button';b.setAttribute('aria-pressed','false');
  b.innerHTML='<b></b><span></span><i></i>';b.querySelector('b').textContent=d.def.name;
  b.addEventListener('click',()=>selectDoor(state.selected===d.i?-1:d.i));
  dock.appendChild(b);return b;
});
function refreshDock(){
  doors.forEach((d,i)=>{
    const rl=REALMS[d.realmIndex()],b=doorBtns[i];
    b.querySelector('span').textContent=rl.name;b.style.setProperty('--glow',rl.css);
    b.setAttribute('aria-pressed',String(state.selected===i));
  });
}
function buildCards(d){
  cards.innerHTML='';
  d.realms.forEach((ri,k)=>{
    const c=document.createElement('button');c.type='button';c.className='card';c.setAttribute('aria-pressed',String(d.choice===k));
    const cv=document.createElement('canvas');cv.width=256;cv.height=192;
    cv.getContext('2d').drawImage(previewTex(ri).userData.canvas,0,96,256,192,0,0,256,192);
    const em=document.createElement('em');em.textContent=REALMS[ri].name;
    c.append(cv,em);
    c.addEventListener('click',()=>{d.setChoice(k);refreshDock();buildCards(d);});
    cards.appendChild(c);
  });
}
function selectDoor(i){
  state.selected=i;doors.forEach(d=>{d.selected=d.i===i;});
  if(i<0)realmsPanel.hidden=true;
  else{$('#realmsTitle').textContent=doors[i].def.name;buildCards(doors[i]);realmsPanel.hidden=false;}
  refreshDock();dimHint();
}
function cycleRealm(dir){
  const d=doors[state.selected];if(!d||state.loc!=='rotunda')return;
  d.setChoice((d.choice+dir+d.realms.length)%d.realms.length);refreshDock();buildCards(d);
}
function dimHint(){hint.style.opacity='0';}
setTimeout(dimHint,14000);

function setMode(m){
  state.mode=m;btnMode.textContent=m==='orbit'?'Walk view':'Orbit view';btnMode.setAttribute('aria-pressed',String(m==='orbit'));
  if(m==='orbit'){
    orbit.az=player.yaw;orbit.el=.3;
    if(state.loc==='rotunda'){orbit.target.set(0,2.6,0);orbit.dist=7.5;}
    else{orbit.target.set(0,2.5,0);orbit.dist=Math.min(12,ORBIT_MAX[state.realm]||20);}
  }
}
const maxOrbit=()=>state.loc==='rotunda'?8.3:(ORBIT_MAX[state.realm]||20);
btnMode.addEventListener('click',()=>{if(!state.busy)setMode(state.mode==='orbit'?'walk':'orbit');});
$('#btnHelp').addEventListener('click',e=>{const h=$('#help');h.hidden=!h.hidden;e.currentTarget.setAttribute('aria-expanded',String(!h.hidden));});
$('#btnClose').addEventListener('click',()=>selectDoor(-1));
$('#btnStep').addEventListener('click',()=>stepThrough());
btnReturn.addEventListener('click',()=>travel('rotunda'));

/* picking */
const cv=renderer.domElement,ray=new THREE.Raycaster(),ndc=new THREE.Vector2();
function pickDoor(cx,cy){
  if(state.loc!=='rotunda'||state.busy)return -1;
  const rc=cv.getBoundingClientRect();
  ndc.set(((cx-rc.left)/rc.width)*2-1,-((cy-rc.top)/rc.height)*2+1);
  ray.setFromCamera(ndc,camera);
  const hits=ray.intersectObjects(doorGroups,true);
  for(const h of hits){let o=h.object;while(o&&o.userData.door===undefined)o=o.parent;if(o)return o.userData.door;}
  return -1;
}
let drag=null;const ptr={x:0,y:0,has:false};
cv.addEventListener('pointerdown',e=>{
  if(e.pointerType==='mouse'&&e.button!==0)return;
  cv.setPointerCapture(e.pointerId);
  drag={id:e.pointerId,x:e.clientX,y:e.clientY,t:performance.now(),moved:0};cv.classList.add('drag');
});
cv.addEventListener('pointermove',e=>{
  ptr.x=e.clientX;ptr.y=e.clientY;ptr.has=true;
  if(!drag||drag.id!==e.pointerId)return;
  const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.x=e.clientX;drag.y=e.clientY;drag.moved+=Math.abs(dx)+Math.abs(dy);
  if(state.busy)return;
  if(state.mode==='walk'){if(!auto){player.yaw-=dx*.0042;player.pitch=clamp(player.pitch-dy*.0042,-1.4,1.4);}}
  else{orbit.az-=dx*.006;orbit.el=clamp(orbit.el+dy*.005,.04,1.15);orbit.auto=false;}
});
cv.addEventListener('pointerup',e=>{
  if(!drag||drag.id!==e.pointerId)return;
  const click=drag.moved<6&&performance.now()-drag.t<500;drag=null;cv.classList.remove('drag');
  if(click){const i=pickDoor(e.clientX,e.clientY);selectDoor(i);}
});
cv.addEventListener('pointercancel',()=>{drag=null;cv.classList.remove('drag');});
cv.addEventListener('pointerleave',()=>{ptr.has=false;});
cv.addEventListener('wheel',e=>{if(state.mode==='orbit'){e.preventDefault();orbit.dist=clamp(orbit.dist*(1+e.deltaY*.001),3,maxOrbit());}},{passive:false});

addEventListener('keydown',e=>{
  if(e.metaKey||e.ctrlKey||e.altKey)return;
  const k=e.key.toLowerCase();
  if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift'].indexOf(k)>=0){
    keys[k]=true;if(k.indexOf('arrow')===0)e.preventDefault();
    if(k!=='shift'){auto=null;dimHint();}
  }else if(k==='1'||k==='2'||k==='3'){if(state.loc==='rotunda')selectDoor(+k-1);}
  else if(k==='['||k===']'){cycleRealm(k===']'?1:-1);}
  else if(k==='enter'){if(document.activeElement&&document.activeElement.tagName==='BUTTON')return;stepThrough();}
  else if(k==='o'){if(!state.busy)setMode(state.mode==='orbit'?'walk':'orbit');}
  else if(k==='escape'){selectDoor(-1);}
});
addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;});
if(matchMedia('(pointer: coarse)').matches){
  const pad=$('#pad');pad.hidden=false;
  pad.querySelectorAll('button').forEach(b=>{
    const k=b.dataset.k;
    b.addEventListener('pointerdown',e=>{e.preventDefault();keys[k]=true;auto=null;dimHint();});
    ['pointerup','pointerleave','pointercancel'].forEach(n=>b.addEventListener(n,()=>{keys[k]=false;}));
  });
}

/* travelling between the rotunda and the realms */
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function stepThrough(){
  if(state.loc!=='rotunda'||state.selected<0||state.busy)return;
  if(state.mode==='orbit')setMode('walk');
  auto={door:state.selected};
}
async function travel(kind,arg){
  if(state.busy)return;
  state.busy=true;auto=null;
  const css=kind==='env'?REALMS[doors[arg].realmIndex()].css:REALMS[state.realm].css;
  fade.style.setProperty('--fadeA',css);fade.style.setProperty('--fadeB','#05030a');fade.classList.add('on');
  await wait(reduceMotion?60:700);
  try{if(kind==='env')enterRealm(arg);else leaveRealm();}catch(err){console.error(err);}
  await wait(180);fade.classList.remove('on');await wait(reduceMotion?60:700);
  state.busy=false;
}
function enterRealm(di){
  const d=doors[di],ri=d.realmIndex(),e=getEnv(scene,ri);
  state.loc='env';state.realm=ri;state.fromDoor=di;state.env=e;
  rotunda.visible=false;e.group.visible=true;
  scene.background=new THREE.Color(e.bg);scene.fog=new THREE.FogExp2(e.fog.color,e.fog.density);
  player.pos.set(e.spawn.x,1.7,e.spawn.z);player.yaw=e.spawn.yaw;player.pitch=0;player.vel.set(0,0,0);e.prevZ=1;
  selectDoor(-1);dock.hidden=true;btnReturn.hidden=false;whereEl.textContent=REALMS[ri].name;
  hint.textContent='Walk back through the ring to return to the rotunda';hint.style.opacity='1';setTimeout(dimHint,7000);
  setMode('walk');
}
function leaveRealm(){
  const e=state.env,d=doors[state.fromDoor];
  if(e)e.group.visible=false;
  rotunda.visible=true;scene.fog=null;scene.background=new THREE.Color(0x070403);
  const p=d.gate.group.localToWorld(new V3(0,1.7,2.8));player.pos.copy(p);player.vel.set(0,0,0);
  player.yaw=Math.atan2(p.x,p.z);player.pitch=0;d.prevZ=1;
  state.loc='rotunda';state.realm=-1;state.env=null;
  dock.hidden=false;btnReturn.hidden=true;whereEl.textContent='Sanctum rotunda';
  selectDoor(d.i);setMode('walk');
}

/* movement and collision */
function move(dt){
  if(state.busy||state.mode!=='walk')return;
  if(auto){
    const d=doors[auto.door],target=d.gate.group.localToWorld(new V3(0,1.7,-.6));
    const dir=target.sub(player.pos);dir.y=0;const dist=dir.length();
    if(dist>.02){
      dir.normalize();const step=Math.min(dist,4.2*dt);player.pos.x+=dir.x*step;player.pos.z+=dir.z*step;
      const want=Math.atan2(-dir.x,-dir.z);let dy=want-player.yaw;dy=Math.atan2(Math.sin(dy),Math.cos(dy));
      player.yaw+=dy*(1-Math.exp(-dt*6));
    }
    player.pitch=lerp(player.pitch,0,1-Math.exp(-dt*4));player.pos.y=1.7;return;
  }
  const f=(keys.w||keys.arrowup?1:0)-(keys.s||keys.arrowdown?1:0),s=(keys.d?1:0)-(keys.a?1:0);
  if(keys.arrowleft)player.yaw+=1.8*dt;if(keys.arrowright)player.yaw-=1.8*dt;
  const sp=keys.shift?6.4:3.4,tx=-Math.sin(player.yaw)*f+Math.cos(player.yaw)*s,tz=-Math.cos(player.yaw)*f-Math.sin(player.yaw)*s;
  const len=Math.hypot(tx,tz)||1,want=(f||s)?tmp.set(tx/len*sp,0,tz/len*sp):tmp.set(0,0,0);
  player.vel.lerp(want,1-Math.exp(-dt*10));
  player.pos.x+=player.vel.x*dt;player.pos.z+=player.vel.z*dt;
  const spd=player.vel.length();player.bob+=spd*dt*2.4;player.pos.y=1.7+Math.sin(player.bob)*.035*Math.min(1,spd/3.4);
  const ci=player.pos;
  if(state.loc==='rotunda'){
    const r=Math.hypot(ci.x,ci.z);let lim=8.7;
    for(const d of doors){const l=d.gate.group.worldToLocal(tmp.copy(ci));if(Math.abs(l.x)<1.3&&l.z>-1.2)lim=9.9;}
    if(r>lim){ci.x*=lim/r;ci.z*=lim/r;}
    if(r<1.25){const k=1.25/(r||1);ci.x=r?ci.x*k:1.25;ci.z*=r?k:1;}
  }else if(state.env){
    const e=state.env;
    if(e.clamp)e.clamp(ci);else{const r=Math.hypot(ci.x,ci.z);if(r>e.bounds){ci.x*=e.bounds/r;ci.z*=e.bounds/r;}}
  }
}
function checkGates(){
  if(state.busy||state.mode!=='walk')return;
  if(state.loc==='rotunda'){
    for(const d of doors){
      const l=d.gate.group.worldToLocal(tmp.copy(player.pos));
      const crossed=d.prevZ>0&&l.z<=0&&Math.abs(l.x)<1.3;d.prevZ=l.z;
      if(crossed){travel('env',d.i);return;}
    }
  }else if(state.env){
    const e=state.env,l=e.gate.group.worldToLocal(tmp.copy(player.pos));
    const crossed=e.prevZ>0&&l.z<=0&&Math.abs(l.x)<1.7;e.prevZ=l.z;
    if(crossed)travel('rotunda');
  }
}

/* main loop */
const clock=new THREE.Clock();let frame=0;
function tick(){
  requestAnimationFrame(tick);
  const dt=Math.min(clock.getDelta(),.05),t=clock.elapsedTime;frame++;
  move(dt);checkGates();
  if(state.mode==='walk'){
    camera.position.copy(player.pos);camera.rotation.order='YXZ';camera.rotation.set(player.pitch,player.yaw,0);
  }else{
    if(orbit.auto&&!drag&&!reduceMotion)orbit.az+=dt*.06;
    const ce=Math.cos(orbit.el),od=Math.min(orbit.dist,maxOrbit());
    camera.position.set(orbit.target.x+Math.sin(orbit.az)*ce*od,orbit.target.y+Math.sin(orbit.el)*od,orbit.target.z+Math.cos(orbit.az)*ce*od);
    camera.lookAt(orbit.target);
  }
  followers.forEach(f=>f.position.copy(camera.position));
  if(state.loc==='rotunda'){
    if(frame%3===0){hoverDoor=(ptr.has&&!drag)?pickDoor(ptr.x,ptr.y):-1;cv.classList.toggle('hot',hoverDoor>=0);}
    updateRotunda(t);doors.forEach(d=>d.update(t,dt,hoverDoor===d.i));
  }else if(state.env){
    state.env.update(t,dt);state.env.gate.update(t,dt,.4);
  }
  renderer.render(scene,camera);
}
window.__rotunda={state,doors,travel,getEnv:i=>getEnv(scene,i),REALMS,renderer,scene,camera};
refreshDock();selectDoor(-1);setMode('walk');resize();tick();
