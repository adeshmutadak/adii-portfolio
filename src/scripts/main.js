// Adii portfolio: intro, 3D cabin, character routine, sound and clocks.
// three is pinned to 0.128.0 so the rendering matches the prototype exactly.
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

(function(){
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const root=document.documentElement;
try{history.scrollRestoration='manual';}catch(e){}scrollTo(0,0);
let AC=null,master=null,soundOn=true;
try{AC=new (window.AudioContext||window.webkitAudioContext)();const comp=AC.createDynamicsCompressor();comp.threshold.value=-14;comp.knee.value=12;comp.ratio.value=4;comp.attack.value=.003;comp.release.value=.25;
  master=AC.createGain();master.gain.value=.95;master.connect(comp);comp.connect(AC.destination);}catch(e){AC=null;}
const live=()=>soundOn&&AC&&AC.state==='running';
const lat=()=>live()?Math.min(.3,(AC.outputLatency||0)+(AC.baseLatency||0)):0;
const vis=fn=>{const l=lat();if(l>.015)setTimeout(fn,l*1000);else fn();};
function updSnd(){const b=document.getElementById('snd');if(b){b.textContent=!soundOn?'Sound off':(live()?'Sound on':'Tap for sound');b.setAttribute('aria-pressed',live()?'true':'false');}
  const hn=document.getElementById('shint');if(hn)hn.classList.toggle('off',!!live()||!soundOn);}
function unlock(){if(AC&&AC.state!=='running'){try{AC.resume().then(updSnd,updSnd);}catch(e){}}}
['pointerdown','keydown','touchstart'].forEach(ev=>addEventListener(ev,unlock,{passive:true}));
if(AC)AC.onstatechange=updSnd;
function tone(f,d,type,v,when,slide,att){if(!live())return;const t=AC.currentTime+(when||0);const o=AC.createOscillator(),g=AC.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(slide,t+d);const a=att||.008;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v||.1,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+Math.max(d,a+.01));o.connect(g);g.connect(master);o.start(t);o.stop(t+d+.05);}
let nbuf=null;
function noise(d,v,when,type,freq,freqTo){if(!live())return;if(!nbuf){nbuf=AC.createBuffer(1,AC.sampleRate*2,AC.sampleRate);const c=nbuf.getChannelData(0);for(let i=0;i<c.length;i++)c[i]=Math.random()*2-1;}
  const t=AC.currentTime+(when||0);const src=AC.createBufferSource();src.buffer=nbuf;const g=AC.createGain();g.gain.setValueAtTime(v||.1,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);let node=src;
  if(type){const bq=AC.createBiquadFilter();bq.type=type;bq.frequency.setValueAtTime(freq||1000,t);if(freqTo)bq.frequency.exponentialRampToValueAtTime(freqTo,t+d);src.connect(bq);node=bq;}
  node.connect(g);g.connect(master);src.start(t);src.stop(t+d+.05);}
const sfx={
  blip:()=>tone(1320,.06,'square',.09),
  warn:()=>{tone(880,.09,'triangle',.22);tone(660,.13,'triangle',.22,.1);},
  err:()=>{tone(196,.26,'sawtooth',.22);tone(185,.26,'sawtooth',.16);},
  fatal:()=>{tone(98,.7,'sawtooth',.3,0,62);noise(.35,.3,0,'lowpass',500);},
  drone:d=>{tone(55,d,'sawtooth',.16,0,110,d*.85);tone(82.4,d,'triangle',.12,0,165,d*.85);},
  heart:()=>{tone(72,.18,'sine',.75,0,45);tone(66,.18,'sine',.55,.17,40);},
  boom:()=>{tone(110,1.5,'sine',1,0,28);noise(1.1,.8,0,'lowpass',1400,90);},
  siren:()=>{for(let i=0;i<3;i++)tone(620,.48,'sawtooth',.17,i*.48,980);},
  glitch:w=>noise(.06,.35,w,'bandpass',1800),
  powerdown:()=>tone(440,.5,'sawtooth',.2,0,45),
  key:w=>noise(.035,.3,w,'highpass',2400),
  typing:n=>{for(let i=0;i<n;i++)sfx.key(i*.055+Math.random()*.02);},
  hum:()=>tone(140,1.1,'sawtooth',.11,0,720,.25),
  chime:i=>{tone([523.25,659.25,783.99][i%3],.75,'sine',.32);tone([1046.5,1318.5,1568][i%3],.45,'sine',.09);},
  success:()=>[523.25,659.25,783.99,1046.5].forEach((f,i)=>tone(f,1.3,'sine',.2,i*.07)),
  pad:()=>{[261.63,329.63,392,523.25].forEach((f,i)=>tone(f,2.8,'triangle',.14,i*.05,0,.7));tone(130.8,3,'sine',.22,0,0,.8);},
  whoosh:()=>{noise(1,.55,0,'bandpass',250,3500);tone(80,.9,'sine',.45,0,38);},
  tick:alt=>tone(alt?2600:2000,.025,'square',.03),
  boing:()=>tone(220,.35,'sine',.26,0,880),
  slide:()=>tone(1500,.5,'sine',.22,0,160),
  thud:()=>{tone(120,.45,'sine',.8,0,38);noise(.2,.45,0,'lowpass',700);},
  laugh:()=>{[0,.16,.32,.5].forEach((w,i)=>tone(520-i*40,.12,'triangle',.16,w,420-i*40));},
  kick:w=>tone(150,.22,'sine',.65,w,45),
  hat:w=>noise(.05,.13,w,'highpass',7000),
  bass:(w,f)=>tone(f,.2,'square',.08,w)
};
const BASS=[110,110,164.8,146.8,110,110,196,164.8];var nextBeat=0,beatN=0;
function music(){if(!soundOn||!AC)return;const n=AC.currentTime;if(nextBeat<n)nextBeat=n+.03;while(nextBeat<n+.15){const w=nextBeat-n;if(beatN%2===0)sfx.kick(w);else sfx.hat(w);sfx.bass(w,BASS[beatN%8]);beatN++;nextBeat+=.25;}}
function istNow(){const d=new Date();return new Date(d.getTime()+d.getTimezoneOffset()*60000+19800000);}
const p2=n=>String(n).padStart(2,'0');
const istEl=document.getElementById('istt');
function navClock(){const d=istNow();istEl.textContent=p2(d.getHours())+':'+p2(d.getMinutes())+':'+p2(d.getSeconds());}
navClock();setInterval(navClock,1000);
document.getElementById('snd').addEventListener('click',()=>{if(soundOn&&live())soundOn=false;else{soundOn=true;unlock();}updSnd();});
updSnd();
const C={navy:0x0b1824,orange:0xff5a1f,cream:0xf2e8d5,teal:0x3fb8a8,brass:0xc9a24a,teak:0x7a4f32,teakD:0x4a3020,steel:0x1c2733,wall:0x15293d};

document.querySelectorAll('.big .ln').forEach((ln,li)=>{let n=li*6;ln.innerHTML=[...ln.dataset.t].map(c=>'<span class="ch'+(c==='.'?' dot':'')+'" style="--i:'+(n++)+'">'+c+'</span>').join('');ln.setAttribute('aria-hidden','true');});

const intro=document.getElementById('intro');let lightsOn=0;
document.querySelectorAll('#intro .nm span').forEach((sp,i)=>sp.style.transitionDelay=(.25+i*.07)+'s');
try{document.getElementById('itime').textContent=new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});}catch(e){}
const timers=[];const at=(ms,fn)=>timers.push(setTimeout(fn,ms));
let gateOpen=false,runAction=null,chimeI=0;
const act=document.getElementById('act'),term=document.getElementById('term');
function line(txt,cls){if(cls==='e'){if(txt.indexOf('FATAL')>-1)sfx.fatal();else sfx.err();}else if(cls==='w')sfx.warn();else if(cls==='ok')sfx.chime(chimeI++);else if(txt)sfx.blip();vis(()=>lineNow(txt,cls));}
function lineNow(txt,cls){const d=document.createElement('div');if(cls)d.className=cls;d.textContent=txt;term.appendChild(d);while(term.children.length>9)term.removeChild(term.firstChild);}
function reveal(){if(intro.hidden||intro.classList.contains('open'))return;gateOpen=false;sfx.whoosh();scrollTo(0,0);timers.forEach(clearTimeout);act.classList.add('out');act.classList.remove('crit');intro.classList.add('go','open');root.classList.add('ready');lightsOn=performance.now();setTimeout(()=>{intro.hidden=true;},1150);setTimeout(maybePop,30000);}
function horizon(after){act.classList.add('out');intro.classList.add('go');at(after,reveal);}
let seen=false;
document.getElementById('skipb').addEventListener('click',e=>{e.stopPropagation();reveal();});
addEventListener('keydown',e=>{if(e.key==='Escape'&&!intro.hidden)reveal();});
if(reduce){intro.hidden=true;root.classList.add('ready');lightsOn=performance.now();setTimeout(maybePop,30000);}
else if(seen){requestAnimationFrame(()=>requestAnimationFrame(()=>horizon(2600)));}
else{runAction=function(){act.hidden=false;
  function typeLine(txt,cls,ms,done){const d=document.createElement('div');d.className=cls;term.appendChild(d);let i=0;const iv=setInterval(()=>{i++;if(txt[i-1]&&txt[i-1]!==' ')sfx.key(0);const k=i;vis(()=>{d.textContent=txt.slice(0,k);});if(i>=txt.length){clearInterval(iv);if(done)done();}},ms);timers.push(iv);}
  sfx.drone(1.6);
  const L=[[0,'[02:14:07] srv-01.prod   boot ok · uptime 41d',''],[220,'[02:14:08] manifest sync  3 client feeds connected',''],[480,'[02:14:10] WARN  satellite link unstable · 1,240 ms','w'],[760,'[02:14:11] WARN  queue backlog 2,840 records','w'],[1000,'[02:14:12] ERROR soap gateway timeout · client B','e'],[1180,'[02:14:12] ERROR mysql pool exhausted (100/100)','e'],[1340,'[02:14:13] FATAL srv-01 not responding','e']];
  L.forEach(([t,txt,c])=>at(t,()=>line(txt,c)));
  [620,1020,1280,1450].forEach(t=>at(t,()=>sfx.heart()));
  at(1550,()=>{sfx.boom();sfx.siren();for(let i=0;i<7;i++)sfx.glitch(i*.2);vis(()=>act.classList.add('crit'));});
  at(3000,()=>{sfx.powerdown();vis(()=>{act.classList.remove('crit');act.classList.add('fix');});line('');});
  at(3350,()=>typeLine('adii@srv-01:~$ ./hotfix --deploy --no-downtime','p',18,()=>{
    sfx.hum();vis(()=>act.classList.add('fill'));
    at(1050,()=>line('✓ mysql pool recycled · 12 connections','ok'));
    at(1250,()=>line('✓ gateway retry policy applied','ok'));
    at(1450,()=>{line('✓ srv-01 healthy · 0 records lost','ok');sfx.success();});
    at(2000,()=>{sfx.pad();vis(()=>act.classList.add('calm'));});
    at(3700,reveal);}));
};runAction();}

const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('in');}),{threshold:.2});
document.querySelectorAll('.card').forEach(c=>io.observe(c));

const toast=document.getElementById('toast');let tt=0;
const pop=document.getElementById('pop');let popDone=false;
try{popDone=sessionStorage.getItem('adii-pop')==='1';}catch(e){}
function maybePop(){if(popDone||!intro.hidden&&!intro.classList.contains('open'))return;popDone=true;try{sessionStorage.setItem('adii-pop','1');}catch(e){}
  pop.hidden=false;requestAnimationFrame(()=>requestAnimationFrame(()=>pop.classList.add('show')));}
function closePop(){pop.classList.remove('show');setTimeout(()=>{pop.hidden=true;},500);}
document.getElementById('popx').onclick=closePop;
document.getElementById('bgo').addEventListener('click',()=>{const b=document.getElementById('bubble');b.classList.remove('show');setTimeout(()=>{b.hidden=true;},300);});
document.getElementById('popgo').addEventListener('click',closePop);
addEventListener('keydown',e=>{if(e.key==='Escape'&&!pop.hidden)closePop();});
document.getElementById('popcopy').onclick=function(){const b=this;try{navigator.clipboard.writeText('adeshmutadak@gmail.com').then(()=>{b.textContent='Copied';},()=>{b.textContent='adeshmutadak@gmail.com';});}catch(e){b.textContent='adeshmutadak@gmail.com';}};
function say(html,ms){toast.innerHTML=html;toast.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>toast.classList.remove('show'),ms||3600);}

document.getElementById('copy').onclick=function(){const b=this,t=document.getElementById('addr').textContent;
  const sel=()=>{const r=document.createRange();r.selectNodeContents(document.getElementById('addr'));const s=getSelection();s.removeAllRanges();s.addRange(r);};
  try{navigator.clipboard.writeText(t).then(()=>{b.textContent='Copied';setTimeout(()=>b.textContent='Copy',1500);},sel);}catch(e){sel();}};
const flatBtn=document.getElementById('flat');
flatBtn.onclick=()=>{const on=root.classList.toggle('flat');flatBtn.textContent=on?'Show 3D':'Skip 3D';flatBtn.setAttribute('aria-pressed',on);};

const KEYSET=['monitor','holo','rack','phone','shelf','lamp','mug','buoy','me'];
const found=new Set();
const ticks=document.getElementById('ticks');ticks.innerHTML=KEYSET.map(()=>'<i></i>').join('');
function mark(k){if(found.has(k))return false;found.add(k);
  document.getElementById('fcount').textContent=found.size;
  [...ticks.children].forEach((t,i)=>t.classList.toggle('on',i<found.size));
  document.querySelectorAll('.st[data-k="'+k+'"]').forEach(s=>{s.textContent='explored';s.classList.add('got');});
  document.getElementById('contactst').textContent=found.size+'/9 explored';
  if(found.size===9)setTimeout(()=>say('You explored the whole cabin. That curiosity is exactly what I bring to a codebase. <a href="#contact">Let\'s talk</a>',7000),900);
  return true;}

const steps=[...document.querySelectorAll('.step')];
const dots=[...document.querySelectorAll('.dots a')];


const cv=document.getElementById('gl');
let r;try{r=new THREE.WebGLRenderer({canvas:cv,antialias:true,powerPreference:'high-performance'});}catch(e){root.classList.add('flat');flatBtn.hidden=true;return;}
r.setPixelRatio(Math.min(devicePixelRatio,1.5));
r.setClearColor(0x020509,1);
r.outputEncoding=THREE.sRGBEncoding;
r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=1.1;
const s=new THREE.Scene();s.fog=new THREE.Fog(0x020509,13,28);
const cam=new THREE.PerspectiveCamera(40,1,0.1,60);

const std=(c,o)=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.75,metalness:.1},o||{}));
const glow=(c,k)=>{const m=new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(k||1.6)});m.toneMapped=false;return m;};
function box(w,h,d,mat,x,y,z,g){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);(g||s).add(m);return m;}
function canvasTex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');draw(x,w,h);const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=4;return {c,x,t};}

const hemi=new THREE.HemisphereLight(0x9fc3ff,0x2a1a10,0);s.add(hemi);
const moon=new THREE.DirectionalLight(0xbcd4ff,0);moon.position.set(2,4,-6);s.add(moon);
const lampL=new THREE.PointLight(0xffa45c,0,9,1.6);lampL.position.set(1.65,2.3,-2.4);s.add(lampL);
const monL=new THREE.PointLight(0x7fd6c8,0,6,1.8);monL.position.set(0,2.1,-1.7);s.add(monL);
const front=new THREE.PointLight(0x5d8fc4,0,14,1.4);front.position.set(4,3.5,4);s.add(front);

const deck=canvasTex(512,512,(x)=>{for(let i=0;i<16;i++){const v=[0x3d2718,0x45301f,0x4f3824,0x3a2516][i%4];x.fillStyle='#'+v.toString(16).padStart(6,'0');x.fillRect(0,i*32,512,32);
  x.fillStyle='#120b06';x.fillRect(0,i*32+30,512,2);const off=(i*137)%512;x.fillRect(off,i*32,2,32);x.fillRect((off+256)%512,i*32,2,32);}});
deck.t.wrapS=deck.t.wrapT=THREE.RepeatWrapping;deck.t.repeat.set(3,3);
box(10,.1,8,std(0xffffff,{map:deck.t,roughness:.8}),0,-.05,0);
box(10,5,.1,std(C.wall,{roughness:.6,metalness:.3}),0,2.5,-3.5);
box(.1,5,8,std(0x12243a,{roughness:.6,metalness:.3}),-4.6,2.5,0);
for(let i=0;i<6;i++){box(.04,5,.06,std(0x1d3550,{metalness:.5}),-4+i*1.6,2.5,-3.44);}
box(10,.08,.1,std(0x1d3550,{metalness:.5}),0,.6,-3.42);
const sign=canvasTex(512,128,(x,w,h)=>{x.clearRect(0,0,w,h);x.font='600 46px "IBM Plex Mono", monospace';x.fillStyle='#f2e8d5';x.globalAlpha=.75;x.fillText('DECK 7',8,52);x.font='500 26px "IBM Plex Mono", monospace';x.fillStyle='#ff5a1f';x.globalAlpha=.9;x.fillText('ENGINEERING · CREW ONLY',8,100);});
const signM=new THREE.MeshBasicMaterial({map:sign.t,transparent:true,depthWrite:false});
const signP=new THREE.Mesh(new THREE.PlaneGeometry(2,.5),signM);signP.position.set(-2,3.9,-3.43);s.add(signP);

const rose=canvasTex(512,512,(x)=>{x.fillStyle='#e9dcc2';x.beginPath();x.arc(256,256,250,0,7);x.fill();
  x.strokeStyle='#0b1824';x.lineWidth=3;x.beginPath();x.arc(256,256,232,0,7);x.stroke();x.lineWidth=1.5;x.beginPath();x.arc(256,256,200,0,7);x.stroke();
  for(let i=0;i<72;i++){const a=i*Math.PI/36,r1=i%2?222:212;x.beginPath();x.moveTo(256+Math.cos(a)*232,256+Math.sin(a)*232);x.lineTo(256+Math.cos(a)*r1,256+Math.sin(a)*r1);x.stroke();}
  for(let i=0;i<8;i++){const a=i*Math.PI/4-Math.PI/2,len=i%2?110:185;x.fillStyle=i===0?'#ff5a1f':(i%2?'#4a5b6b':'#0b1824');
    x.beginPath();x.moveTo(256+Math.cos(a)*len,256+Math.sin(a)*len);x.lineTo(256+Math.cos(a+Math.PI/2)*22,256+Math.sin(a+Math.PI/2)*22);x.lineTo(256,256);x.closePath();x.fill();
    x.beginPath();x.moveTo(256+Math.cos(a)*len,256+Math.sin(a)*len);x.lineTo(256+Math.cos(a-Math.PI/2)*22,256+Math.sin(a-Math.PI/2)*22);x.lineTo(256,256);x.closePath();x.globalAlpha=.7;x.fill();x.globalAlpha=1;}
  x.font='700 30px "IBM Plex Mono", monospace';x.fillStyle='#0b1824';x.textAlign='center';x.textBaseline='middle';[['N',0],['E',1],['S',2],['W',3]].forEach(([l,i])=>{const a=i*Math.PI/2-Math.PI/2;x.fillText(l,256+Math.cos(a)*165,256+Math.sin(a)*165);});});
const rug=new THREE.Mesh(new THREE.CircleGeometry(1.9,64),std(0xffffff,{map:rose.t,roughness:.95}));rug.rotation.x=-Math.PI/2;rug.rotation.z=.3;rug.position.set(.3,.012,.2);s.add(rug);

let wave=0;
const sea=canvasTex(512,512,()=>{});
function drawSea(){const x=sea.x;const g=x.createLinearGradient(0,0,0,300);g.addColorStop(0,'#061220');g.addColorStop(1,'#1d3d5c');x.fillStyle=g;x.fillRect(0,0,512,300);
  x.fillStyle='#ffffff';for(let i=0;i<40;i++){const sx=(i*97)%512,sy=(i*53)%260;x.globalAlpha=.3+((i*7)%10)/14;x.fillRect(sx,sy,2,2);}x.globalAlpha=1;
  x.fillStyle='#f6ecd6';x.beginPath();x.arc(340,140,36,0,7);x.fill();
  x.fillStyle='#08182a';x.fillRect(0,300,512,212);
  for(let row=0;row<9;row++){x.strokeStyle=row%3?'#2c5577':'#f6ecd6';x.globalAlpha=row%3?.55:.25;x.lineWidth=2;x.beginPath();
    for(let px=0;px<=512;px+=8){const y=312+row*22+Math.sin(px*.03+wave*(1+row*.2)+row)*3;px?x.lineTo(px,y):x.moveTo(px,y);}x.stroke();}
  x.globalAlpha=.35;x.fillStyle='#f6ecd6';x.fillRect(320,300,40,4);x.fillRect(326,316,28,3);x.fillRect(332,332,16,3);x.globalAlpha=1;sea.t.needsUpdate=true;}
drawSea();
const port=new THREE.Group();
const glassM=new THREE.MeshBasicMaterial({map:sea.t});glassM.toneMapped=false;glassM.color.setScalar(.82);
const glass=new THREE.Mesh(new THREE.CircleGeometry(.78,48),glassM);port.add(glass);
const pframe=new THREE.Mesh(new THREE.TorusGeometry(.82,.1,16,48),std(C.brass,{metalness:.85,roughness:.3}));pframe.position.z=.02;port.add(pframe);
for(let i=0;i<8;i++){const a=i*Math.PI/4;const b=new THREE.Mesh(new THREE.SphereGeometry(.035,10,8),std(C.brass,{metalness:.9,roughness:.25}));b.position.set(Math.cos(a)*.98,Math.sin(a)*.98,.03);port.add(b);}
const ring2=new THREE.Mesh(new THREE.TorusGeometry(1,.035,8,48),std(C.brass,{metalness:.85,roughness:.35}));port.add(ring2);
port.position.set(2.1,2.8,-3.42);s.add(port);
const clockFace=canvasTex(256,256,(x)=>{x.fillStyle='#f2e8d5';x.beginPath();x.arc(128,128,124,0,7);x.fill();x.strokeStyle='#0b1824';
  for(let i=0;i<60;i++){const a=i*Math.PI/30;const r1=i%5?110:98;x.lineWidth=i%5?2:5;x.beginPath();x.moveTo(128+Math.cos(a)*118,128+Math.sin(a)*118);x.lineTo(128+Math.cos(a)*r1,128+Math.sin(a)*r1);x.stroke();}
  x.fillStyle='#0b1824';x.font='700 30px "Bricolage Grotesque", sans-serif';x.textAlign='center';x.textBaseline='middle';
  [['12',0],['3',1],['6',2],['9',3]].forEach(([n,i])=>{const a=i*Math.PI/2-Math.PI/2;x.fillText(n,128+Math.cos(a)*78,128+Math.sin(a)*78);});
  x.fillStyle='#ff5a1f';x.font='600 18px "IBM Plex Mono", monospace';x.fillText('IST',128,172);});
const wallClock=new THREE.Group();const faceM=new THREE.MeshBasicMaterial({map:clockFace.t});faceM.toneMapped=false;faceM.color.setScalar(.9);
wallClock.add(new THREE.Mesh(new THREE.CircleGeometry(.42,48),faceM));
const crim=new THREE.Mesh(new THREE.TorusGeometry(.44,.045,12,48),std(C.navy,{metalness:.5,roughness:.4}));wallClock.add(crim);
function mkHand(len,w,mat,z){const g=new THREE.Group();const m=new THREE.Mesh(new THREE.BoxGeometry(w,len,.012),mat);m.position.y=len/2-.05;g.add(m);g.position.z=z;wallClock.add(g);return g;}
const handH=mkHand(.24,.04,std(C.navy),.015),handM=mkHand(.34,.026,std(C.navy),.025),handS=mkHand(.38,.012,std(C.orange),.035);
const ccap=new THREE.Mesh(new THREE.SphereGeometry(.03,12,10),std(C.orange));ccap.position.z=.04;wallClock.add(ccap);
wallClock.position.set(0,3.62,-3.42);s.add(wallClock);
let lastSec=-1;

const buoy=new THREE.Group(),buoyRing=new THREE.Group();
for(let i=0;i<4;i++){const seg=new THREE.Mesh(new THREE.TorusGeometry(.42,.12,14,24,Math.PI/2),std(i%2?C.cream:C.orange,{roughness:.55}));seg.rotation.z=i*Math.PI/2;buoyRing.add(seg);}
const rope=new THREE.Mesh(new THREE.TorusGeometry(.42,.02,6,64),std(0xd9c9a3));rope.position.z=.1;buoyRing.add(rope);
buoy.add(buoyRing);buoy.rotation.y=Math.PI/2;buoy.position.set(-4.5,2.75,-1.3);s.add(buoy);
let buoySpin=0;

box(4,.1,1.8,std(C.teak,{roughness:.55}),0,1.2,-2.25);
[[-1.85,-3],[1.85,-3],[-1.85,-1.5],[1.85,-1.5]].forEach(p=>box(.08,1.15,.08,std(C.steel,{metalness:.7,roughness:.35}),p[0],.58,p[1]));
const chair=new THREE.Group();const cm=std(C.orange,{roughness:.5});box(.95,.12,.95,cm,0,.58,0,chair);box(.9,.55,.12,cm,0,.95,.46,chair);box(.08,.5,.08,std(C.steel,{metalness:.8}),0,.3,0,chair);
for(let i=0;i<5;i++){const leg=box(.45,.04,.06,std(C.steel,{metalness:.8}),0,.06,0,chair);leg.rotation.y=i*Math.PI*2/5;leg.translateX(.2);}
chair.position.set(.2,0,-.85);chair.rotation.y=.38;s.add(chair);
function limb(a,b,rad,mat,g){const d=new THREE.Vector3().subVectors(b,a);const len=d.length();const m=new THREE.Mesh(new THREE.CylinderGeometry(rad,rad,len,12),mat);m.position.copy(a).addScaledVector(d,.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());g.add(m);
  const j=new THREE.Mesh(new THREE.SphereGeometry(rad,12,10),mat);j.position.copy(b);g.add(j);return m;}
const P=(x,y,z)=>new THREE.Vector3(x,y,z);
const hoodie=std(0x2c5d7a,{roughness:.85}),pants=std(0x1d2430,{roughness:.9}),skin=std(0xb7825a,{roughness:.7}),hair=std(0x15100c,{roughness:.9}),shoe=std(0xe9dcc2,{roughness:.6});
const rig=new THREE.Group();rig.rotation.order='YXZ';s.add(rig);
const hips=new THREE.Group();rig.add(hips);
box(.44,.2,.3,pants,0,0,.02,hips);
const legs=[];
[-1,1].forEach(sd=>{const hj=new THREE.Group();hj.position.set(sd*.12,-.04,0);hips.add(hj);
  const th=new THREE.Mesh(new THREE.CylinderGeometry(.09,.08,.5,12),pants);th.position.y=-.25;hj.add(th);
  const kj=new THREE.Group();kj.position.y=-.5;hj.add(kj);
  kj.add(new THREE.Mesh(new THREE.SphereGeometry(.08,12,10),pants));
  const shn=new THREE.Mesh(new THREE.CylinderGeometry(.075,.065,.58,12),pants);shn.position.y=-.29;kj.add(shn);
  box(.13,.08,.27,shoe,0,-.6,-.07,kj);legs.push({hj,kj});});
const spine=new THREE.Group();spine.position.y=.1;hips.add(spine);
box(.5,.6,.3,hoodie,0,.3,0,spine);
const hood=new THREE.Mesh(new THREE.TorusGeometry(.13,.06,8,20),hoodie);hood.rotation.x=Math.PI/2;hood.position.set(0,.6,.05);spine.add(hood);
const arms=[];
[-1,1].forEach(sd=>{const sj=new THREE.Group();sj.position.set(sd*.3,.55,0);spine.add(sj);
  sj.add(new THREE.Mesh(new THREE.SphereGeometry(.075,12,10),hoodie));
  const ua=new THREE.Mesh(new THREE.CylinderGeometry(.07,.064,.32,12),hoodie);ua.position.y=-.16;sj.add(ua);
  const ej=new THREE.Group();ej.position.y=-.32;sj.add(ej);
  ej.add(new THREE.Mesh(new THREE.SphereGeometry(.064,12,10),hoodie));
  const fa=new THREE.Mesh(new THREE.CylinderGeometry(.06,.05,.3,12),hoodie);fa.position.y=-.15;ej.add(fa);
  const hand=new THREE.Mesh(new THREE.SphereGeometry(.058,12,10),skin);hand.position.y=-.34;hand.scale.set(1,1.2,.8);ej.add(hand);
  arms.push({sj,ej,sd});});
const neck=new THREE.Mesh(new THREE.CylinderGeometry(.065,.07,.14,12),skin);neck.position.set(0,.66,.02);spine.add(neck);
const headG=new THREE.Group();headG.position.set(0,.7,.02);spine.add(headG);
const headM=new THREE.Mesh(new THREE.SphereGeometry(.16,20,16),skin);headM.position.set(0,.16,-.02);headM.scale.set(1,1.08,1.02);headG.add(headM);
const hairM=new THREE.Mesh(new THREE.SphereGeometry(.172,20,14,0,Math.PI*2,0,Math.PI*.56),hair);hairM.position.set(0,.18,0);hairM.rotation.x=.35;headG.add(hairM);
const eyeM=std(0x15100c);[-1,1].forEach(sd=>{const e=new THREE.Mesh(new THREE.SphereGeometry(.018,8,6),eyeM);e.position.set(sd*.06,.19,-.17);headG.add(e);});
const smile=new THREE.Mesh(new THREE.TorusGeometry(.045,.01,6,16,Math.PI),eyeM);smile.rotation.z=Math.PI;smile.position.set(0,.11,-.172);headG.add(smile);
const hsBlack=std(0x101418,{roughness:.4,metalness:.3}),hsOrange=std(C.orange,{roughness:.45});
const hsBand=new THREE.Mesh(new THREE.TorusGeometry(.2,.028,8,28,Math.PI),hsOrange);hsBand.position.set(0,.17,0);headG.add(hsBand);
[-1,1].forEach(sd=>{const cup=new THREE.Mesh(new THREE.CylinderGeometry(.095,.095,.08,20),hsBlack);cup.rotation.z=Math.PI/2;cup.position.set(sd*.19,.15,0);headG.add(cup);
  const cap=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.085,20),hsOrange);cap.rotation.z=Math.PI/2;cap.position.set(sd*.205,.15,0);headG.add(cap);});
limb(P(-.2,.12,0),P(-.11,.03,-.17),.012,hsBlack,headG);
const micTip=new THREE.Mesh(new THREE.SphereGeometry(.028,10,8),hsOrange);micTip.position.set(-.11,.03,-.17);headG.add(micTip);
const person=rig;
const SIT={x:.155,z:-.96,ry:.38,hy:.74},STAND={x:.85,z:-.15,ry:-2.45,hy:1.16},FRONT={x:2.25,z:1.55};
var perfT=-1,perfS=0,perfW=0,perfTries=0,bubbleOff=false,curBeat=-1,perfCount=0,lastPerfEnd=0,prevT=-1;
const lerp=(a,b,k)=>a+(b-a)*k,ease=k=>k<0?0:k>1?1:k*k*(3-2*k);
const bubble=document.getElementById('bubble'),btxt=document.getElementById('btxt'),btitle=document.getElementById('btitle'),bgo=document.getElementById('bgo');
bgo.addEventListener('click',()=>{bubbleOff=true;});
const BEATS=[[2.2,4.6,"Hey! I'm Adii.","Thanks for stopping by my cabin.",0],[4.6,6.6,"Hold on…","First, let me show you my dance skills.",0],[6.6,9.6,"♪ ♫ ♪","(dancing intensifies)",0],[10.2,11.4,"Ouch!","That floor came out of nowhere.",0],[11.8,13.3,"Okay…","I'm not a good dancer.",0],[13.3,16.2,"But I'm a really good developer.","Ha ha! Let's connect and grow together.",1]];
const tmpV=new THREE.Vector3();
function startPerf(){if(perfT>=0)return;perfT=0;perfCount++;bubbleOff=false;curBeat=-1;prevT=-1;}
function tryPerf(){try{if(perfT<0&&lastActive<=0&&!root.classList.contains('flat')&&(!pop||pop.hidden))startPerf();else if(++perfTries<6)setTimeout(tryPerf,2500);}catch(e){}}
function endBubble(){bubble.classList.remove('show');setTimeout(()=>{bubble.hidden=true;},300);}
function updateRig(dt,t){
  const on=perfT>=0;if(on)perfT+=dt;const T=perfT;
  const win=(a,b,r)=>!on?0:T<a?0:T<a+r?ease((T-a)/r):T<b-r?1:T<b?1-ease((T-b+r)/r):0;
  const s0=!on?0:T<1?ease(T/.9):T<17.4?1:1-ease((T-17.4)/1);
  const fw=!on?0:T<1?0:T<2.2?ease((T-1)/1.2):T<16.2?1:T<17.4?1-ease((T-16.2)/1.2):0;
  const wk=on&&((T>1&&T<2.2)||(T>16.2&&T<17.4))?1:0;
  const dc=win(6.6,9.75,.3),w0=win(2.2,4.7,.3),scratch=win(11.8,13.4,.3),point=win(13.3,16.1,.3),laugh=on&&T>13.7&&T<15.9?1:0;
  const fl=!on?0:T<9.6?0:T<10.1?Math.pow((T-9.6)/.5,2):T<11?1:T<11.8?1-ease((T-11)/.8):0,flail=on&&T>9.5&&T<10.3?1:0,imp=on&&T>10.1&&T<10.4?Math.sin((T-10.1)/.3*Math.PI)*.07:0;
  const r=reduce?0:1;
  let spin=0;if(on&&T>8.4&&T<9.3)spin=ease((T-8.4)/.9)*Math.PI*2*r;
  let hop=0;if(on&&T>4.6&&T<5&&r)hop=Math.sin((T-4.6)/.4*Math.PI)*.14;
  perfS=s0;perfW=w0;
  {const pT=prevT;prevT=T;const L0=lat();const X=x=>on&&pT<x-L0&&T>=x-L0;if(X(4.6))sfx.boing();if(X(9.62))sfx.slide();if(X(10.1))sfx.thud();if(X(13.75))sfx.laugh();if(on&&T>6.6&&T<9.6)music();}
  const ts=ease(s0);
  rig.position.set(lerp(lerp(SIT.x,STAND.x,ts),FRONT.x,fw)+Math.sin(t*8)*.08*dc*r,0,lerp(lerp(SIT.z,STAND.z,ts),FRONT.z,fw));
  rig.rotation.y=lerp(SIT.ry,STAND.ry,ts)+spin;rig.rotation.x=fl*1.52-imp;
  const bounce=(1+Math.sin(t*16))*.5*dc*r;
  hips.position.y=lerp(SIT.hy,STAND.hy,s0)+hop+wk*Math.abs(Math.sin(t*9))*.04*r-bounce*.07;
  legs.forEach((l,i)=>{const sd=i?1:-1;let hx=lerp(Math.PI/2,0,s0),kx=lerp(-Math.PI/2,0,s0);
    hx+=wk*r*Math.sin(t*9+(sd>0?0:Math.PI))*.45;kx-=wk*r*Math.max(0,Math.sin(t*9+(sd>0?Math.PI/2:Math.PI*1.5)))*.7;
    hx+=.3*bounce;kx-=.6*bounce;if(hop>0){hx-=.25*hop/.14;kx+=.5*hop/.14;}
    if(fl>0&&sd>0)hx-=.75*fl;l.hj.rotation.x=hx;l.kj.rotation.x=kx;});
  spine.rotation.x=lerp(-.15,.04,s0)+laugh*(.14+Math.sin(t*30)*.04*r);
  spine.rotation.z=(Math.sin(t*8)*.18*dc+Math.sin(t*3)*.04*w0)*r;
  const disco=on&&T>8.6;
  arms.forEach(a=>{const sd=a.sd;const typ=(r&&s0<.1)?Math.sin(t*22+sd*1.7)*.035:0;
    let sx=lerp(.9+typ,.08,s0),sz=lerp(-sd*.12,sd*.1,s0),ex=lerp(.97,.25,s0),ez=0;
    sx-=wk*r*Math.sin(t*9+(sd>0?0:Math.PI))*.5;
    if(sd>0&&w0>0){sx=lerp(sx,-.15,w0);sz=lerp(sz,2.55,w0);ex=lerp(ex,0,w0);ez=lerp(ez,.35+r*Math.sin(t*15)*.55,w0);}
    if(sd<0&&w0>0){sz=lerp(sz,-.35,w0);ex=lerp(ex,1.2,w0);}
    if(dc>0){let dz,dex,dez,dsx=0;
      if(!disco){dz=sd*(2.6+Math.sin(t*8)*.25*r);dex=0;dez=sd*(.5+Math.sin(t*16)*.45*r);}
      else if(sd>0){dz=Math.sin(t*6)>0||!r?2.7:.6;dsx=-.2;dex=0;dez=0;}
      else{dz=-.55;dex=1.7;dez=0;}
      sx=lerp(sx,dsx,dc);sz=lerp(sz,dz,dc);ex=lerp(ex,dex,dc);ez=lerp(ez,dez,dc);}
    if(sd>0&&scratch>0){sx=lerp(sx,.1,scratch);sz=lerp(sz,2.25,scratch);ex=lerp(ex,0,scratch);ez=lerp(ez,2.1+r*Math.sin(t*20)*.12,scratch);}
    if(point>0){if(sd>0){sx=lerp(sx,1.45,point);sz=lerp(sz,.05,point);ex=lerp(ex,0,point);ez=lerp(ez,0,point);}
      else{sx=lerp(sx,.75,point);sz=lerp(sz,-.1,point);ex=lerp(ex,1.75,point);ez=lerp(ez,0,point);}}
    if(flail>0){sx=-.3;sz=sd*(2.3+r*Math.sin(t*25+sd)*.35);ex=0;ez=sd*.4;}
    a.sj.rotation.x=sx;a.sj.rotation.z=sz;a.ej.rotation.x=ex;a.ej.rotation.z=ez;});
  const bob=r*Math.sin(t*2.4)*.05*(1-s0);
  headG.rotation.x=bob+lerp(0,-.08,s0)+r*Math.sin(t*16)*.15*dc-laugh*(.22+r*Math.sin(t*30)*.05);
  headG.rotation.y=r*Math.sin(t*.4)*.08*(1-s0);
  headG.rotation.z=r*(Math.sin(t*4)*.1*w0+Math.sin(t*8)*.14*dc)+scratch*.22;
  let bi=-1;if(on&&!bubbleOff)for(let i=0;i<BEATS.length;i++)if(T>=BEATS[i][0]&&T<BEATS[i][1])bi=i;
  if(bi!==curBeat){curBeat=bi;
    if(bi<0){if(!bubble.hidden)endBubble();}
    else{const B=BEATS[bi];btitle.textContent=B[2];btxt.textContent='';bgo.hidden=!B[4];bubble.hidden=false;bubble.classList.remove('show');void bubble.offsetWidth;requestAnimationFrame(()=>bubble.classList.add('show'));}}
  if(bi>=0){const B=BEATS[bi];btxt.textContent=B[3].slice(0,Math.ceil((T-B[0]-.15)*42));}
  if(on&&T>18.6){perfT=-1;curBeat=-1;lastPerfEnd=performance.now();}
  if(!bubble.hidden){headM.getWorldPosition(tmpV);tmpV.y+=.42;tmpV.project(cam);
    const bx=Math.min(W-170,Math.max(170,(tmpV.x+1)/2*W)),by=Math.max(170,(1-tmpV.y)/2*H);
    bubble.style.transform='translate('+bx+'px,'+by+'px) translate(-50%,-100%)';}
}

const kb=new THREE.Group();box(1.18,.045,.42,std(0x1a222c,{metalness:.4,roughness:.5}),0,0,0,kb);
const keyCream=std(0xe9dcc2,{roughness:.55}),keyOrange=std(C.orange,{roughness:.5}),keyDark=std(0x2c3a48,{roughness:.55});
const keys=[];const KW=.068,KS=.081;
for(let row=0;row<4;row++){for(let col=0;col<13;col++){const special=(row===0&&col===0)||(row===2&&col===12);const mat=special?keyOrange:(row===0&&col>9?keyDark:keyCream);
  const k=box(KW,.028,KW,mat,-.486+col*KS+(row%2)*.02,.035,-.15+row*.083,kb);k.userData.y=.035;keys.push(k);}}
const space=box(.5,.028,KW,keyCream,-.02,.035,.182,kb);space.userData.y=.035;keys.push(space);
kb.rotation.y=.38;kb.position.set(-.05,1.272,-1.55);s.add(kb);
const mouse=new THREE.Group();const mb=new THREE.Mesh(new THREE.SphereGeometry(.07,20,14),std(0xe9dcc2,{roughness:.4}));mb.scale.set(.85,.42,1.35);mouse.add(mb);
const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,.018,12),std(C.orange));wheel.rotation.z=Math.PI/2;wheel.position.set(0,.03,-.05);mouse.add(wheel);
const mpad=box(.32,.006,.36,std(0x12273a,{roughness:.95}),0,-.025,0,mouse);
mouse.position.set(.62,1.285,-1.25);mouse.rotation.y=.38;s.add(mouse);
let keyAcc=0;

const mug=new THREE.Group();const mugB=new THREE.Mesh(new THREE.CylinderGeometry(.13,.11,.26,24),std(C.cream,{roughness:.35}));mug.add(mugB);
const band=new THREE.Mesh(new THREE.CylinderGeometry(.132,.132,.05,24),std(C.orange));band.position.y=.05;mug.add(band);
const handle=new THREE.Mesh(new THREE.TorusGeometry(.07,.018,8,16),std(C.cream,{roughness:.35}));handle.position.set(.15,0,0);mug.add(handle);
mug.position.set(-1.3,1.38,-1.8);s.add(mug);
const steam=[];for(let i=0;i<3;i++){const p=new THREE.Mesh(new THREE.SphereGeometry(.05,8,6),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,depthWrite:false}));p.position.set(-1.3,1.55,-1.8);s.add(p);steam.push(p);}
let cups=0,steamT=0;

const lampG=new THREE.Group();box(.26,.04,.26,std(C.steel,{metalness:.7}),0,0,0,lampG);
box(.04,.75,.04,std(C.steel,{metalness:.7}),0,.37,0,lampG);
const shade=new THREE.Mesh(new THREE.ConeGeometry(.21,.26,24,1,true),std(C.orange,{side:THREE.DoubleSide,roughness:.5}));shade.position.set(0,.76,0);lampG.add(shade);
const bulbOn=glow(0xffc27a,2.2),bulbOff=std(0x5a4a3a);
const bulb=new THREE.Mesh(new THREE.SphereGeometry(.07,16,12),bulbOn);bulb.position.set(0,.67,0);lampG.add(bulb);
lampG.position.set(1.65,1.25,-2.6);s.add(lampG);
let lampOn=true,lampK=1;

const code=[
 [['#ff7a45','public class '],['#3fb8a8','ClientAAdapter'],['#f2e8d5',' : '],['#3fb8a8','IManifestSource']],
 [['#f2e8d5','{']],
 [['#ff7a45','  public '],['#3fb8a8','Manifest '],['#f6c26b','Normalize'],['#f2e8d5','(XDocument xml)']],
 [['#f2e8d5','  {']],
 [['#ff7a45','    var '],['#f2e8d5','people = _parser.'],['#f6c26b','ReadCrew'],['#f2e8d5','(xml);']],
 [['#f2e8d5','    _rules.'],['#f6c26b','Enforce'],['#f2e8d5','(people);'],['#5d7489','  // compliance']],
 [['#ff7a45','    return new '],['#3fb8a8','Manifest'],['#f2e8d5','(people);']],
 [['#f2e8d5','  }']],[['#f2e8d5','}']]];
const total=code.reduce((a,l)=>a+l.reduce((b,t)=>b+t[1].length,0),0);
const scr=canvasTex(768,432,()=>{});let typed=0,lastTyped=-1,lastBlink=-1;
function drawCode(){const x=scr.x;x.fillStyle='#0e1d2b';x.fillRect(0,0,768,432);
  x.fillStyle='#152a3e';x.fillRect(0,0,768,34);x.fillStyle='#0e1d2b';x.fillRect(12,6,200,28);
  x.fillStyle='#ff5a1f';x.fillRect(12,6,200,3);x.fillStyle='#a3b2bf';x.font='16px "IBM Plex Mono", monospace';x.fillText('ClientAAdapter.cs',26,26);
  x.font='18px "IBM Plex Mono", monospace';let left=typed,cx=56,cy=70;
  for(let li=0;li<code.length;li++){x.fillStyle='#34506a';x.fillText(String(li+1).padStart(2,' '),14,70+li*38);cx=56;cy=70+li*38;
    for(const [col,txt] of code[li]){if(left<=0)break;const part=txt.slice(0,left);left-=part.length;x.fillStyle=col;x.fillText(part,cx,cy);cx+=x.measureText(part).width;}
    if(left<=0)break;}
  if(Math.floor(performance.now()/450)%2){x.fillStyle='#ff5a1f';x.fillRect(cx+2,cy-16,9,20);}
  scr.t.needsUpdate=true;}
const mon=new THREE.Group();
box(2.3,1.36,.08,std(0x111a24,{metalness:.6,roughness:.35}),0,.7,0,mon);
const sm=new THREE.MeshBasicMaterial({map:scr.t});sm.toneMapped=false;sm.color.setScalar(1.1);
const screen=new THREE.Mesh(new THREE.PlaneGeometry(2.18,1.24),sm);screen.position.set(0,.7,.045);mon.add(screen);
box(.08,.32,.08,std(C.steel,{metalness:.8}),0,-.05,0,mon);box(.6,.03,.32,std(C.steel,{metalness:.8}),0,-.2,0,mon);
mon.position.set(0,1.46,-2.65);s.add(mon);

const ps=canvasTex(200,400,()=>{});
function drawPhone(t){const x=ps.x;x.fillStyle='#0e1d2b';x.fillRect(0,0,200,400);x.fillStyle='#ff5a1f';x.fillRect(0,0,200,80);
  x.fillStyle='#0b1824';x.font='bold 22px "Instrument Sans", sans-serif';x.fillText('Milk bill',16,44);x.font='14px "Instrument Sans", sans-serif';x.fillText('November',16,66);
  const st=['#3fb8a8','#ff5a1f','#3fb8a8','#f6c26b','#3fb8a8','#ff5a1f'];
  for(let i=0;i<6;i++){x.fillStyle='#152a3e';x.fillRect(12,94+i*44,176,36);x.fillStyle='#f2e8d5';x.fillRect(22,106+i*44,58+((i*29)%46),6);x.fillStyle=st[i];x.fillRect(146,104+i*44,32,12);}
  const p=(Math.sin(t)+1)/2;x.fillStyle='#ff5a1f';x.fillRect(12,370,176*p,5);ps.t.needsUpdate=true;}
const phone=new THREE.Group();box(.4,.04,.78,std(0x111a24,{metalness:.6}),0,0,0,phone);
const pm=new THREE.MeshBasicMaterial({map:ps.t});pm.toneMapped=false;pm.color.setScalar(1.15);
const pscreen=new THREE.Mesh(new THREE.PlaneGeometry(.36,.72),pm);pscreen.rotation.x=-Math.PI/2;pscreen.position.y=.022;phone.add(pscreen);
phone.position.set(1.1,1.29,-1.85);phone.rotation.y=-.4;s.add(phone);

const rack=new THREE.Group();box(1.05,2.8,.95,std(0x111a24,{metalness:.55,roughness:.4}),0,1.4,0,rack);
const leds=[];for(let i=0;i<7;i++){box(.9,.26,.02,std(0x1c2733,{metalness:.5}),0,.35+i*.36,.48,rack);
  for(let j=0;j<3;j++)leds.push(box(.05,.05,.02,glow(j===2?C.orange:C.teal,1.8),.18+j*.09,.35+i*.36,.5,rack));
  box(.4,.025,.01,std(0x2c3e50),-.18,.35+i*.36,.495,rack);}
const tagR=canvasTex(256,64,(x)=>{x.fillStyle='#f2e8d5';x.fillRect(0,0,256,64);x.fillStyle='#0b1824';x.font='600 30px "IBM Plex Mono", monospace';x.fillText('SRV-01 · PROD',14,42);});
const tagP=new THREE.Mesh(new THREE.PlaneGeometry(.7,.17),new THREE.MeshBasicMaterial({map:tagR.t}));tagP.position.set(0,2.72,.481);rack.add(tagP);
rack.position.set(-3.7,0,-2.6);s.add(rack);

const shelf=new THREE.Group();box(.55,2.6,1.7,std(C.teakD,{roughness:.6}),0,1.3,0,shelf);
const bc=[C.navy,C.cream,C.orange,C.teal,0x2c4a66,C.brass];
for(let row=0;row<3;row++){box(.5,.05,1.65,std(C.teak),.03,.25+row*.8,0,shelf);
  for(let i=0;i<5;i++){const h=.36+((i+row)%3)*.08;const bk=box(.3,h,.18,std(bc[(i*2+row)%6],{roughness:.6}),.12,.28+row*.8+h/2,-.55+i*.27,shelf);if((i+row)%4===3)bk.rotation.x=.18;}}
const ship=new THREE.Group();box(.12,.1,.55,std(C.cream),0,0,0,ship);box(.1,.08,.3,std(C.navy),0,.09,-.02,ship);
const fun=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,.1,10),std(C.orange));fun.position.set(0,.18,.02);ship.add(fun);
ship.position.set(.12,2.68,.35);shelf.add(ship);
const plant=new THREE.Group();const pot=new THREE.Mesh(new THREE.CylinderGeometry(.16,.12,.26,20),std(C.cream,{roughness:.5}));pot.position.y=.13;plant.add(pot);
for(let i=0;i<6;i++){const lf=new THREE.Mesh(new THREE.ConeGeometry(.06,.45,6),std(0x2f8f6a,{flatShading:true}));lf.position.y=.4;lf.rotation.z=(i-2.5)*.22;lf.rotation.x=(i%2-.5)*.4;plant.add(lf);}
plant.position.set(.12,2.62,-.45);shelf.add(plant);
shelf.position.set(-4.15,0,.7);s.add(shelf);

const holo=new THREE.Group();
const core=new THREE.Mesh(new THREE.IcosahedronGeometry(.32,1),new THREE.MeshBasicMaterial({color:new THREE.Color(C.orange).multiplyScalar(1.4),wireframe:true}));core.material.toneMapped=false;holo.add(core);
const inner=new THREE.Mesh(new THREE.IcosahedronGeometry(.14,0),std(C.cream,{flatShading:true,emissive:0x3a1a08}));holo.add(inner);
const orbit=new THREE.Mesh(new THREE.TorusGeometry(.52,.01,8,80),glow(C.cream,1.2));orbit.rotation.x=1.2;holo.add(orbit);
const orbit2=new THREE.Mesh(new THREE.TorusGeometry(.62,.008,8,80),glow(C.teal,1.4));orbit2.rotation.y=1.1;holo.add(orbit2);
const pad=new THREE.Mesh(new THREE.CylinderGeometry(.35,.42,.12,32),std(C.steel,{metalness:.7,roughness:.3}));pad.position.y=-.9;holo.add(pad);
const padRing=new THREE.Mesh(new THREE.TorusGeometry(.37,.014,8,48),glow(C.orange,1.5));padRing.rotation.x=Math.PI/2;padRing.position.y=-.83;holo.add(padRing);
holo.position.set(2.9,.95,-.6);s.add(holo);

const DN=reduce?0:260,dg=new THREE.BufferGeometry(),dp=new Float32Array(DN*3);
for(let i=0;i<DN;i++){dp[i*3]=(Math.random()-.5)*9;dp[i*3+1]=Math.random()*4.6;dp[i*3+2]=(Math.random()-.5)*7;}
dg.setAttribute('position',new THREE.BufferAttribute(dp,3));
const dust=new THREE.Points(dg,new THREE.PointsMaterial({color:0xf2e8d5,size:.018,transparent:true,opacity:.45,depthWrite:false}));s.add(dust);

function toggleLamp(){lampOn=!lampOn;bulb.material=lampOn?bulbOn:bulbOff;say(lampOn?'Lights on. Back to work.':'Lights off. Now look out the porthole.');}
function coffee(){cups++;steamT=1;say('Coffee #'+cups+'. Most production fixes at sea started with one of these.');}
function hi(){perfTries=6;startPerf();}
function spinBuoy(){buoySpin=reduce?0:9;say('On call for production support, even with almost no connectivity at sea.');}
const objs={
  monitor:{g:mon,go:'#work',label:'Production systems'},
  holo:{g:holo,go:'#ai',label:'AI work'},
  rack:{g:rack,go:'#backend',label:'Backend'},
  phone:{g:phone,go:'#mobile',label:'Dairy billing app'},
  shelf:{g:shelf,go:'#experience',label:'Experience'},
  lamp:{g:lampG,act:toggleLamp,label:'Lamp'},
  mug:{g:mug,act:coffee,label:'Coffee'},
  buoy:{g:buoy,act:spinBuoy,label:'Lifebuoy'},
  me:{g:person,act:hi,label:'Adii'}
};

const V=(x,y,z)=>new THREE.Vector3(x,y,z);
const KEYS=[
 {p:V(7.2,4.4,7.6),l:V(-.6,1.6,-1.2),o:1.15},
 {p:V(.8,2.6,.45),l:V(0,1.95,-2.65),o:1},
 {p:V(4.7,2,1.9),l:V(2.9,1,-.6),o:1},
 {p:V(-1.5,2.4,.5),l:V(-3.7,1.5,-2.6),o:1},
 {p:V(1.75,2.45,-.95),l:V(1.1,1.3,-1.85),o:1},
 {p:V(-1.3,2.1,2.7),l:V(-4.15,1.3,.7),o:1},
 {p:V(6.4,3.4,5.6),l:V(-.2,1.4,-1.4),o:1}
];

let composer=null,bloom=null;
if(EffectComposer&&UnrealBloomPass){composer=new EffectComposer(r);composer.addPass(new RenderPass(s,cam));
  bloom=new UnrealBloomPass(new THREE.Vector2(1,1),.4,.4,.9);composer.addPass(bloom);}

let W=1,H=1,mobile=false;
function size(){W=innerWidth;H=innerHeight;mobile=W<760;r.setSize(W,H,false);if(composer)composer.setSize(W,H);cam.aspect=W/H;cam.fov=mobile?55:40;cam.updateProjectionMatrix();}
size();addEventListener('resize',size);
try{cam.position.copy(KEYS[0].p);cam.lookAt(KEYS[0].l);r.compile(s,cam);if(composer)composer.render();else r.render(s,cam);}catch(e){}
let centers=[];
function measure(){centers=steps.map(el=>el.offsetTop+el.offsetHeight/2-innerHeight/2);centers[0]=0;}
measure();addEventListener('resize',measure);addEventListener('load',measure);
const ss=t=>t*t*(3-2*t);
function camAt(y){let i=0;while(i<centers.length-2&&y>centers[i+1])i++;
  const span=Math.max(1,centers[i+1]-centers[i]);let f=Math.min(1,Math.max(0,(y-centers[i])/span));f=ss(f);
  const a=KEYS[i],b=KEYS[i+1];return{p:a.p.clone().lerp(b.p,f),l:a.l.clone().lerp(b.l,f),o:a.o+(b.o-a.o)*f,idx:f>.5?i+1:i};}

const ring=document.getElementById('ring'),label=document.getElementById('label');
let mx=-100,my=-100,rx=mx,ry=my,nx=0,ny=0;
addEventListener('pointermove',e=>{mx=e.clientX;my=e.clientY;nx=mx/innerWidth-.5;ny=my/innerHeight-.5;});
const ray=new THREE.Raycaster(),mp=new THREE.Vector2();let hov=null;
function pick(px,py){mp.set((px/W)*2-1,-(py/H)*2+1);ray.setFromCamera(mp,cam);let best=null,bd=1e9;
  for(const k in objs){const h=ray.intersectObject(objs[k].g,true);if(h.length&&h[0].distance<bd){bd=h[0].distance;best=k;}}return best;}
addEventListener('click',e=>{if(root.classList.contains('flat'))return;if(e.target.closest('a,button,.card,nav,.found,#toast,.dots,.pop,.bubble'))return;
  const k=pick(e.clientX,e.clientY);if(!k)return;const o=objs[k];const fresh=mark(k);
  if(o.act)o.act();else{document.querySelector(o.go).scrollIntoView({behavior:reduce?'auto':'smooth',block:'center'});if(fresh&&found.size<9)say('Found: '+o.label.toLowerCase()+'. '+(9-found.size)+' left to find.',2400);}});

const curP=KEYS[0].p.clone(),curL=KEYS[0].l.clone();let curO=KEYS[0].o,lastActive=-1;
let tPrev=performance.now(),acc=0,wAcc=0;
const fine=matchMedia('(pointer:fine)');
function frame(){const now=performance.now();
  const dt=Math.min(.05,(now-tPrev)/1000);tPrev=now;
  if(root.classList.contains('flat')){requestAnimationFrame(frame);return;}
  if(!intro.hidden&&!intro.classList.contains('open')){requestAnimationFrame(frame);return;}
  const target=camAt(scrollY);
  const k=reduce?1:1-Math.pow(.0009,dt);
  const par=reduce?0:1;
  curP.lerp(target.p.clone().add(V(nx*.5*par,-ny*.3*par,0)),k);curL.lerp(target.l,k);curO+=(target.o-curO)*k;
  cam.position.copy(curP);cam.lookAt(curL);if(!reduce&&perfT>10.1&&perfT<10.45){const k=(10.45-perfT)/.35;cam.position.x+=(Math.random()-.5)*.09*k;cam.position.y+=(Math.random()-.5)*.09*k;}
  if(mobile)cam.setViewOffset(W,H,0,H*.22*curO,W,H);else cam.setViewOffset(W,H,-W*.17*curO,0,W,H);
  if(target.idx!==lastActive){lastActive=target.idx;if(lastActive>=3&&lastActive<6)maybePop();dots.forEach((d,i)=>d.classList.toggle('on',i===lastActive));}

  const on=lightsOn?Math.max(0,Math.min(1,(now-lightsOn)/1300)):0;
  lampK+=((lampOn?1:0)-lampK)*(reduce?1:.12);
  hemi.intensity=(.28+.12*(1-lampK))*on;moon.intensity=(.45+.5*(1-lampK))*on;
  lampL.intensity=2.6*on*lampK;monL.intensity=1.1*on;front.intensity=.7*on*(.5+.5*lampK);
  if(bloom)bloom.strength=.4*on+.05;

  const t=now/1000;
  if(!reduce){acc+=dt;if(acc>.05){acc=0;typed=typed>=total+40?0:typed+1;}
    wAcc+=dt;if(wAcc>.08){wAcc=0;wave+=.12;drawSea();}}else typed=total;
  {const cb=Math.floor(now/450)%2;if(typed!==lastTyped||cb!==lastBlink){lastTyped=typed;lastBlink=cb;drawCode();}}if(Math.floor(t*10)%2===0)drawPhone(t);
  leds.forEach((l,i)=>l.visible=reduce||Math.sin(t*(2+i%4)+i*1.7)>-.3);
  if(!reduce){core.rotation.y=t*.6;core.rotation.x=t*.3;inner.rotation.y=-t;orbit.rotation.z=t*.8;orbit2.rotation.x=t*.5;core.position.y=inner.position.y=Math.sin(t*1.6)*.06;
    const a=dg.attributes.position.array;for(let i=0;i<DN;i++){a[i*3+1]+=.0012;if(a[i*3+1]>4.6)a[i*3+1]=0;}dg.attributes.position.needsUpdate=true;}
  updateRig(dt,t);
  {const d=istNow();const se=d.getSeconds()+d.getMilliseconds()/1000,mi=d.getMinutes(),hr=d.getHours()%12;handS.rotation.z=-se/60*Math.PI*2;handM.rotation.z=-(mi+se/60)/60*Math.PI*2;handH.rotation.z=-(hr+mi/60)/12*Math.PI*2;
   const sc=d.getSeconds();if(sc!==lastSec){lastSec=sc;if(soundOn&&intro.hidden&&lastActive===0&&perfT<0)sfx.tick(sc%2);}}
  if(!reduce&&lightsOn&&perfT<0&&lastActive===0&&now-lightsOn>2200&&(perfCount===0||now-lastPerfEnd>40000))startPerf();
  if(!reduce&&perfS<.1){keyAcc+=dt;if(keyAcc>.07){keyAcc=0;keys.forEach(k=>k.position.y=k.userData.y);for(let n=0;n<2;n++){const k=keys[(Math.random()*keys.length)|0];k.position.y=k.userData.y-.014;}}}
  buoyRing.rotation.z+=buoySpin*dt;buoySpin*=Math.pow(.25,dt);if(buoySpin<.02)buoySpin=0;
  if(steamT>0){steamT=Math.max(0,steamT-dt*.35);steam.forEach((p,i)=>{const ph=(1-steamT+i*.2)%1;p.position.y=1.55+ph*.5;p.position.x=-1.3+Math.sin(ph*6+i)*.05;p.material.opacity=steamT*.5*(1-ph);p.scale.setScalar(1+ph*1.5);});}

  hov=fine.matches?pick(mx,my):null;
  for(const n in objs){const g=objs[n].g;const tg=n===hov?1.06:1;g.scale.x+=(tg-g.scale.x)*.2;g.scale.y=g.scale.z=g.scale.x;}
  rx+=(mx-rx)*.22;ry+=(my-ry)*.22;ring.style.transform='translate('+rx+'px,'+ry+'px)';ring.classList.toggle('grow',!!hov);
  label.style.transform='translate('+(mx+16)+'px,'+(my+16)+'px)';label.style.opacity=hov?1:0;if(hov)label.textContent=objs[hov].label+(found.has(hov)?' ✓':'');
  document.body.style.cursor=hov?'pointer':'';

  if(composer)composer.render();else r.render(s,cam);
  requestAnimationFrame(frame);}
requestAnimationFrame(frame);
})();
