import * as THREE from './three.module.min.js';
const $=id=>document.getElementById(id);
const rnd=(a,b)=>a+Math.random()*(b-a), clamp=(v,a,b)=>v<a?a:v>b?b:v, lerp=(a,b,t)=>a+(b-a)*t;
const sstep=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
// ---------- renderer ----------
const canvas=$('c');
const renderer=new THREE.WebGLRenderer({canvas,antialias:false,powerPreference:'high-performance'});
let quality=2, pr=Math.min(devicePixelRatio||1,1.5);
renderer.setPixelRatio(pr);
renderer.outputColorSpace=THREE.SRGBColorSpace;
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(62,1,0.3,2200);
const fxc=$('fx'), fx=fxc.getContext('2d');
function resize(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();fxc.width=w;fxc.height=h}
addEventListener('resize',resize);resize();
// ---------- textures ----------
function ctex(w,h,draw,rep){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;if(rep){t.wrapS=t.wrapT=THREE.RepeatWrapping}t.anisotropy=4;return t}
function noise(g,w,h,n,a,b){for(let i=0;i<n;i++){const v=rnd(a,b)|0;g.fillStyle=`rgba(${v},${v},${v},${rnd(.1,.5)})`;g.fillRect(Math.random()*w,Math.random()*h,rnd(1,3),rnd(1,3))}}
const asphaltT=ctex(256,256,(g,w,h)=>{g.fillStyle='#5a5a5e';g.fillRect(0,0,w,h);noise(g,w,h,9000,40,140);
 g.fillStyle='rgba(30,30,30,.25)';for(let i=0;i<14;i++){g.beginPath();g.ellipse(rnd(0,w),rnd(0,h),rnd(10,40),rnd(20,80),0,0,7);g.fill()}
 g.strokeStyle='rgba(20,20,20,.5)';g.lineWidth=1.5;for(let i=0;i<5;i++){g.beginPath();let x=rnd(0,w),y=rnd(0,h);g.moveTo(x,y);for(let k=0;k<6;k++){x+=rnd(-12,12);y+=rnd(5,25);g.lineTo(x,y)}g.stroke()}},true);
const grassT=ctex(256,256,(g,w,h)=>{g.fillStyle='#8a8a8a';g.fillRect(0,0,w,h);noise(g,w,h,12000,60,230);
 for(let y=0;y<h;y+=16){g.fillStyle='rgba(40,40,40,.22)';g.fillRect(0,y,w,6)}
 for(let i=0;i<300;i++){g.fillStyle=`rgba(${rnd(60,255)|0},${rnd(60,255)|0},40,.25)`;g.fillRect(rnd(0,w),rnd(0,h),2,4)}},true);
const dirtT=ctex(128,128,(g,w,h)=>{g.fillStyle='#9a9a9a';g.fillRect(0,0,w,h);noise(g,w,h,5000,50,220)},true);
const dashT=ctex(16,64,(g,w,h)=>{g.fillStyle='#fff';g.fillRect(0,0,w,h*.45)},true);
const roundT=ctex(64,64,(g,w,h)=>{const r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,w,h)});
const cloudT=ctex(256,128,(g,w,h)=>{for(let i=0;i<22;i++){const x=rnd(40,216),y=rnd(50,90),r=rnd(18,42);const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(255,255,255,.95)');gr.addColorStop(.6,'rgba(245,248,255,.7)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,w,h)}});
const shadowT=ctex(64,64,(g,w,h)=>{const r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(0,0,0,.6)');r.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=r;g.fillRect(0,0,w,h)});
function signT(kind){return ctex(128,128,(g,w,h)=>{if(kind==0){g.fillStyle='#111';g.beginPath();g.moveTo(64,2);g.lineTo(126,64);g.lineTo(64,126);g.lineTo(2,64);g.fill();g.fillStyle='#f0c010';g.beginPath();g.moveTo(64,9);g.lineTo(119,64);g.lineTo(64,119);g.lineTo(9,64);g.fill();g.strokeStyle='#111';g.lineWidth=9;g.beginPath();g.moveTo(50,90);g.quadraticCurveTo(50,50,80,42);g.stroke();g.beginPath();g.moveTo(70,30);g.lineTo(90,40);g.lineTo(75,58);g.fillStyle='#111';g.fill()}
 else{g.fillStyle='#eee';g.fillRect(0,0,w,h);g.strokeStyle='#111';g.lineWidth=6;g.strokeRect(5,5,w-10,h-10);g.lineWidth=8;g.beginPath();g.moveTo(40,100);g.lineTo(40,40);g.lineTo(30,52);g.moveTo(40,40);g.lineTo(50,52);g.moveTo(88,100);g.lineTo(88,40);g.lineTo(78,52);g.moveTo(88,40);g.lineTo(98,52);g.moveTo(64,100);g.lineTo(64,60);g.stroke();
  if(kind==2){g.fillStyle='#111';g.font='bold 30px Arial';g.fillRect(8,8,112,112);g.fillStyle='#eee';g.textAlign='center';g.fillText('SPEED',64,52);g.font='bold 46px Arial';g.fillText('65',64,100)}}})}
const signTex=[signT(0),signT(1),signT(2)];
// ---------- courses ----------
const COURSES=[
 {name:'NAPA VALLEY',sky:['#2f6fd8','#9cc6f2'],grass:0x5c8a32,grass2:0x8a9a3a,dirt:0x8a6a44,fog:0xb8cde6,mount:0x8a8f98,snow:true,trees:0x3f6e2a,rows:true,curv:1,hill:1},
 {name:'PACIFIC COAST',sky:['#3a7ee0','#bfe0ff'],grass:0x6e9a3e,grass2:0xb8a86a,dirt:0xa88a5a,fog:0xc8dcef,mount:0x7a8a70,snow:false,trees:0x2f5e2a,ocean:true,palms:true,curv:1.2,hill:.8},
 {name:'SIERRA NEVADA',sky:['#2a5fc8','#a8c8ee'],grass:0x4f7a3a,grass2:0x7f8a5a,dirt:0x7a6650,fog:0xc4d2e4,mount:0x9aa0aa,snow:true,trees:0x24502a,pines:true,curv:1.3,hill:1.6},
 {name:'PENINSULA',sky:['#4a86e0','#c8def5'],grass:0x6a9440,grass2:0x9a9a50,dirt:0x8f7a58,fog:0xc8d8ea,mount:0x7f8a8a,snow:false,trees:0x3a6a30,curv:.9,hill:1.1,houses:true},
 {name:'THE CITY',sky:['#5a8ad8','#d0dcef'],grass:0x5a7a3a,grass2:0x7a7a70,dirt:0x777777,fog:0xc0c8d4,mount:0x8890a0,snow:false,trees:0x3a6030,city:true,curv:.6,hill:.7},
];
let C=COURSES[0], raceNo=0, seed=1;
let ph=[0,0,0,0,0,0];
const TRACK=2600;
function cx(s){const r=sstep(60,260,s);return r*C.curv*(46*Math.sin(s/290+ph[0])+22*Math.sin(s/131+ph[1])+8*Math.sin(s/61+ph[2]))}
function cy(s){const r=sstep(80,300,s);return r*C.hill*(10*Math.sin(s/230+ph[3])+5*Math.sin(s/97+ph[4]))}
function dcx(s){return (cx(s+1)-cx(s-1))/2} function dcy(s){return (cy(s+1)-cy(s-1))/2}
const RW=8, SH=11.5; // road half width, shoulder edge
function hillH(wx,wz){return 7+6*Math.sin(wx/47+wz/83)*Math.cos(wz/61)+5*Math.sin(wz/29-wx/91)+3*Math.sin(wx/13+wz/17)*.5}
function groundH(s,l){const a=Math.abs(l);const b=cy(s);if(a<RW+.2)return b;const p=pos(s,l);
 let h=b-0.15-sstep(RW,SH,a)*0.25; h+=sstep(SH+2,70,a)*hillH(p.x,p.z)*C.hill*(C.city?.2:1);
 if(C.ocean&&l<-SH){h=lerp(h,b-14,sstep(30,90,a))} return h}
const _v=new THREE.Vector3();
function pos(s,l,out){out=out||{x:0,y:0,z:0};const d=dcx(s),n=Math.hypot(1,d);out.x=cx(s)+l/n;out.z=-s+l*d/n;out.y=cy(s);return out}
function place(o,s,l,y){const p=pos(s,l);o.position.set(p.x,y==null?groundH(s,l):y,p.z);o.rotation.order='YXZ';o.rotation.y=Math.atan2(-dcx(s),1)}
// ---------- lights ----------
const hemi=new THREE.HemisphereLight(0xdfeeff,0x5a6a3a,1.6);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff2dd,2.2);sun.position.set(-60,120,40);scene.add(sun);scene.add(sun.target);
// sky
let skyTex;function makeSky(){skyTex&&skyTex.dispose();skyTex=ctex(4,256,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,C.sky[0]);gr.addColorStop(.55,C.sky[1]);gr.addColorStop(1,'#e8f0f8');g.fillStyle=gr;g.fillRect(0,0,w,h)});scene.background=skyTex;scene.fog=new THREE.Fog(C.fog,180,900)}
// ---------- world ----------
let world=null; const farGroup=new THREE.Group();scene.add(farGroup);
const M=(c,o)=>new THREE.MeshLambertMaterial(Object.assign({color:c},o||{}));
function ribbon(l0,l1,lift,mat,vScale,s0=0,s1=TRACK+500,step=4){const pts=[],uv=[],idx=[];let k=0;
 for(let s=s0;s<=s1;s+=step){const a=pos(s,l0),b=pos(s,l1);const y=cy(s)+lift;pts.push(a.x,y,a.z,b.x,y,b.z);uv.push(0,s/vScale,1,s/vScale);if(k){const i=(k-1)*2;idx.push(i,i+2,i+1,i+1,i+2,i+3)}k++}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
 // ensure normals up
 const m=new THREE.Mesh(g,mat);return m}
function buildWorld(){
 if(world){scene.remove(world);world.traverse(o=>{o.geometry&&o.geometry.dispose()})}
 world=new THREE.Group();scene.add(world);makeSky();
 // road
 const road=ribbon(RW,-RW,0,M(0xffffff,{map:asphaltT}),12);asphaltT.repeat.set(1,1);world.add(road);
 const yl=M(0xf2c21a,{polygonOffset:true,polygonOffsetFactor:-2}),wh=M(0xf4f4f4,{polygonOffset:true,polygonOffsetFactor:-2});
 world.add(ribbon(.32,.18,.02,yl,1),ribbon(-.18,-.32,.02,yl,1),ribbon(RW-.35,RW-.6,.02,wh,1),ribbon(-RW+.6,-RW+.35,.02,wh,1));
 const dm=M(0xf4f4f4,{map:dashT,transparent:true,alphaTest:.5,polygonOffset:true,polygonOffsetFactor:-2});
 world.add(ribbon(RW/2+.12,RW/2-.12,.02,dm,9),ribbon(-RW/2+.12,-RW/2-.12,.02,dm,9));
 // stop line + finish
 const stop=ribbon(RW-.35,-RW+.35,.03,wh,1,20,21.2,1.2);world.add(stop);
 const fin=ctex(64,8,(g)=>{for(let i=0;i<16;i++)for(let j=0;j<2;j++){g.fillStyle=(i+j)%2?'#000':'#fff';g.fillRect(i*4,j*4,4,4)}});
 world.add(ribbon(RW,-RW,.03,M(0xffffff,{map:fin,polygonOffset:true,polygonOffsetFactor:-3}),4,TRACK,TRACK+4,4));
 // terrain
 const lats=[];for(const l of [-420,-300,-210,-150,-110,-80,-60,-45,-34,-26,-20,-16,-13.5,-SH,-9.5,-RW-.3])lats.push(l);const L=lats.concat(lats.slice().reverse().map(v=>-v));
 const pts=[],uv=[],col=[],idx=[];const cg=new THREE.Color(C.grass),cg2=new THREE.Color(C.grass2),cd=new THREE.Color(C.dirt),tc=new THREE.Color();let k=0;const step=6;
 for(let s=-200;s<=TRACK+600;s+=step){for(let j=0;j<L.length;j++){const l=L[j],p=pos(s,l),h=groundH(s,l);pts.push(p.x,h,p.z);uv.push(p.x/14,p.z/14);
   const a=Math.abs(l);if(a<SH+.5)tc.copy(cd).multiplyScalar(rnd(.92,1.05));else{const f=.5+.5*Math.sin(p.x/60)*Math.sin(p.z/45);tc.copy(cg).lerp(cg2,f*.7).multiplyScalar(rnd(.85,1.08));if(C.ocean&&l<-40&&h<cy(s)-8)tc.set(0xc9b88a)}
   col.push(tc.r,tc.g,tc.b)}
  if(k){const n=L.length,o=(k-1)*n;for(let j=0;j<n-1;j++){const a=o+j,b=a+1,c=a+n,d=c+1;idx.push(a,b,c,b,d,c)}}k++}
 const tg=new THREE.BufferGeometry();tg.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));tg.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));tg.setAttribute('color',new THREE.Float32BufferAttribute(col,3));tg.setIndex(idx);tg.computeVertexNormals();
 const terr=new THREE.Mesh(tg,M(0xffffff,{map:C.rows?grassT:dirtT,vertexColors:true}));world.add(terr);
 if(C.ocean){const sea=new THREE.Mesh(new THREE.PlaneGeometry(3000,4000),M(0x2a6aa8));sea.rotation.x=-Math.PI/2;sea.position.set(-400,-14+cy(0)-2,-TRACK/2);world.add(sea)}
 // trees instanced
 const N=C.city?250:900;const crown=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1),M(0xffffff,{flatShading:true}),N);
 const pine=new THREE.InstancedMesh(new THREE.ConeGeometry(1,2.6,7),M(0xffffff,{flatShading:true}),C.pines?N:1);
 const trunk=new THREE.InstancedMesh(new THREE.CylinderGeometry(.12,.18,1,5),M(0x5a3a22),N);
 const mtx=new THREE.Matrix4(),q=new THREE.Quaternion(),sc=new THREE.Vector3(),tp=new THREE.Vector3(),tcol=new THREE.Color();let ni=0,pi=0;
 for(let i=0;i<N;i++){const s=rnd(-100,TRACK+500),side=Math.random()<.5?-1:1;if(C.ocean&&side<0&&Math.random()<.8){continue}const l=side*(SH+3+Math.pow(Math.random(),1.6)*160);const p=pos(s,l),h=groundH(s,l);const z=rnd(2.2,4.5);
  tcol.set(C.trees).multiplyScalar(rnd(.75,1.25));
  if(C.pines&&Math.random()<.7){mtx.compose(tp.set(p.x,h+z*1.2,p.z),q.identity(),sc.set(z*.8,z*1.1,z*.8));pine.setMatrixAt(pi,mtx);pine.setColorAt(pi,tcol);pi++}
  else{mtx.compose(tp.set(p.x,h+z*1.25,p.z),q.identity(),sc.set(z,z*.9,z));crown.setMatrixAt(ni,mtx);crown.setColorAt(ni,tcol);ni++}
  mtx.compose(tp.set(p.x,h+z*.4,p.z),q.identity(),sc.set(z*.5,z*.8,z*.5));trunk.setMatrixAt(i,mtx)}
 crown.count=ni;pine.count=pi;world.add(crown,trunk);if(C.pines)world.add(pine);
 // palms
 if(C.palms){const pm=M(0x6a4a2a),lm=M(0x3f7a2a,{side:THREE.DoubleSide});for(let s=40;s<TRACK+300;s+=rnd(25,60)){const g=new THREE.Group();const t=new THREE.Mesh(new THREE.CylinderGeometry(.18,.3,9,6),pm);t.position.y=4.5;t.rotation.z=.12;g.add(t);
   for(let k=0;k<7;k++){const lf=new THREE.Mesh(new THREE.PlaneGeometry(4.5,1),lm);lf.position.set(Math.cos(k)*2,8.8,Math.sin(k)*2);lf.rotation.y=-k;lf.rotation.z=-.5;lf.rotation.order='YZX';g.add(lf)}
   const l=(Math.random()<.5?-1:1)*rnd(SH+1,SH+6);place(g,s,l);world.add(g)}}
 // signs
 const post=M(0x9a9a9a);for(let s=60;s<TRACK;s+=rnd(80,160)){const g=new THREE.Group();const pl=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,3,5),post);pl.position.y=1.5;g.add(pl);
  const kind=Math.random()<.45?0:Math.random()<.7?1:2;const sg=new THREE.Mesh(new THREE.PlaneGeometry(1.5,1.5),M(0xffffff,{map:signTex[kind],side:THREE.DoubleSide}));sg.position.y=3.2;if(kind==0)sg.scale.set(1.1,1.1,1);g.add(sg);
  const side=Math.random()<.5?-1:1;place(g,s,side*(RW+2.3));world.add(g)}
 // fences
 const fm=M(0xd8d0c0);for(let s=100;s<TRACK;s+=rnd(200,400)){const len=rnd(40,100),side=Math.random()<.5?-1:1;const f=ribbon(side*(SH+1.4),side*(SH+1.45),1,fm,1,s,s+len,4);f.material=new THREE.MeshLambertMaterial({color:0xd8d0c0,side:THREE.DoubleSide});
  const geo=f.geometry,pa=geo.attributes.position;for(let i=0;i<pa.count;i++){const ss=s+Math.floor(i/2)*4;const gh=groundH(ss,side*(SH+1.4));pa.setY(i,gh+(i%2?1.1:.5))}geo.computeVertexNormals();world.add(f)}
 // buildings
 const bc=[0xb83a2a,0xd8c8a8,0xa8a8b0,0x8a6a5a,0xe0d8c8,0x6a7a8a];const winT=ctex(64,128,(g,w,h)=>{g.fillStyle='#ccc';g.fillRect(0,0,w,h);noise(g,w,h,600,120,220);g.fillStyle='#345';for(let y=8;y<h;y+=20)for(let x=6;x<w;x+=20)g.fillRect(x,y,11,12)},true);
 const nb=C.city?120:C.houses?40:10;for(let i=0;i<nb;i++){const s=rnd(80,TRACK+200),side=Math.random()<.5?-1:1;if(C.ocean&&side<0)continue;const hgt=C.city?rnd(10,40):rnd(4,7),w=rnd(8,16),d=rnd(8,14);
  const g=new THREE.Group();const mat=C.city?M(0xffffff,{map:winT}):M(bc[i%6]);if(C.city){mat.color.set(bc[i%6]).lerp(new THREE.Color(0xffffff),.5)}
  const b=new THREE.Mesh(new THREE.BoxGeometry(w,hgt,d),mat);b.position.y=hgt/2-1;g.add(b);
  if(!C.city){const r=new THREE.Mesh(new THREE.CylinderGeometry(.1,w*.75,3,4,1),M(0x553333,{flatShading:true}));r.rotation.y=Math.PI/4;r.position.y=hgt+.5;r.scale.z=d/w;g.add(r)}
  place(g,s,side*(SH+(C.city?rnd(4,12):rnd(12,60))));world.add(g)}
 // traffic light at start
 const tl=new THREE.Group();const pole=new THREE.Mesh(new THREE.CylinderGeometry(.12,.15,7,8),M(0x777777));pole.position.y=3.5;tl.add(pole);
 const arm=new THREE.Mesh(new THREE.BoxGeometry(3,.15,.15),M(0x777777));arm.position.set(-1.4,6.6,0);tl.add(arm);
 const box=new THREE.Mesh(new THREE.BoxGeometry(.7,2,.5),M(0x222222));box.position.set(-2.6,5.6,0);tl.add(box);
 tlLights=[0xff2a1a,0xffc21a,0x2aff3a].map((c,i)=>{const m=new THREE.Mesh(new THREE.SphereGeometry(.22,10,8),new THREE.MeshBasicMaterial({color:0x222222}));m.position.set(-2.6,6.25-i*.62,.28);m.userData.c=c;tl.add(m);return m});
 cdTex=ctex(128,64,()=>{});const cdp=new THREE.Mesh(new THREE.PlaneGeometry(1.4,.7),new THREE.MeshBasicMaterial({map:cdTex}));cdp.position.set(-.6,3.6,.2);tl.add(cdp);
 const cdb=new THREE.Mesh(new THREE.BoxGeometry(1.5,.8,.3),M(0x111111));cdb.position.set(-.6,3.6,0);tl.add(cdb);
 place(tl,21,RW+1.6);tl.rotation.y+=0;world.add(tl);
 // far mountains (follow camera)
 farGroup.clear();const mg=new THREE.ConeGeometry(1,1,7,2);const pa=mg.attributes.position,mc=[];const c1=new THREE.Color(C.mount),c2=new THREE.Color(C.snow?0xf4f6fa:C.mount).multiplyScalar(C.snow?1:1.15);
 for(let i=0;i<pa.count;i++){const y=pa.getY(i);if(y<.45){pa.setX(i,pa.getX(i)*rnd(.85,1.15));pa.setZ(i,pa.getZ(i)*rnd(.85,1.15))}const c=y>.15?c2:c1;mc.push(c.r,c.g,c.b)}mg.setAttribute('color',new THREE.Float32BufferAttribute(mc,3));mg.computeVertexNormals();
 const mm=new THREE.MeshLambertMaterial({vertexColors:true,flatShading:true,fog:false});
 for(let i=0;i<40;i++){const a=i/40*Math.PI*2+rnd(0,.1),r=rnd(1300,1700);const m=new THREE.Mesh(mg,mm);const h=rnd(90,220);m.scale.set(rnd(160,320),h,rnd(160,260));m.position.set(Math.cos(a)*r,h/2-30,Math.sin(a)*r);farGroup.add(m)}
 const cm=new THREE.SpriteMaterial({map:cloudT,fog:false,transparent:true,depthWrite:false});for(let i=0;i<26;i++){const sp=new THREE.Sprite(cm);const a=rnd(0,7),r=rnd(700,1500);sp.position.set(Math.cos(a)*r,rnd(160,380),Math.sin(a)*r);const w=rnd(180,360);sp.scale.set(w,w*.45,1);farGroup.add(sp)}
}
let tlLights=[],cdTex;
function setLight(i,txt){tlLights.forEach((m,k)=>m.material.color.set(k==i?m.userData.c:0x222222));const c=cdTex.image,g=c.getContext('2d');g.fillStyle='#100';g.fillRect(0,0,128,64);g.fillStyle='#f22';g.font='bold 46px monospace';g.textAlign='center';g.fillText(txt,64,48);cdTex.needsUpdate=true}
// ---------- bike model ----------
const tireG=new THREE.CylinderGeometry(.33,.33,.16,14);tireG.rotateZ(Math.PI/2);const rimG=new THREE.CylinderGeometry(.2,.2,.18,8);rimG.rotateZ(Math.PI/2);
const box=(w,h,d,m,x,y,z,p)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);p&&p.add(o);return o};
const BLACK=M(0x161616),CHROME=M(0xb8b8c0),SKIN=M(0xd09a70);
function makeBike(bikeC,suitC,suit2,helmC){
 const root=new THREE.Group(),lean=new THREE.Group();root.add(lean);
 const bm=new THREE.MeshPhongMaterial({color:bikeC,shininess:90,specular:0x666666}),sm=M(suitC),s2=M(suit2),hm=new THREE.MeshPhongMaterial({color:helmC,shininess:120});
 const wf=new THREE.Group(),wr=new THREE.Group();[wf,wr].forEach((w,i)=>{w.add(new THREE.Mesh(tireG,BLACK),new THREE.Mesh(rimG,CHROME));w.position.set(0,.33,i?.72:-.72);lean.add(w)});
 box(.34,.42,1.0,bm,0,.72,-.1,lean); // body
 const nose=box(.36,.36,.5,bm,0,.95,-.62,lean);nose.rotation.x=.5;
 box(.3,.12,.28,M(0x88aacc,{transparent:true,opacity:.7}),0,1.18,-.72,lean).rotation.x=.9;
 box(.3,.22,.45,bm,0,1.0,.05,lean); // tank
 box(.28,.1,.45,BLACK,0,1.02,.42,lean);
 const tail=box(.26,.2,.45,bm,0,1.02,.72,lean);tail.rotation.x=-.25;
 box(.2,.08,.05,new THREE.MeshBasicMaterial({color:0xff2010}),0,1.0,.96,lean);
 const ex=new THREE.Mesh(new THREE.CylinderGeometry(.06,.07,.6,6),CHROME);ex.rotation.x=Math.PI/2+.2;ex.position.set(.2,.48,.6);lean.add(ex);
 box(.08,.5,.08,CHROME,0,.62,-.75,lean).rotation.x=-.3; // fork
 box(.62,.05,.05,BLACK,0,1.12,-.42,lean); // bars
 // rider
 const rider=new THREE.Group();rider.position.set(0,1.05,.25);lean.add(rider);
 const hips=box(.4,.22,.3,sm,0,.08,.05,rider);
 const torso=new THREE.Group();torso.position.set(0,.15,0);rider.add(torso);torso.rotation.x=-.75;
 box(.44,.55,.27,sm,0,.28,0,torso);box(.46,.12,.28,s2,0,.38,0,torso);box(.12,.5,.29,s2,0,.28,0,torso);
 const head=new THREE.Group();head.position.set(0,.66,-.04);torso.add(head);
 const helm=new THREE.Mesh(new THREE.SphereGeometry(.17,12,10),hm);helm.scale.set(1,1.05,1.12);head.add(helm);
 box(.26,.08,.1,BLACK,0,.01,-.15,head);
 function arm(side){const sh=new THREE.Group();sh.position.set(side*.27,.48,0);torso.add(sh);const up=box(.13,.13,.36,sm,0,0,-.18,sh);
  const el=new THREE.Group();el.position.set(0,0,-.36);sh.add(el);box(.11,.11,.34,s2,0,0,-.17,el);box(.12,.12,.12,BLACK,0,0,-.37,el);sh.rotation.x=.9;sh.rotation.y=-side*.1;el.rotation.x=-.2;return {sh,el}}
 function leg(side){const hp=new THREE.Group();hp.position.set(side*.17,.05,.05);rider.add(hp);box(.16,.16,.46,s2,0,0,-.23,hp);
  const kn=new THREE.Group();kn.position.set(0,0,-.46);hp.add(kn);box(.14,.42,.14,sm,0,-.2,.05,kn);box(.15,.1,.25,BLACK,0,-.42,-.02,kn);hp.rotation.x=.35;hp.rotation.y=side*.15;kn.rotation.x=.6;return {hp,kn}}
 const aL=arm(-1),aR=arm(1),lL=leg(-1),lR=leg(1);
 const weapon=new THREE.Group();aR.el.add(weapon);weapon.position.set(0,0,-.4);
 const sh=new THREE.Mesh(new THREE.PlaneGeometry(1.1,2.6),new THREE.MeshBasicMaterial({map:shadowT,transparent:true,depthWrite:false}));sh.rotation.x=-Math.PI/2;sh.position.y=.03;root.add(sh);
 const warn=new THREE.Sprite(new THREE.SpriteMaterial({map:ctex(64,64,(g)=>{g.fillStyle='#e00';g.beginPath();g.arc(32,32,30,0,7);g.fill();g.fillStyle='#fff';g.font='bold 48px Arial';g.textAlign='center';g.fillText('!',32,50)}),depthTest:false}));
 warn.scale.set(.6,.6,1);warn.position.set(0,2.5,0);warn.visible=false;root.add(warn);
 const tgt=new THREE.Sprite(new THREE.SpriteMaterial({map:ctex(64,64,(g)=>{g.fillStyle='#ffd21a';g.beginPath();g.moveTo(8,8);g.lineTo(56,8);g.lineTo(32,50);g.fill()}),depthTest:false}));
 tgt.scale.set(.45,.45,1);tgt.position.set(0,2.4,0);tgt.visible=false;root.add(tgt);
 return {root,lean,wf,wr,rider,torso,aL,aR,lL,lR,weapon,warn,tgt,head}
}
function setWeapon(b,w){b.weapon.clear();if(!w)return;if(w=='CLUB'){const m=new THREE.Mesh(new THREE.CylinderGeometry(.04,.06,.9,6),M(0x6a4422));m.rotation.x=Math.PI/2;m.position.z=-.3;b.weapon.add(m)}
 else{for(let i=0;i<8;i++){const m=new THREE.Mesh(new THREE.TorusGeometry(.04,.015,4,6),CHROME);m.position.z=-i*.08;m.rotation.y=i%2*1.57;b.weapon.add(m)}}}
// ---------- particles ----------
const PN=400,pGeo=new THREE.BufferGeometry(),pPos=new Float32Array(PN*3),pCol=new Float32Array(PN*3),pVel=new Float32Array(PN*3),pLife=new Float32Array(PN);
pGeo.setAttribute('position',new THREE.BufferAttribute(pPos,3));pGeo.setAttribute('color',new THREE.BufferAttribute(pCol,3));
const pts=new THREE.Points(pGeo,new THREE.PointsMaterial({size:.25,map:roundT,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));pts.frustumCulled=false;scene.add(pts);
const dGeo=new THREE.BufferGeometry(),DN=120,dPos=new Float32Array(DN*3),dVel=new Float32Array(DN*3),dLife=new Float32Array(DN);dGeo.setAttribute('position',new THREE.BufferAttribute(dPos,3));
const dust=new THREE.Points(dGeo,new THREE.PointsMaterial({size:1.6,map:roundT,color:0xb09a78,transparent:true,opacity:.55,depthWrite:false}));dust.frustumCulled=false;scene.add(dust);
let pi_=0,di_=0;
function sparks(x,y,z,n){for(let i=0;i<n;i++){const k=pi_++%PN;pPos[k*3]=x;pPos[k*3+1]=y;pPos[k*3+2]=z;pVel[k*3]=rnd(-5,5);pVel[k*3+1]=rnd(1,6);pVel[k*3+2]=rnd(-5,5);pLife[k]=rnd(.3,.6);pCol[k*3]=1;pCol[k*3+1]=rnd(.6,.95);pCol[k*3+2]=.3}}
function puff(x,y,z,n){for(let i=0;i<n;i++){const k=di_++%DN;dPos[k*3]=x+rnd(-.5,.5);dPos[k*3+1]=y+rnd(0,.5);dPos[k*3+2]=z+rnd(-.5,.5);dVel[k*3]=rnd(-2,2);dVel[k*3+1]=rnd(.5,2);dVel[k*3+2]=rnd(-2,2);dLife[k]=rnd(.8,1.5)}}
function updParticles(dt){for(let k=0;k<PN;k++){if(pLife[k]>0){pLife[k]-=dt;pVel[k*3+1]-=12*dt;for(let j=0;j<3;j++)pPos[k*3+j]+=pVel[k*3+j]*dt;if(pLife[k]<=0)pPos[k*3+1]=-999}}
 for(let k=0;k<DN;k++){if(dLife[k]>0){dLife[k]-=dt;for(let j=0;j<3;j++)dPos[k*3+j]+=dVel[k*3+j]*dt;if(dLife[k]<=0)dPos[k*3+1]=-999}}pGeo.attributes.position.needsUpdate=pGeo.attributes.color.needsUpdate=dGeo.attributes.position.needsUpdate=true}
// ---------- sound ----------
let AC=null,eng=null,muted=false,master;
function initAudio(){if(AC)return;try{AC=new (window.AudioContext||window.webkitAudioContext)();master=AC.createGain();master.gain.value=muted?0:.5;master.connect(AC.destination);
 const o=AC.createOscillator(),o2=AC.createOscillator(),f=AC.createBiquadFilter(),g=AC.createGain();o.type='sawtooth';o2.type='square';f.type='lowpass';f.frequency.value=900;g.gain.value=0;o.connect(f);o2.connect(f);f.connect(g);g.connect(master);o.start();o2.start();eng={o,o2,g,f}}catch(e){}}
function engine(sp,on){if(!eng)return;const f=40+sp*2.4+Math.sin(performance.now()/90)*2;eng.o.frequency.value=f;eng.o2.frequency.value=f*.5;eng.g.gain.value=on?.12:0}
function hitSnd(big){if(!AC)return;const n=AC.sampleRate*.25,b=AC.createBuffer(1,n,AC.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,big?2:4);
 const s=AC.createBufferSource();s.buffer=b;const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=big?600:1500;const g=AC.createGain();g.gain.value=big?1:.7;s.connect(f);f.connect(g);g.connect(master);s.start();
 const o=AC.createOscillator(),og=AC.createGain();o.frequency.setValueAtTime(big?120:220,AC.currentTime);o.frequency.exponentialRampToValueAtTime(40,AC.currentTime+.2);og.gain.setValueAtTime(.5,AC.currentTime);og.gain.exponentialRampToValueAtTime(.001,AC.currentTime+.25);o.connect(og);og.connect(master);o.start();o.stop(AC.currentTime+.3)}
function beep(f,d){if(!AC)return;const o=AC.createOscillator(),g=AC.createGain();o.type='square';o.frequency.value=f;g.gain.value=.15;o.connect(g);g.connect(master);o.start();g.gain.exponentialRampToValueAtTime(.001,AC.currentTime+d);o.stop(AC.currentTime+d)}
let musicT=null;function music(on){clearInterval(musicT);if(!on||!AC)return;let i=0;const bass=[55,55,65,49,55,55,73,65];musicT=setInterval(()=>{if(muted)return;const o=AC.createOscillator(),g=AC.createGain();o.type='sawtooth';o.frequency.value=bass[i%8]*(i%16>7?1.5:1);g.gain.value=.08;o.connect(g);g.connect(master);o.start();g.gain.exponentialRampToValueAtTime(.001,AC.currentTime+.22);o.stop(AC.currentTime+.25);if(i%2==0){hat()}i++},230)}
function hat(){const n=2000,b=AC.createBuffer(1,n,AC.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*(1-i/n);const s=AC.createBufferSource();s.buffer=b;const g=AC.createGain();g.gain.value=.05;s.connect(g);g.connect(master);s.start()}
function setMute(m){muted=m;if(master)master.gain.value=m?0:.5;$('mSnd').textContent='SOUND: '+(m?'OFF':'ON');$('tSnd').textContent=m?'🔇':'🔊'}
// ---------- game state ----------
const NAMES=['VIPER','RAZOR','NATASHA','DIESEL','SKULL'];
const RCOL=[[0x6a2a9a,0xe060b0,0xf0d020,0xf0d020],[0x1a5ad8,0x202020,0x3a8af0,0xffffff],[0x2a9a3a,0x303030,0x50c050,0x20c020],[0xe0e0e0,0x1a2a6a,0xd02020,0xff8020],[0xf0a010,0x402010,0x202020,0x111111]];
let P,riders=[],cars=[],pickups=[],flyers=[],state='intro',t0=0,raceT=0,cash=0,shake=0,combo=0,comboT=0,trafT=0,police=null,camS=0;
const player={};
function newRace(){
 C=COURSES[raceNo%COURSES.length];for(let i=0;i<6;i++)ph[i]=rnd(0,6.28);buildWorld();
 riders.forEach(r=>scene.remove(r.m.root));cars.forEach(c=>scene.remove(c.m));pickups.forEach(p=>scene.remove(p.m));flyers.forEach(f=>scene.remove(f.o));if(police)scene.remove(police.m.root);
 riders=[];cars=[];pickups=[];flyers=[];police=null;
 P={name:'YOU',me:true,s:14,l:1.5,v:0,hp:100,steer:0,wob:0,atk:0,atkSide:0,atkKind:'',cd:0,crash:0,weapon:null,fin:0,m:makeBike(0xd01818,0xc01010,0x151515,0x151515)};
 scene.add(P.m.root);riders.push(P);
 const grid=[[14,4.3],[14,-1.4],[14,-4.2],[14,6.8],[14,-6.8]];
 for(let i=0;i<5;i++){const c=RCOL[i];const r={name:NAMES[i],s:grid[i][0],l:grid[i][1],v:0,hp:100,steer:0,wob:0,atk:0,cd:rnd(2,4),wind:0,crash:0,ko:false,fin:0,skill:rnd(.9,1)+raceNo*.02,tl:grid[i][1],stick:0,m:makeBike(c[0],c[1],c[2],c[3])};scene.add(r.m.root);riders.push(r)}
 raceT=0;trafT=15;combo=0;camS=0;
 const dots=$('dots');dots.innerHTML='';
}
// ---------- input ----------
const inp={steer:0,brake:false,tilt:false,tiltV:0};let padId=null,padX0=0;
const pad=$('pad'),knob=$('knob');
pad.addEventListener('touchstart',e=>{e.preventDefault();const t=e.changedTouches[0];padId=t.identifier;padX0=t.clientX},{passive:false});
pad.addEventListener('touchmove',e=>{e.preventDefault();for(const t of e.changedTouches)if(t.identifier==padId){const dx=clamp((t.clientX-padX0)/55,-1,1);inp.steer=dx;knob.style.transform=`translateX(${dx*45}px)`}},{passive:false});
const padEnd=e=>{for(const t of e.changedTouches)if(t.identifier==padId){padId=null;inp.steer=0;knob.style.transform=''}};pad.addEventListener('touchend',padEnd);pad.addEventListener('touchcancel',padEnd);
function btn(id,down,up){const b=$(id);b.addEventListener('touchstart',e=>{e.preventDefault();b.classList.add('dn');down()},{passive:false});b.addEventListener('touchend',e=>{e.preventDefault();b.classList.remove('dn');up&&up()});b.addEventListener('mousedown',()=>{b.classList.add('dn');down()});b.addEventListener('mouseup',()=>{b.classList.remove('dn');up&&up()})}
btn('bP',()=>attack('PUNCH'));btn('bK',()=>attack('KICK'));btn('bB',()=>inp.brake=true,()=>inp.brake=false);
const keys={};addEventListener('keydown',e=>{keys[e.code]=1;if(e.code=='KeyJ')attack('PUNCH');if(e.code=='KeyK')attack('KICK')});addEventListener('keyup',e=>keys[e.code]=0);
$('tTilt').onclick=$('tTilt').ontouchend=async e=>{e.preventDefault();if(!inp.tilt&&window.DeviceOrientationEvent&&DeviceOrientationEvent.requestPermission){try{await DeviceOrientationEvent.requestPermission()}catch(e){}}inp.tilt=!inp.tilt;$('tTilt').textContent='TILT: '+(inp.tilt?'ON':'OFF')};
addEventListener('deviceorientation',e=>{const a=(screen.orientation&&screen.orientation.angle)||window.orientation||0;let v=(a==90?e.beta:a==-90||a==270?-e.beta:e.gamma)||0;inp.tiltV=clamp(v/22,-1,1)});
$('tSnd').onclick=$('tSnd').ontouchend=e=>{e.preventDefault();setMute(!muted)};
$('mSnd').onclick=()=>{initAudio();setMute(!muted)};
$('mCtl').onclick=()=>{show('help')};$('hOk').onclick=()=>show('title');
$('mStart').onclick=()=>{initAudio();fs();startCountdown()};
$('rNext').onclick=()=>{raceNo++;newRace();startCountdown()};$('rMenu').onclick=()=>{raceNo++;newRace();toTitle()};
function fs(){try{const d=document.documentElement;(d.requestFullscreen||d.webkitRequestFullscreen||(()=>{})).call(d);screen.orientation&&screen.orientation.lock&&screen.orientation.lock('landscape').catch(()=>{})}catch(e){}}
document.addEventListener('touchstart',()=>{if(!document.fullscreenElement&&state!='intro')fs()},{once:true});
function show(id){['intro','title','help','res'].forEach(s=>$(s).classList.toggle('on',s==id))}
function hud(on){$('hud').style.display=on?'block':'none';$('ctl').style.display=on?'block':'none'}
function popup(t,cls){const d=document.createElement('div');d.className='pop '+(cls||'');d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),1300)}
// ---------- combat ----------
function attack(kind){if(state!='race'||P.crash>0||P.cd>0)return;P.cd=.45;P.atk=.38;P.atkKind=kind;P.hitDone=false;
 const t=targetOf(P,3.8);P.atkSide=t?Math.sign(t.l-P.l):(Math.random()<.5?-1:1);P.atkT=t}
function targetOf(a,range){let best=null,bd=1e9;for(const r of riders){if(r==a||r.ko||r.crash>0||r.fin)continue;const ds=r.s-a.s,dl=r.l-a.l;if(Math.abs(ds)<range&&Math.abs(dl)<3.8&&Math.abs(dl)>.4){const d=Math.abs(ds)+Math.abs(dl)*.5;if(d<bd){bd=d;best=r}}}return best}
function hitRider(att,vic,kind){const wmul=att.weapon=='CLUB'?1.8:att.weapon=='CHAIN'?1.5:1;const dmg=(kind=='KICK'?19:14)*wmul*(att.me?1:.7);vic.hp-=dmg;vic.wob=1;vic.wind=0;if(kind=='KICK')vic.l+=Math.sign(vic.l-att.l)*.6;
 const p=pos(vic.s,(vic.l+att.l)/2);sparks(p.x,cy(vic.s)+1.5,p.z,att.me?26:14);hitSnd(vic.hp<=0);shake=Math.max(shake,att.me?.35:.5);
 if(att.me){combo++;comboT=3;if(combo>1){$('combo').style.display='block';$('combo').textContent='COMBO x'+combo}}
 else{flash=.5;combo=0}
 if(vic.hp<=0){if(vic.me){crash(P,'KNOCKED DOWN!')}else knockout(vic)}}
let flash=0;
function knockout(r){r.ko=true;r.hp=0;const bonus=150+combo*50;cash+=bonus;popup('KNOCKOUT!');setTimeout(()=>popup('+$'+bonus,'s'),300);shake=.8;hitSnd(true);
 throwRider(r);if(Math.random()<.85){const w=Math.random()<.5?'CLUB':'CHAIN';const m=new THREE.Group();const s=new THREE.Mesh(new THREE.OctahedronGeometry(.45),new THREE.MeshBasicMaterial({color:w=='CLUB'?0xffa020:0x80e0ff}));m.add(s);
  const lab=new THREE.Sprite(new THREE.SpriteMaterial({map:ctex(128,40,(g)=>{g.fillStyle='#000a';g.fillRect(0,0,128,40);g.fillStyle='#ffd21a';g.font='bold 26px Impact';g.textAlign='center';g.fillText(w,64,30)}),depthTest:false}));lab.scale.set(1.6,.5,1);lab.position.y=1;m.add(lab);
  scene.add(m);pickups.push({m,s:r.s+25,l:clamp(r.l,-6,6),w})}}
function throwRider(r){const m=r.m;m.rider.updateWorldMatrix(true,false);const o=m.rider;const wp=new THREE.Vector3(),wq=new THREE.Quaternion();o.getWorldPosition(wp);o.getWorldQuaternion(wq);m.lean.remove(o);scene.add(o);o.position.copy(wp);o.quaternion.copy(wq);
 const d=dcx(r.s);flyers.push({o,r,vx:rnd(-3,3)+Math.sign(r.l||1)*3,vy:rnd(7,10),vz:-r.v*.6,spin:rnd(6,10),t:0});puff(wp.x,wp.y-1,wp.z,12)}
function crash(r,msg){if(r.crash>0)return;r.crash=r.me?2.6:3;r.v*=.2;r.wob=0;throwRider(r);if(r.me){popup(msg||'CRASH!');shake=1;hitSnd(true);combo=0;$('combo').style.display='none'}}
function restoreRider(r){const f=flyers.find(f=>f.r==r);if(f){scene.remove(f.o);flyers.splice(flyers.indexOf(f),1)}const o=r.m.rider;o.position.set(0,1.05,.25);o.rotation.set(0,0,0);r.m.lean.add(o);r.walk=0}
// ---------- traffic ----------
function carMesh(){const g=new THREE.Group();const c=[0xe8e8e8,0x2050c0,0xd0c020,0x208040,0xc03020][Math.random()*5|0];const bm=new THREE.MeshPhongMaterial({color:c,shininess:80});
 box(2,.7,4.4,bm,0,.65,0,g);box(1.8,.6,2.2,bm,0,1.3,.2,g);box(1.75,.5,2.1,M(0x223344),0,1.3,.2,g).scale.set(1.02,.85,.9);
 [[-.85,-1.4],[.85,-1.4],[-.85,1.4],[.85,1.4]].forEach(([x,z])=>{const w=new THREE.Mesh(tireG,BLACK);w.scale.set(1.2,1,1);w.position.set(x,.33,z);g.add(w)});
 box(.4,.2,.05,new THREE.MeshBasicMaterial({color:0xffffcc}),-.65,.75,-2.21,g);box(.4,.2,.05,new THREE.MeshBasicMaterial({color:0xffffcc}),.65,.75,-2.21,g);
 box(.4,.18,.05,new THREE.MeshBasicMaterial({color:0xff2020}),-.7,.8,2.21,g);box(.4,.18,.05,new THREE.MeshBasicMaterial({color:0xff2020}),.7,.8,2.21,g);
 const sh=new THREE.Mesh(new THREE.PlaneGeometry(2.6,5.4),new THREE.MeshBasicMaterial({map:shadowT,transparent:true,depthWrite:false}));sh.rotation.x=-Math.PI/2;sh.position.y=.04;g.add(sh);return g}
function spawnCar(){if(cars.length>=2||P.s>TRACK-300)return;const onc=Math.random()<.5;const m=carMesh();scene.add(m);cars.push({m,s:P.s+(onc?380:260),l:onc?-4:4,v:onc?-16:14,onc})}
// ---------- update ----------
function updRider(r,dt){const m=r.m;
 if(r.crash>0){r.crash-=dt;r.v=Math.max(0,r.v-25*dt);if(r.crash<=0){restoreRider(r);if(r.me){r.hp=Math.max(r.hp,55)}else if(r.hp<=0)r.ko=true}}
 else if(r.ko){r.v=Math.max(0,r.v-12*dt);m.lean.rotation.z=lerp(m.lean.rotation.z,1.4,dt*3)}
 r.wob=Math.max(0,r.wob-dt*1.6);
 r.s+=r.v*dt;
 // lateral
 if(!r.ko){r.l+=r.steer*dt*(4+r.v*.14);}
 const lim=RW+2.5;if(Math.abs(r.l)>lim)r.l=Math.sign(r.l)*lim;
 place(m.root,r.s,r.l,cy(r.s)+(Math.abs(r.l)>RW?-.2:0));m.root.rotation.x=Math.atan(dcy(r.s));
 if(!r.ko)m.lean.rotation.z=lerp(m.lean.rotation.z,-r.steer*.45+Math.sin(raceT*25)*r.wob*.3,dt*8);
 const sp=r.v*dt/.33;m.wf.rotation.x-=sp;m.wr.rotation.x-=sp;
 // pose
 const a=r.atk>0?Math.sin((1-r.atk/.38)*Math.PI):0;const side=r.atkSide||1;
 const A=side>0?m.aR:m.aL,O=side>0?m.aL:m.aR,Lg=side>0?m.lR:m.lL,Lo=side>0?m.lL:m.lR;
 [m.aL,m.aR].forEach(x=>{x.sh.rotation.set(.9,0,0);x.el.rotation.x=-.2});[m.lL,m.lR].forEach((x,i)=>{x.hp.rotation.set(.35,(i?1:-1)*.15,0);x.kn.rotation.x=.6});
 m.torso.rotation.z=0;m.torso.rotation.x=-.75;
 if(r.wind>0){const k=Math.min(1,(1.0-r.wind)*3);A.sh.rotation.set(.9-2.6*k,0,-side*.5*k);A.el.rotation.x=-1.2*k;m.torso.rotation.z=side*.25*k}
 if(a>0){if(r.atkKind=='KICK'){Lg.hp.rotation.set(.35-.3*a,0,side*1.45*a);Lg.kn.rotation.x=.6*(1-a);m.torso.rotation.z=-side*.35*a}
  else{A.sh.rotation.set(.9-.6*a,-side*0*a,side*-1.5*a);A.sh.rotation.order='XZY';A.el.rotation.x=-.2*(1-a);m.torso.rotation.z=side*.3*a}}
 if(r.wob>0)m.torso.rotation.z+=Math.sin(raceT*30)*r.wob*.4;
 m.head.rotation.y=r.atk>0||r.wind>0?side*.6:0;
 if(r.atk>0){r.atk-=dt;if(!r.hitDone&&r.atk<.22){r.hitDone=true;const t=r.atkT;if(t&&!t.ko&&t.crash<=0&&Math.abs(t.s-r.s)<4.2&&Math.abs(t.l-r.l)<4.2)hitRider(r,t,r.atkKind);else if(r.me)beep(180,.08)}}
 r.cd-=dt;
}
function updAI(r,dt){if(r.ko||r.crash>0||r.fin)return;const ds=r.s-P.s;
 let vt=57*r.skill;const aggro=aggroSet.includes(r);
 if(aggro&&P.crash<=0){if(Math.abs(ds)<25){r.stick-=dt;if(r.stick>-9){vt=P.v+clamp(-ds*1.2,-9,9);r.tl=P.l+(r.side||1)*1.9}else vt=P.v+9}else{vt=P.v+(ds<0?14:-8)}}
 else{if(Math.abs(ds)>30)r.stick=Math.min(r.stick+dt,2);if(ds<-40)vt=P.v+6;if(ds>120)vt=P.v-5;if(Math.abs(r.l-r.tl)<.3&&Math.random()<dt*.3)r.tl=rnd(-5,5)}
 for(const c of cars){const cd=c.s-r.s;if(cd>0&&cd<40&&Math.abs(c.l-r.l)<2.5)r.tl=c.l>0?-3:3}
 r.tl=clamp(r.tl,-6.5,6.5);
 const acc=vt>r.v?9:-14;r.v=clamp(r.v+acc*dt,0,Math.max(vt,0));
 r.steer=clamp((r.tl-r.l)*.6,-1,1);
 // attack AI
 if(r.wind>0){r.wind-=dt;r.m.warn.visible=true;if(r.wind<=0){r.m.warn.visible=false;r.atk=.38;r.atkKind=Math.random()<.5?'PUNCH':'KICK';r.atkSide=Math.sign(P.l-r.l)||1;r.atkT=P;r.hitDone=false;r.cd=rnd(2.2,3.8)}}
 else{r.m.warn.visible=false;if(r.cd<=0&&r.atk<=0&&Math.abs(ds)<3&&Math.abs(P.l-r.l)<3.6&&P.crash<=0&&raceT>4){r.wind=1.0;r.atkSide=Math.sign(P.l-r.l)||1}}
}
let lastTarget=null,aggroSet=[];
function aggroCalc(){aggroSet=riders.filter(r=>!r.me&&!r.cop&&!r.ko&&r.crash<=0&&!r.fin&&r.stick>-9&&Math.abs(r.s-P.s)<300).sort((a,b)=>Math.abs(a.s-P.s)-Math.abs(b.s-P.s)).slice(0,2);aggroSet.forEach((r,i)=>{if(!r.side)r.side=r.l>P.l?1:-1});
 riders.forEach(r=>{if(!r.me&&r.stick<=-9&&Math.abs(r.s-P.s)>40){r.stick=2;r.side=0}})}
function update(dt){raceT+=dt;
 // player input
 let st=inp.tilt?inp.tiltV:inp.steer;if(keys.ArrowLeft||keys.KeyA)st=-1;if(keys.ArrowRight||keys.KeyD)st=1;
 P.steer=lerp(P.steer,st*.85,dt*(Math.abs(st)>Math.abs(P.steer)?5:8)); // auto centre
 if(P.crash<=0&&!P.fin){const off=Math.abs(P.l)>RW;const vmax=(off?30:58)+(P.weapon?0:0);const br=inp.brake||keys.ArrowDown||keys.KeyS;
  if(br)P.v=Math.max(0,P.v-30*dt);else P.v=P.v<vmax?Math.min(vmax,P.v+(P.v<30?13:6)*dt):P.v-20*dt;if(off&&Math.random()<dt*8){const p=pos(P.s,P.l);puff(p.x,cy(P.s),p.z,1)}
  // edge assist
  if(Math.abs(P.l)>RW-.5&&Math.sign(st)!=Math.sign(P.l))P.l-=Math.sign(P.l)*dt*1.5}
 if(P.fin){P.v=Math.max(0,P.v-15*dt);P.steer=0}
 aggroCalc();riders.forEach(r=>{if(!r.me)updAI(r,dt)});riders.forEach(r=>updRider(r,dt));
 // bike-bike push
 for(const a of riders)for(const b of riders){if(a===b||a.ko||b.ko)continue;const ds=a.s-b.s,dl=a.l-b.l;if(Math.abs(ds)<1.9&&Math.abs(dl)<.95){const p=(.95-Math.abs(dl))*.5;a.l+=Math.sign(dl||1)*p;b.l-=Math.sign(dl||1)*p}}
 // target marker
 const t=targetOf(P,3.8);riders.forEach(r=>r.m.tgt.visible=false);if(t){t.m.tgt.visible=true;lastTarget=t}
 const show=t||(lastTarget&&!lastTarget.ko&&Math.abs(lastTarget.s-P.s)<20?lastTarget:null);$('hbR').style.display=show?'block':'none';if(show){$('rN').textContent=show.name;$('hR').style.width=Math.max(0,show.hp)+'%'}
 comboT-=dt;if(comboT<=0&&combo){combo=0;$('combo').style.display='none'}
 // pickups
 for(const p of pickups.slice()){place(p.m,p.s,p.l,cy(p.s)+1+Math.sin(raceT*4)*.15);p.m.children[0].rotation.y+=dt*3;if(Math.abs(p.s-P.s)<2.5&&Math.abs(p.l-P.l)<1.8&&P.crash<=0){P.weapon=p.w;setWeapon(P.m,p.w);popup('GOT '+p.w+'!','s');beep(880,.15);scene.remove(p.m);pickups.splice(pickups.indexOf(p),1)}else if(p.s<P.s-30){scene.remove(p.m);pickups.splice(pickups.indexOf(p),1)}}
 // traffic
 trafT-=dt;if(trafT<=0){spawnCar();trafT=rnd(30,40)}
 let warn=false;for(const c of cars.slice()){c.s+=c.v*dt;place(c.m,c.s,c.l);if(c.onc)c.m.rotation.y+=Math.PI;const ds=c.s-P.s;
  if(ds>0&&ds<150&&Math.abs(c.l-P.l)<3)warn=true;
  if(P.crash<=0&&Math.abs(ds)<2.8&&Math.abs(c.l-P.l)<1.7){const ov=1.7-Math.abs(c.l-P.l);if(ov<.9||P.v<25){P.l+=Math.sign(P.l-c.l||1)*.9;P.v*=.75;P.wob=1;P.hp-=4;shake=.4;hitSnd(false);popup('WATCH IT!','s')}else{P.hp-=15;crash(P,'CRASH!');P.l=c.l+(c.l>0?-2.5:2.5)}}
  if(ds<-60||ds>500){scene.remove(c.m);cars.splice(cars.indexOf(c),1)}}
 $('warn').style.display=warn?'block':'none';
 // flyers
 for(const f of flyers){f.t+=dt;if(f.o.position.y>groundH(f.r.s,f.r.l)+.3||f.vy>0){f.vy-=20*dt;f.o.position.x+=f.vx*dt;f.o.position.y+=f.vy*dt;f.o.position.z+=f.vz*dt;f.o.rotation.x+=f.spin*dt;f.o.rotation.z+=f.spin*.3*dt;if(f.o.position.y<groundH(f.r.s,f.r.l)+.3&&f.vy<0){puff(f.o.position.x,f.o.position.y,f.o.position.z,10);f.vy=f.t<1.2?-f.vy*.3:0;f.vx*=.5;f.vz*=.3}}
  else{f.vz*=.9;f.o.rotation.x=lerp(f.o.rotation.x,f.t>1.4?0:-1.4,dt*4);if(f.t>1.4&&f.r.me){const b=f.r.m.root.position;f.o.position.x=lerp(f.o.position.x,b.x,dt*2.5);f.o.position.z=lerp(f.o.position.z,b.z,dt*2.5);f.o.position.y=groundH(f.r.s,f.r.l)+.3+Math.abs(Math.sin(f.t*12))*.08}}}
 // police (light)
 if(!police&&raceT>25&&Math.random()<dt*.02&&P.s<TRACK-500){const m=makeBike(0xf0f0f0,0x1a2a5a,0x101830,0xffffff);const lt=box(.3,.1,.1,new THREE.MeshBasicMaterial({color:0x2040ff}),0,1.3,.6,m.lean);scene.add(m.root);police={name:'COP',s:P.s-80,l:-3,v:0,hp:200,steer:0,wob:0,atk:0,cd:5,wind:0,crash:0,ko:false,fin:0,skill:1.2,tl:-3,stick:0,m,lt,cop:true,life:20};riders.push(police);popup('POLICE!','s')}
 if(police){police.life-=dt;police.lt.material.color.set(Math.sin(raceT*20)>0?0x2040ff:0xff2020);if(police.life<0||police.ko){scene.remove(police.m.root);riders.splice(riders.indexOf(police),1);police=null}}
 // finish
 for(const r of riders){if(!r.fin&&r.s>=TRACK&&!r.cop){r.fin=raceT;if(r.me){setTimeout(results,2500);popup('FINISH!')}}}
 // positions
 const order=riders.filter(r=>!r.cop).sort((a,b)=>(b.fin?1e6-b.fin:0)-(a.fin?1e6-a.fin:0)||b.s-a.s);P.place=order.indexOf(P)+1;
 // hud
 $('spd').innerHTML=Math.round(P.v*3.6)+' <small>KM/H</small>';$('pos').innerHTML=P.place+'<small>/6</small>';$('progf').style.width=clamp(P.s/TRACK*100,0,100)+'%';
 $('hY').style.width=clamp(P.hp,0,100)+'%';$('cash').textContent='$'+cash;$('wpn').textContent=P.weapon?'🗡 '+P.weapon:'';
 engine(P.v,!muted);
}
// ---------- camera ----------
const camPos=new THREE.Vector3(),camLook=new THREE.Vector3();let camInit=false;
function updCamera(dt){const s=P.s,l=P.l;const back=3.9,up=1.45;const cp=pos(s-back,l*.92),lp=pos(s+12,l*.85);
 const tgt=new THREE.Vector3(cp.x,cy(s-back)+up+P.v*.004,cp.z),look=new THREE.Vector3(lp.x,cy(s+12)+.85,lp.z);
 if(!camInit){camPos.copy(tgt);camLook.copy(look);camInit=true}camPos.lerp(tgt,1-Math.exp(-dt*10));camLook.lerp(look,1-Math.exp(-dt*12));
 camera.position.copy(camPos);if(shake>0){camera.position.x+=rnd(-1,1)*shake*.25;camera.position.y+=rnd(-1,1)*shake*.2;shake=Math.max(0,shake-dt*2)}camera.lookAt(camLook);camera.rotateZ(P.steer*.06);
 const f=62+clamp((P.v-30)/32,0,1)*12;if(Math.abs(camera.fov-f)>.1){camera.fov=lerp(camera.fov,f,dt*3);camera.updateProjectionMatrix()}}
function followFar(){farGroup.position.set(camera.position.x,0,camera.position.z);sun.position.set(camera.position.x-60,camera.position.y+120,camera.position.z+40);sun.target.position.copy(camera.position)}
// ---------- speed lines / fx ----------
const lines=[];for(let i=0;i<40;i++)lines.push({a:rnd(0,6.28),r:rnd(.2,1),sp:rnd(.8,1.6)});
function drawFx(dt){const w=fxc.width,h=fxc.height;fx.clearRect(0,0,w,h);if(state!='race')return;const k=clamp((P.v-38)/24,0,1);
 if(k>0){fx.strokeStyle=`rgba(255,255,255,${.35*k})`;fx.lineWidth=2;const cx_=w/2,cy_=h*.42;for(const L of lines){L.r+=dt*L.sp*2.2;if(L.r>1.2){L.r=.25;L.a=rnd(0,6.28)}const R=L.r*Math.max(w,h)*.6;const x=cx_+Math.cos(L.a)*R,y=cy_+Math.sin(L.a)*R*.6;const R2=R*(1+.25*k);fx.beginPath();fx.moveTo(x,y);fx.lineTo(cx_+Math.cos(L.a)*R2,cy_+Math.sin(L.a)*R2*.6);fx.stroke()}}
 if(flash>0){fx.fillStyle=`rgba(255,0,0,${flash*.5})`;fx.fillRect(0,0,w,h);flash-=dt*1.5}
 const g=fx.createRadialGradient(w/2,h/2,h*.4,w/2,h/2,w*.75);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.35)');fx.fillStyle=g;fx.fillRect(0,0,w,h)}
// ---------- flow ----------
function toTitle(){state='title';show('title');hud(false);music(true)}
function startCountdown(){show(null);hud(true);state='count';t0=performance.now();music(false);camInit=false;
 let n=3;$('cd')?.remove();const d=document.createElement('div');d.id='cd';document.body.appendChild(d);
 const tick=()=>{if(n>0){d.textContent=n;setLight(n==1?1:0,'0'+n);beep(440,.2);n--;setTimeout(tick,900)}else{d.textContent='GO!';setLight(2,'GO');beep(880,.5);state='race';setTimeout(()=>d.remove(),700)}};tick()}
function results(){state='res';hud(false);const order=riders.filter(r=>!r.cop).sort((a,b)=>{const fa=a.fin||1e9,fb=b.fin||1e9;return fa-fb||b.s-a.s});const prize=[1500,1000,700,400,250,100];
 const me=order.indexOf(P);cash+=prize[me];$('rT').textContent=me==0?'YOU WON!':me<3?'PLACED #'+(me+1):'FINISHED #'+(me+1);
 $('rTab').innerHTML='<tr><td>#</td><td>RIDER</td><td>TIME</td><td>PRIZE</td></tr>'+order.map((r,i)=>`<tr class="${r.me?'me':''}"><td>${i+1}</td><td>${r.me?'ADITYA (YOU)':r.name}${r.ko?' 💥KO':''}</td><td>${r.fin?r.fin.toFixed(1)+'s':'DNF'}</td><td>$${prize[i]}</td></tr>`).join('');
 $('rP').textContent=C.name+' · Total cash: $'+cash+' · Next: '+COURSES[(raceNo+1)%5].name;show('res')}
// ---------- quality ----------
let fpsAcc=0,fpsN=0,fpsT=0;window.__fps=[];
function quality_(dt){fpsAcc+=dt;fpsN++;fpsT+=dt;if(fpsT>3){const fps=fpsN/fpsAcc;window.__fps.push(Math.round(fps));if(fps<45&&quality>0){quality--;pr=quality==1?1:.75;renderer.setPixelRatio(pr);resize();scene.fog.far=quality==1?700:500}fpsAcc=fpsN=fpsT=0}}
// ---------- loop ----------
let last=performance.now();
function loop(now){requestAnimationFrame(loop);const dt=Math.min(.05,(now-last)/1000);last=now;
 if(state=='race'){update(dt);updCamera(dt)}
 else if(state=='count'){riders.forEach(r=>updRider(r,0));updCamera(dt)}
 else if(state=='title'||state=='intro'||state=='res'){camS+=dt*.35;const b=P.m.root.position;const a=camS;camera.position.set(b.x+Math.sin(a)*4.5,b.y+1.2+Math.sin(a*.7)*.5,b.z+Math.cos(a)*4.5);camera.lookAt(b.x,b.y+.8,b.z);P.m.wf.rotation.x-=dt*3;P.m.wr.rotation.x-=dt*3;riders.forEach(r=>updRider(r,0))}
 updParticles(dt);followFar();renderer.render(scene,camera);drawFx(dt);quality_(dt)}
newRace();setLight(0,'--');
requestAnimationFrame(loop);
setTimeout(()=>{if(state=='intro')toTitle()},3300);
$('intro').onclick=()=>{toTitle()};
window.G={get P(){return P},get riders(){return riders},get state(){return state},attack,inp,get cars(){return cars},spawnCar};
