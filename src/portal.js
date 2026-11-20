import * as THREE from 'three';
import { TAU, clamp, lerp, mulberry, fract, hash2, vnoise, fbm, canvasTex, spriteTex } from './util.js';
import { brass } from './rotunda.js';

/* ---------- portal shader, gate builder, the three doors ---------- */
const PORTAL_VS='varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}';
const PORTAL_FS=[
'precision highp float;',
'uniform float uTime,uMix,uHover,uSel;uniform sampler2D uTexA,uTexB;uniform vec3 uAccent;uniform int uShape;varying vec2 vUv;',
'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
'float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}',
'float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p*=2.02;a*=.5;}return v;}',
'float maskD(vec2 uv){',
'  if(uShape==0){vec2 q=(uv-.5)*2.;return 1.-length(q);}',
'  vec2 p=vec2((uv.x-.5)*2.,uv.y);',
'  if(uShape==1){float t=clamp((p.y-.6)/.4,0.,1.);float lim=1.-pow(t,1.6);return min(lim-abs(p.x),1.-p.y);}',
'  return min(1.-abs(p.x),min(p.y,1.-p.y));',
'}',
'void main(){',
'  float m=maskD(vUv);if(m<0.)discard;',
'  vec2 d=vUv-.5;float ang=atan(d.y,d.x),rad=length(d);',
'  vec2 q=vUv*vec2(3.,4.5);',
'  vec2 warp=vec2(fbm(q+vec2(uTime*.25,0.)),fbm(q+vec2(5.2,uTime*.2)))-.5;',
'  vec2 uv=clamp(vUv+warp*(.07+.05*uHover),.001,.999);',
'  vec3 col=mix(texture2D(uTexA,uv).rgb,texture2D(uTexB,uv).rgb,uMix);',
'  float sw=sin(ang*3.+rad*14.-uTime*1.6+fbm(q*2.)*4.)*.5+.5;',
'  float ring=smoothstep(.55,.0,abs(fract(rad*5.-uTime*.35)-.5)*2.);',
'  col+=uAccent*(sw*.22+ring*.1);',
'  float edge=1.-smoothstep(0.,.14,m);',
'  col+=uAccent*edge*(1.4+uHover*.8+uSel*.6);',
'  col*=.92+.12*sin(uTime*2.+rad*10.);',
'  col=mix(col,col*1.25,uHover*.5);',
'  gl_FragColor=vec4(col,1.);',
'}'].join('\n');

function archPts(w,h,n){
  const p=[],y0=.6*h;p.push([-w/2,0],[-w/2,y0]);
  for(let i=1;i<=n;i++){const t=i/n;p.push([-(w/2)*(1-Math.pow(t,1.6)),y0+t*.4*h]);}
  for(let i=n-1;i>=1;i--){const t=i/n;p.push([(w/2)*(1-Math.pow(t,1.6)),y0+t*.4*h]);}
  p.push([w/2,y0],[w/2,0]);return p;
}
function resample(pts,M){
  const L=[0];for(let i=1;i<pts.length;i++)L.push(L[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]));
  const tot=L[L.length-1],out=[];let j=0;
  for(let k=0;k<M;k++){const d=tot*k/(M-1);while(j<L.length-2&&L[j+1]<d)j++;const f=(d-L[j])/((L[j+1]-L[j])||1);out.push([lerp(pts[j][0],pts[j+1][0],f),lerp(pts[j][1],pts[j+1][1],f)]);}
  return out;
}
const runeStrip=canvasTex(1024,128,(g,w,h)=>{
  const r=mulberry(21);g.strokeStyle='#fff';g.lineWidth=5;g.lineCap='round';g.lineJoin='round';
  const cw=h*.85,s=h*.27;
  for(let x=cw*.5;x<w-cw*.3;x+=cw){
    g.beginPath();const n=3+Math.floor(r()*3);
    for(let k=0;k<n;k++){const ax=x+(r()-.5)*s*2,ay=h/2+(r()-.5)*s*2.2;k?g.lineTo(ax,ay):g.moveTo(ax,ay);}
    g.stroke();
    if(r()<.55){g.beginPath();g.arc(x+(r()-.5)*s,h/2+(r()-.5)*s,s*.35,0,TAU);g.stroke();}
  }
});
const runeRingTex=canvasTex(512,512,(g,w,h)=>{
  const c=w/2,r=mulberry(5);g.strokeStyle='#fff';g.lineCap='round';
  [[c*.96,5],[c*.8,2],[c*.55,3]].forEach(a=>{g.lineWidth=a[1];g.beginPath();g.arc(c,c,a[0],0,TAU);g.stroke();});
  g.lineWidth=3;
  for(let i=0;i<48;i++){const a=i/48*TAU,r0=c*.82,r1=c*(.88+r()*.07);g.beginPath();g.moveTo(c+Math.cos(a)*r0,c+Math.sin(a)*r0);g.lineTo(c+Math.cos(a)*r1,c+Math.sin(a)*r1);g.stroke();}
  g.beginPath();for(let i=0;i<=6;i++){const a=i*2*TAU/6-Math.PI/2;const x=c+Math.cos(a)*c*.55,y=c+Math.sin(a)*c*.55;i?g.lineTo(x,y):g.moveTo(x,y);}g.stroke();
},{srgb:false});

const GATE_DIMS=[{w:4.4,h:4.4,cy:2.5},{w:3.2,h:5.0,cy:2.5},{w:3.0,h:4.6,cy:2.3}];
const stoneMat=new THREE.MeshStandardMaterial({color:0x3a2a22,roughness:.6,metalness:.25});

/* static frame around the opening: pushes meshes into g, tintable materials via glowMat/emis, animated parts into spinners.
   Swap this for a loaded glTF frame; the portal plane, sparks and tinting stay in buildGate. */
function buildFrame(shape,D,g,glowMat,emis,spinners,accent){
  if(shape===0){ /* sling-ring: brass hoop with orbiting spark arcs */
    const hoop=new THREE.Mesh(new THREE.TorusGeometry(2.2,.15,18,110),brass);hoop.position.y=D.cy;g.add(hoop);
    const outer=new THREE.Mesh(new THREE.TorusGeometry(2.48,.05,10,110),brass);outer.position.y=D.cy;g.add(outer);
    for(let i=0;i<16;i++){const a=i/16*TAU;const t=new THREE.Mesh(new THREE.BoxGeometry(.08,.34,.1),brass);t.position.set(Math.cos(a)*2.34,D.cy+Math.sin(a)*2.34,0);t.rotation.z=a+Math.PI/2;g.add(t);}
    [[2.05,1.3,.7],[1.9,1.1,-.9],[2.14,.8,1.3]].forEach(c=>{
      const arc=new THREE.Mesh(new THREE.TorusGeometry(c[0],.04,8,64,Math.PI*c[1]),glowMat(.95));arc.position.set(0,D.cy,.04);g.add(arc);spinners.push([arc,c[2]]);
    });
  }else if(shape===1){ /* gothic arch of dark stone with a bright keystone */
    const outer=archPts(D.w+.9,D.h+.55,20).map(p=>p[1]===0?[p[0],-.3]:p);
    const s=new THREE.Shape(outer.map(p=>new THREE.Vector2(p[0],p[1])));
    s.holes.push(new THREE.Path(archPts(D.w,D.h,20).map(p=>new THREE.Vector2(p[0],p[1]))));
    const geo=new THREE.ExtrudeGeometry(s,{depth:.5,bevelEnabled:false});geo.translate(0,0,-.25);
    g.add(new THREE.Mesh(geo,stoneMat));
    const pts=archPts(D.w,D.h,24).map(p=>new THREE.Vector3(p[0],p[1],.27));
    const trim=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),160,.035,6),glowMat(1));g.add(trim);
    const gem=new THREE.Mesh(new THREE.OctahedronGeometry(.2),glowMat(1));gem.position.set(0,D.h+.12,.3);g.add(gem);spinners.push([gem,1.4,'y']);
    [-1,1].forEach(sx=>{const b=new THREE.Mesh(new THREE.BoxGeometry(.5,.3,.7),brass);b.position.set(sx*(D.w/2+.45),.15,0);g.add(b);});
  }else{ /* lintel with a band of glowing runes */
    const mat=new THREE.MeshStandardMaterial({color:0x2c1f19,roughness:.7,metalness:.15,emissive:accent,emissiveMap:runeStrip});emis.push(mat);
    [-1,1].forEach(sx=>{
      const p=new THREE.Mesh(new THREE.BoxGeometry(.5,D.h+.5,.7),stoneMat);p.position.set(sx*(D.w/2+.25),(D.h+.5)/2,0);g.add(p);
      const st=new THREE.Mesh(new THREE.BoxGeometry(.06,D.h-.6,.04),glowMat(1));st.position.set(sx*(D.w/2+.25),D.h/2,.36);g.add(st);
    });
    const lt=new THREE.Mesh(new THREE.BoxGeometry(D.w+1.5,.7,.8),[stoneMat,stoneMat,stoneMat,stoneMat,mat,stoneMat]);lt.position.set(0,D.h+.15,0);g.add(lt);
    const cap=new THREE.Mesh(new THREE.BoxGeometry(D.w+1.9,.18,.95),brass);cap.position.set(0,D.h+.58,0);g.add(cap);
    const step=new THREE.Mesh(new THREE.BoxGeometry(D.w+1.3,.12,1.3),stoneMat);step.position.set(0,.06,.35);g.add(step);
  }
}

function buildGate(shape,accent,tex,opts){
  opts=opts||{};
  const D=GATE_DIMS[shape],g=new THREE.Group();
  const accentNow=new THREE.Color(accent),accentTo=new THREE.Color(accent);
  const u={uTime:{value:0},uMix:{value:1},uTexA:{value:tex},uTexB:{value:tex},uAccent:{value:new THREE.Color(accent)},uShape:{value:shape},uHover:{value:0},uSel:{value:0}};
  const portal=new THREE.Mesh(new THREE.PlaneGeometry(D.w,D.h),new THREE.ShaderMaterial({uniforms:u,vertexShader:PORTAL_VS,fragmentShader:PORTAL_FS,side:THREE.DoubleSide}));
  portal.position.y=D.cy;g.add(portal);
  const basics=[],emis=[],spinners=[];
  const glowMat=(a)=>{const m=new THREE.MeshBasicMaterial({color:accent,transparent:true,opacity:a||1,blending:THREE.AdditiveBlending,depthWrite:false});basics.push(m);return m;};

  buildFrame(shape,D,g,glowMat,emis,spinners,accent);

  if(opts.floorRing!==false){
    const rm=new THREE.MeshBasicMaterial({map:runeRingTex,color:accent,transparent:true,opacity:.75,blending:THREE.AdditiveBlending,depthWrite:false});basics.push(rm);
    const fr=new THREE.Mesh(new THREE.CircleGeometry(2.3,64),rm);fr.rotation.x=-Math.PI/2;fr.position.set(0,.035,2.5);g.add(fr);spinners.push([fr,.25,'z']);
  }
  const light=new THREE.PointLight(accent,1,9,1.6);light.position.set(0,2.5,1.4);g.add(light);

  /* spark emitter along the opening */
  let outline;
  if(shape===0){const a=[];for(let i=0;i<=256;i++){const t=i/256*TAU;a.push([Math.cos(t)*2.2,D.cy+Math.sin(t)*2.2]);}outline=resample(a,240);}
  else if(shape===1)outline=resample(archPts(D.w,D.h,24),240);
  else outline=resample([[-D.w/2,0],[-D.w/2,D.h],[D.w/2,D.h],[D.w/2,0]],240);
  const N=opts.sparks||240,pos=new Float32Array(N*3),col=new Float32Array(N*3);
  const pd=[];for(let i=0;i<N;i++)pd.push({u:Math.random(),a:Math.random(),off:.3+Math.random()*.7,rate:.25+Math.random()*.55,dir:Math.random()<.5?-1:1,z:(Math.random()-.5)*.5});
  const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.BufferAttribute(pos,3));sg.setAttribute('color',new THREE.BufferAttribute(col,3));
  const sparks=new THREE.Points(sg,new THREE.PointsMaterial({size:.16,map:spriteTex,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));
  sparks.frustumCulled=false;g.add(sparks);

  const gate={group:g,portal,u,dims:D,halfW:D.w/2-.2,light,shape,accent:accentNow,accentTo,
    setAccent(c){accentTo.set(c);},
    update(t,dt,boost){
      boost=boost||0;
      accentNow.lerp(accentTo,1-Math.exp(-dt*3));
      u.uTime.value=t;u.uAccent.value.copy(accentNow);
      basics.forEach(m=>m.color.copy(accentNow));emis.forEach(m=>m.emissive.copy(accentNow));
      light.color.copy(accentNow);light.intensity=.85+boost*.7+.12*Math.sin(t*5+shape);
      spinners.forEach(s=>{const ax=s[2]||'z';s[0].rotation[ax]+=dt*s[1];});
      for(let i=0;i<N;i++){
        const p=pd[i];p.a+=dt*p.rate;
        if(p.a>1){p.a=0;p.u=Math.random();p.off=.3+Math.random()*.7;p.rate=.25+Math.random()*.55;}
        const idx=(((p.u+p.a*.05*p.dir)%1)+1)%1*(outline.length-1),pt=outline[Math.floor(idx)];
        const dx=pt[0],dy=pt[1]-D.cy,len=Math.hypot(dx,dy)||1,rr=p.a*p.off*(.5+boost*.5);
        pos[i*3]=pt[0]+dx/len*rr;pos[i*3+1]=pt[1]+dy/len*rr+p.a*.45;pos[i*3+2]=p.z+Math.sin(t*2+p.u*40)*.06;
        const f=Math.pow(1-p.a,1.6)*(.75+boost*.6);
        col[i*3]=accentNow.r*f;col[i*3+1]=accentNow.g*f;col[i*3+2]=accentNow.b*f;
      }
      sg.attributes.position.needsUpdate=true;sg.attributes.color.needsUpdate=true;
    }};
  return gate;
}


export { PORTAL_VS, PORTAL_FS, archPts, resample, runeStrip, runeRingTex, GATE_DIMS, stoneMat, buildGate, buildFrame };
