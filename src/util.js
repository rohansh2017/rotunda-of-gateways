import * as THREE from 'three';

export const TAU = Math.PI * 2;
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const fract=x=>x-Math.floor(x);
const hash2=(x,y)=>fract(Math.sin(x*127.1+y*311.7)*43758.5453);
function vnoise(x,y){
  const xi=Math.floor(x),yi=Math.floor(y);let xf=x-xi,yf=y-yi;
  xf=xf*xf*(3-2*xf);yf=yf*yf*(3-2*yf);
  const a=hash2(xi,yi),b=hash2(xi+1,yi),c=hash2(xi,yi+1),d=hash2(xi+1,yi+1);
  return lerp(lerp(a,b,xf),lerp(c,d,xf),yf);
}
function fbm(x,y,o){o=o||4;let v=0,a=.5;for(let i=0;i<o;i++){v+=a*vnoise(x,y);x*=2.03;y*=2.03;a*=.5;}return v;}

function canvasTex(w,h,draw,opts){
  opts=opts||{};
  const c=document.createElement('canvas');c.width=w;c.height=h;
  const g=c.getContext('2d');draw(g,w,h);
  const t=new THREE.CanvasTexture(c);
  if(opts.srgb!==false)t.encoding=THREE.sRGBEncoding;
  t.anisotropy=8;
  if(opts.repeat){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(opts.repeat[0],opts.repeat[1]);}
  t.userData={canvas:c};
  return t;
}
const spriteTex=canvasTex(64,64,(g,w,h)=>{
  const gr=g.createRadialGradient(32,32,0,32,32,32);
  gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.35,'rgba(255,255,255,.55)');gr.addColorStop(1,'rgba(255,255,255,0)');
  g.fillStyle=gr;g.fillRect(0,0,w,h);
},{srgb:false});


export { mulberry, fract, hash2, vnoise, fbm, canvasTex, spriteTex };
