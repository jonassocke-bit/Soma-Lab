
import * as THREE from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import {unzipSync} from "https://esm.sh/fflate@0.8.2";

const HF="https://huggingface.co/nvidia/SOMA-X/resolve/main/";
const SHAPE=HF+"SOMA_neutral.npz?download=true";
const NVRAW="https://raw.githubusercontent.com/NVlabs/SOMA-X/86632764684281dc98f31ab9c4aac36a4cdbc428/assets/";
const NVMEDIA="https://media.githubusercontent.com/media/NVlabs/SOMA-X/86632764684281dc98f31ab9c4aac36a4cdbc428/assets/";
const PROC=NVRAW+"SOMA_procedural_transforms.json";
const RIG=NVMEDIA+"SOMA_template_rig.usda";
const ANIM=HF+"example_animation.npy?download=true";

const ASSET_DB="SomaLabAssetCache";
const ASSET_DB_VERSION=1;
const ASSET_STORE="assets";
const PUBLIC_JOINT_NAMES=[
 "Root","Hips","Spine1","Spine2","Chest","Neck1","Neck2","Head","HeadEnd","Jaw","LeftEye","RightEye",
 "LeftShoulder","LeftArm","LeftForeArm","LeftHand",
 "LeftHandThumb1","LeftHandThumb2","LeftHandThumb3","LeftHandThumbEnd",
 "LeftHandIndex1","LeftHandIndex2","LeftHandIndex3","LeftHandIndex4","LeftHandIndexEnd",
 "LeftHandMiddle1","LeftHandMiddle2","LeftHandMiddle3","LeftHandMiddle4","LeftHandMiddleEnd",
 "LeftHandRing1","LeftHandRing2","LeftHandRing3","LeftHandRing4","LeftHandRingEnd",
 "LeftHandPinky1","LeftHandPinky2","LeftHandPinky3","LeftHandPinky4","LeftHandPinkyEnd",
 "RightShoulder","RightArm","RightForeArm","RightHand",
 "RightHandThumb1","RightHandThumb2","RightHandThumb3","RightHandThumbEnd",
 "RightHandIndex1","RightHandIndex2","RightHandIndex3","RightHandIndex4","RightHandIndexEnd",
 "RightHandMiddle1","RightHandMiddle2","RightHandMiddle3","RightHandMiddle4","RightHandMiddleEnd",
 "RightHandRing1","RightHandRing2","RightHandRing3","RightHandRing4","RightHandRingEnd",
 "RightHandPinky1","RightHandPinky2","RightHandPinky3","RightHandPinky4","RightHandPinkyEnd",
 "LeftLeg","LeftShin","LeftFoot","LeftToeBase","LeftToeEnd",
 "RightLeg","RightShin","RightFoot","RightToeBase","RightToeEnd"
];
// Cache keys describe the data revision, not the app version.
// Later Soma-Lab versions therefore reuse the same downloaded bytes.
const ASSET_KEY={
 shape:"SOMA-X/v0026/SOMA_neutral.npz",
 proc:"SOMA-X/8663276/SOMA_procedural_transforms.json"
};
let assetDBPromise=null;

function openAssetDB(){
 if(assetDBPromise)return assetDBPromise;
 assetDBPromise=new Promise((resolve,reject)=>{
  const req=indexedDB.open(ASSET_DB,ASSET_DB_VERSION);
  req.onupgradeneeded=()=>{
   const db=req.result;
   if(!db.objectStoreNames.contains(ASSET_STORE))db.createObjectStore(ASSET_STORE,{keyPath:"key"})
  };
  req.onsuccess=()=>resolve(req.result);
  req.onerror=()=>reject(req.error||new Error("IndexedDB konnte nicht geöffnet werden"));
 });
 return assetDBPromise
}
async function assetCacheGet(key){
 const db=await openAssetDB();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(ASSET_STORE,"readonly");
  const req=tx.objectStore(ASSET_STORE).get(key);
  req.onsuccess=()=>resolve(req.result||null);
  req.onerror=()=>reject(req.error||new Error("Asset-Cache lesen fehlgeschlagen"));
 })
}
async function assetCachePut(key,url,u8,type="application/octet-stream"){
 const db=await openAssetDB();
 const buffer=u8.buffer.slice(u8.byteOffset,u8.byteOffset+u8.byteLength);
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(ASSET_STORE,"readwrite");
  tx.objectStore(ASSET_STORE).put({key,url,type,size:u8.byteLength,savedAt:Date.now(),buffer});
  tx.oncomplete=()=>resolve();
  tx.onerror=()=>reject(tx.error||new Error("Asset-Cache speichern fehlgeschlagen"));
  tx.onabort=()=>reject(tx.error||new Error("Asset-Cache speichern abgebrochen"));
 })
}
async function assetCacheDelete(key){
 const db=await openAssetDB();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(ASSET_STORE,"readwrite");
  tx.objectStore(ASSET_STORE).delete(key);
  tx.oncomplete=()=>resolve();
  tx.onerror=()=>reject(tx.error||new Error("Asset-Cache löschen fehlgeschlagen"));
 })
}
async function requestPersistentStorage(){
 try{
  if(navigator.storage?.persist)return await navigator.storage.persist();
 }catch(e){console.warn("Persistent storage request:",e)}
 return null
}
async function fetchAssetBytes(key,url,{fallbackSize=0,onProgress=null,forceNetwork=false}={}){
 if(!forceNetwork){
  try{
   const cached=await assetCacheGet(key);
   if(cached?.buffer){
    const u8=new Uint8Array(cached.buffer);
    if(onProgress)onProgress(u8.byteLength,u8.byteLength,true);
    return {u8,cacheHit:true,size:u8.byteLength}
   }
  }catch(e){console.warn("Asset-Cache read failed, network fallback:",e)}
 }

 const r=await fetch(url,{mode:"cors",cache:"force-cache"});
 if(!r.ok)throw new Error("HTTP "+r.status);
 const total=+r.headers.get("content-length")||fallbackSize;
 const reader=r.body?.getReader();
 let out;

 if(reader){
  const chunks=[];let got=0;
  for(;;){
   const {done,value}=await reader.read();
   if(done)break;
   chunks.push(value);got+=value.length;
   if(onProgress)onProgress(got,total,false)
  }
  out=new Uint8Array(got);
  let o=0;for(const c of chunks){out.set(c,o);o+=c.length}
 }else{
  out=new Uint8Array(await r.arrayBuffer());
  if(onProgress)onProgress(out.byteLength,out.byteLength,false)
 }

 try{
  await assetCachePut(key,url,out,r.headers.get("content-type")||"application/octet-stream")
 }catch(e){
  console.warn("Asset konnte nicht persistent gespeichert werden:",e)
 }
 return {u8:out,cacheHit:false,size:out.byteLength}
}
async function fetchAssetJSON(key,url){
 const a=await fetchAssetBytes(key,url);
 return {json:JSON.parse(new TextDecoder("utf-8").decode(a.u8)),cacheHit:a.cacheHit}
}

const $=s=>document.querySelector(s);
const setState=(sel,txt,cls="")=>{const e=$(sel);e.textContent=txt;e.className=cls};
const info=(sel,txt)=>$(sel).textContent=txt;

let arrays=null, mean=null, dirs=null, eig=null, triangles=null, lowMap=null;
let coeff=new Float32Array(128), mesh=null, geometry=null, baseLow=null, dirsLow=null, currentRestLow=null;
let shapePass=false, rigPass=false, posePass=false;

// Browser-LBS state. The currently cached Hugging-Face SOMA_neutral.npz is the
// original public SOMA v0.1 asset, whose official runtime stored the 78-joint
// rig, bind transforms and sparse skinning weights in this same NPZ.
let poseReady=false, poseParents=null, poseLocalBase=null, poseBindWorld=null, poseInvBind=null;
let poseBoneIndices=null, poseBoneWeights=null, poseEulerDeg=null, poseJointCount=0, poseTopK=8;

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
async function fetchShapeAsset(forceNetwork=false){
 return fetchAssetBytes(ASSET_KEY.shape,SHAPE,{
  fallbackSize:27488638,
  forceNetwork,
  onProgress:(got,total,cacheHit)=>{
   $("#bar").style.width=(cacheHit?100:Math.min(100,total?got/total*100:0))+"%";
   info("#shapeInfo",cacheHit
    ?`✓ Aus persistentem iPhone-Cache · ${(got/1048576).toFixed(1)} MB · kein erneuter Download`
    :`Download ${(got/1048576).toFixed(1)} / ${total?(total/1048576).toFixed(1):"?"} MB · wird anschließend persistent gespeichert`)
  }
 })
}
async function decodeShapeNPZ(buf){
 const zip=unzipSync(buf),parsed={};
 for(const [name,u8] of Object.entries(zip)){
  if(!name.endsWith(".npy"))continue;
  try{parsed[name.replace(/\.npy$/,"")]=parseNPY(u8)}
  catch(e){throw new Error(`${name}: ${e.message}`)}
 }
 return parsed
}
async function loadShape(){
 try{
  setState("#shapeState","LÄDT","warn");
  await requestPersistentStorage();

  let asset=await fetchShapeAsset(false),parsed;
  try{
   parsed=await decodeShapeNPZ(asset.u8)
  }catch(firstError){
   if(!asset.cacheHit)throw firstError;
   console.warn("Cached Shape ungültig, lösche nur dieses Asset und lade einmal neu:",firstError);
   info("#shapeInfo","Lokaler Shape-Cache war ungültig · wird einmalig neu geladen …");
   await assetCacheDelete(ASSET_KEY.shape);
   asset=await fetchShapeAsset(true);
   parsed=await decodeShapeNPZ(asset.u8)
  }

  info("#shapeInfo","NPZ wird im Browser ausgewertet …");
  arrays=parsed;
  const m=findArray("mean"),d=findArray("shapedirs"),e=findArray("eigenvalues"),tr=findArray("triangles_low","triangles"),lm=findArray("lod_mid_to_low");
  if(!m||!d||!e||!tr)throw new Error("Pflichtarrays fehlen. Gefunden: "+Object.keys(parsed).join(", "));
  mean=m;dirs=d;eig=e;triangles=tr;lowMap=lm;
  setState("#shapeState","BESTANDEN","ok");
  const fortranArrays=Object.entries(parsed).filter(([,a])=>a.fortran).map(([name])=>name);
  info("#shapeInfo",`✓ NPZ direkt auf iPhone lesbar
Asset-Quelle: ${asset.cacheHit?"persistenter iPhone-Cache · kein Download":"geladen und persistent gespeichert"}
Cache-Schlüssel: ${ASSET_KEY.shape}
mean ${JSON.stringify(mean.shape)}
shapedirs ${JSON.stringify(dirs.shape)}
eigenvalues ${JSON.stringify(eig.shape)}
triangles ${JSON.stringify(triangles.shape)}
lod map ${lowMap?JSON.stringify(lowMap.shape):"nicht vorhanden"}
Arrays insgesamt: ${Object.keys(parsed).length}
Fortran-Arrays konvertiert: ${fortranArrays.length?fortranArrays.join(", "):"keine"}`);
  buildLowData();buildMesh();buildSliders();shapePass=true;probeEmbeddedRig();updateDecision()
 }catch(e){
  console.error(e);setState("#shapeState","FEHLER","bad");info("#shapeInfo",String(e.stack||e))
 }
}
function buildLowData(){
 const V=mean.shape[0],K=eig.shape[0],useLow=!!lowMap;
 const n=useLow?lowMap.data.length:V;baseLow=new Float32Array(n*3);
 for(let i=0;i<n;i++){
  const src=useLow?Number(lowMap.data[i]):i;
  baseLow[i*3]=Number(mean.data[src*3])/100;
  baseLow[i*3+1]=Number(mean.data[src*3+1])/100;
  baseLow[i*3+2]=Number(mean.data[src*3+2])/100
 }
 currentRestLow=baseLow.slice();
 dirsLow=new Float32Array(K*n*3);
 for(let k=0;k<K;k++)for(let i=0;i<n;i++){
  const src=useLow?Number(lowMap.data[i]):i,so=k*V*3+src*3,doff=(k*n+i)*3;
  dirsLow[doff]=Number(dirs.data[so])/100;
  dirsLow[doff+1]=Number(dirs.data[so+1])/100;
  dirsLow[doff+2]=Number(dirs.data[so+2])/100
 }
 if(useLow&&arrays.triangles_low)triangles=arrays.triangles_low
}
function buildMesh(){
 geometry?.dispose();if(mesh)scene.remove(mesh);
 geometry=new THREE.BufferGeometry();geometry.setAttribute("position",new THREE.BufferAttribute(currentRestLow.slice(),3));
 const idx=triangles.data instanceof Int32Array?new Uint32Array(triangles.data):new Uint32Array(Array.from(triangles.data,Number));
 geometry.setIndex(new THREE.BufferAttribute(idx,1));geometry.computeVertexNormals();
 mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:0xc8c9cf,roughness:.78,metalness:0,side:THREE.DoubleSide}));
 scene.add(mesh);setState("#meshState","GERENDERT","ok");setState("#pcaState","AKTIV","ok");frame();
 info("#meshInfo",`✓ ${currentRestLow.length/3} Vertices · ${idx.length/3} Dreiecke · Three.js WebGL`)
}
function rebuildRestShape(){
 if(!currentRestLow||currentRestLow.length!==baseLow.length)currentRestLow=new Float32Array(baseLow.length);
 currentRestLow.set(baseLow);
 const n=baseLow.length/3,K=eig.data.length;
 for(let k=0;k<K;k++){
  const c=coeff[k];if(Math.abs(c)<1e-7)continue;
  const scale=c*Math.sqrt(Number(eig.data[k])),off=k*n*3;
  for(let i=0;i<n*3;i++)currentRestLow[i]+=dirsLow[off+i]*scale
 }
 return currentRestLow
}
function updateShape(){
 if(!geometry)return;
 const t0=performance.now(),rest=rebuildRestShape();
 if(poseReady)applyPoseToRest(rest,false);
 else{
  const pos=geometry.attributes.position.array;pos.set(rest);
  geometry.attributes.position.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere()
 }
 info("#shapePerf",`Letzte komplette Shape-Rekonstruktion: ${(performance.now()-t0).toFixed(1)} ms · 128 Komponenten verfügbar · Low-LOD ${rest.length/3} Vertices${poseReady?" · Pose danach erneut angewendet":""}`)
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
$("#reset").onclick=()=>{coeff.fill(0);document.querySelectorAll("#sliders .slider input").forEach((r,i)=>{r.value=0;r.nextElementSibling.value="0.00"});updateShape()};
$("#random").onclick=()=>{coeff.fill(0);for(let i=0;i<12;i++)coeff[i]=(Math.random()*2-1)*1.6;document.querySelectorAll("#sliders .slider input").forEach((r,i)=>{r.value=coeff[i];r.nextElementSibling.value=coeff[i].toFixed(2)});updateShape()};


const EMBEDDED_RIG_KEYS=[
 "joint_parent_ids","bind_pose_world","bind_pose_local","bind_shape",
 "skinning_weights_data","skinning_weights_indices","skinning_weights_indptr","skinning_weights_shape"
];

function probeEmbeddedRig(){
 const missing=EMBEDDED_RIG_KEYS.filter(k=>!arrays?.[k]);
 if(missing.length){
  setState("#poseState","RIG-PACK NÖTIG","warn");
  info("#poseInfo",`Das geladene Shape-NPZ enthält nicht alle alten eingebetteten Rig-Felder.\nFehlt: ${missing.join(", ")}\nDann müssen wir den aktuellen v0.2-Rig-Pack aus dem großen USD extrahieren.`);
  $("#initPose").disabled=true;
  return false
 }
 setState("#poseState","RIG IM CACHE","ok");
 $("#initPose").disabled=false;
 info("#poseInfo",`✓ Im bereits gecachten 27,5-MB-SOMA-NPZ wurden echte Rig-Daten gefunden:\nBindpose · Parent-Hierarchie · Bind-Shape · sparse Skinweights.\n\nDas ist der offizielle eingebettete 78-Joint-Rig-Pfad der ersten SOMA-Version. Mit „LBS initialisieren & testen“ testen wir ihn jetzt wirklich im iPhone-Browser – ohne weiteren großen Download.`);
 return true
}

function mat4Mul(a,ao,b,bo,out,oo){
 for(let r=0;r<4;r++)for(let c=0;c<4;c++){
  out[oo+r*4+c]=
   a[ao+r*4]*b[bo+c]+
   a[ao+r*4+1]*b[bo+4+c]+
   a[ao+r*4+2]*b[bo+8+c]+
   a[ao+r*4+3]*b[bo+12+c]
 }
}
function rigidInverse(src,so,out,oo){
 const r00=src[so],r01=src[so+1],r02=src[so+2],tx=src[so+3];
 const r10=src[so+4],r11=src[so+5],r12=src[so+6],ty=src[so+7];
 const r20=src[so+8],r21=src[so+9],r22=src[so+10],tz=src[so+11];
 out[oo]=r00;out[oo+1]=r10;out[oo+2]=r20;out[oo+3]=-(r00*tx+r10*ty+r20*tz);
 out[oo+4]=r01;out[oo+5]=r11;out[oo+6]=r21;out[oo+7]=-(r01*tx+r11*ty+r21*tz);
 out[oo+8]=r02;out[oo+9]=r12;out[oo+10]=r22;out[oo+11]=-(r02*tx+r12*ty+r22*tz);
 out[oo+12]=0;out[oo+13]=0;out[oo+14]=0;out[oo+15]=1
}
function makeEulerDelta(rx,ry,rz,out,oo){
 // Rz * Ry * Rx, column-vector convention, row-major storage.
 const cx=Math.cos(rx),sx=Math.sin(rx),cy=Math.cos(ry),sy=Math.sin(ry),cz=Math.cos(rz),sz=Math.sin(rz);
 out[oo]=cz*cy;
 out[oo+1]=cz*sy*sx-sz*cx;
 out[oo+2]=cz*sy*cx+sz*sx;
 out[oo+3]=0;
 out[oo+4]=sz*cy;
 out[oo+5]=sz*sy*sx+cz*cx;
 out[oo+6]=sz*sy*cx-cz*sx;
 out[oo+7]=0;
 out[oo+8]=-sy;
 out[oo+9]=cy*sx;
 out[oo+10]=cy*cx;
 out[oo+11]=0;
 out[oo+12]=0;out[oo+13]=0;out[oo+14]=0;out[oo+15]=1
}
function transformPoint(m,mo,x,y,z){
 return [
  m[mo]*x+m[mo+1]*y+m[mo+2]*z+m[mo+3],
  m[mo+4]*x+m[mo+5]*y+m[mo+6]*z+m[mo+7],
  m[mo+8]*x+m[mo+9]*y+m[mo+10]*z+m[mo+11]
 ]
}
function jointIndex(name){return PUBLIC_JOINT_NAMES.indexOf(name)}

function copyRigMatricesToMeters(arr){
 const J=arr.shape?.[0]||Math.floor(arr.data.length/16),out=new Float32Array(J*16);
 for(let j=0;j<J;j++){
  const o=j*16;
  for(let q=0;q<16;q++)out[o+q]=Number(arr.data[o+q]);
  // SOMA asset convention is centimeters; only translation is scaled.
  out[o+3]/=100;out[o+7]/=100;out[o+11]/=100
 }
 return out
}

function buildLowSkinningWeights(){
 const shape=Array.from(arrays.skinning_weights_shape.data,Number);
 if(shape.length<2)throw new Error("skinning_weights_shape ist ungültig");
 const fullV=shape[0],J=shape[1];
 if(J!==poseJointCount)throw new Error(`Skinweight-Joints ${J} != Rig-Joints ${poseJointCount}`);

 const n=currentRestLow.length/3;
 const fullToLow=new Int32Array(fullV);fullToLow.fill(-1);
 if(lowMap){
  for(let i=0;i<n;i++){
   const v=Number(lowMap.data[i]);
   if(v>=0&&v<fullV)fullToLow[v]=i
  }
 }else{
  for(let i=0;i<Math.min(n,fullV);i++)fullToLow[i]=i
 }

 const temp=Array.from({length:n},()=>[]);
 const data=arrays.skinning_weights_data.data;
 const indices=arrays.skinning_weights_indices.data;
 const indptr=arrays.skinning_weights_indptr.data;
 if(indptr.length!==J+1)throw new Error(`CSC indptr ${indptr.length} statt ${J+1}`);

 for(let j=0;j<J;j++){
  const a=Number(indptr[j]),b=Number(indptr[j+1]);
  for(let p=a;p<b;p++){
   const fullVertex=Number(indices[p]),li=fullToLow[fullVertex];
   if(li<0)continue;
   const w=Number(data[p]);
   if(w>1e-12)temp[li].push([j,w])
  }
 }

 poseBoneIndices=new Int16Array(n*poseTopK);poseBoneIndices.fill(-1);
 poseBoneWeights=new Float32Array(n*poseTopK);
 let empty=0,minInflu=99,maxInflu=0;
 for(let v=0;v<n;v++){
  const list=temp[v].sort((a,b)=>b[1]-a[1]).slice(0,poseTopK);
  minInflu=Math.min(minInflu,list.length);maxInflu=Math.max(maxInflu,list.length);
  let sum=0;for(const x of list)sum+=x[1];
  if(sum<=0){empty++;continue}
  for(let k=0;k<list.length;k++){
   poseBoneIndices[v*poseTopK+k]=list[k][0];
   poseBoneWeights[v*poseTopK+k]=list[k][1]/sum
  }
 }
 if(empty)throw new Error(`${empty} Low-LOD-Vertices haben keine Skinweights`);
 return {fullV,J,n,minInflu,maxInflu}
}

function buildPoseControls(){
 const sel=$("#poseJoint");sel.innerHTML="";
 for(let i=1;i<poseJointCount;i++){
  const o=document.createElement("option");o.value=String(i);o.textContent=`${i}. ${PUBLIC_JOINT_NAMES[i]||"Joint "+i}`;sel.appendChild(o)
 }
 const preferred=jointIndex("LeftArm");if(preferred>0)sel.value=String(preferred);
 sel.onchange=syncPoseSlidersFromJoint;
 for(const axis of ["X","Y","Z"]){
  const r=$("#pose"+axis),o=$("#pose"+axis+"Out");
  r.oninput=()=>{
   const j=Number(sel.value),a=axis==="X"?0:axis==="Y"?1:2;
   poseEulerDeg[j*3+a]=Number(r.value);o.value=`${Number(r.value).toFixed(0)}°`;
   applyPoseToRest(currentRestLow,true)
  }
 }
 syncPoseSlidersFromJoint();
 $("#poseControls").classList.remove("hidden")
}
function syncPoseSlidersFromJoint(){
 if(!poseEulerDeg)return;
 const j=Number($("#poseJoint").value||1);
 for(const [axis,a] of [["X",0],["Y",1],["Z",2]]){
  const v=poseEulerDeg[j*3+a]||0;
  $("#pose"+axis).value=String(v);$("#pose"+axis+"Out").value=`${v.toFixed(0)}°`
 }
}
function clearPose(){
 if(!poseEulerDeg)return;
 poseEulerDeg.fill(0);syncPoseSlidersFromJoint();applyPoseToRest(currentRestLow,true)
}
function setJointEuler(name,x=0,y=0,z=0){
 const j=jointIndex(name);if(j<0||j>=poseJointCount)return;
 poseEulerDeg[j*3]=x;poseEulerDeg[j*3+1]=y;poseEulerDeg[j*3+2]=z
}
function posePreset(kind){
 poseEulerDeg.fill(0);
 if(kind==="arm"){
  setJointEuler("LeftArm",25,0,-45);setJointEuler("LeftForeArm",0,25,-35)
 }else if(kind==="leg"){
  setJointEuler("LeftLeg",25,0,18);setJointEuler("LeftShin",-38,0,0)
 }else if(kind==="spine"){
  setJointEuler("Spine1",0,18,0);setJointEuler("Spine2",0,18,0);setJointEuler("Chest",0,12,0)
 }else if(kind==="finger"){
  setJointEuler("LeftHandIndex1",0,0,35);setJointEuler("LeftHandIndex2",0,0,45);
  setJointEuler("LeftHandIndex3",0,0,35);setJointEuler("LeftHandIndex4",0,0,20)
 }
 syncPoseSlidersFromJoint();applyPoseToRest(currentRestLow,true)
}

function applyPoseToRest(rest,markMoved=true){
 if(!poseReady||!geometry)return;
 const t0=performance.now(),J=poseJointCount;
 const local=new Float32Array(J*16),world=new Float32Array(J*16),bone=new Float32Array(J*16),delta=new Float32Array(16);
 const tmp=new Float32Array(16);

 for(let j=0;j<J;j++){
  const o=j*16;
  makeEulerDelta(
   (poseEulerDeg[j*3]||0)*Math.PI/180,
   (poseEulerDeg[j*3+1]||0)*Math.PI/180,
   (poseEulerDeg[j*3+2]||0)*Math.PI/180,
   delta,0
  );
  // Bind local * user delta: rotates about the joint's own local origin.
  mat4Mul(poseLocalBase,o,delta,0,local,o)
 }
 world.set(local.subarray(0,16),0);
 for(let j=1;j<J;j++){
  const p=poseParents[j];
  if(p<0||p>=j)throw new Error(`Ungültiger Parent ${p} für Joint ${j}`);
  mat4Mul(world,p*16,local,j*16,world,j*16)
 }
 for(let j=0;j<J;j++)mat4Mul(world,j*16,poseInvBind,j*16,bone,j*16);

 const pos=geometry.attributes.position.array,n=rest.length/3;
 let maxWeightErr=0;
 for(let v=0;v<n;v++){
  const x=rest[v*3],y=rest[v*3+1],z=rest[v*3+2];
  let ox=0,oy=0,oz=0,ws=0;
  for(let k=0;k<poseTopK;k++){
   const bi=poseBoneIndices[v*poseTopK+k],w=poseBoneWeights[v*poseTopK+k];
   if(bi<0||w<=0)continue;
   const bo=bi*16;
   ox+=w*(bone[bo]*x+bone[bo+1]*y+bone[bo+2]*z+bone[bo+3]);
   oy+=w*(bone[bo+4]*x+bone[bo+5]*y+bone[bo+6]*z+bone[bo+7]);
   oz+=w*(bone[bo+8]*x+bone[bo+9]*y+bone[bo+10]*z+bone[bo+11]);
   ws+=w
  }
  maxWeightErr=Math.max(maxWeightErr,Math.abs(1-ws));
  pos[v*3]=ox;pos[v*3+1]=oy;pos[v*3+2]=oz
 }
 geometry.attributes.position.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();

 if(markMoved){
  posePass=true;setState("#poseState","LBS AKTIV","ok");updateDecision()
 }
 info("#posePerf",`Browser-LBS: ${(performance.now()-t0).toFixed(1)} ms · ${n} Vertices · ${J} Joints · max. Gewichtssummenfehler ${maxWeightErr.toExponential(1)}\nShape-Regler bleiben aktiv; aktuell wird dabei noch das Template-Skelett benutzt (noch kein shape-adaptives Rebind).`)
}

function neutralLbsError(){
 const saved=poseEulerDeg.slice();poseEulerDeg.fill(0);
 const rest=currentRestLow,pos=geometry.attributes.position.array;
 applyPoseToRest(rest,false);
 let max=0,rms=0;
 for(let i=0;i<rest.length;i++){const d=pos[i]-rest[i];max=Math.max(max,Math.abs(d));rms+=d*d}
 poseEulerDeg.set(saved);
 return {max,rms:Math.sqrt(rms/rest.length)}
}

function initEmbeddedPoseRig(){
 try{
  if(!arrays||!geometry)throw new Error("Zuerst Punkt 1: Shape-Modell laden.");
  if(!probeEmbeddedRig())throw new Error("Im geladenen NPZ fehlt der eingebettete v0.1-Rig.");
  setState("#poseState","INITIALISIERT","warn");

  poseParents=Int32Array.from(Array.from(arrays.joint_parent_ids.data,Number));
  poseJointCount=poseParents.length;
  if(poseJointCount!==78)throw new Error(`Erwartet 78 Public-Joints, gefunden ${poseJointCount}`);
  if(PUBLIC_JOINT_NAMES.length!==poseJointCount)throw new Error(`Joint-Namensvertrag ${PUBLIC_JOINT_NAMES.length} != ${poseJointCount}`);

  poseLocalBase=copyRigMatricesToMeters(arrays.bind_pose_local);
  poseBindWorld=copyRigMatricesToMeters(arrays.bind_pose_world);
  if(poseLocalBase.length!==poseJointCount*16||poseBindWorld.length!==poseJointCount*16)throw new Error("Bindpose-Matrixform passt nicht zum Joint-Count");

  poseInvBind=new Float32Array(poseJointCount*16);
  for(let j=0;j<poseJointCount;j++)rigidInverse(poseBindWorld,j*16,poseInvBind,j*16);

  // Strong validation: FK(bind_pose_local) must reproduce bind_pose_world.
  const fk=new Float32Array(poseJointCount*16);fk.set(poseLocalBase.subarray(0,16),0);
  for(let j=1;j<poseJointCount;j++){
   const p=poseParents[j];if(p<0||p>=j)throw new Error(`Parent-Hierarchie ungültig bei ${j}: ${p}`);
   mat4Mul(fk,p*16,poseLocalBase,j*16,fk,j*16)
  }
  let fkErr=0;
  for(let i=0;i<fk.length;i++)fkErr=Math.max(fkErr,Math.abs(fk[i]-poseBindWorld[i]));
  if(fkErr>2e-3)throw new Error(`Bind-FK weicht zu stark ab: ${fkErr}`);

  const w=buildLowSkinningWeights();
  poseEulerDeg=new Float32Array(poseJointCount*3);
  poseReady=true;
  buildPoseControls();

  const neutral=neutralLbsError();
  // Restore zero pose explicitly after validation.
  poseEulerDeg.fill(0);applyPoseToRest(currentRestLow,false);

  setState("#poseState","LBS BEREIT","ok");
  info("#poseInfo",`✓ ECHTE BROWSER-RIG-DATEN INITIALISIERT
Quelle: bereits gecachtes offizielles SOMA v0.1 Shape/Rig-NPZ
Public Joints: ${poseJointCount} inkl. Root · 77 steuerbare Pose-Joints
Skinweights: ${w.fullV} × ${w.J} → Low-LOD ${w.n} Vertices · Top-${poseTopK}
Einflüsse/Vertex: ${w.minInflu}–${w.maxInflu}
Bindpose-FK Maxfehler: ${fkErr.toExponential(2)}
Neutral-LBS Maxfehler: ${(neutral.max*1000).toFixed(3)} mm · RMS ${(neutral.rms*1000).toFixed(3)} mm

Jetzt einen Preset-Button oder X/Y/Z-Regler bewegen. Wenn der Körper sichtbar am gewählten Gelenk deformiert, ist echtes LBS auf deinem iPhone praktisch bewiesen.

WICHTIG: Dies ist der echte eingebettete 78-Joint-Rig der ersten SOMA-Version. Der aktuelle v0.2-Template-Rig hat zusätzlich 122 Joints inkl. Twist-Joints; dessen kompakte Extraktion bleibt danach noch separat zu prüfen.`);
  info("#posePerf","Noch Neutralpose. Bewege jetzt einen Regler oder nutze einen Preset-Test.")
 }catch(e){
  console.error(e);poseReady=false;posePass=false;setState("#poseState","FEHLER","bad");info("#poseInfo",`${e?.name||"Fehler"}: ${e?.message||String(e)}${e?.stack?"\n"+e.stack:""}`)
 }
}

async function headSize(url){
 const r=await fetch(url,{method:"HEAD",mode:"cors",cache:"no-store"});if(!r.ok)throw new Error("HEAD "+r.status);return {len:+r.headers.get("content-length")||0,type:r.headers.get("content-type")||"?"}
}
async function testRig(){
 try{
  setState("#rigState","PRÜFT","warn");
  await requestPersistentStorage();
  const procAsset=await fetchAssetJSON(ASSET_KEY.proc,PROC);
  const j=procAsset.json;
  const names=j.public_rig_derivation?.main_joint_names||j.public_joint_names||j.publicJointNames||j.joint_names||[];
  const templateCount=Number(j.template_asset?.joint_count)||0;
  const templateFile=j.template_asset?.file||"unbekannt";
  const [rig,anim]=await Promise.allSettled([headSize(RIG),headSize(ANIM)]);
  $("#joints").innerHTML=names.map((n,i)=>`<span>${i}. ${String(n)}</span>`).join("");
  const rigTxt=rig.status==="fulfilled"?(rig.value.len?`${(rig.value.len/1048576).toFixed(1)} MB`:"erreichbar · Größe unbekannt"):`HEAD nicht bestätigt: ${rig.reason}`;
  const animTxt=anim.status==="fulfilled"?(anim.value.len?`${(anim.value.len/1048576).toFixed(1)} MB`:"erreichbar · Größe unbekannt"):`HEAD nicht bestätigt: ${anim.reason}`;
  const contractOK=names.length===78&&templateCount===122;
  setState("#rigState",contractOK?"VERTRAG OK":"TEILWEISE",contractOK?"ok":"warn");
  info("#rigInfo",`✓ Offizieller NVlabs-Procedural-Sidecar direkt browserlesbar
Public-Rig-Namen: ${names.length} (inkl. Root)
Template-Rig laut Sidecar: ${templateCount} Joints · ${templateFile}
Template-Rig LFS/HEAD: ${rigTxt}
Beispielanimation: ${animTxt}
Quelle gepinnt: NVlabs/SOMA-X 8663276\nProcedural-Sidecar: ${procAsset.cacheHit?"persistenter Cache":"geladen + persistent gespeichert"}

WICHTIG: Damit ist nur der Rig-Vertrag bestätigt. Das große USD wird absichtlich NICHT vollständig geladen. Bindpose + Hierarchie + Skinweights müssen wir als nächsten Schritt real extrahieren und danach im Browser testen.`);
  rigPass=contractOK;setState("#poseState","BRAUCHT RIG-PACK","warn");updateDecision()
 }catch(e){console.error(e);setState("#rigState","FEHLER","bad");info("#rigInfo",`${e?.name||"Fehler"}: ${e?.message||String(e)}${e?.stack?"\n"+e.stack:""}`)}
}
$("#testRig").onclick=testRig;
$("#initPose").onclick=initEmbeddedPoseRig;
$("#poseReset").onclick=clearPose;
$("#poseArm").onclick=()=>posePreset("arm");
$("#poseLeg").onclick=()=>posePreset("leg");
$("#poseSpine").onclick=()=>posePreset("spine");
$("#poseFinger").onclick=()=>posePreset("finger");

function updateDecision(){
 if(shapePass&&rigPass&&posePass){
  setState("#decision","LBS AUF IPHONE AKTIV","ok");
  info("#decisionInfo","Shape, PCA und echter browserseitiger LBS-Lauf sind aktiv. Dieser Test benutzt den offiziellen eingebetteten 78-Joint-Rig des SOMA-v0.1-Assets. Noch NICHT als endgültige BODY-LAB-Basis bewiesen sind: der aktualisierte v0.2-122-Joint/Procedural-Twist-Rig-Pack, shape-adaptive Gelenkpositionen/Rebinding und danach Shape+Pose unter diesen finalen Rig-Daten. BODY LAB bleibt unverändert.")
 }else if(shapePass&&rigPass){
  setState("#decision","NÄCHSTER TEST: ECHTES LBS","warn");
  info("#decisionInfo","Shape und aktueller v0.2-Rig-Vertrag sind bewiesen. Punkt 5 kann jetzt den bereits im gecachten v0.1-SOMA-Asset eingebetteten echten 78-Joint-Rig mit Bindpose + Skinweights direkt im Browser testen – ohne 329-MB-Download.")
 }else if(shapePass){
  setState("#decision","SHAPE BESTANDEN","ok")
 }
}
