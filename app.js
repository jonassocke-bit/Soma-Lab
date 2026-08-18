
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
const CURRENT_RIG_PACK_URL="./soma_current_rig_pack_v0026.npz";
const CURRENT_RIG_PACK_RAW_URL="https://raw.githubusercontent.com/jonassocke-bit/Soma-Lab/main/soma_current_rig_pack_v0026.npz";
const CURRENT_RIG_PACK_SOURCE_SHA="86632764684281dc98f31ab9c4aac36a4cdbc428";

// v0.5.12: exact browser-side Anny blendshape engine on canonical SOMA topology.
// Low is loaded first; Mid (18,056 verts) is an optional persistent on-demand pack.
const ANNY_SOURCE_SHA="72104cac8242d1735ec06433b65bec5e26953ce7";
const ANNY_LOW_PACK_URL="./anny_soma_engine_low_v060.npz";
const ANNY_LOW_PACK_RAW_URL="https://raw.githubusercontent.com/jonassocke-bit/Soma-Lab/main/anny_soma_engine_low_v060.npz";
const ANNY_MID_PACK_URL="./anny_soma_engine_mid_v060.npz";
const ANNY_MID_PACK_RAW_URL="https://raw.githubusercontent.com/jonassocke-bit/Soma-Lab/main/anny_soma_engine_mid_v060.npz";

// Browser-side binary FBX writer. Loaded only when the user actually exports
// the Mixamo bridge so normal Sammy startup has no extra dependency/cost.
const MIXAMO_FBX_EXPORTER_URL="https://esm.sh/@comfyorg/fbx-exporter-three@1.0.1?external=three";
let mixamoFbxExporterPromise=null;
let mixamoFbxLoaderPromise=null;
async function getMixamoFbxLoaderClass(){
 if(!mixamoFbxLoaderPromise){
  mixamoFbxLoaderPromise=import("three/addons/loaders/FBXLoader.js").then(m=>m.FBXLoader).catch(e=>{mixamoFbxLoaderPromise=null;throw e})
 }
 return mixamoFbxLoaderPromise
}

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
 anim:"SOMA-X/f424385d/example_animation.npy",
 currentRig:"SOMA-X/8663276/browser-current-rig-pack-v0026-low-mid-v2",
 annyLow:"Anny/72104cac/soma-exact-engine-low-v2",
 annyMid:"Anny/72104cac/soma-exact-engine-mid-v2"
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
let trianglesLow=null,trianglesMid=null,displayLOD="low";
let coeff=new Float32Array(128), mesh=null, geometry=null, baseLow=null, dirsLow=null, currentRestLow=null,currentRestMid=null, bindShapeLow=null;
let shapePass=false, rigPass=false, posePass=false;

// Identity engine is deliberately separate from rigging.
// Existing SOMA-PCA stays available as an A/B reference; Anny can replace only restVertices.
let shapeEngine="soma-pca";
let annyLowPack=null,annyMidPack=null,annyPackLoaded=false,annyMidLoaded=false,annyMeta=null,annyLastMs=0;
let annyGroundOffsetY=0;
let autoBootRunning=false,autoBootDone=false;
let annyParams={gender:0,age:2/3,muscle:.5,weight:.5,height:.5,proportions:.5,cupsize:.5,firmness:.5,african:.5,asian:.5,caucasian:.5};
let annyLocalValues={};

// Browser-LBS state. The currently cached Hugging-Face SOMA_neutral.npz is the
// original public SOMA v0.1 asset, whose official runtime stored the 78-joint
// rig, bind transforms and sparse skinning weights in this same NPZ.
let poseReady=false, poseParents=null, poseLocalBase=null, poseBindWorld=null, poseInvBind=null, poseTWorld=null;
let poseLocalActive=null,poseBindWorldActive=null,poseInvBindActive=null,rigAdaptiveEnabled=false;
let poseOrient3=null,poseOrientParentT3=null,poseBoneIndices=null,poseBoneWeights=null,poseEulerDeg=null,poseJointCount=0,poseTopK=8,lastAppliedRelative3=null;
let officialAnimRel=null,officialAnimFrames=0,officialAnimFps=30,officialAnimLoaded=false;

// Generic imported SOMA animation.
let userAnimRel=null,userAnimFrames=0,userAnimFps=30,userAnimLoaded=false,userAnimName="",userAnimSource="";
let mixamoReferencePose=null,mixamoReferenceName="";

let poseAnimRunning=false,poseAnimMode="walk",poseAnimStart=0,poseAnimLastStep=0,poseAnimSpeed=1;
let poseAnimTargetFps=30,poseAnimFrames=0,poseAnimLbsSum=0,poseAnimLbsMax=0,poseAnimLastUi=0;

let currentPoseWorld=null,currentTargetPoseWorld=null,rigDebugVisible=false,rigAxesVisible=false,rigDebugUseExpanded=true,rigDebugJointCount=0;
let currentRigPack=null,currentRigPackLoaded=false,currentRigMode="legacy-embedded";
let currentRigRbf=null,currentProcedural=null;
let targetJointCount=0,targetParents=null,targetTLocal=null,targetBindWorldTemplate=null,targetBindWorldActive=null,targetInvBindActive=null,targetLocalTranslations=null;
let targetBoneIndices=null,targetBoneWeights=null,targetTopK=0;
let targetMidBoneIndices=null,targetMidBoneWeights=null,targetMidTopK=0;
let poseMidBoneIndices=null,poseMidBoneWeights=null,poseMidTopK=0;
let rigGroup=null,rigBoneLines=null,rigJointPoints=null,rigAxesX=null,rigAxesY=null,rigAxesZ=null;

// v0.5.12 Shape-Space Analyzer.
// The first semantic layer is deliberately measurement-driven: raw PCA stays the
// engine underneath, while the UI exposes locally calibrated measurements in cm.
const ANALYSIS_METRICS=[
 {key:"height",label:"Körperhöhe",short:"Höhe",range:8},
 {key:"shoulder",label:"Schultergelenk-Breite",short:"Schulter",range:5},
 {key:"chestCirc",label:"Brustumfang · Slice-Proxy",short:"Brust",range:12},
 {key:"waistCirc",label:"Taillenumfang · Slice-Proxy",short:"Taille",range:12},
 {key:"hipCirc",label:"Hüftumfang · Slice-Proxy",short:"Hüfte",range:12},
 {key:"chestDepth",label:"Brusttiefe · Slice-Proxy",short:"Brusttiefe",range:6},
 {key:"hipDepth",label:"Hüfttiefe · Slice-Proxy",short:"Hüfttiefe",range:6}
];
let shapeAnalysis={
 running:false,ready:false,stale:false,internal:false,cancelToken:0,pcCount:0,
 baseCoeff:null,baseRest:null,baseMetrics:null,jacobian:null,targets:null,
 lastMetrics:null,scanDelta:.35,semanticToken:0,debounce:null
};
let measureOverlayVisible=true,measurementGroup=null;

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
   const mt=descr.match(/([US])(\d+)$/),kind=mt[1],width=Number(mt[2]),items=count,strings=[];
   if(kind==="S"){
    const bytesPer=width;
    if(dataOff+items*bytesPer>u8.byteLength)throw new Error("NPY String-Payload abgeschnitten");
    for(let i=0;i<items;i++){
     const part=u8.subarray(dataOff+i*bytesPer,dataOff+(i+1)*bytesPer);
     strings.push(new TextDecoder("utf-8").decode(part).replace(/\0.*$/s,""))
    }
   }else{
    const bytesPer=width*4;
    if(dataOff+items*bytesPer>u8.byteLength)throw new Error("NPY Unicode-Payload abgeschnitten");
    const sdv=new DataView(u8.buffer,u8.byteOffset+dataOff,items*bytesPer),little=!descr.startsWith(">");
    for(let i=0;i<items;i++){
     let s="";
     for(let c=0;c<width;c++){
      const cp=sdv.getUint32(i*bytesPer+c*4,little);
      if(cp)s+=String.fromCodePoint(cp)
     }
     strings.push(s)
    }
   }
   return {shape,descr,fortran,data:strings}
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
function decodeUtf8Array(a){
 if(!a?.data)return "";
 const u8=a.data instanceof Uint8Array?a.data:new Uint8Array(Array.from(a.data,Number));
 return new TextDecoder("utf-8").decode(u8)
}
function packArray(name){return currentRigPack?.[name]||null}
function packOptional(name){return currentRigPack?.[name]||null}
function hierarchyStats(parents){
 let roots=0,forwardRefs=0,selfRoots=0,invalid=0;
 for(let j=0;j<parents.length;j++){
  const p=Number(parents[j]);
  if(p<0||p>=parents.length){invalid++;continue}
  if(p===j){roots++;selfRoots++;continue}
  if(p>j)forwardRefs++
 }
 return {roots,selfRoots,forwardRefs,invalid}
}
function fkLocalToWorldAnyOrder(local,parents,label="Rig"){
 const J=parents.length;
 if(local.length!==J*16)throw new Error(`${label}: Local-Matrizen ${local.length/16} passen nicht zu ${J} Joints`);
 const world=new Float32Array(J*16),state=new Uint8Array(J);
 const build=j=>{
  if(state[j]===2)return;
  if(state[j]===1)throw new Error(`${label}: Zyklus in Joint-Hierarchie bei Joint ${j}`);
  state[j]=1;
  const p=Number(parents[j]);
  if(p<0||p>=J)throw new Error(`${label}: ungültiger Parent ${p} bei Joint ${j}`);
  if(p===j){world.set(local.subarray(j*16,j*16+16),j*16)}
  else{
   build(p);
   mat4Mul(world,p*16,local,j*16,world,j*16)
  }
  state[j]=2
 };
 for(let j=0;j<J;j++)build(j);
 return world
}

async function fetchCurrentRigPackRobust({forceNetwork=false,onProgress=null}={}){
 if(!forceNetwork){
  try{
   const cached=await assetCacheGet(ASSET_KEY.currentRig);
   if(cached?.buffer){
    const u8=new Uint8Array(cached.buffer);
    if(onProgress)onProgress(u8.byteLength,u8.byteLength,true,"persistenter iPhone-Cache");
    return {u8,cacheHit:true,size:u8.byteLength,source:"persistenter iPhone-Cache"}
   }
  }catch(e){
   console.warn("Current-Rig Cache lesen fehlgeschlagen:",e)
  }
 }

 const stamp=CURRENT_RIG_PACK_SOURCE_SHA.slice(0,12);
 const pageUrl=new URL(CURRENT_RIG_PACK_URL,document.baseURI);
 pageUrl.searchParams.set("rig",stamp);
 const candidates=[
  {label:"GitHub Pages",url:pageUrl.href},
  {label:"GitHub Raw-Fallback",url:CURRENT_RIG_PACK_RAW_URL+"?rig="+encodeURIComponent(stamp)}
 ];
 const errors=[];

 for(const c of candidates){
  try{
   if(onProgress)onProgress(0,0,false,c.label+" …");
   const r=await fetch(c.url,{mode:"cors",cache:"no-store"});
   if(!r.ok)throw new Error("HTTP "+r.status);
   const ab=await r.arrayBuffer();
   const u8=new Uint8Array(ab);
   if(u8.byteLength<100000)throw new Error("Antwort unerwartet klein: "+u8.byteLength+" Bytes");
   if(onProgress)onProgress(u8.byteLength,u8.byteLength,false,c.label);
   try{
    await assetCachePut(ASSET_KEY.currentRig,CURRENT_RIG_PACK_URL,u8,r.headers.get("content-type")||"application/octet-stream")
   }catch(e){
    console.warn("Current-Rig Pack konnte nicht persistent gecacht werden:",e)
   }
   return {u8,cacheHit:false,size:u8.byteLength,source:c.label}
  }catch(e){
   errors.push(c.label+": "+(e?.message||String(e)));
   console.warn("Current-Rig Quelle fehlgeschlagen:",c.label,e)
  }
 }
 throw new Error("Rig-Pack konnte weder über GitHub Pages noch über GitHub Raw geladen werden. "+errors.join(" · "))
}

async function loadCurrentRigPack(){
 try{
  setState("#currentRigState","LÄDT","warn");
  await requestPersistentStorage();
  let asset=await fetchCurrentRigPackRobust({
   onProgress:(got,total,cacheHit,source)=>{
    info("#currentRigInfo",cacheHit
     ?`✓ Current Rig-Pack aus persistentem iPhone-Cache · ${(got/1048576).toFixed(2)} MB`
     :`${source||"Current Rig-Pack"}${got?` · ${(got/1048576).toFixed(2)} MB`:""}${total&&got!==total?` / ${(total/1048576).toFixed(2)} MB`:""}`
    )
   }
  });
  try{
   currentRigPack=await decodeShapeNPZ(asset.u8)
  }catch(firstError){
   if(!asset.cacheHit)throw firstError;
   console.warn("Current-Rig Cache ist ungültig; lösche nur diesen Cacheeintrag und lade neu:",firstError);
   await assetCacheDelete(ASSET_KEY.currentRig);
   info("#currentRigInfo","Lokaler Rig-Pack-Cache war ungültig · GitHub Pages/Raw wird einmalig neu versucht …");
   asset=await fetchCurrentRigPackRobust({forceNetwork:true,onProgress:(got,total,cacheHit,source)=>{
    info("#currentRigInfo",`${source||"Current Rig-Pack"}${got?` · ${(got/1048576).toFixed(2)} MB`:""}`)
   }});
   currentRigPack=await decodeShapeNPZ(asset.u8)
  }
  // v0.5.12: the fresh v2 rig-pack stores REAL newlines, while the very first
  // generated v1 pack accidentally stored the two literal characters "\\n".
  // Use the already existing compatibility decoder for both formats.
  const targetNames=decodePackedJointNames("target_joint_names_utf8",122);
  const publicNames=decodePackedJointNames("public_joint_names_utf8",78);
  const targetShape=Array.from(packArray("target_skinning_shape")?.data||[],Number);
  const publicShape=Array.from(packArray("public_skinning_shape")?.data||[],Number);
  const rbfShape=Array.from(packArray("public_rbf_shape")?.data||[],Number);
  const sourceSha=decodeUtf8Array(packArray("source_git_sha"));
  const targetParentsProbe=Int32Array.from(Array.from(packArray("target_joint_parent_ids")?.data||[],Number));
  const targetHierarchyProbe=hierarchyStats(targetParentsProbe);
  const required=[
   "target_joint_parent_ids","target_bind_pose_world","target_bind_pose_local","target_t_pose_world","target_t_pose_local","target_bind_shape_low",
   "target_skinning_data","target_skinning_indices","target_skinning_indptr","target_skinning_shape",
   "public_joint_parent_ids","public_bind_pose_world","public_bind_pose_local","public_t_pose_world","public_t_pose_local","public_bind_shape_low",
   "public_skinning_data","public_skinning_indices","public_skinning_indptr","public_skinning_shape",
   "public_rbf_crow_indices","public_rbf_col_indices","public_rbf_values","public_rbf_shape","procedural_json_utf8"
  ];
  const missing=required.filter(k=>!packArray(k));
  if(missing.length)throw new Error("Rig-Pack unvollständig. Fehlt: "+missing.join(", "));
  const midRequired=["target_skinning_mid_data","target_skinning_mid_indices","target_skinning_mid_indptr","target_skinning_mid_shape","public_skinning_mid_data","public_skinning_mid_indices","public_skinning_mid_indptr","public_skinning_mid_shape"];
  const midMissing=midRequired.filter(k=>!packArray(k));
  if(midMissing.length){if(asset.cacheHit)await assetCacheDelete(ASSET_KEY.currentRig);throw new Error("Rig-Pack ist noch v1/Low-only. Für v0.5.12 bitte den neuen ‘Build Anny SOMA Engine v2’-Workflow einmal ausführen; danach erneut laden.")}
  if(targetNames.length<100)throw new Error(`Expanded Rig unerwartet klein: ${targetNames.length} Joints`);
  if(publicNames.length!==78)throw new Error(`Public Rig: ${publicNames.length} statt 78 Joints`);
  if(publicShape[0]!==4505||publicShape[1]!==78)throw new Error(`Public Low-Skinning unerwartet: ${JSON.stringify(publicShape)}`);
  if(targetShape[0]!==4505||targetShape[1]!==targetNames.length)throw new Error(`Target Low-Skinning unerwartet: ${JSON.stringify(targetShape)}`);
  if(rbfShape[0]!==78||rbfShape[1]!==4505)throw new Error(`RBF-Matrix unerwartet: ${JSON.stringify(rbfShape)}`);
  targetMidBoneIndices=null;targetMidBoneWeights=null;targetMidTopK=0;poseMidBoneIndices=null;poseMidBoneWeights=null;poseMidTopK=0;
  currentRigPackLoaded=true;
  $("#activateCurrentRig").disabled=false;
  $("#activateExpandedRig").disabled=false;
  setState("#currentRigState","PACK OK","ok");
  info("#currentRigInfo",`✓ CURRENT RIG-PACK IM IPHONE-BROWSER GEPRÜFT
Quelle: NVlabs/SOMA-X ${sourceSha.slice(0,12)||"?"}
Expanded Target-Rig: ${targetNames.length} Joints
Public SOMA-Rig: ${publicNames.length} Joints inkl. Root
Low-LOD Skinning: ${targetShape[0]} Vertices × ${targetShape[1]} Target-Joints
Public RBF Skeleton-Fit: ${rbfShape[0]} × ${rbfShape[1]} · ${packArray("public_rbf_values").data.length} Nichtnull-Gewichte
Target-Hierarchie: ${targetHierarchyProbe.forwardRefs} Parent-Vorwärtsverweise · ${targetHierarchyProbe.invalid} ungültige Parents
Mid-Skinning 18.056×122: ${packOptional("target_skinning_mid_shape")?"JA · bereit":"NEIN · alter Rig-Pack"}
Procedural-Sidecar: ${packArray("procedural_json_utf8").data.length} Bytes
Asset-Quelle: ${asset.cacheHit?"persistenter Cache · kein Download":`${asset.source||"Repo"} · persistent gespeichert`}

Der aktuelle v0.2.x-Rig-Datenstand ist als kleiner Browser-Pack vorhanden. v0.5.12 kann daraus jetzt direkt den internen Expanded-/Twist-Pfad mit ${targetNames.length} Skinning-Joints aktivieren; die Bedienung bleibt bei den 77 öffentlichen Pose-Joints.`);
  rigPass=true;updateDecision();return true
 }catch(e){
  console.error(e);currentRigPackLoaded=false;$("#activateCurrentRig").disabled=true;$("#activateExpandedRig").disabled=true;
  setState("#currentRigState","PACK FEHLT","bad");
  info("#currentRigInfo",`${e?.name||"Fehler"}: ${e?.message||String(e)}

v0.5.12 versucht den Rig-Pack in dieser Reihenfolge:
1) persistenter iPhone-Cache
2) GitHub Pages mit Cache-Busting
3) raw.githubusercontent.com als Fallback

Für Mid ist einmalig der neue Engine-v2-Workflow nötig, weil er den bisherigen Low-only-Rig-Pack um echte 18.056×122 Skinweights erweitert.`);return false
 }
}
function copyPackMatricesToMeters(arr){
 const J=arr.shape?.[0]||Math.floor(arr.data.length/16),out=new Float32Array(J*16);
 for(let j=0;j<J;j++){
  const o=j*16;for(let q=0;q<16;q++)out[o+q]=Number(arr.data[o+q]);
  out[o+3]/=100;out[o+7]/=100;out[o+11]/=100
 }
 return out
}

function rowMajorMat4ToThree(data,o=0){
 return new THREE.Matrix4().set(
  Number(data[o]),Number(data[o+1]),Number(data[o+2]),Number(data[o+3]),
  Number(data[o+4]),Number(data[o+5]),Number(data[o+6]),Number(data[o+7]),
  Number(data[o+8]),Number(data[o+9]),Number(data[o+10]),Number(data[o+11]),
  Number(data[o+12]),Number(data[o+13]),Number(data[o+14]),Number(data[o+15])
 )
}
function downloadBinaryFile(bytes,filename,type="application/octet-stream"){
 const blob=new Blob([bytes],{type}),url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download=filename;a.style.display="none";document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),15000)
}
async function getMixamoFbxExporter(){
 if(!mixamoFbxExporterPromise){
  mixamoFbxExporterPromise=import(MIXAMO_FBX_EXPORTER_URL).catch(e=>{
   mixamoFbxExporterPromise=null;throw e
  })
 }
 return mixamoFbxExporterPromise
}

// v0.5.12: exact structural/orientation contract extracted from the uploaded
// standard Mixamo X Bot FBX. No X Bot mesh/animation is bundled.
// The body stays canonical SOMA; only the 65-bone hierarchy, names and bind-axis
// orientations mirror Mixamo's own standard character.
const MIXAMO_XBOT_CONTRACT=[{"name":"mixamorig:Hips","parent":null,"source":"Hips","r":[1.0,-5.01e-07,6e-09,5.01e-07,0.999916579,-0.012916455,0.0,0.012916455,0.999916579]},{"name":"mixamorig:Spine","parent":"mixamorig:Hips","source":"Spine1","r":[1.0,-1e-09,-3.4e-08,6e-09,0.989131765,0.147031807,3.3e-08,-0.147031807,0.989131765]},{"name":"mixamorig:Spine1","parent":"mixamorig:Spine","source":"Spine2","r":[1.0,-1e-09,-3.4e-08,6e-09,0.989131765,0.147031807,3.3e-08,-0.147031807,0.989131765]},{"name":"mixamorig:Spine2","parent":"mixamorig:Spine1","source":"Chest","r":[1.0,7.2e-08,-3.6e-08,-6.7e-08,0.992592173,0.121493946,4.4e-08,-0.121493946,0.992592173]},{"name":"mixamorig:Neck","parent":"mixamorig:Spine2","source":"Neck1","r":[1.0,7.2e-08,-3.6e-08,-6.7e-08,0.992592173,0.121493946,4.4e-08,-0.121493946,0.992592173]},{"name":"mixamorig:Head","parent":"mixamorig:Neck","source":"Head","r":[1.0,7.2e-08,-3.6e-08,-6.7e-08,0.992592173,0.121493946,4.4e-08,-0.121493946,0.992592173]},{"name":"mixamorig:HeadTop_End","parent":"mixamorig:Head","source":"HeadEnd","r":[1.0,7.2e-08,-3.6e-08,-6.7e-08,0.992592173,0.121493946,4.4e-08,-0.121493946,0.992592173]},{"name":"mixamorig:RightShoulder","parent":"mixamorig:Spine2","source":"RightShoulder","r":[-0.20569543,-0.97736421,0.049483232,-0.010190959,-0.04842246,-0.998774955,0.978562995,-0.205947725,-0.0]},{"name":"mixamorig:RightArm","parent":"mixamorig:RightShoulder","source":"RightArm","r":[-1.46e-07,-1.0,-7.9e-08,-7e-09,7.9e-08,-1.0,1.0,-1.46e-07,-7e-09]},{"name":"mixamorig:RightForeArm","parent":"mixamorig:RightArm","source":"RightForeArm","r":[-1.46e-07,-1.0,-7.9e-08,-7e-09,7.9e-08,-1.0,1.0,-1.46e-07,-7e-09]},{"name":"mixamorig:RightHand","parent":"mixamorig:RightForeArm","source":"RightHand","r":[-1.46e-07,-1.0,-7.9e-08,-7e-09,7.9e-08,-1.0,1.0,-1.46e-07,-7e-09]},{"name":"mixamorig:RightHandThumb1","parent":"mixamorig:RightHand","source":"RightHandThumb1","r":[0.396939136,-0.767534191,0.503319569,0.231208372,-0.447071892,-0.864100348,0.888246594,0.459366944,-0.0]},{"name":"mixamorig:RightHandThumb2","parent":"mixamorig:RightHandThumb1","source":"RightHandThumb2","r":[0.383746069,-0.77711582,0.498828585,0.220864615,-0.447268129,-0.866700665,0.896636926,0.442766556,-0.0]},{"name":"mixamorig:RightHandThumb3","parent":"mixamorig:RightHandThumb2","source":"RightHandThumb3","r":[0.373746489,-0.784013147,0.495617743,0.213271961,-0.447383525,-0.86854076,0.902678588,0.430315427,0.0]},{"name":"mixamorig:RightHandThumb4","parent":"mixamorig:RightHandThumb3","source":"RightHandThumbEnd","r":[0.553773862,-0.733248364,0.394564755,0.048262834,-0.444794598,-0.894331295,0.83126723,0.514300108,-0.210926978]},{"name":"mixamorig:RightHandIndex1","parent":"mixamorig:RightHand","source":"RightHandIndex1","r":[0.000328389,-0.999999946,-1.29e-06,-7e-09,1.29e-06,-1.0,0.999999946,0.000328389,-7e-09]},{"name":"mixamorig:RightHandIndex2","parent":"mixamorig:RightHandIndex1","source":"RightHandIndex2","r":[-0.000182899,-0.999999983,-1.29e-06,-7e-09,1.29e-06,-1.0,0.999999983,-0.000182899,-7e-09]},{"name":"mixamorig:RightHandIndex3","parent":"mixamorig:RightHandIndex2","source":"RightHandIndex3","r":[-7.055e-06,-1.0,-1.29e-06,-7e-09,1.29e-06,-1.0,1.0,-7.055e-06,-7e-09]},{"name":"mixamorig:RightHandIndex4","parent":"mixamorig:RightHandIndex3","source":"RightHandIndex4","r":[-0.000181169,-0.999999984,-1.306e-06,0.002005376,9.43e-07,-0.999997989,0.999997973,-0.000181172,0.002005376]},{"name":"mixamorig:RightHandMiddle1","parent":"mixamorig:RightHand","source":"RightHandMiddle1","r":[0.001003466,-0.999999497,-2.035e-06,-7e-09,2.035e-06,-1.0,0.999999497,0.001003466,-5e-09]},{"name":"mixamorig:RightHandMiddle2","parent":"mixamorig:RightHandMiddle1","source":"RightHandMiddle2","r":[-0.000696277,-0.999999758,-2.035e-06,-4e-09,2.035e-06,-1.0,0.999999758,-0.000696277,-5e-09]},{"name":"mixamorig:RightHandMiddle3","parent":"mixamorig:RightHandMiddle2","source":"RightHandMiddle3","r":[-5.2593e-05,-0.999999999,-2.035e-06,-5e-09,2.035e-06,-1.0,0.999999999,-5.2593e-05,-5e-09]},{"name":"mixamorig:RightHandMiddle4","parent":"mixamorig:RightHandMiddle3","source":"RightHandMiddle4","r":[-0.000385378,-0.999999926,-2.132e-06,0.001857623,1.416e-06,-0.999998275,0.9999982,-0.000385382,0.001857622]},{"name":"mixamorig:RightHandRing1","parent":"mixamorig:RightHand","source":"RightHandRing1","r":[-0.000311804,-0.999999951,6.1e-08,-7e-09,-6.1e-08,-1.0,0.999999951,-0.000311804,-7e-09]},{"name":"mixamorig:RightHandRing2","parent":"mixamorig:RightHandRing1","source":"RightHandRing2","r":[0.000131226,-0.999999991,6.1e-08,-7e-09,-6.1e-08,-1.0,0.999999991,0.000131226,-7e-09]},{"name":"mixamorig:RightHandRing3","parent":"mixamorig:RightHandRing2","source":"RightHandRing3","r":[0.000356836,-0.999999936,6.1e-08,-7e-09,-6.1e-08,-1.0,0.999999936,0.000356836,-7e-09]},{"name":"mixamorig:RightHandRing4","parent":"mixamorig:RightHandRing3","source":"RightHandRing4","r":[0.001955407,-0.999998088,1.3e-07,0.000292143,4.41e-07,-0.999999957,0.999998046,0.001955407,0.000292143]},{"name":"mixamorig:RightHandPinky1","parent":"mixamorig:RightHand","source":"RightHandPinky1","r":[-0.001040872,-0.999999458,9.263e-06,-7e-09,-9.263e-06,-1.0,0.999999458,-0.001040872,2e-09]},{"name":"mixamorig:RightHandPinky2","parent":"mixamorig:RightHandPinky1","source":"RightHandPinky2","r":[-0.002733332,-0.999996264,9.263e-06,-2.3e-08,-9.263e-06,-1.0,0.999996264,-0.002733332,2e-09]},{"name":"mixamorig:RightHandPinky3","parent":"mixamorig:RightHandPinky2","source":"RightHandPinky3","r":[-0.001739779,-0.999998487,9.263e-06,-1.4e-08,-9.263e-06,-1.0,0.999998487,-0.001739779,2e-09]},{"name":"mixamorig:RightHandPinky4","parent":"mixamorig:RightHandPinky3","source":"RightHandPinky4","r":[-0.001657229,-0.999998627,3.803e-06,0.003138946,-9.005e-06,-0.999995073,0.9999937,-0.001657209,0.003138956]},{"name":"mixamorig:LeftShoulder","parent":"mixamorig:Spine2","source":"LeftShoulder","r":[-0.205706635,0.977362793,-0.049464652,0.010187678,-0.048404163,-0.998775875,-0.978560673,-0.205958754,-0.0]},{"name":"mixamorig:LeftArm","parent":"mixamorig:LeftShoulder","source":"LeftArm","r":[8.24e-07,1.0,-1.169e-06,-0.0,-1.169e-06,-1.0,-1.0,8.24e-07,-0.0]},{"name":"mixamorig:LeftForeArm","parent":"mixamorig:LeftArm","source":"LeftForeArm","r":[8.24e-07,1.0,-1.169e-06,-0.0,-1.169e-06,-1.0,-1.0,8.24e-07,-0.0]},{"name":"mixamorig:LeftHand","parent":"mixamorig:LeftForeArm","source":"LeftHand","r":[8.24e-07,1.0,-1.169e-06,-0.0,-1.169e-06,-1.0,-1.0,8.24e-07,-0.0]},{"name":"mixamorig:LeftHandThumb1","parent":"mixamorig:LeftHand","source":"LeftHandThumb1","r":[0.395629978,0.768504924,-0.502868872,-0.230169579,-0.447100735,-0.864362712,-0.889100042,0.457712917,0.0]},{"name":"mixamorig:LeftHandThumb2","parent":"mixamorig:LeftHandThumb1","source":"LeftHandThumb2","r":[0.383980398,0.776979098,-0.498861237,-0.221018742,-0.447228409,-0.866681871,-0.896498616,0.443046533,-0.0]},{"name":"mixamorig:LeftHandThumb3","parent":"mixamorig:LeftHandThumb2","source":"LeftHandThumb3","r":[0.375246952,0.783113445,-0.495906299,-0.214293485,-0.447215116,-0.868376038,-0.901813743,0.43212495,0.0]},{"name":"mixamorig:LeftHandThumb4","parent":"mixamorig:LeftHandThumb3","source":"LeftHandThumbEnd","r":[0.548762734,0.739697677,-0.389495582,-0.033706567,-0.445959329,-0.894418328,-0.835298347,0.503952006,-0.219793191]},{"name":"mixamorig:LeftHandIndex1","parent":"mixamorig:LeftHand","source":"LeftHandIndex1","r":[-8.7329e-05,0.999999996,-2.502e-06,0.0,-2.502e-06,-1.0,-0.999999996,-8.7329e-05,0.0]},{"name":"mixamorig:LeftHandIndex2","parent":"mixamorig:LeftHandIndex1","source":"LeftHandIndex2","r":[0.000122867,0.999999992,-3.183e-06,-0.0,-3.183e-06,-1.0,-0.999999992,0.000122867,0.0]},{"name":"mixamorig:LeftHandIndex3","parent":"mixamorig:LeftHandIndex2","source":"LeftHandIndex3","r":[-9.631e-06,1.0,-3.853e-06,-0.0,-3.853e-06,-1.0,-1.0,-9.631e-06,0.0]},{"name":"mixamorig:LeftHandIndex4","parent":"mixamorig:LeftHandIndex3","source":"LeftHandIndex4","r":[-3.5773e-05,0.999999999,-3.857e-06,-0.000755126,-3.884e-06,-0.999999715,-0.999999714,-3.577e-05,0.000755127]},{"name":"mixamorig:LeftHandMiddle1","parent":"mixamorig:LeftHand","source":"LeftHandMiddle1","r":[-6.2469e-05,0.999999998,-1.986e-06,0.0,-1.986e-06,-1.0,-0.999999998,-6.2469e-05,0.0]},{"name":"mixamorig:LeftHandMiddle2","parent":"mixamorig:LeftHandMiddle1","source":"LeftHandMiddle2","r":[-2.0077e-05,1.0,-1.659e-06,-0.0,-1.659e-06,-1.0,-1.0,-2.0077e-05,0.0]},{"name":"mixamorig:LeftHandMiddle3","parent":"mixamorig:LeftHandMiddle2","source":"LeftHandMiddle3","r":[2.1302e-05,1.0,-8.03e-07,-0.0,-8.03e-07,-1.0,-1.0,2.1302e-05,0.0]},{"name":"mixamorig:LeftHandMiddle4","parent":"mixamorig:LeftHandMiddle3","source":"LeftHandMiddle4","r":[7.727e-05,0.999999997,-8.51e-07,-0.00204828,-6.93e-07,-0.999997902,-0.999997899,7.7272e-05,0.00204828]},{"name":"mixamorig:LeftHandRing1","parent":"mixamorig:LeftHand","source":"LeftHandRing1","r":[1.345e-05,1.0,-2.419e-06,-0.0,-2.419e-06,-1.0,-1.0,1.345e-05,-0.0]},{"name":"mixamorig:LeftHandRing2","parent":"mixamorig:LeftHandRing1","source":"LeftHandRing2","r":[1.345e-05,1.0,-2.419e-06,-0.0,-2.419e-06,-1.0,-1.0,1.345e-05,-0.0]},{"name":"mixamorig:LeftHandRing3","parent":"mixamorig:LeftHandRing2","source":"LeftHandRing3","r":[1.345e-05,1.0,-2.419e-06,-0.0,-2.419e-06,-1.0,-1.0,1.345e-05,-0.0]},{"name":"mixamorig:LeftHandRing4","parent":"mixamorig:LeftHandRing3","source":"LeftHandRing4","r":[4.5546e-05,0.999999999,-1.843e-06,0.000986874,-1.888e-06,-0.999999513,-0.999999512,4.5545e-05,-0.000986875]},{"name":"mixamorig:LeftHandPinky1","parent":"mixamorig:LeftHand","source":"LeftHandPinky1","r":[0.00409042,0.999991634,8.782e-06,3.6e-08,8.782e-06,-1.0,-0.999991634,0.00409042,-0.0]},{"name":"mixamorig:LeftHandPinky2","parent":"mixamorig:LeftHandPinky1","source":"LeftHandPinky2","r":[0.003669103,0.999993269,7.525e-06,3.2e-08,7.525e-06,-1.0,-0.999993269,0.003669103,-5e-09]},{"name":"mixamorig:LeftHandPinky3","parent":"mixamorig:LeftHandPinky2","source":"LeftHandPinky3","r":[0.00353494,0.999993752,7.314e-06,3.1e-08,7.314e-06,-1.0,-0.999993752,0.00353494,-5e-09]},{"name":"mixamorig:LeftHandPinky4","parent":"mixamorig:LeftHandPinky3","source":"LeftHandPinky4","r":[0.002944179,0.999995666,1.797e-06,-0.00156677,6.41e-06,-0.999998773,-0.999994439,0.002944172,0.001566782]},{"name":"mixamorig:RightUpLeg","parent":"mixamorig:Hips","source":"RightLeg","r":[-1.0,-2.1e-08,7e-09,2.1e-08,-0.999969607,0.007796428,7e-09,0.007796428,0.999969607]},{"name":"mixamorig:RightLeg","parent":"mixamorig:RightUpLeg","source":"RightShin","r":[-1.0,2.1e-08,9e-09,-2.2e-08,-0.997661312,-0.068351349,7e-09,-0.068351349,0.997661312]},{"name":"mixamorig:RightFoot","parent":"mixamorig:RightLeg","source":"RightFoot","r":[-1.0,-2.02e-07,1.02e-07,2.07e-07,-0.631740205,0.775180181,-9.2e-08,0.775180181,0.631740205]},{"name":"mixamorig:RightToeBase","parent":"mixamorig:RightFoot","source":"RightToeBase","r":[-1.0,-3.02e-07,2.81e-07,2.81e-07,-7.2928e-05,0.999999997,-3.02e-07,0.999999997,7.2928e-05]},{"name":"mixamorig:RightToe_End","parent":"mixamorig:RightToeBase","source":"RightToeEnd","r":[-0.999730512,-3.02e-07,-0.02321429,-0.02321429,-7.2928e-05,0.999730509,-1.995e-06,0.999999997,7.2902e-05]},{"name":"mixamorig:LeftUpLeg","parent":"mixamorig:Hips","source":"LeftLeg","r":[-1.0,-4.3e-08,7e-09,4.3e-08,-0.999969428,0.007819397,7e-09,0.007819397,0.999969428]},{"name":"mixamorig:LeftLeg","parent":"mixamorig:LeftUpLeg","source":"LeftShin","r":[-1.0,-0.0,7e-09,-0.0,-0.997659999,-0.068370512,7e-09,-0.068370512,0.997659999]},{"name":"mixamorig:LeftFoot","parent":"mixamorig:LeftLeg","source":"LeftFoot","r":[-1.0,-2.01e-07,1.12e-07,2.14e-07,-0.631740177,0.775180204,-8.6e-08,0.775180204,0.631740177]},{"name":"mixamorig:LeftToeBase","parent":"mixamorig:LeftFoot","source":"LeftToeBase","r":[-1.0,-3.01e-07,2.91e-07,2.91e-07,-7.2932e-05,0.999999997,-3.01e-07,0.999999997,7.2932e-05]},{"name":"mixamorig:LeftToe_End","parent":"mixamorig:LeftToeBase","source":"LeftToeEnd","r":[-0.999718239,-3.01e-07,0.02373695,0.02373695,-7.2932e-05,0.999718236,1.43e-06,0.999999997,7.2918e-05]}];

function mixamoXBotSourceToTargetMap(publicNames){
 const direct=new Map(MIXAMO_XBOT_CONTRACT.map((b,i)=>[b.source,i]));
 const byName=new Map(MIXAMO_XBOT_CONTRACT.map((b,i)=>[b.name,i]));
 const fallback=new Map([
  ["Root",direct.get("Hips")],
  ["Neck2",direct.get("Neck1")],
  ["Jaw",direct.get("Head")],
  ["LeftEye",direct.get("Head")],
  ["RightEye",direct.get("Head")]
 ]);
 for(const side of ["Left","Right"]){
  for(const f of ["Index","Middle","Ring","Pinky"]){
   fallback.set(`${side}Hand${f}End`,direct.get(`${side}Hand${f}4`))
  }
 }
 const out=new Int16Array(publicNames.length);out.fill(-1);
 for(let j=0;j<publicNames.length;j++){
  const n=publicNames[j];
  if(direct.has(n))out[j]=direct.get(n);
  else if(fallback.has(n))out[j]=fallback.get(n)
 }
 const missing=publicNames.filter((n,j)=>out[j]<0);
 if(missing.length)throw new Error("X Bot Skinning-Mapping fehlt: "+missing.join(", "));
 return out
}

function buildMixamoXBotSkinning(vertexCount,publicNames){
 const data=packArray("public_skinning_data")?.data,indices=packArray("public_skinning_indices")?.data,indptr=packArray("public_skinning_indptr")?.data;
 const shape=Array.from(packArray("public_skinning_shape")?.data||[],Number);
 if(!data||!indices||!indptr||shape[0]!==vertexCount||shape[1]!==publicNames.length)throw new Error(`Public-Skinning für X-Bot-Bridge fehlt/unerwartet: ${JSON.stringify(shape)}`);
 const srcToProxy=mixamoXBotSourceToTargetMap(publicNames),temp=Array.from({length:vertexCount},()=>new Map());
 for(let sj=0;sj<publicNames.length;sj++){
  const pj=Number(srcToProxy[sj]);if(pj<0)continue;
  for(let p=Number(indptr[sj]);p<Number(indptr[sj+1]);p++){
   const v=Number(indices[p]),w=Number(data[p]);if(v<0||v>=vertexCount||w<=1e-10)continue;
   temp[v].set(pj,(temp[v].get(pj)||0)+w)
  }
 }
 const si=new Uint16Array(vertexCount*4),sw=new Float32Array(vertexCount*4);
 let empty=0,truncated=0,maxRaw=0;
 for(let v=0;v<vertexCount;v++){
  let list=Array.from(temp[v].entries()).sort((a,b)=>b[1]-a[1]);maxRaw=Math.max(maxRaw,list.length);
  if(list.length>4){truncated++;list=list.slice(0,4)}
  let sum=0;for(const x of list)sum+=x[1];
  if(sum<=1e-12){empty++;si[v*4]=0;sw[v*4]=1;continue}
  for(let k=0;k<list.length;k++){si[v*4+k]=list[k][0];sw[v*4+k]=list[k][1]/sum}
 }
 return {skinIndex:si,skinWeight:sw,maxRaw,truncated,empty,srcToProxy}
}

function xbotWorldMatrix(rotation9,position){
 const r=rotation9,m=new THREE.Matrix4().set(
  r[0],r[1],r[2],position.x,
  r[3],r[4],r[5],position.y,
  r[6],r[7],r[8],position.z,
  0,0,0,1
 );
 return m
}

function posePublicBindShapeToOfficialTPose(bindShape,bindWorld,tPoseWorld,vertexCount){
 const data=packArray("public_skinning_data")?.data,indices=packArray("public_skinning_indices")?.data,indptr=packArray("public_skinning_indptr")?.data;
 const shape=Array.from(packArray("public_skinning_shape")?.data||[],Number);
 if(!data||!indices||!indptr||shape[0]!==vertexCount||shape[1]!==78)throw new Error(`Public-Skinning für T-Pose-Bake fehlt/unerwartet: ${JSON.stringify(shape)}`);
 const src=new Float32Array(bindShape.length),out=new Float32Array(bindShape.length),sumW=new Float32Array(vertexCount);
 for(let v=0;v<vertexCount;v++){
  src[v*3]=Number(bindShape[v*3])/100;src[v*3+1]=Number(bindShape[v*3+1])/100;src[v*3+2]=Number(bindShape[v*3+2])/100
 }
 const p=new THREE.Vector3(),q=new THREE.Vector3();
 for(let j=0;j<78;j++){
  const B=rowMajorMat4ToThree(bindWorld,j*16),T=rowMajorMat4ToThree(tPoseWorld,j*16),M=T.clone().multiply(B.clone().invert());
  for(let k=Number(indptr[j]);k<Number(indptr[j+1]);k++){
   const v=Number(indices[k]),w=Number(data[k]);if(v<0||v>=vertexCount||w<=1e-12)continue;
   p.set(src[v*3],src[v*3+1],src[v*3+2]);q.copy(p).applyMatrix4(M);
   out[v*3]+=q.x*w;out[v*3+1]+=q.y*w;out[v*3+2]+=q.z*w;sumW[v]+=w
  }
 }
 let bad=0;
 for(let v=0;v<vertexCount;v++){
  const s=sumW[v];
  if(s>1e-10){out[v*3]/=s;out[v*3+1]/=s;out[v*3+2]/=s}
  else{bad++;out[v*3]=src[v*3];out[v*3+1]=src[v*3+1];out[v*3+2]=src[v*3+2]}
 }
 if(bad)console.warn(`Mixamo T-Pose bake: ${bad} Vertices ohne Skinweight.`);
 return out
}

function buildSammyMixamoBridgeScene(){
 if(!currentRigPackLoaded||!currentRigPack)throw new Error("Current SOMA Rig-Pack ist noch nicht geladen.");
 if(!trianglesLow?.data)throw new Error("SOMA Low-Topologie ist noch nicht geladen.");

 const publicNames=decodePackedJointNames("public_joint_names_utf8",78),publicByName=new Map(publicNames.map((n,i)=>[n,i]));
 const bindWorld=copyPackMatricesToMeters(packArray("public_bind_pose_world")),tPoseWorld=copyPackMatricesToMeters(packArray("public_t_pose_world")),bindShape=packArray("public_bind_shape_low")?.data;
 if(!bindShape||bindWorld.length!==78*16||tPoseWorld.length!==78*16)throw new Error("Public-78 Bind-/T-Pose-Daten für Bridge unvollständig.");
 const V=bindShape.length/3;if(V!==4505)throw new Error(`Mixamo Bridge erwartet 4.505 Vertices, Pack hat ${V}.`);

 // IMPORTANT: previous bridges exported the neutral bind-shape while Mixamo's
 // animation convention is referenced to a canonical T-pose. That mismatch
 // survived mostly unnoticed in torso/legs but baked a constant offset into
 // shoulders, arms and hands. v0.5.12 bakes the official SOMA T-pose into the
 // mesh BEFORE binding the Mixamo-compatible skeleton.
 const pos=posePublicBindShapeToOfficialTPose(bindShape,bindWorld,tPoseWorld,V);
 let minX=Infinity,maxX=-Infinity,minY=Infinity,minZ=Infinity,maxZ=-Infinity;
 for(let v=0;v<V;v++){
  const x=pos[v*3],y=pos[v*3+1],z=pos[v*3+2];
  minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);minZ=Math.min(minZ,z);maxZ=Math.max(maxZ,z)
 }
 const shift=new THREE.Vector3(-(minX+maxX)/2,-minY,-(minZ+maxZ)/2);
 for(let v=0;v<V;v++){pos[v*3]+=shift.x;pos[v*3+1]+=shift.y;pos[v*3+2]+=shift.z}

 const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.BufferAttribute(pos,3));
 const triData=trianglesLow.data,idx=triData instanceof Uint32Array?triData.slice():new Uint32Array(Array.from(triData,Number));
 g.setIndex(new THREE.BufferAttribute(idx,1));g.computeVertexNormals();

 const skin=buildMixamoXBotSkinning(V,publicNames);
 g.setAttribute("skinIndex",new THREE.Uint16BufferAttribute(skin.skinIndex,4));
 g.setAttribute("skinWeight",new THREE.Float32BufferAttribute(skin.skinWeight,4));

 const mat=new THREE.MeshStandardMaterial({color:0x9a9da5,roughness:.82,metalness:0,side:THREE.DoubleSide});
 const body=new THREE.SkinnedMesh(g,mat);body.name="Sammy_Mixamo_XBotContract_Body";body.frustumCulled=false;

 const bones=MIXAMO_XBOT_CONTRACT.map((spec,i)=>{const bone=new THREE.Bone();bone.name=spec.name;bone.userData={SammyProxyIndex:i,SomaSourceJoint:spec.source};return bone});
 const proxyByName=new Map(MIXAMO_XBOT_CONTRACT.map((b,i)=>[b.name,i]));

 // Use SOMA OFFICIAL T-POSE joint locations plus Mixamo X Bot's exact
 // bind-axis orientations. Geometry and skeleton are therefore bound in the
 // same explicit T-pose instead of mixing neutral bind-shape + T-pose motion.
 const worldMats=MIXAMO_XBOT_CONTRACT.map(spec=>{
  const sj=publicByName.get(spec.source);if(sj==null)throw new Error(`SOMA Source-Joint fehlt: ${spec.source}`);
  const o=sj*16,p=new THREE.Vector3(tPoseWorld[o+3]+shift.x,tPoseWorld[o+7]+shift.y,tPoseWorld[o+11]+shift.z);
  return xbotWorldMatrix(spec.r,p)
 });

 for(let i=0;i<bones.length;i++){
  const spec=MIXAMO_XBOT_CONTRACT[i],wm=worldMats[i],lm=spec.parent==null?wm.clone():worldMats[proxyByName.get(spec.parent)].clone().invert().multiply(wm);
  lm.decompose(bones[i].position,bones[i].quaternion,bones[i].scale);bones[i].updateMatrix()
 }
 for(let i=0;i<bones.length;i++){
  const p=MIXAMO_XBOT_CONTRACT[i].parent;if(p!=null)bones[proxyByName.get(p)].add(bones[i])
 }

 const bridge=new THREE.Group();bridge.name="Sammy_Mixamo_XBotContract65_TPose";bridge.add(bones[0]);bridge.add(body);bridge.updateMatrixWorld(true);
 const skeleton=new THREE.Skeleton(bones);body.bind(skeleton,new THREE.Matrix4());body.normalizeSkinWeights();bridge.updateMatrixWorld(true);
 const exportScene=new THREE.Scene();exportScene.name="Sammy_Mixamo_XBotContract65_TPose_Scene";exportScene.add(bridge);exportScene.updateMatrixWorld(true);
 return {scene:exportScene,body,bones,vertexCount:V,triangleCount:idx.length/3,skin,shift}
}

function disposeBridgeScene(b){
 if(!b)return;b.scene?.traverse?.(o=>{o.geometry?.dispose?.();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose?.());else o.material?.dispose?.()})
}

async function exportSammyMixamoBridge(){
 let bridge=null;
 try{
  setState("#mixamoBridgeState","VORBEREITUNG","warn");info("#mixamoBridgeInfo","X-Bot-konformes 65-Bone-Bridge-Rig wird vorbereitet …");
  if(!shapePass&&!(await loadShape()))throw new Error("SOMA Basis/Topologie konnte nicht geladen werden.");
  if(!currentRigPackLoaded&&!(await loadCurrentRigPack()))throw new Error("Current SOMA Rig-Pack konnte nicht geladen werden.");

  setState("#mixamoBridgeState","BAUT FBX","warn");bridge=buildSammyMixamoBridgeScene();
  const mod=await getMixamoFbxExporter();if(!mod?.FBXExporter)throw new Error("FBXExporter-Modul wurde geladen, exportiert aber keine FBXExporter-Klasse.");
  const bytes=new mod.FBXExporter().parseSync(bridge.scene,{
   axisUp:"Y",axisForward:"-Z",unitScale:100,bakeSpaceTransform:false,includeAnimations:false,customProperties:true,
   creator:"Sammy Mixamo XBotContract65 T-Pose v0.5.12"
  });
  if(!(bytes instanceof Uint8Array)||bytes.byteLength<100000)throw new Error(`FBX-Ausgabe unerwartet klein/ungültig: ${bytes?.byteLength||0} Bytes`);
  const magic=new TextDecoder("latin1").decode(bytes.subarray(0,21));if(!magic.startsWith("Kaydara FBX Binary"))throw new Error("FBX-Datei hat keinen erwarteten Binary-FBX-Header.");

  const filename="Sammy_Mixamo_XBotContract65_TPose.fbx";downloadBinaryFile(bytes,filename,"application/octet-stream");
  setState("#mixamoBridgeState","X-BOT BRIDGE EXPORTIERT","ok");
  info("#mixamoBridgeInfo",`✓ ${filename}
65 Bones – exakt dieselbe Hierarchie und Bone-Namen wie das analysierte Mixamo X Bot.
NEU: Mesh und Skeleton sind vor dem Export in die offizielle SOMA T-Pose gebacken.
Hals: genau 1 Neck + Head + HeadTop_End.
Finger: exakt 4 Bones pro Finger/Daumen wie beim X Bot – keine 3-Segment-Vereinfachung mehr.
Bone-Achsen: X-Bot-Bindorientierungen; Joint-Positionen/Body/Skinning bleiben SOMA.
${bridge.vertexCount} Vertices · ${bridge.triangleCount} Dreiecke · ${(bytes.byteLength/1048576).toFixed(2)} MB

Bitte dieses FBX erneut in Mixamo testen – ideal mit starker Kopf-/Hals- UND Fingerbewegung.`);
  return true
 }catch(e){
  console.error(e);setState("#mixamoBridgeState","EXPORT FEHLER","bad");info("#mixamoBridgeInfo",`${e?.name||"Fehler"}: ${e?.message||String(e)}`);return false
 }finally{disposeBridgeScene(bridge)}
}

function buildDirectLowSkinningFromPack(prefix,jointCount){
 const shape=Array.from(packArray(prefix+"_skinning_shape").data,Number),n=shape[0],J=shape[1];
 if(n!==currentRestLow.length/3||J!==jointCount)throw new Error(`${prefix} Skinning ${n}×${J} passt nicht zu ${currentRestLow.length/3}×${jointCount}`);
 const temp=Array.from({length:n},()=>[]);
 const data=packArray(prefix+"_skinning_data").data,indices=packArray(prefix+"_skinning_indices").data,indptr=packArray(prefix+"_skinning_indptr").data;
 for(let j=0;j<J;j++)for(let p=Number(indptr[j]);p<Number(indptr[j+1]);p++){
  const v=Number(indices[p]),w=Number(data[p]);if(v>=0&&v<n&&w>1e-12)temp[v].push([j,w])
 }
 poseBoneIndices=new Int16Array(n*poseTopK);poseBoneIndices.fill(-1);poseBoneWeights=new Float32Array(n*poseTopK);
 let empty=0,minInflu=99,maxInflu=0;
 for(let v=0;v<n;v++){
  const list=temp[v].sort((a,b)=>b[1]-a[1]).slice(0,poseTopK);minInflu=Math.min(minInflu,list.length);maxInflu=Math.max(maxInflu,list.length);
  let sum=0;for(const x of list)sum+=x[1];if(sum<=0){empty++;continue}
  for(let k=0;k<list.length;k++){poseBoneIndices[v*poseTopK+k]=list[k][0];poseBoneWeights[v*poseTopK+k]=list[k][1]/sum}
 }
 if(empty)throw new Error(`${empty} Low-LOD-Vertices ohne Skinweights`);
 return {fullV:n,J,n,minInflu,maxInflu}
}
function buildTargetLowSkinningFromPack(){
 const shape=Array.from(packArray("target_skinning_shape").data,Number),n=shape[0],J=shape[1];
 if(n!==currentRestLow.length/3||J!==targetJointCount)throw new Error(`Target-Skinning ${n}×${J} passt nicht zu ${currentRestLow.length/3}×${targetJointCount}`);
 const temp=Array.from({length:n},()=>[]);
 const data=packArray("target_skinning_data").data,indices=packArray("target_skinning_indices").data,indptr=packArray("target_skinning_indptr").data;
 for(let j=0;j<J;j++)for(let p=Number(indptr[j]);p<Number(indptr[j+1]);p++){
  const v=Number(indices[p]),w=Number(data[p]);if(v>=0&&v<n&&w>1e-12)temp[v].push([j,w])
 }
 let rawMax=0,minInflu=999;for(const list of temp){rawMax=Math.max(rawMax,list.length);minInflu=Math.min(minInflu,list.length)}
 targetTopK=Math.max(1,Math.min(24,rawMax));
 targetBoneIndices=new Int16Array(n*targetTopK);targetBoneIndices.fill(-1);targetBoneWeights=new Float32Array(n*targetTopK);
 let empty=0,maxInflu=0,truncated=0;
 for(let v=0;v<n;v++){
  const all=temp[v].sort((a,b)=>b[1]-a[1]);if(all.length>targetTopK)truncated++;
  const list=all.slice(0,targetTopK);maxInflu=Math.max(maxInflu,list.length);
  let sum=0;for(const x of list)sum+=x[1];if(sum<=0){empty++;continue}
  for(let k=0;k<list.length;k++){targetBoneIndices[v*targetTopK+k]=list[k][0];targetBoneWeights[v*targetTopK+k]=list[k][1]/sum}
 }
 if(empty)throw new Error(`${empty} Low-LOD-Vertices ohne Target-Skinweights`);
 return {n,J,minInflu,maxInflu,rawMax,truncated,topK:targetTopK}
}
function buildSparseSkinningArrays(prefix,expectedN,expectedJ,maxK=24){
 const shape=Array.from(packArray(prefix+"_shape").data,Number),n=shape[0],J=shape[1];if(n!==expectedN||J!==expectedJ)throw new Error(`${prefix} ${n}×${J} statt ${expectedN}×${expectedJ}`);
 const temp=Array.from({length:n},()=>[]),data=packArray(prefix+"_data").data,indices=packArray(prefix+"_indices").data,indptr=packArray(prefix+"_indptr").data;
 for(let j=0;j<J;j++)for(let p=Number(indptr[j]);p<Number(indptr[j+1]);p++){const v=Number(indices[p]),w=Number(data[p]);if(v>=0&&v<n&&w>1e-12)temp[v].push([j,w])}
 let rawMax=0;for(const l of temp)rawMax=Math.max(rawMax,l.length);const topK=Math.max(1,Math.min(maxK,rawMax)),bi=new Int16Array(n*topK),bw=new Float32Array(n*topK);bi.fill(-1);let empty=0;
 for(let v=0;v<n;v++){const list=temp[v].sort((a,b)=>b[1]-a[1]).slice(0,topK);let sum=0;for(const x of list)sum+=x[1];if(sum<=0){empty++;continue}for(let k=0;k<list.length;k++){bi[v*topK+k]=list[k][0];bw[v*topK+k]=list[k][1]/sum}}
 if(empty)throw new Error(`${prefix}: ${empty} Vertices ohne Skinweights`);return {indices:bi,weights:bw,topK,n,J,rawMax}
}
function ensureTargetMidSkinning(){if(targetMidBoneIndices)return true;if(!packOptional("target_skinning_mid_shape"))return false;const r=buildSparseSkinningArrays("target_skinning_mid",18056,targetJointCount,24);targetMidBoneIndices=r.indices;targetMidBoneWeights=r.weights;targetMidTopK=r.topK;return true}
function ensurePublicMidSkinning(){if(poseMidBoneIndices)return true;if(!packOptional("public_skinning_mid_shape"))return false;const r=buildSparseSkinningArrays("public_skinning_mid",18056,poseJointCount,12);poseMidBoneIndices=r.indices;poseMidBoneWeights=r.weights;poseMidTopK=r.topK;return true}
function v3Norm(v){const n=Math.hypot(v[0],v[1],v[2])||1;return [v[0]/n,v[1]/n,v[2]/n]}
function v3Dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]}
function v3Cross(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]}
function v3ProjectPlane(v,n){const d=v3Dot(v,n),p=[v[0]-d*n[0],v[1]-d*n[1],v[2]-d*n[2]],len=Math.hypot(...p);return {v:len>1e-12?[p[0]/len,p[1]/len,p[2]/len]:[0,0,0],len}}
function quatNorm(q){const n=Math.hypot(q[0],q[1],q[2],q[3])||1;return [q[0]/n,q[1]/n,q[2]/n,q[3]/n]}
function quatConj(q){return [-q[0],-q[1],-q[2],q[3]]}
function quatMul(a,b){return [
 a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1],
 a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],
 a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3],
 a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]
]}
function quatFromMat3(m,o=0){
 const m00=m[o],m01=m[o+1],m02=m[o+2],m10=m[o+3],m11=m[o+4],m12=m[o+5],m20=m[o+6],m21=m[o+7],m22=m[o+8];
 let x,y,z,w,s;const tr=m00+m11+m22;
 if(tr>0){s=Math.sqrt(tr+1)*2;w=.25*s;x=(m21-m12)/s;y=(m02-m20)/s;z=(m10-m01)/s}
 else if(m00>m11&&m00>m22){s=Math.sqrt(1+m00-m11-m22)*2;w=(m21-m12)/s;x=.25*s;y=(m01+m10)/s;z=(m02+m20)/s}
 else if(m11>m22){s=Math.sqrt(1+m11-m00-m22)*2;w=(m02-m20)/s;x=(m01+m10)/s;y=.25*s;z=(m12+m21)/s}
 else{s=Math.sqrt(1+m22-m00-m11)*2;w=(m10-m01)/s;x=(m02+m20)/s;y=(m12+m21)/s;z=.25*s}
 let q=quatNorm([x,y,z,w]);if(q[3]<0)q=q.map(v=>-v);return q
}
function quatFromMat4(m,o){return quatFromMat3([m[o],m[o+1],m[o+2],m[o+4],m[o+5],m[o+6],m[o+8],m[o+9],m[o+10]])}
function quatTwistAngle(q,axis=0){
 let n=quatNorm(q);if(n[3]<0)n=n.map(v=>-v);
 const h=quatNorm([n[0],n[1],n[2],n[3]+1]);return 4*Math.atan2(h[axis],h[3])
}
function axisRot3(angle,axis,sign=1){
 const a=angle*sign,c=Math.cos(a),s=Math.sin(a);
 if(axis===0)return new Float32Array([1,0,0,0,c,-s,0,s,c]);
 if(axis===1)return new Float32Array([c,0,s,0,1,0,-s,0,c]);
 return new Float32Array([c,-s,0,s,c,0,0,0,1])
}
function bindAlignQuat(startId,endId){
 const so=startId*16,eo=endId*16;
 const span=v3Norm([poseTWorld[eo+3]-poseTWorld[so+3],poseTWorld[eo+7]-poseTWorld[so+7],poseTWorld[eo+11]-poseTWorld[so+11]]);
 const upX=[poseTWorld[so],poseTWorld[so+4],poseTWorld[so+8]];
 const yCand=[poseTWorld[so+1],poseTWorld[so+5],poseTWorld[so+9]],zCand=[poseTWorld[so+2],poseTWorld[so+6],poseTWorld[so+10]];
 const sgn=v3Dot(upX,span)>=0?1:-1,x=[span[0]*sgn,span[1]*sgn,span[2]*sgn];
 const py=v3ProjectPlane(yCand,x),pz=v3ProjectPlane(zCand,x),pwy=v3ProjectPlane([0,1,0],x),pwz=v3ProjectPlane([0,0,1],x);
 let y=py.len>1e-8?py.v:pz.len>1e-8?pz.v:pwy.len>1e-8?pwy.v:pwz.v;
 let z=v3Norm(v3Cross(x,y));y=v3Norm(v3Cross(z,x));
 return quatFromMat3([x[0],y[0],z[0],x[1],y[1],z[1],x[2],y[2],z[2]])
}

function decodePackedJointNames(key,expectedCount=0){
 const text=decodeUtf8Array(packArray(key));
 // The first generated v0026 pack accidentally stored the separator as the
 // two literal characters "\" + "n" instead of a real newline. Support both
 // formats so the already-cached/on-repo pack remains valid.
 let names=text.includes("\n")
  ? text.split("\n")
  : text.includes("\\n")
   ? text.split("\\n")
   : [text];
 names=names.map(s=>s.trim()).filter(Boolean);
 if(expectedCount&&names.length!==expectedCount){
  throw new Error(`${key}: ${names.length} Joint-Namen dekodiert, erwartet ${expectedCount}. Separator/Pack-Format stimmt nicht.`)
 }
 return names
}

function compileCurrentProcedural(){
 const def=JSON.parse(decodeUtf8Array(packArray("procedural_json_utf8")));
 const targetNames=decodePackedJointNames("target_joint_names_utf8",targetJointCount||122);
 const publicNames=decodePackedJointNames("public_joint_names_utf8",poseJointCount||78);
 const ti=new Map(targetNames.map((n,i)=>[n,i])),pi=new Map(publicNames.map((n,i)=>[n,i]));
 const publicTarget=Int32Array.from(Array.from(packArray("public_target_indices").data,Number));
 const publicByTarget=new Int16Array(targetNames.length);publicByTarget.fill(-1);for(let p=0;p<publicTarget.length;p++)publicByTarget[publicTarget[p]]=p;
 const segments=(def.segments||[]).map(seg=>{
  const axis=seg.source_axis==="y"?1:seg.source_axis==="z"?2:0,start=pi.get(seg.start_joint),end=pi.get(seg.end_joint),parent=seg.parent_joint?pi.get(seg.parent_joint):poseParents[start];
  if(start==null||end==null||parent==null)throw new Error(`Procedural Segment-Mapping fehlt: ${seg.start_joint} → ${seg.end_joint}`);
  const twistTargetIds=seg.twist_joints.map(n=>ti.get(n));
  const missingTwists=seg.twist_joints.filter((n,i)=>twistTargetIds[i]==null);
  if(missingTwists.length)throw new Error(`Procedural Twist-Joints fehlen im Target-Rig: ${missingTwists.join(", ")}`);
  return {...seg,axis,sign:Number(seg.source_sign??1),start,end,parent,twistTargetIds,alignQ:bindAlignQuat(start,end),bindQStart:quatFromMat4(poseTWorld,start*16),bindQEnd:quatFromMat4(poseTWorld,end*16),bindQParent:quatFromMat4(poseTWorld,parent*16)}
 });
 const rotationRows=new Map();for(const e of def.parameter_matrices?.rotation?.entries||[]){const r=ti.get(e.row),c=pi.get(e.column);if(r==null||c==null)continue;if(!rotationRows.has(r))rotationRows.set(r,[]);rotationRows.get(r).push([c,Number(e.value)])}
 const translationRows=new Map();for(const e of def.parameter_matrices?.translation?.entries||[]){const r=ti.get(e.row),c=ti.get(e.column);if(r==null||c==null)continue;if(!translationRows.has(r))translationRows.set(r,[]);translationRows.get(r).push([c,Number(e.value)])}
 const twistSpec=new Map();for(const seg of segments)for(const id of seg.twistTargetIds)twistSpec.set(id,{axis:seg.axis,sign:seg.sign});
 const mode=typeof def.rotation_extraction==="string"?def.rotation_extraction:"mixed";
 if(mode!=="aligned_x_swing_twist")console.warn("SOMA procedural extraction mode:",mode,"– Browserpfad ist auf aligned_x_swing_twist optimiert.");
 return {def,targetNames,publicNames,ti,pi,publicTarget,publicByTarget,segments,rotationRows,translationRows,twistSpec,mode}
}
function applyProceduralTranslations(world){
 if(!currentProcedural)return world;
 const J=targetJointCount,input=new Float32Array(J*3);for(let j=0;j<J;j++){input[j*3]=world[j*16+3];input[j*3+1]=world[j*16+7];input[j*3+2]=world[j*16+11]}
 for(const [row,entries] of currentProcedural.translationRows){let x=0,y=0,z=0;for(const [col,w] of entries){x+=w*input[col*3];y+=w*input[col*3+1];z+=w*input[col*3+2]}const o=row*16;world[o+3]=x;world[o+7]=y;world[o+11]=z}
 return world
}
function computeTargetLocalTranslations(world){
 const out=new Float32Array(targetJointCount*3);out[0]=world[3];out[1]=world[7];out[2]=world[11];
 for(let j=1;j<targetJointCount;j++){const p=targetParents[j],po=p*16,jo=j*16,dx=world[jo+3]-world[po+3],dy=world[jo+7]-world[po+7],dz=world[jo+11]-world[po+11];out[j*3]=world[po]*dx+world[po+4]*dy+world[po+8]*dz;out[j*3+1]=world[po+1]*dx+world[po+5]*dy+world[po+9]*dz;out[j*3+2]=world[po+2]*dx+world[po+6]*dy+world[po+10]*dz}
 return out
}
function rebuildExpandedTargetBind(){
 if(!currentProcedural||!poseBindWorldActive)return null;
 const world=targetBindWorldTemplate.slice();
 for(let p=0;p<poseJointCount;p++){const t=currentProcedural.publicTarget[p];for(let q=0;q<16;q++)world[t*16+q]=poseBindWorldActive[p*16+q]}
 applyProceduralTranslations(world);targetBindWorldActive=world;targetLocalTranslations=computeTargetLocalTranslations(world);targetInvBindActive=new Float32Array(targetJointCount*16);for(let j=0;j<targetJointCount;j++)rigidInverse(world,j*16,targetInvBindActive,j*16);
 return world
}
function publicWorldFromRelative(relative3){
 const local=new Float32Array(poseJointCount*16);relativeToFinalLocal(relative3,local);const world=new Float32Array(poseJointCount*16);world.set(local.subarray(0,16),0);for(let j=1;j<poseJointCount;j++)mat4Mul(world,poseParents[j]*16,local,j*16,world,j*16);return world
}
function currentTwistAngles(publicWorld){
 const twistValues=new Float32Array(poseJointCount),angles=new Float32Array(targetJointCount);
 for(const seg of currentProcedural.segments){
  const vq=(id,bq)=>quatNorm(quatMul(quatMul(quatFromMat4(publicWorld,id*16),quatConj(bq)),seg.alignQ));
  const qs=vq(seg.start,seg.bindQStart),qe=vq(seg.end,seg.bindQEnd),qp=vq(seg.parent,seg.bindQParent);
  const local=quatTwistAngle(quatNorm(quatMul(quatConj(qs),qe)),0),inherited=quatTwistAngle(quatNorm(quatMul(quatConj(qp),qs)),0);
  twistValues[seg.end]=local;if(seg.reverse)twistValues[seg.start]=inherited
 }
 for(const [row,entries] of currentProcedural.rotationRows){let a=0;for(const [col,w] of entries)a+=w*twistValues[col];angles[row]=a}
 return angles
}
function expandedTargetWorld(publicWorld){
 const J=targetJointCount,world=new Float32Array(J*16),assigned=new Uint8Array(J),visiting=new Uint8Array(J);
 const twistAngles=currentTwistAngles(publicWorld),baseR=new Float32Array(9),twR=new Float32Array(9),finalR=new Float32Array(9);
 // Public joints already have their authoritative world transforms from the 78-joint FK.
 for(let p=0;p<poseJointCount;p++){
  const t=currentProcedural.publicTarget[p];
  if(t<0||t>=J)throw new Error(`Public→Target Mapping ungültig: Public ${p} → Target ${t}`);
  world.set(publicWorld.subarray(p*16,p*16+16),t*16);assigned[t]=1
 }
 const build=j=>{
  if(assigned[j])return;
  if(visiting[j])throw new Error(`Target-Hierarchie enthält einen Zyklus bei Joint ${j} (${currentProcedural.targetNames[j]||"?"})`);
  visiting[j]=1;
  const p=Number(targetParents[j]);
  if(p<0||p>=J)throw new Error(`Target-Hierarchie: Joint ${j} hat ungültigen Parent ${p}`);
  rot3FromMat4(targetTLocal,j*16,baseR,0);
  const spec=currentProcedural.twistSpec.get(j);
  if(spec){const r=axisRot3(twistAngles[j],spec.axis,spec.sign);twR.set(r);mat3Mul(baseR,0,twR,0,finalR,0)}else finalR.set(baseR);
  const local=new Float32Array(16);
  local[0]=finalR[0];local[1]=finalR[1];local[2]=finalR[2];local[3]=targetLocalTranslations[j*3];
  local[4]=finalR[3];local[5]=finalR[4];local[6]=finalR[5];local[7]=targetLocalTranslations[j*3+1];
  local[8]=finalR[6];local[9]=finalR[7];local[10]=finalR[8];local[11]=targetLocalTranslations[j*3+2];local[15]=1;
  if(p===j)world.set(local,j*16);
  else{build(p);mat4Mul(world,p*16,local,0,world,j*16)}
  visiting[j]=0;assigned[j]=1
 };
 for(let j=0;j<J;j++)build(j);
 return world
}
function skinExpandedWorld(rest,publicWorld,targetWorld,markMoved=true,report=true,label="Current Expanded LBS"){
 if(!geometry||!targetInvBindActive)return null;const t0=performance.now(),J=targetJointCount,bone=new Float32Array(J*16);for(let j=0;j<J;j++)mat4Mul(targetWorld,j*16,targetInvBindActive,j*16,bone,j*16);
 const pos=geometry.attributes.position.array,n=rest.length/3,useMid=n===18056;if(useMid&&!ensureTargetMidSkinning())throw new Error("Mid 122-Joint Skinweights fehlen im Rig-Pack");const bIdx=useMid?targetMidBoneIndices:targetBoneIndices,bW=useMid?targetMidBoneWeights:targetBoneWeights,topK=useMid?targetMidTopK:targetTopK;let maxWeightErr=0;
 for(let v=0;v<n;v++){const x=rest[v*3],y=rest[v*3+1],z=rest[v*3+2];let ox=0,oy=0,oz=0,ws=0;for(let k=0;k<topK;k++){const bi=bIdx[v*topK+k],w=bW[v*topK+k];if(bi<0||w<=0)continue;const bo=bi*16;ox+=w*(bone[bo]*x+bone[bo+1]*y+bone[bo+2]*z+bone[bo+3]);oy+=w*(bone[bo+4]*x+bone[bo+5]*y+bone[bo+6]*z+bone[bo+7]);oz+=w*(bone[bo+8]*x+bone[bo+9]*y+bone[bo+10]*z+bone[bo+11]);ws+=w}maxWeightErr=Math.max(maxWeightErr,Math.abs(1-ws));pos[v*3]=ox;pos[v*3+1]=oy;pos[v*3+2]=oz}
 geometry.attributes.position.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();currentPoseWorld=publicWorld.slice();currentTargetPoseWorld=targetWorld.slice();refreshRigDebug();
 const elapsed=performance.now()-t0;if(markMoved){posePass=true;setState("#poseState","CURRENT 122-JOINT LBS","ok");updateDecision()}
 if(report)info("#posePerf",`${label}: ${elapsed.toFixed(1)} ms · ${n} Vertices · 78 Public-Joints → ${J} interne Skinning-Joints · Top-${useMid?targetMidTopK:targetTopK}\nGewichtssummenfehler max. ${maxWeightErr.toExponential(1)}\nProcedural Twist: ${currentProcedural?.segments?.length||0} Segmente · ${currentProcedural?.twistSpec?.size||0} Twist-Joints · ${currentProcedural?.mode||"?"}`);
 return {ms:elapsed,maxWeightErr,world:publicWorld,targetWorld}
}
function applyCurrentExpandedPose(rest,relative3,markMoved=true,report=true,label="Current 122-Joint LBS"){
 const publicWorld=publicWorldFromRelative(relative3),targetWorld=expandedTargetWorld(publicWorld);return skinExpandedWorld(rest,publicWorld,targetWorld,markMoved,report,label)
}

function fitCurrentPublicRbfPositions(){
 if(!currentRigPackLoaded||(currentRigMode!=="current-public"&&currentRigMode!=="current-expanded"))return null;
 const crow=packArray("public_rbf_crow_indices").data,col=packArray("public_rbf_col_indices").data,val=packArray("public_rbf_values").data;
 const world=poseBindWorld.slice();let moved=0,maxShift=0,sumShift=0;
 for(let j=1;j<poseJointCount;j++){
  let x=0,y=0,z=0,used=0;
  for(let p=Number(crow[j]);p<Number(crow[j+1]);p++){
   const v=Number(col[p]),w=Number(val[p]);x+=w*currentRestLow[v*3];y+=w*currentRestLow[v*3+1];z+=w*currentRestLow[v*3+2];used++
  }
  if(!used)continue;
  const o=j*16,dx=x-world[o+3],dy=y-world[o+7],dz=z-world[o+11],d=Math.hypot(dx,dy,dz);
  world[o+3]=x;world[o+7]=y;world[o+11]=z;sumShift+=d;maxShift=Math.max(maxShift,d);moved++
 }
 poseBindWorldActive=world;poseLocalActive=worldToLocalWithFixedRotations(world);poseInvBindActive=new Float32Array(poseJointCount*16);
 for(let j=0;j<poseJointCount;j++)rigidInverse(poseBindWorldActive,j*16,poseInvBindActive,j*16);
 return {count:moved,meanShift:moved?sumShift/moved:0,maxShift}
}
function setupCurrentPublicRigCore(){
 poseParents=Int32Array.from(Array.from(packArray("public_joint_parent_ids").data,Number));poseJointCount=poseParents.length;if(poseJointCount!==78)throw new Error(`Current Public Rig hat ${poseJointCount} statt 78 Joints`);
 poseLocalBase=copyPackMatricesToMeters(packArray("public_bind_pose_local"));poseBindWorld=copyPackMatricesToMeters(packArray("public_bind_pose_world"));
 const publicTLocal=copyPackMatricesToMeters(packArray("public_t_pose_local"));poseTWorld=fkLocalToWorldAnyOrder(publicTLocal,poseParents,"Public T-Pose");
 poseInvBind=new Float32Array(poseJointCount*16);for(let j=0;j<poseJointCount;j++)rigidInverse(poseBindWorld,j*16,poseInvBind,j*16);resetActiveRigMatrices();buildJointOrientData();
 bindShapeLow=new Float32Array(packArray("public_bind_shape_low").data.length);for(let i=0;i<bindShapeLow.length;i++)bindShapeLow[i]=Number(packArray("public_bind_shape_low").data[i])/100;
 const w=buildDirectLowSkinningFromPack("public",poseJointCount);poseEulerDeg=new Float32Array(poseJointCount*3);poseReady=true;buildPoseControls();rigAdaptiveEnabled=true;return w
}
function activateCurrentPublicRig(){
 try{
  if(!currentRigPackLoaded)throw new Error("Zuerst Current Rig-Pack laden & prüfen.");if(!arrays||!geometry)throw new Error("Zuerst Shape-Modell laden.");stopPoseAnimation(false);currentRigMode="current-public";currentTargetPoseWorld=null;
  const w=setupCurrentPublicRigCore(),stats=fitCurrentPublicRbfPositions();
  if(stats)updateAdaptiveRigUI(`✓ CURRENT PUBLIC-RIG + OFFIZIELLE RBF-JOINTPOSITIONEN AKTIV\nRBF-fit Joints: ${stats.count}/${poseJointCount-1} · mittlere Verschiebung ${(stats.meanShift*1000).toFixed(1)} mm · max ${(stats.maxShift*1000).toFixed(1)} mm\n\nDas ist jetzt nur noch der 78-Joint-A/B-Fallback. Für die eigentliche v0.2.2-Prüfung bitte „Expanded 122-Joint LBS aktivieren“ nutzen.`,"ok");
  poseEulerDeg.fill(0);applyPoseToRest(currentDisplayRest(),false,false);setState("#poseState","CURRENT PUBLIC 78","ok");setState("#currentRigState","PUBLIC 78 AKTIV","ok");$("#startShapeAnalysis").disabled=true;
  info("#poseInfo",`✓ Current Public-Rig als A/B-Fallback aktiv\nLow-LOD: ${w.n} Vertices · ${poseJointCount} Skinning-Joints\nShape-Anpassung: offizielle RBF-Jointpositionen`);updateDecision()
 }catch(e){console.error(e);setState("#poseState","CURRENT RIG FEHLER","bad");info("#poseInfo",`${e?.name||"Fehler"}: ${e?.message||String(e)}`)}
}
function activateCurrentExpandedRig(){
 let stage="Start";
 try{
  const errBox=$("#currentRigError");if(errBox){errBox.classList.add("hidden");errBox.textContent=""}
  if(!currentRigPackLoaded)throw new Error("Zuerst Current Rig-Pack laden & prüfen.");
  if(!arrays||!geometry)throw new Error("Zuerst Shape-Modell laden.");
  stopPoseAnimation(false);currentRigMode="current-expanded";
  stage="Current Public-Rig vorbereiten";setupCurrentPublicRigCore();
  stage="122-Joint Hierarchie laden";targetParents=Int32Array.from(Array.from(packArray("target_joint_parent_ids").data,Number));targetJointCount=targetParents.length;if(targetJointCount<100)throw new Error(`Expanded Target-Rig unerwartet klein: ${targetJointCount}`);
  const hs=hierarchyStats(targetParents);if(hs.invalid)throw new Error(`Target-Hierarchie enthält ${hs.invalid} ungültige Parent-Indizes`);
  stage="Target Bind-/T-Pose laden";targetBindWorldTemplate=copyPackMatricesToMeters(packArray("target_bind_pose_world"));targetTLocal=copyPackMatricesToMeters(packArray("target_t_pose_local"));
  // Gegencheck: T-Pose-FK muss unabhängig von der Reihenfolge der Joint-Indizes funktionieren.
  fkLocalToWorldAnyOrder(targetTLocal,targetParents,"Target T-Pose");
  stage="Procedural Twist kompilieren";currentProcedural=compileCurrentProcedural();
  stage="Public RBF Shape-Fit";const stats=fitCurrentPublicRbfPositions();
  stage="Expanded Bindpose/Rebind";rebuildExpandedTargetBind();
  stage="122-Joint Skinweights";const tw=buildTargetLowSkinningFromPack();
  stage="122-Joint Nullpose skinnen";poseEulerDeg.fill(0);applyPoseToRest(currentDisplayRest(),false,true);
  setState("#poseState","CURRENT 122-JOINT LBS","ok");setState("#currentRigState","122 LBS AKTIV","ok");$("#toggleDebugTopology").disabled=false;$("#startShapeAnalysis").disabled=shapeEngine!=="soma-pca";
  updateAdaptiveRigUI(`✓ CURRENT SHAPE-FIT + EXPANDED TARGET-RIG AKTIV\nPublic RBF-fit: ${stats?.count||0}/${poseJointCount-1} Joints · mittlere Verschiebung ${((stats?.meanShift||0)*1000).toFixed(1)} mm\nTarget-Bindpose daraus auf ${targetJointCount} Joints expandiert; Twist-Helfer folgen den SOMA-Procedural-Matrizen.`,"ok");
  info("#poseInfo",`✓ CURRENT v0026 EXPANDED-RIG IST JETZT DIE AKTIVE LBS-RUNTIME\nBedienung: 77 öffentliche Pose-Joints\nInternes Skinning: ${targetJointCount} Joints\nLow-LOD: ${tw.n} Vertices · Einflüsse/Vertex ${tw.minInflu}–${tw.rawMax}${tw.truncated?` · ${tw.truncated} Vertices auf Top-${tw.topK} begrenzt`:""}\nProcedural Twist: ${currentProcedural.segments.length} Segmente / ${currentProcedural.twistSpec.size} Twist-Joints\nRotationsextraktion: ${currentProcedural.mode}\nHierarchie: ${hs.forwardRefs} Parent-Vorwärtsverweise werden jetzt reihenfolgeunabhängig aufgelöst.\n\nNVIDIA-Animation, Slider und Shape-Regler laufen ab jetzt alle durch den 122-Joint-Pfad.`);updateDecision();disposeRigDebugObjects();refreshRigDebug();return true
 }catch(e){
  console.error("Expanded 122 activation failed at",stage,e);
  currentRigMode="current-public";currentTargetPoseWorld=null;$("#toggleDebugTopology").disabled=true;$("#startShapeAnalysis").disabled=true;
  // setupCurrentPublicRigCore() läuft vor dem Expanded-Teil; deshalb können wir auf einen
  // definierten Public-Fallback zurückfallen, statt die Runtime halb umgeschaltet zu lassen.
  try{if(poseReady&&poseEulerDeg){poseEulerDeg.fill(0);applyPoseToRest(currentDisplayRest(),false,false)}}catch(fallbackError){console.warn("Public fallback restore failed",fallbackError)}
  setState("#poseState","122 LBS FEHLER","bad");setState("#currentRigState","122 FEHLER","bad");
  const msg=`${stage}: ${e?.name||"Fehler"}: ${e?.message||String(e)}`;info("#poseInfo",msg+(e?.stack?"\n"+e.stack:""));
  const errBox=$("#currentRigError");if(errBox){errBox.textContent="122-Aktivierung gestoppt bei „"+stage+"“\n"+(e?.message||String(e))+"\n\nDie App ist automatisch auf den funktionierenden Public-78-Fallback zurückgegangen.";errBox.classList.remove("hidden")}
  return false
 }
}

function currentDisplayRest(){
 return displayLOD==="mid"&&currentRestMid?currentRestMid:currentRestLow
}
function currentDisplayTriangles(){
 return displayLOD==="mid"?(trianglesMid||arrays?.triangles):(trianglesLow||arrays?.triangles_low||triangles)
}
function annyPackForLOD(lod){return lod==="mid"?annyMidPack:annyLowPack}
function annyArray(name,lod="low"){
 const a=annyPackForLOD(lod)?.[name];
 if(!a)throw new Error(`Anny-${lod}-Pack Array fehlt: ${name}`);
 return a
}
async function fetchAnnyEnginePack(lod,{forceNetwork=false,onProgress=null}={}){
 const isMid=lod==="mid",key=isMid?ASSET_KEY.annyMid:ASSET_KEY.annyLow,url=isMid?ANNY_MID_PACK_URL:ANNY_LOW_PACK_URL,raw=isMid?ANNY_MID_PACK_RAW_URL:ANNY_LOW_PACK_RAW_URL;
 if(!forceNetwork){
  try{const c=await assetCacheGet(key);if(c?.buffer){const u8=new Uint8Array(c.buffer);if(onProgress)onProgress(u8.byteLength,u8.byteLength,true,"persistenter iPhone-Cache");return {u8,cacheHit:true,size:u8.byteLength,source:"persistenter iPhone-Cache"}}}catch(e){console.warn("Anny cache read",e)}
 }
 const stamp=ANNY_SOURCE_SHA.slice(0,12),page=new URL(url,document.baseURI);page.searchParams.set("anny",stamp);
 const candidates=[{label:"GitHub Pages",url:page.href},{label:"GitHub Raw-Fallback",url:raw+"?anny="+encodeURIComponent(stamp)}],errors=[];
 for(const c of candidates){
  try{
   if(onProgress)onProgress(0,0,false,c.label+" …");const r=await fetch(c.url,{mode:"cors",cache:"no-store"});if(!r.ok)throw new Error("HTTP "+r.status);
   const u8=new Uint8Array(await r.arrayBuffer());if(u8.byteLength<150000)throw new Error(`Antwort unerwartet klein: ${u8.byteLength} Bytes`);
   try{await assetCachePut(key,url,u8,r.headers.get("content-type")||"application/octet-stream")}catch(e){console.warn("Anny cache write",e)}
   return {u8,cacheHit:false,size:u8.byteLength,source:c.label}
  }catch(e){errors.push(c.label+": "+(e?.message||String(e)))}
 }
 throw new Error(`Anny-${lod}-Pack nicht erreichbar. `+errors.join(" · "))
}
function decodeAnnyMeta(pack){
 const a=pack?.meta_utf8;if(!a)throw new Error("Anny meta_utf8 fehlt");return JSON.parse(decodeUtf8Array(a))
}
function validateAnnyPack(pack,lod){
 const meta=decodeAnnyMeta(pack),t=pack.template_vertices,b=pack.blendshapes,m=pack.phenotype_mask;
 if(meta.schema!=="anny-soma-browser-exact-engine-v2")throw new Error(`Anny Schema ${meta.schema||"?"} statt v2`);
 if(meta.source_git_sha!==ANNY_SOURCE_SHA)throw new Error(`Anny Commit ${meta.source_git_sha} statt ${ANNY_SOURCE_SHA}`);
 const expectedV=lod==="mid"?18056:4505;
 if(t.shape?.[0]!==expectedV||t.shape?.[1]!==3)throw new Error(`${lod} template ${JSON.stringify(t.shape)} statt [${expectedV},3]`);
 if(b.shape?.[0]!==meta.blendshape_count||b.shape?.[1]!==expectedV||b.shape?.[2]!==3)throw new Error(`${lod} blendshapes ${JSON.stringify(b.shape)} unerwartet`);
 if(m.shape?.[0]!==meta.phenotype_blendshape_count)throw new Error("Phenotype-Mask-Zeilen passen nicht");
 return meta
}
async function loadAnnyPack(){
 try{
  if(!arrays||!baseLow)throw new Error("Zuerst Punkt 1: SOMA Shape-Asset laden – es liefert Topologie + Low-Zuordnung.");
  setState("#annyState","LOW LÄDT","warn");await requestPersistentStorage();
  let asset=await fetchAnnyEnginePack("low",{onProgress:(got,total,hit,src)=>info("#annyInfo",hit?`✓ Low-Pack aus persistentem Cache · ${(got/1048576).toFixed(1)} MB`:`${src||"Low-Pack"}${got?` · ${(got/1048576).toFixed(1)} MB`:""}`)});
  try{annyLowPack=await decodeShapeNPZ(asset.u8)}catch(first){if(!asset.cacheHit)throw first;await assetCacheDelete(ASSET_KEY.annyLow);asset=await fetchAnnyEnginePack("low",{forceNetwork:true});annyLowPack=await decodeShapeNPZ(asset.u8)}
  annyMeta=validateAnnyPack(annyLowPack,"low");annyPackLoaded=true;annyLocalValues=Object.fromEntries(annyMeta.local_change_labels.map(x=>[x,0]));
  buildAnnyControls();setAnnyUiFromParams();$("#useAnny").disabled=false;setState("#annyState","LOW PACK OK","ok");
  info("#annyInfo",`✓ EXAKTE ANNY-BLENDSHAPE-ENGINE IM BROWSER\nQuelle: ${asset.cacheHit?"persistenter iPhone-Cache":asset.source}\nAnny v${annyMeta.anny_version} · Commit ${annyMeta.source_git_sha.slice(0,12)}\nLow: 4.505 Vertices · ${annyMeta.blendshape_count} Blendshapes\nPhänotyp-Blendshapes: ${annyMeta.phenotype_blendshape_count}\nLokale Modifikatoren: ${annyMeta.local_change_labels.length}\nAlle Phänotyp-Parameter + lokale Changes werden aus den offiziellen Anny-Blendshapes rekonstruiert – kein 216-Shape-Grid mehr.`);
  return true
 }catch(e){console.error(e);annyPackLoaded=false;setState("#annyState","PACK FEHLT/FEHLER","bad");$("#useAnny").disabled=true;info("#annyInfo",`${e?.name||"Fehler"}: ${e?.message||String(e)}\n\nFür v0.5.12 den neuen Workflow „Build Anny SOMA Engine v2“ einmal ausführen.`);return false}
}
async function loadAnnyMidPack(){
 if(annyMidLoaded)return true;
 try{
  setState("#annyMidState","MID LÄDT","warn");let asset=await fetchAnnyEnginePack("mid");
  try{annyMidPack=await decodeShapeNPZ(asset.u8)}catch(first){if(!asset.cacheHit)throw first;await assetCacheDelete(ASSET_KEY.annyMid);asset=await fetchAnnyEnginePack("mid",{forceNetwork:true});annyMidPack=await decodeShapeNPZ(asset.u8)}
  const meta=validateAnnyPack(annyMidPack,"mid");if(meta.blendshape_count!==annyMeta.blendshape_count)throw new Error("Low/Mid Blendshape-Anzahl weicht ab");
  annyMidLoaded=true;setState("#annyMidState","MID PACK OK","ok");info("#lodInfo",`✓ Mid-Pack: 18.056 Vertices · ${(asset.size/1048576).toFixed(1)} MB · ${asset.cacheHit?"persistenter Cache":"persistent gespeichert"}`);return true
 }catch(e){console.error(e);setState("#annyMidState","MID FEHLER","bad");info("#lodInfo",`${e?.name||"Fehler"}: ${e?.message||String(e)}`);return false}
}
function linearAnchorWeights(value,anchors){
 const a=anchors.map(Number),w=new Float64Array(a.length);if(value<=a[0]){w[0]=1;return w}if(value>=a[a.length-1]){w[a.length-1]=1;return w}
 for(let i=0;i<a.length-1;i++)if(value>=a[i]&&value<=a[i+1]){const t=(value-a[i])/(a[i+1]-a[i]);w[i]=1-t;w[i+1]=t;return w}w[0]=1;return w
}
function computeAnnyCoefficients(){
 if(!annyMeta)throw new Error("Anny Meta fehlt");const vw=new Float64Array(annyMeta.variation_names.length),index=new Map(annyMeta.variation_names.map((n,i)=>[n,i]));
 for(const feature of annyMeta.variation_order){
  const names=annyMeta.phenotype_variations[feature];
  if(feature==="race"){
   const vals=[Math.max(0,annyParams.african),Math.max(0,annyParams.asian),Math.max(0,annyParams.caucasian)],sum=vals[0]+vals[1]+vals[2];
   for(let i=0;i<names.length;i++)vw[index.get(names[i])]=sum>1e-12?vals[i]/sum:1/3
  }else{
   const ws=linearAnchorWeights(Number(annyParams[feature]??.5),annyMeta.anchors[feature]);for(let i=0;i<names.length;i++)vw[index.get(names[i])]=ws[i]
  }
 }
 const P=annyMeta.phenotype_blendshape_count,mask=annyArray("phenotype_mask","low").data,C=annyMeta.variation_names.length,out=new Float32Array(annyMeta.blendshape_count);
 for(let r=0;r<P;r++){let x=1;for(let c=0;c<C;c++)if(Number(mask[r*C+c])>.5)x*=vw[c];out[r]=x}
 let o=P;for(const label of annyMeta.local_change_labels){const v=Number(annyLocalValues[label]||0);out[o++]=Math.max(v,0);out[o++]=Math.max(-v,0)}
 if(o!==out.length)throw new Error(`Anny coefficients ${o} statt ${out.length}`);return out
}
function reconstructAnnyLOD(lod,coeffs,out){
 const pack=annyPackForLOD(lod);if(!pack)throw new Error(`Anny ${lod} Pack fehlt`);const t=pack.template_vertices.data,b=pack.blendshapes.data,N=t.length;
 if(!out||out.length!==N)out=new Float32Array(N);for(let i=0;i<N;i++)out[i]=Number(t[i]);
 for(let a=0;a<coeffs.length;a++){const c=coeffs[a];if(Math.abs(c)<1e-8)continue;const off=a*N;for(let i=0;i<N;i++)out[i]+=Number(b[off+i])*c}
 return out
}
function minYOfVertices(rest){let y=Infinity;for(let i=1;i<rest.length;i+=3)y=Math.min(y,rest[i]);return y}
function translateVerticesY(rest,dy){if(Math.abs(dy)<1e-10)return;for(let i=1;i<rest.length;i+=3)rest[i]+=dy}
function alignAnnyToSomaGround(){
 if(!baseLow||!currentRestLow)return 0;
 // Anny/SOMA-topology is pelvis/world-origin centered differently from the
 // older SOMA_neutral browser asset. Keep the body-editor ground plane stable.
 const dy=minYOfVertices(baseLow)-minYOfVertices(currentRestLow);
 translateVerticesY(currentRestLow,dy);
 if(displayLOD==="mid"&&currentRestMid)translateVerticesY(currentRestMid,dy);
 annyGroundOffsetY=dy;return dy
}
function rebuildAnnyRestShape(){
 const t0=performance.now(),cs=computeAnnyCoefficients();
 if(displayLOD==="mid"){
  if(!annyMidLoaded)throw new Error("Mid-Pack noch nicht geladen");currentRestMid=reconstructAnnyLOD("mid",cs,currentRestMid);
  if(!currentRestLow||currentRestLow.length!==lowMap.data.length*3)currentRestLow=new Float32Array(lowMap.data.length*3);
  for(let i=0;i<lowMap.data.length;i++){const s=Number(lowMap.data[i])*3,d=i*3;currentRestLow[d]=currentRestMid[s];currentRestLow[d+1]=currentRestMid[s+1];currentRestLow[d+2]=currentRestMid[s+2]}
 }else currentRestLow=reconstructAnnyLOD("low",cs,currentRestLow);
 alignAnnyToSomaGround();
 annyLastMs=performance.now()-t0;return currentDisplayRest()
}
function prettyAnnyLabel(s){return s.replace(/-decr-incr$/," ↓/↑").replace(/-down-up$/," ↓/↑").replace(/-/g," ").replace(/\b\w/g,m=>m.toUpperCase())}
function prettyAnnyCategory(s){const map={torso:"Torso",breast:"Brust",stomach:"Bauch",buttocks:"Gesäß",arms:"Arme",legs:"Beine",hands:"Hände",feet:"Füße",neck:"Hals",head:"Kopf",cheek:"Wangen",chin:"Kinn",ears:"Ohren",eyes:"Augen",forehead:"Stirn",jaw:"Kiefer",mouth:"Mund",nose:"Nase",genitals:"Genitalbereich"};return map[s]||prettyAnnyLabel(s)}
function makeAnnySlider(label,key,min,max,step,value,onInput,raw=""){
 const row=document.createElement("div");row.className="slider annySlider";row.dataset.search=(label+" "+raw).toLowerCase();row.innerHTML=`<label>${label}${raw?`<small>${raw}</small>`:""}</label><input type="range" min="${min}" max="${max}" step="${step}" value="${value}"><output>${Number(value).toFixed(2)}</output>`;
 const r=row.querySelector("input"),o=row.querySelector("output");r.oninput=()=>{o.value=Number(r.value).toFixed(2);onInput(Number(r.value))};return row
}
function buildAnnyControls(){
 if(!annyMeta)return;const core=$("#annyCoreControls"),adv=$("#annyAdvancedPhenotypes"),groups=$("#annyLocalGroups");core.innerHTML="";adv.innerHTML="";groups.innerHTML="";
 const coreDefs=[["Age","age",annyMeta.anchors.age[0],annyMeta.anchors.age.at(-1),.01],["Height","height",0,1,.01],["Weight","weight",0,1,.01],["Muscle","muscle",0,1,.01],["Proportions","proportions",0,1,.01],["Cupsize","cupsize",0,1,.01],["Firmness","firmness",0,1,.01]];
 for(const [label,key,min,max,step] of coreDefs)core.appendChild(makeAnnySlider(`Anny ${label}`,key,min,max,step,annyParams[key],v=>{annyParams[key]=v;applyAnnyParams()}));
 adv.appendChild(makeAnnySlider("Native Gender Blend","gender",0,1,.01,annyParams.gender,v=>{annyParams.gender=v;applyAnnyParams()},"0 = male · 1 = female"));
 for(const key of ["african","asian","caucasian"])adv.appendChild(makeAnnySlider(`Phenotype ${key[0].toUpperCase()+key.slice(1)}`,key,0,1,.01,annyParams[key],v=>{annyParams[key]=v;applyAnnyParams()},"artist-authored legacy phenotype"));
 const by={};for(const label of annyMeta.local_change_labels){const cat=annyMeta.local_change_categories[label]||"other";(by[cat]??=[]).push(label)}
 const order=[...(annyMeta.category_order||[]),...Object.keys(by).filter(x=>!(annyMeta.category_order||[]).includes(x))];
 for(const cat of order){if(!by[cat]?.length)continue;const d=document.createElement("details");d.className="annyLocalCategory";d.innerHTML=`<summary>${prettyAnnyCategory(cat)} <small>${by[cat].length}</small></summary><div class="annyLocalRows"></div>`;const box=d.querySelector(".annyLocalRows");for(const label of by[cat].sort())box.appendChild(makeAnnySlider(prettyAnnyLabel(label),label,-1,1,.05,0,v=>{annyLocalValues[label]=v;applyAnnyParams()},label));groups.appendChild(d)}
 $("#annyLocalSummary").textContent=`Alle lokalen Anny-Modifikatoren (${annyMeta.local_change_labels.length})`;
 $("#annySearch").oninput=filterAnnyLocalControls
}
function filterAnnyLocalControls(){const q=$("#annySearch").value.trim().toLowerCase();document.querySelectorAll("#annyLocalGroups .annySlider").forEach(r=>r.hidden=!!q&&!r.dataset.search.includes(q));document.querySelectorAll("#annyLocalGroups .annyLocalCategory").forEach(d=>{const shown=[...d.querySelectorAll(".annySlider")].some(r=>!r.hidden);d.hidden=!shown;if(q&&shown)d.open=true})}
function setAnnyUiFromParams(){
 $("#annyMale").classList.toggle("selected",annyParams.gender<=.001);$("#annyFemale").classList.toggle("selected",annyParams.gender>=.999);
 const keys=["age","height","weight","muscle","proportions","cupsize","firmness","gender","african","asian","caucasian"];
 document.querySelectorAll("#annyCoreControls .annySlider,#annyAdvancedPhenotypes .annySlider").forEach(row=>{const raw=row.querySelector("label small")?.textContent||"",label=row.querySelector("label")?.childNodes[0]?.textContent||"";let key=keys.find(k=>label.toLowerCase().includes(k));if(label.includes("Gender"))key="gender";if(key&&key in annyParams){row.querySelector("input").value=annyParams[key];row.querySelector("output").value=Number(annyParams[key]).toFixed(2)}})
}
function resetAnnyLocal(){for(const k of Object.keys(annyLocalValues))annyLocalValues[k]=0;document.querySelectorAll("#annyLocalGroups input").forEach(r=>{r.value=0;r.closest(".slider").querySelector("output").value="0.00"});applyAnnyParams()}
function resetAnnyPreset(gender){annyParams={gender,age:2/3,muscle:.5,weight:.5,height:.5,proportions:.5,cupsize:.5,firmness:.5,african:.5,asian:.5,caucasian:.5};resetAnnyLocal();setAnnyUiFromParams()}
function setShapeEngine(engine){
 if(engine==="anny"&&!annyPackLoaded){info("#annyInfo","Anny Low-Pack zuerst laden.");return}
 if(engine==="soma-pca"&&displayLOD==="mid")displayLOD="low";shapeEngine=engine;updateLodButtons();
 document.querySelectorAll("#sliders input,#random,#reset").forEach(x=>x.disabled=engine==="anny");$("#useAnny").classList.toggle("selected",engine==="anny");$("#useSoma").classList.toggle("selected",engine==="soma-pca");
 if(engine==="anny"){shapeAnalysis.ready=false;shapeAnalysis.stale=true;$("#startShapeAnalysis").disabled=true;setState("#pcaState","A/B REFERENZ","warn");setState("#annyState","ANNY AKTIV","ok")}else{setState("#pcaState","AKTIV","ok");setState("#annyState",annyPackLoaded?"PACK OK":"BEREIT",annyPackLoaded?"ok":"");$("#startShapeAnalysis").disabled=!(currentRigMode==="current-expanded")}
 updateShape();updateDecision();return true
}
function applyAnnyParams(){if(shapeEngine!=="anny")setShapeEngine("anny");else updateShape();setAnnyUiFromParams();
 try{const m=measureCurrentRestShape();info("#annyLiveInfo",`Anny exakt · Gender ${annyParams.gender.toFixed(2)} · Age ${annyParams.age.toFixed(2)} · H ${annyParams.height.toFixed(2)} · W ${annyParams.weight.toFixed(2)} · Muscle ${annyParams.muscle.toFixed(2)} · Proportions ${annyParams.proportions.toFixed(2)} · Cup ${annyParams.cupsize.toFixed(2)}\nAktive lokale Changes: ${Object.values(annyLocalValues).filter(v=>Math.abs(v)>1e-6).length} · Rekonstruktion ${annyLastMs.toFixed(1)} ms · Display ${displayLOD.toUpperCase()}\nMess-Proxies: Höhe ${m.height.toFixed(1)} cm · Brust ${m.chestCirc.toFixed(1)} · Taille ${m.waistCirc.toFixed(1)} · Hüfte ${m.hipCirc.toFixed(1)} cm`)}catch(e){info("#annyLiveInfo",`Anny exakt · ${displayLOD.toUpperCase()} · ${annyLastMs.toFixed(1)} ms`)}
}
function updateLodButtons(){$("#lodLow").classList.toggle("selected",displayLOD==="low");$("#lodMid").classList.toggle("selected",displayLOD==="mid");$("#lodBadge").textContent=displayLOD==="mid"?"18.056 V":"4.505 V"}
async function setDisplayLOD(lod){
 if(lod===displayLOD)return true;if(lod==="mid"){
  if(shapeEngine!=="anny"){info("#lodInfo","Mid ist in v0.5.12 bewusst für den Anny-Pfad aktiviert. Zuerst Anny verwenden.");return false}
  if(!await loadAnnyMidPack())return false;
  if(poseReady&&currentRigMode==="current-expanded"&&!packOptional("target_skinning_mid_shape")){info("#lodInfo","Mid-Shape ist vorhanden, aber der aktuelle Rig-Pack enthält noch keine 18k×122 Skinweights. Bitte den v0.5.12 Engine-v2-Workflow einmal ausführen; er erneuert Rig + Anny-Packs gemeinsam.");return false}
 }
 displayLOD=lod;updateLodButtons();updateShape(true);return true
}

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
  buildLowData();buildMesh();buildSliders();shapePass=true;probeEmbeddedRig();updateDecision();return true
 }catch(e){
  console.error(e);setState("#shapeState","FEHLER","bad");info("#shapeInfo",`${e?.name||"Fehler"}: ${e?.message||String(e)}${e?.stack?`\n\n${e.stack}`:""}`);return false
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
 trianglesMid=arrays.triangles||triangles;trianglesLow=arrays.triangles_low||triangles;if(useLow&&arrays.triangles_low)triangles=arrays.triangles_low;
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
function buildMesh(doFrame=true){
 const rest=currentDisplayRest();if(!rest)return;geometry?.dispose();if(mesh)scene.remove(mesh);
 geometry=new THREE.BufferGeometry();geometry.setAttribute("position",new THREE.BufferAttribute(rest.slice(),3));const tri=currentDisplayTriangles();
 const idx=tri.data instanceof Int32Array?new Uint32Array(tri.data):new Uint32Array(Array.from(tri.data,Number));geometry.setIndex(new THREE.BufferAttribute(idx,1));geometry.computeVertexNormals();
 mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:0xc8c9cf,roughness:.78,metalness:0,side:THREE.DoubleSide}));scene.add(mesh);setState("#meshState","GERENDERT","ok");if(shapeEngine==="soma-pca")setState("#pcaState","AKTIV","ok");if(doFrame)frame();
 info("#meshInfo",`✓ ${rest.length/3} Vertices · ${idx.length/3} Dreiecke · ${displayLOD.toUpperCase()} · Three.js WebGL`)
}
function rebuildSomaPcaRestShape(){
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
function rebuildRestShape(){
 if(shapeEngine!=="anny"&&displayLOD!=="low"){displayLOD="low";updateLodButtons()}
 return shapeEngine==="anny"?rebuildAnnyRestShape():rebuildSomaPcaRestShape()
}
function updateShape(){
 if(!geometry)return;
 const t0=performance.now(),rest=rebuildRestShape();
 if(!geometry||geometry.attributes.position.array.length!==rest.length)buildMesh(false);
 if(poseReady){
  if(rigAdaptiveEnabled)recomputeAdaptiveRig();
  if(lastAppliedRelative3&&lastAppliedRelative3.length===poseJointCount*9)applyRelativePoseMatrices(rest,lastAppliedRelative3,false,false,"Shape-Rebind + aktuelle Pose");
  else applyPoseToRest(rest,false)
 }else{
  const pos=geometry.attributes.position.array;pos.set(rest);
  geometry.attributes.position.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere()
 }
 const engineText=shapeEngine==="anny"
  ?`Anny native Grid · ${annyParams.gender<.5?"Male":"Female"} · H ${annyParams.height.toFixed(2)} · W ${annyParams.weight.toFixed(2)}`
  :"SOMA PCA · 128 Komponenten";
 info("#shapePerf",`Letzte komplette Shape-Rekonstruktion: ${(performance.now()-t0).toFixed(1)} ms · ${engineText} · ${displayLOD.toUpperCase()} ${rest.length/3} Vertices${poseReady?" · Rig-Rebind + aktuelle Pose erneut angewendet":""}`)
}

function nextPaint(delay=18){
 return new Promise(resolve=>requestAnimationFrame(()=>setTimeout(resolve,delay)))
}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function analyzerMetricArray(m){return ANALYSIS_METRICS.map(d=>Number(m[d.key]))}
function analyzerMetricObject(values){
 const out={};for(let i=0;i<ANALYSIS_METRICS.length;i++)out[ANALYSIS_METRICS[i].key]=values[i];return out
}
function jointBindPos(name){
 const j=jointIndex(name),w=poseBindWorldActive||poseBindWorld;
 if(j<0||!w)return null;
 const o=j*16;return [w[o+3],w[o+7],w[o+11]]
}
function convexHull2D(points){
 if(points.length<=2)return points.slice();
 const pts=points.map(p=>[p[0],p[1]]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
 const cross=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);
 const lo=[];
 for(const p of pts){while(lo.length>=2&&cross(lo[lo.length-2],lo[lo.length-1],p)<=0)lo.pop();lo.push(p)}
 const hi=[];
 for(let i=pts.length-1;i>=0;i--){const p=pts[i];while(hi.length>=2&&cross(hi[hi.length-2],hi[hi.length-1],p)<=0)hi.pop();hi.push(p)}
 lo.pop();hi.pop();return lo.concat(hi)
}
function hullPerimeter(h){
 if(h.length<2)return 0;
 let s=0;for(let i=0;i<h.length;i++){const a=h[i],b=h[(i+1)%h.length];s+=Math.hypot(a[0]-b[0],a[1]-b[1])}return s
}
function sliceAtY(rest,y,baseBand,maxAbsX=Infinity,xCenter=0){
 let points=[],band=baseBand;
 for(let attempt=0;attempt<4;attempt++){
  points=[];
  for(let v=0;v<rest.length/3;v++){
   const x=rest[v*3],vy=rest[v*3+1],z=rest[v*3+2];
   if(Math.abs(vy-y)<=band&&Math.abs(x-xCenter)<=maxAbsX)points.push([x,z])
  }
  if(points.length>=24)break;
  band*=1.55
 }
 if(points.length<6)return {y,band,points,hull:[],circ:NaN,width:NaN,depth:NaN};
 const hull=convexHull2D(points);
 let minX=Infinity,maxX=-Infinity,minZ=Infinity,maxZ=-Infinity;
 for(const p of points){minX=Math.min(minX,p[0]);maxX=Math.max(maxX,p[0]);minZ=Math.min(minZ,p[1]);maxZ=Math.max(maxZ,p[1])}
 return {y,band,points,hull,circ:hullPerimeter(hull)*100,width:(maxX-minX)*100,depth:(maxZ-minZ)*100}
}
function measureCurrentRestShape(){
 if(!currentRestLow)throw new Error("Kein aktueller Rest-Shape");
 let minY=Infinity,maxY=-Infinity;
 for(let v=0;v<currentRestLow.length/3;v++){const y=currentRestLow[v*3+1];minY=Math.min(minY,y);maxY=Math.max(maxY,y)}
 const heightM=maxY-minY,baseBand=clamp(heightM*.0105,.014,.026);
 const ls=jointBindPos("LeftShoulder"),rs=jointBindPos("RightShoulder"),hips=jointBindPos("Hips"),sp1=jointBindPos("Spine1"),sp2=jointBindPos("Spine2"),ch=jointBindPos("Chest"),ll=jointBindPos("LeftLeg"),rl=jointBindPos("RightLeg");
 if(!ls||!rs||!hips||!sp1||!sp2||!ch||!ll||!rl)throw new Error("Current-Rig-Jointpositionen für Mess-Slices fehlen");
 const centerX=hips[0],shoulderM=Math.abs(ls[0]-rs[0]);
 // Levels are rig-relative so they follow body proportions rather than fixed world heights.
 const chestY=sp2[1]*.58+ch[1]*.42;
 const waistY=hips[1]*.42+sp1[1]*.58;
 const legY=(ll[1]+rl[1])*.5;
 const hipY=hips[1]*.36+legY*.64;
 const chest=sliceAtY(currentRestLow,chestY,baseBand,Math.max(.16,shoulderM*.68),centerX);
 const waist=sliceAtY(currentRestLow,waistY,baseBand*1.05,Infinity,centerX);
 const hip=sliceAtY(currentRestLow,hipY,baseBand*1.12,Infinity,centerX);
 const vals=[chest.circ,waist.circ,hip.circ,chest.depth,hip.depth];
 if(vals.some(v=>!Number.isFinite(v)))throw new Error("Zu wenige Low-LOD-Vertices für einen Mess-Slice");
 return {
  height:heightM*100,
  shoulder:shoulderM*100,
  chestCirc:chest.circ,waistCirc:waist.circ,hipCirc:hip.circ,
  chestDepth:chest.depth,hipDepth:hip.depth,
  _slices:{chest,waist,hip},
  _shoulders:{left:ls,right:rs}
 }
}
function clearMeasurementOverlay(){
 if(!measurementGroup)return;
 scene.remove(measurementGroup);
 measurementGroup.traverse(o=>{o.geometry?.dispose?.();o.material?.dispose?.()});
 measurementGroup=null
}
function updateMeasurementOverlay(m){
 if(!measureOverlayVisible||!m?._slices)return;
 clearMeasurementOverlay();measurementGroup=new THREE.Group();
 const specs=[
  ["chest",0xff6b6b],["waist",0x6bff91],["hip",0x6ba7ff]
 ];
 for(const [key,color] of specs){
  const s=m._slices[key];if(!s?.hull?.length)continue;
  const arr=new Float32Array(s.hull.length*3);
  for(let i=0;i<s.hull.length;i++){arr[i*3]=s.hull[i][0];arr[i*3+1]=s.y;arr[i*3+2]=s.hull[i][1]}
  const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.BufferAttribute(arr,3));
  measurementGroup.add(new THREE.LineLoop(g,new THREE.LineBasicMaterial({color,transparent:true,opacity:.95})))
 }
 const sh=m._shoulders;
 if(sh){
  const arr=new Float32Array([sh.left[0],sh.left[1],sh.left[2],sh.right[0],sh.right[1],sh.right[2]]);
  const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.BufferAttribute(arr,3));
  measurementGroup.add(new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:0xffd36b,transparent:true,opacity:.95})))
 }
 scene.add(measurementGroup)
}
function toggleMeasureOverlay(){
 measureOverlayVisible=!measureOverlayVisible;
 $("#toggleMeasureLines").textContent=measureOverlayVisible?"Messlinien AUS":"Messlinien AN";
 if(!measureOverlayVisible)clearMeasurementOverlay();
 else if(shapeAnalysis.lastMetrics)updateMeasurementOverlay(shapeAnalysis.lastMetrics)
}
function renderAnalyzerMetrics(m,base=null){
 const box=$("#analysisMetrics");if(!box||!m)return;
 box.innerHTML=ANALYSIS_METRICS.map(d=>{
  const v=m[d.key],b=base?.[d.key],delta=b==null?0:v-b;
  return `<div class="metricCard"><b>${d.short}</b><strong>${v.toFixed(1)} cm</strong>${b==null?"":`<small>${Math.abs(delta)<.05?"Basis":`${delta>=0?"+":""}${delta.toFixed(1)} cm`}</small>`}</div>`
 }).join("")
}
function syncRawPcUi(){
 document.querySelectorAll("#sliders .slider").forEach((d,i)=>{
  const r=d.querySelector("input"),o=d.querySelector("output");if(!r||!o)return;
  r.value=String(clamp(coeff[i],-3,3));o.value=Number(coeff[i]).toFixed(2)
 })
}
function markShapeAnalysisStale(reason="Raw-PCA wurde verändert"){
 if(shapeAnalysis.internal||!shapeAnalysis.ready)return;
 shapeAnalysis.stale=true;shapeAnalysis.ready=false;
 setState("#analysisState","NEU ANALYSIEREN","warn");
 info("#analysisInfo",`${reason}. Die semantischen Richtungen waren lokal am vorherigen Körper kalibriert. Bitte die 128-PC-Analyse am aktuellen Shape neu starten.`);
 document.querySelectorAll(".semanticControl input").forEach(x=>x.disabled=true)
}
function analyzerIdentityRelative(){
 const rel=new Float32Array(poseJointCount*9);for(let j=0;j<poseJointCount;j++)mat3Identity(rel,j*9);return rel
}
function applyAnalyzerRest(rest,relative=null){
 currentRestLow.set(rest);
 recomputeAdaptiveRig();
 return applyRelativePoseMatrices(currentDisplayRest(),relative||analyzerIdentityRelative(),false,false,"Shape-Analyzer live")
}
function makePerturbedRest(baseRest,k,signedDelta,out){
 out.set(baseRest);
 const n=baseRest.length/3,scale=signedDelta*Math.sqrt(Number(eig.data[k])),off=k*n*3;
 for(let i=0;i<n*3;i++)out[i]+=dirsLow[off+i]*scale;
 return out
}
function solveSmallLinear(A,b,n){
 const M=A.map(r=>Float64Array.from(r)),x=Float64Array.from(b);
 for(let c=0;c<n;c++){
  let piv=c,max=Math.abs(M[c][c]);for(let r=c+1;r<n;r++){const v=Math.abs(M[r][c]);if(v>max){max=v;piv=r}}
  if(max<1e-10)throw new Error("Mess-Jacobian ist numerisch singulär");
  if(piv!==c){const tr=M[c];M[c]=M[piv];M[piv]=tr;const tv=x[c];x[c]=x[piv];x[piv]=tv}
  const d=M[c][c];for(let j=c;j<n;j++)M[c][j]/=d;x[c]/=d;
  for(let r=0;r<n;r++)if(r!==c){const f=M[r][c];if(Math.abs(f)<1e-14)continue;for(let j=c;j<n;j++)M[r][j]-=f*M[c][j];x[r]-=f*x[c]}
 }
 return x
}
function semanticPcCorrection(metricResidual){
 const M=ANALYSIS_METRICS.length,K=shapeAnalysis.pcCount,J=shapeAnalysis.jacobian;
 const G=Array.from({length:M},()=>new Float64Array(M));let trace=0;
 for(let i=0;i<M;i++)for(let j=0;j<M;j++){let s=0;for(let k=0;k<K;k++)s+=J[i][k]*J[j][k];G[i][j]=s;if(i===j)trace+=s}
 const lambda=Math.max(1e-5,(trace/Math.max(1,M))*.0015);
 for(let i=0;i<M;i++)G[i][i]+=lambda;
 const y=solveSmallLinear(G,metricResidual,M),d=new Float64Array(128);
 for(let k=0;k<K;k++){let s=0;for(let i=0;i<M;i++)s+=J[i][k]*y[i];d[k]=s}
 return d
}
function modifierQuality(metricIndex){
 const M=ANALYSIS_METRICS.length,K=shapeAnalysis.pcCount,target=new Float64Array(M);target[metricIndex]=1;
 try{
  const d=semanticPcCorrection(target),pred=new Float64Array(M);let norm=0;
  for(let k=0;k<K;k++){norm+=d[k]*d[k];for(let i=0;i<M;i++)pred[i]+=shapeAnalysis.jacobian[i][k]*d[k]}
  norm=Math.sqrt(norm);
  const gain=Math.abs(pred[metricIndex]),cross=Math.max(0,...Array.from(pred).map((v,i)=>i===metricIndex?0:Math.abs(v)));
  const good=gain>.88&&cross<.18&&norm<2.2,mid=gain>.7&&cross<.4&&norm<4;
  return {label:good?"lokal gut":mid?"lokal mittel":"lokal schwach",cls:good?"ok":mid?"warn":"bad",gain,cross,norm}
 }catch(e){return {label:"nicht lösbar",cls:"bad",gain:0,cross:Infinity,norm:Infinity}}
}
function buildSemanticControls(){
 const box=$("#semanticControls");box.innerHTML="";
 shapeAnalysis.targets={};
 ANALYSIS_METRICS.forEach((d,i)=>{
  const b=shapeAnalysis.baseMetrics[d.key],q=modifierQuality(i);
  shapeAnalysis.targets[d.key]=b;
  const row=document.createElement("div");row.className="semanticControl";
  row.innerHTML=`<div class="semanticHead"><b>${d.label}</b><em class="${q.cls}">${q.label}</em></div>
   <div class="semanticSlider"><input type="range" min="${(b-d.range).toFixed(1)}" max="${(b+d.range).toFixed(1)}" step=".1" value="${b.toFixed(1)}"><output>${b.toFixed(1)} cm</output></div>
   <small>Basis ${b.toFixed(1)} cm · lokale 1-cm-Richtung: ${q.norm.toFixed(2)}σ · Rest-Crosstalk ${Number.isFinite(q.cross)?q.cross.toFixed(2):"∞"} cm</small>`;
  const r=row.querySelector("input"),o=row.querySelector("output");
  r.oninput=()=>{
   shapeAnalysis.targets[d.key]=Number(r.value);o.value=Number(r.value).toFixed(1)+" cm";
   clearTimeout(shapeAnalysis.debounce);shapeAnalysis.debounce=setTimeout(()=>applySemanticTargetsLive(),65)
  };
  box.appendChild(row)
 });
 $("#semanticBox").classList.remove("hidden");
 info("#semanticInfo","Die Regler sind keine umbenannten PCs: Jeder Zielwert wird als Kombination der analysierten PCA-Richtungen gelöst. Alle anderen sichtbaren Messgrößen werden dabei als Gegenbedingungen möglichst konstant gehalten.")
}
async function applySemanticTargetsLive(){
 if(!shapeAnalysis.ready||shapeAnalysis.running)return;
 const token=++shapeAnalysis.semanticToken;shapeAnalysis.internal=true;
 try{
  setState("#analysisState","MODIFIKATOR LÄUFT","ok");
  coeff.set(shapeAnalysis.baseCoeff);
  let current=shapeAnalysis.baseMetrics;
  const target=ANALYSIS_METRICS.map(d=>shapeAnalysis.targets[d.key]);
  let hitLimit=false;
  for(let iter=0;iter<4;iter++){
   if(token!==shapeAnalysis.semanticToken)return;
   const cur=analyzerMetricArray(current),res=Float64Array.from(target.map((v,i)=>v-cur[i]));
   const maxErr=Math.max(...Array.from(res,Math.abs));if(maxErr<.12)break;
   const d=semanticPcCorrection(res);
   for(let k=0;k<shapeAnalysis.pcCount;k++){
    const next=coeff[k]+d[k],clamped=clamp(next,-3,3);if(Math.abs(clamped-next)>.001)hitLimit=true;coeff[k]=clamped
   }
   const rest=rebuildRestShape();applyAnalyzerRest(rest,analyzerIdentityRelative());
   current=measureCurrentRestShape();shapeAnalysis.lastMetrics=current;
   renderAnalyzerMetrics(current,shapeAnalysis.baseMetrics);updateMeasurementOverlay(current);syncRawPcUi();
   info("#semanticInfo",`Live-Solver Iteration ${iter+1}/4 · größter Messfehler vor Korrektur ${maxErr.toFixed(2)} cm${hitLimit?" · PCA ±3σ-Grenze erreicht":""}`);
   await nextPaint(28)
  }
  if(token!==shapeAnalysis.semanticToken)return;
  const finalM=measureCurrentRestShape();shapeAnalysis.lastMetrics=finalM;renderAnalyzerMetrics(finalM,shapeAnalysis.baseMetrics);updateMeasurementOverlay(finalM);
  const errs=ANALYSIS_METRICS.map((d,i)=>finalM[d.key]-target[i]),maxFinal=Math.max(...errs.map(Math.abs));
  info("#semanticInfo",`✓ Semantischer Modifier angewendet · max. Zielabweichung ${maxFinal.toFixed(2)} cm${hitLimit?" · mindestens ein PC an ±3σ begrenzt":""}
Aktueller Körper bleibt in T-Pose, damit die Messlinien direkt mit dem Modell vergleichbar bleiben.`);
  setState("#analysisState",maxFinal<.5?"MODIFIKATOREN AKTIV":"ANNÄHERUNG","ok")
 }catch(e){
  console.error(e);setState("#analysisState","MODIFIER FEHLER","bad");info("#semanticInfo",`${e?.name||"Fehler"}: ${e?.message||String(e)}`)
 }finally{shapeAnalysis.internal=false}
}
async function resetSemanticModifiers(){
 if(!shapeAnalysis.baseCoeff)return;
 ++shapeAnalysis.semanticToken;shapeAnalysis.internal=true;
 try{
  coeff.set(shapeAnalysis.baseCoeff);const rest=rebuildRestShape();applyAnalyzerRest(rest,analyzerIdentityRelative());
  const m=measureCurrentRestShape();shapeAnalysis.lastMetrics=m;
  for(const d of ANALYSIS_METRICS)shapeAnalysis.targets[d.key]=shapeAnalysis.baseMetrics[d.key];
  document.querySelectorAll(".semanticControl").forEach((row,i)=>{const d=ANALYSIS_METRICS[i],b=shapeAnalysis.baseMetrics[d.key],r=row.querySelector("input"),o=row.querySelector("output");r.value=b.toFixed(1);o.value=b.toFixed(1)+" cm"});
  renderAnalyzerMetrics(m,shapeAnalysis.baseMetrics);updateMeasurementOverlay(m);syncRawPcUi();setState("#analysisState","ANALYSE BEREIT","ok");info("#semanticInfo","Semantische Modifikatoren auf die analysierte Basis zurückgesetzt.")
 }finally{shapeAnalysis.internal=false}
}
async function startFullShapeAnalysis(){
 if(shapeAnalysis.running)return;
 try{
  if(shapeEngine!=="soma-pca")throw new Error("Der alte 128-PC-Analyzer gilt nur für SOMA-PCA. Für v0.5.12 Anny direkt über die nativen Parameter testen.");
  if(currentRigMode!=="current-expanded"||!poseReady)throw new Error("Zuerst Current Expanded 122-Joint LBS in Punkt 5 aktivieren.");
  stopPoseAnimation(false);shapeAnalysis.running=true;shapeAnalysis.ready=false;shapeAnalysis.stale=false;shapeAnalysis.internal=true;
  const token=++shapeAnalysis.cancelToken,btn=$("#startShapeAnalysis"),cancel=$("#cancelShapeAnalysis");btn.disabled=true;cancel.disabled=false;
  setState("#analysisState","SCAN LÄUFT","warn");$("#analysisBar").style.width="0%";
  info("#analysisInfo","Die App schaltet für die Messung in die T-Pose und fährt jetzt jeden der 128 SOMA-PCs sichtbar mit ±0,35σ ab. Das Modell im Viewport ist dabei der reale Scan – keine Hintergrundsimulation.");
  const identity=analyzerIdentityRelative();poseEulerDeg?.fill(0);syncPoseSlidersFromJoint();applyRelativePoseMatrices(currentDisplayRest(),identity,false,false,"Analyzer T-Pose");
  shapeAnalysis.baseCoeff=Float32Array.from(coeff);shapeAnalysis.baseRest=Float32Array.from(rebuildRestShape());currentRestLow.set(shapeAnalysis.baseRest);recomputeAdaptiveRig();applyRelativePoseMatrices(currentDisplayRest(),identity,false,false,"Analyzer Basis");
  const base=measureCurrentRestShape();shapeAnalysis.baseMetrics=base;shapeAnalysis.lastMetrics=base;renderAnalyzerMetrics(base);updateMeasurementOverlay(base);
  const M=ANALYSIS_METRICS.length,K=128,J=Array.from({length:M},()=>new Float32Array(K)),plusRest=new Float32Array(shapeAnalysis.baseRest.length),minusRest=new Float32Array(shapeAnalysis.baseRest.length),delta=shapeAnalysis.scanDelta;
  for(let k=0;k<K;k++){
   if(token!==shapeAnalysis.cancelToken)throw new Error("Analyse vom Nutzer gestoppt");
   makePerturbedRest(shapeAnalysis.baseRest,k,delta,plusRest);applyAnalyzerRest(plusRest,identity);
   setState("#analysisPc",`PC ${k+1}/128 · +${delta.toFixed(2)}σ`,"warn");$("#analysisBar").style.width=((k+.35)/K*100).toFixed(1)+"%";await nextPaint(16);
   const mp=analyzerMetricArray(measureCurrentRestShape());
   makePerturbedRest(shapeAnalysis.baseRest,k,-delta,minusRest);applyAnalyzerRest(minusRest,identity);
   setState("#analysisPc",`PC ${k+1}/128 · −${delta.toFixed(2)}σ`,"warn");$("#analysisBar").style.width=((k+.75)/K*100).toFixed(1)+"%";await nextPaint(16);
   const mm=analyzerMetricArray(measureCurrentRestShape());
   for(let i=0;i<M;i++)J[i][k]=(mp[i]-mm[i])/(2*delta)
  }
  coeff.set(shapeAnalysis.baseCoeff);currentRestLow.set(shapeAnalysis.baseRest);applyAnalyzerRest(shapeAnalysis.baseRest,identity);
  const restored=measureCurrentRestShape();shapeAnalysis.baseMetrics=restored;shapeAnalysis.lastMetrics=restored;shapeAnalysis.jacobian=J;shapeAnalysis.pcCount=128;shapeAnalysis.ready=true;shapeAnalysis.running=false;
  renderAnalyzerMetrics(restored);updateMeasurementOverlay(restored);buildSemanticControls();syncRawPcUi();
  $("#analysisBar").style.width="100%";setState("#analysisPc","128/128 PCs vermessen","ok");setState("#analysisState","128 PCs ANALYSIERT","ok");
  const qualities=ANALYSIS_METRICS.map((d,i)=>`${d.short}: ${modifierQuality(i).label}`).join(" · ");
  info("#analysisInfo",`✓ Lokale 7×128-Mess-Jacobian am aktuellen Körper erzeugt.
${qualities}

Wichtig: Umfang/Tiefe sind in v0.5.12 bewusst sichtbare Slice-Proxies. Die Mathematik des Modifiers wird damit real getestet; die endgültigen BODY-LAB-Messdefinitionen werden später gegen echte anthropometrische Landmarken/Messregeln validiert.`);
  updateDecision()
 }catch(e){
  console.error(e);
  shapeAnalysis.running=false;shapeAnalysis.ready=false;
  // Always leave the mannequin in the known analysis basis instead of a half-scanned PC.
  try{
   if(shapeAnalysis.baseCoeff&&shapeAnalysis.baseRest){
    coeff.set(shapeAnalysis.baseCoeff);currentRestLow.set(shapeAnalysis.baseRest);
    applyAnalyzerRest(shapeAnalysis.baseRest,analyzerIdentityRelative());syncRawPcUi()
   }
  }catch(restoreError){console.warn("Analyzer restore failed",restoreError)}
  setState("#analysisState",String(e?.message||e).includes("gestoppt")?"GESTOPPT":"ANALYSE FEHLER",String(e?.message||e).includes("gestoppt")?"warn":"bad");
  info("#analysisInfo",`${e?.name||"Fehler"}: ${e?.message||String(e)}`)
 }finally{
  shapeAnalysis.internal=false;$("#startShapeAnalysis").disabled=currentRigMode!=="current-expanded";$("#cancelShapeAnalysis").disabled=true
 }
}
function cancelShapeAnalysis(){
 if(!shapeAnalysis.running)return;++shapeAnalysis.cancelToken
}

function buildSliders(){
 const box=$("#sliders");box.innerHTML="";
 for(let i=0;i<10;i++){const d=document.createElement("div");d.className="slider";d.innerHTML=`<label>PC ${i+1}</label><input type="range" min="-3" max="3" step=".05" value="0"><output>0.00</output>`;const r=d.querySelector("input"),o=d.querySelector("output");r.oninput=()=>{coeff[i]=+r.value;o.value=(+r.value).toFixed(2);markShapeAnalysisStale(`PC ${i+1} wurde manuell verändert`);updateShape()};box.appendChild(d)}
}
function frame(){
 if(!mesh)return;geometry.computeBoundingBox();const b=geometry.boundingBox,c=new THREE.Vector3(),s=new THREE.Vector3();b.getCenter(c);b.getSize(s);orbit.target.copy(c);const d=Math.max(2.5,s.y*1.45);cam.position.set(0,c.y,d);orbit.update()
}
$("#loadShape").onclick=loadShape;$("#frame").onclick=frame;
$("#front").onclick=()=>{if(!mesh)return;const c=orbit.target,d=cam.position.distanceTo(c);cam.position.set(c.x,c.y,c.z+d);cam.lookAt(c);orbit.update()};
$("#side").onclick=()=>{if(!mesh)return;const c=orbit.target,d=cam.position.distanceTo(c);cam.position.set(c.x+d,c.y,c.z);cam.lookAt(c);orbit.update()};
$("#reset").onclick=()=>{coeff.fill(0);document.querySelectorAll("#sliders .slider input").forEach((r,i)=>{r.value=0;r.nextElementSibling.value="0.00"});markShapeAnalysisStale("Shape wurde auf PCA-Null zurückgesetzt");updateShape()};
$("#random").onclick=()=>{coeff.fill(0);for(let i=0;i<12;i++)coeff[i]=(Math.random()*2-1)*1.6;document.querySelectorAll("#sliders .slider input").forEach((r,i)=>{r.value=coeff[i];r.nextElementSibling.value=coeff[i].toFixed(2)});markShapeAnalysisStale("Zufalls-Shape wurde erzeugt");updateShape()};


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

function disposeRigDebugObjects(){
 if(!rigGroup)return;scene.remove(rigGroup);for(const o of [rigBoneLines,rigJointPoints,rigAxesX,rigAxesY,rigAxesZ]){o?.geometry?.dispose();o?.material?.dispose()}rigGroup=rigBoneLines=rigJointPoints=rigAxesX=rigAxesY=rigAxesZ=null;rigDebugJointCount=0
}
function rigDebugData(){
 if(currentRigMode==="current-expanded"&&rigDebugUseExpanded&&currentTargetPoseWorld)return {world:currentTargetPoseWorld,parents:targetParents,count:targetJointCount,label:`Expanded ${targetJointCount}`};
 return {world:currentPoseWorld,parents:poseParents,count:poseJointCount,label:`Public ${poseJointCount}`}
}
function ensureRigDebugObjects(){
 if(!poseReady)return;const d=rigDebugData();if(!d.world)return;if(rigGroup&&rigDebugJointCount===d.count)return;if(rigGroup)disposeRigDebugObjects();rigDebugJointCount=d.count;rigGroup=new THREE.Group();
 const boneGeo=new THREE.BufferGeometry();boneGeo.setAttribute("position",new THREE.BufferAttribute(new Float32Array(Math.max(0,d.count-1)*2*3),3));rigBoneLines=new THREE.LineSegments(boneGeo,new THREE.LineBasicMaterial({color:0xffcf66,transparent:true,opacity:.95}));rigGroup.add(rigBoneLines);
 const pointGeo=new THREE.BufferGeometry();pointGeo.setAttribute("position",new THREE.BufferAttribute(new Float32Array(d.count*3),3));rigJointPoints=new THREE.Points(pointGeo,new THREE.PointsMaterial({color:0x58f0a8,size:.04,sizeAttenuation:true}));rigGroup.add(rigJointPoints);
 const makeAxis=color=>{const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.BufferAttribute(new Float32Array(d.count*2*3),3));const l=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color,transparent:true,opacity:.92}));rigGroup.add(l);return l};rigAxesX=makeAxis(0xff5d5d);rigAxesY=makeAxis(0x5dff7d);rigAxesZ=makeAxis(0x58a6ff);rigGroup.visible=rigDebugVisible;scene.add(rigGroup)
}
function refreshRigDebug(){
 if(!poseReady)return;const d=rigDebugData();if(!d.world)return;ensureRigDebugObjects();if(!rigGroup)return;rigGroup.visible=rigDebugVisible;
 const jointPos=rigJointPoints.geometry.attributes.position.array,bonePos=rigBoneLines.geometry.attributes.position.array,axisX=rigAxesX.geometry.attributes.position.array,axisY=rigAxesY.geometry.attributes.position.array,axisZ=rigAxesZ.geometry.attributes.position.array,axisScale=.09;let bp=0,ax=0;
 for(let j=0;j<d.count;j++){const o=j*16,p=transformPoint(d.world,o,0,0,0);jointPos[j*3]=p[0];jointPos[j*3+1]=p[1];jointPos[j*3+2]=p[2];if(j>0){const pp=transformPoint(d.world,d.parents[j]*16,0,0,0);bonePos[bp++]=pp[0];bonePos[bp++]=pp[1];bonePos[bp++]=pp[2];bonePos[bp++]=p[0];bonePos[bp++]=p[1];bonePos[bp++]=p[2]}const px=transformPoint(d.world,o,axisScale,0,0),py=transformPoint(d.world,o,0,axisScale,0),pz=transformPoint(d.world,o,0,0,axisScale);axisX[ax]=p[0];axisX[ax+1]=p[1];axisX[ax+2]=p[2];axisX[ax+3]=px[0];axisX[ax+4]=px[1];axisX[ax+5]=px[2];axisY[ax]=p[0];axisY[ax+1]=p[1];axisY[ax+2]=p[2];axisY[ax+3]=py[0];axisY[ax+4]=py[1];axisY[ax+5]=py[2];axisZ[ax]=p[0];axisZ[ax+1]=p[1];axisZ[ax+2]=p[2];axisZ[ax+3]=pz[0];axisZ[ax+4]=pz[1];axisZ[ax+5]=pz[2];ax+=6}
 for(const obj of [rigJointPoints,rigBoneLines,rigAxesX,rigAxesY,rigAxesZ])obj.geometry.attributes.position.needsUpdate=true;rigAxesX.visible=rigAxesVisible;rigAxesY.visible=rigAxesVisible;rigAxesZ.visible=rigAxesVisible
}
function toggleDebugTopology(){
 if(currentRigMode!=="current-expanded"||!currentTargetPoseWorld)return;rigDebugUseExpanded=!rigDebugUseExpanded;disposeRigDebugObjects();const d=rigDebugData();$("#toggleDebugTopology").textContent=rigDebugUseExpanded?`Debug: Expanded ${targetJointCount}`:`Debug: Public ${poseJointCount}`;info("#rigDebugInfo",`Rig-Debug zeigt jetzt ${d.label}. Im Expanded-Modus werden die zusätzlichen Twist-/Hilfsjoints sichtbar.`);refreshRigDebug()
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
 applyPoseToRest(currentDisplayRest(),true,true);
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
 if(rigAdaptiveEnabled&&(currentRigMode==="current-public"||currentRigMode==="current-expanded")&&currentRigPackLoaded){
  const stats=fitCurrentPublicRbfPositions();
  if(currentRigMode==="current-expanded")rebuildExpandedTargetBind();
  if(stats)updateAdaptiveRigUI(currentRigMode==="current-expanded"
   ?`✓ Current Expanded-Rig: Public-RBF-Fit → ${targetJointCount}-Joint-Target-Bindpose aktualisiert
Mittlere Public-Joint-Verschiebung ${(stats.meanShift*1000).toFixed(1)} mm · Max ${(stats.maxShift*1000).toFixed(1)} mm · ${stats.count}/${poseJointCount-1} Joints`
   :`✓ Current Public-Rig: offizielle RBF-Jointpositionen aktiv
Mittlere Joint-Verschiebung ${(stats.meanShift*1000).toFixed(1)} mm · Max ${(stats.maxShift*1000).toFixed(1)} mm · ${stats.count}/${poseJointCount-1} Joints`,`ok`);
  return stats
 }
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
 if(poseReady&&refreshPose)applyPoseToRest(currentDisplayRest(),false,false);
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
   applyPoseToRest(currentDisplayRest(),true)
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
 poseEulerDeg.fill(0);syncPoseSlidersFromJoint();applyPoseToRest(currentDisplayRest(),true)
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
  setJointEuler("LeftShin",67,0,0);
  setJointEuler("RightShin",67,0,0);
  setJointEuler("LeftFoot",28,0,0);
  setJointEuler("RightFoot",28,0,0);
  setJointEuler("LeftArm",24,0,24);
  setJointEuler("RightArm",24,0,-24);
  setJointEuler("LeftForeArm",8,0,18);
  setJointEuler("RightForeArm",8,0,-18);
 }else if(kind==="run"){
  setJointEuler("LeftLeg",38,0,8);
  setJointEuler("LeftShin",52,0,0);
  setJointEuler("LeftFoot",20,0,0);
  setJointEuler("RightLeg",-29,0,-5);
  setJointEuler("RightShin",14,0,0);
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
  setJointEuler("LeftShin",38,0,0);
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

 syncPoseSlidersFromJoint();applyPoseToRest(currentDisplayRest(),true)
}

// Synthetic poses use the now verified SOMA relative-joint convention.
// v0.1.9: knee/shin flexion sign corrected; NVIDIA motion path is untouched.
function setWalkAnimationPose(seconds){
 poseEulerDeg.fill(0);
 const p=seconds*Math.PI*2*.82;
 const s=Math.sin(p),c=Math.cos(p),s2=Math.sin(p*2);

 setJointEuler("LeftLeg",31*s,0,4*c);
 setJointEuler("RightLeg",-31*s,0,-4*c);
 setJointEuler("LeftShin",8+34*Math.max(0,-s),0,0);
 setJointEuler("RightShin",8+34*Math.max(0,s),0,0);
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
 setJointEuler("LeftShin",12+42*Math.max(0,-b),0,0);
 setJointEuler("RightShin",12+42*Math.max(0,b),0,0);
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
function rotvecToMat3(x,y,z,out,o){
 const th=Math.hypot(x,y,z);
 if(th<1e-10){mat3Identity(out,o);return}
 const kx=x/th,ky=y/th,kz=z/th,c=Math.cos(th),s=Math.sin(th),v=1-c;
 out[o]=kx*kx*v+c;out[o+1]=kx*ky*v-kz*s;out[o+2]=kx*kz*v+ky*s;
 out[o+3]=ky*kx*v+kz*s;out[o+4]=ky*ky*v+c;out[o+5]=ky*kz*v-kx*s;
 out[o+6]=kz*kx*v-ky*s;out[o+7]=kz*ky*v+kx*s;out[o+8]=kz*kz*v+c
}
function convertSomaRotvecMotion(pack){
 const p=pack?.poses;if(!p)throw new Error("NPZ enthält kein Array 'poses'.");
 const sh=p.shape;if(sh.length!==3||sh[2]!==3)throw new Error(`poses Shape ${JSON.stringify(sh)}; erwartet [Frames,Joints,3].`);
 const T=sh[0],J=sh[1];if(J!==77&&J!==78)throw new Error(`SOMA poses hat ${J} Joints; erwartet 77 oder 78.`);
 let names=null;
 if(pack.joint_names?.data&&Array.isArray(pack.joint_names.data)&&pack.joint_names.data.length===J)names=pack.joint_names.data.map(String);
 const map=new Int16Array(poseJointCount);map.fill(-1);
 if(names){
  const by=new Map(names.map((n,i)=>[n,i]));
  for(let j=1;j<poseJointCount;j++)if(by.has(PUBLIC_JOINT_NAMES[j]))map[j]=by.get(PUBLIC_JOINT_NAMES[j])
 }else if(J===77){for(let j=1;j<poseJointCount;j++)map[j]=j-1}
 else{for(let j=1;j<poseJointCount;j++)map[j]=j}
 const missing=[];for(let j=1;j<poseJointCount;j++)if(map[j]<0)missing.push(PUBLIC_JOINT_NAMES[j]);
 if(missing.length)throw new Error(`Motion-Joint-Mapping fehlt für ${missing.slice(0,8).join(", ")}${missing.length>8?" …":""}`);
 const out=new Float32Array(T*poseJointCount*9);
 for(let f=0;f<T;f++){
  const dst=f*poseJointCount*9;for(let j=0;j<poseJointCount;j++)mat3Identity(out,dst+j*9);
  for(let j=1;j<poseJointCount;j++){
   const src=(f*J+map[j])*3;
   rotvecToMat3(Number(p.data[src]),Number(p.data[src+1]),Number(p.data[src+2]),out,dst+j*9)
  }
 }
 return {data:out,frames:T,rawJ:J,format:"SOMA rotvec NPZ",hasRootTranslation:!!pack.root_translation}
}

const MIXAMO_REQUIRED_BONES=["hips","spine","spine1","spine2","neck","head",
 "leftshoulder","leftarm","leftforearm","lefthand","rightshoulder","rightarm","rightforearm","righthand",
 "leftupleg","leftleg","leftfoot","lefttoebase","rightupleg","rightleg","rightfoot","righttoebase"];
function collectMixamoBones(root){
 const bones=new Map(),boneNames=[];
 root.traverse(o=>{
  if(!o.isBone)return;
  const k=mixamoBoneKey(o.name);
  if(k&&!bones.has(k))bones.set(k,o);
  boneNames.push(o.name)
 });
 return {bones,boneNames}
}
const MIXAMO_MOTION_OPTIONAL_TERMINALS=new Set([
 "headtopend",
 "lefthandthumb4","lefthandindex4","lefthandmiddle4","lefthandring4","lefthandpinky4",
 "righthandthumb4","righthandindex4","righthandmiddle4","righthandring4","righthandpinky4"
]);
function validateMixamoReferenceBones(bones,label="Mixamo-Referenzpose"){
 const expected=new Set(MIXAMO_XBOT_CONTRACT.map(b=>mixamoBoneKey(b.name)));
 const missing=[...expected].filter(k=>!bones.has(k));
 const extras=[...bones.keys()].filter(k=>!expected.has(k));
 if(missing.length||bones.size!==65){
  throw new Error(`${label}: für die Referenz wird der vollständige 65-Bone-X-Bot-Vertrag benötigt. Gefunden ${bones.size}. Fehlend: ${missing.slice(0,8).join(", ")}${missing.length>8?" …":""}${extras.length?` · zusätzliche Bones: ${extras.slice(0,5).join(", ")}`:""}`);
 }
 return {contractId:"xbot65",kind:"full65",missing:[]}
}
function validateMixamoAnimationBones(bones,label="Mixamo-Animation"){
 const expected=new Set(MIXAMO_XBOT_CONTRACT.map(b=>mixamoBoneKey(b.name)));
 const missing=[...expected].filter(k=>!bones.has(k));
 const extras=[...bones.keys()].filter(k=>!expected.has(k));

 // Mixamo commonly prunes non-animated terminal/end bones from an animation
 // download. The current XBotContract65 therefore legitimately comes back as
 // 54 motion bones: 65 minus HeadTop_End and the ten terminal Finger4 bones.
 // The converter already reconstructs those missing terminals by inheritance.
 const missingOnlyMotionTerminals=missing.length>0&&missing.every(k=>MIXAMO_MOTION_OPTIONAL_TERMINALS.has(k));
 const allCorePresent=MIXAMO_REQUIRED_BONES.every(k=>bones.has(k));
 const validFull=bones.size===65&&missing.length===0&&extras.length===0;
 const validPruned=bones.size===54&&missing.length===11&&missingOnlyMotionTerminals&&allCorePresent&&extras.length===0;

 if(!validFull&&!validPruned){
  throw new Error(`${label}: kein kompatibler aktueller X-Bot-Motion-Vertrag. Gefunden ${bones.size} Bones. Fehlend: ${missing.slice(0,12).join(", ")}${missing.length>12?" …":""}${extras.length?` · zusätzliche Bones: ${extras.slice(0,5).join(", ")}`:""}`);
 }
 return {contractId:"xbot65",kind:validFull?"full65":"mixamo-motion54",missing}
}
async function loadMixamoReferenceFile(file){
 if(!file)throw new Error("Keine Referenzdatei gewählt.");
 const FBXLoader=await getMixamoFbxLoaderClass(),loader=new FBXLoader();
 setState("#userAnimRefState","LÄDT","warn");
 const u8=new Uint8Array(await file.arrayBuffer());
 const root=loader.parse(u8.buffer.slice(u8.byteOffset,u8.byteOffset+u8.byteLength),"");
 if(!root)throw new Error("FBXLoader konnte die Referenzdatei nicht lesen.");
 root.updateMatrixWorld(true);
 const {bones}=collectMixamoBones(root);
 const validation=validateMixamoReferenceBones(bones,"Mixamo-Referenzpose");
 const missing=MIXAMO_REQUIRED_BONES.filter(k=>!bones.has(k));
 if(missing.length)throw new Error(`Keine kompatible Mixamo-T-Pose. Fehlende Bones: ${missing.join(", ")}`);

 // CRITICAL v0.5.12 FIX:
 // A Mixamo-returned T-pose FBX preserves our original static bind skeleton and
 // stores Mixamo's actual T-pose as ANIMATION CURVES. v0.5.8 incorrectly read
 // the untouched static skeleton as the reference. That makes a T-pose clip
 // itself non-zero, especially in hands/fingers. We must evaluate the T-pose
 // clip first, then capture those animated world orientations as reference zero.
 const clip=root.animations?.[0];
 if(!clip)throw new Error("Diese FBX enthält keine Mixamo-T-Pose-Animation. Bitte NICHT den direkten Sammy-App-Export als Referenz verwenden, sondern die bei Mixamo mit T-Pose versehene und wieder heruntergeladene FBX.");

 const staticQ=new Map(),tmpQ=new THREE.Quaternion(),tmpV=new THREE.Vector3();
 for(const [k,b] of bones){b.getWorldQuaternion(tmpQ);staticQ.set(k,tmpQ.clone())}

 const mixer=new THREE.AnimationMixer(root),action=mixer.clipAction(clip);
 action.reset().play();mixer.setTime(0);root.updateMatrixWorld(true);
 const bindQ=new Map(),bindPos=new Map();
 let changed=0,maxChangeDeg=0,maxChangeBone="";
 for(const [k,b] of bones){
  b.getWorldQuaternion(tmpQ);bindQ.set(k,tmpQ.clone());
  b.getWorldPosition(tmpV);bindPos.set(k,tmpV.clone());
  const deg=THREE.MathUtils.radToDeg(staticQ.get(k).angleTo(tmpQ));
  if(deg>.01)changed++;
  if(deg>maxChangeDeg){maxChangeDeg=deg;maxChangeBone=k}
 }
 action.stop();mixer.stopAllAction();mixer.uncacheRoot(root);

 mixamoReferencePose={bindQ,bindPos,boneCount:bones.size,contractId:validation.contractId,clipName:clip.name||"T-Pose",changed,maxChangeDeg,maxChangeBone};
 mixamoReferenceName=file.name||"T-Pose.fbx";
 setState("#userAnimRefState","BEREIT","ok");
 info("#userAnimRefInfo",`✓ ${mixamoReferenceName}
Bones: ${bones.size}/65 ✓ · aktueller XBotContract65 erkannt
Referenzquelle: ANIMIERTE Mixamo-T-Pose (${clip.name||"Clip"}), nicht statische FBX-Bindpose
Mixamo-T-Pose unterscheidet ${changed} Bones >0,01° von der statischen Bridge · max ${maxChangeDeg.toFixed(1)}° bei ${maxChangeBone||"?"}
Diese animierten Weltorientierungen sind jetzt der Nullpunkt für nachfolgende Mixamo-Animationen.`)
}
function clearMixamoReferenceFile(){
 mixamoReferencePose=null;mixamoReferenceName="";
 setState("#userAnimRefState","OPTIONAL","warn");
 info("#userAnimRefInfo","Für sauberes Mixamo-Retargeting bitte den MIXAMO-RÜCKEXPORT der T-Pose laden – nicht den direkten Sammy-App-Export. v0.5.12 wertet zuerst den T-Pose-Animationsclip aus und benutzt dessen Weltorientierungen als Nullreferenz.")
}
function mixamoBoneKey(name){
 return String(name||"").toLowerCase().replace(/^.*?mixamorig[:_]?/,"").replace(/[^a-z0-9]/g,"")
}
function detectAnimationFps(clip){
 let best=null;
 for(const tr of clip?.tracks||[]){
  const t=tr.times;if(!t||t.length<3)continue;
  if(!best||t.length>best.length)best=t
 }
 if(!best)return 30;
 const diffs=[];
 for(let i=1;i<best.length;i++){const d=Number(best[i]-best[i-1]);if(d>1e-5&&d<1)diffs.push(d)}
 if(!diffs.length)return 30;
 diffs.sort((a,b)=>a-b);
 const dt=diffs[Math.floor(diffs.length/2)],fps=Math.round(1/dt);
 return Math.max(1,Math.min(120,Number.isFinite(fps)?fps:30))
}
function quatToRowMat3(q,out,o){
 const x=q.x,y=q.y,z=q.z,w=q.w,xx=x*x,yy=y*y,zz=z*z,xy=x*y,xz=x*z,yz=y*z,wx=w*x,wy=w*y,wz=w*z;
 out[o]=1-2*(yy+zz);out[o+1]=2*(xy-wz);out[o+2]=2*(xz+wy);
 out[o+3]=2*(xy+wz);out[o+4]=1-2*(xx+zz);out[o+5]=2*(yz-wx);
 out[o+6]=2*(xz-wy);out[o+7]=2*(yz+wx);out[o+8]=1-2*(xx+yy)
}
function mixamoDeltaFor(bone,bindQuat,tmpWorld,tmpInv,tmpDelta){
 bone.getWorldQuaternion(tmpWorld);
 tmpInv.copy(bindQuat).invert();
 return tmpDelta.copy(tmpWorld).multiply(tmpInv).normalize()
}
async function convertMixamoFbxMotion(arrayBuffer,filename="Mixamo FBX"){
 if(!poseReady||!poseParents||poseJointCount!==78)throw new Error("SOMA Public-78 Runtime ist noch nicht bereit.");
 const FBXLoader=await getMixamoFbxLoaderClass(),loader=new FBXLoader();
 const root=loader.parse(arrayBuffer,"");
 if(!root)throw new Error("FBXLoader konnte die Datei nicht lesen.");
 const clip=root.animations?.[0];
 if(!clip)throw new Error("FBX enthält keine Animation.");

 root.updateMatrixWorld(true);
 const {bones}=collectMixamoBones(root);
 const animationValidation=validateMixamoAnimationBones(bones,"Mixamo-Animation");
 if(mixamoReferencePose?.contractId&&mixamoReferencePose.contractId!==animationValidation.contractId){
  throw new Error("Mixamo-Animation und Referenzpose stammen nicht vom selben X-Bot-Vertrag. Referenz bitte löschen oder passend neu laden.");
 }

 const missing=MIXAMO_REQUIRED_BONES.filter(k=>!bones.has(k));
 if(missing.length)throw new Error(`Kein kompatibles Mixamo/X-Bot-Rig. Fehlende Bones: ${missing.join(", ")}`);

 const bindQ=new Map(),tmpQ=new THREE.Quaternion();
 for(const [k,b] of bones){
  const refQ=mixamoReferencePose?.bindQ?.get(k);
  if(refQ)bindQ.set(k,refQ.clone());
  else {b.getWorldQuaternion(tmpQ);bindQ.set(k,tmpQ.clone())}
 }

 const fps=detectAnimationFps(clip);
 const frames=Math.max(2,Math.round(clip.duration*fps)+1);
 const mixer=new THREE.AnimationMixer(root),action=mixer.clipAction(clip);
 action.reset().play();

 const out=new Float32Array(frames*poseJointCount*9);
 const worldDelta=Array.from({length:poseJointCount},()=>new THREE.Quaternion());
 const ident=new THREE.Quaternion();
 const qWorld=new THREE.Quaternion(),qInv=new THREE.Quaternion(),qDelta=new THREE.Quaternion(),qRel=new THREE.Quaternion();
 const publicByName=new Map(PUBLIC_JOINT_NAMES.map((n,i)=>[n,i]));

 function delta(key){
  const b=bones.get(key),bq=bindQ.get(key);
  if(!b||!bq)return ident;
  return mixamoDeltaFor(b,bq,qWorld,qInv,qDelta).clone()
 }
 function setWorld(name,q){const j=publicByName.get(name);if(j!=null)worldDelta[j].copy(q)}
 function inherit(name,parentName){const j=publicByName.get(name),p=publicByName.get(parentName);if(j!=null&&p!=null)worldDelta[j].copy(worldDelta[p])}

 for(let f=0;f<frames;f++){
  const t=Math.min(clip.duration,f/fps);
  mixer.setTime(t);root.updateMatrixWorld(true);
  for(let j=0;j<poseJointCount;j++)worldDelta[j].identity();

  setWorld("Hips",delta("hips"));
  setWorld("Spine1",delta("spine"));
  setWorld("Spine2",delta("spine1"));
  setWorld("Chest",delta("spine2"));

  const qChest=worldDelta[publicByName.get("Chest")].clone();
  const qNeck=delta("neck");
  setWorld("Neck1",qChest.clone().slerp(qNeck,.5).normalize());
  setWorld("Neck2",qNeck);
  setWorld("Head",delta("head"));
  if(bones.has("headtopend"))setWorld("HeadEnd",delta("headtopend"));else inherit("HeadEnd","Head");
  inherit("Jaw","Head");inherit("LeftEye","Head");inherit("RightEye","Head");

  for(const side of ["Left","Right"]){
   const lo=side.toLowerCase();
   setWorld(`${side}Shoulder`,delta(`${lo}shoulder`));
   setWorld(`${side}Arm`,delta(`${lo}arm`));
   setWorld(`${side}ForeArm`,delta(`${lo}forearm`));
   setWorld(`${side}Hand`,delta(`${lo}hand`));
   setWorld(`${side}Leg`,delta(`${lo}upleg`));
   setWorld(`${side}Shin`,delta(`${lo}leg`));
   setWorld(`${side}Foot`,delta(`${lo}foot`));
   setWorld(`${side}ToeBase`,delta(`${lo}toebase`));
   if(bones.has(`${lo}toeend`))setWorld(`${side}ToeEnd`,delta(`${lo}toeend`));else inherit(`${side}ToeEnd`,`${side}ToeBase`);

   for(const d of ["Thumb","Index","Middle","Ring","Pinky"]){
    const dk=d.toLowerCase(),maxSoma=d==="Thumb"?3:4;
    for(let n=1;n<=maxSoma;n++){
     const key=`${lo}hand${dk}${n}`;
     if(bones.has(key))setWorld(`${side}Hand${d}${n}`,delta(key));
     else if(n===1)inherit(`${side}Hand${d}${n}`,`${side}Hand`);
     else inherit(`${side}Hand${d}${n}`,`${side}Hand${d}${n-1}`)
    }
    if(d==="Thumb"){
     const k4=`${lo}handthumb4`;
     if(bones.has(k4))setWorld(`${side}HandThumbEnd`,delta(k4));else inherit(`${side}HandThumbEnd`,`${side}HandThumb3`)
    }else inherit(`${side}Hand${d}End`,`${side}Hand${d}4`)
   }
  }

  const dst=f*poseJointCount*9;
  mat3Identity(out,dst);
  for(let j=1;j<poseJointCount;j++){
   const p=poseParents[j];
   qRel.copy(worldDelta[p]).invert().multiply(worldDelta[j]).normalize();
   quatToRowMat3(qRel,out,dst+j*9)
  }
 }

 action.stop();mixer.stopAllAction();mixer.uncacheRoot(root);
 const animatedKeys=new Set();
 for(const tr of clip.tracks||[]){
  const m=String(tr.name||"").match(/(?:mixamorig[:_]?)([^.]+)/i);
  if(m)animatedKeys.add(mixamoBoneKey(m[1]))
 }
 return {
  data:out,frames,rawJ:bones.size,format:"Mixamo FBX → SOMA 78",
  hasRootTranslation:true,fps,clipName:clip.name||filename,duration:clip.duration,
  boneCount:bones.size,animatedBoneCount:animatedKeys.size,referenceUsed:!!mixamoReferencePose,referenceName:mixamoReferenceName||"",
  mixamoSkeletonKind:animationValidation.kind,prunedTerminalCount:animationValidation.missing.length
 }
}

async function loadUserAnimationFile(file){
 try{
  if(!poseReady)throw new Error("Runtime ist noch nicht bereit.");
  if(!file)throw new Error("Keine Datei gewählt.");
  setState("#userAnimState","LÄDT","warn");
  const u8=new Uint8Array(await file.arrayBuffer()),name=file.name||"Animation",ext=name.toLowerCase().split(".").pop();
  let conv;
  if(ext==="npy"){
   const npy=parseNPY(u8);conv=convertOfficialMotionToRelative(npy);conv.format="SOMA matrix NPY";conv.hasRootTranslation=false
  }else if(ext==="npz"){
   const pack=await decodeShapeNPZ(u8);conv=convertSomaRotvecMotion(pack)
  }else if(ext==="fbx"){
   conv=await convertMixamoFbxMotion(u8.buffer.slice(u8.byteOffset,u8.byteOffset+u8.byteLength),name)
  }else throw new Error("Unterstützt werden .fbx, .npy und .npz.");
  userAnimRel=conv.data;userAnimFrames=conv.frames;userAnimLoaded=true;userAnimName=name;userAnimSource=conv.format;
  userAnimFps=conv.fps||Number($("#animImportFps")?.value||30)||30;
  if(conv.fps&&$("#animImportFps"))$("#animImportFps").value=String(conv.fps);
  $("#animUser").disabled=false;setState("#userAnimState","BEREIT","ok");
  info("#userAnimInfo",`✓ ${name}
Format: ${conv.format}
Frames: ${conv.frames} · Joints/Bones: ${conv.rawJ} → ${poseJointCount} Public-Joints
${conv.duration?`Clip: ${conv.clipName||"Mixamo"} · ${conv.duration.toFixed(2)} s · ${conv.animatedBoneCount||"?"} animierte Bones
`:""}${conv.mixamoSkeletonKind==="mixamo-motion54"?`Mixamo Motion-Skeleton: 54/65 · 11 nicht animierte Terminal-Bones wurden von Mixamo entfernt und werden von Sammy geerbt
`:""}${conv.referenceUsed?`Referenzpose: ${conv.referenceName||"geladen"} · explizite T-Pose-Kalibrierung aktiv
`:""}Playback: ${userAnimFps} fps · Root Translation: ${conv.hasRootTranslation?"vorhanden, v0.5.12 spielt bewusst in-place":"keine"}
Die Animation läuft durch denselben 78→122 Procedural-Twist/LBS-Pfad wie die eingebaute NVIDIA-Animation.`);
  return true
 }catch(e){
  console.error(e);userAnimLoaded=false;$("#animUser").disabled=true;setState("#userAnimState","FEHLER","bad");info("#userAnimInfo",`${e?.name||"Fehler"}: ${e?.message||String(e)}`);return false
 }
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
 if(mode==="user"&&!userAnimLoaded)return;
 poseAnimMode=mode;
 poseAnimRunning=true;
 poseAnimStart=performance.now();
 poseAnimLastStep=0;
 poseAnimFrames=0;poseAnimLbsSum=0;poseAnimLbsMax=0;poseAnimLastUi=0;
 const label=mode==="official"?"NVIDIA LÄUFT":mode==="user"?"IMPORT LÄUFT":mode==="walk"?"GANG LÄUFT":"STRESS LÄUFT";
 setState("#animState",label,"ok");
 setState("#poseState","POSE-KONVENTION ANIMIERT","ok");
 $("#animOfficial").classList.toggle("activeAnim",mode==="official");
 $("#animUser")?.classList.toggle("activeAnim",mode==="user");
 $("#animWalk").classList.toggle("activeAnim",mode==="walk");
 $("#animStress").classList.toggle("activeAnim",mode==="stress");
 info("#animPerf","Animation startet … 30 LBS-Updates/s Zielrate.")
}
function stopPoseAnimation(resetPose=false){
 poseAnimRunning=false;
 $("#animOfficial")?.classList.remove("activeAnim");
 $("#animUser")?.classList.remove("activeAnim");
 $("#animWalk")?.classList.remove("activeAnim");
 $("#animStress")?.classList.remove("activeAnim");
 if($("#animState"))setState("#animState","STOP","warn");
 if(resetPose&&poseEulerDeg){
  poseEulerDeg.fill(0);syncPoseSlidersFromJoint();applyPoseToRest(currentDisplayRest(),true)
 }
}
function updatePoseAnimation(now){
 if(!poseAnimRunning||!poseReady||!poseEulerDeg)return;
 const frameMs=1000/poseAnimTargetFps;
 if(poseAnimLastStep&&now-poseAnimLastStep<frameMs)return;
 poseAnimLastStep=now;

 const seconds=(now-poseAnimStart)/1000*poseAnimSpeed;
 let r;
 if(poseAnimMode==="official"||poseAnimMode==="user"){
  const isUser=poseAnimMode==="user",fps=isUser?userAnimFps:officialAnimFps,frames=isUser?userAnimFrames:officialAnimFrames,data=isUser?userAnimRel:officialAnimRel;
  const f=Math.floor(seconds*fps)%frames,off=f*poseJointCount*9;
  r=applyRelativePoseMatrices(currentDisplayRest(),data.subarray(off,off+poseJointCount*9),false,false,isUser?"Import-Motion":"NVIDIA-Motion")
 }else{
  if(poseAnimMode==="stress")setRigStressAnimationPose(seconds);
  else setWalkAnimationPose(seconds);
  r=applyPoseToRest(currentDisplayRest(),false,false)
 }
 if(!r)return;
 posePass=true;
 poseAnimFrames++;
 poseAnimLbsSum+=r.ms;
 poseAnimLbsMax=Math.max(poseAnimLbsMax,r.ms);

 if(now-poseAnimLastUi>500){
  poseAnimLastUi=now;
  const avg=poseAnimFrames?poseAnimLbsSum/poseAnimFrames:0;
  const animLabel=poseAnimMode==="official"?"NVIDIA example_animation":poseAnimMode==="user"?`Import: ${userAnimName}`:poseAnimMode==="walk"?"Gang-Loop":"Rig-Stress";
  info("#animPerf",`${animLabel} · ${poseAnimSpeed.toFixed(2)}×
LBS Ø ${avg.toFixed(1)} ms · Max ${poseAnimLbsMax.toFixed(1)} ms · ${currentDisplayRest().length/3} Vertices · ${currentRigMode==="current-expanded"?`${poseJointCount} Controls → ${targetJointCount} Skinning-Joints`:`${poseJointCount} Joints`}
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

 const pos=geometry.attributes.position.array,n=rest.length/3,useMid=n===18056;if(useMid&&!ensurePublicMidSkinning())throw new Error("Mid Public-78 Skinweights fehlen im Rig-Pack");const pIdx=useMid?poseMidBoneIndices:poseBoneIndices,pW=useMid?poseMidBoneWeights:poseBoneWeights,pK=useMid?poseMidTopK:poseTopK;
 let maxWeightErr=0;
 for(let v=0;v<n;v++){
  const x=rest[v*3],y=rest[v*3+1],z=rest[v*3+2];
  let ox=0,oy=0,oz=0,ws=0;
  for(let k=0;k<pK;k++){
   const bi=pIdx[v*pK+k],w=pW[v*pK+k];
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
 lastAppliedRelative3=new Float32Array(relative3);
 if(currentRigMode==="current-expanded")return applyCurrentExpandedPose(rest,relative3,markMoved,report,label==="SOMA-relative LBS"?"Current 122-Joint LBS":label+" · 122-Joint");
 const local=new Float32Array(poseJointCount*16);relativeToFinalLocal(relative3,local);return skinLocalMatrices(rest,local,markMoved,report,label)
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
 const rest=currentDisplayRest(),pos=geometry.attributes.position.array;
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
  currentRigMode="legacy-embedded";
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
  poseEulerDeg.fill(0);applyPoseToRest(currentDisplayRest(),false,false);

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
function bootStatus(stage,detail="",cls="warn"){setState("#startupState",stage,cls);info("#startupInfo",detail)}
async function autoStartRuntime(){
 if(autoBootRunning)return false;
 autoBootRunning=true;autoBootDone=false;$("#retryStartup").disabled=true;
 try{
  bootStatus("START 1/6","SOMA Basis/Topologie wird geladen …");
  if(!shapePass&&!(await loadShape()))throw new Error("SOMA Basis konnte nicht geladen werden.");

  bootStatus("START 2/6","Anny Low-Engine wird geladen und als Identity Engine aktiviert …");
  if(!annyPackLoaded&&!(await loadAnnyPack()))throw new Error("Anny Low-Engine konnte nicht geladen werden.");
  setShapeEngine("anny");

  bootStatus("START 3/6","Current SOMA v0026 Rig-Pack wird geladen …");
  if(!currentRigPackLoaded&&!(await loadCurrentRigPack()))throw new Error("SOMA Rig-Pack konnte nicht geladen werden.");

  bootStatus("START 4/6","78 Public Controls → 122 interne SOMA-Joints werden aktiviert …");
  if(currentRigMode!=="current-expanded"&&!activateCurrentExpandedRig())throw new Error("122-Joint-Runtime konnte nicht aktiviert werden.");

  bootStatus("START 5/6","Anny Mid 18.056 wird geladen …");
  if(!(await setDisplayLOD("mid")))throw new Error("Mid-LOD konnte nicht aktiviert werden.");

  bootStatus("START 6/6","Shape + Rig + Mid sind aktiv. Kamera wird gesetzt …");
  frame();autoBootDone=true;
  bootStatus("SAMMY RUNTIME BEREIT",`✓ Automatischer Start abgeschlossen
Identity: Anny v${annyMeta?.anny_version||"?"}
Display: MID · ${currentDisplayRest().length/3} Vertices
Rig: ${poseJointCount} Public Controls → ${targetJointCount} interne Skinning-Joints
Adaptive Rebind: ${rigAdaptiveEnabled?"AKTIV":"AUS"}
Manuelle Lade-/Rig-Buttons bleiben nur noch als Diagnose/Fallback erhalten.`,"ok");
  testRig().catch(e=>console.warn("Background rig contract check",e));
  return true
 }catch(e){
  console.error("Auto-start failed",e);
  bootStatus("START FEHLER",`${e?.name||"Fehler"}: ${e?.message||String(e)}

Die App bleibt bedienbar. „Automatik erneut starten“ versucht nur die fehlenden Schritte; persistente Assets werden aus dem iPhone-Cache wiederverwendet.`,"bad");
  return false
 }finally{autoBootRunning=false;$("#retryStartup").disabled=false}
}

$("#testRig").onclick=testRig;
$("#loadCurrentRig").onclick=loadCurrentRigPack;
$("#loadAnny").onclick=loadAnnyPack;
$("#useAnny").onclick=()=>setShapeEngine("anny");
$("#useSoma").onclick=()=>setShapeEngine("soma-pca");
$("#annyMale").onclick=()=>{annyParams.gender=0;applyAnnyParams()};
$("#annyFemale").onclick=()=>{annyParams.gender=1;applyAnnyParams()};
$("#annyMaleAvg").onclick=()=>resetAnnyPreset(0);
$("#annyFemaleAvg").onclick=()=>resetAnnyPreset(1);
$("#resetAnnyLocal").onclick=resetAnnyLocal;
$("#lodLow").onclick=()=>setDisplayLOD("low");
$("#lodMid").onclick=()=>setDisplayLOD("mid");
$("#activateCurrentRig").onclick=activateCurrentPublicRig;
$("#activateExpandedRig").onclick=activateCurrentExpandedRig;
$("#initPose").onclick=initEmbeddedPoseRig;
$("#poseReset").onclick=clearPose;
$("#poseT").onclick=()=>posePreset("tpose");
$("#poseOverhead").onclick=()=>posePreset("overhead");
$("#poseSquat").onclick=()=>posePreset("squat");
$("#poseRun").onclick=()=>posePreset("run");
$("#poseAction").onclick=()=>posePreset("action");
$("#poseGrip").onclick=()=>posePreset("grip");
$("#animOfficial").onclick=async()=>{if(!officialAnimLoaded){const ok=await loadOfficialAnimation();if(!ok)return}startPoseAnimation("official")};
$("#animFile").onchange=async e=>{const f=e.target.files?.[0];if(f)await loadUserAnimationFile(f)};
$("#animRefFile").onchange=async e=>{
 const f=e.target.files?.[0];if(!f)return;
 try{await loadMixamoReferenceFile(f)}catch(err){console.error(err);setState("#userAnimRefState","FEHLER","bad");info("#userAnimRefInfo",`${err?.name||"Fehler"}: ${err?.message||String(err)}`)}
};
$("#animRefClear").onclick=()=>clearMixamoReferenceFile();
$("#animUser").onclick=()=>startPoseAnimation("user");
$("#animImportFps").onchange=e=>{userAnimFps=Math.max(1,Math.min(120,Number(e.target.value)||30));e.target.value=String(userAnimFps)};
$("#retryStartup").onclick=autoStartRuntime;
$("#exportMixamoBridge").onclick=exportSammyMixamoBridge;
$("#animWalk").onclick=()=>startPoseAnimation("walk");
$("#animStress").onclick=()=>startPoseAnimation("stress");
$("#animStop").onclick=()=>stopPoseAnimation(false);
$("#animSpeed").oninput=e=>{
 poseAnimSpeed=Number(e.target.value);
 $("#animSpeedOut").value=poseAnimSpeed.toFixed(2)+"×"
};
$("#toggleAdaptiveRig").onclick=()=>setAdaptiveRigEnabled(!rigAdaptiveEnabled,true);
$("#rebindAdaptiveRig").onclick=()=>{if(poseReady){recomputeAdaptiveRig();applyPoseToRest(currentDisplayRest(),false,false)}};
$("#toggleRig").onclick=toggleRigDebug;
$("#toggleDebugTopology").onclick=toggleDebugTopology;
$("#toggleAxes").onclick=toggleRigAxes;
$("#debug10").onclick=()=>applySingleJointDebug(10);
$("#debug20").onclick=()=>applySingleJointDebug(20);
$("#debug30").onclick=()=>applySingleJointDebug(30);
$("#debugMinus10").onclick=()=>applySingleJointDebug(-10);
$("#startShapeAnalysis").onclick=startFullShapeAnalysis;
$("#cancelShapeAnalysis").onclick=cancelShapeAnalysis;
$("#toggleMeasureLines").onclick=toggleMeasureOverlay;
$("#resetSemantic").onclick=resetSemanticModifiers;

function updateDecision(){
 if(shapePass&&rigPass&&posePass){
  const expanded=currentRigMode==="current-expanded";
  if(expanded&&shapeEngine==="anny"&&annyPackLoaded){
   setState("#decision","ANNY → SOMA → 122 LBS AKTIV","ok");
   info("#decisionInfo",`✓ v0.5.12: Anny ersetzt nur die Identity-/Rest-Shape-Quelle. Das gerenderte Low-LOD bleibt kanonische SOMA-Topologie und läuft danach durch denselben bereits getesteten shape-adaptiven 122-Joint-LBS-Pfad.

Aktuell im Browser steuerbar: ALLE nativen Anny-Phänotypen (Gender, Age, Height, Weight, Muscle, Proportions, Cupsize, Firmness sowie die drei Legacy-Phenotype-Anteile) plus sämtliche lokalen Anny-Changes aus dem offiziellen Asset. Male/Female bleiben als schnelle Presets; der native Gender-Blend ist im Advanced-Bereich ebenfalls sichtbar.

Der entscheidende Test ist jetzt visuell: einzelne Parameter und lokale Changes isoliert bewegen, Low↔Mid vergleichen und anschließend dieselben Posen/Animationen benutzen. Mid nutzt echte 18.056 SOMA-Vertices plus die v0.5.12 18k×122-Skinweights. Wenn Shape + Rebind + Pose stabil bleiben, ist die Architektur Anny-Identity → SOMA-Rig bestätigt.

Noch NICHT behauptet: Diese nativen 0–1-Parameter treffen bereits konkrete Zentimetermaße. Das ist erst der nächste, separate Measurement-Fit.`);
  }else if(expanded&&shapeAnalysis.ready){
   setState("#decision","SOMA PCA ANALYSE AKTIV","warn");
   info("#decisionInfo","Der alte SOMA-PCA-Analyzer bleibt nur als A/B-Referenz erhalten. Für den neuen Pfad in Punkt 3A Anny laden und aktivieren.");
  }else{
   setState("#decision",expanded?"CURRENT 122-JOINT LBS AKTIV":currentRigMode==="current-public"?"CURRENT PUBLIC 78 AKTIV":"LBS + POSE-KONVENTION AKTIV","ok");
   info("#decisionInfo",expanded
    ?`✓ Current v0026 Expanded-LBS läuft. Nächster Test: Punkt 3A Anny-Pack laden, Anny aktivieren und denselben Rig-/Pose-Pfad mit Anny-Shapes testen.`
    :"Der Browser-LBS-Pfad funktioniert. Für den Anny-Integrationsnachweis bitte Expanded 122-Joint LBS in Punkt 5 aktivieren.")
  }
 }else if(shapePass&&rigPass){setState("#decision","NÄCHSTER TEST: CURRENT 122 LBS","warn");info("#decisionInfo","Shape und Current-Rig-Pack sind vorhanden. In Punkt 5 jetzt Expanded 122-Joint LBS aktivieren.")}
 else if(shapePass)setState("#decision","SHAPE BESTANDEN","ok")
}

// v0.5.12: no manual boot ritual.
setTimeout(()=>autoStartRuntime(),0);
