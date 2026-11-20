import * as THREE from 'three';
import { TAU, clamp, lerp, mulberry, fract, hash2, vnoise, fbm, canvasTex, spriteTex } from '../util.js';

/* ---------- realm catalogue and painted previews (shown inside the doors) ---------- */
const REALMS=[
  {name:'Snow Peak',      door:0,accent:0x9fd8ff,css:'#9fd8ff'},
  {name:'Aurora Lake',    door:0,accent:0x6dffb0,css:'#6dffb0'},
  {name:'Ice Cavern',     door:0,accent:0x66e0ff,css:'#66e0ff'},
  {name:'Dark Dimension', door:1,accent:0xff5a2a,css:'#ff5a2a'},
  {name:'Desert Dusk',    door:1,accent:0xffa04a,css:'#ffa04a'},
  {name:'Ember Canyon',   door:1,accent:0xff7a2a,css:'#ff7a2a'},
  {name:'Neon Rooftop',   door:2,accent:0xff4fd8,css:'#ff4fd8'},
  {name:'Nebula Dais',    door:2,accent:0xb48cff,css:'#b48cff'},
  {name:'Mirror Dimension',door:2,accent:0x4ff0e0,css:'#4ff0e0'}
];
function vgrad(g,w,h,stops){const gr=g.createLinearGradient(0,0,0,h);stops.forEach(s=>gr.addColorStop(s[0],s[1]));g.fillStyle=gr;g.fillRect(0,0,w,h);}
function poly(g,pts,fill){g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath();g.fillStyle=fill;g.fill();}
function glow(g,x,y,r,c0,c1){const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,c0);gr.addColorStop(1,c1||'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2);}
function paintPreview(i,g,w,h){
  const r=mulberry(100+i);
  const stars=(n,maxY)=>{for(let k=0;k<n;k++){g.fillStyle='rgba(255,255,255,'+(.4+r()*.6)+')';g.fillRect(r()*w,r()*h*maxY,1.5,1.5);}};
  switch(i){
    case 0:
      vgrad(g,w,h,[[0,'#6f9fd6'],[.55,'#f2d3c4'],[1,'#ffffff']]);glow(g,w*.72,h*.5,w*.35,'rgba(255,240,210,.9)');
      poly(g,[[0,h*.7],[w*.18,h*.35],[w*.34,h*.6],[w*.52,h*.2],[w*.74,h*.62],[w*.9,h*.4],[w,h*.66],[w,h],[0,h]],'#cdd9ea');
      poly(g,[[w*.52,h*.2],[w*.44,h*.4],[w*.5,h*.37],[w*.54,h*.43],[w*.6,h*.38]],'#ffffff');
      poly(g,[[0,h*.82],[w*.4,h*.74],[w,h*.84],[w,h],[0,h]],'#f7fbff');break;
    case 1:
      vgrad(g,w,h,[[0,'#02050d'],[.55,'#0b2b2f'],[.56,'#031018'],[1,'#02070c']]);stars(60,.5);
      for(let k=0;k<4;k++){g.strokeStyle=k%2?'rgba(190,120,255,.5)':'rgba(90,255,170,.55)';g.lineWidth=18-k*3;g.beginPath();g.moveTo(0,h*.3+k*8);g.bezierCurveTo(w*.3,h*(.05+k*.05),w*.6,h*.5,w,h*.2+k*6);g.stroke();}
      for(let k=0;k<14;k++){const x=k*w/13,t=h*(.5+r()*.07);poly(g,[[x-9,h*.56],[x,t-14],[x+9,h*.56]],'#020807');}
      g.fillStyle='rgba(90,255,170,.12)';g.fillRect(0,h*.58,w,h*.42);break;
    case 2:
      vgrad(g,w,h,[[0,'#04101c'],[1,'#0e3452']]);glow(g,w*.5,h*.62,w*.5,'rgba(120,230,255,.55)');
      for(let k=0;k<12;k++){const x=r()*w,b=h*(.7+r()*.3),t=b-h*(.18+r()*.4);poly(g,[[x-10,b],[x,t],[x+10,b]],'rgba(130,225,255,'+(.5+r()*.4)+')');}
      for(let k=0;k<8;k++){const x=r()*w,t=h*(.1+r()*.2);poly(g,[[x-8,0],[x,t],[x+8,0]],'rgba(90,190,230,.6)');}break;
    case 3:
      vgrad(g,w,h,[[0,'#1a0305'],[.6,'#5a0f0a'],[1,'#120202']]);
      g.strokeStyle='rgba(255,120,60,.5)';g.lineWidth=3;for(let k=1;k<4;k++){g.beginPath();g.arc(w*.5,h*.3,k*w*.16,0,TAU);g.stroke();}
      glow(g,w*.5,h*.3,w*.25,'rgba(255,100,40,.5)');
      for(let k=0;k<7;k++){const x=r()*w,y=h*(.3+r()*.4);g.fillStyle='#1b0c0b';g.beginPath();g.ellipse(x,y,10+r()*16,5+r()*6,0,0,TAU);g.fill();}
      g.fillStyle='#ff6a1c';g.fillRect(0,h*.8,w,h*.2);glow(g,w*.5,h*.82,w*.6,'rgba(255,170,60,.7)');
      poly(g,[[w*.2,h*.8],[w*.28,h*.72],[w*.72,h*.72],[w*.8,h*.8]],'#150909');break;
    case 4:
      vgrad(g,w,h,[[0,'#3a2160'],[.45,'#e0683f'],[.6,'#ffb868'],[1,'#ffb868']]);
      g.fillStyle='#ffe2a0';g.beginPath();g.arc(w*.5,h*.55,w*.1,0,TAU);g.fill();glow(g,w*.5,h*.55,w*.4,'rgba(255,200,120,.55)');
      poly(g,[[0,h*.7],[w*.3,h*.6],[w*.6,h*.72],[w,h*.62],[w,h],[0,h]],'#c2603a');
      poly(g,[[0,h*.88],[w*.4,h*.76],[w,h*.9],[w,h],[0,h]],'#7d3524');
      for(let k=0;k<3;k++)poly(g,[[w*(.2+k*.22)-4,h*.74],[w*(.2+k*.22)-4,h*(.6-k*.03)],[w*(.2+k*.22)+4,h*(.6-k*.03)],[w*(.2+k*.22)+4,h*.74]],'#2c1318');break;
    case 5:
      vgrad(g,w,h,[[0,'#150704'],[.5,'#7a2a10'],[1,'#2a0d06']]);
      poly(g,[[0,0],[w*.38,0],[w*.3,h*.45],[w*.42,h],[0,h]],'#2a110a');poly(g,[[w,0],[w*.62,0],[w*.7,h*.5],[w*.58,h],[w,h]],'#33150c');
      glow(g,w*.5,h*.55,w*.3,'rgba(255,150,60,.75)');
      g.strokeStyle='#ff8a2a';g.lineWidth=2;g.beginPath();g.moveTo(w*.5,h*.45);g.lineTo(w*.46,h*.7);g.lineTo(w*.5,h);g.stroke();
      for(let k=0;k<30;k++){g.fillStyle='rgba(255,'+(120+r()*80|0)+',60,'+r()+')';g.fillRect(w*.3+r()*w*.4,r()*h,2,2);}break;
    case 6:
      vgrad(g,w,h,[[0,'#10062a'],[.6,'#8a1f78'],[1,'#ff6aa8']]);
      for(let k=0;k<18;k++){const bw=w/10+r()*10,x=k*w/16-10,t=h*(.25+r()*.45);g.fillStyle=k%3?'#12051f':'#1c0a30';g.fillRect(x,t,bw,h-t);
        for(let m=0;m<14;m++){g.fillStyle=r()<.5?'rgba(255,220,140,.9)':'rgba(120,240,255,.8)';if(r()<.6)g.fillRect(x+4+r()*(bw-10),t+6+r()*(h-t-10),2,3);}}
      g.fillStyle='#ff4fd8';g.fillRect(0,h*.92,w,3);g.fillStyle='#4ff0ff';g.fillRect(0,h*.95,w,2);break;
    case 7:
      vgrad(g,w,h,[[0,'#07041a'],[1,'#1b0b3c']]);glow(g,w*.3,h*.35,w*.5,'rgba(190,90,230,.55)');glow(g,w*.75,h*.6,w*.45,'rgba(60,200,220,.4)');stars(90,1);
      g.fillStyle='#caa0e8';g.beginPath();g.arc(w*.7,h*.32,w*.14,0,TAU);g.fill();g.strokeStyle='rgba(255,230,255,.6)';g.lineWidth=3;g.beginPath();g.ellipse(w*.7,h*.32,w*.24,w*.05,-.4,0,TAU);g.stroke();
      g.fillStyle='#3a2a52';g.beginPath();g.ellipse(w*.5,h*.9,w*.34,h*.07,0,0,TAU);g.fill();g.fillStyle='#d9b45c';g.fillRect(w*.2,h*.89,w*.6,2);break;
    case 8:
      vgrad(g,w,h,[[0,'#2a0f55'],[.5,'#e0359e'],[1,'#17c8c0']]);
      for(let k=0;k<9;k++){g.fillStyle=(k%2)?'rgba(10,0,30,.35)':'rgba(255,255,255,.1)';g.fillRect(w*(k/9),h*.65,w/9,h*.35);}
      g.strokeStyle='rgba(255,255,255,.45)';g.lineWidth=1.5;for(let k=0;k<14;k++){const x=r()*w,y=r()*h*.6,s=10+r()*28,a=r()*3;g.save();g.translate(x,y);g.rotate(a);g.strokeRect(-s/2,-s/2,s,s);g.restore();}
      glow(g,w*.5,h*.4,w*.3,'rgba(255,255,255,.3)');break;
    default: /* the rotunda, seen from a realm's way back */
      vgrad(g,w,h,[[0,'#2a1608'],[1,'#a8642a']]);glow(g,w*.5,h*.55,w*.5,'rgba(255,200,120,.8)');
      for(let k=0;k<5;k++){const x=w*(.1+k*.2);g.fillStyle='rgba(30,14,8,.8)';g.fillRect(x-6,h*.2,12,h*.8);}
      g.fillStyle='#e0bc72';g.fillRect(0,h*.88,w,3);
  }
}
const previewCache={};
function previewTex(i){
  if(!previewCache[i])previewCache[i]=canvasTex(256,384,(g,w,h)=>paintPreview(i,g,w,h),{srgb:false});
  return previewCache[i];
}


export { REALMS, paintPreview, previewTex };
