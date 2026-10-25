import { CONFIG } from './config.js';
import { LEVEL } from './levels.js';

const C = CONFIG;
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width=C.RW; canvas.height=C.RH; ctx.imageSmoothingEnabled=false;

let cam={x:LEVEL.start.x,y:LEVEL.start.y};
const sx=wx=>Math.round(C.RW/2+(wx-cam.x)*C.PX);
const sy=wy=>Math.round(C.RH/2-(wy-cam.y)*C.PX);

const P={x:LEVEL.start.x,y:LEVEL.start.y,vx:0,vy:0,grounded:false};
let attached=null, rope=0, won=false;
let checkpoint={x:LEVEL.start.x,y:LEVEL.start.y};
const trail=[];

const keys={};
addEventListener('keydown',e=>{keys[e.code]=true; if(e.code==='KeyR')reset(); if(e.code==='Space')e.preventDefault();});
addEventListener('keyup',e=>{keys[e.code]=false;});
addEventListener('mousedown',e=>{if(e.button===0)keys.Space=true;});
addEventListener('mouseup',e=>{if(e.button===0)keys.Space=false;});
addEventListener('contextmenu',e=>e.preventDefault());

function nearest(){let b=null,bd=C.attachRange;for(const L of LEVEL.pods){const d=Math.hypot(L.x-P.x,L.y-P.y);if(d<bd){bd=d;b=L;}}return b;}
function reset(){P.x=checkpoint.x;P.y=checkpoint.y;P.vx=0;P.vy=0;attached=null;won=false;}

function step(dt){
  const hold=keys.Space;
  if(hold&&!attached){const L=nearest();if(L){attached=L;rope=Math.min(C.maxRope,Math.max(C.minRope,Math.hypot(L.x-P.x,L.y-P.y)));}}
  if(!hold&&attached)attached=null;

  // horizontal control only (no up/down)
  if(P.grounded&&!attached){ if(keys.KeyA)P.vx=-C.runSpeed; else if(keys.KeyD)P.vx=C.runSpeed; else P.vx*=0.8; }
  else { if(keys.KeyA)P.vx-=C.airAccel*dt; if(keys.KeyD)P.vx+=C.airAccel*dt; }

  P.vy-=C.gravity*dt; P.x+=P.vx*dt; P.y+=P.vy*dt; P.grounded=false;

  if(attached){ const dx=P.x-attached.x,dy=P.y-attached.y,d=Math.hypot(dx,dy);
    if(d>0){const k=(d-rope)/d;P.x-=dx*k;P.y-=dy*k;const nx=dx/d,ny=dy/d,r=P.vx*nx+P.vy*ny;P.vx-=r*nx;P.vy-=r*ny;} }
  const sp=Math.hypot(P.vx,P.vy); if(sp>C.maxSpeed){const s=C.maxSpeed/sp;P.vx*=s;P.vy*=s;}

  for(const [x,y,w,h] of LEVEL.platforms){
    if(P.x>x-0.5&&P.x<x+w+0.5&&P.y-C.duckRadius<=y&&P.y-C.duckRadius>y-h-1&&P.vy<=0){
      P.y=y+C.duckRadius;P.vy=0;P.grounded=true;checkpoint={x:P.x,y:P.y};}}
  if(P.y<C.killY)reset();
  if(!won&&Math.hypot(P.x-LEVEL.goal.x,P.y-LEVEL.goal.y)<LEVEL.goal.r)won=true;
}

/* ---- pixel duck ---- */
const DUCK=[
 ".....BBBB.......",".....BBBB.......",".....BBBB.......","....bbbbbb......",
 "......YYY.......",".....YYYYY......",".....YYKYY......",".....YYYYYOOO...",
 "....YYYYYYYO....","...YYYYYYYYY.RGR","..YYYYWYYYYY.RGR","..YYYYYYYYYY.RRR",
 "..YYYYYYYYY.....","...YYYYYYY......","....O...O.......","....O...O......."];
const PAL={Y:'#ffd23f',O:'#ff8c1a',K:'#1a1a1a',W:'#fff6d0',B:'#6b4423',b:'#3a2512',R:'#d63a2f',G:'#d7dadf'};
const GW=DUCK[0].length,GH=DUCK.length;
function drawDuck(){
  const px=Math.max(2,Math.round((C.duckRadius*2.4*C.PX)/GW));
  const face=P.vx<-0.3?-1:1, tilt=Math.max(-0.5,Math.min(0.5,-P.vx*0.02));
  ctx.save();ctx.translate(sx(P.x),sy(P.y));ctx.rotate(tilt);ctx.scale(face,1);
  for(let r=0;r<GH;r++)for(let c=0;c<GW;c++){const ch=DUCK[r][c];if(ch==='.')continue;
    ctx.fillStyle=PAL[ch];ctx.fillRect((c-GW/2)*px,(r-GH/2)*px,px,px);}
  ctx.restore();
}

/* ---- steampunk city background ---- */
let t=0;
function building(bx,by,bw,bh,col){
  ctx.fillStyle=col; ctx.fillRect(bx,by,bw,bh);
  // lit windows
  ctx.fillStyle='rgba(255,200,110,0.55)';
  for(let wy=by+6; wy<by+bh-4; wy+=8) for(let wx=bx+4; wx<bx+bw-4; wx+=8)
    if(((wx*7+wy*13)>>2)%3===0) ctx.fillRect(wx,wy,3,4);
}
function smoke(x,y,phase){
  for(let i=0;i<4;i++){ const p=((t*0.5+phase+i*0.25)%1);
    ctx.globalAlpha=(1-p)*0.4; ctx.fillStyle='#b9b2a4';
    ctx.beginPath(); ctx.arc(x+Math.sin(p*6+i)*3, y-p*26, 2+p*5, 0,7); ctx.fill(); }
  ctx.globalAlpha=1;
}
function drawBG(){
  const g=ctx.createLinearGradient(0,0,0,C.RH);
  g.addColorStop(0,'#4a4660'); g.addColorStop(0.45,'#7b5f52'); g.addColorStop(1,'#a3744a');
  ctx.fillStyle=g; ctx.fillRect(0,0,C.RW,C.RH);
  // sun haze
  const sun=ctx.createRadialGradient(C.RW*0.72,C.RH*0.35,0,C.RW*0.72,C.RH*0.35,160);
  sun.addColorStop(0,'rgba(255,210,140,0.5)');sun.addColorStop(1,'rgba(255,210,140,0)');
  ctx.fillStyle=sun; ctx.fillRect(0,0,C.RW,C.RH);
  // far skyline (slow parallax)
  const layers=[{s:2,col:'#3e3850',base:C.RH-50,chim:false},{s:4,col:'#4a3f3a',base:C.RH-30,chim:true}];
  for(const L of layers){
    const off=-(cam.x*L.s)%80;
    for(let i=-1;i<C.RW/60+2;i++){
      const bx=Math.round(i*60+off*0.3+ (L.s*30)); const h=40+((i*37+L.s*11)%50); const bw=38+((i*13)%16);
      building(bx,L.base-h,bw,h+60,L.col);
      if(L.chim && i%2===0){ ctx.fillStyle='#2e2622'; ctx.fillRect(bx+bw-10,L.base-h-14,6,16); smoke(bx+bw-7,L.base-h-14,(i*0.2)%1); }
    }
  }
  // big slow gear
  ctx.save(); ctx.translate(60,60); ctx.rotate(t*0.1); ctx.strokeStyle='rgba(70,55,38,0.5)'; ctx.lineWidth=6;
  ctx.beginPath(); ctx.arc(0,0,34,0,7); ctx.stroke();
  for(let i=0;i<8;i++){const a=i/8*7; ctx.beginPath(); ctx.moveTo(Math.cos(a)*34,Math.sin(a)*34); ctx.lineTo(Math.cos(a)*44,Math.sin(a)*44); ctx.stroke();}
  ctx.restore();
}
function drawPlatforms(){
  for(const [x,y,w,h] of LEVEL.platforms){const X=sx(x),Y=sy(y),W=Math.round(w*C.PX),H=Math.round(h*C.PX);
    ctx.fillStyle='#5a4631';ctx.fillRect(X,Y,W,H); ctx.fillStyle='#c9972f';ctx.fillRect(X,Y-3,W,4);}
}
/* ---- steam-powered hover pods (the anchors) ---- */
function drawPods(){
  const near=nearest();
  for(const L of LEVEL.pods){
    const X=sx(L.x),Y=sy(L.y),on=L===near;
    const bob=Math.sin(t*2+L.x*0.5)*2;  // gentle hover
    const cy=Y+bob;
    // steam jet blowing DOWN from the bottom
    for(let i=0;i<5;i++){const p=((t*1.1+L.x*0.3+i*0.2)%1);
      ctx.globalAlpha=(1-p)*0.5; ctx.fillStyle='#e9eef2';
      ctx.beginPath(); ctx.arc(X+Math.sin(p*6+i)*3, cy+8+p*22, 1.5+p*5,0,7); ctx.fill();}
    ctx.globalAlpha=1;
    // glow
    const glow=on?16:11;
    const rg=ctx.createRadialGradient(X,cy,0,X,cy,glow);
    rg.addColorStop(0,on?'rgba(255,215,130,0.95)':'rgba(255,185,90,0.6)');rg.addColorStop(1,'rgba(255,185,90,0)');
    ctx.fillStyle=rg;ctx.beginPath();ctx.arc(X,cy,glow,0,7);ctx.fill();
    // copper body
    ctx.fillStyle='#b06a2e'; ctx.beginPath(); ctx.arc(X,cy,6,0,7); ctx.fill();   // orb
    ctx.fillStyle='#d98a3c'; ctx.fillRect(X-6,cy-1,12,2);                         // brass band
    ctx.fillStyle=on?'#fff3c0':'#ffd36b'; ctx.beginPath(); ctx.arc(X,cy-1,3,0,7); ctx.fill(); // core
    ctx.fillStyle='#6b4a2a'; ctx.fillRect(X-3,cy+5,6,3);                          // nozzle
    ctx.fillStyle='#8a5a1e'; ctx.fillRect(X-2,cy-9,4,4);                          // top valve
    if(on){ctx.strokeStyle='rgba(120,200,255,0.45)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(X,cy,C.attachRange*C.PX,0,7);ctx.stroke();}
    L._cy=cy;
  }
}
function drawGoal(){const X=sx(LEVEL.goal.x),Y=sy(LEVEL.goal.y);
  ctx.strokeStyle='#2ee07a';ctx.lineWidth=4;ctx.beginPath();ctx.arc(X,Y,LEVEL.goal.r*C.PX*0.7,0,7);ctx.stroke();
  ctx.strokeStyle='rgba(46,224,122,0.4)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(X,Y,LEVEL.goal.r*C.PX*0.7+4+Math.sin(t*4)*3,0,7);ctx.stroke();}
function drawRope(){if(!attached)return;ctx.strokeStyle='#ffd98a';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(sx(P.x),sy(P.y));ctx.lineTo(sx(attached.x),sy(attached._cy===undefined?sy(attached.y):attached._cy));ctx.stroke();}
function drawTrail(){for(let i=0;i<trail.length;i++){const p=trail[i],a=i/trail.length;
  ctx.globalAlpha=a*0.5;ctx.fillStyle=attached?'#7fd0ff':'#ffd98a';ctx.beginPath();ctx.arc(sx(p.x),sy(p.y),2,0,7);ctx.fill();}ctx.globalAlpha=1;}

let last=performance.now();
function frame(now){
  let dt=Math.min((now-last)/1000,0.033);last=now;t+=dt;
  if(!won){step(dt*0.5);step(dt*0.5);}
  cam.x+=(P.x-cam.x)*0.12;cam.y+=((P.y+2)-cam.y)*0.08;
  trail.push({x:P.x,y:P.y});if(trail.length>16)trail.shift();
  drawBG();drawPlatforms();drawPods();drawRope();drawGoal();drawTrail();drawDuck();
  if(won){ctx.fillStyle='rgba(10,8,5,.55)';ctx.fillRect(0,0,C.RW,C.RH);
    ctx.fillStyle='#ffe9b0';ctx.font='bold 24px monospace';ctx.textAlign='center';
    ctx.fillText('LEVEL COMPLETE',C.RW/2,C.RH/2);ctx.font='12px monospace';
    ctx.fillText('press R to play again',C.RW/2,C.RH/2+22);ctx.textAlign='left';}
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
