
import * as THREE from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import {unzipSync} from "https://esm.sh/fflate@0.8.2";

const HF="https://huggingface.co/nvidia/SOMA-X/resolve/main/";
const SHAPE=HF+"SOMA_neutral.npz?download=true";
const PROC=HF+"SOMA_procedural_transforms.json?download=true";
const RIG=HF+"SOMA_template_rig.usda?download=true";
const ANIM=HF+"example_animation.npy?download=true";

const $=s=>document.querySelector(s);
const setState=(sel,txt,cls="")=>{const e=$(sel);e.textContent=txt;e.className=cls};
const info=(sel,txt)=>$(sel).textContent=txt;

let arrays=null, mean=null, dirs=null, eig=null, triangles=null, lowMap=null;
let coeff=new Float32Array(128), mesh=null, geometry=null, baseLow=null, dirsLow=null;
let shapePass=false, rigPass=false;

const scene=new THREE.Scene();
const cam=new THREE.PerspectiveCamera(32,innerWidth/innerHeight,.01,100);
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:"high-performance"});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);$("#viewport").appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xffffff,0x292929,2.5));
const dl=new THREE.DirectionalLight(0xffffff,2.5);dl.position.set(3,5,4);scene.add(dl);
const orbit=new OrbitControls(cam,renderer.domElement);orbit.enableDamping=true;orbit.dampingFactor=.08;
cam.position.set(0,1,4);orbit.target.set(0,1,0);
let frames=0,last=performance.now();
renderer.setAnimationLoop(()=>{orbit.update();renderer.render(scene,cam);frames++;const n=performance.now();if(n-last>1000){$("#fps").textContent=Math.round(frames*1000/(n-last))+" fps";frames=0;last=n}});
addEventListener("resize",()=>{cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});

function fromFortranOrder(src,shape){
 if(shape.length<=1)return src;
 const out=new src.constructor(src.length),coord=new Array(shape.length).fill(0),strideF=new Array(shape.length).fill(1);
 for(let d=1;d<shape.length;d++)strideF[d]=strideF[d-1]*shape[d-1];
 let fIndex=0;
 for(let cIndex=0;cIndex<src.length;cIndex++){
  out[cIndex]=src[fIndex];
  for(let d=shape.length-1;d>=0;d--){
   coord[d]++;fIndex+=strideF[d];
   if(coord[d]<shape[d])break;
   fIndex-=coord[d]*strideF[d];coord[d]=0;
  }
 }
 return out
}
function parseNPY(u8){
 const dv=new DataView(u8.buffer,u8.byteOffset,u8.byteLength);
 if(String.fromCharCode(...u8.slice(0,6))!=="\x93NUMPY")throw new Error("Kein NPY");
 const major=u8[6];
 if(major!==1&&major!==2&&major!==3)throw new Error("NPY-Version "+major+" noch nicht unterstützt");
 const off=major===1?10:12,hlen=major===1?dv.getUint16(8,true):dv.getUint32(8,true);
 if(off+hlen>u8.byteLength)throw new Error("NPY-Header abgeschnitten");
 const hdr=new TextDecoder(major===3?"utf-8":"latin1").decode(u8.slice(off,off+hlen));
 const descr=(hdr.match(/['"]descr['"]\s*:\s*['"]([^'"]+)['"]/)||[])[1];
 const fortran=/['"]fortran_order['"]\s*:\s*True/.test(hdr);
 const sm=(hdr.match(/['"]shape['"]\s*:\s*\(([^)]*)\)/)||[])[1]||"";
 const shape=sm.split(",").map(x=>parseInt(x.trim())).filter(Number.isFinite);
 if(!descr)throw new Error("NPY dtype fehlt");
 const dataOff=off+hlen,count=shape.reduce((a,b)=>a*b,1)||1;
 let Ctor;
 if(/f4$/.test(descr))Ctor=Float32Array;
 else if(/f8$/.test(descr))Ctor=Float64Array;
 else if(/i4$/.test(descr))Ctor=Int32Array;
 else if(/i8$/.test(descr))Ctor=BigInt64Array;
 else if(/u4$/.test(descr))Ctor=Uint32Array;
 else if(/u2$/.test(descr))Ctor=Uint16Array;
 else if(/u1$/.test(descr))Ctor=Uint8Array;
 else if(/[US]\d+$/.test(descr)){
   const copy=new Uint8Array(u8.byteLength-dataOff);copy.set(u8.subarray(dataOff));
   return {shape,descr,fortran,data:new TextDecoder("utf-8").decode(copy).replace(/\0/g,"")}
 } else throw new Error("NPY dtype "+descr+" noch nicht unterstützt");
 const bytes=Ctor.BYTES_PER_ELEMENT*count;
 if(dataOff+bytes>u8.byteLength)throw new Error(`NPY-Payload abgeschnitten: brauche ${bytes} Bytes ab Offset ${dataOff}, habe ${u8.byteLength-dataOff}`);
 // Safari/iOS-sicher: Payload in einen eigenen, bei ByteOffset 0 beginnenden Buffer kopieren.
 const copy=new Uint8Array(bytes);copy.set(u8.subarray(dataOff,dataOff+bytes));
 const alignedBuffer=copy.buffer.slice(copy.byteOffset,copy.byteOffset+copy.byteLength);
 const raw=new Ctor(alignedBuffer,0,count);
 return {shape,descr,fortran,data:fortran?fromFortranOrder(raw,shape):raw}
}
function findArray(...names){for(const n of names){if(arrays[n])return arrays[n]}return null}
async function fetchProgress(url){
 const r=await fetch(url,{mode:"cors",cache:"force-cache"});if(!r.ok)throw new Error("HTTP "+r.status);
 const total=+r.headers.get("content-length")||27488638;
 const reader=r.body.getReader(),chunks=[];let got=0;
 for(;;){const {done,value}=await reader.read();if(done)break;chunks.push(value);got+=value.length;$("#bar").style.width=Math.min(100,got/total*100)+"%";info("#shapeInfo",`Download ${(got/1048576).toFixed(1)} / ${(total/1048576).toFixed(1)} MB`)}
 const out=new Uint8Array(got);let o=0;for(const c of chunks){out.set(c,o);o+=c.length}return out
}
async function loadShape(){
 try{
  setState("#shapeState","LÄDT","warn");
  const buf=await fetchProgress(SHAPE);
  info("#shapeInfo","NPZ wird im Browser entpackt …");
  const zip=unzipSync(buf), parsed={};
  for(const [name,u8] of Object.entries(zip)){
   if(!name.endsWith(".npy"))continue;
   try{parsed[name.replace(/\.npy$/,"")]=parseNPY(u8)}
   catch(e){throw new Error(`${name}: ${e.message}`)}
  }
  arrays=parsed;
  const m=findArray("mean"),d=findArray("shapedirs"),e=findArray("eigenvalues"),tr=findArray("triangles_low","triangles"),lm=findArray("lod_mid_to_low");
  if(!m||!d||!e||!tr)throw new Error("Pflichtarrays fehlen. Gefunden: "+Object.keys(parsed).join(", "));
  mean=m;dirs=d;eig=e;triangles=tr;lowMap=lm;
  setState("#shapeState","BESTANDEN","ok");
  const fortranArrays=Object.entries(parsed).filter(([,a])=>a.fortran).map(([name])=>name);
  info("#shapeInfo",`✓ NPZ direkt auf iPhone lesbar
mean ${JSON.stringify(mean.shape)}
shapedirs ${JSON.stringify(dirs.shape)}
eigenvalues ${JSON.stringify(eig.shape)}
triangles ${JSON.stringify(triangles.shape)}
lod map ${lowMap?JSON.stringify(lowMap.shape):"nicht vorhanden"}
Arrays insgesamt: ${Object.keys(parsed).length}
Fortran-Arrays konvertiert: ${fortranArrays.length?fortranArrays.join(", "):"keine"}`);
  buildLowData();buildMesh();buildSliders();shapePass=true;updateDecision()
 }catch(e){console.error(e);setState("#shapeState","FEHLER","bad");info("#shapeInfo",String(e.stack||e))}
}
function buildLowData(){
 const V=mean.shape[0],K=eig.shape[0], useLow=!!lowMap;
 const n=useLow?lowMap.data.length:V;baseLow=new Float32Array(n*3);
 for(let i=0;i<n;i++){const src=useLow?lowMap.data[i]:i;baseLow[i*3]=mean.data[src*3]/100;baseLow[i*3+1]=mean.data[src*3+1]/100;baseLow[i*3+2]=mean.data[src*3+2]/100}
 dirsLow=new Float32Array(K*n*3);
 // shapedirs is K x (V*3) in current asset contract.
 for(let k=0;k<K;k++)for(let i=0;i<n;i++){const src=useLow?lowMap.data[i]:i;const so=k*V*3+src*3,doff=(k*n+i)*3;dirsLow[doff]=dirs.data[so]/100;dirsLow[doff+1]=dirs.data[so+1]/100;dirsLow[doff+2]=dirs.data[so+2]/100}
 if(useLow&&arrays.triangles_low)triangles=arrays.triangles_low
}
function buildMesh(){
 geometry?.dispose();if(mesh)scene.remove(mesh);
 geometry=new THREE.BufferGeometry();geometry.setAttribute("position",new THREE.BufferAttribute(baseLow.slice(),3));
 const idx=triangles.data instanceof Int32Array?new Uint32Array(triangles.data):new Uint32Array(Array.from(triangles.data,Number));
 geometry.setIndex(new THREE.BufferAttribute(idx,1));geometry.computeVertexNormals();
 mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:0xc8c9cf,roughness:.78,metalness:0,side:THREE.DoubleSide}));
 scene.add(mesh);setState("#meshState","GERENDERT","ok");setState("#pcaState","AKTIV","ok");frame();
 info("#meshInfo",`✓ ${baseLow.length/3} Vertices · ${idx.length/3} Dreiecke · Three.js WebGL`)
}
function updateShape(){
 if(!geometry)return;const t0=performance.now(),pos=geometry.attributes.position.array,n=baseLow.length/3,K=eig.data.length;
 pos.set(baseLow);
 for(let k=0;k<K;k++){const c=coeff[k];if(Math.abs(c)<1e-7)continue;const scale=c*Math.sqrt(Number(eig.data[k]));const off=k*n*3;for(let i=0;i<n*3;i++)pos[i]+=dirsLow[off+i]*scale}
 geometry.attributes.position.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();
 info("#shapePerf",`Letzte komplette Shape-Rekonstruktion: ${(performance.now()-t0).toFixed(1)} ms · 128 Komponenten verfügbar · Low-LOD ${n} Vertices`)
}
function buildSliders(){
 const box=$("#sliders");box.innerHTML="";
 for(let i=0;i<10;i++){const d=document.createElement("div");d.className="slider";d.innerHTML=`<label>PC ${i+1}</label><input type="range" min="-3" max="3" step=".05" value="0"><output>0.00</output>`;const r=d.querySelector("input"),o=d.querySelector("output");r.oninput=()=>{coeff[i]=+r.value;o.value=(+r.value).toFixed(2);updateShape()};box.appendChild(d)}
}
function frame(){
 if(!mesh)return;geometry.computeBoundingBox();const b=geometry.boundingBox,c=new THREE.Vector3(),s=new THREE.Vector3();b.getCenter(c);b.getSize(s);orbit.target.copy(c);const d=Math.max(2.5,s.y*1.45);cam.position.set(0,c.y,d);orbit.update()
}
$("#loadShape").onclick=loadShape;$("#frame").onclick=frame;
$("#front").onclick=()=>{if(!mesh)return;const c=orbit.target,d=cam.position.distanceTo(c);cam.position.set(c.x,c.y,c.z+d);cam.lookAt(c);orbit.update()};
$("#side").onclick=()=>{if(!mesh)return;const c=orbit.target,d=cam.position.distanceTo(c);cam.position.set(c.x+d,c.y,c.z);cam.lookAt(c);orbit.update()};
$("#reset").onclick=()=>{coeff.fill(0);document.querySelectorAll(".slider input").forEach((r,i)=>{r.value=0;r.nextElementSibling.value="0.00"});updateShape()};
$("#random").onclick=()=>{coeff.fill(0);for(let i=0;i<12;i++)coeff[i]=(Math.random()*2-1)*1.6;document.querySelectorAll(".slider input").forEach((r,i)=>{r.value=coeff[i];r.nextElementSibling.value=coeff[i].toFixed(2)});updateShape()};

async function headSize(url){
 const r=await fetch(url,{method:"HEAD",mode:"cors",cache:"no-store"});if(!r.ok)throw new Error("HEAD "+r.status);return {len:+r.headers.get("content-length")||0,type:r.headers.get("content-type")||"?"}
}
async function testRig(){
 try{
  setState("#rigState","PRÜFT","warn");
  const jr=await fetch(PROC,{mode:"cors",cache:"force-cache"});if(!jr.ok)throw new Error("Procedural JSON HTTP "+jr.status);
  const j=await jr.json();
  const names=j.public_joint_names||j.publicJointNames||j.joint_names||[];
  const [rig,anim]=await Promise.allSettled([headSize(RIG),headSize(ANIM)]);
  $("#joints").innerHTML=names.map((n,i)=>`<span>${i}. ${String(n)}</span>`).join("");
  const rigTxt=rig.status==="fulfilled"?`${(rig.value.len/1048576).toFixed(1)} MB`:`nicht HEAD-lesbar: ${rig.reason}`;
  const animTxt=anim.status==="fulfilled"?`${(anim.value.len/1048576).toFixed(1)} MB`:`nicht HEAD-lesbar: ${anim.reason}`;
  setState("#rigState",names.length>=78?"VERTRAG OK":"TEILWEISE",names.length>=78?"ok":"warn");
  info("#rigInfo",`✓ Procedural-Sidecar direkt browserlesbar
Öffentliche Gelenknamen: ${names.length}
Template-Rig: ${rigTxt}
Beispielanimation: ${animTxt}

WICHTIG: Das große USD wird absichtlich NICHT geladen. Für echtes Posing brauchen wir daraus nur Bindpose + Hierarchie + Skinweights als kompaktes Browser-Pack.`);
  rigPass=names.length>=78;setState("#poseState","BRAUCHT RIG-PACK","warn");updateDecision()
 }catch(e){console.error(e);setState("#rigState","FEHLER","bad");info("#rigInfo",String(e.stack||e))}
}
$("#testRig").onclick=testRig;

function updateDecision(){
 if(shapePass&&rigPass){setState("#decision","NÄCHSTER TEST: RIG-PACK","warn");info("#decisionInfo","Shape ist real im Browser bewiesen. Rig-Vertrag ist erreichbar. Nächster notwendiger Schritt: aus dem 345-MB-USD einmalig ein kleines Apache-2.0 Browser-Rig-Pack extrahieren und danach echtes LBS/Finger/Arm/Bein-Posing auf deinem iPhone testen. BODY LAB wird vorher nicht umgestellt.")}
 else if(shapePass){setState("#decision","SHAPE BESTANDEN","ok")}
}
