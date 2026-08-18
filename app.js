
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

const RAW94_JOINT_NAMES=["Root",
 "Hips","Spine1","Spine2","Chest","Neck1","Neck2","Head","HeadEnd","Jaw","LeftEye","RightEye",
 "LeftShoulder","LeftArm","LeftForeArm","LeftHand",
 "LeftHandThumb1","LeftHandThumb2","LeftHandThumb3","LeftHandThumbEnd",
 "LeftHandIndex1","LeftHandIndex2","LeftHandIndex3","LeftHandIndex4","LeftHandIndexEnd",
 "LeftHandMiddle1","LeftHandMiddle2","LeftHandMiddle3","LeftHandMiddle4","LeftHandMiddleEnd",
 "LeftHandRing1","LeftHandRing2","LeftHandRing3","LeftHandRing4","LeftHandRingEnd",
 "LeftHandPinky1","LeftHandPinky2","LeftHandPinky3","LeftHandPinky4","LeftHandPinkyEnd",
 "LeftForeArmTwist1","LeftForeArmTwist2","LeftArmTwist1","LeftArmTwist2",
 "RightShoulder","RightArm","RightForeArm","RightHand",
 "RightHandThumb1","RightHandThumb2","RightHandThumb3","RightHandThumbEnd",
 "RightHandIndex1","RightHandIndex2","RightHandIndex3","RightHandIndex4","RightHandIndexEnd",
 "RightHandMiddle1","RightHandMiddle2","RightHandMiddle3","RightHandMiddle4","RightHandMiddleEnd",
 "RightHandRing1","RightHandRing2","RightHandRing3","RightHandRing4","RightHandRingEnd",
 "RightHandPinky1","RightHandPinky2","RightHandPinky3","RightHandPinky4","RightHandPinkyEnd",
 "RightForeArmTwist1","RightForeArmTwist2","RightArmTwist1","RightArmTwist2",
 "LeftLeg","LeftShin","LeftFoot","LeftToeBase","LeftToeEnd",
 "LeftShinTwist1","LeftShinTwist2","LeftLegTwist1","LeftLegTwist2",
 "RightLeg","RightShin","RightFoot","RightToeBase","RightToeEnd",
 "RightShinTwist1","RightShinTwist2","RightLegTwist1","RightLegTwist2"
];

// Cache keys describe the data revision, not the app version.
// Later Soma-Lab versions therefore reuse the same downloaded bytes.
const ASSET_KEY={
 shape:"SOMA-X/v0026/SOMA_neutral.npz",
 proc:"SOMA-X/8663276/SOMA_procedural_transforms.json",
 anim:"SOMA-X/f424385d/example_animation.npy"
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
let coeff=new Float32Array(128), mesh=null, geometry=null, baseLow=null, dirsLow=null, currentRestLow=null, bindShapeLow=null;
let shapePass=false, rigPass=false, posePass=false;

// Browser-LBS state. The currently cached Hugging-Face SOMA_neutral.npz is the
// original public SOMA v0.1 asset, whose official runtime stored the 78-joint
// rig, bind transforms and sparse skinning weights in this same NPZ.
let poseReady=false, poseParents=null, poseLocalBase=null, poseBindWorld=null, poseInvBind=null, poseTWorld=null;
let poseLocalActive=null,poseBindWorldActive=null,poseInvBindActive=null,rigAdaptiveEnabled=false;
let poseOrient3=null,poseOrientParentT3=null,poseBoneIndices=null,poseBoneWeights=null,poseEulerDeg=null,poseJointCount=0,poseTopK=8;
let officialAnimRel=null,officialAnimFrames=0,officialAnimFps=30,officialAnimLoaded=false;

let poseAnimRunning=false,poseAnimMode="walk",poseAnimStart=0,poseAnimLastStep=0,poseAnimSpeed=1;
let poseAnimTargetFps=30,poseAnimFrames=0,poseAnimLbsSum=0,poseAnimLbsMax=0,poseAnimLastUi=0;

let currentPoseWorld=null,rigDebugVisible=false,rigAxesVisible=false;
let rigGroup=null,rigBoneLines=null,rigJointPoints=null,rigAxesX=null,rigAxesY=null,rigAxesZ=null;

const scene=new THREE.Scene();
const cam=new THREE.PerspectiveCamera(32,innerWidth/innerHeight,.01,100);
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:"high-performance"});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);$("#viewport").appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xffffff,0x292929,2.5));
const dl=new THREE.DirectionalLight(0xffffff,2.5);dl.position.set(3,5,4);scene.add(dl);
const orbit=new OrbitControls(cam,renderer.domElement);orbit.enableDamping=true;orbit.dampingFactor=.08;
cam.position.set(0,1,4);orbit.target.set(0,1,0);
let frames=0,last=performance.now();
renderer.setAnimationLoop(()=>{
 const n=performance.now();
 if(poseAnimRunning)updatePoseAnimation(n);
 orbit.update();renderer.render(scene,cam);
 frames++;
 if(n-last>1000){
  $("#fps").textContent=Math.round(frames*1000/(n-last))+" fps";
  frames=0;last=n
 }
});
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
 if(useLow&&arrays.triangles_low)triangles=arrays.triangles_low;
 bindShapeLow=null;
 if(arrays.bind_shape){
  bindShapeLow=new Float32Array(n*3);
  for(let i=0;i<n;i++){
   const src=useLow?Number(lowMap.data[i]):i;
   bindShapeLow[i*3]=Number(arrays.bind_shape.data[src*3])/100;
   bindShapeLow[i*3+1]=Number(arrays.bind_shape.data[src*3+1])/100;
   bindShapeLow[i*3+2]=Number(arrays.bind_shape.data[src*3+2])/100
  }
 }
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
 if(poseReady){
  if(rigAdaptiveEnabled)recomputeAdaptiveRig();
  applyPoseToRest(rest,false)
 }else{
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
 "joint_parent_ids","bind_pose_world","bind_pose_local","t_pose_world","bind_shape",
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
 info("#poseInfo",`✓ Im bereits gecachten 27,5-MB-SOMA-NPZ wurden echte Rig-Daten gefunden:\nBindpose · T-Pose/Joint-Orient · Parent-Hierarchie · Bind-Shape · sparse Skinweights.\n\nDas ist der offizielle eingebettete 78-Joint-Rig-Pfad der ersten SOMA-Version. Mit „LBS initialisieren & testen“ testen wir ihn jetzt wirklich im iPhone-Browser – ohne weiteren großen Download.`);
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

function ensureRigDebugObjects(){
 if(rigGroup||!poseReady)return;
 rigGroup=new THREE.Group();
 const bonePairs=Math.max(0,poseJointCount-1);
 const boneGeo=new THREE.BufferGeometry();
 boneGeo.setAttribute("position",new THREE.BufferAttribute(new Float32Array(bonePairs*2*3),3));
 rigBoneLines=new THREE.LineSegments(boneGeo,new THREE.LineBasicMaterial({color:0xffcf66,transparent:true,opacity:.95}));
 rigGroup.add(rigBoneLines);

 const pointGeo=new THREE.BufferGeometry();
 pointGeo.setAttribute("position",new THREE.BufferAttribute(new Float32Array(poseJointCount*3),3));
 rigJointPoints=new THREE.Points(pointGeo,new THREE.PointsMaterial({color:0x58f0a8,size:.04,sizeAttenuation:true}));
 rigGroup.add(rigJointPoints);

 const makeAxis=(color)=>{
  const g=new THREE.BufferGeometry();
  g.setAttribute("position",new THREE.BufferAttribute(new Float32Array(poseJointCount*2*3),3));
  const l=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color,transparent:true,opacity:.92}));
  rigGroup.add(l);return l
 };
 rigAxesX=makeAxis(0xff5d5d);
 rigAxesY=makeAxis(0x5dff7d);
 rigAxesZ=makeAxis(0x58a6ff);
 rigGroup.visible=rigDebugVisible;
 scene.add(rigGroup)
}
function refreshRigDebug(){
 if(!poseReady||!currentPoseWorld)return;
 ensureRigDebugObjects();
 if(!rigGroup)return;
 rigGroup.visible=rigDebugVisible;
 const jointPos=rigJointPoints.geometry.attributes.position.array;
 const bonePos=rigBoneLines.geometry.attributes.position.array;
 const axisX=rigAxesX.geometry.attributes.position.array;
 const axisY=rigAxesY.geometry.attributes.position.array;
 const axisZ=rigAxesZ.geometry.attributes.position.array;
 const axisScale=.09;
 let bp=0,ax=0;
 for(let j=0;j<poseJointCount;j++){
  const o=j*16;
  const p=transformPoint(currentPoseWorld,o,0,0,0);
  jointPos[j*3]=p[0];jointPos[j*3+1]=p[1];jointPos[j*3+2]=p[2];
  if(j>0){
   const pp=transformPoint(currentPoseWorld,poseParents[j]*16,0,0,0);
   bonePos[bp++]=pp[0];bonePos[bp++]=pp[1];bonePos[bp++]=pp[2];
   bonePos[bp++]=p[0];bonePos[bp++]=p[1];bonePos[bp++]=p[2]
  }
  const px=transformPoint(currentPoseWorld,o,axisScale,0,0);
  const py=transformPoint(currentPoseWorld,o,0,axisScale,0);
  const pz=transformPoint(currentPoseWorld,o,0,0,axisScale);
  for(const end of [px,py,pz]){
   const arr=end===px?axisX:end===py?axisY:axisZ;
  }
  axisX[ax]=p[0];axisX[ax+1]=p[1];axisX[ax+2]=p[2];axisX[ax+3]=px[0];axisX[ax+4]=px[1];axisX[ax+5]=px[2];
  axisY[ax]=p[0];axisY[ax+1]=p[1];axisY[ax+2]=p[2];axisY[ax+3]=py[0];axisY[ax+4]=py[1];axisY[ax+5]=py[2];
  axisZ[ax]=p[0];axisZ[ax+1]=p[1];axisZ[ax+2]=p[2];axisZ[ax+3]=pz[0];axisZ[ax+4]=pz[1];axisZ[ax+5]=pz[2];
  ax+=6
 }
 for(const obj of [rigJointPoints,rigBoneLines,rigAxesX,rigAxesY,rigAxesZ])obj.geometry.attributes.position.needsUpdate=true;
 rigAxesX.visible=rigAxesVisible;rigAxesY.visible=rigAxesVisible;rigAxesZ.visible=rigAxesVisible;
}
function toggleRigDebug(){
 rigDebugVisible=!rigDebugVisible;
 if(rigGroup)rigGroup.visible=rigDebugVisible;
 setState("#rigDebugState",rigDebugVisible?"SICHTBAR":"AUS",rigDebugVisible?"ok":"warn");
 info("#rigDebugInfo",rigDebugVisible
  ?`Skelett-Overlay aktiv. Gelbe Linien = Bone-Verbindungen, grüne Punkte = Joint-Positionen${rigAxesVisible?", RGB = lokale X/Y/Z-Achsen":""}. Nutze jetzt am besten Einzelgelenk-Tests mit +10°/+20°/+30°.`
  :"Rig-Overlay aus. Damit können wir direkt sehen, ob ein Gelenk zwar korrekt adressiert wird, aber um die falsche Achse bzw. zu stark rotiert.");
 refreshRigDebug()
}
function toggleRigAxes(){
 rigAxesVisible=!rigAxesVisible;
 if(rigAxesX){rigAxesX.visible=rigAxesVisible;rigAxesY.visible=rigAxesVisible;rigAxesZ.visible=rigAxesVisible}
 setState("#rigDebugState",rigDebugVisible?(rigAxesVisible?"RIG+ACHSEN":"SICHTBAR"):(rigAxesVisible?"ACHSEN":"AUS"),rigDebugVisible||rigAxesVisible?"ok":"warn");
 info("#rigDebugInfo",rigAxesVisible
  ?"Lokale Gelenkachsen eingeblendet: Rot = X, Grün = Y, Blau = Z. Wenn ein +10°-Test optisch viel zu stark oder um die falsche Achse wirkt, sehen wir es jetzt direkt am Rig."
  :"Achsen ausgeblendet. Skelett-Overlay bleibt optional sichtbar.");
 refreshRigDebug()
}
function applySingleJointDebug(deg){
 if(!poseReady||!poseEulerDeg)return;
 stopPoseAnimation(false);
 poseEulerDeg.fill(0);
 const j=Number($("#poseJoint").value||1);
 const axis=$("#debugAxis")?.value||"Z";
 const a=axis==="X"?0:axis==="Y"?1:2;
 poseEulerDeg[j*3+a]=deg;
 syncPoseSlidersFromJoint();
 applyPoseToRest(currentRestLow,true,true);
 info("#rigDebugInfo",`Einzelgelenk-Test: ${PUBLIC_JOINT_NAMES[j]||j} · Achse ${axis} · ${deg>=0?'+':''}${deg}°. Wenn das sichtbar viel stärker oder um eine unerwartete Achse wirkt, steckt der Restfehler weiterhin in der Pose-Interpretation und nicht nur im fehlenden Twist-Rig.`)
}

function mat3Mul(a,ao,b,bo,out,oo){
 for(let r=0;r<3;r++)for(let c=0;c<3;c++){
  out[oo+r*3+c]=a[ao+r*3]*b[bo+c]+a[ao+r*3+1]*b[bo+3+c]+a[ao+r*3+2]*b[bo+6+c]
 }
}
function mat3Transpose(a,ao,out,oo){
 out[oo]=a[ao];out[oo+1]=a[ao+3];out[oo+2]=a[ao+6];
 out[oo+3]=a[ao+1];out[oo+4]=a[ao+4];out[oo+5]=a[ao+7];
 out[oo+6]=a[ao+2];out[oo+7]=a[ao+5];out[oo+8]=a[ao+8]
}
function mat3Identity(out,oo){
 out[oo]=1;out[oo+1]=0;out[oo+2]=0;
 out[oo+3]=0;out[oo+4]=1;out[oo+5]=0;
 out[oo+6]=0;out[oo+7]=0;out[oo+8]=1
}
function makeEuler3(rx,ry,rz,out,oo){
 const cx=Math.cos(rx),sx=Math.sin(rx),cy=Math.cos(ry),sy=Math.sin(ry),cz=Math.cos(rz),sz=Math.sin(rz);
 out[oo]=cz*cy;
 out[oo+1]=cz*sy*sx-sz*cx;
 out[oo+2]=cz*sy*cx+sz*sx;
 out[oo+3]=sz*cy;
 out[oo+4]=sz*sy*sx+cz*cx;
 out[oo+5]=sz*sy*cx-cz*sx;
 out[oo+6]=-sy;
 out[oo+7]=cy*sx;
 out[oo+8]=cy*cx
}
function rot3FromMat4(m,mo,out,oo){
 out[oo]=m[mo];out[oo+1]=m[mo+1];out[oo+2]=m[mo+2];
 out[oo+3]=m[mo+4];out[oo+4]=m[mo+5];out[oo+5]=m[mo+6];
 out[oo+6]=m[mo+8];out[oo+7]=m[mo+9];out[oo+8]=m[mo+10]
}
function writeLocalMat4(rotation3,ro,baseLocal,bo,out,oo){
 out[oo]=rotation3[ro];out[oo+1]=rotation3[ro+1];out[oo+2]=rotation3[ro+2];out[oo+3]=baseLocal[bo+3];
 out[oo+4]=rotation3[ro+3];out[oo+5]=rotation3[ro+4];out[oo+6]=rotation3[ro+5];out[oo+7]=baseLocal[bo+7];
 out[oo+8]=rotation3[ro+6];out[oo+9]=rotation3[ro+7];out[oo+10]=rotation3[ro+8];out[oo+11]=baseLocal[bo+11];
 out[oo+12]=0;out[oo+13]=0;out[oo+14]=0;out[oo+15]=1
}
function buildJointOrientData(){
 poseOrient3=new Float32Array(poseJointCount*9);
 poseOrientParentT3=new Float32Array(poseJointCount*9);
 for(let j=0;j<poseJointCount;j++)rot3FromMat4(poseTWorld,j*16,poseOrient3,j*9);
 for(let j=0;j<poseJointCount;j++){
  const p=poseParents[j];
  mat3Transpose(poseOrient3,p*9,poseOrientParentT3,j*9)
 }
}
function relativeToFinalLocal(relative3,outLocal4){
 const tmp=new Float32Array(9),finalR=new Float32Array(9);
 for(let j=0;j<poseJointCount;j++){
  mat3Mul(poseOrientParentT3,j*9,relative3,j*9,tmp,0);
  mat3Mul(tmp,0,poseOrient3,j*9,finalR,0);
  writeLocalMat4(finalR,0,poseLocalActive||poseLocalBase,j*16,outLocal4,j*16)
 }
}

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
function resetActiveRigMatrices(){
 poseLocalActive=poseLocalBase.slice();
 poseBindWorldActive=poseBindWorld.slice();
 poseInvBindActive=poseInvBind.slice()
}
function copyRotationAndBottom(src,so,dst,doff){
 dst[doff]=src[so];dst[doff+1]=src[so+1];dst[doff+2]=src[so+2];
 dst[doff+4]=src[so+4];dst[doff+5]=src[so+5];dst[doff+6]=src[so+6];
 dst[doff+8]=src[so+8];dst[doff+9]=src[so+9];dst[doff+10]=src[so+10];
 dst[doff+12]=0;dst[doff+13]=0;dst[doff+14]=0;dst[doff+15]=1
}
function worldToLocalWithFixedRotations(world){
 const local=new Float32Array(world.length);
 for(let j=0;j<poseJointCount;j++)copyRotationAndBottom(poseLocalBase,j*16,local,j*16);
 local[3]=world[3];local[7]=world[7];local[11]=world[11];
 for(let j=1;j<poseJointCount;j++){
  const p=poseParents[j],po=p*16,jo=j*16;
  const dx=world[jo+3]-world[po+3],dy=world[jo+7]-world[po+7],dz=world[jo+11]-world[po+11];
  local[jo+3]=world[po]*dx+world[po+4]*dy+world[po+8]*dz;
  local[jo+7]=world[po+1]*dx+world[po+5]*dy+world[po+9]*dz;
  local[jo+11]=world[po+2]*dx+world[po+6]*dy+world[po+10]*dz
 }
 return local
}
function updateAdaptiveRigUI(msg,state="warn"){
 if($("#adaptiveRigState"))setState("#adaptiveRigState",state==="ok"?"AKTIV":state==="bad"?"FEHLER":"AUS",state);
 if($("#adaptiveRigInfo"))info("#adaptiveRigInfo",msg)
}
function recomputeAdaptiveRig(){
 if(!poseReady)return null;
 if(!rigAdaptiveEnabled||!bindShapeLow){
  resetActiveRigMatrices();
  updateAdaptiveRigUI(bindShapeLow
   ?"Shape-adaptives Rig ist aus. Dann bleibt das Template-Skelett unverändert, auch wenn sich der Körper morpht."
   :"Kein bind_shape im Asset gefunden – ohne diesen Referenzkörper kann das Rig noch nicht mit dem Mannequin mitmorphen.",bindShapeLow?"warn":"bad");
  return {enabled:false}
 }
 const n=currentRestLow.length/3,bindSum=new Float32Array(poseJointCount*3),curSum=new Float32Array(poseJointCount*3),wSum=new Float32Array(poseJointCount);
 const gamma=1.75;
 for(let v=0;v<n;v++){
  const bx=bindShapeLow[v*3],by=bindShapeLow[v*3+1],bz=bindShapeLow[v*3+2];
  const cx=currentRestLow[v*3],cy=currentRestLow[v*3+1],cz=currentRestLow[v*3+2];
  for(let k=0;k<poseTopK;k++){
   const j=poseBoneIndices[v*poseTopK+k],w=poseBoneWeights[v*poseTopK+k];
   if(j<0||w<=0)continue;
   const ww=Math.pow(w,gamma),jo=j*3;
   wSum[j]+=ww;
   bindSum[jo]+=bx*ww;bindSum[jo+1]+=by*ww;bindSum[jo+2]+=bz*ww;
   curSum[jo]+=cx*ww;curSum[jo+1]+=cy*ww;curSum[jo+2]+=cz*ww
  }
 }
 const world=poseBindWorld.slice();
 let maxShift=0,avgShift=0,count=0;
 for(let j=1;j<poseJointCount;j++){
  const ws=wSum[j];
  if(ws<1e-9)continue;
  const jo=j*3,mo=j*16;
  const dx=curSum[jo]/ws-bindSum[jo]/ws,dy=curSum[jo+1]/ws-bindSum[jo+1]/ws,dz=curSum[jo+2]/ws-bindSum[jo+2]/ws;
  world[mo+3]+=dx;world[mo+7]+=dy;world[mo+11]+=dz;
  const dist=Math.hypot(dx,dy,dz);maxShift=Math.max(maxShift,dist);avgShift+=dist;count++
 }
 poseBindWorldActive=world;
 poseLocalActive=worldToLocalWithFixedRotations(world);
 poseInvBindActive=new Float32Array(poseJointCount*16);
 for(let j=0;j<poseJointCount;j++)rigidInverse(poseBindWorldActive,j*16,poseInvBindActive,j*16);
 const meanShift=count?avgShift/count:0;
 updateAdaptiveRigUI(`✓ Shape-adaptives Rig aktiv
Das Template-Skelett wird jetzt aus bind_shape → aktuellem Shape mit den vorhandenen Skinweights näherungsweise mitgezogen.
Mittlere Joint-Verschiebung: ${(meanShift*1000).toFixed(1)} mm · Max: ${(maxShift*1000).toFixed(1)} mm · Joints mit Daten: ${count}/${poseJointCount-1}
WICHTIG: Das ist noch eine v0.1-Übergangslösung. Der echte v0.2-/122-Joint-Rig-Pack + späteres shape-adaptives Rebinding bleibt der nächste größere Schritt.`,`ok`);
 return {enabled:true,meanShift,maxShift,count}
}
function setAdaptiveRigEnabled(enabled,refreshPose=true){
 rigAdaptiveEnabled=!!enabled;
 const stats=recomputeAdaptiveRig();
 const btn=$("#toggleAdaptiveRig");
 if(btn)btn.textContent=rigAdaptiveEnabled?"Adaptive Rig AUS":"Adaptive Rig AN";
 if(poseReady&&refreshPose)applyPoseToRest(currentRestLow,false,false);
 return stats
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
   stopPoseAnimation(false);
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
 stopPoseAnimation(false);
 poseEulerDeg.fill(0);syncPoseSlidersFromJoint();applyPoseToRest(currentRestLow,true)
}
function setJointEuler(name,x=0,y=0,z=0){
 const j=jointIndex(name);if(j<0||j>=poseJointCount)return;
 poseEulerDeg[j*3]=x;poseEulerDeg[j*3+1]=y;poseEulerDeg[j*3+2]=z
}
function setFingerCurl(side,amount){
 const prefix=side+"Hand";
 const fingers=["Index","Middle","Ring","Pinky"];
 for(const f of fingers){
  setJointEuler(prefix+f+"1",0,0,amount*.65);
  setJointEuler(prefix+f+"2",0,0,amount*.9);
  setJointEuler(prefix+f+"3",0,0,amount);
  setJointEuler(prefix+f+"4",0,0,amount*.65)
 }
 setJointEuler(prefix+"Thumb1",0,amount*.28,amount*.32);
 setJointEuler(prefix+"Thumb2",0,amount*.18,amount*.48);
 setJointEuler(prefix+"Thumb3",0,0,amount*.42)
}
function posePreset(kind){
 if(!poseEulerDeg)return;
 stopPoseAnimation(false);
 poseEulerDeg.fill(0);

 if(kind==="tpose"){
  // In SOMA's public pose convention, all-zero relative rotations are the canonical T-pose.
 }else if(kind==="overhead"){
  setJointEuler("LeftArm",0,0,94);
  setJointEuler("RightArm",0,0,-94);
  setJointEuler("LeftForeArm",0,0,8);
  setJointEuler("RightForeArm",0,0,-8);
  setJointEuler("Chest",-5,0,0);
 }else if(kind==="squat"){
  setJointEuler("Hips",10,0,0);
  setJointEuler("Spine1",-9,0,0);
  setJointEuler("Spine2",-7,0,0);
  setJointEuler("LeftLeg",38,0,5);
  setJointEuler("RightLeg",38,0,-5);
  setJointEuler("LeftShin",-67,0,0);
  setJointEuler("RightShin",-67,0,0);
  setJointEuler("LeftFoot",28,0,0);
  setJointEuler("RightFoot",28,0,0);
  setJointEuler("LeftArm",24,0,24);
  setJointEuler("RightArm",24,0,-24);
  setJointEuler("LeftForeArm",8,0,18);
  setJointEuler("RightForeArm",8,0,-18);
 }else if(kind==="run"){
  setJointEuler("LeftLeg",38,0,8);
  setJointEuler("LeftShin",-52,0,0);
  setJointEuler("LeftFoot",20,0,0);
  setJointEuler("RightLeg",-29,0,-5);
  setJointEuler("RightShin",-14,0,0);
  setJointEuler("LeftArm",-28,0,18);
  setJointEuler("LeftForeArm",12,0,42);
  setJointEuler("RightArm",31,0,-18);
  setJointEuler("RightForeArm",12,0,-42);
  setJointEuler("Spine1",0,9,0);
  setJointEuler("Spine2",0,8,0);
  setJointEuler("Chest",0,6,0);
  setJointEuler("Head",0,-8,0);
 }else if(kind==="action"){
  setJointEuler("LeftArm",-12,0,102);
  setJointEuler("LeftForeArm",0,12,18);
  setJointEuler("RightArm",28,0,-24);
  setJointEuler("RightForeArm",0,-18,-48);
  setJointEuler("LeftLeg",18,0,8);
  setJointEuler("LeftShin",-38,0,0);
  setJointEuler("RightLeg",-12,0,-8);
  setJointEuler("Spine1",-4,12,0);
  setJointEuler("Spine2",-3,15,0);
  setJointEuler("Chest",0,12,0);
  setJointEuler("Neck1",0,-8,0);
  setJointEuler("Head",0,-10,0);
  setFingerCurl("Right",35);
 }else if(kind==="grip"){
  setJointEuler("LeftArm",18,0,32);
  setJointEuler("RightArm",18,0,-32);
  setJointEuler("LeftForeArm",0,0,48);
  setJointEuler("RightForeArm",0,0,-48);
  setJointEuler("LeftHand",0,8,0);
  setJointEuler("RightHand",0,-8,0);
  setFingerCurl("Left",58);
  setFingerCurl("Right",58)
 }

 syncPoseSlidersFromJoint();applyPoseToRest(currentRestLow,true)
}

function setWalkAnimationPose(seconds){
 poseEulerDeg.fill(0);
 const p=seconds*Math.PI*2*.82;
 const s=Math.sin(p),c=Math.cos(p),s2=Math.sin(p*2);

 setJointEuler("LeftLeg",31*s,0,4*c);
 setJointEuler("RightLeg",-31*s,0,-4*c);
 setJointEuler("LeftShin",-8-34*Math.max(0,-s),0,0);
 setJointEuler("RightShin",-8-34*Math.max(0,s),0,0);
 setJointEuler("LeftFoot",8+12*Math.max(0,-s),0,0);
 setJointEuler("RightFoot",8+12*Math.max(0,s),0,0);

 setJointEuler("LeftArm",-25*s,0,12);
 setJointEuler("RightArm",25*s,0,-12);
 setJointEuler("LeftForeArm",8+10*Math.max(0,s),0,20);
 setJointEuler("RightForeArm",8+10*Math.max(0,-s),0,-20);

 setJointEuler("Spine1",0,3.5*s2,0);
 setJointEuler("Spine2",0,4.5*s2,0);
 setJointEuler("Chest",0,3*s2,0);
 setJointEuler("Head",0,-3.5*s2,0)
}

function setRigStressAnimationPose(seconds){
 poseEulerDeg.fill(0);
 const p=seconds*Math.PI*2*.34;
 const a=(Math.sin(p)+1)*.5;
 const b=Math.sin(p*.73+1.2);
 const c=Math.sin(p*1.31-.4);

 setJointEuler("LeftArm",-8+14*c,0,18+88*a);
 setJointEuler("RightArm",-8-14*c,0,-18-88*a);
 setJointEuler("LeftForeArm",0,12*b,12+45*(1-a));
 setJointEuler("RightForeArm",0,-12*b,-12-45*(1-a));

 setJointEuler("LeftLeg",26*b,0,8*c);
 setJointEuler("RightLeg",-26*b,0,-8*c);
 setJointEuler("LeftShin",-12-42*Math.max(0,-b),0,0);
 setJointEuler("RightShin",-12-42*Math.max(0,b),0,0);
 setJointEuler("LeftFoot",10+12*Math.max(0,-b),0,0);
 setJointEuler("RightFoot",10+12*Math.max(0,b),0,0);

 setJointEuler("Spine1",-6*Math.sin(p*.5),10*c,0);
 setJointEuler("Spine2",-5*Math.sin(p*.5+.4),14*c,0);
 setJointEuler("Chest",0,10*c,5*b);
 setJointEuler("Neck1",0,-7*c,0);
 setJointEuler("Head",4*b,-10*c,0);

 const curl=12+48*a;
 setFingerCurl("Left",curl);
 setFingerCurl("Right",curl)
}


function publicMotionMapping(rawJoints){
 if(rawJoints===78)return Int32Array.from({length:78},(_,i)=>i);
 if(rawJoints===94){
  const map=new Int32Array(78);
  for(let i=0;i<78;i++){
   const idx=RAW94_JOINT_NAMES.indexOf(PUBLIC_JOINT_NAMES[i]);
   if(idx<0)throw new Error(`Motion-Mapping fehlt für ${PUBLIC_JOINT_NAMES[i]}`);
   map[i]=idx
  }
  return map
 }
 throw new Error(`NVIDIA-Motion hat ${rawJoints} Joints; erwartet 78 oder 94.`)
}
function convertOfficialMotionToRelative(npy){
 const sh=npy.shape;
 if(sh.length!==4||sh[2]!==4||sh[3]!==4)throw new Error(`Unerwartete Motion-Shape ${JSON.stringify(sh)}; erwartet [Frames,Joints,4,4].`);
 const T=sh[0],rawJ=sh[1],map=publicMotionMapping(rawJ);
 const out=new Float32Array(T*poseJointCount*9);
 const rawLocal=new Float32Array(poseJointCount*9);
 const rawWorld=new Float32Array(poseJointCount*9);
 const correctedWorld=new Float32Array(poseJointCount*9);
 const correction=new Float32Array(9),tmp=new Float32Array(9),parentT=new Float32Array(9);

 for(let f=0;f<T;f++){
  const frameBase=f*rawJ*16;
  for(let j=0;j<poseJointCount;j++){
   const ro=frameBase+map[j]*16,oo=j*9;
   rawLocal[oo]=Number(npy.data[ro]);rawLocal[oo+1]=Number(npy.data[ro+1]);rawLocal[oo+2]=Number(npy.data[ro+2]);
   rawLocal[oo+3]=Number(npy.data[ro+4]);rawLocal[oo+4]=Number(npy.data[ro+5]);rawLocal[oo+5]=Number(npy.data[ro+6]);
   rawLocal[oo+6]=Number(npy.data[ro+8]);rawLocal[oo+7]=Number(npy.data[ro+9]);rawLocal[oo+8]=Number(npy.data[ro+10])
  }

  rawWorld.set(rawLocal.subarray(0,9),0);
  for(let j=1;j<poseJointCount;j++)mat3Mul(rawWorld,poseParents[j]*9,rawLocal,j*9,rawWorld,j*9);

  // Exact correction used by NVIDIA's demo:
  // world_rot = FK(motion_local); world_rot = world_rot @ transpose(t_pose_world_rot)
  for(let j=0;j<poseJointCount;j++){
   mat3Transpose(poseOrient3,j*9,correction,0);
   mat3Mul(rawWorld,j*9,correction,0,correctedWorld,j*9)
  }

  // Convert world rotations back to local rotations.
  const dst=f*poseJointCount*9;
  mat3Identity(out,dst); // Root is padded as identity by SOMALayer.
  for(let j=1;j<poseJointCount;j++){
   mat3Transpose(correctedWorld,poseParents[j]*9,parentT,0);
   mat3Mul(parentT,0,correctedWorld,j*9,out,dst+j*9)
  }
 }
 return {data:out,frames:T,rawJ}
}
async function loadOfficialAnimation(){
 try{
  if(!poseReady)throw new Error("Zuerst LBS initialisieren.");
  setState("#officialAnimState","LÄDT","warn");
  await requestPersistentStorage();
  const a=await fetchAssetBytes(ASSET_KEY.anim,ANIM,{
   fallbackSize:5601024,
   onProgress:(got,total,cacheHit)=>{
    info("#animPerf",cacheHit
     ?`✓ NVIDIA-Beispielanimation aus persistentem Cache · ${(got/1048576).toFixed(1)} MB`
     :`NVIDIA-Beispielanimation ${(got/1048576).toFixed(1)} / ${total?(total/1048576).toFixed(1):"?"} MB · wird persistent gespeichert`)
   }
  });
  const npy=parseNPY(a.u8);
  const conv=convertOfficialMotionToRelative(npy);
  officialAnimRel=conv.data;officialAnimFrames=conv.frames;officialAnimLoaded=true;
  setState("#officialAnimState","BEREIT","ok");
  info("#animPerf",`✓ Offizielle NVIDIA example_animation.npy geladen
Frames: ${officialAnimFrames} · Roh-Joints: ${conv.rawJ} → Public-Joints: ${poseJointCount}
Quelle: ${a.cacheHit?"persistenter iPhone-Cache":"geladen + persistent gespeichert"}
Die Rotationskonvertierung entspricht jetzt dem offiziellen SOMA-Demo-Pfad.`);
  return true
 }catch(e){
  console.error(e);setState("#officialAnimState","FEHLER","bad");info("#animPerf",`${e?.name||"Fehler"}: ${e?.message||String(e)}`);return false
 }
}

function startPoseAnimation(mode){
 if(!poseReady||!poseEulerDeg)return;
 if(mode==="official"&&!officialAnimLoaded)return;
 poseAnimMode=mode;
 poseAnimRunning=true;
 poseAnimStart=performance.now();
 poseAnimLastStep=0;
 poseAnimFrames=0;poseAnimLbsSum=0;poseAnimLbsMax=0;poseAnimLastUi=0;
 const label=mode==="official"?"NVIDIA LÄUFT":mode==="walk"?"GANG LÄUFT":"STRESS LÄUFT";
 setState("#animState",label,"ok");
 setState("#poseState","POSE-KONVENTION ANIMIERT","ok");
 $("#animOfficial").classList.toggle("activeAnim",mode==="official");
 $("#animWalk").classList.toggle("activeAnim",mode==="walk");
 $("#animStress").classList.toggle("activeAnim",mode==="stress");
 info("#animPerf","Animation startet … 30 LBS-Updates/s Zielrate.")
}
function stopPoseAnimation(resetPose=false){
 poseAnimRunning=false;
 $("#animOfficial")?.classList.remove("activeAnim");
 $("#animWalk")?.classList.remove("activeAnim");
 $("#animStress")?.classList.remove("activeAnim");
 if($("#animState"))setState("#animState","STOP","warn");
 if(resetPose&&poseEulerDeg){
  poseEulerDeg.fill(0);syncPoseSlidersFromJoint();applyPoseToRest(currentRestLow,true)
 }
}
function updatePoseAnimation(now){
 if(!poseAnimRunning||!poseReady||!poseEulerDeg)return;
 const frameMs=1000/poseAnimTargetFps;
 if(poseAnimLastStep&&now-poseAnimLastStep<frameMs)return;
 poseAnimLastStep=now;

 const seconds=(now-poseAnimStart)/1000*poseAnimSpeed;
 let r;
 if(poseAnimMode==="official"){
  const f=Math.floor(seconds*officialAnimFps)%officialAnimFrames;
  const off=f*poseJointCount*9;
  r=applyRelativePoseMatrices(currentRestLow,officialAnimRel.subarray(off,off+poseJointCount*9),false,false,"NVIDIA-Motion")
 }else{
  if(poseAnimMode==="stress")setRigStressAnimationPose(seconds);
  else setWalkAnimationPose(seconds);
  r=applyPoseToRest(currentRestLow,false,false)
 }
 if(!r)return;
 posePass=true;
 poseAnimFrames++;
 poseAnimLbsSum+=r.ms;
 poseAnimLbsMax=Math.max(poseAnimLbsMax,r.ms);

 if(now-poseAnimLastUi>500){
  poseAnimLastUi=now;
  const avg=poseAnimFrames?poseAnimLbsSum/poseAnimFrames:0;
  const animLabel=poseAnimMode==="official"?"NVIDIA example_animation":poseAnimMode==="walk"?"Gang-Loop":"Rig-Stress";
  info("#animPerf",`${animLabel} · ${poseAnimSpeed.toFixed(2)}×
LBS Ø ${avg.toFixed(1)} ms · Max ${poseAnimLbsMax.toFixed(1)} ms · ${currentRestLow.length/3} Vertices · ${poseJointCount} Joints
Ziel: ${poseAnimTargetFps} Pose-Updates/s · WebGL-Render-FPS oben rechts.`);
  syncPoseSlidersFromJoint();
  updateDecision()
 }
}

function skinLocalMatrices(rest,local,markMoved=true,report=true,label="Browser-LBS"){
 if(!poseReady||!geometry)return;
 const t0=performance.now(),J=poseJointCount;
 const world=new Float32Array(J*16),bone=new Float32Array(J*16);

 world.set(local.subarray(0,16),0);
 for(let j=1;j<J;j++){
  const p=poseParents[j];
  if(p<0||p>=j)throw new Error(`Ungültiger Parent ${p} für Joint ${j}`);
  mat4Mul(world,p*16,local,j*16,world,j*16)
 }
 for(let j=0;j<J;j++)mat4Mul(world,j*16,(poseInvBindActive||poseInvBind),j*16,bone,j*16);

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
 currentPoseWorld=world.slice();
 refreshRigDebug();

 const elapsed=performance.now()-t0;
 if(markMoved){
  posePass=true;setState("#poseState","POSE-KONVENTION AKTIV","ok");updateDecision()
 }
 if(report)info("#posePerf",`${label}: ${elapsed.toFixed(1)} ms · ${n} Vertices · ${J} Joints · max. Gewichtssummenfehler ${maxWeightErr.toExponential(1)}
Rotationen laufen durch SOMAs T-Pose/Joint-Orient-Konvention.
Adaptive Rig-Translationen: ${rigAdaptiveEnabled?"AKTIV":"AUS"} · vollständiges shape-adaptives Rebinding bleibt weiterhin noch offen.`);
 return {ms:elapsed,maxWeightErr,world}
}
function applyRelativePoseMatrices(rest,relative3,markMoved=true,report=true,label="SOMA-relative LBS"){
 const local=new Float32Array(poseJointCount*16);
 relativeToFinalLocal(relative3,local);
 return skinLocalMatrices(rest,local,markMoved,report,label)
}
function buildRelativeEulerMatrices(){
 const rel=new Float32Array(poseJointCount*9);
 for(let j=0;j<poseJointCount;j++){
  makeEuler3(
   (poseEulerDeg[j*3]||0)*Math.PI/180,
   (poseEulerDeg[j*3+1]||0)*Math.PI/180,
   (poseEulerDeg[j*3+2]||0)*Math.PI/180,
   rel,j*9
  )
 }
 // SOMALayer pads a virtual Root identity.
 mat3Identity(rel,0);
 return rel
}
function applyPoseToRest(rest,markMoved=true,report=true){
 return applyRelativePoseMatrices(rest,buildRelativeEulerMatrices(),markMoved,report,"SOMA-relative LBS")
}
function bindLbsError(){
 const rest=currentRestLow,pos=geometry.attributes.position.array;
 skinLocalMatrices(rest,poseLocalActive||poseLocalBase,false,false,"Bind-LBS");
 let max=0,rms=0;
 for(let i=0;i<rest.length;i++){const d=pos[i]-rest[i];max=Math.max(max,Math.abs(d));rms+=d*d}
 return {max,rms:Math.sqrt(rms/rest.length)}
}
function jointOrientZeroPoseError(){
 const rel=new Float32Array(poseJointCount*9);
 for(let j=0;j<poseJointCount;j++)mat3Identity(rel,j*9);
 const local=new Float32Array(poseJointCount*16);
 relativeToFinalLocal(rel,local);
 const world=new Float32Array(poseJointCount*16);
 world.set(local.subarray(0,16),0);
 for(let j=1;j<poseJointCount;j++)mat4Mul(world,poseParents[j]*16,local,j*16,world,j*16);
 let max=0;
 for(let j=0;j<poseJointCount;j++){
  const o=j*16,t=j*16;
  const idx=[0,1,2,4,5,6,8,9,10];
  for(const q of idx)max=Math.max(max,Math.abs(world[o+q]-poseTWorld[t+q]))
 }
 return max
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
  poseTWorld=copyRigMatricesToMeters(arrays.t_pose_world);
  if(poseLocalBase.length!==poseJointCount*16||poseBindWorld.length!==poseJointCount*16||poseTWorld.length!==poseJointCount*16)throw new Error("Rig-Matrixform passt nicht zum Joint-Count");
  buildJointOrientData();

  poseInvBind=new Float32Array(poseJointCount*16);
  for(let j=0;j<poseJointCount;j++)rigidInverse(poseBindWorld,j*16,poseInvBind,j*16);
  resetActiveRigMatrices();

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
  if(bindShapeLow) setAdaptiveRigEnabled(true,false);
  else updateAdaptiveRigUI("bind_shape fehlt – deshalb kann das Skelett aktuell noch nicht mit dem gemorphten Mannequin mitwandern.","bad");

  const bindErr=bindLbsError();
  const orientErr=jointOrientZeroPoseError();

  // Visual reset now uses SOMA's real all-zero relative pose (= canonical T-pose convention).
  poseEulerDeg.fill(0);applyPoseToRest(currentRestLow,false,false);

  setState("#poseState","KONVENTION BEREIT","ok");
  info("#poseInfo",`✓ RIG + SOMA-POSE-KONVENTION INITIALISIERT
Quelle: bereits gecachtes offizielles SOMA v0.1 Shape/Rig-NPZ
Public Joints: ${poseJointCount} inkl. Root · 77 steuerbare Pose-Joints
Skinweights: ${w.fullV} × ${w.J} → Low-LOD ${w.n} Vertices · Top-${poseTopK}
Einflüsse/Vertex: ${w.minInflu}–${w.maxInflu}
Bindpose-FK Maxfehler: ${fkErr.toExponential(2)}
Bind-LBS Maxfehler: ${(bindErr.max*1000).toFixed(3)} mm · RMS ${(bindErr.rms*1000).toFixed(3)} mm
Joint-Orient/T-Pose Rotationsfehler: ${orientErr.toExponential(2)}

FIX v0.1.6: Die Pose-Rotationen werden nicht mehr als "Bind-Achse × Euler" angewendet.
Sie laufen jetzt wie im SOMA-Runtime-Pfad über T-Pose/Joint-Orient:
parentOrientᵀ × relativeRotation × jointOrient.

Der Button „T-Pose“ ist jetzt deshalb wirklich die SOMA-All-Zero-Pose. Für den stärksten Gegencheck kannst du zusätzlich NVIDIAs echte example_animation.npy laden und abspielen.

NEU v0.1.8: Das bereits vorhandene v0.1-Rig kann jetzt näherungsweise mit dem aktuellen Shape mitwandern.
Dafür werden die eingebetteten bind_shape-Daten + vorhandene Skinweights benutzt, um die Joint-Positionen beim Morphen neu anzunähern.

WICHTIG: Das ist noch kein vollständiges shape-adaptives Rebinding und ersetzt den späteren v0.2-122-Joint/Twist-Rig-Pack nicht.`);
  info("#posePerf","SOMA-Nullpose aktiv. Teste jetzt zuerst mit AKTIVEM Adaptive-Rig: T-Pose, dann Arme hoch, dann Rig-Debug +10°/+20°/+30° und danach die offizielle NVIDIA-Animation.")
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
$("#poseT").onclick=()=>posePreset("tpose");
$("#poseOverhead").onclick=()=>posePreset("overhead");
$("#poseSquat").onclick=()=>posePreset("squat");
$("#poseRun").onclick=()=>posePreset("run");
$("#poseAction").onclick=()=>posePreset("action");
$("#poseGrip").onclick=()=>posePreset("grip");
$("#animOfficial").onclick=async()=>{if(!officialAnimLoaded){const ok=await loadOfficialAnimation();if(!ok)return}startPoseAnimation("official")};
$("#animWalk").onclick=()=>startPoseAnimation("walk");
$("#animStress").onclick=()=>startPoseAnimation("stress");
$("#animStop").onclick=()=>stopPoseAnimation(false);
$("#animSpeed").oninput=e=>{
 poseAnimSpeed=Number(e.target.value);
 $("#animSpeedOut").value=poseAnimSpeed.toFixed(2)+"×"
};
$("#toggleAdaptiveRig").onclick=()=>setAdaptiveRigEnabled(!rigAdaptiveEnabled,true);
$("#rebindAdaptiveRig").onclick=()=>{if(poseReady){recomputeAdaptiveRig();applyPoseToRest(currentRestLow,false,false)}};
$("#toggleRig").onclick=toggleRigDebug;
$("#toggleAxes").onclick=toggleRigAxes;
$("#debug10").onclick=()=>applySingleJointDebug(10);
$("#debug20").onclick=()=>applySingleJointDebug(20);
$("#debug30").onclick=()=>applySingleJointDebug(30);
$("#debugMinus10").onclick=()=>applySingleJointDebug(-10);

function updateDecision(){
 if(shapePass&&rigPass&&posePass){
  setState("#decision","LBS + POSE-KONVENTION AKTIV","ok");
  info("#decisionInfo","Shape, PCA, echter browserseitiger LBS-Lauf, SOMAs T-Pose/Joint-Orient-Rotationskonvention und jetzt auch ein experimentell mitmorphendes v0.1-Rig sind aktiv. Dieser Test benutzt weiterhin den offiziellen eingebetteten 78-Joint-Rig des SOMA-v0.1-Assets. Noch NICHT als endgültige BODY-LAB-Basis bewiesen sind: der aktualisierte v0.2-122-Joint/Procedural-Twist-Rig-Pack, vollständiges shape-adaptives Rebinding und danach Shape+Pose unter diesen finalen Rig-Daten. v0.1.8 schließt davor die wichtigste Lücke: Das Skelett kann jetzt dem gemorphten Mannequin näherungsweise folgen. BODY LAB bleibt unverändert.")
 }else if(shapePass&&rigPass){
  setState("#decision","NÄCHSTER TEST: ECHTES LBS","warn");
  info("#decisionInfo","Shape und aktueller v0.2-Rig-Vertrag sind bewiesen. Punkt 5 kann jetzt den bereits im gecachten v0.1-SOMA-Asset eingebetteten echten 78-Joint-Rig mit Bindpose + Skinweights direkt im Browser testen – ohne 329-MB-Download.")
 }else if(shapePass){
  setState("#decision","SHAPE BESTANDEN","ok")
 }
}
