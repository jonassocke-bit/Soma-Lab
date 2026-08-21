
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

// v0.7.1: exact browser-side Anny blendshape engine on canonical SOMA topology.
// Low is loaded first; Mid (18,056 verts) is an optional persistent on-demand pack.
const ANNY_SOURCE_SHA="72104cac8242d1735ec06433b65bec5e26953ce7";
const ANNY_LOW_PACK_URL="./anny_soma_engine_low_v060_rigv3.npz";
const ANNY_LOW_PACK_RAW_URL="https://raw.githubusercontent.com/jonassocke-bit/Soma-Lab/main/anny_soma_engine_low_v060_rigv3.npz";
const ANNY_MID_PACK_URL="./anny_soma_engine_mid_v060_rigv3.npz";
const ANNY_MID_PACK_RAW_URL="https://raw.githubusercontent.com/jonassocke-bit/Soma-Lab/main/anny_soma_engine_mid_v060_rigv3.npz";

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


const SAMMY_MORPH_PRIMARY_CHILD={
 "Root":"Hips","Hips":"Spine1","Spine1":"Spine2","Spine2":"Chest","Chest":"Neck1",
 "Neck1":"Neck2","Neck2":"Head","Head":"HeadEnd",
 "LeftShoulder":"LeftArm","LeftArm":"LeftForeArm","LeftForeArm":"LeftHand","LeftHand":"LeftHandMiddle1",
 "RightShoulder":"RightArm","RightArm":"RightForeArm","RightForeArm":"RightHand","RightHand":"RightHandMiddle1",
 "LeftLeg":"LeftShin","LeftShin":"LeftFoot","LeftFoot":"LeftToeBase","LeftToeBase":"LeftToeEnd",
 "RightLeg":"RightShin","RightShin":"RightFoot","RightFoot":"RightToeBase","RightToeBase":"RightToeEnd"
};
for(const side of ["Left","Right"]){
 for(const f of ["Thumb","Index","Middle","Ring","Pinky"]){
  const max=f==="Thumb"?3:4;
  for(let n=1;n<=max;n++){
   SAMMY_MORPH_PRIMARY_CHILD[`${side}Hand${f}${n}`]=n===max?`${side}Hand${f}End`:`${side}Hand${f}${n+1}`
  }
 }
}

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
 annyLow:"Anny/72104cac/soma-exact-engine-low-rig-v3",
 annyMid:"Anny/72104cac/soma-exact-engine-mid-rig-v3"
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
let annyLowPack=null,annyMidPack=null,annyPackLoaded=false,annyMidLoaded=false,annyMeta=null,annyLastMs=0,annyLastCoeffs=null,annyExactRigCache=null,annyRigParity=null,annyAxis16PublicReference3=null,annyAxis16ReferenceRigCache=null;
let annyGroundOffsetY=0;
let autoBootRunning=false,autoBootDone=false;
let annyParams={gender:0,age:.70,muscle:.5,weight:.5,height:.5,proportions:.5,cupsize:.5,firmness:.5,african:.5,asian:.5,caucasian:.5};
let annyLocalValues={};

// Browser-LBS state. The currently cached Hugging-Face SOMA_neutral.npz is the
// original public SOMA v0.1 asset, whose official runtime stored the 78-joint
// rig, bind transforms and sparse skinning weights in this same NPZ.
let poseReady=false, poseParents=null, poseLocalBase=null, poseBindWorld=null, poseInvBind=null, poseTWorld=null;
let poseLocalActive=null,poseBindWorldActive=null,poseInvBindActive=null,rigAdaptiveEnabled=false;
let poseOrient3=null,poseOrientParentT3=null,poseBoneIndices=null,poseBoneWeights=null,poseEulerDeg=null,poseJointCount=0,poseTopK=8,lastAppliedRelative3=null;
let officialAnimRel=null,officialAnimFrames=0,officialAnimFps=30,officialAnimLoaded=false;

// Generic imported SOMA animation.
let userAnimRel=null,userAnimFrames=0,userAnimFps=30,userAnimLoaded=false,userAnimName="",userAnimSource="",userAnimCurrentFrame=0;
let mixamoReferencePose=null,mixamoReferenceName="";
let mixamoCompareBridge=null,mixamoCompareVisible=false;
let morphSammyTargetActive=false,morphRigLastStats=null;
let oracleModeActive=false,oracleProbe=null,oracleResult=null,oracleDisplayFrame=0;
let oracleBrowserSkeleton=null,oracleOfficialSkeleton=null,oracleOfficialMesh=null,oracleGhostBackup=null;
let oracleErrorRows=[],oracleOfficialMeshVisible=false;

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

// v0.7.1 Shape-Space Analyzer.
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
 if(sammyIntroActive)sammyUpdateIntro(n);
 else if(poseAnimRunning)updatePoseAnimation(n);
 sammyUpdateCameraTween(n);
 orbit.update();sammyUpdateCameraDebug();renderer.render(scene,cam);
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
 else if(/i1$/.test(descr))Ctor=Int8Array;
 else if(/i2$/.test(descr))Ctor=Int16Array;
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
 } else throw new Error("NPY dtype "+descr+" noch nicht unterstützt (v0.7.1 unterstützt f4/f8, i1/i2/i4/i8, u1/u2/u4 sowie U/S-Strings)");
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
  // v0.7.1: the fresh v2 rig-pack stores REAL newlines, while the very first
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
  if(midMissing.length){if(asset.cacheHit)await assetCacheDelete(ASSET_KEY.currentRig);throw new Error("Rig-Pack ist noch v1/Low-only. Für v0.7.1 bitte den neuen ‘Build Anny SOMA Engine v3’-Workflow einmal ausführen; danach erneut laden.")}
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

Der aktuelle v0.2.x-Rig-Datenstand ist als kleiner Browser-Pack vorhanden. v0.7.1 kann daraus jetzt direkt den internen Expanded-/Twist-Pfad mit ${targetNames.length} Skinning-Joints aktivieren; die Bedienung bleibt bei den 77 öffentlichen Pose-Joints.`);
  rigPass=true;updateDecision();return true
 }catch(e){
  console.error(e);currentRigPackLoaded=false;$("#activateCurrentRig").disabled=true;$("#activateExpandedRig").disabled=true;
  setState("#currentRigState","PACK FEHLT","bad");
  info("#currentRigInfo",`${e?.name||"Fehler"}: ${e?.message||String(e)}

v0.7.1 versucht den Rig-Pack in dieser Reihenfolge:
1) persistenter iPhone-Cache
2) GitHub Pages mit Cache-Busting
3) raw.githubusercontent.com als Fallback

Für Mid ist einmalig der neue Engine-v3-Workflow nötig, weil er den bisherigen Low-only-Rig-Pack um echte 18.056×122 Skinweights erweitert.`);return false
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
function downloadJsonFile(obj,filename){
 const bytes=new TextEncoder().encode(JSON.stringify(obj,null,2));
 downloadBinaryFile(bytes,filename,"application/json")
}
async function getMixamoFbxExporter(){
 if(!mixamoFbxExporterPromise){
  mixamoFbxExporterPromise=import(MIXAMO_FBX_EXPORTER_URL).catch(e=>{
   mixamoFbxExporterPromise=null;throw e
  })
 }
 return mixamoFbxExporterPromise
}

// v0.7.1: exact structural/orientation contract extracted from the uploaded
// standard Mixamo X Bot FBX. No X Bot mesh/animation is bundled.
// The body stays canonical SOMA; only the 65-bone hierarchy, names and bind-axis
// orientations mirror Mixamo's own standard character.
const MIXAMO_XBOT_CONTRACT=[{"name":"mixamorig:Hips","parent":null,"source":"Hips","r":[1.0,-5.01e-07,6e-09,5.01e-07,0.999916579,-0.012916455,0.0,0.012916455,0.999916579]},{"name":"mixamorig:Spine","parent":"mixamorig:Hips","source":"Spine1","r":[1.0,-1e-09,-3.4e-08,6e-09,0.989131765,0.147031807,3.3e-08,-0.147031807,0.989131765]},{"name":"mixamorig:Spine1","parent":"mixamorig:Spine","source":"Spine2","r":[1.0,-1e-09,-3.4e-08,6e-09,0.989131765,0.147031807,3.3e-08,-0.147031807,0.989131765]},{"name":"mixamorig:Spine2","parent":"mixamorig:Spine1","source":"Chest","r":[1.0,7.2e-08,-3.6e-08,-6.7e-08,0.992592173,0.121493946,4.4e-08,-0.121493946,0.992592173]},{"name":"mixamorig:Neck","parent":"mixamorig:Spine2","source":"Neck1","r":[1.0,7.2e-08,-3.6e-08,-6.7e-08,0.992592173,0.121493946,4.4e-08,-0.121493946,0.992592173]},{"name":"mixamorig:Head","parent":"mixamorig:Neck","source":"Head","r":[1.0,7.2e-08,-3.6e-08,-6.7e-08,0.992592173,0.121493946,4.4e-08,-0.121493946,0.992592173]},{"name":"mixamorig:HeadTop_End","parent":"mixamorig:Head","source":"HeadEnd","r":[1.0,7.2e-08,-3.6e-08,-6.7e-08,0.992592173,0.121493946,4.4e-08,-0.121493946,0.992592173]},{"name":"mixamorig:RightShoulder","parent":"mixamorig:Spine2","source":"RightShoulder","r":[-0.20569543,-0.97736421,0.049483232,-0.010190959,-0.04842246,-0.998774955,0.978562995,-0.205947725,-0.0]},{"name":"mixamorig:RightArm","parent":"mixamorig:RightShoulder","source":"RightArm","r":[-1.46e-07,-1.0,-7.9e-08,-7e-09,7.9e-08,-1.0,1.0,-1.46e-07,-7e-09]},{"name":"mixamorig:RightForeArm","parent":"mixamorig:RightArm","source":"RightForeArm","r":[-1.46e-07,-1.0,-7.9e-08,-7e-09,7.9e-08,-1.0,1.0,-1.46e-07,-7e-09]},{"name":"mixamorig:RightHand","parent":"mixamorig:RightForeArm","source":"RightHand","r":[-1.46e-07,-1.0,-7.9e-08,-7e-09,7.9e-08,-1.0,1.0,-1.46e-07,-7e-09]},{"name":"mixamorig:RightHandThumb1","parent":"mixamorig:RightHand","source":"RightHandThumb1","r":[0.396939136,-0.767534191,0.503319569,0.231208372,-0.447071892,-0.864100348,0.888246594,0.459366944,-0.0]},{"name":"mixamorig:RightHandThumb2","parent":"mixamorig:RightHandThumb1","source":"RightHandThumb2","r":[0.383746069,-0.77711582,0.498828585,0.220864615,-0.447268129,-0.866700665,0.896636926,0.442766556,-0.0]},{"name":"mixamorig:RightHandThumb3","parent":"mixamorig:RightHandThumb2","source":"RightHandThumb3","r":[0.373746489,-0.784013147,0.495617743,0.213271961,-0.447383525,-0.86854076,0.902678588,0.430315427,0.0]},{"name":"mixamorig:RightHandThumb4","parent":"mixamorig:RightHandThumb3","source":"RightHandThumbEnd","r":[0.553773862,-0.733248364,0.394564755,0.048262834,-0.444794598,-0.894331295,0.83126723,0.514300108,-0.210926978]},{"name":"mixamorig:RightHandIndex1","parent":"mixamorig:RightHand","source":"RightHandIndex1","r":[0.000328389,-0.999999946,-1.29e-06,-7e-09,1.29e-06,-1.0,0.999999946,0.000328389,-7e-09]},{"name":"mixamorig:RightHandIndex2","parent":"mixamorig:RightHandIndex1","source":"RightHandIndex2","r":[-0.000182899,-0.999999983,-1.29e-06,-7e-09,1.29e-06,-1.0,0.999999983,-0.000182899,-7e-09]},{"name":"mixamorig:RightHandIndex3","parent":"mixamorig:RightHandIndex2","source":"RightHandIndex3","r":[-7.055e-06,-1.0,-1.29e-06,-7e-09,1.29e-06,-1.0,1.0,-7.055e-06,-7e-09]},{"name":"mixamorig:RightHandIndex4","parent":"mixamorig:RightHandIndex3","source":"RightHandIndex4","r":[-0.000181169,-0.999999984,-1.306e-06,0.002005376,9.43e-07,-0.999997989,0.999997973,-0.000181172,0.002005376]},{"name":"mixamorig:RightHandMiddle1","parent":"mixamorig:RightHand","source":"RightHandMiddle1","r":[0.001003466,-0.999999497,-2.035e-06,-7e-09,2.035e-06,-1.0,0.999999497,0.001003466,-5e-09]},{"name":"mixamorig:RightHandMiddle2","parent":"mixamorig:RightHandMiddle1","source":"RightHandMiddle2","r":[-0.000696277,-0.999999758,-2.035e-06,-4e-09,2.035e-06,-1.0,0.999999758,-0.000696277,-5e-09]},{"name":"mixamorig:RightHandMiddle3","parent":"mixamorig:RightHandMiddle2","source":"RightHandMiddle3","r":[-5.2593e-05,-0.999999999,-2.035e-06,-5e-09,2.035e-06,-1.0,0.999999999,-5.2593e-05,-5e-09]},{"name":"mixamorig:RightHandMiddle4","parent":"mixamorig:RightHandMiddle3","source":"RightHandMiddle4","r":[-0.000385378,-0.999999926,-2.132e-06,0.001857623,1.416e-06,-0.999998275,0.9999982,-0.000385382,0.001857622]},{"name":"mixamorig:RightHandRing1","parent":"mixamorig:RightHand","source":"RightHandRing1","r":[-0.000311804,-0.999999951,6.1e-08,-7e-09,-6.1e-08,-1.0,0.999999951,-0.000311804,-7e-09]},{"name":"mixamorig:RightHandRing2","parent":"mixamorig:RightHandRing1","source":"RightHandRing2","r":[0.000131226,-0.999999991,6.1e-08,-7e-09,-6.1e-08,-1.0,0.999999991,0.000131226,-7e-09]},{"name":"mixamorig:RightHandRing3","parent":"mixamorig:RightHandRing2","source":"RightHandRing3","r":[0.000356836,-0.999999936,6.1e-08,-7e-09,-6.1e-08,-1.0,0.999999936,0.000356836,-7e-09]},{"name":"mixamorig:RightHandRing4","parent":"mixamorig:RightHandRing3","source":"RightHandRing4","r":[0.001955407,-0.999998088,1.3e-07,0.000292143,4.41e-07,-0.999999957,0.999998046,0.001955407,0.000292143]},{"name":"mixamorig:RightHandPinky1","parent":"mixamorig:RightHand","source":"RightHandPinky1","r":[-0.001040872,-0.999999458,9.263e-06,-7e-09,-9.263e-06,-1.0,0.999999458,-0.001040872,2e-09]},{"name":"mixamorig:RightHandPinky2","parent":"mixamorig:RightHandPinky1","source":"RightHandPinky2","r":[-0.002733332,-0.999996264,9.263e-06,-2.3e-08,-9.263e-06,-1.0,0.999996264,-0.002733332,2e-09]},{"name":"mixamorig:RightHandPinky3","parent":"mixamorig:RightHandPinky2","source":"RightHandPinky3","r":[-0.001739779,-0.999998487,9.263e-06,-1.4e-08,-9.263e-06,-1.0,0.999998487,-0.001739779,2e-09]},{"name":"mixamorig:RightHandPinky4","parent":"mixamorig:RightHandPinky3","source":"RightHandPinky4","r":[-0.001657229,-0.999998627,3.803e-06,0.003138946,-9.005e-06,-0.999995073,0.9999937,-0.001657209,0.003138956]},{"name":"mixamorig:LeftShoulder","parent":"mixamorig:Spine2","source":"LeftShoulder","r":[-0.205706635,0.977362793,-0.049464652,0.010187678,-0.048404163,-0.998775875,-0.978560673,-0.205958754,-0.0]},{"name":"mixamorig:LeftArm","parent":"mixamorig:LeftShoulder","source":"LeftArm","r":[8.24e-07,1.0,-1.169e-06,-0.0,-1.169e-06,-1.0,-1.0,8.24e-07,-0.0]},{"name":"mixamorig:LeftForeArm","parent":"mixamorig:LeftArm","source":"LeftForeArm","r":[8.24e-07,1.0,-1.169e-06,-0.0,-1.169e-06,-1.0,-1.0,8.24e-07,-0.0]},{"name":"mixamorig:LeftHand","parent":"mixamorig:LeftForeArm","source":"LeftHand","r":[8.24e-07,1.0,-1.169e-06,-0.0,-1.169e-06,-1.0,-1.0,8.24e-07,-0.0]},{"name":"mixamorig:LeftHandThumb1","parent":"mixamorig:LeftHand","source":"LeftHandThumb1","r":[0.395629978,0.768504924,-0.502868872,-0.230169579,-0.447100735,-0.864362712,-0.889100042,0.457712917,0.0]},{"name":"mixamorig:LeftHandThumb2","parent":"mixamorig:LeftHandThumb1","source":"LeftHandThumb2","r":[0.383980398,0.776979098,-0.498861237,-0.221018742,-0.447228409,-0.866681871,-0.896498616,0.443046533,-0.0]},{"name":"mixamorig:LeftHandThumb3","parent":"mixamorig:LeftHandThumb2","source":"LeftHandThumb3","r":[0.375246952,0.783113445,-0.495906299,-0.214293485,-0.447215116,-0.868376038,-0.901813743,0.43212495,0.0]},{"name":"mixamorig:LeftHandThumb4","parent":"mixamorig:LeftHandThumb3","source":"LeftHandThumbEnd","r":[0.548762734,0.739697677,-0.389495582,-0.033706567,-0.445959329,-0.894418328,-0.835298347,0.503952006,-0.219793191]},{"name":"mixamorig:LeftHandIndex1","parent":"mixamorig:LeftHand","source":"LeftHandIndex1","r":[-8.7329e-05,0.999999996,-2.502e-06,0.0,-2.502e-06,-1.0,-0.999999996,-8.7329e-05,0.0]},{"name":"mixamorig:LeftHandIndex2","parent":"mixamorig:LeftHandIndex1","source":"LeftHandIndex2","r":[0.000122867,0.999999992,-3.183e-06,-0.0,-3.183e-06,-1.0,-0.999999992,0.000122867,0.0]},{"name":"mixamorig:LeftHandIndex3","parent":"mixamorig:LeftHandIndex2","source":"LeftHandIndex3","r":[-9.631e-06,1.0,-3.853e-06,-0.0,-3.853e-06,-1.0,-1.0,-9.631e-06,0.0]},{"name":"mixamorig:LeftHandIndex4","parent":"mixamorig:LeftHandIndex3","source":"LeftHandIndex4","r":[-3.5773e-05,0.999999999,-3.857e-06,-0.000755126,-3.884e-06,-0.999999715,-0.999999714,-3.577e-05,0.000755127]},{"name":"mixamorig:LeftHandMiddle1","parent":"mixamorig:LeftHand","source":"LeftHandMiddle1","r":[-6.2469e-05,0.999999998,-1.986e-06,0.0,-1.986e-06,-1.0,-0.999999998,-6.2469e-05,0.0]},{"name":"mixamorig:LeftHandMiddle2","parent":"mixamorig:LeftHandMiddle1","source":"LeftHandMiddle2","r":[-2.0077e-05,1.0,-1.659e-06,-0.0,-1.659e-06,-1.0,-1.0,-2.0077e-05,0.0]},{"name":"mixamorig:LeftHandMiddle3","parent":"mixamorig:LeftHandMiddle2","source":"LeftHandMiddle3","r":[2.1302e-05,1.0,-8.03e-07,-0.0,-8.03e-07,-1.0,-1.0,2.1302e-05,0.0]},{"name":"mixamorig:LeftHandMiddle4","parent":"mixamorig:LeftHandMiddle3","source":"LeftHandMiddle4","r":[7.727e-05,0.999999997,-8.51e-07,-0.00204828,-6.93e-07,-0.999997902,-0.999997899,7.7272e-05,0.00204828]},{"name":"mixamorig:LeftHandRing1","parent":"mixamorig:LeftHand","source":"LeftHandRing1","r":[1.345e-05,1.0,-2.419e-06,-0.0,-2.419e-06,-1.0,-1.0,1.345e-05,-0.0]},{"name":"mixamorig:LeftHandRing2","parent":"mixamorig:LeftHandRing1","source":"LeftHandRing2","r":[1.345e-05,1.0,-2.419e-06,-0.0,-2.419e-06,-1.0,-1.0,1.345e-05,-0.0]},{"name":"mixamorig:LeftHandRing3","parent":"mixamorig:LeftHandRing2","source":"LeftHandRing3","r":[1.345e-05,1.0,-2.419e-06,-0.0,-2.419e-06,-1.0,-1.0,1.345e-05,-0.0]},{"name":"mixamorig:LeftHandRing4","parent":"mixamorig:LeftHandRing3","source":"LeftHandRing4","r":[4.5546e-05,0.999999999,-1.843e-06,0.000986874,-1.888e-06,-0.999999513,-0.999999512,4.5545e-05,-0.000986875]},{"name":"mixamorig:LeftHandPinky1","parent":"mixamorig:LeftHand","source":"LeftHandPinky1","r":[0.00409042,0.999991634,8.782e-06,3.6e-08,8.782e-06,-1.0,-0.999991634,0.00409042,-0.0]},{"name":"mixamorig:LeftHandPinky2","parent":"mixamorig:LeftHandPinky1","source":"LeftHandPinky2","r":[0.003669103,0.999993269,7.525e-06,3.2e-08,7.525e-06,-1.0,-0.999993269,0.003669103,-5e-09]},{"name":"mixamorig:LeftHandPinky3","parent":"mixamorig:LeftHandPinky2","source":"LeftHandPinky3","r":[0.00353494,0.999993752,7.314e-06,3.1e-08,7.314e-06,-1.0,-0.999993752,0.00353494,-5e-09]},{"name":"mixamorig:LeftHandPinky4","parent":"mixamorig:LeftHandPinky3","source":"LeftHandPinky4","r":[0.002944179,0.999995666,1.797e-06,-0.00156677,6.41e-06,-0.999998773,-0.999994439,0.002944172,0.001566782]},{"name":"mixamorig:RightUpLeg","parent":"mixamorig:Hips","source":"RightLeg","r":[-1.0,-2.1e-08,7e-09,2.1e-08,-0.999969607,0.007796428,7e-09,0.007796428,0.999969607]},{"name":"mixamorig:RightLeg","parent":"mixamorig:RightUpLeg","source":"RightShin","r":[-1.0,2.1e-08,9e-09,-2.2e-08,-0.997661312,-0.068351349,7e-09,-0.068351349,0.997661312]},{"name":"mixamorig:RightFoot","parent":"mixamorig:RightLeg","source":"RightFoot","r":[-1.0,-2.02e-07,1.02e-07,2.07e-07,-0.631740205,0.775180181,-9.2e-08,0.775180181,0.631740205]},{"name":"mixamorig:RightToeBase","parent":"mixamorig:RightFoot","source":"RightToeBase","r":[-1.0,-3.02e-07,2.81e-07,2.81e-07,-7.2928e-05,0.999999997,-3.02e-07,0.999999997,7.2928e-05]},{"name":"mixamorig:RightToe_End","parent":"mixamorig:RightToeBase","source":"RightToeEnd","r":[-0.999730512,-3.02e-07,-0.02321429,-0.02321429,-7.2928e-05,0.999730509,-1.995e-06,0.999999997,7.2902e-05]},{"name":"mixamorig:LeftUpLeg","parent":"mixamorig:Hips","source":"LeftLeg","r":[-1.0,-4.3e-08,7e-09,4.3e-08,-0.999969428,0.007819397,7e-09,0.007819397,0.999969428]},{"name":"mixamorig:LeftLeg","parent":"mixamorig:LeftUpLeg","source":"LeftShin","r":[-1.0,-0.0,7e-09,-0.0,-0.997659999,-0.068370512,7e-09,-0.068370512,0.997659999]},{"name":"mixamorig:LeftFoot","parent":"mixamorig:LeftLeg","source":"LeftFoot","r":[-1.0,-2.01e-07,1.12e-07,2.14e-07,-0.631740177,0.775180204,-8.6e-08,0.775180204,0.631740177]},{"name":"mixamorig:LeftToeBase","parent":"mixamorig:LeftFoot","source":"LeftToeBase","r":[-1.0,-3.01e-07,2.91e-07,2.91e-07,-7.2932e-05,0.999999997,-3.01e-07,0.999999997,7.2932e-05]},{"name":"mixamorig:LeftToe_End","parent":"mixamorig:LeftToeBase","source":"LeftToeEnd","r":[-0.999718239,-3.01e-07,0.02373695,0.02373695,-7.2932e-05,0.999718236,1.43e-06,0.999999997,7.2918e-05]}];
const MIXAMO_XBOT_BIND_POS={"mixamorig:Head":[-1.1167740467540036e-05,159.92947388295272,-1.519544836013904],"mixamorig:HeadTop_End":[-9.032325006838463e-06,181.96684254533193,5.981550311246772],"mixamorig:Hips":[-7.727290721959434e-06,104.27487182617188,1.5543158054351807],"mixamorig:LeftArm":[15.16280398737345,144.0613169434197,-5.548493116334514],"mixamorig:LeftFoot":[8.207781787278632,8.729486465454109,-2.74267363548298],"mixamorig:LeftForeArm":[43.00432564154204,144.0612843998952,-5.548470182817228],"mixamorig:LeftHand":[71.3331601752272,144.06125184318304,-5.548452286627384],"mixamorig:LeftHandIndex1":[80.44246662018536,143.54320687400264,-3.2885818548270533],"mixamorig:LeftHandIndex2":[84.1424666060649,143.54319761646747,-3.2889049733068427],"mixamorig:LeftHandIndex3":[86.9924665845382,143.54318854355162,-3.288554802246191],"mixamorig:LeftHandIndex4":[89.76733221262572,143.54317785204873,-3.288581527452206],"mixamorig:LeftHandMiddle1":[80.86656166454125,144.06127324020878,-5.548407829448358],"mixamorig:LeftHandMiddle2":[84.56656165731454,144.0612658926314,-5.548638965109337],"mixamorig:LeftHandMiddle3":[87.51656165734059,144.0612609995725,-5.548698191712874],"mixamorig:LeftHandMiddle4":[90.46942511611348,144.06125862699358,-5.548635289249731],"mixamorig:LeftHandPinky1":[79.4109415601394,143.5743653862144,-9.354708848005295],"mixamorig:LeftHandPinky2":[83.01091144311097,143.57439700191372,-9.339983336174745],"mixamorig:LeftHandPinky3":[85.11089736117005,143.5744128045394,-9.33227821942831],"mixamorig:LeftHandPinky4":[87.23641541005766,143.5744283503633,-9.324764594210082],"mixamorig:LeftHandRing1":[80.43769038202059,144.0182129663205,-7.413525827475825],"mixamorig:LeftHandRing2":[83.58769038195831,144.01820534746685,-7.413483459122235],"mixamorig:LeftHandRing3":[86.53769038190077,144.01819769136398,-7.413446424112027],"mixamorig:LeftHandRing4":[89.18200681682134,144.01819275635648,-7.413387583008608],"mixamorig:LeftHandThumb1":[73.79930097583673,142.48505615797941,-2.866718806843708],"mixamorig:LeftHandThumb2":[77.0171036834158,140.6130031455518,-0.9502315862892832],"mixamorig:LeftHandThumb3":[79.67311994929713,139.08420278085717,0.5642735030615138],"mixamorig:LeftHandThumb4":[81.6940079710372,137.9301277541478,1.6794071285865717],"mixamorig:LeftLeg":[8.20778179815179,53.15313720703123,0.30171799659729054],"mixamorig:LeftShoulder":[4.570434058827984,144.58590699501536,-3.3163728307836102],"mixamorig:LeftToeBase":[8.207779003812599,0.0008178479620539747,7.967886447906329],"mixamorig:LeftToe_End":[8.20777620817337,0.00014117703546079026,17.246023178100437],"mixamorig:LeftUpLeg":[8.207783699035648,97.52317047119146,-0.04523950815200806],"mixamorig:Neck":[-1.1632276864212932e-05,150.31158448448357,-3.204552560661874],"mixamorig:RightArm":[-15.162827141868377,144.06129423041162,-5.548499729823593],"mixamorig:RightFoot":[-8.207794193704466,8.729410171508846,-2.7428412437438388],"mixamorig:RightForeArm":[-43.00434516530863,144.06129641894498,-5.548503799133087],"mixamorig:RightHand":[-71.33318351367814,144.06129417324604,-5.548485070931586],"mixamorig:RightHandIndex1":[-80.44146740224393,143.5434327591923,-3.2886513313660655],"mixamorig:RightHandIndex2":[-84.14146720273779,143.54343753394087,-3.287436291149135],"mixamorig:RightHandIndex3":[-86.99146715506613,143.54344121268713,-3.2879575539852555],"mixamorig:RightHandIndex4":[-89.76365776784786,143.5434447896182,-3.2879771126055055],"mixamorig:RightHandMiddle1":[-80.86568473440799,144.0612550668732,-5.54851014811217],"mixamorig:RightHandMiddle2":[-84.56568287155386,144.06126259618017,-5.5447973243161],"mixamorig:RightHandMiddle3":[-87.51568215646527,144.06126861471554,-5.546851341368094],"mixamorig:RightHandMiddle4":[-90.46231088610809,144.0612746037648,-5.547006313378017],"mixamorig:RightHandPinky1":[-79.40985922265244,143.57459114056766,-9.354763679952702],"mixamorig:RightHandPinky2":[-83.00985727235272,143.57455779439576,-9.358510817893936],"mixamorig:RightHandPinky3":[-85.10984942758924,143.57453836367927,-9.364250815067884],"mixamorig:RightHandPinky4":[-87.22562730145525,143.57451875117627,-9.367931806157314],"mixamorig:RightHandRing1":[-80.43677556056942,144.01822525225458,-7.413619620513897],"mixamorig:RightHandRing2":[-83.81604840261204,144.01822504728736,-7.414673292681834],"mixamorig:RightHandRing3":[-86.70573305638166,144.01822487118628,-7.414294091534568],"mixamorig:RightHandRing4":[-89.34454856358145,144.01822471055002,-7.413352467132266],"mixamorig:RightHandThumb1":[-73.79798906754483,142.48731038443736,-2.8666334881430924],"mixamorig:RightHandThumb2":[-77.01317864323842,140.61453272160477,-0.9423520350092622],"mixamorig:RightHandThumb3":[-79.66801700056696,139.08654351500144,0.5702585782550695],"mixamorig:RightHandThumb4":[-81.68683313113226,137.93454105229316,1.6783110764053042],"mixamorig:RightLeg":[-8.207795136924904,53.153087615966854,0.3006949126720426],"mixamorig:RightShoulder":[-4.569982086496929,144.58610535851452,-3.31640209752816],"mixamorig:RightToeBase":[-8.207796980437466,0.0007403186173498,7.967719554901234],"mixamorig:RightToe_End":[-8.207799778823729,6.367982137992477e-05,17.245840072631964],"mixamorig:RightUpLeg":[-8.207794189453123,97.52320098876964,-0.04524400085210689],"mixamorig:Spine":[-1.2828927538068554e-05,114.45645904541018,1.6858367919921884],"mixamorig:Spine1":[-1.283931199672004e-05,124.35042239221895,0.2151254439192094],"mixamorig:Spine2":[-1.2848989892782088e-05,133.57119840012686,-1.1555181104463788]};
const MIXAMO_XBOT_PRIMARY_CHILD={"mixamorig:Hips":"mixamorig:Spine","mixamorig:Spine":"mixamorig:Spine1","mixamorig:Spine1":"mixamorig:Spine2","mixamorig:Spine2":"mixamorig:Neck","mixamorig:Neck":"mixamorig:Head","mixamorig:Head":"mixamorig:HeadTop_End","mixamorig:RightShoulder":"mixamorig:RightArm","mixamorig:RightArm":"mixamorig:RightForeArm","mixamorig:RightForeArm":"mixamorig:RightHand","mixamorig:RightHand":"mixamorig:RightHandMiddle1","mixamorig:RightHandThumb1":"mixamorig:RightHandThumb2","mixamorig:RightHandThumb2":"mixamorig:RightHandThumb3","mixamorig:RightHandThumb3":"mixamorig:RightHandThumb4","mixamorig:RightHandIndex1":"mixamorig:RightHandIndex2","mixamorig:RightHandIndex2":"mixamorig:RightHandIndex3","mixamorig:RightHandIndex3":"mixamorig:RightHandIndex4","mixamorig:RightHandMiddle1":"mixamorig:RightHandMiddle2","mixamorig:RightHandMiddle2":"mixamorig:RightHandMiddle3","mixamorig:RightHandMiddle3":"mixamorig:RightHandMiddle4","mixamorig:RightHandRing1":"mixamorig:RightHandRing2","mixamorig:RightHandRing2":"mixamorig:RightHandRing3","mixamorig:RightHandRing3":"mixamorig:RightHandRing4","mixamorig:RightHandPinky1":"mixamorig:RightHandPinky2","mixamorig:RightHandPinky2":"mixamorig:RightHandPinky3","mixamorig:RightHandPinky3":"mixamorig:RightHandPinky4","mixamorig:LeftShoulder":"mixamorig:LeftArm","mixamorig:LeftArm":"mixamorig:LeftForeArm","mixamorig:LeftForeArm":"mixamorig:LeftHand","mixamorig:LeftHand":"mixamorig:LeftHandMiddle1","mixamorig:LeftHandThumb1":"mixamorig:LeftHandThumb2","mixamorig:LeftHandThumb2":"mixamorig:LeftHandThumb3","mixamorig:LeftHandThumb3":"mixamorig:LeftHandThumb4","mixamorig:LeftHandIndex1":"mixamorig:LeftHandIndex2","mixamorig:LeftHandIndex2":"mixamorig:LeftHandIndex3","mixamorig:LeftHandIndex3":"mixamorig:LeftHandIndex4","mixamorig:LeftHandMiddle1":"mixamorig:LeftHandMiddle2","mixamorig:LeftHandMiddle2":"mixamorig:LeftHandMiddle3","mixamorig:LeftHandMiddle3":"mixamorig:LeftHandMiddle4","mixamorig:LeftHandRing1":"mixamorig:LeftHandRing2","mixamorig:LeftHandRing2":"mixamorig:LeftHandRing3","mixamorig:LeftHandRing3":"mixamorig:LeftHandRing4","mixamorig:LeftHandPinky1":"mixamorig:LeftHandPinky2","mixamorig:LeftHandPinky2":"mixamorig:LeftHandPinky3","mixamorig:LeftHandPinky3":"mixamorig:LeftHandPinky4","mixamorig:RightUpLeg":"mixamorig:RightLeg","mixamorig:RightLeg":"mixamorig:RightFoot","mixamorig:RightFoot":"mixamorig:RightToeBase","mixamorig:RightToeBase":"mixamorig:RightToe_End","mixamorig:LeftUpLeg":"mixamorig:LeftLeg","mixamorig:LeftLeg":"mixamorig:LeftFoot","mixamorig:LeftFoot":"mixamorig:LeftToeBase","mixamorig:LeftToeBase":"mixamorig:LeftToe_End"};

// v0.7.1 semantic hand-chain correction.
// SOMA non-thumb fingers contain one extra metacarpal articulation inside the
// palm: Hand -> Finger1(metacarpal) -> Finger2(MCP) -> Finger3(PIP)
// -> Finger4(DIP) -> FingerEnd(tip).
// Standard Mixamo/XBot uses Hand -> Finger1(MCP) -> Finger2(PIP)
// -> Finger3(DIP) -> Finger4(tip/end).
// Therefore the previous 1:1 name mapping bent the palm too early and attached
// the distal phalanx to Mixamo's terminal Finger4, which is often not animated.
for(const side of ["Left","Right"]){
 for(const f of ["Index","Middle","Ring","Pinky"]){
  for(let n=1;n<=4;n++){
   const spec=MIXAMO_XBOT_CONTRACT.find(b=>b.name===`mixamorig:${side}Hand${f}${n}`);
   if(!spec)continue;
   spec.source=n<4?`${side}Hand${f}${n+1}`:`${side}Hand${f}End`
  }
 }
}


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
  const handProxy=direct.get(`${side}Hand`);
  for(const f of ["Index","Middle","Ring","Pinky"]){
   // SOMA Finger1 is a metacarpal/palm joint that Mixamo does not have.
   // Keep its deformation with the hand/palm so the palm does not fold at an
   // artificial joint several centimeters before the knuckle.
   fallback.set(`${side}Hand${f}1`,handProxy)
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

function buildMixamoXBotSkinning(vertexCount,publicNames,bridgePos,tPoseWorld,publicByName,shift){
 const data=packArray("public_skinning_data")?.data,indices=packArray("public_skinning_indices")?.data,indptr=packArray("public_skinning_indptr")?.data;
 const shape=Array.from(packArray("public_skinning_shape")?.data||[],Number);
 if(!data||!indices||!indptr||shape[0]!==vertexCount||shape[1]!==publicNames.length)throw new Error(`Public-Skinning für X-Bot-Bridge fehlt/unerwartet: ${JSON.stringify(shape)}`);
 const srcToProxy=mixamoXBotSourceToTargetMap(publicNames),temp=Array.from({length:vertexCount},()=>new Map());
 const neckProxy=MIXAMO_XBOT_CONTRACT.findIndex(b=>b.name==="mixamorig:Neck");
 const headProxy=MIXAMO_XBOT_CONTRACT.findIndex(b=>b.name==="mixamorig:Head");
 const n1j=publicByName.get("Neck1"),hj=publicByName.get("Head");
 const n1o=n1j*16,ho=hj*16;
 const neckStart=new THREE.Vector3(tPoseWorld[n1o+3]+shift.x,tPoseWorld[n1o+7]+shift.y,tPoseWorld[n1o+11]+shift.z);
 const neckEnd=new THREE.Vector3(tPoseWorld[ho+3]+shift.x,tPoseWorld[ho+7]+shift.y,tPoseWorld[ho+11]+shift.z);
 const neckAxis=neckEnd.clone().sub(neckStart),neckLen2=Math.max(1e-12,neckAxis.lengthSq());
 const vp=new THREE.Vector3();
 for(let sj=0;sj<publicNames.length;sj++){
  const pj=Number(srcToProxy[sj]);if(pj<0)continue;
  const isUpperNeck=publicNames[sj]==="Neck2";
  for(let p=Number(indptr[sj]);p<Number(indptr[sj+1]);p++){
   const v=Number(indices[p]),w=Number(data[p]);if(v<0||v>=vertexCount||w<=1e-10)continue;
   if(isUpperNeck&&neckProxy>=0&&headProxy>=0){
    // Split each SOMA Neck2 contribution according to the actual vertex
    // position along the Neck1→Head axis; no fixed percentage guess.
    vp.set(bridgePos[v*3],bridgePos[v*3+1],bridgePos[v*3+2]);
    const alpha=THREE.MathUtils.clamp(vp.sub(neckStart).dot(neckAxis)/neckLen2,0,1);
    const wn=w*(1-alpha),wh=w*alpha;
    temp[v].set(neckProxy,(temp[v].get(neckProxy)||0)+wn);
    temp[v].set(headProxy,(temp[v].get(headProxy)||0)+wh)
   }else{
    temp[v].set(pj,(temp[v].get(pj)||0)+w)
   }
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

function transportXBotFrameToSomaSegment(baseMatrix,xbotStartArr,xbotEndArr,somaStart,somaEnd){
 const xd=new THREE.Vector3(
  xbotEndArr[0]-xbotStartArr[0],
  xbotEndArr[1]-xbotStartArr[1],
  xbotEndArr[2]-xbotStartArr[2]
 );
 const sd=somaEnd.clone().sub(somaStart);
 if(xd.lengthSq()<1e-12||sd.lengthSq()<1e-12)return baseMatrix.clone();
 xd.normalize();sd.normalize();

 // Transport the entire canonical X Bot world frame with the shortest rotation
 // from the X Bot segment direction to the matching SOMA segment direction.
 // This preserves X Bot roll/twist instead of forcing a single axis.
 const qTransport=new THREE.Quaternion().setFromUnitVectors(xd,sd);
 const p=new THREE.Vector3(),qBase=new THREE.Quaternion(),s=new THREE.Vector3();
 baseMatrix.decompose(p,qBase,s);
 const qNew=qTransport.multiply(qBase).normalize();
 return new THREE.Matrix4().compose(somaStart.clone(),qNew,s)
}

function getWorldBasisAxes(m,outX,outY,outZ){
 const e=m.elements;
 outX.set(e[0],e[1],e[2]);
 outY.set(e[4],e[5],e[6]);
 outZ.set(e[8],e[9],e[10]);
 return {x:outX,y:outY,z:outZ}
}
function rebuildWorldFrameFromSegmentAndGuide(start,end,guide,baseMatrix){
 const y=end.clone().sub(start);
 if(y.lengthSq()<1e-12)return baseMatrix.clone();
 y.normalize();
 const baseX=new THREE.Vector3(),baseY=new THREE.Vector3(),baseZ=new THREE.Vector3();
 getWorldBasisAxes(baseMatrix,baseX,baseY,baseZ);
 let x=guide.clone().addScaledVector(y,-guide.dot(y));
 if(x.lengthSq()<1e-10)x=baseX.clone().addScaledVector(y,-baseX.dot(y));
 if(x.lengthSq()<1e-10)x=baseZ.clone().addScaledVector(y,-baseZ.dot(y));
 if(x.lengthSq()<1e-10){
  x=new THREE.Vector3(1,0,0);
  if(Math.abs(x.dot(y))>.95)x.set(0,0,1);
  x.addScaledVector(y,-x.dot(y))
 }
 x.normalize();
 let z=x.clone().cross(y);
 if(z.lengthSq()<1e-10)z=baseZ.clone().addScaledVector(y,-baseZ.dot(y));
 if(z.lengthSq()<1e-10)z=y.clone().cross(x);
 z.normalize();
 x=y.clone().cross(z).normalize();
 if(x.dot(baseX)<0){x.negate();z.negate()}
 const m=new THREE.Matrix4().makeBasis(x,y,z);
 m.setPosition(start);
 return m
}
function refineThumbWorldFrames(worldMats,wmByName,side){
 const handName=`mixamorig:${side}Hand`,idxName=`mixamorig:${side}HandIndex1`,midName=`mixamorig:${side}HandMiddle1`,pkName=`mixamorig:${side}HandPinky1`;
 const hi=wmByName.get(handName),ii=wmByName.get(idxName),mi=wmByName.get(midName),pi=wmByName.get(pkName);
 if(hi==null||ii==null||mi==null||pi==null)return {fixed:0};
 const handPos=new THREE.Vector3().setFromMatrixPosition(worldMats[hi]);
 const idxPos=new THREE.Vector3().setFromMatrixPosition(worldMats[ii]);
 const midPos=new THREE.Vector3().setFromMatrixPosition(worldMats[mi]);
 const pkPos=new THREE.Vector3().setFromMatrixPosition(worldMats[pi]);
 const vI=idxPos.clone().sub(handPos),vP=pkPos.clone().sub(handPos),vM=midPos.clone().sub(handPos);
 let palmNormal=vI.clone().cross(vP);
 if(palmNormal.lengthSq()<1e-10)palmNormal=vI.clone().cross(vM);
 if(palmNormal.lengthSq()<1e-10)palmNormal=vM.clone().cross(vP);
 if(palmNormal.lengthSq()<1e-10)palmNormal.set(0,0,1);
 palmNormal.normalize();
 let prevX=null,fixed=0,maxAdjust=0,maxBone='';
 for(let n=1;n<=3;n++){
  const name=`mixamorig:${side}HandThumb${n}`,child=`mixamorig:${side}HandThumb${n+1}`;
  const i=wmByName.get(name),ci=wmByName.get(child);
  if(i==null||ci==null)continue;
  const start=new THREE.Vector3().setFromMatrixPosition(worldMats[i]);
  const end=new THREE.Vector3().setFromMatrixPosition(worldMats[ci]);
  const guide=(n===1?palmNormal.clone():prevX.clone());
  const oldX=new THREE.Vector3(),oldY=new THREE.Vector3(),oldZ=new THREE.Vector3();
  getWorldBasisAxes(worldMats[i],oldX,oldY,oldZ);
  const refined=rebuildWorldFrameFromSegmentAndGuide(start,end,guide,worldMats[i]);
  const newX=new THREE.Vector3(),newY=new THREE.Vector3(),newZ=new THREE.Vector3();
  getWorldBasisAxes(refined,newX,newY,newZ);
  const deg=THREE.MathUtils.radToDeg(Math.acos(THREE.MathUtils.clamp(oldX.dot(newX),-1,1)));
  if(deg>maxAdjust){maxAdjust=deg;maxBone=name}
  worldMats[i]=refined;prevX=newX.clone();fixed++;
 }
 return {fixed,maxAdjust,maxBone}
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
 // shoulders, arms and hands. v0.7.1 bakes the official SOMA T-pose into the
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

 const skin=buildMixamoXBotSkinning(V,publicNames,pos,tPoseWorld,publicByName,shift);
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

 // Complete orientation audit/transport for all 52 non-terminal bones.
 // Hips uses Spine as its primary child, Spine2 uses Neck, each Hand uses
 // Middle1, and every chain bone uses its anatomical next joint.
 const wmByName=new Map(MIXAMO_XBOT_CONTRACT.map((b,i)=>[b.name,i]));
 let transported=0,maxTransportDeg=0,maxTransportBone="";
 for(const [name,child] of Object.entries(MIXAMO_XBOT_PRIMARY_CHILD)){
  const i=wmByName.get(name),ci=wmByName.get(child);
  const xp0=MIXAMO_XBOT_BIND_POS[name],xp1=MIXAMO_XBOT_BIND_POS[child];
  if(i==null||ci==null||!xp0||!xp1)continue;
  const sp0=new THREE.Vector3().setFromMatrixPosition(worldMats[i]);
  const sp1=new THREE.Vector3().setFromMatrixPosition(worldMats[ci]);
  const xd=new THREE.Vector3(xp1[0]-xp0[0],xp1[1]-xp0[1],xp1[2]-xp0[2]).normalize();
  const sd=sp1.clone().sub(sp0).normalize();
  const deg=THREE.MathUtils.radToDeg(Math.acos(THREE.MathUtils.clamp(xd.dot(sd),-1,1)));
  worldMats[i]=transportXBotFrameToSomaSegment(worldMats[i],xp0,xp1,sp0,sp1);
  transported++;
  if(deg>maxTransportDeg){maxTransportDeg=deg;maxTransportBone=name}
 }
 if(transported!==52)throw new Error(`Mixamo Frame-Transport unvollständig: ${transported}/52`);
 console.info(`Mixamo XBot→SOMA Frame-Transport: ${transported}/52 · max ${maxTransportDeg.toFixed(1)}° bei ${maxTransportBone}`);

 // v0.7.1: dedicated thumb-plane refinement. The general shortest-arc frame
 // transport fixed the whole body substantially, but Mixamo still showed the
 // thumbs as the last visibly wrong chain. Thumbs need a stronger anatomical
 // guide than pure parent->child direction, so Thumb1 aligns to the palm
 // normal and Thumb2/3 propagate that twist consistently along the chain.
 const thumbL=refineThumbWorldFrames(worldMats,wmByName,'Left');
 const thumbR=refineThumbWorldFrames(worldMats,wmByName,'Right');
 console.info(`Mixamo thumb refinement: L ${thumbL.fixed}/3 max ${thumbL.maxAdjust?.toFixed?.(1)||'0.0'}° ${thumbL.maxBone||''} · R ${thumbR.fixed}/3 max ${thumbR.maxAdjust?.toFixed?.(1)||'0.0'}° ${thumbR.maxBone||''}`);

 for(let i=0;i<bones.length;i++){
  const spec=MIXAMO_XBOT_CONTRACT[i],wm=worldMats[i],lm=spec.parent==null?wm.clone():worldMats[proxyByName.get(spec.parent)].clone().invert().multiply(wm);
  lm.decompose(bones[i].position,bones[i].quaternion,bones[i].scale);bones[i].updateMatrix()
 }
 for(let i=0;i<bones.length;i++){
  const p=MIXAMO_XBOT_CONTRACT[i].parent;if(p!=null)bones[proxyByName.get(p)].add(bones[i])
 }

 const bridge=new THREE.Group();bridge.name="Sammy_Mixamo_XBotContract65_TPose_Axis16";bridge.add(bones[0]);bridge.add(body);bridge.updateMatrixWorld(true);
 const skeleton=new THREE.Skeleton(bones);body.bind(skeleton,new THREE.Matrix4());body.normalizeSkinWeights();bridge.updateMatrixWorld(true);
 const exportScene=new THREE.Scene();exportScene.name="Sammy_Mixamo_XBotContract65_TPose_Axis16_Scene";exportScene.add(bridge);exportScene.updateMatrixWorld(true);
 return {scene:exportScene,body,bones,vertexCount:V,triangleCount:idx.length/3,skin,shift}
}

function disposeBridgeScene(b){
 if(!b)return;b.scene?.traverse?.(o=>{o.geometry?.dispose?.();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose?.());else o.material?.dispose?.()})
}

function rowMat3ToQuat(a,o=0,out=new THREE.Quaternion()){
 const m=new THREE.Matrix4().set(
  a[o],a[o+1],a[o+2],0,
  a[o+3],a[o+4],a[o+5],0,
  a[o+6],a[o+7],a[o+8],0,
  0,0,0,1
 );
 return out.setFromRotationMatrix(m).normalize()
}
function publicWorldDeltasFromRelative(relative3){
 if(!poseParents||poseJointCount!==78)throw new Error("Public-78 Rig ist nicht bereit.");
 const qWorld=Array.from({length:poseJointCount},()=>new THREE.Quaternion());
 const done=new Uint8Array(poseJointCount),qRel=new THREE.Quaternion();
 function solve(j){
  if(done[j])return qWorld[j];
  const p=poseParents[j];
  rowMat3ToQuat(relative3,j*9,qRel);
  if(p<0||p===j)qWorld[j].copy(qRel);
  else qWorld[j].copy(solve(p)).multiply(qRel).normalize();
  done[j]=1;return qWorld[j]
 }
 for(let j=0;j<poseJointCount;j++)solve(j);
 return qWorld
}
function captureBridgeRestWorld(bridge){
 bridge.scene.updateMatrixWorld(true);
 bridge._restWorldQ=bridge.bones.map(b=>b.getWorldQuaternion(new THREE.Quaternion()));
 bridge._restLocalQ=bridge.bones.map(b=>b.quaternion.clone());
 bridge._restLocalPos=bridge.bones.map(b=>b.position.clone());
 bridge._restLocalScale=bridge.bones.map(b=>b.scale.clone());
 return bridge
}
function applyRelativeToExactAxis16Bridge(bridge,relative3){
 if(!bridge._restWorldQ)captureBridgeRestWorld(bridge);
 const pub=publicWorldDeltasFromRelative(relative3);
 const publicByName=new Map(PUBLIC_JOINT_NAMES.map((n,i)=>[n,i]));
 const desired=Array.from({length:bridge.bones.length},()=>new THREE.Quaternion());
 const byName=new Map(MIXAMO_XBOT_CONTRACT.map((b,i)=>[b.name,i]));
 for(let i=0;i<bridge.bones.length;i++){
  const spec=MIXAMO_XBOT_CONTRACT[i],j=publicByName.get(spec.source);
  if(j==null)throw new Error(`Vergleichs-Bridge: Public-Joint fehlt: ${spec.source}`);
  desired[i].copy(pub[j]).multiply(bridge._restWorldQ[i]).normalize()
 }
 for(let i=0;i<bridge.bones.length;i++){
  const spec=MIXAMO_XBOT_CONTRACT[i];
  bridge.bones[i].position.copy(bridge._restLocalPos[i]);
  bridge.bones[i].scale.copy(bridge._restLocalScale[i]);
  if(spec.parent==null)bridge.bones[i].quaternion.copy(desired[i]);
  else{
   const pi=byName.get(spec.parent);
   bridge.bones[i].quaternion.copy(desired[pi]).invert().multiply(desired[i]).normalize()
  }
  bridge.bones[i].updateMatrix()
 }
 bridge.scene.updateMatrixWorld(true);bridge.body.skeleton.update();
 return bridge
}
function resetExactAxis16Bridge(bridge){
 if(!bridge?._restLocalQ)return;
 for(let i=0;i<bridge.bones.length;i++){
  bridge.bones[i].position.copy(bridge._restLocalPos[i]);
  bridge.bones[i].quaternion.copy(bridge._restLocalQ[i]);
  bridge.bones[i].scale.copy(bridge._restLocalScale[i]);
  bridge.bones[i].updateMatrix()
 }
 bridge.scene.updateMatrixWorld(true);bridge.body.skeleton.update()
}
async function ensureMixamoCompareBridge(){
 if(mixamoCompareBridge)return mixamoCompareBridge;
 if(!shapePass&&!(await loadShape()))throw new Error("SOMA Basis/Topologie konnte nicht geladen werden.");
 if(!currentRigPackLoaded&&!(await loadCurrentRigPack()))throw new Error("Current SOMA Rig-Pack konnte nicht geladen werden.");
 mixamoCompareBridge=captureBridgeRestWorld(buildSammyMixamoBridgeScene());
 mixamoCompareBridge.scene.name="Sammy_Exact_Axis16_Comparison_Preview";
 mixamoCompareBridge.scene.visible=false;
 scene.add(mixamoCompareBridge.scene);
 return mixamoCompareBridge
}
async function setMixamoCompareVisible(on){
 try{
  const b=await ensureMixamoCompareBridge();mixamoCompareVisible=!!on;b.scene.visible=mixamoCompareVisible;
  if(mesh)mesh.visible=!mixamoCompareVisible;
  $("#toggleMixamoCompare").classList.toggle("activeAnim",mixamoCompareVisible);
  setState("#mixamoCompareState",mixamoCompareVisible?"EXAKTER AXIS16-KÖRPER":"AUS",mixamoCompareVisible?"ok":"warn");
  if(mixamoCompareVisible&&userAnimLoaded){
   const f=Math.max(0,Math.min(userAnimFrames-1,userAnimCurrentFrame||0)),off=f*poseJointCount*9;
   applyRelativeToExactAxis16Bridge(b,userAnimRel.subarray(off,off+poseJointCount*9))
  }
 }catch(e){console.error(e);setState("#mixamoCompareState","FEHLER","bad");info("#mixamoCompareInfo",`${e?.name||"Fehler"}: ${e?.message||String(e)}`)}
}
function bakeExactAxis16ComparisonMesh(bridge){
 bridge.scene.updateMatrixWorld(true);bridge.body.skeleton.update();
 const src=bridge.body.geometry.attributes.position,n=src.count,pos=new Float32Array(n*3),v=new THREE.Vector3();
 const apply=typeof bridge.body.applyBoneTransform==="function"?"applyBoneTransform":typeof bridge.body.boneTransform==="function"?"boneTransform":null;
 if(!apply)throw new Error("Diese Three.js-Version bietet keinen SkinnedMesh-BoneTransform für den Vergleichsexport.");
 for(let i=0;i<n;i++){
  v.fromBufferAttribute(src,i);bridge.body[apply](i,v);
  pos[i*3]=v.x;pos[i*3+1]=v.y;pos[i*3+2]=v.z
 }
 const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.BufferAttribute(pos,3));
 const idx=bridge.body.geometry.index?.array;if(idx)g.setIndex(new THREE.BufferAttribute(idx.slice?idx.slice():new Uint32Array(idx),1));
 g.computeVertexNormals();
 const m=new THREE.MeshStandardMaterial({color:0x9a9da5,roughness:.82,metalness:0,side:THREE.DoubleSide});
 const baked=new THREE.Mesh(g,m);baked.name="Sammy_Retarget_BAKED_ExactAxis16";return baked
}
async function exportMixamoComparisonFrame(){
 let bridge=null,baked=null;
 try{
  if(!userAnimLoaded||!userAnimRel)throw new Error("Zuerst eine Mixamo-Animation laden.");
  const input=$("#animCompareFrame"),requested=Number(input?.value??userAnimCurrentFrame??0);
  const frame=Math.max(0,Math.min(userAnimFrames-1,Number.isFinite(requested)?Math.round(requested):0));
  if(input)input.value=String(frame);
  setState("#mixamoCompareState","EXPORTIERT FRAME","warn");
  if(!shapePass&&!(await loadShape()))throw new Error("SOMA Basis/Topologie konnte nicht geladen werden.");
  if(!currentRigPackLoaded&&!(await loadCurrentRigPack()))throw new Error("Current SOMA Rig-Pack konnte nicht geladen werden.");
  bridge=captureBridgeRestWorld(buildSammyMixamoBridgeScene());
  const off=frame*poseJointCount*9;applyRelativeToExactAxis16Bridge(bridge,userAnimRel.subarray(off,off+poseJointCount*9));
  baked=bakeExactAxis16ComparisonMesh(bridge);
  const host=bridge.body.parent;host.remove(bridge.body);host.add(baked);
  host.userData={...host.userData,SammyDiagnostic:"Exact Axis16 comparison body",SourceAnimation:userAnimName,SourceFrame:frame,SourceFPS:userAnimFps,VertexCount:4505};
  bridge.scene.updateMatrixWorld(true);
  const mod=await getMixamoFbxExporter();
  const bytes=new mod.FBXExporter().parseSync(bridge.scene,{axisUp:"Y",axisForward:"-Z",unitScale:100,bakeSpaceTransform:false,includeAnimations:false,customProperties:true,creator:"Sammy Axis16 Retarget Comparison v0.7.1"});
  if(!(bytes instanceof Uint8Array)||bytes.byteLength<100000)throw new Error(`Vergleichs-FBX ungültig/zu klein: ${bytes?.byteLength||0} Bytes`);
  const safe=String(userAnimName||"Mixamo").replace(/\.[^.]+$/,'').replace(/[^a-z0-9_-]+/gi,'_').slice(0,60)||"Mixamo";
  const filename=`Sammy_Retarget_ExactAxis16_${safe}_Frame${String(frame).padStart(4,'0')}.fbx`;
  downloadBinaryFile(bytes,filename,"application/octet-stream");
  setState("#mixamoCompareState","VERGLEICHS-FBX FERTIG","ok");
  info("#mixamoCompareInfo",`✓ ${filename}\nEXAKT derselbe 4.505-Vertex-Axis16-Körper/Topologie wie der Mixamo-Upload, aber mit Sammys retargetetem Frame ${frame}/${userAnimFrames-1} deformiert.\nZusätzlich enthält das FBX die von Sammy berechnete 65-Bone-Pose.\n\nFür eine 1:1-Diagnose bitte dieses FBX zusammen mit der ORIGINALEN Mixamo-Animations-FBX hochladen. Dann können Mesh und Bone-Pose am identischen Frame direkt verglichen werden.`)
 }catch(e){console.error(e);setState("#mixamoCompareState","EXPORT FEHLER","bad");info("#mixamoCompareInfo",`${e?.name||"Fehler"}: ${e?.message||String(e)}`)}
 finally{if(bridge){if(baked){baked.geometry?.dispose?.();baked.material?.dispose?.()}disposeBridgeScene(bridge)}}
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
   creator:"Sammy Mixamo XBotContract65 T-Pose Axis16 v0.7.1"
  });
  if(!(bytes instanceof Uint8Array)||bytes.byteLength<100000)throw new Error(`FBX-Ausgabe unerwartet klein/ungültig: ${bytes?.byteLength||0} Bytes`);
  const magic=new TextDecoder("latin1").decode(bytes.subarray(0,21));if(!magic.startsWith("Kaydara FBX Binary"))throw new Error("FBX-Datei hat keinen erwarteten Binary-FBX-Header.");

  const filename="Sammy_Mixamo_XBotContract65_TPose_Axis16.fbx";downloadBinaryFile(bytes,filename,"application/octet-stream");
  setState("#mixamoBridgeState","X-BOT BRIDGE EXPORTIERT","ok");
  info("#mixamoBridgeInfo",`✓ ${filename}
65 Bones – exakt dieselbe Hierarchie und Bone-Namen wie das analysierte Mixamo X Bot.
Mesh und Skeleton sind in die offizielle SOMA T-Pose gebacken. v0.7.1: 52-Bone-Frame-Transport + Thumb-Plane-Fix + korrigierte SOMA→Mixamo-Fingersemantik (Metacarpal/MCP/Terminal).
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
 const w=buildDirectLowSkinningFromPack("public",poseJointCount);poseEulerDeg=new Float32Array(poseJointCount*3);poseReady=true;
 try{installEmbeddedAxis16MixamoReference()}catch(e){console.warn("Embedded Axis16 reference pending",e)}buildPoseControls();rigAdaptiveEnabled=true;return w
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

function auditMorphRigDirections(){
 if(!poseBindWorld||!poseBindWorldActive||poseJointCount!==78)return null;
 const byName=new Map(PUBLIC_JOINT_NAMES.map((n,i)=>[n,i]));
 const rows=[];
 for(const [name,child] of Object.entries(SAMMY_MORPH_PRIMARY_CHILD)){
  const j=byName.get(name),c=byName.get(child);
  if(j==null||c==null)continue;
  const jo=j*16,co=c*16;
  const tx=poseBindWorld[co+3]-poseBindWorld[jo+3],ty=poseBindWorld[co+7]-poseBindWorld[jo+7],tz=poseBindWorld[co+11]-poseBindWorld[jo+11];
  const ax=poseBindWorldActive[co+3]-poseBindWorldActive[jo+3],ay=poseBindWorldActive[co+7]-poseBindWorldActive[jo+7],az=poseBindWorldActive[co+11]-poseBindWorldActive[jo+11];
  const tl=Math.hypot(tx,ty,tz),al=Math.hypot(ax,ay,az);
  if(tl<1e-8||al<1e-8)continue;
  const dot=THREE.MathUtils.clamp((tx*ax+ty*ay+tz*az)/(tl*al),-1,1);
  const angle=THREE.MathUtils.radToDeg(Math.acos(dot));
  rows.push({name,child,angle,lengthRatio:al/tl})
 }
 if(!rows.length)return null;
 rows.sort((a,b)=>b.angle-a.angle);
 const mean=rows.reduce((s,r)=>s+r.angle,0)/rows.length,max=rows[0];
 return {
  count:rows.length,meanAngle:mean,maxAngle:max.angle,maxBone:max.name,maxChild:max.child,
  over2:rows.filter(r=>r.angle>2).length,over5:rows.filter(r=>r.angle>5).length,over10:rows.filter(r=>r.angle>10).length,
  maxLengthRatio:Math.max(...rows.map(r=>r.lengthRatio)),
  minLengthRatio:Math.min(...rows.map(r=>r.lengthRatio)),
  rows
 }
}
function currentMorphMappingFrame(){
 if(!userAnimLoaded||!userAnimRel||!userAnimFrames)return null;
 const f=Math.max(0,Math.min(userAnimFrames-1,Number.isFinite(userAnimCurrentFrame)?Math.round(userAnimCurrentFrame):0));
 const off=f*poseJointCount*9;
 return {frame:f,relative:userAnimRel.subarray(off,off+poseJointCount*9)}
}
function updateMorphSammyInfo(){
 if(!$("#morphSammyInfo"))return;
 const rest=currentDisplayRest(),frame=currentMorphMappingFrame(),rig=annyLastCoeffs&&annyPackLoaded?reconstructExactAnnyRestRig(annyLastCoeffs):null;
 const localCount=Object.values(annyLocalValues||{}).filter(v=>Math.abs(Number(v))>1e-6).length;
 info("#morphSammyInfo",`Sammy-Ziel: morphbares Anny v0.6 auf SOMA-Topologie + EXAKTES Axis16-Restpose-Retarget
Shape: ${shapeEngine==="anny"?"Anny exakt":"NICHT ANNY"} · ${displayLOD.toUpperCase()} · ${rest?rest.length/3:0} Vertices
Shape-Rig: ${rig?"EXAKT REKONSTRUIERT":"noch nicht"} · 78 Bones · cached Procrustes + ChildOffset
Skinning: Anny-eigene Top-${annyMeta?.skinning_topk||"?"}-Gewichte
Axis16 Basisorientierungen: ${annyAxis16PublicReference3?"78/78 GELADEN":"werden beim Aktivieren erzeugt"}
Aktive Anny Local Changes: ${localCount}
${frame?`Aktuelle importierte Pose: ${userAnimName} · Frame ${frame.frame}/${userAnimFrames-1}`:"Noch keine importierte Animation geladen."}
Browser↔offizielles-Anny Rest-Rig Fixture: ${annyRigParity?`max ${annyRigParity.maxAbs.toExponential(2)} ${annyRigParity.ok?"✓":"FEHLER"}`:"noch nicht geprüft"}

v0.7.1 korrigiert genau den im iPhone-Test sichtbaren Grundhaltungsfehler:
1. aktuelles Anny-Shape + dessen echtes Rest-Rig rekonstruieren,
2. dieses Rig über seine EIGENEN Bonelängen in die bewährte Axis16/Mixamo-Referenzhaltung bringen,
3. erst darauf die bereits verifizierten Mixamo-Weltbewegungsdeltas anwenden,
4. Ergebnis direkt mit den Anny-Skinweights auf das morphbare Mesh skinnen.

Damit bleiben nicht mehr Annys abweichende Resthaltung (Armneigung, Knie, Rücken, Daumen) als Offset in jeder Animation erhalten.`)
}
async function activateMorphableSammyTarget(){
 try{
  setState("#morphSammyState","AKTIVIERT …","warn");
  if(!shapePass&&!(await loadShape()))throw new Error("SOMA Basis/Topologie konnte nicht geladen werden.");
  if(!annyPackLoaded&&!(await loadAnnyPack()))throw new Error("Anny v3 Shape+Rig Engine konnte nicht geladen werden.");
  if(shapeEngine!=="anny")setShapeEngine("anny");
  if(displayLOD!=="mid"&&!(await setDisplayLOD("mid")))throw new Error("Anny Mid konnte nicht aktiviert werden.");
  if(!annyLastCoeffs)rebuildAnnyRestShape();

  morphSammyTargetActive=true;mixamoCompareVisible=false;
  if(mixamoCompareBridge)mixamoCompareBridge.scene.visible=false;if(mesh)mesh.visible=true;
  $("#toggleMixamoCompare")?.classList.remove("activeAnim");setState("#mixamoCompareState","AUS","warn");

  const cur=currentMorphMappingFrame();
  if(cur)applyAnnyAxis16RetargetPose(currentDisplayRest(),cur.relative,true,false,"Mixamo Axis16 → morphbares Anny/SOMA");
  else{const id=new Float32Array(78*9);for(let j=0;j<78;j++)mat3Identity(id,j*9);applyAnnyAxis16RetargetPose(currentDisplayRest(),id,false,false,"Axis16-kompatible Anny/SOMA Referenzpose")}
  setState("#morphSammyState","AXIS16→ANNY AKTIV","ok");$("#activateMorphSammy")?.classList.add("activeAnim");
  updateMorphSammyInfo();return true
 }catch(e){console.error(e);morphSammyTargetActive=false;setState("#morphSammyState","FEHLER","bad");info("#morphSammyInfo",`${e?.name||"Fehler"}: ${e?.message||String(e)}`);return false}
}
async function applyCurrentFrameToMorphSammy(){
 if(!morphSammyTargetActive){const ok=await activateMorphableSammyTarget();if(!ok)return}
 if(!userAnimLoaded){info("#morphSammyInfo","Zuerst eine Mixamo-Animation laden.");return}
 stopPoseAnimation(false);
 const f=Math.max(0,Math.min(userAnimFrames-1,Math.round(Number($("#animCompareFrame")?.value??userAnimCurrentFrame??0)||0)));userAnimCurrentFrame=f;
 if($("#animCompareFrame"))$("#animCompareFrame").value=String(f);
 const off=f*poseJointCount*9,rel=userAnimRel.subarray(off,off+poseJointCount*9);
 applyAnnyAxis16RetargetPose(currentDisplayRest(),rel,true,true,"Mixamo Axis16 → EXAKTES morphbares Anny/SOMA");
 updateMorphSammyInfo()
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
 if(meta.schema!=="anny-soma-browser-exact-engine-v3")throw new Error(`Anny Schema ${meta.schema||"?"} statt v3`);
 if(meta.source_git_sha!==ANNY_SOURCE_SHA)throw new Error(`Anny Commit ${meta.source_git_sha} statt ${ANNY_SOURCE_SHA}`);
 const expectedV=lod==="mid"?18056:4505;
 if(t.shape?.[0]!==expectedV||t.shape?.[1]!==3)throw new Error(`${lod} template ${JSON.stringify(t.shape)} statt [${expectedV},3]`);
 if(b.shape?.[0]!==meta.blendshape_count||b.shape?.[1]!==expectedV||b.shape?.[2]!==3)throw new Error(`${lod} blendshapes ${JSON.stringify(b.shape)} unerwartet`);
 if(m.shape?.[0]!==meta.phenotype_blendshape_count)throw new Error("Phenotype-Mask-Zeilen passen nicht");
 if(meta.bone_count!==78||meta.pose_parameterization!=="local-ref"||meta.rig!=="soma")throw new Error("Anny v3 Rig-Vertrag ist nicht SOMA-78/local-ref");
 const required=["template_bone_heads","bone_heads_blendshapes","bone_template_orientation_matrices","bone_orientation_blendshapes","reference_bone_orientations","bone_children_indices","bone_children_mask","bone_children_local_offsets","bone_parents","bone_labels_utf8","vertex_bone_indices","vertex_bone_weights","rig_parity_coeffs","rig_parity_rest_bone_poses"];
 for(const key of required)if(!pack[key])throw new Error(`Anny v3 Rig-Array fehlt: ${key}`);
 if(pack.vertex_bone_indices.shape?.[0]!==expectedV||pack.vertex_bone_weights.shape?.[0]!==expectedV)throw new Error("Anny v3 Skinning-Vertexzahl passt nicht");
 const labels=decodeUtf8Array(pack.bone_labels_utf8).replace(/\0.*$/s,"").trim().split(/\r?\n/);
 if(labels.length!==78||labels.some((n,i)=>n!==PUBLIC_JOINT_NAMES[i]))throw new Error("Anny SOMA Bone-Labels passen nicht zum Public78-Vertrag");
 return meta
}

function mat3Det(a,o=0){
 return a[o]*(a[o+4]*a[o+8]-a[o+5]*a[o+7])-a[o+1]*(a[o+3]*a[o+8]-a[o+5]*a[o+6])+a[o+2]*(a[o+3]*a[o+7]-a[o+4]*a[o+6])
}
function jacobiSym3(A){
 const a=Float64Array.from(A),v=new Float64Array([1,0,0,0,1,0,0,0,1]);
 for(let it=0;it<24;it++){
  let p=0,q=1,max=Math.abs(a[1]);
  if(Math.abs(a[2])>max){p=0;q=2;max=Math.abs(a[2])}
  if(Math.abs(a[5])>max){p=1;q=2;max=Math.abs(a[5])}
  if(max<1e-13)break;
  const pp=p*3+p,qq=q*3+q,pq=p*3+q;
  const phi=.5*Math.atan2(2*a[pq],a[qq]-a[pp]),c=Math.cos(phi),s=Math.sin(phi);
  const J=new Float64Array([1,0,0,0,1,0,0,0,1]);J[pp]=c;J[qq]=c;J[p*3+q]=s;J[q*3+p]=-s;
  const tmp=new Float64Array(9),next=new Float64Array(9),nv=new Float64Array(9);
  for(let r=0;r<3;r++)for(let col=0;col<3;col++)for(let k=0;k<3;k++)tmp[r*3+col]+=a[r*3+k]*J[k*3+col];
  for(let r=0;r<3;r++)for(let col=0;col<3;col++)for(let k=0;k<3;k++)next[r*3+col]+=J[k*3+r]*tmp[k*3+col];
  for(let r=0;r<3;r++)for(let col=0;col<3;col++)for(let k=0;k<3;k++)nv[r*3+col]+=v[r*3+k]*J[k*3+col];
  a.set(next);v.set(nv)
 }
 return {values:[a[0],a[4],a[8]],vectors:v}
}
function specialProcrustes3(M,mo=0,out=new Float32Array(9),oo=0){
 const mtm=new Float64Array(9);
 for(let r=0;r<3;r++)for(let c=0;c<3;c++){let s=0;for(let k=0;k<3;k++)s+=Number(M[mo+k*3+r])*Number(M[mo+k*3+c]);mtm[r*3+c]=s}
 const eig=jacobiSym3(mtm),order=[0,1,2].sort((a,b)=>eig.values[b]-eig.values[a]);
 const V=new Float64Array(9),sv=new Float64Array(3);
 for(let c=0;c<3;c++){const old=order[c];sv[c]=Math.sqrt(Math.max(0,eig.values[old]));for(let r=0;r<3;r++)V[r*3+c]=eig.vectors[r*3+old]}
 const U=new Float64Array(9),known=[];
 for(let c=0;c<3;c++){
  if(sv[c]<1e-9)continue;
  const u=[0,0,0];
  for(let r=0;r<3;r++)for(let k=0;k<3;k++)u[r]+=Number(M[mo+r*3+k])*V[k*3+c]/sv[c];
  for(const prev of known){let d=0;for(let r=0;r<3;r++)d+=U[r*3+prev]*u[r];for(let r=0;r<3;r++)u[r]-=d*U[r*3+prev]}
  const n=Math.hypot(...u);if(n>1e-9){for(let r=0;r<3;r++)U[r*3+c]=u[r]/n;known.push(c)}
 }
 const missing=[0,1,2].filter(c=>!known.includes(c));
 const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 const col=c=>[U[c],U[3+c],U[6+c]],setcol=(c,x)=>{const n=Math.hypot(...x)||1;U[c]=x[0]/n;U[3+c]=x[1]/n;U[6+c]=x[2]/n};
 if(known.length===2)setcol(missing[0],cross(col(known[0]),col(known[1])));
 else if(known.length===1){
  const k=known[0],u=col(k);let b=Math.abs(u[0])>.8?[0,1,0]:[1,0,0],d=u[0]*b[0]+u[1]*b[1]+u[2]*b[2];b=[b[0]-d*u[0],b[1]-d*u[1],b[2]-d*u[2]];setcol(missing[0],b);setcol(missing[1],cross(u,col(missing[0])))
 }else if(known.length===0)U.set([1,0,0,0,1,0,0,0,1]);
 const R=new Float64Array(9);
 for(let r=0;r<3;r++)for(let c=0;c<3;c++)for(let k=0;k<3;k++)R[r*3+c]+=U[r*3+k]*V[c*3+k];
 if(mat3Det(R)<0){for(let r=0;r<3;r++)U[r*3+2]*=-1;R.fill(0);for(let r=0;r<3;r++)for(let c=0;c<3;c++)for(let k=0;k<3;k++)R[r*3+c]+=U[r*3+k]*V[c*3+k]}
 for(let i=0;i<9;i++)out[oo+i]=R[i];return out
}
function shortestArc3(target,source,out=new Float32Array(9),oo=0){
 let ax=Number(target[0]),ay=Number(target[1]),az=Number(target[2]),bx=Number(source[0]),by=Number(source[1]),bz=Number(source[2]);
 let an=Math.hypot(ax,ay,az),bn=Math.hypot(bx,by,bz);if(an<1e-10||bn<1e-10){mat3Identity(out,oo);return out}
 ax/=an;ay/=an;az/=an;bx/=bn;by/=bn;bz/=bn;
 const dot=THREE.MathUtils.clamp(ax*bx+ay*by+az*bz,-1,1);
 if(dot<-1+1e-6){
  let ux,uy,uz;if(Math.abs(bx)>.6){ux=-bz;uy=0;uz=bx}else{ux=0;uy=bz;uz=-by}
  const n=Math.hypot(ux,uy,uz)||1;ux/=n;uy/=n;uz/=n;
  out[oo]=2*ux*ux-1;out[oo+1]=2*ux*uy;out[oo+2]=2*ux*uz;out[oo+3]=2*uy*ux;out[oo+4]=2*uy*uy-1;out[oo+5]=2*uy*uz;out[oo+6]=2*uz*ux;out[oo+7]=2*uz*uy;out[oo+8]=2*uz*uz-1;return out
 }
 const vx=by*az-bz*ay,vy=bz*ax-bx*az,vz=bx*ay-by*ax,k=1/(1+dot);
 out[oo]=1-k*(vy*vy+vz*vz);out[oo+1]=-vz+k*vx*vy;out[oo+2]=vy+k*vx*vz;out[oo+3]=vz+k*vy*vx;out[oo+4]=1-k*(vx*vx+vz*vz);out[oo+5]=-vx+k*vy*vz;out[oo+6]=-vy+k*vz*vx;out[oo+7]=vx+k*vz*vy;out[oo+8]=1-k*(vx*vx+vy*vy);return out
}
function mat3Vec(a,ao,v){return [a[ao]*v[0]+a[ao+1]*v[1]+a[ao+2]*v[2],a[ao+3]*v[0]+a[ao+4]*v[1]+a[ao+5]*v[2],a[ao+6]*v[0]+a[ao+7]*v[1]+a[ao+8]*v[2]]}
function makeRigidFromRotPos(rot,ro,pos,out,oo){
 out[oo]=rot[ro];out[oo+1]=rot[ro+1];out[oo+2]=rot[ro+2];out[oo+3]=pos[0];out[oo+4]=rot[ro+3];out[oo+5]=rot[ro+4];out[oo+6]=rot[ro+5];out[oo+7]=pos[1];out[oo+8]=rot[ro+6];out[oo+9]=rot[ro+7];out[oo+10]=rot[ro+8];out[oo+11]=pos[2];out[oo+12]=0;out[oo+13]=0;out[oo+14]=0;out[oo+15]=1
}
function reconstructExactAnnyRestRig(coeffs,{useCache=true}={}){
 if(!annyPackLoaded||!annyLowPack||!annyMeta)throw new Error("Anny v3 Rig-Pack fehlt");
 if(useCache&&annyExactRigCache&&coeffs===annyLastCoeffs)return annyExactRigCache;
 const J=annyMeta.bone_count,A=annyMeta.blendshape_count,p=annyLowPack;
 const th=p.template_bone_heads.data,hb=p.bone_heads_blendshapes.data,m0=p.bone_template_orientation_matrices.data,mb=p.bone_orientation_blendshapes.data;
 const heads=new Float32Array(J*3),cov=new Float32Array(J*9),R=new Float32Array(J*9);
 for(let i=0;i<heads.length;i++)heads[i]=Number(th[i]);for(let i=0;i<cov.length;i++)cov[i]=Number(m0[i]);
 for(let a=0;a<A;a++){const c=Number(coeffs[a]);if(Math.abs(c)<1e-9)continue;let o=a*J*3;for(let i=0;i<J*3;i++)heads[i]+=c*Number(hb[o+i]);o=a*J*9;for(let i=0;i<J*9;i++)cov[i]+=c*Number(mb[o+i])}
 for(let j=0;j<J;j++)specialProcrustes3(cov,j*9,R,j*9);
 const ci=p.bone_children_indices.data,cm=p.bone_children_mask.data,cl=p.bone_children_local_offsets.data,C=p.bone_children_indices.shape[1],tmp=new Float32Array(9),tmpR=new Float32Array(9),parents=Array.from(p.bone_parents.data,Number),multi=[],single=[],leaf=[];
 for(let j=1;j<J;j++){let count=0;for(let c=0;c<C;c++)if(Number(cm[j*C+c])>.5)count++;if(count===0)leaf.push(j);else if(count===1)single.push(j);else multi.push(j)}
 const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 for(const j of multi){
  const Aoff=[],Boff=[];for(let c=0;c<C;c++){if(Number(cm[j*C+c])<.5)continue;const ch=Number(ci[j*C+c]),to=[heads[ch*3]-heads[j*3],heads[ch*3+1]-heads[j*3+1],heads[ch*3+2]-heads[j*3+2]],lo=(j*C+c)*3,so=mat3Vec(R,j*9,[Number(cl[lo]),Number(cl[lo+1]),Number(cl[lo+2])]);Aoff.push(to);Boff.push(so)}
  const H=new Float32Array(9);for(let n=0;n<Aoff.length;n++)for(let r=0;r<3;r++)for(let c=0;c<3;c++)H[r*3+c]+=Aoff[n][r]*Boff[n][c];
  if(Aoff.length>=2){const nt=cross(Aoff[0],Aoff[1]),ns=cross(Boff[0],Boff[1]),lnt=Math.hypot(...nt),lns=Math.hypot(...ns);if(lnt>1e-9&&lns>1e-9){const st=Math.hypot(...Aoff[0])/(lnt+1e-8),ss=Math.hypot(...Boff[0])/(lns+1e-8),vt=nt.map(x=>x*st),vs=ns.map(x=>x*ss);for(let r=0;r<3;r++)for(let c=0;c<3;c++)H[r*3+c]+=vt[r]*vs[c]}}
  specialProcrustes3(H,0,tmp,0);mat3Mul(tmp,0,R,j*9,tmpR,0);R.set(tmpR,j*9)
 }
 for(const j of single){let slot=0;while(slot<C&&Number(cm[j*C+slot])<.5)slot++;const ch=Number(ci[j*C+slot]),target=[heads[ch*3]-heads[j*3],heads[ch*3+1]-heads[j*3+1],heads[ch*3+2]-heads[j*3+2]],lo=(j*C+slot)*3,source=mat3Vec(R,j*9,[Number(cl[lo]),Number(cl[lo+1]),Number(cl[lo+2])]);shortestArc3(target,source,tmp,0);mat3Mul(tmp,0,R,j*9,tmpR,0);R.set(tmpR,j*9)}
 for(const j of leaf){const par=parents[j];if(par>=0)for(let q=0;q<9;q++)R[j*9+q]=R[par*9+q]}
 R.set([1,0,0,0,0,1,0,-1,0],0);
 const restWorld=new Float32Array(J*16),restInv=new Float32Array(J*16);for(let j=0;j<J;j++)makeRigidFromRotPos(R,j*9,[heads[j*3],heads[j*3+1],heads[j*3+2]],restWorld,j*16);for(let j=0;j<J;j++)rigidInverse(restWorld,j*16,restInv,j*16);
 const refO=p.reference_bone_orientations.data,refWorld=new Float32Array(J*16),refInv=new Float32Array(J*16),prop=new Float32Array(J*16),pose=new Float32Array(16),tmp4=new Float32Array(16);
 for(let j=0;j<J;j++){const par=parents[j];if(par<0)pose.set(restWorld.subarray(j*16,j*16+16));else{mat4Mul(prop,par*16,restWorld,j*16,tmp4,0);pose.set(tmp4)}
  pose[0]=Number(refO[j*9]);pose[1]=Number(refO[j*9+1]);pose[2]=Number(refO[j*9+2]);pose[4]=Number(refO[j*9+3]);pose[5]=Number(refO[j*9+4]);pose[6]=Number(refO[j*9+5]);pose[8]=Number(refO[j*9+6]);pose[9]=Number(refO[j*9+7]);pose[10]=Number(refO[j*9+8]);refWorld.set(pose,j*16);mat4Mul(pose,0,restInv,j*16,prop,j*16)}
 for(let j=0;j<J;j++)rigidInverse(refWorld,j*16,refInv,j*16);
 const result={coeffs,heads,restOrient:R,restWorld,restInv,refWorld,refInv,parents};if(useCache&&coeffs===annyLastCoeffs)annyExactRigCache=result;return result
}
function validateAnnyExactRigParity(){
 const p=annyLowPack,fc=p.rig_parity_coeffs,fp=p.rig_parity_rest_bone_poses;if(!fc||!fp)return null;
 const B=fc.shape[0],A=fc.shape[1],J=annyMeta.bone_count;let maxAbs=0,maxCase=-1,maxBone=-1;
 for(let b=0;b<B;b++){const coeff=new Float32Array(A);for(let a=0;a<A;a++)coeff[a]=Number(fc.data[b*A+a]);const rig=reconstructExactAnnyRestRig(coeff,{useCache:false});for(let j=0;j<J;j++)for(let q=0;q<16;q++){const d=Math.abs(rig.restWorld[j*16+q]-Number(fp.data[(b*J+j)*16+q]));if(d>maxAbs){maxAbs=d;maxCase=b;maxBone=j}}}
 annyRigParity={maxAbs,maxCase,maxBone,ok:maxAbs<3e-3};return annyRigParity
}
function axis16BridgeWorldQuaternionMap(){
 const bridge=buildSammyMixamoBridgeScene();
 bridge.scene.updateMatrixWorld(true);
 const map=new Map();
 for(let i=0;i<MIXAMO_XBOT_CONTRACT.length;i++)map.set(mixamoBoneKey(MIXAMO_XBOT_CONTRACT[i].name),bridge.bones[i].getWorldQuaternion(new THREE.Quaternion()).clone());
 disposeBridgeScene(bridge);return map
}
function ensureAnnyAxis16PublicReference3(){
 if(annyAxis16PublicReference3)return annyAxis16PublicReference3;
 if(!poseTWorld||poseJointCount!==78)throw new Error("SOMA Public78/T-Pose ist noch nicht bereit.");
 const src=axis16BridgeWorldQuaternionMap(),out=new Float32Array(78*9),byName=new Map(PUBLIC_JOINT_NAMES.map((n,i)=>[n,i]));
 const get=k=>{const q=src.get(k);if(!q)throw new Error(`Axis16 Referenz-Bone fehlt: ${k}`);return q};
 const set=(name,q)=>{const j=byName.get(name);if(j==null)throw new Error(`Public78 Bone fehlt: ${name}`);quatToRowMat3(q,out,j*9)};
 const inherit=(name,parent)=>{const j=byName.get(name),p=byName.get(parent);for(let k=0;k<9;k++)out[j*9+k]=out[p*9+k]};
 // Virtual Root uses the canonical SOMA T-pose root orientation.
 rot3FromMat4(poseTWorld,0,out,0);
 set("Hips",get("hips"));set("Spine1",get("spine"));set("Spine2",get("spine1"));set("Chest",get("spine2"));
 const qNeck=get("neck"),qHead=get("head");
 set("Neck1",qNeck);
 // Keep the same geometric split used by the proven Mixamo converter.
 const n1=byName.get("Neck1"),n2=byName.get("Neck2"),h=byName.get("Head"),n1o=n1*16,n2o=n2*16,ho=h*16;
 const p1=new THREE.Vector3(poseTWorld[n1o+3],poseTWorld[n1o+7],poseTWorld[n1o+11]),p2=new THREE.Vector3(poseTWorld[n2o+3],poseTWorld[n2o+7],poseTWorld[n2o+11]),ph=new THREE.Vector3(poseTWorld[ho+3],poseTWorld[ho+7],poseTWorld[ho+11]);
 const nt=THREE.MathUtils.clamp(p1.distanceTo(p2)/Math.max(1e-8,p1.distanceTo(ph)),0,1);
 set("Neck2",qNeck.clone().slerp(qHead,nt).normalize());set("Head",qHead);
 if(src.has("headtopend"))set("HeadEnd",get("headtopend"));else inherit("HeadEnd","Head");inherit("Jaw","Head");inherit("LeftEye","Head");inherit("RightEye","Head");
 for(const side of ["Left","Right"]){
  const lo=side.toLowerCase();set(`${side}Shoulder`,get(`${lo}shoulder`));set(`${side}Arm`,get(`${lo}arm`));set(`${side}ForeArm`,get(`${lo}forearm`));set(`${side}Hand`,get(`${lo}hand`));
  set(`${side}Leg`,get(`${lo}upleg`));set(`${side}Shin`,get(`${lo}leg`));set(`${side}Foot`,get(`${lo}foot`));set(`${side}ToeBase`,get(`${lo}toebase`));if(src.has(`${lo}toeend`))set(`${side}ToeEnd`,get(`${lo}toeend`));else inherit(`${side}ToeEnd`,`${side}ToeBase`);
  for(const d of ["Thumb","Index","Middle","Ring","Pinky"]){const dk=d.toLowerCase();
   if(d==="Thumb"){
    for(let n=1;n<=3;n++)set(`${side}HandThumb${n}`,get(`${lo}handthumb${n}`));
    if(src.has(`${lo}handthumb4`))set(`${side}HandThumbEnd`,get(`${lo}handthumb4`));else inherit(`${side}HandThumbEnd`,`${side}HandThumb3`)
   }else{
    // Axis16 semantic hand contract: SOMA Finger1 is the palm metacarpal.
    inherit(`${side}Hand${d}1`,`${side}Hand`);
    for(let mx=1;mx<=3;mx++)set(`${side}Hand${d}${mx+1}`,get(`${lo}hand${dk}${mx}`));
    if(src.has(`${lo}hand${dk}4`))set(`${side}Hand${d}End`,get(`${lo}hand${dk}4`));else inherit(`${side}Hand${d}End`,`${side}Hand${d}4`)
   }
  }
 }
 annyAxis16PublicReference3=out;return out
}
function publicRelativeToWorldDelta3(relative3){
 const J=78,out=new Float32Array(J*9),tmp=new Float32Array(9);mat3Identity(out,0);
 for(let j=1;j<J;j++){const p=Number(annyLowPack.bone_parents.data[j]);mat3Mul(out,p*9,relative3,j*9,tmp,0);out.set(tmp,j*9)}
 return out
}

function buildAxis16CompatibleAnnyReferenceRig(nativeRig){
 if(annyAxis16ReferenceRigCache?.nativeRig===nativeRig)return annyAxis16ReferenceRigCache;
 if(!poseTWorld||poseJointCount!==78)throw new Error("SOMA Public78 T-Pose fehlt.");
 const J=78,parents=nativeRig.parents;
 const refWorld=new Float32Array(J*16),refInv=new Float32Array(J*16),heads=new Float32Array(J*3),transport3=new Float32Array(J*9),targetOrient3=new Float32Array(J*9);
 const children=Array.from({length:J},()=>[]);
 for(let j=0;j<J;j++){const p=parents[j];if(p>=0&&p!==j)children[p].push(j)}

 // 1) Build only the TARGET GEOMETRY from the official SOMA/Public78 T-pose:
 //    direction from T-pose, length from the current exact Anny identity.
 for(let j=0;j<J;j++){
  const p=parents[j],jo=j*16;
  if(p<0||p===j){
   heads[j*3]=nativeRig.restWorld[jo+3];
   heads[j*3+1]=nativeRig.restWorld[jo+7];
   heads[j*3+2]=nativeRig.restWorld[jo+11];
   continue
  }
  const po=p*16;
  const nx=nativeRig.restWorld[jo+3]-nativeRig.restWorld[po+3],
        ny=nativeRig.restWorld[jo+7]-nativeRig.restWorld[po+7],
        nz=nativeRig.restWorld[jo+11]-nativeRig.restWorld[po+11],
        targetLen=Math.hypot(nx,ny,nz);
  let dx=poseTWorld[jo+3]-poseTWorld[po+3],
      dy=poseTWorld[jo+7]-poseTWorld[po+7],
      dz=poseTWorld[jo+11]-poseTWorld[po+11],
      dl=Math.hypot(dx,dy,dz);
  if(dl<1e-10){dx=nx;dy=ny;dz=nz;dl=Math.hypot(dx,dy,dz)}
  if(dl>1e-12){dx/=dl;dy/=dl;dz/=dl}
  heads[j*3]=heads[p*3]+dx*targetLen;
  heads[j*3+1]=heads[p*3+1]+dy*targetLen;
  heads[j*3+2]=heads[p*3+2]+dz*targetLen
 }

 // 2) CRITICAL v0.7.1 change:
 //    Never copy Axis16/XBot bone coordinate frames onto Anny bones.
 //    Instead rotate each NATIVE Anny bone frame by the world-space transport
 //    that moves its native child directions into the target T-pose directions.
 //    This keeps Anny's own bind-axis convention intact.
 const tmpR=new Float32Array(9),H=new Float32Array(9);
 let maxDirDeg=0,maxLenErr=0,leaves=0,multi=0,single=0;
 for(let j=0;j<J;j++){
  const kids=children[j];
  if(kids.length===0){
   leaves++;
   const p=parents[j];
   if(p>=0&&p!==j)transport3.set(transport3.subarray(p*9,p*9+9),j*9);
   else mat3Identity(transport3,j*9)
  }else if(kids.length===1){
   single++;
   const ch=kids[0];
   const source=[
    nativeRig.restWorld[ch*16+3]-nativeRig.restWorld[j*16+3],
    nativeRig.restWorld[ch*16+7]-nativeRig.restWorld[j*16+7],
    nativeRig.restWorld[ch*16+11]-nativeRig.restWorld[j*16+11]
   ];
   const target=[
    heads[ch*3]-heads[j*3],
    heads[ch*3+1]-heads[j*3+1],
    heads[ch*3+2]-heads[j*3+2]
   ];
   shortestArc3(target,source,transport3,j*9)
  }else{
   multi++;
   H.fill(0);
   for(const ch of kids){
    const s=[
     nativeRig.restWorld[ch*16+3]-nativeRig.restWorld[j*16+3],
     nativeRig.restWorld[ch*16+7]-nativeRig.restWorld[j*16+7],
     nativeRig.restWorld[ch*16+11]-nativeRig.restWorld[j*16+11]
    ];
    const t=[
     heads[ch*3]-heads[j*3],
     heads[ch*3+1]-heads[j*3+1],
     heads[ch*3+2]-heads[j*3+2]
    ];
    for(let r=0;r<3;r++)for(let c=0;c<3;c++)H[r*3+c]+=t[r]*s[c]
   }
   specialProcrustes3(H,0,transport3,j*9)
  }

  mat3Mul(transport3,j*9,nativeRig.restOrient,j*9,tmpR,0);
  targetOrient3.set(tmpR,j*9);

  // Audit actual transported child directions.
  for(const ch of kids){
   const s=[
    nativeRig.restWorld[ch*16+3]-nativeRig.restWorld[j*16+3],
    nativeRig.restWorld[ch*16+7]-nativeRig.restWorld[j*16+7],
    nativeRig.restWorld[ch*16+11]-nativeRig.restWorld[j*16+11]
   ];
   const moved=mat3Vec(transport3,j*9,s);
   const t=[
    heads[ch*3]-heads[j*3],
    heads[ch*3+1]-heads[j*3+1],
    heads[ch*3+2]-heads[j*3+2]
   ];
   const ml=Math.hypot(...moved),tl=Math.hypot(...t);
   if(ml>1e-10&&tl>1e-10){
    const dot=THREE.MathUtils.clamp((moved[0]*t[0]+moved[1]*t[1]+moved[2]*t[2])/(ml*tl),-1,1);
    maxDirDeg=Math.max(maxDirDeg,THREE.MathUtils.radToDeg(Math.acos(dot)));
    maxLenErr=Math.max(maxLenErr,Math.abs(ml-tl))
   }
  }
  makeRigidFromRotPos(targetOrient3,j*9,[heads[j*3],heads[j*3+1],heads[j*3+2]],refWorld,j*16)
 }
 for(let j=0;j<J;j++)rigidInverse(refWorld,j*16,refInv,j*16);

 // At identity motion, the reference skeleton itself must be the FK result.
 // This is the key invariant that v0.5.23/v0.5.27 violated by mixing XBot axes
 // with inverse(native Anny bind) skinning.
 // The reference pose is intentionally a pre-pose from native Anny rest into
 // a SOMA/Axis16-compatible T-pose. Therefore refWorld * inverse(restWorld)
 // is allowed to be non-identity; the important invariant is that the frame
 // basis comes from transported Anny axes, not copied XBot/Axis16 axes.

 const result={
  nativeRig,heads,refWorld,refInv,ref3:targetOrient3,transport3,
  stats:{maxDirDeg,maxLenErr,leaves,multi,single}
 };
 annyAxis16ReferenceRigCache=result;return result
}
function absoluteFkOnAxis16Reference(nativeRig,referenceRig,absolute3){
 const J=78,posed=new Float32Array(J*16),prop=new Float32Array(J*16),skin=new Float32Array(J*16);
 const pose=new Float32Array(16),tmpProp=new Float32Array(16),tmpSkin=new Float32Array(16);
 for(let j=0;j<J;j++){
  const p=nativeRig.parents[j];
  if(p<0)pose.set(referenceRig.refWorld.subarray(j*16,j*16+16));
  else mat4Mul(prop,p*16,referenceRig.refWorld,j*16,pose,0);
  const ro=j*9;
  pose[0]=absolute3[ro];pose[1]=absolute3[ro+1];pose[2]=absolute3[ro+2];
  pose[4]=absolute3[ro+3];pose[5]=absolute3[ro+4];pose[6]=absolute3[ro+5];
  pose[8]=absolute3[ro+6];pose[9]=absolute3[ro+7];pose[10]=absolute3[ro+8];
  posed.set(pose,j*16);
  // Translation propagation is relative to the Axis16-compatible reference pose.
  mat4Mul(pose,0,referenceRig.refInv,j*16,tmpProp,0);prop.set(tmpProp,j*16);
  // Vertex skinning still maps from the NATIVE Anny bind/rest mesh to the final pose.
  mat4Mul(pose,0,nativeRig.restInv,j*16,tmpSkin,0);skin.set(tmpSkin,j*16)
 }
 return {posed,prop,skin}
}
function absoluteFkOnAnnyRest(rig,absolute3){
 const J=78,posed=new Float32Array(J*16),skin=new Float32Array(J*16),tmp4=new Float32Array(16),pose=new Float32Array(16);
 for(let j=0;j<J;j++){
  const p=rig.parents[j];
  if(p<0)pose.set(rig.restWorld.subarray(j*16,j*16+16));
  else mat4Mul(skin,p*16,rig.restWorld,j*16,pose,0);
  const ro=j*9;pose[0]=absolute3[ro];pose[1]=absolute3[ro+1];pose[2]=absolute3[ro+2];pose[4]=absolute3[ro+3];pose[5]=absolute3[ro+4];pose[6]=absolute3[ro+5];pose[8]=absolute3[ro+6];pose[9]=absolute3[ro+7];pose[10]=absolute3[ro+8];
  posed.set(pose,j*16);mat4Mul(pose,0,rig.restInv,j*16,tmp4,0);skin.set(tmp4,j*16)
 }
 return {posed,skin}
}
function applyAnnyAxis16RetargetPose(rest,relative3,markMoved=true,report=true,label="Axis16 → exact Anny/SOMA"){
 if(!geometry||!annyPackLoaded||!annyLastCoeffs)throw new Error("Anny exact rig/shape ist noch nicht bereit.");
 lastAppliedRelative3=new Float32Array(relative3);
 const rig=reconstructExactAnnyRestRig(annyLastCoeffs),worldDelta=publicRelativeToWorldDelta3(relative3),absolute3=new Float32Array(78*9),tmp=new Float32Array(9);
 const axisRef=buildAxis16CompatibleAnnyReferenceRig(rig);
 // v0.7.1: world motion delta is applied to the TRANSPORTED NATIVE ANNY frame.
 // Never multiply by an XBot/Axis16 bone basis before inverse(native Anny bind).
 for(let j=0;j<78;j++){mat3Mul(worldDelta,j*9,axisRef.ref3,j*9,tmp,0);absolute3.set(tmp,j*9)}
 const fk=absoluteFkOnAxis16Reference(rig,axisRef,absolute3),lod=displayLOD==="mid"?"mid":"low",pack=annyPackForLOD(lod),idx=pack.vertex_bone_indices.data,w=pack.vertex_bone_weights.data,K=annyMeta.skinning_topk,pos=geometry.attributes.position.array,n=rest.length/3,t0=performance.now(),gy=annyGroundOffsetY;let maxWeightErr=0;
 for(let v=0;v<n;v++){
  const x=rest[v*3],y=rest[v*3+1]-gy,z=rest[v*3+2];let ox=0,oy=0,oz=0,ws=0;
  for(let k=0;k<K;k++){const bi=Number(idx[v*K+k]),ww=Number(w[v*K+k]);if(bi<0||ww<=0)continue;const bo=bi*16;ox+=ww*(fk.skin[bo]*x+fk.skin[bo+1]*y+fk.skin[bo+2]*z+fk.skin[bo+3]);oy+=ww*(fk.skin[bo+4]*x+fk.skin[bo+5]*y+fk.skin[bo+6]*z+fk.skin[bo+7]);oz+=ww*(fk.skin[bo+8]*x+fk.skin[bo+9]*y+fk.skin[bo+10]*z+fk.skin[bo+11]);ws+=ww}
  pos[v*3]=ox;pos[v*3+1]=oy+gy;pos[v*3+2]=oz;maxWeightErr=Math.max(maxWeightErr,Math.abs(1-ws))
 }
 geometry.attributes.position.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();currentPoseWorld=fk.posed.slice();refreshRigDebug();const ms=performance.now()-t0;
 if(markMoved){posePass=true;setState("#poseState","AXIS16 → EXACT ANNY","ok");updateDecision()}
 if(report)info("#posePerf",`${label}: ${ms.toFixed(1)} ms · ${n} Vertices · 78 shape-abhängige Anny/SOMA-Bones · Top-${K}
Referenzgeometrie: SOMA/Axis16-T-Pose-Richtungen + aktuelle Anny-Bonelängen
Bone-Basis: NATIVE Anny-Achsen, per Weltrotation in die Zielgeometrie transportiert
Translations-FK: relativ zu dieser transportierten Referenzgeometrie
Vertex-Bind: natives Anny-Rest-Mesh → finale Pose
Referenz-Audit: max Kind-Richtungsfehler ${axisRef.stats.maxDirDeg.toFixed(3)}° · max Längenfehler ${(axisRef.stats.maxLenErr*1000).toExponential(2)} mm · single/multi/leaf ${axisRef.stats.single}/${axisRef.stats.multi}/${axisRef.stats.leaves}
Animation: bewiesene Public78-Weltbewegungsdeltas
Skinning-Gewichtssummenfehler max. ${maxWeightErr.toExponential(1)}`);
 return {ms,maxWeightErr,world:fk.posed,skin:fk.skin}
}

function applyAnnyExactLocalRefPose(rest,relative3,markMoved=true,report=true,label="Anny exact SOMA local-ref"){
 if(!geometry||!annyPackLoaded||!annyLastCoeffs)throw new Error("Anny exact rig/shape ist noch nicht bereit.");
 lastAppliedRelative3=new Float32Array(relative3);
 const rig=reconstructExactAnnyRestRig(annyLastCoeffs),J=annyMeta.bone_count,parents=rig.parents,refO=annyLowPack.reference_bone_orientations.data;
 const refTransform=new Float32Array(J*16),posed=new Float32Array(J*16),skin=new Float32Array(J*16),delta4=new Float32Array(16),t1=new Float32Array(9),t2=new Float32Array(9),tmp4=new Float32Array(16),base=new Float32Array(16);rigidInverse(rig.refWorld,0,base,0);
 for(let j=0;j<J;j++){const oo=j*9;for(let r=0;r<3;r++)for(let c=0;c<3;c++){let s=0;for(let k=0;k<3;k++)s+=Number(refO[oo+k*3+r])*Number(relative3[oo+k*3+c]);t1[r*3+c]=s}mat3Mul(t1,0,refO,oo,t2,0);
  delta4.fill(0);delta4[0]=t2[0];delta4[1]=t2[1];delta4[2]=t2[2];delta4[4]=t2[3];delta4[5]=t2[4];delta4[6]=t2[5];delta4[8]=t2[6];delta4[9]=t2[7];delta4[10]=t2[8];delta4[15]=1;
  mat4Mul(rig.refWorld,j*16,delta4,0,tmp4,0);const par=parents[j];if(par<0)mat4Mul(base,0,tmp4,0,posed,j*16);else mat4Mul(refTransform,par*16,tmp4,0,posed,j*16);mat4Mul(posed,j*16,rig.refInv,j*16,refTransform,j*16);mat4Mul(posed,j*16,rig.restInv,j*16,skin,j*16)}
 const lod=displayLOD==="mid"?"mid":"low",pack=annyPackForLOD(lod),idx=pack.vertex_bone_indices.data,w=pack.vertex_bone_weights.data,K=annyMeta.skinning_topk,pos=geometry.attributes.position.array,n=rest.length/3,t0=performance.now(),gy=annyGroundOffsetY;let maxWeightErr=0;
 for(let v=0;v<n;v++){const x=rest[v*3],y=rest[v*3+1]-gy,z=rest[v*3+2];let ox=0,oy=0,oz=0,ws=0;for(let k=0;k<K;k++){const bi=Number(idx[v*K+k]),ww=Number(w[v*K+k]);if(bi<0||ww<=0)continue;const bo=bi*16;ox+=ww*(skin[bo]*x+skin[bo+1]*y+skin[bo+2]*z+skin[bo+3]);oy+=ww*(skin[bo+4]*x+skin[bo+5]*y+skin[bo+6]*z+skin[bo+7]);oz+=ww*(skin[bo+8]*x+skin[bo+9]*y+skin[bo+10]*z+skin[bo+11]);ws+=ww}pos[v*3]=ox;pos[v*3+1]=oy+gy;pos[v*3+2]=oz;maxWeightErr=Math.max(maxWeightErr,Math.abs(1-ws))}
 geometry.attributes.position.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();currentPoseWorld=posed.slice();const ms=performance.now()-t0;if(markMoved){posePass=true;setState("#poseState","ANNY SOMA LOCAL-REF","ok");updateDecision()}
 if(report)info("#posePerf",`${label}: ${ms.toFixed(1)} ms · ${n} Vertices · ${J} exakte Anny/SOMA-Bones · Top-${K}
Rest-Rig: Blendshape-Heads + cached Procrustes + ChildOffset-Refiner
Skinning-Gewichtssummenfehler max. ${maxWeightErr.toExponential(1)}
Browser↔offizielles-Anny Rest-Rig Parity: ${annyRigParity?annyRigParity.maxAbs.toExponential(2):"noch nicht geprüft"}`);
 return {ms,maxWeightErr,world:posed,skin}
}

async function loadAnnyPack(){
 try{
  if(!arrays||!baseLow)throw new Error("Zuerst Punkt 1: SOMA Shape-Asset laden – es liefert Topologie + Low-Zuordnung.");
  setState("#annyState","LOW LÄDT","warn");await requestPersistentStorage();
  let asset=await fetchAnnyEnginePack("low",{onProgress:(got,total,hit,src)=>info("#annyInfo",hit?`✓ Low-Pack aus persistentem Cache · ${(got/1048576).toFixed(1)} MB`:`${src||"Low-Pack"}${got?` · ${(got/1048576).toFixed(1)} MB`:""}`)});
  try{annyLowPack=await decodeShapeNPZ(asset.u8)}catch(first){if(!asset.cacheHit)throw first;await assetCacheDelete(ASSET_KEY.annyLow);asset=await fetchAnnyEnginePack("low",{forceNetwork:true});annyLowPack=await decodeShapeNPZ(asset.u8)}
  annyMeta=validateAnnyPack(annyLowPack,"low");annyPackLoaded=true;annyLocalValues=Object.fromEntries(annyMeta.local_change_labels.map(x=>[x,0]));
  const rigParity=validateAnnyExactRigParity();if(!rigParity?.ok)throw new Error(`Anny v3 Browser-Rig-Parity fehlgeschlagen: max ${rigParity?.maxAbs??"?"}`);
  buildAnnyControls();setAnnyUiFromParams();$("#useAnny").disabled=false;setState("#annyState","LOW PACK + EXACT RIG OK","ok");
  info("#annyInfo",`✓ EXAKTE ANNY SHAPE + SOMA REST-RIG ENGINE
Quelle: ${asset.cacheHit?"persistenter iPhone-Cache":asset.source}
Anny v${annyMeta.anny_version} · Commit ${annyMeta.source_git_sha.slice(0,12)}
Low: 4.505 Vertices · ${annyMeta.blendshape_count} Blendshapes
Rig: ${annyMeta.bone_count} Bones · ${annyMeta.rig_method}
Skinning: Top-${annyMeta.skinning_topk}
Browser↔offizielles-Anny Rest-Rig Fixture max. Fehler: ${rigParity.maxAbs.toExponential(2)}
Damit werden beim Morphing jetzt nicht nur Joint-Positionen, sondern Anny/SOMAs echte shape-abhängige Bone-Orientierungen rekonstruiert.`);
  return true
 }catch(e){console.error(e);annyPackLoaded=false;setState("#annyState","PACK FEHLT/FEHLER","bad");$("#useAnny").disabled=true;info("#annyInfo",`${e?.name||"Fehler"}: ${e?.message||String(e)}\n\nFür v0.7.1 den neuen Workflow „Build Anny SOMA Engine v3“ einmal ausführen.`);return false}
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
 const t0=performance.now(),cs=computeAnnyCoefficients();annyLastCoeffs=cs;annyExactRigCache=null;annyAxis16ReferenceRigCache=null;
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
const SAMMY_ADULT_SHAPE_AGE_MIN=.70,SAMMY_ADULT_SHAPE_AGE_MAX=1.00,SAMMY_ADULT_MAX_YEARS=70;
function sammyAdultMinYears(gender=annyParams?.gender??0){const g=Math.max(0,Math.min(1,Number(gender)||0));return 19+(16-19)*g}
function sammyShapeAgeToYears(shapeAge=annyParams?.age??SAMMY_ADULT_SHAPE_AGE_MIN,gender=annyParams?.gender??0){const lo=sammyAdultMinYears(gender),t=Math.max(0,Math.min(1,(Number(shapeAge)-SAMMY_ADULT_SHAPE_AGE_MIN)/(SAMMY_ADULT_SHAPE_AGE_MAX-SAMMY_ADULT_SHAPE_AGE_MIN)));return lo+(SAMMY_ADULT_MAX_YEARS-lo)*t}
function sammyClampAdultShapeAge(v){return Math.max(SAMMY_ADULT_SHAPE_AGE_MIN,Math.min(SAMMY_ADULT_SHAPE_AGE_MAX,Number(v)||SAMMY_ADULT_SHAPE_AGE_MIN))}
function makeAnnyAgeSlider(){
 const row=document.createElement("div");row.className="slider annySlider";row.dataset.search="anny alter age erwachsen";const v=sammyClampAdultShapeAge(annyParams.age);row.innerHTML=`<label>Anny Alter<small>Erwachsenenbereich · Form-Morph 0.70–1.00</small></label><input type="range" min="${SAMMY_ADULT_SHAPE_AGE_MIN}" max="${SAMMY_ADULT_SHAPE_AGE_MAX}" step="0.005" value="${v}"><output>${Math.round(sammyShapeAgeToYears(v))} J.</output>`;
 const r=row.querySelector("input"),o=row.querySelector("output");r.oninput=()=>{annyParams.age=sammyClampAdultShapeAge(r.value);o.value=`${Math.round(sammyShapeAgeToYears(annyParams.age))} J.`;applyAnnyParams()};return row
}
function buildAnnyControls(){
 if(!annyMeta)return;const core=$("#annyCoreControls"),adv=$("#annyAdvancedPhenotypes"),groups=$("#annyLocalGroups");core.innerHTML="";adv.innerHTML="";groups.innerHTML="";
 core.appendChild(makeAnnyAgeSlider());
 const coreDefs=[["Height","height",0,1,.01],["Weight","weight",0,1,.01],["Muscle","muscle",0,1,.01],["Proportions","proportions",0,1,.01],["Cupsize","cupsize",0,1,.01],["Firmness","firmness",0,1,.01]];
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
 const keys=["height","weight","muscle","proportions","cupsize","firmness","gender","african","asian","caucasian"];
 document.querySelectorAll("#annyCoreControls .annySlider,#annyAdvancedPhenotypes .annySlider").forEach(row=>{const raw=row.querySelector("label small")?.textContent||"",label=row.querySelector("label")?.childNodes[0]?.textContent||"";if(label.includes("Alter")){const input=row.querySelector("input"),out=row.querySelector("output");if(input)input.value=sammyClampAdultShapeAge(annyParams.age);if(out)out.value=`${Math.round(sammyShapeAgeToYears(annyParams.age))} J.`;return}let key=keys.find(k=>label.toLowerCase().includes(k));if(label.includes("Gender"))key="gender";if(key&&key in annyParams){row.querySelector("input").value=annyParams[key];row.querySelector("output").value=Number(annyParams[key]).toFixed(2)}})
}
function resetAnnyLocal(){for(const k of Object.keys(annyLocalValues))annyLocalValues[k]=0;document.querySelectorAll("#annyLocalGroups input").forEach(r=>{r.value=0;r.closest(".slider").querySelector("output").value="0.00"});applyAnnyParams()}
function resetAnnyPreset(gender){annyParams={gender,age:SAMMY_ADULT_SHAPE_AGE_MIN,muscle:.5,weight:.5,height:.5,proportions:.5,cupsize:.5,firmness:.5,african:.5,asian:.5,caucasian:.5};resetAnnyLocal();setAnnyUiFromParams()}
function setShapeEngine(engine){
 if(engine==="anny"&&!annyPackLoaded){info("#annyInfo","Anny Low-Pack zuerst laden.");return}
 if(engine==="soma-pca"&&displayLOD==="mid")displayLOD="low";shapeEngine=engine;updateLodButtons();
 document.querySelectorAll("#sliders input,#random,#reset").forEach(x=>x.disabled=engine==="anny");$("#useAnny").classList.toggle("selected",engine==="anny");$("#useSoma").classList.toggle("selected",engine==="soma-pca");
 if(engine==="anny"){shapeAnalysis.ready=false;shapeAnalysis.stale=true;$("#startShapeAnalysis").disabled=true;setState("#pcaState","A/B REFERENZ","warn");setState("#annyState","ANNY AKTIV","ok")}else{setState("#pcaState","AKTIV","ok");setState("#annyState",annyPackLoaded?"PACK OK":"BEREIT",annyPackLoaded?"ok":"");$("#startShapeAnalysis").disabled=!(currentRigMode==="current-expanded")}
 updateShape();updateDecision();return true
}
function applyAnnyParams(){annyParams.age=sammyClampAdultShapeAge(annyParams.age);if(shapeEngine!=="anny")setShapeEngine("anny");else updateShape();setAnnyUiFromParams();
 try{const m=measureCurrentRestShape();info("#annyLiveInfo",`Anny exakt · Gender ${annyParams.gender.toFixed(2)} · Alter ${Math.round(sammyShapeAgeToYears())} J. (${annyParams.age.toFixed(3)}) · H ${annyParams.height.toFixed(2)} · W ${annyParams.weight.toFixed(2)} · Muscle ${annyParams.muscle.toFixed(2)} · Proportions ${annyParams.proportions.toFixed(2)} · Cup ${annyParams.cupsize.toFixed(2)}\nAktive lokale Changes: ${Object.values(annyLocalValues).filter(v=>Math.abs(v)>1e-6).length} · Rekonstruktion ${annyLastMs.toFixed(1)} ms · Display ${displayLOD.toUpperCase()}\nMess-Proxies: Höhe ${m.height.toFixed(1)} cm · Brust ${m.chestCirc.toFixed(1)} · Taille ${m.waistCirc.toFixed(1)} · Hüfte ${m.hipCirc.toFixed(1)} cm`)}catch(e){info("#annyLiveInfo",`Anny exakt · ${displayLOD.toUpperCase()} · ${annyLastMs.toFixed(1)} ms`)}
}
function updateLodButtons(){$("#lodLow").classList.toggle("selected",displayLOD==="low");$("#lodMid").classList.toggle("selected",displayLOD==="mid");$("#lodBadge").textContent=displayLOD==="mid"?"18.056 V":"4.505 V"}
async function setDisplayLOD(lod){
 if(lod===displayLOD)return true;if(lod==="mid"){
  if(shapeEngine!=="anny"){info("#lodInfo","Mid ist in v0.7.1 bewusst für den Anny-Pfad aktiviert. Zuerst Anny verwenden.");return false}
  if(!await loadAnnyMidPack())return false;
  if(poseReady&&currentRigMode==="current-expanded"&&!morphSammyTargetActive&&!packOptional("target_skinning_mid_shape")){info("#lodInfo","Mid-Shape ist vorhanden, aber der LEGACY-122-Pfad enthält noch keine 18k×122 Skinweights. Der Exact-Anny/SOMA-Morphpfad benötigt diese nicht.");return false}
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
  if(morphSammyTargetActive&&shapeEngine==="anny"&&annyLastCoeffs){
   if(lastAppliedRelative3&&lastAppliedRelative3.length===poseJointCount*9)applyAnnyAxis16RetargetPose(rest,lastAppliedRelative3,false,false,"Axis16→Anny Shape-Rebind + aktuelle Pose");
   else{const id=new Float32Array(78*9);for(let j=0;j<78;j++)mat3Identity(id,j*9);applyAnnyAxis16RetargetPose(rest,id,false,false,"Axis16-kompatible Anny Referenzpose")}
  }else{
   if(rigAdaptiveEnabled)recomputeAdaptiveRig();
   if(lastAppliedRelative3&&lastAppliedRelative3.length===poseJointCount*9)applyRelativePoseMatrices(rest,lastAppliedRelative3,false,false,"Shape-Rebind + aktuelle Pose");
   else applyPoseToRest(rest,false)
  }
 }else{
  const pos=geometry.attributes.position.array;pos.set(rest);
  geometry.attributes.position.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere()
 }
 if(morphSammyTargetActive)updateMorphSammyInfo()
 const engineText=shapeEngine==="anny"
  ?`Anny exact SOMA shape · ${annyParams.gender<.5?"Male":"Female"} · H ${annyParams.height.toFixed(2)} · W ${annyParams.weight.toFixed(2)}`
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
  if(shapeEngine!=="soma-pca")throw new Error("Der alte 128-PC-Analyzer gilt nur für SOMA-PCA. Für v0.7.1 Anny direkt über die nativen Parameter testen.");
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

Wichtig: Umfang/Tiefe sind in v0.7.1 bewusst sichtbare Slice-Proxies. Die Mathematik des Modifiers wird damit real getestet; die endgültigen BODY-LAB-Messdefinitionen werden später gegen echte anthropometrische Landmarken/Messregeln validiert.`);
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
 const boneGeo=new THREE.BufferGeometry();boneGeo.setAttribute("position",new THREE.BufferAttribute(new Float32Array(Math.max(0,d.count-1)*2*3),3));rigBoneLines=new THREE.LineSegments(boneGeo,new THREE.LineBasicMaterial({color:0xffcf66,transparent:true,opacity:.98,depthTest:false,depthWrite:false}));rigBoneLines.renderOrder=20;rigGroup.add(rigBoneLines);
 const pointGeo=new THREE.BufferGeometry();pointGeo.setAttribute("position",new THREE.BufferAttribute(new Float32Array(d.count*3),3));rigJointPoints=new THREE.Points(pointGeo,new THREE.PointsMaterial({color:0x58f0a8,size:.04,sizeAttenuation:true,depthTest:false,depthWrite:false}));rigJointPoints.renderOrder=21;rigGroup.add(rigJointPoints);
 const makeAxis=color=>{const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.BufferAttribute(new Float32Array(d.count*2*3),3));const l=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color,transparent:true,opacity:.92,depthTest:false,depthWrite:false}));l.renderOrder=22;rigGroup.add(l);return l};rigAxesX=makeAxis(0xff5d5d);rigAxesY=makeAxis(0x5dff7d);rigAxesZ=makeAxis(0x58a6ff);rigGroup.visible=rigDebugVisible;scene.add(rigGroup)
}
function refreshRigDebug(){
 if(!poseReady)return;const d=rigDebugData();if(!d.world)return;ensureRigDebugObjects();if(!rigGroup)return;rigGroup.visible=rigDebugVisible;
 const jointPos=rigJointPoints.geometry.attributes.position.array,bonePos=rigBoneLines.geometry.attributes.position.array,axisX=rigAxesX.geometry.attributes.position.array,axisY=rigAxesY.geometry.attributes.position.array,axisZ=rigAxesZ.geometry.attributes.position.array,axisScale=.09;let bp=0,ax=0;
 const displayY=(morphSammyTargetActive&&shapeEngine==="anny")?annyGroundOffsetY:0;
 for(let j=0;j<d.count;j++){const o=j*16,p=transformPoint(d.world,o,0,0,0);p[1]+=displayY;jointPos[j*3]=p[0];jointPos[j*3+1]=p[1];jointPos[j*3+2]=p[2];if(j>0){const pp=transformPoint(d.world,d.parents[j]*16,0,0,0);pp[1]+=displayY;bonePos[bp++]=pp[0];bonePos[bp++]=pp[1];bonePos[bp++]=pp[2];bonePos[bp++]=p[0];bonePos[bp++]=p[1];bonePos[bp++]=p[2]}const px=transformPoint(d.world,o,axisScale,0,0),py=transformPoint(d.world,o,0,axisScale,0),pz=transformPoint(d.world,o,0,0,axisScale);px[1]+=displayY;py[1]+=displayY;pz[1]+=displayY;axisX[ax]=p[0];axisX[ax+1]=p[1];axisX[ax+2]=p[2];axisX[ax+3]=px[0];axisX[ax+4]=px[1];axisX[ax+5]=px[2];axisY[ax]=p[0];axisY[ax+1]=p[1];axisY[ax+2]=p[2];axisY[ax+3]=py[0];axisY[ax+4]=py[1];axisY[ax+5]=py[2];axisZ[ax]=p[0];axisZ[ax+1]=p[1];axisZ[ax+2]=p[2];axisZ[ax+3]=pz[0];axisZ[ax+4]=pz[1];axisZ[ax+5]=pz[2];ax+=6}
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


function oracleMaterials(meshObj=mesh){
 if(!meshObj?.material)return[];
 return Array.isArray(meshObj.material)?meshObj.material:[meshObj.material]
}
function oracleSetBodyOpacity(value){
 const op=THREE.MathUtils.clamp(Number(value),0,1);
 if(!mesh)return;
 const mats=oracleMaterials();
 if(!oracleGhostBackup){
  oracleGhostBackup=mats.map(m=>({transparent:m.transparent,opacity:m.opacity,depthWrite:m.depthWrite,depthTest:m.depthTest,side:m.side}));
 }
 mats.forEach(m=>{m.transparent=true;m.opacity=op;m.depthWrite=false;m.depthTest=true;m.side=THREE.DoubleSide;m.needsUpdate=true});
 mesh.renderOrder=1;
 if($("#oracleOpacityOut"))$("#oracleOpacityOut").textContent=`${Math.round(op*100)} %`
}
function oracleRestoreBody(){
 if(!mesh||!oracleGhostBackup)return;
 const mats=oracleMaterials();
 mats.forEach((m,i)=>{const b=oracleGhostBackup[i]||oracleGhostBackup[0];if(!b)return;m.transparent=b.transparent;m.opacity=b.opacity;m.depthWrite=b.depthWrite;m.depthTest=b.depthTest;m.side=b.side;m.needsUpdate=true});
 mesh.renderOrder=0;oracleGhostBackup=null
}
function oracleDisposeObject(o){
 if(!o)return;scene.remove(o);
 const geometries=new Set(),materials=new Set();
 o.traverse?.(x=>{if(x.geometry)geometries.add(x.geometry);if(Array.isArray(x.material))x.material.forEach(m=>materials.add(m));else if(x.material)materials.add(x.material)});
 geometries.forEach(g=>g.dispose?.());materials.forEach(m=>m.dispose?.())
}
function oraclePointFromWorld(world,j){
 const o=j*16;return new THREE.Vector3(Number(world[o+3]),Number(world[o+7]),Number(world[o+11]))
}
function oracleErrorColor(err){
 if(!err)return 0xffcf66;
 if(err.angleDeg>5||err.positionMm>20)return 0xff4f59;
 if(err.angleDeg>1||err.positionMm>5)return 0xffa23a;
 return 0xffcf66
}
function buildThickOracleSkeleton(world,parents,{kind="browser",errors=null}={}){
 const group=new THREE.Group();group.name=kind==="official"?"Oracle_Official_Skeleton":"Oracle_Browser_Skeleton";
 const jointGeo=new THREE.SphereGeometry(kind==="official"?.014:.016,8,6);
 const boneGeo=new THREE.CylinderGeometry(kind==="official"?.006:.008,kind==="official"?.006:.008,1,7,1,false);
 const officialMat=new THREE.MeshBasicMaterial({color:0x55d9ff,transparent:true,opacity:.95,depthTest:false,depthWrite:false});
 const jointMat=new THREE.MeshBasicMaterial({color:kind==="official"?0x55d9ff:0xffe07a,transparent:true,opacity:.98,depthTest:false,depthWrite:false});
 const yAxis=new THREE.Vector3(0,1,0);
 for(let j=0;j<parents.length;j++){
  const p=oraclePointFromWorld(world,j),joint=new THREE.Mesh(jointGeo,jointMat);
  joint.position.copy(p);joint.renderOrder=1100;group.add(joint);
  const par=Number(parents[j]);if(par<0||par===j)continue;
  const pp=oraclePointFromWorld(world,par),d=p.clone().sub(pp),len=d.length();if(len<1e-8)continue;
  let mat=officialMat;
  if(kind!=="official"){
   const c=oracleErrorColor(errors?.get(j));
   mat=new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:.96,depthTest:false,depthWrite:false})
  }
  const bone=new THREE.Mesh(boneGeo,mat);
  bone.userData.oracleBoneIndex=j;
  bone.position.copy(pp).add(p).multiplyScalar(.5);
  bone.quaternion.setFromUnitVectors(yAxis,d.clone().normalize());
  bone.scale.set(1,len,1);bone.renderOrder=1090;group.add(bone)
 }
 group.renderOrder=1080;scene.add(group);return group
}
function oracleBuildOfficialMesh(vertices){
 if(oracleOfficialMesh)oracleDisposeObject(oracleOfficialMesh);
 if(!geometry?.index)throw new Error("Aktuelles Mid-Mesh hat keinen Triangle-Index.");
 const g=new THREE.BufferGeometry(),arr=Float32Array.from(vertices);
 g.setAttribute("position",new THREE.BufferAttribute(arr,3));g.setIndex(geometry.index.clone());g.computeVertexNormals();
 const m=new THREE.MeshBasicMaterial({color:0x56d8ff,wireframe:true,transparent:true,opacity:.28,depthTest:false,depthWrite:false});
 oracleOfficialMesh=new THREE.Mesh(g,m);oracleOfficialMesh.name="Official_Anny_Oracle_Wire";oracleOfficialMesh.renderOrder=1050;oracleOfficialMesh.visible=oracleOfficialMeshVisible;scene.add(oracleOfficialMesh)
}
function oracleAngleDeg(a,ao,b,bo){
 // Relative rotation trace: R_a * R_b^T.
 let tr=0;
 for(let r=0;r<3;r++)for(let c=0;c<3;c++)tr+=Number(a[ao+r*4+c])*Number(b[bo+r*4+c]);
 const cos=THREE.MathUtils.clamp((tr-1)/2,-1,1);return THREE.MathUtils.radToDeg(Math.acos(cos))
}
function oracleCompareRows(browserWorld,officialWorld,parents){
 const rows=[];
 for(let j=0;j<parents.length;j++){
  const o=j*16,dx=Number(browserWorld[o+3])-Number(officialWorld[o+3]),dy=Number(browserWorld[o+7])-Number(officialWorld[o+7]),dz=Number(browserWorld[o+11])-Number(officialWorld[o+11]);
  rows.push({index:j,name:PUBLIC_JOINT_NAMES[j]||`Joint ${j}`,angleDeg:oracleAngleDeg(browserWorld,o,officialWorld,o),positionMm:Math.hypot(dx,dy,dz)*1000})
 }
 return rows.sort((a,b)=>Math.max(b.angleDeg/5,b.positionMm/20)-Math.max(a.angleDeg/5,a.positionMm/20))
}
function oracleFriendlyName(name){
 return String(name).replace(/^Left/,"Links ").replace(/^Right/,"Rechts ").replace("ForeArm","Unterarm").replace("Shoulder","Schulter").replace("Arm","Oberarm").replace("Hand","Hand ").replace("Thumb","Daumen ").replace("Index","Zeigefinger ").replace("Middle","Mittelfinger ").replace("Ring","Ringfinger ").replace("Pinky","Kleinfinger ").replace("Leg","Oberschenkel").replace("Shin","Unterschenkel").replace("Foot","Fuß").replace("Toe","Zehe ").replace("Neck","Hals ").replace("Head","Kopf ").replace("Spine","Wirbelsäule ").replace("Chest","Brustkorb").replace("Hips","Becken").replace(/\s+/g," ").trim()
}
function oracleSetStep(n,state,text=""){
 const el=$(`#oracleStep${n}`),badge=$(`#oracleStep${n}Badge`),info=$(`#oracleStep${n}Info`);
 if(el){el.classList.toggle("done",state==="done");el.classList.toggle("active",state==="active");el.classList.toggle("error",state==="error")}
 if(badge){badge.textContent=state==="done"?"ERLEDIGT":state==="active"?"JETZT":"WARTET";badge.className=`oracleBadge ${state}`}
 if(info&&text)info.textContent=text
}
function oracleRefreshBrowserSkeleton(world=null,errors=null){
 if(oracleBrowserSkeleton)oracleDisposeObject(oracleBrowserSkeleton);
 const parents=annyLowPack?Array.from(annyLowPack.bone_parents.data,Number):poseParents;
 const w=world||currentPoseWorld;if(!w)return;
 oracleBrowserSkeleton=buildThickOracleSkeleton(w,parents,{kind:"browser",errors})
}
function oracleCurrentFrameData(){
 if(!userAnimLoaded||!userAnimRel||!userAnimFrames)throw new Error("Zuerst eine Mixamo-Animation laden.");
 const f=Math.max(0,Math.min(userAnimFrames-1,Math.round(Number($("#animCompareFrame")?.value??userAnimCurrentFrame??0)||0))),off=f*poseJointCount*9;
 return {frame:f,relative:userAnimRel.subarray(off,off+poseJointCount*9)}
}
function oracleDisplayWorldCopy(world,groundY){
 const out=Float32Array.from(world);
 for(let j=0;j<78;j++)out[j*16+7]+=groundY;
 return out
}
function buildOraclePoseProbe(){
 const cur=oracleCurrentFrameData(),rig=reconstructExactAnnyRestRig(annyLastCoeffs),ref3=ensureAnnyAxis16PublicReference3(),worldDelta=publicRelativeToWorldDelta3(cur.relative),absolute3=new Float32Array(78*9),tmp=new Float32Array(9);
 for(let j=0;j<78;j++){mat3Mul(worldDelta,j*9,ref3,j*9,tmp,0);absolute3.set(tmp,j*9)}
 const fk=absoluteFkOnAnnyRest(rig,absolute3),displayWorld=oracleDisplayWorldCopy(fk.posed,annyGroundOffsetY);
 const browserVertices=Array.from(geometry.attributes.position.array);
 const id=`${String(userAnimName||"motion").replace(/[^a-z0-9_-]+/gi,"_")}-f${cur.frame}-${Date.now()}`;
 return {
  schema:"sammy-pose-probe-v1",sammy_version:"0.5.24",probe_id:id,
  source:{animation:userAnimName,frame:cur.frame,frames:userAnimFrames,fps:userAnimFps,format:userAnimSource},
  shape:{engine:shapeEngine,lod:displayLOD,vertex_count:browserVertices.length/3,ground_offset_y:annyGroundOffsetY,params:{...annyParams},local_changes:{...annyLocalValues}},
  bone_labels:[...PUBLIC_JOINT_NAMES],bone_parents:Array.from(annyLowPack.bone_parents.data,Number),
  blendshape_coeffs:Array.from(annyLastCoeffs),
  source_relative3:Array.from(cur.relative),source_world_delta3:Array.from(worldDelta),
  intended_absolute_orientations_y:Array.from(absolute3),
  anny_rest_bone_poses_y:Array.from(rig.restWorld),
  browser_bone_poses_display_y:Array.from(displayWorld),
  browser_skin_transforms_y:Array.from(fk.skin),
  browser_vertices_display_y:browserVertices
 }
}
async function startRigOracleComparison(){
 try{
  setState("#oracleState","STARTET","warn");
  if(!userAnimLoaded)throw new Error("Zuerst eine Mixamo-Animation laden.");
  if(!morphSammyTargetActive){const ok=await activateMorphableSammyTarget();if(!ok)throw new Error("Morphbares Sammy konnte nicht aktiviert werden.")}
  if(displayLOD!=="mid"&&!(await setDisplayLOD("mid")))throw new Error("Für den Oracle-Vergleich muss Anny Mid aktiv sein.");
  stopPoseAnimation(false);const cur=oracleCurrentFrameData();oracleDisplayFrame=cur.frame;userAnimCurrentFrame=cur.frame;
  if($("#animCompareFrame"))$("#animCompareFrame").value=String(cur.frame);
  applyAnnyAxis16RetargetPose(currentDisplayRest(),cur.relative,true,false,"Rig Oracle · eingefrorener Browser-Frame");
  oracleModeActive=true;oracleResult=null;oracleErrorRows=[];
  if(rigGroup)rigGroup.visible=false;rigDebugVisible=false;setState("#rigDebugState","AUS","warn");
  oracleSetBodyOpacity(Number($("#oracleOpacity")?.value||.16));
  oracleRefreshBrowserSkeleton(oracleDisplayWorldCopy(currentPoseWorld,annyGroundOffsetY));
  $("#oracleExportProbe").disabled=false;$("#oracleResultFile").disabled=true;$("#oracleToggleOfficialMesh").disabled=true;$("#oracleWorstBone").disabled=true;
  oracleSetStep(1,"done",`Frame ${cur.frame} ist eingefroren. Gelb = Sammys aktuell berechnetes 78-Bone-Skelett. Der Körper ist absichtlich durchsichtig; bewerte jetzt NICHT die Schönheit der Pose, sondern nur ob du das Skelett gut erkennen kannst.`);
  oracleSetStep(2,"active","Wenn Gelb gut durch den Körper sichtbar ist, exportierst du als Nächstes genau diesen Frame als Pose-Probe.");
  oracleSetStep(3,"waiting","Noch nichts tun. Die offizielle Anny-Datei kommt erst nach der Probe.");
  oracleSetStep(4,"waiting","Noch nichts zu interpretieren.");
  setState("#oracleState","SCHRITT 1 FERTIG","ok")
 }catch(e){console.error(e);setState("#oracleState","FEHLER","bad");oracleSetStep(1,"error",e.message||String(e))}
}
async function exportRigOracleProbe(){
 try{
  if(!oracleModeActive)throw new Error("Zuerst Schritt 1 starten.");
  oracleProbe=buildOraclePoseProbe();
  await saveOracleProbeToCache(oracleProbe);
  const safe=String(userAnimName||"Motion").replace(/\.[^.]+$/,"").replace(/[^a-z0-9_-]+/gi,"_").slice(0,50)||"Motion",filename=`Sammy_PoseProbe_${safe}_Frame${String(oracleProbe.source.frame).padStart(4,"0")}.json`;
  downloadJsonFile(oracleProbe,filename);
  $("#oracleResultFile").disabled=false;
  oracleSetStep(2,"done",`✓ ${filename} wurde exportiert. Diese Datei enthält nur Zahlen: Körperkoeffizienten, 78 Eingangs-/Zielmatrizen und Sammys Ergebnis für genau diesen Frame.`);
  oracleSetStep(3,"active","Nächster Schritt: Aus dieser Probe erzeugen wir mit OFFIZIELLEM Anny die Oracle-Datei. Dafür kannst du die beiliegende Pose-Oracle-Anleitung öffnen – oder die Probe einfach hier im Chat hochladen, dann gehen wir gemeinsam weiter.");
  setState("#oracleState","PROBE FERTIG","ok")
 }catch(e){console.error(e);oracleSetStep(2,"error",e.message||String(e));setState("#oracleState","PROBE FEHLER","bad")}
}

const ORACLE_PROBE_CACHE_KEY="Sammy/RigOracle/latest-pose-probe-v1";
async function saveOracleProbeToCache(probe){
 try{
  const bytes=new TextEncoder().encode(JSON.stringify(probe));
  await assetCachePut(ORACLE_PROBE_CACHE_KEY,"local://sammy-rig-oracle",bytes,"application/json");
  return true
 }catch(e){console.warn("Oracle probe cache save failed",e);return false}
}
async function restoreOracleProbeFromCache(){
 try{
  const hit=await assetCacheGet(ORACLE_PROBE_CACHE_KEY);
  if(!hit?.buffer)return null;
  const probe=JSON.parse(new TextDecoder().decode(new Uint8Array(hit.buffer)));
  if(probe?.schema!=="sammy-pose-probe-v1")return null;
  oracleProbe=probe;
  return probe
 }catch(e){console.warn("Oracle probe cache restore failed",e);return null}
}
async function oracleRestoreSceneFromProbe(probe){
 if(!probe)throw new Error("Keine Pose-Probe vorhanden.");
 if(!shapePass&&!(await loadShape()))throw new Error("SOMA Basis konnte nicht geladen werden.");
 if(!annyPackLoaded&&!(await loadAnnyPack()))throw new Error("Anny Engine konnte nicht geladen werden.");
 if(displayLOD!=="mid"&&!(await setDisplayLOD("mid")))throw new Error("Anny Mid konnte nicht aktiviert werden.");
 if(probe.browser_vertices_display_y?.length!==geometry.attributes.position.count*3)throw new Error("Probe-Vertexzahl passt nicht zum aktuellen Mid-Mesh.");
 oracleModeActive=true;oracleDisplayFrame=Number(probe.source?.frame||0);
 stopPoseAnimation(false);
 const pos=geometry.attributes.position.array;pos.set(probe.browser_vertices_display_y);
 geometry.attributes.position.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();
 if(mesh)mesh.visible=true;
 oracleSetBodyOpacity(Number($("#oracleOpacity")?.value||.16));
 if(rigGroup)rigGroup.visible=false;rigDebugVisible=false;setState("#rigDebugState","AUS","warn");
 if(oracleBrowserSkeleton)oracleDisposeObject(oracleBrowserSkeleton);
 oracleBrowserSkeleton=buildThickOracleSkeleton(probe.browser_bone_poses_display_y,probe.bone_parents,{kind:"browser"});
 $("#oracleExportProbe").disabled=false;$("#oracleResultFile").disabled=false;$("#oracleLoadRepoPair").disabled=false;
 oracleSetStep(1,"done",`Wiederhergestellt: ${probe.source?.animation||"Animation"} · Frame ${probe.source?.frame??"?"}. Gelb = exakt das Browser-Skelett aus der gespeicherten Probe.`);
 oracleSetStep(2,"done",`Pose-Probe ${probe.probe_id||"?"} ist vorhanden. Du musst Animation und Frame NICHT erneut laden.`);
 oracleSetStep(3,"active","Jetzt kann das passende Oracle-Ergebnis geladen werden – entweder direkt aus dem Repo oder als Datei.");
 setState("#oracleState","PROBE WIEDERHERGESTELLT","ok");
 return true
}
async function fetchOracleJsonFromRepo(path){
 const r=await fetch(`${path}?cb=${Date.now()}`,{cache:"no-store"});
 if(!r.ok)throw new Error(`${path}: HTTP ${r.status}`);
 return await r.json()
}

async function testAxisReferenceFixFromRepo(){
 try{
  setState("#morphFixState","LÄDT …","warn");
  const probe=await fetchOracleJsonFromRepo("./pose_probe_input.json");
  if(probe?.schema!=="sammy-pose-probe-v1")throw new Error(`Repo-Probe hat falsches Schema: ${probe?.schema||"?"}`);
  if(!shapePass&&!(await loadShape()))throw new Error("SOMA Basis konnte nicht geladen werden.");
  if(!annyPackLoaded&&!(await loadAnnyPack()))throw new Error("Anny Engine konnte nicht geladen werden.");
  if(shapeEngine!=="anny")setShapeEngine("anny");
  if(displayLOD!=="mid"&&!(await setDisplayLOD("mid")))throw new Error("Anny Mid konnte nicht aktiviert werden.");

  // Reconstruct exactly the identity/shape captured in the already existing probe.
  const coeffs=Float32Array.from(probe.blendshape_coeffs||[]);
  if(coeffs.length!==annyMeta.blendshape_count)throw new Error(`Probe hat ${coeffs.length} Blendshape-Koeffizienten statt ${annyMeta.blendshape_count}.`);
  annyLastCoeffs=coeffs;annyExactRigCache=null;annyAxis16ReferenceRigCache=null;
  currentRestMid=reconstructAnnyLOD("mid",coeffs,currentRestMid);
  const gy=Number(probe.shape?.ground_offset_y||0);annyGroundOffsetY=gy;translateVerticesY(currentRestMid,gy);
  currentRestLow=reconstructAnnyLOD("low",coeffs,currentRestLow);translateVerticesY(currentRestLow,gy);

  const rel=Float32Array.from(probe.source_relative3||[]);
  if(rel.length!==78*9)throw new Error(`Probe-Pose hat ${rel.length} Werte statt ${78*9}.`);
  oracleModeActive=true;oracleProbe=probe;oracleDisplayFrame=Number(probe.source?.frame||0);
  stopPoseAnimation(false);
  const result=applyAnnyAxis16RetargetPose(currentRestMid,rel,true,false,"v0.7.1 Axis16-Referenz-FK");
  if(mesh)mesh.visible=true;oracleSetBodyOpacity(.72);
  if(rigGroup)rigGroup.visible=false;rigDebugVisible=false;
  if(oracleOfficialSkeleton)oracleDisposeObject(oracleOfficialSkeleton);
  if(oracleBrowserSkeleton)oracleDisposeObject(oracleBrowserSkeleton);
  oracleBrowserSkeleton=buildThickOracleSkeleton(oracleDisplayWorldCopy(result.world,gy),probe.bone_parents,{kind:"browser"});
  const nativeRig=reconstructExactAnnyRestRig(coeffs),axisRef=buildAxis16CompatibleAnnyReferenceRig(nativeRig);
  info("#morphFixInfo",`TEST AUS BEREITS VORHANDENER REPO-PROBE
${probe.source?.animation||"Animation"} · Frame ${probe.source?.frame??"?"}

v0.7.1 ändert erstmals NICHT die Animation und NICHT Anny-FK selbst, sondern den dazwischenliegenden Referenzvertrag:

alt (kaputt):
Axis16/XBot-BONE-ACHSEN wurden direkt auf Anny gesetzt
→ danach inverse(native Anny bind)
→ zwei inkompatible Bone-Koordinatensysteme

neu:
SOMA-T-Pose-Zielrichtungen + aktuelle Anny-Bonelängen
→ NATIVE Anny-Bone-Achsen per Weltrotation in diese Geometrie transportieren
→ darauf die bewiesenen Mixamo-Weltbewegungsdeltas
→ Skinning weiterhin gegen denselben nativen Anny-Bind

Interner Referenz-Audit:
max. Kind-Richtungsfehler: ${axisRef.stats.maxDirDeg.toFixed(3)}°
max. Längenfehler: ${(axisRef.stats.maxLenErr*1000).toExponential(2)} mm
Single/Multi/Leaf-Bones: ${axisRef.stats.single}/${axisRef.stats.multi}/${axisRef.stats.leaves}

Gelb zeigt jetzt das NEUE Ziel-Skelett. Dafür war KEIN neuer Workflow und KEIN erneutes Laden der FBX nötig.`);
  setState("#morphFixState","FIX-KANDIDAT AKTIV","ok");
  frame()
 }catch(e){
  console.error(e);setState("#morphFixState","FEHLER","bad");info("#morphFixInfo",`${e?.name||"Fehler"}: ${e?.message||String(e)}`)
 }
}
async function loadOraclePairFromRepo(){
 try{
  setState("#oracleState","LÄDT REPO-PAAR …","warn");
  const [probe,result]=await Promise.all([
   fetchOracleJsonFromRepo("./pose_probe_input.json"),
   fetchOracleJsonFromRepo("./pose_probe_oracle.json")
  ]);
  if(probe?.schema!=="sammy-pose-probe-v1")throw new Error(`Repo-Probe hat falsches Schema: ${probe?.schema||"?"}`);
  if(result?.schema!=="sammy-pose-oracle-v1")throw new Error(`Repo-Oracle hat falsches Schema: ${result?.schema||"?"}`);
  if(result.probe_id!==probe.probe_id)throw new Error(`Repo-Dateien passen nicht zusammen: Probe-ID ${probe.probe_id} ≠ Oracle-ID ${result.probe_id}`);
  oracleProbe=probe;await saveOracleProbeToCache(probe);await oracleRestoreSceneFromProbe(probe);
  applyRigOracleResult(result);
  info("#oracleRepoInfo",`✓ Repo-Paar direkt geladen
Probe: pose_probe_input.json
Oracle: pose_probe_oracle.json
ID: ${probe.probe_id}
Animation: ${probe.source?.animation||"?"} · Frame ${probe.source?.frame??"?"}

Kein erneutes Laden der Animation, kein Einfrieren und kein neuer Workflow nötig.`);
 }catch(e){
  console.error(e);setState("#oracleState","REPO-LADEN FEHLER","bad");
  info("#oracleRepoInfo",`${e?.name||"Fehler"}: ${e?.message||String(e)}`)
 }
}
function oracleVertexStats(browser,official){
 if(!browser||!official||browser.length!==official.length)return null;
 let sum2=0,max=0,maxV=-1;const n=browser.length/3;
 for(let v=0;v<n;v++){const o=v*3,dx=Number(browser[o])-Number(official[o]),dy=Number(browser[o+1])-Number(official[o+1]),dz=Number(browser[o+2])-Number(official[o+2]),d=Math.hypot(dx,dy,dz);sum2+=d*d;if(d>max){max=d;maxV=v}}
 return {rmsMm:Math.sqrt(sum2/n)*1000,maxMm:max*1000,maxVertex:maxV}
}
function oracleRenderResultSummary(){
 if(!oracleProbe||!oracleResult)return;
 const rows=oracleErrorRows,meanA=rows.reduce((s,r)=>s+r.angleDeg,0)/rows.length,maxA=Math.max(...rows.map(r=>r.angleDeg)),rmsP=Math.sqrt(rows.reduce((s,r)=>s+r.positionMm*r.positionMm,0)/rows.length),maxP=Math.max(...rows.map(r=>r.positionMm)),vs=oracleVertexStats(oracleProbe.browser_vertices_display_y,oracleResult.oracle_vertices_display_y);
 const fkOk=maxA<.05&&maxP<.5&&(vs?.rmsMm??0)<.5;
 const top=rows.slice(0,8).map((r,i)=>`${i+1}. ${oracleFriendlyName(r.name)} (${r.name}) · Rotation ${r.angleDeg.toFixed(2)}° · Position ${r.positionMm.toFixed(1)} mm`).join("\n");
 info("#oracleResultInfo",`ERGEBNIS FÜR ${oracleProbe.source.animation} · FRAME ${oracleProbe.source.frame}

Gelb = Sammy Browser
Cyan = offizielles Anny
Rot/Orange = Browser-Bones mit großer Abweichung

Bone-Rotation: Mittel ${meanA.toFixed(3)}° · Max ${maxA.toFixed(3)}°
Bone-Position: RMS ${rmsP.toFixed(2)} mm · Max ${maxP.toFixed(2)} mm
${vs?`Vertices: RMS ${vs.rmsMm.toFixed(2)} mm · Max ${vs.maxMm.toFixed(2)} mm (Vertex ${vs.maxVertex})`:"Vertexvergleich nicht verfügbar."}

${fkOk?"✓ WICHTIG: Browser-FK/Skinning stimmen praktisch mit offiziellem Anny überein. Dann liegt der grobe Fehler VOR dieser Stufe – also in unserer Axis16→Public78/Zielorientierungs-Abbildung.":"⚠ WICHTIG: Browser und offizielles Anny unterscheiden sich bereits bei FK/Skinning. Dann reparieren wir GENAU diese Stufe und lassen das Axis16-Mapping zunächst unangetastet."}

Größte Abweichungen:
${top}`);
 const sel=$("#oracleWorstBone");sel.innerHTML="";for(const r of rows.slice(0,20)){const o=document.createElement("option");o.value=String(r.index);o.textContent=`${oracleFriendlyName(r.name)} · ${r.angleDeg.toFixed(1)}° · ${r.positionMm.toFixed(0)} mm`;sel.appendChild(o)}sel.disabled=false
}
function applyRigOracleResult(result){
 if(!oracleProbe)throw new Error("Die Pose-Probe fehlt.");
 if(result.schema!=="sammy-pose-oracle-v1")throw new Error(`Oracle Schema ${result.schema||"?"} statt sammy-pose-oracle-v1.`);
 if(result.probe_id!==oracleProbe.probe_id)throw new Error(`Oracle gehört nicht zu dieser Probe: ${result.probe_id} ≠ ${oracleProbe.probe_id}`);
 if(result.oracle_bone_poses_display_y?.length!==78*16)throw new Error("Oracle enthält nicht 78 Bone-Posen.");
 oracleResult=result;
 const parents=oracleProbe.bone_parents,browser=oracleProbe.browser_bone_poses_display_y,official=result.oracle_bone_poses_display_y;
 oracleErrorRows=oracleCompareRows(browser,official,parents);const errMap=new Map(oracleErrorRows.map(r=>[r.index,r]));
 if(oracleBrowserSkeleton)oracleDisposeObject(oracleBrowserSkeleton);oracleBrowserSkeleton=buildThickOracleSkeleton(browser,parents,{kind:"browser",errors:errMap});
 if(oracleOfficialSkeleton)oracleDisposeObject(oracleOfficialSkeleton);oracleOfficialSkeleton=buildThickOracleSkeleton(official,parents,{kind:"official"});
 if(result.oracle_vertices_display_y?.length===geometry.attributes.position.count*3){oracleBuildOfficialMesh(result.oracle_vertices_display_y);$("#oracleToggleOfficialMesh").disabled=false}
 oracleRenderResultSummary();
 oracleSetStep(3,"done","Oracle passt exakt zur gespeicherten Probe. Cyan = offizielles Anny; Gelb/Orange/Rot = Browser.");
 oracleSetStep(4,"active","Jetzt erst interpretieren: Die Zahlen unten sagen uns automatisch, ob FK/Skinning oder das vorgelagerte Mapping falsch ist.");
 setState("#oracleState","ORACLE GELADEN","ok")
}
async function loadRigOracleResult(file){
 try{
  if(!file)throw new Error("Keine Oracle-Datei gewählt.");
  if(!oracleProbe){
   await restoreOracleProbeFromCache();
   if(oracleProbe)await oracleRestoreSceneFromProbe(oracleProbe)
  }
  if(!oracleProbe)throw new Error("Keine passende Pose-Probe mehr im Speicher/Cache. Nutze stattdessen „Probe + Oracle direkt aus Repo laden“.");
  const result=JSON.parse(await file.text());
  applyRigOracleResult(result)
 }catch(e){console.error(e);oracleSetStep(3,"error",e.message||String(e));setState("#oracleState","ORACLE FEHLER","bad")}
}

function toggleOracleOfficialMesh(){
 oracleOfficialMeshVisible=!oracleOfficialMeshVisible;if(oracleOfficialMesh)oracleOfficialMesh.visible=oracleOfficialMeshVisible;
 $("#oracleToggleOfficialMesh").classList.toggle("activeAnim",oracleOfficialMeshVisible)
}
function exitRigOracleComparison(){
 oracleModeActive=false;oracleResult=null;oracleProbe=null;oracleErrorRows=[];oracleOfficialMeshVisible=false;
 for(const o of [oracleBrowserSkeleton,oracleOfficialSkeleton,oracleOfficialMesh])oracleDisposeObject(o);
 oracleBrowserSkeleton=oracleOfficialSkeleton=oracleOfficialMesh=null;oracleRestoreBody();
 $("#oracleExportProbe").disabled=true;$("#oracleResultFile").disabled=true;$("#oracleToggleOfficialMesh").disabled=true;$("#oracleWorstBone").disabled=true;
 for(let n=1;n<=4;n++)oracleSetStep(n,n===1?"active":"waiting",n===1?"Starte mit genau einem eingefrorenen Frame.":"");
 setState("#oracleState","BEREIT","warn");
 try{updateShape()}catch(e){console.warn("Oracle exit shape restore",e)}
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

function installEmbeddedAxis16MixamoReference(){
 if(mixamoReferencePose?.source==="embedded-axis16"&&mixamoReferencePose?.staticQ?.size===65)return mixamoReferencePose;
 if(!poseReady||!poseTWorld||poseJointCount!==78)throw new Error("Axis16-Referenz kann erst nach dem Public78-Rig installiert werden.");

 const publicByName=new Map(PUBLIC_JOINT_NAMES.map((n,i)=>[n,i]));
 const worldMats=MIXAMO_XBOT_CONTRACT.map(spec=>{
  const sj=publicByName.get(spec.source);
  if(sj==null)throw new Error(`Embedded Axis16: SOMA Source-Joint fehlt: ${spec.source}`);
  const o=sj*16,p=new THREE.Vector3(poseTWorld[o+3],poseTWorld[o+7],poseTWorld[o+11]);
  return xbotWorldMatrix(spec.r,p)
 });
 const wmByName=new Map(MIXAMO_XBOT_CONTRACT.map((b,i)=>[b.name,i]));

 let transported=0,maxTransportDeg=0,maxTransportBone="";
 for(const [name,child] of Object.entries(MIXAMO_XBOT_PRIMARY_CHILD)){
  const i=wmByName.get(name),ci=wmByName.get(child);
  const xp0=MIXAMO_XBOT_BIND_POS[name],xp1=MIXAMO_XBOT_BIND_POS[child];
  if(i==null||ci==null||!xp0||!xp1)continue;
  const sp0=new THREE.Vector3().setFromMatrixPosition(worldMats[i]);
  const sp1=new THREE.Vector3().setFromMatrixPosition(worldMats[ci]);
  const xd=new THREE.Vector3(xp1[0]-xp0[0],xp1[1]-xp0[1],xp1[2]-xp0[2]).normalize();
  const sd=sp1.clone().sub(sp0).normalize();
  const deg=THREE.MathUtils.radToDeg(Math.acos(THREE.MathUtils.clamp(xd.dot(sd),-1,1)));
  worldMats[i]=transportXBotFrameToSomaSegment(worldMats[i],xp0,xp1,sp0,sp1);
  transported++;
  if(deg>maxTransportDeg){maxTransportDeg=deg;maxTransportBone=name}
 }
 if(transported!==52)throw new Error(`Embedded Axis16 Frame-Transport unvollständig: ${transported}/52`);

 const thumbL=refineThumbWorldFrames(worldMats,wmByName,"Left");
 const thumbR=refineThumbWorldFrames(worldMats,wmByName,"Right");

 const staticQ=new Map(),staticPos=new Map(),tmpQ=new THREE.Quaternion(),tmpV=new THREE.Vector3();
 for(let i=0;i<MIXAMO_XBOT_CONTRACT.length;i++){
  const spec=MIXAMO_XBOT_CONTRACT[i],key=mixamoBoneKey(spec.name),m=worldMats[i];
  tmpQ.setFromRotationMatrix(m).normalize();staticQ.set(key,tmpQ.clone());
  tmpV.setFromMatrixPosition(m);staticPos.set(key,tmpV.clone())
 }

 // Since v0.5.19 the actual motion zero is the STATIC Axis16 bridge.
 // The separately downloaded Mixamo "T-pose" clip was only being used to
 // recover/check this same static bridge contract. We can derive it exactly
 // from our own pinned Axis16 export code, so the extra FBX is redundant.
 mixamoReferencePose={
  bindQ:new Map([...staticQ].map(([k,q])=>[k,q.clone()])),
  bindPos:new Map([...staticPos].map(([k,p])=>[k,p.clone()])),
  staticQ,staticPos,boneCount:65,
  contractId:"xbot65",bridgeGeneration:"Axis16",
  clipName:"embedded-axis16-static",
  changed:0,maxChangeDeg:0,maxChangeBone:"",
  stabilityDeg:0,stabilityBone:"",
  source:"embedded-axis16",
  transported,maxTransportDeg,maxTransportBone,
  thumbL,thumbR
 };
 mixamoReferenceName="Axis16 intern · fest eingebaut";

 setState("#userAnimRefState","FEST EINGEBAUT","ok");
 info("#userAnimRefInfo",`✓ Axis16/XBotContract65 Referenz ist intern fest eingebaut.
Kein T-Pose-FBX mehr nötig.

Quelle: exakt derselbe 65-Bone-Vertrag, dieselben SOMA-T-Pose-Jointpositionen, derselbe 52-Bone-Frame-Transport und derselbe Thumb-Plane-Fix wie beim Sammy→Mixamo-Export.
Die importierte Animation wird weiterhin gegen diesen statischen Axis16-Vertrag geprüft, damit alte Axis14/15/Proxy54-Dateien nicht stillschweigend akzeptiert werden.`);

 return mixamoReferencePose
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

 // CRITICAL v0.7.1 FIX:
 // A Mixamo-returned T-pose FBX preserves our original static bind skeleton and
 // stores Mixamo's actual T-pose as ANIMATION CURVES. v0.5.8 incorrectly read
 // the untouched static skeleton as the reference. That makes a T-pose clip
 // itself non-zero, especially in hands/fingers. We must evaluate the T-pose
 // clip first, then capture those animated world orientations as reference zero.
 const clip=root.animations?.[0];
 if(!clip)throw new Error("Diese FBX enthält keine Mixamo-T-Pose-Animation. Bitte NICHT den direkten Sammy-App-Export als Referenz verwenden, sondern die bei Mixamo mit T-Pose versehene und wieder heruntergeladene FBX.");

 const staticQ=new Map(),staticPos=new Map(),tmpQ=new THREE.Quaternion(),tmpV=new THREE.Vector3();
 for(const [k,b] of bones){
  b.getWorldQuaternion(tmpQ);staticQ.set(k,tmpQ.clone());
  b.getWorldPosition(tmpV);staticPos.set(k,tmpV.clone())
 }

 const mixer=new THREE.AnimationMixer(root),action=mixer.clipAction(clip);
 action.reset().play();

 // Sample the actual animated T-pose at frame 0.
 mixer.setTime(0);root.updateMatrixWorld(true);
 const bindQ=new Map(),bindPos=new Map();
 let changed=0,maxChangeDeg=0,maxChangeBone="";
 for(const [k,b] of bones){
  b.getWorldQuaternion(tmpQ);bindQ.set(k,tmpQ.clone());
  b.getWorldPosition(tmpV);bindPos.set(k,tmpV.clone());
  const deg=THREE.MathUtils.radToDeg(staticQ.get(k).angleTo(tmpQ));
  if(deg>.01)changed++;
  if(deg>maxChangeDeg){maxChangeDeg=deg;maxChangeBone=k}
 }

 // A calibration file must really be a static T-pose, not an arbitrary motion
 // renamed to T-Pose. Sample the middle and end of the clip and compare every
 // bone to frame 0 in world space.
 let stabilityDeg=0,stabilityBone="";
 for(const t of [clip.duration*.5,Math.max(0,clip.duration-1e-6)]){
  mixer.setTime(t);root.updateMatrixWorld(true);
  for(const [k,b] of bones){
   b.getWorldQuaternion(tmpQ);
   const deg=THREE.MathUtils.radToDeg(bindQ.get(k).angleTo(tmpQ));
   if(deg>stabilityDeg){stabilityDeg=deg;stabilityBone=k}
  }
 }
 if(stabilityDeg>.25){
  action.stop();mixer.stopAllAction();mixer.uncacheRoot(root);
  throw new Error(`Die gewählte Referenz ist keine statische Mixamo-T-Pose. Max. Bewegung im Clip: ${stabilityDeg.toFixed(2)}° bei ${stabilityBone}. Bitte die echte T-Pose aus Mixamo herunterladen.`)
 }

 action.stop();mixer.stopAllAction();mixer.uncacheRoot(root);

 mixamoReferencePose={
  bindQ,bindPos,staticQ,staticPos,boneCount:bones.size,
  contractId:validation.contractId,bridgeGeneration:"Axis16",
  clipName:clip.name||"T-Pose",changed,maxChangeDeg,maxChangeBone,
  stabilityDeg,stabilityBone
 };
 mixamoReferenceName=file.name||"T-Pose.fbx";
 setState("#userAnimRefState","BEREIT","ok");
 info("#userAnimRefInfo",`✓ ${mixamoReferenceName}
Bones: ${bones.size}/65 ✓ · XBotContract65 / Axis16-Kalibrierung
Referenzquelle: ANIMIERTE Mixamo-T-Pose (${clip.name||"Clip"}), nicht statische FBX-Bindpose
T-Pose-Selbsttest: stabil · max ${stabilityDeg.toFixed(3)}° Drift
Mixamo-T-Pose unterscheidet ${changed} Bones >0,01° von der statischen Bridge · max ${maxChangeDeg.toFixed(1)}° bei ${maxChangeBone||"?"}
Die statische Axis16-Bridge ist ab v0.7.1 der Bewegungs-Nullpunkt. Der animierte Mixamo-T-Pose-Clip wird nur noch als Kalibrier-/Kompatibilitätsprüfung gespeichert, damit Mixamos eigene Wrist-/Thumb-Pose nicht versehentlich aus jeder Animation herausgerechnet wird.`)
}
function clearMixamoReferenceFile(){
 mixamoReferencePose=null;mixamoReferenceName="";
 try{installEmbeddedAxis16MixamoReference()}catch(e){
  console.warn("Embedded Axis16 reference not ready yet",e);
  setState("#userAnimRefState","WIRD INTERN GELADEN","warn")
 }
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
 installEmbeddedAxis16MixamoReference();
 if(mixamoReferencePose.contractId!==animationValidation.contractId){
  throw new Error("Mixamo-Animation stammt nicht vom fest eingebauten X-BotContract65/Axis16-Vertrag.");
 }

 // Verify the static source skeleton BEFORE applying animation. Mixamo normally
 // preserves the uploaded bridge rest rig exactly. Comparing that static rig to
 // the static rig stored with the T-pose reference prevents silently mixing
 // Axis14/15/16 generations even when all of them happen to contain 65 bones.
 let staticContractMaxDeg=0,staticContractBone="";
 const tmpStaticQ=new THREE.Quaternion();
 root.updateMatrixWorld(true);
 for(const [k,b] of bones){
  const rq=mixamoReferencePose.staticQ?.get(k);
  if(!rq)continue;
  b.getWorldQuaternion(tmpStaticQ);
  const deg=THREE.MathUtils.radToDeg(rq.angleTo(tmpStaticQ));
  if(deg>staticContractMaxDeg){staticContractMaxDeg=deg;staticContractBone=k}
 }
 if(staticContractMaxDeg>.75){
  throw new Error(`Die Animation stammt offenbar nicht von der fest eingebauten Axis16-Bridge. Statischer Rig-Abstand: ${staticContractMaxDeg.toFixed(2)}° bei ${staticContractBone}. Bitte nur Animationen verwenden, die mit dem aktuellen Sammy_XBotContract65_Axis16 zu Mixamo hochgeladen wurden.`)
 }

 const missing=MIXAMO_REQUIRED_BONES.filter(k=>!bones.has(k));
 if(missing.length)throw new Error(`Kein kompatibles Mixamo/X-Bot-Rig. Fehlende Bones: ${missing.join(", ")}`);

 const bindQ=new Map(),tmpQ=new THREE.Quaternion();
 for(const [k,b] of bones){
  // v0.7.1: motion zero is the STATIC Axis16 bridge, not Mixamo's animated
  // "T-Pose" clip. The latter contains deliberate pose offsets (especially
  // wrists/thumbs) and is part of Mixamo's actual animation pose space.
  // Subtracting it erased ~11.6° wrist and up to ~40.2° thumb world offsets.
  const staticRefQ=mixamoReferencePose?.staticQ?.get(k);
  if(staticRefQ)bindQ.set(k,staticRefQ.clone());
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

  const qNeck=delta("neck");
  const qHead=delta("head");
  // Mixamo Neck is placed at SOMA Neck1 and Mixamo Head at SOMA Head.
  // SOMA Neck2 lies physically between them. Use its actual T-pose location
  // to interpolate world motion instead of fixed 50/35% heuristics.
  const n1i=publicByName.get("Neck1"),n2i=publicByName.get("Neck2"),hi=publicByName.get("Head");
  const n1o=n1i*16,n2o=n2i*16,ho=hi*16;
  const n1p=new THREE.Vector3(poseTWorld[n1o+3],poseTWorld[n1o+7],poseTWorld[n1o+11]);
  const n2p=new THREE.Vector3(poseTWorld[n2o+3],poseTWorld[n2o+7],poseTWorld[n2o+11]);
  const hp=new THREE.Vector3(poseTWorld[ho+3],poseTWorld[ho+7],poseTWorld[ho+11]);
  const full=Math.max(1e-8,n1p.distanceTo(hp));
  const neckT=THREE.MathUtils.clamp(n1p.distanceTo(n2p)/full,0,1);
  setWorld("Neck1",qNeck);
  setWorld("Neck2",qNeck.clone().slerp(qHead,neckT).normalize());
  setWorld("Head",qHead);
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
    const dk=d.toLowerCase();
    if(d==="Thumb"){
     for(let n=1;n<=3;n++){
      const key=`${lo}handthumb${n}`;
      if(bones.has(key))setWorld(`${side}HandThumb${n}`,delta(key));
      else if(n===1)inherit(`${side}HandThumb${n}`,`${side}Hand`);
      else inherit(`${side}HandThumb${n}`,`${side}HandThumb${n-1}`)
     }
     const k4=`${lo}handthumb4`;
     if(bones.has(k4))setWorld(`${side}HandThumbEnd`,delta(k4));else inherit(`${side}HandThumbEnd`,`${side}HandThumb3`)
    }else{
     // SOMA Finger1 is the extra metacarpal joint inside the palm.
     // Keep it with Hand. Mixamo Finger1 is the MCP/knuckle and maps to
     // SOMA Finger2; Finger2->3, Finger3->4, Finger4->End.
     inherit(`${side}Hand${d}1`,`${side}Hand`);
     for(let mx=1;mx<=3;mx++){
      const key=`${lo}hand${dk}${mx}`,soma=mx+1;
      if(bones.has(key))setWorld(`${side}Hand${d}${soma}`,delta(key));
      else if(soma===2)inherit(`${side}Hand${d}${soma}`,`${side}Hand${d}1`);
      else inherit(`${side}Hand${d}${soma}`,`${side}Hand${d}${soma-1}`)
     }
     const k4=`${lo}hand${dk}4`;
     if(bones.has(k4))setWorld(`${side}Hand${d}End`,delta(k4));
     else inherit(`${side}Hand${d}End`,`${side}Hand${d}4`)
    }
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
  mixamoSkeletonKind:animationValidation.kind,prunedTerminalCount:animationValidation.missing.length,
  staticContractMaxDeg,staticContractBone,referenceStabilityDeg:mixamoReferencePose.stabilityDeg||0
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
  userAnimRel=conv.data;userAnimFrames=conv.frames;userAnimLoaded=true;userAnimName=name;userAnimSource=conv.format;userAnimCurrentFrame=0;
  if($("#animCompareFrame")){$("#animCompareFrame").min="0";$("#animCompareFrame").max=String(Math.max(0,conv.frames-1));$("#animCompareFrame").value="0"}
  userAnimFps=conv.fps||Number($("#animImportFps")?.value||30)||30;
  if(conv.fps&&$("#animImportFps"))$("#animImportFps").value=String(conv.fps);
  $("#animUser").disabled=false;setState("#userAnimState","BEREIT","ok");
  info("#userAnimInfo",`✓ ${name}
Format: ${conv.format}
Frames: ${conv.frames} · Joints/Bones: ${conv.rawJ} → ${poseJointCount} Public-Joints
${conv.duration?`Clip: ${conv.clipName||"Mixamo"} · ${conv.duration.toFixed(2)} s · ${conv.animatedBoneCount||"?"} animierte Bones
`:""}${conv.mixamoSkeletonKind==="mixamo-motion54"?`Mixamo Motion-Skeleton: 54/65 · 11 nicht animierte Terminal-Bones wurden von Mixamo entfernt und werden von Sammy geerbt
`:""}${conv.referenceUsed?`Referenzdatei: ${conv.referenceName||"geladen"} · Axis16-Vertrag geprüft
Motion-Zero: STATISCHE Axis16-Bridge (v0.7.1)
T-Pose-Stabilität: ${Number(conv.referenceStabilityDeg||0).toFixed(3)}° · statischer Bridge-Match Animation↔Referenz: ${Number(conv.staticContractMaxDeg||0).toFixed(3)}°${conv.staticContractBone?` (${conv.staticContractBone})`:""}
`:""}Playback: ${userAnimFps} fps · Root Translation: ${conv.hasRootTranslation?"vorhanden, v0.7.1 spielt bewusst in-place":"keine"}
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

function startPoseAnimation(mode,startFrame=0){
 if(!poseReady||!poseEulerDeg)return;
 if(mode==="official"&&!officialAnimLoaded)return;
 if(mode==="user"&&!userAnimLoaded)return;
 poseAnimMode=mode;
 poseAnimRunning=true;
 const resumeF=Math.max(0,Number(startFrame)||0);
 const resumeFps=mode==="user"?userAnimFps:mode==="official"?officialAnimFps:0;
 const resumeMs=resumeFps>0?(resumeF/resumeFps)/Math.max(.001,poseAnimSpeed)*1000:0;
 poseAnimStart=performance.now()-resumeMs;
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
  if(isUser){
   userAnimCurrentFrame=f;
   if($("#animCompareFrame")&&!$("#animCompareFrame").matches(":focus"))$("#animCompareFrame").value=String(f);
   sammySyncAnimationUi()
  }
  const relFrame=data.subarray(off,off+poseJointCount*9);
  if(isUser&&morphSammyTargetActive&&shapeEngine==="anny")r=applyAnnyAxis16RetargetPose(currentDisplayRest(),relFrame,false,false,"Mixamo Axis16 → morphbares Anny/SOMA");
  else r=applyRelativePoseMatrices(currentDisplayRest(),relFrame,false,false,isUser?"Import-Motion":"NVIDIA-Motion");
  if(isUser&&mixamoCompareVisible&&mixamoCompareBridge)applyRelativeToExactAxis16Bridge(mixamoCompareBridge,relFrame)
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
 try{installEmbeddedAxis16MixamoReference()}catch(e){console.warn("Embedded Axis16 reference pending",e)}
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
function bootStatus(stage,detail="",cls="warn"){
 setState("#startupState",stage,cls);info("#startupInfo",detail);
 const toast=$("#sammyBootToast"),title=$("#sammyBootTitle"),body=$("#sammyBootDetail");
 if(!toast)return;
 clearTimeout(sammyBootHideTimer);
 title.textContent=stage;
 body.textContent=String(detail||"").split("\n")[0];
 const splashStage=$("#sammySplashStage");if(splashStage)splashStage.textContent=String(detail||stage).split("\n")[0];
 toast.classList.remove("done","error","visible");
 if(cls==="bad"){
  toast.classList.add("visible","error");
 }else if(cls==="ok"){
  sammyBootHideTimer=setTimeout(()=>{toast.classList.add("done");toast.classList.remove("visible")},800)
 }
}
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

  bootStatus("START 5/7","Anny Mid 18.056 wird geladen …");
  if(!(await setDisplayLOD("mid")))throw new Error("Mid-LOD konnte nicht aktiviert werden.");

  bootStatus("START 6/7","Morphbares Sammy + exaktes Anny/SOMA-Rig werden aktiviert …");
  if(!(await activateMorphableSammyTarget()))throw new Error("Morphbares Sammy konnte nicht aktiviert werden.");

  bootStatus("START 7/7","Sammy ist bereit. Kamera wird gesetzt …");
  frame();autoBootDone=true;
  bootStatus("SAMMY BEREIT",`Anny/SOMA Mid · morphbares Sammy · Axis16 intern · ${currentDisplayRest().length/3} Vertices`,"ok");
  await sammyOnRuntimeReady();
  testRig().catch(e=>console.warn("Background rig contract check",e));
  restoreOracleProbeFromCache().then(p=>{
   if(!p)return;
   $("#oracleLoadRepoPair").disabled=false;$("#oracleResultFile").disabled=false;
   oracleSetStep(1,"done",`Letzte Pose-Probe im iPhone-Cache gefunden: ${p.source?.animation||"?"} · Frame ${p.source?.frame??"?"}.`);
   oracleSetStep(2,"done","Die exakte Probe wurde über den Seiten-Reset hinweg erhalten.");
   oracleSetStep(3,"active","Du kannst direkt das Oracle aus dem Repo laden. Animation/Frame müssen nicht neu geladen werden.");
   setState("#oracleState","PROBE IM CACHE","ok")
  }).catch(()=>{});
  return true
 }catch(e){
  console.error("Auto-start failed",e);
  bootStatus("START FEHLER",`${e?.name||"Fehler"}: ${e?.message||String(e)}

Die App bleibt bedienbar. „Automatik erneut starten“ versucht nur die fehlenden Schritte; persistente Assets werden aus dem iPhone-Cache wiederverwendet.`,"bad");
  setTimeout(()=>{sammyHideSplash();document.body.classList.add("sammy-ready")},1400);
  return false
 }finally{autoBootRunning=false;$("#retryStartup").disabled=false}
}


/* ================================================================
   SAMMY v0.7.1 production shell
   ================================================================ */
let sammyBootHideTimer=0;
let sammyIntroActive=false,sammyIntroRel=null,sammyIntroFrames=0,sammyIntroFps=30,sammyIntroStart=0,sammyIntroPhase="idle",sammyIntroBlendStart=0,sammyIntroBlendFrom=null,sammyEditPoseRel=null;
let sammyIntroEditCameraStarted=false;
const SAMMY_INTRO_EDIT_CAMERA_LEAD_SECONDS=1.0;
let sammyCameraTween=null;
let sammyPreAnimationCamera=null;
let sammyCameraReferenceHeightCm=0;
let sammyAnimationLibrary=[],sammyActiveAnimationId=null,sammyAnimationSeq=1,sammyLibraryLoading=false;

let sammySkeletonViewActive=false,sammySkeletonSavedMaterial=null,sammyOriginalIndex=null,sammySkeletonShellIndex=null,sammySkeletonIndexSignature="";

let sammyErrors=[];
let sammyUiReady=false;
let sammyPanelResize=null;
const SAMMY_UI_KEY="sammy-v064-ui";
const SAMMY_BUBBLE_SIZE=54;
const SAMMY_BUBBLE_PAD=8;
const SAMMY_BUBBLE_GAP=12;
const SAMMY_BUBBLE_SNAP=26;
const SAMMY_BUBBLE_DETACH=52;
let sammyBubbleRegistry={};
let sammyBubbleGroupSeq=1;

const SAMMY_MEASURE_KEY="sammy-measure-calibration-v2-072";
const SAMMY_MEASURE_LEGACY_KEY="sammy-measure-calibration-v1";
const SAMMY_MEASURE_FACTORY_V1={"schema":"sammy-measure-calibration-v1","male":{"stature":{"offsetCm":0,"comment":"","status":"bestätigt"},"biacromial_breadth":{"offsetCm":2.2,"comment":"Strecke zwischen den beiden in T Pose sichtbaren Tiefpunkten auf den Schultern","status":"prüfen"},"chest_circumference":{"offsetCm":12,"comment":"","status":"prüfen"},"chest_breadth":{"offsetCm":11.2,"comment":"Gleiche Höhe wie Brustumfang","status":"prüfen"},"chest_depth":{"offsetCm":12,"comment":"Gleiche Höhe wie Brustumfang ","status":"prüfen"},"waist_circumference":{"offsetCm":0,"comment":"","status":"bestätigt"},"waist_breadth":{"offsetCm":0,"comment":"","status":"bestätigt"},"waist_depth":{"offsetCm":0,"comment":"","status":"bestätigt"},"buttock_circumference":{"offsetCm":-3.3,"comment":"","status":"prüfen"},"hip_breadth":{"offsetCm":-3.3,"comment":"","status":"prüfen"},"crotch_height":{"offsetCm":-2.9,"comment":"","status":"prüfen"}},"female":{"stature":{"offsetCm":0,"comment":"","status":"bestätigt"},"biacromial_breadth":{"offsetCm":4.1,"comment":"Siehe männliche Definition ","status":"prüfen"},"chest_circumference":{"offsetCm":11.2,"comment":"","status":"prüfen"},"chest_breadth":{"offsetCm":10.1,"comment":"Auf Höhe Brüste","status":"prüfen"},"chest_depth":{"offsetCm":11.2,"comment":"Bis vorderkante Brüste - nur bei Frauen","status":"prüfen"},"waist_circumference":{"offsetCm":0,"comment":"","status":"bestätigt"},"waist_breadth":{"offsetCm":0,"comment":"","status":"bestätigt"},"waist_depth":{"offsetCm":0,"comment":"","status":"bestätigt"},"buttock_circumference":{"offsetCm":-3.3,"comment":"","status":"prüfen"},"hip_breadth":{"offsetCm":-3.3,"comment":"","status":"prüfen"},"crotch_height":{"offsetCm":-5.5,"comment":"","status":"prüfen"}}};
const SAMMY_MEASURE_FACTORY_V2={"schema":"sammy-measure-calibration-v2","common":{"stature":{"offsetCm":0,"spanOffsetCm":0,"comment":"","status":"bestätigt"},"biacromial_breadth":{"offsetCm":0,"spanOffsetCm":0.3,"comment":"","status":"ungeprüft"},"chest_circumference":{"offsetCm":14,"spanOffsetCm":0,"comment":"","status":"ungeprüft"},"chest_breadth":{"offsetCm":0,"spanOffsetCm":0,"comment":"","status":"ungeprüft"},"chest_depth":{"offsetCm":0,"spanOffsetCm":0,"comment":"","status":"ungeprüft"},"waist_circumference":{"offsetCm":0,"spanOffsetCm":0,"comment":"","status":"bestätigt"},"waist_breadth":{"offsetCm":0,"spanOffsetCm":0,"comment":"","status":"bestätigt"},"waist_depth":{"offsetCm":0,"spanOffsetCm":0,"comment":"","status":"bestätigt"},"buttock_circumference":{"offsetCm":-3.3,"spanOffsetCm":0,"comment":"","status":"prüfen"},"hip_breadth":{"offsetCm":-3.3,"spanOffsetCm":0,"comment":"","status":"prüfen"},"crotch_height":{"offsetCm":0,"spanOffsetCm":0,"comment":"","status":"ungeprüft"},"torso_height":{"offsetCm":0,"spanOffsetCm":0,"comment":"","status":"ungeprüft"},"neck_circumference":{"offsetCm":0,"spanOffsetCm":0,"comment":"","status":"ungeprüft"},"neck_base_circumference":{"offsetCm":0,"spanOffsetCm":0,"comment":"","status":"ungeprüft"},"wrist_circumference":{"offsetCm":0,"spanOffsetCm":0,"comment":"","status":"ungeprüft"},"thigh_circumference":{"offsetCm":0,"spanOffsetCm":0,"comment":"","status":"ungeprüft"},"calf_circumference":{"offsetCm":0,"spanOffsetCm":0,"comment":"","status":"ungeprüft"},"ankle_circumference":{"offsetCm":0,"spanOffsetCm":0,"comment":"","status":"ungeprüft"},"waist_back_length":{"offsetCm":0,"spanOffsetCm":0,"comment":"","status":"ungeprüft"},"upperarm_circumference":{"offsetCm":0,"spanOffsetCm":0,"comment":"","status":"ungeprüft"},"upperarm_length":{"offsetCm":0,"spanOffsetCm":0,"comment":"","status":"ungeprüft"},"lowerarm_length":{"offsetCm":0,"spanOffsetCm":0,"comment":"","status":"ungeprüft"},"tibiale_height":{"offsetCm":0,"spanOffsetCm":0,"comment":"","status":"ungeprüft"},"upperleg_height":{"offsetCm":0,"spanOffsetCm":0,"comment":"","status":"ungeprüft"},"front_chest_length":{"offsetCm":0,"spanOffsetCm":0,"comment":"","status":"ungeprüft"},"neck_height":{"offsetCm":0,"spanOffsetCm":0,"comment":"","status":"ungeprüft"},"shoulder_length":{"offsetCm":0,"spanOffsetCm":0,"comment":"","status":"ungeprüft"},"waist_to_hip":{"offsetCm":0,"spanOffsetCm":0,"comment":"","status":"ungeprüft"}},"male":{"stature":{"override":false},"biacromial_breadth":{"override":true,"offsetCm":2.2,"spanOffsetCm":0,"comment":"Strecke zwischen den beiden in T Pose sichtbaren Tiefpunkten auf den Schultern","status":"prüfen"},"chest_circumference":{"override":true,"offsetCm":12,"spanOffsetCm":0,"comment":"","status":"prüfen"},"chest_breadth":{"override":true,"offsetCm":11.2,"spanOffsetCm":0,"comment":"Gleiche Höhe wie Brustumfang","status":"prüfen"},"chest_depth":{"override":true,"offsetCm":12,"spanOffsetCm":0,"comment":"Gleiche Höhe wie Brustumfang ","status":"prüfen"},"waist_circumference":{"override":true,"offsetCm":3.4,"spanOffsetCm":0,"comment":"","status":"bestätigt"},"waist_breadth":{"override":true,"offsetCm":3.4,"spanOffsetCm":0,"comment":"","status":"bestätigt"},"waist_depth":{"override":false},"buttock_circumference":{"override":false},"hip_breadth":{"override":false},"crotch_height":{"override":true,"offsetCm":-5.9,"spanOffsetCm":0,"comment":"","status":"prüfen"},"torso_height":{"override":true,"offsetCm":-5.6,"spanOffsetCm":0,"comment":"","status":"prüfen"},"neck_circumference":{"override":true,"offsetCm":0,"spanOffsetCm":0,"comment":"Rechtwinklig zu Hals ausrichten","status":"prüfen"},"neck_base_circumference":{"override":true,"offsetCm":4.9,"spanOffsetCm":0,"comment":"","status":"bestätigt"},"wrist_circumference":{"override":false},"thigh_circumference":{"override":true,"offsetCm":0,"spanOffsetCm":0,"comment":"Vorsicht aktuell wird zweites Bein mit gemessen - bitte sauber trennen!","status":"prüfen"},"calf_circumference":{"override":true,"offsetCm":6.7,"spanOffsetCm":0,"comment":"Vorsicht - nur ein Bein messen","status":"prüfen"},"ankle_circumference":{"override":false},"waist_back_length":{"override":true,"offsetCm":0,"spanOffsetCm":0,"comment":"","status":"bestätigt"},"upperarm_circumference":{"override":true,"offsetCm":4.8,"spanOffsetCm":0,"comment":"","status":"prüfen"},"upperarm_length":{"override":true,"offsetCm":0.4,"spanOffsetCm":0,"comment":"","status":"bestätigt"},"lowerarm_length":{"override":true,"offsetCm":0,"spanOffsetCm":0,"comment":"","status":"bestätigt"},"tibiale_height":{"override":true,"offsetCm":0,"spanOffsetCm":0,"comment":"","status":"bestätigt"},"upperleg_height":{"override":true,"offsetCm":0,"spanOffsetCm":0,"comment":"","status":"bestätigt"},"front_chest_length":{"override":true,"offsetCm":0,"spanOffsetCm":0,"comment":"","status":"bestätigt"},"neck_height":{"override":true,"offsetCm":0,"spanOffsetCm":0,"comment":"","status":"bestätigt"},"shoulder_length":{"override":true,"offsetCm":0,"spanOffsetCm":0,"comment":"","status":"bestätigt"},"waist_to_hip":{"override":true,"offsetCm":0,"spanOffsetCm":0,"comment":"Vermutlich unwichtig ","status":"bestätigt"}},"female":{"stature":{"override":false},"biacromial_breadth":{"override":true,"offsetCm":4.1,"spanOffsetCm":0,"comment":"Siehe männliche Definition ","status":"prüfen"},"chest_circumference":{"override":true,"offsetCm":11.2,"spanOffsetCm":0,"comment":"","status":"prüfen"},"chest_breadth":{"override":true,"offsetCm":10.1,"spanOffsetCm":0,"comment":"Auf Höhe Brüste","status":"prüfen"},"chest_depth":{"override":true,"offsetCm":11.2,"spanOffsetCm":0,"comment":"Bis vorderkante Brüste - nur bei Frauen","status":"prüfen"},"waist_circumference":{"override":true,"offsetCm":5.6,"spanOffsetCm":0,"comment":"","status":"bestätigt"},"waist_breadth":{"override":true,"offsetCm":3.8,"spanOffsetCm":0,"comment":"","status":"prüfen"},"waist_depth":{"override":false},"buttock_circumference":{"override":false},"hip_breadth":{"override":false},"crotch_height":{"override":true,"offsetCm":-6.9,"spanOffsetCm":0,"comment":"","status":"prüfen"},"torso_height":{"override":true,"offsetCm":-7,"spanOffsetCm":0,"comment":"","status":"prüfen"},"neck_circumference":{"override":true,"offsetCm":0,"spanOffsetCm":0,"comment":"Rechtwinklig zu Hals ausrichten!","status":"prüfen"},"neck_base_circumference":{"override":true,"offsetCm":4.2,"spanOffsetCm":0,"comment":"","status":"bestätigt"},"wrist_circumference":{"override":false},"thigh_circumference":{"override":true,"offsetCm":0,"spanOffsetCm":0,"comment":"Vorsicht aktuell wird zweites Bein mit gemessen - bitte sauber trennen!","status":"prüfen"},"calf_circumference":{"override":true,"offsetCm":6.5,"spanOffsetCm":0,"comment":"","status":"prüfen"},"ankle_circumference":{"override":false},"waist_back_length":{"override":false},"upperarm_circumference":{"override":false},"upperarm_length":{"override":false},"lowerarm_length":{"override":false},"tibiale_height":{"override":false},"upperleg_height":{"override":false},"front_chest_length":{"override":false},"neck_height":{"override":false},"shoulder_length":{"override":false},"waist_to_hip":{"override":false}}};
const SAMMY_MEASURE_DEFS=[
 {id:"stature",label:"Körperhöhe",ansur:"stature",kind:"stature",adjustable:false,range:0,group:"Basis",
  ansurInfo:"Stature: standardisierte stehende Körperhöhe vom Boden bis zum höchsten Punkt des Kopfes bei aufrechter Messhaltung.",
  implementation:"Vertikale Ausdehnung des T-Posen-Meshes."},
 {id:"biacromial_breadth",label:"Schulterbreite",ansur:"biacromialbreadth",kind:"shoulder",adjustable:true,range:8,spanAdjust:true,spanRange:16,group:"Rumpf",
  ansurInfo:"Biacromial Breadth: gerade Distanz zwischen dem rechten und linken Acromion-Landmark.",
  implementation:"Proxy über die beiden SOMA-Oberarmköpfe (LeftArm/RightArm). Höhe und symmetrische Gesamtbreite sind kalibrierbar."},
 {id:"chest_circumference",label:"Brustumfang",ansur:"chestcircumference",kind:"sliceCirc",section:"chest",adjustable:true,range:16,group:"Rumpf",
  ansurInfo:"Chest Circumference: horizontaler Umfang um den Brustkorb auf der standardisierten Brusthöhe; das Band liegt an, ohne einzuschnüren.",
  implementation:"Planarer horizontaler Meshschnitt; die konvexe Hülle überspannt enge Einschnitte wie ein straffes Maßband."},
 {id:"chest_breadth",label:"Brustbreite",ansur:"chestbreadth",kind:"sliceWidth",section:"chest",adjustable:true,range:16,spanAdjust:true,spanRange:20,group:"Rumpf",
  ansurInfo:"Chest Breadth: geradlinige transversale Brustkorbbereite auf der standardisierten Brusthöhe.",
  implementation:"X-Breite des Brustschnitts. Der zweite Slider korrigiert die Gesamtbreite symmetrisch: beide Endpunkte bewegen sich um den halben Betrag."},
 {id:"chest_depth",label:"Brusttiefe",ansur:"chestdepth",kind:"sliceDepth",section:"chest",adjustable:true,range:16,spanAdjust:true,spanRange:20,spanLabel:"Tiefenkorrektur gesamt",group:"Rumpf",
  ansurInfo:"Chest Depth: anteroposteriore Tiefe des Brustkorbs auf der standardisierten Brusthöhe.",
  implementation:"Z-Tiefe des planaren Brustschnitts. Die optionale Tiefenkorrektur verschiebt Vorder- und Rückpunkt symmetrisch."},
 {id:"waist_circumference",label:"Taillenumfang",ansur:"waistcircumference",kind:"sliceCirc",section:"waist",adjustable:true,range:14,group:"Rumpf",
  ansurInfo:"Waist Circumference (Omphalion): horizontaler Umfang auf Höhe des Omphalion, also des Bauchnabelniveaus.",
  implementation:"Planarer horizontaler Meshschnitt mit konvexer Maßbandhülle."},
 {id:"waist_breadth",label:"Taillenbreite",ansur:"waistbreadth",kind:"sliceWidth",section:"waist",adjustable:true,range:14,spanAdjust:true,spanRange:18,group:"Rumpf",
  ansurInfo:"Waist Breadth: gerade Links-Rechts-Breite auf Omphalion-Höhe.",
  implementation:"X-Breite des Taillenschnitts; Gesamtbreite symmetrisch kalibrierbar."},
 {id:"waist_depth",label:"Taillentiefe",ansur:"waistdepth",kind:"sliceDepth",section:"waist",adjustable:true,range:14,spanAdjust:true,spanRange:18,spanLabel:"Tiefenkorrektur gesamt",group:"Rumpf",
  ansurInfo:"Waist Depth: anteroposteriore Tiefe des Rumpfes auf standardisierter Taillenhöhe.",
  implementation:"Z-Tiefe des Taillenschnitts; optional symmetrisch korrigierbar."},
 {id:"natural_waist_circumference",label:"Taille · Minimum",ansur:"Sammy natural waist",kind:"sliceCirc",section:"naturalWaist",adjustable:false,range:0,group:"Rumpf",internal:true,autoSearch:"min",
  ansurInfo:"Sammy-Zusatzmaß, getrennt von ANSUR Waist Circumference (Omphalion): kleinster horizontaler Rumpfumfang innerhalb der natürlichen Taillenzone.",
  implementation:"Automatische Minimum-Suche im Rumpfbereich zwischen Omphalion und unterem Brustkorb; ANSUR-Omphalion bleibt als eigenes Nabelmaß unverändert."},
 {id:"buttock_circumference",label:"Gesäßumfang",ansur:"buttockcircumference",kind:"sliceCirc",section:"hip",adjustable:true,range:16,group:"Becken",
  ansurInfo:"Buttock Circumference: horizontaler Umfang auf Höhe der maximalen hinteren Gesäßausladung.",
  implementation:"Planarer Hüftschnitt; die konvexe Hülle überspannt Gesäßfurche und andere enge Konkavitäten."},
 {id:"hip_breadth",label:"Hüftbreite",ansur:"hipbreadth",kind:"sliceWidth",section:"hip",adjustable:true,range:16,spanAdjust:true,spanRange:20,group:"Becken",
  ansurInfo:"Hip Breadth: direkte horizontale Breitenmessung über den Hüft-/Beckenbereich.",
  implementation:"X-Breite des Hüftschnitts; Gesamtbreite symmetrisch kalibrierbar. Keine unbestätigte Hip Depth."},
 {id:"hip_circumference",label:"Hüftumfang",ansur:"Sammy hip circumference",kind:"sliceCirc",section:"hipLevel",adjustable:false,range:0,group:"Becken",internal:true,
  ansurInfo:"Sammy-Zusatzmaß: horizontaler Umfang auf derselben höheren Becken-/Hüftebene wie Hip Breadth; bewusst getrennt vom tieferen ANSUR Buttock Circumference.",
  implementation:"Dynamische Hüftebene im oberen Beckenbereich; Umfang und Hüftbreite werden auf exakt derselben Ebene gemessen."},
 {id:"crotch_height",label:"Crotch Height / Innenbein",ansur:"crotchheight",kind:"crotchHeight",adjustable:true,range:12,group:"Beine",
  ansurInfo:"Crotch Height: vertikale Höhe vom Boden bis zum standardisierten Schritt-/Crotch-Niveau.",
  implementation:"Boden bis kalibrierbare Crotch-Ebene; bewusst kein Bekleidungs-Inseam."},
 {id:"torso_height",label:"Schulter → Schritt",ansur:"derived: acromialheight - crotchheight",kind:"torsoHeight",adjustable:true,range:10,group:"Abgeleitet",
  ansurInfo:"Abgeleitetes Body-Lab-Maß aus Schulter-/Acromialhöhe minus Crotch Height; kein einzelnes direkt erhobenes ANSUR-Maß.",
  implementation:"Vertikale Distanz zwischen mittlerer Oberarmkopf-/Acromion-Proxyhöhe und Crotch-Ebene."},
 {id:"neck_circumference",label:"Halsumfang",ansur:"neckcircumference",kind:"sliceCirc",section:"neck",adjustable:true,range:7,group:"Hals",
  ansurInfo:"Neck Circumference: Umfang um den Hals an der standardisierten ANSUR-Messhöhe; getrennt von Neck Circumference, Base.",
  implementation:"Schnitt senkrecht zur Halsachse im oberen/mittleren Halsbereich; bewusst oberhalb der dynamischen Halsbasis."},
 {id:"neck_base_circumference",label:"Halsumfang Basis",ansur:"neckcircumferencebase",kind:"sliceCirc",section:"neckBase",adjustable:true,range:8,group:"Hals",
  ansurInfo:"Neck Circumference, Base: eigener Umfang am unteren Halsansatz, wo der Hals in Schulter/Trapez übergeht.",
  implementation:"Dynamischer Schnitt am Übergang Hals → Trapez: Sammy sucht die stärkste lokale Aufweitung der Halsquerschnitte und setzt die Basis unmittelbar oberhalb davon."},
 {id:"wrist_circumference",label:"Handgelenkumfang",ansur:"wristcircumference",kind:"limbCircX",section:"wrist",adjustable:true,range:7,group:"Arme",
  ansurInfo:"Wrist Circumference: Umfang um das Handgelenk am standardisierten Landmark-Niveau.",
  implementation:"In T-Pose Schnitt senkrecht zur Armachse (X-Ebene) am rechten Handgelenk."},
 {id:"thigh_circumference",label:"Oberschenkelumfang",ansur:"thighcircumference",kind:"limbCircY",section:"thigh",adjustable:true,range:12,group:"Beine",
  ansurInfo:"Thigh Circumference: Umfang am rechten Oberschenkel auf der standardisierten ANSUR-Messhöhe.",
  implementation:"Horizontaler Schnitt durch das rechte Bein; auf die rechte Beinkomponente isoliert."},
 {id:"calf_circumference",label:"Wadenumfang",ansur:"calfcircumference",kind:"limbCircY",section:"calf",adjustable:true,range:10,group:"Beine",
  ansurInfo:"Calf Circumference: Umfang an der größten Wadenausprägung.",
  implementation:"Horizontaler Schnitt durch die rechte Wade; auf die rechte Beinkomponente isoliert."},
 {id:"ankle_circumference",label:"Knöchelumfang",ansur:"anklecircumference",kind:"limbCircY",section:"ankle",adjustable:true,range:7,group:"Beine",
  ansurInfo:"Ankle Circumference: standardisierter Umfang im Knöchelbereich; nicht Heel-Ankle Circumference.",
  implementation:"Horizontaler Schnitt durch den rechten Knöchelbereich."},
 {id:"waist_back_length",label:"Rückenlänge bis Taille",ansur:"waistbacklength",kind:"waistBackLength",adjustable:true,range:10,group:"Längen",
  ansurInfo:"Waist Back Length (Omphalion): Rückenlänge vom definierten oberen Rücken-/Nacken-Landmark zur Omphalion-Taillenebene.",
  implementation:"V1-Proxy als vertikale Rückenstrecke Neck1 → kalibrierbare Taillenebene; deshalb weiter als prüfbedürftig behandeln."},
 {id:"upperarm_circumference",label:"Oberarmumfang",ansur:"bicepscircumferenceflexed",kind:"limbCircX",section:"upperarm",adjustable:true,range:10,group:"Arme",
  ansurInfo:"ANSUR erfasst Biceps Circumference, Flexed in vorgeschriebener Flexions-/Anspannungsposition.",
  implementation:"T-Posen-Proxy senkrecht zur rechten Oberarmachse. Nicht als bereits identisch mit dem ANSUR-Flexed-Maß betrachten."},
 {id:"upperarm_length",label:"Oberarmlänge",ansur:"acromionradialelength",kind:"jointSegment",joints:["RightArm","RightForeArm"],adjustable:true,range:6,group:"Arme",
  ansurInfo:"Acromion-Radiale Length: Strecke vom Acromion an der Schulter zur Radiale-Landmark am Ellenbogen.",
  implementation:"SOMA-Proxy RightArm → RightForeArm; Positionsoffset verschiebt die sichtbare Linie orthogonal nur zur Kalibrierung."},
 {id:"lowerarm_length",label:"Unterarmlänge",ansur:"radialestylionlength",kind:"jointSegment",joints:["RightForeArm","RightHand"],adjustable:true,range:6,group:"Arme",
  ansurInfo:"Radiale-Stylion Length: standardisierte Strecke vom Radiale-Landmark zum Stylion am Handgelenk.",
  implementation:"SOMA-Proxy RightForeArm → RightHand."},
 {id:"tibiale_height",label:"Unterschenkelhöhe / Tibiale Height",ansur:"tibialheight",kind:"tibialeHeight",adjustable:true,range:10,group:"Beine",
  ansurInfo:"Tibiale Height: stehende Bodenhöhe des definierten Tibiale-Landmarks im Kniebereich.",
  implementation:"Boden → RightShin-Joint als kalibrierbarer Proxy."},
 {id:"upperleg_height",label:"Oberschenkelhöhe",ansur:"derived: trochanterionheight - tibialheight",kind:"upperlegHeight",adjustable:true,range:10,group:"Abgeleitet",
  ansurInfo:"Abgeleitet aus Trochanterion Height minus Tibiale Height; kein einzelnes direkt erhobenes ANSUR-Maß.",
  implementation:"Vertikale SOMA-Proxykomponente RightLeg → RightShin."},
 {id:"front_chest_length",label:"Vordere Bruststrecke",ansur:"MakeHuman internal",kind:"frontChest",adjustable:true,range:10,group:"MakeHuman Zusatz",internal:true,
  ansurInfo:"Kein direkt zugeordnetes ANSUR-II-Ziel im früheren Body-Lab-Kalibrationssatz.",
  implementation:"Interner Kontrollwert: vordere vertikale Rumpfstrecke von Neck1 zur Taillenebene; für Harness-/Morphdiagnose sichtbar."},
 {id:"neck_height",label:"Halshöhe",ansur:"MakeHuman internal",kind:"neckHeight",adjustable:true,range:6,group:"MakeHuman Zusatz",internal:true,
  ansurInfo:"Kein direkt zugeordnetes ANSUR-II-Ziel im früheren Body-Lab-Kalibrationssatz.",
  implementation:"Interner Proxy Neck1 → Neck2/Head-Bereich; dient nur der Morph-/Harnessdiagnose."},
 {id:"shoulder_length",label:"Schulterstrecke",ansur:"shoulderlength",kind:"shoulderLength",adjustable:true,range:6,group:"MakeHuman Zusatz",
  ansurInfo:"ANSUR führt Shoulder Length als eigenes Maß; es ist nicht identisch mit Biacromial Breadth.",
  implementation:"SOMA-Proxy RightShoulder → RightArm; separat von der geraden Gesamt-Schulterbreite."},
 {id:"waist_to_hip",label:"Taille → Hüfte",ansur:"MakeHuman internal",kind:"waistToHip",adjustable:true,range:10,group:"MakeHuman Zusatz",internal:true,
  ansurInfo:"Kein direktes ANSUR-II-Ziel; im früheren Body Lab als zusätzlicher Harness-relevanter Kontrollwert geführt.",
  implementation:"Vertikale Distanz zwischen kalibrierter Taillen- und Hüftebene."}
 ];
// v0.7.3 semantic measurement layer. Existing v2 calibration stays preserved as
// the human-reviewed seed, while these flags define which values are now found
// automatically on the current mesh instead of by a fixed slice position.
for(const id of ["calf_circumference","ankle_circumference","upperarm_circumference"]){
 const d=SAMMY_MEASURE_DEFS.find(x=>x.id===id);if(d)d.autoSearch=id==="ankle_circumference"?"min":"max"
}
{
 const d=SAMMY_MEASURE_DEFS.find(x=>x.id==="upperarm_circumference");
 if(d){d.ansur="Sammy mid-biceps circumference · ANSUR reference: bicepscircumferenceflexed";d.internal=true;d.ansurInfo="Sammy misst den Oberarm-/Bizepsumfang in T-Pose im mittleren Bizeps-/Trizepsbereich. ANSUR Biceps Circumference, Flexed bleibt posegebunden und ist nicht identisch.";d.implementation="Eng begrenzte Maximum-Suche um die Mitte des rechten Oberarms (ca. 52–68 % Schulter→Ellenbogen); Schulter-/Deltoidansatz und Ellenbogenbereich sind ausgeschlossen."}
 const i=SAMMY_MEASURE_DEFS.findIndex(x=>x.id==="upperarm_circumference");
 SAMMY_MEASURE_DEFS.splice(i+1,0,{id:"forearm_circumference",label:"Unterarmumfang · Maximum",ansur:"Sammy geometric maximum",kind:"limbCircPlane",section:"forearm",adjustable:false,range:0,group:"Arme",internal:true,autoSearch:"max",ansurInfo:"Sammy-internes Formmaß: größter Querschnitt des rechten Unterarms in T-Pose. Nicht mit einem posegebundenen ANSUR-Flexed-Maß gleichsetzen.",implementation:"Automatische Maximum-Suche entlang des rechten Unterarmsegments; Messebene senkrecht zur lokalen Unterarmachse."})
}
for(const id of ["torso_height","upperleg_height"]){const d=SAMMY_MEASURE_DEFS.find(x=>x.id===id);if(d){d.adjustable=false;d.range=0;d.implementation+=(id==="torso_height"?" v0.7.3: gemeinsam aus Acromion-/Schulterreferenz und Crotch-Landmark abgeleitet; kein separater Crotch-Offset.":" v0.7.3: aus Trochanter-/Beinproxy und demselben Tibiale-Landmark abgeleitet.")}}
for(const [id,src] of [["chest_breadth","chest_circumference"],["chest_depth","chest_circumference"],["waist_breadth","waist_circumference"],["waist_depth","waist_circumference"]]){const d=SAMMY_MEASURE_DEFS.find(x=>x.id===id);if(d){d.anchorSource=src;d.adjustable=false;d.implementation+=` v0.7.3: Messebene wird gemeinsam von ${src} geführt.`}}
{const d=SAMMY_MEASURE_DEFS.find(x=>x.id==="buttock_circumference");if(d)d.autoSearch="max"}
{const d=SAMMY_MEASURE_DEFS.find(x=>x.id==="hip_breadth");if(d){d.autoSearch="max";d.dynamicRule="upperPelvisLevel";d.implementation="Dynamische Hüftbreite in einer oberen Becken-/Hüftzone zwischen Crotch und Omphalion; bewusst von der tieferen Buttock-Maximum-Ebene entkoppelt. Hüftumfang nutzt exakt dieselbe Ebene."}}
{const d=SAMMY_MEASURE_DEFS.find(x=>x.id==="hip_circumference");if(d){d.anchorSource="hip_breadth";d.dynamicRule="upperPelvisLevel"}}
{const d=SAMMY_MEASURE_DEFS.find(x=>x.id==="chest_circumference");if(d){d.dynamicRule="nippleMorphLandmark";d.adjustable=false;d.implementation="Brustebene für Männer und Frauen direkt aus Annys Nipple-Morph-Topologie: nipple-point-incr markiert den Kernbereich, nipple-size-incr stabilisiert den Patch. Die aktuell gemorphten Positionen dieser semantischen Vertices definieren die gemeinsame horizontale Messebene für Brustumfang, Brustbreite und Brusttiefe. Alte feste Chest-Höhenoffsets werden für diese Ebene nicht mehr verwendet."}}
{const d=SAMMY_MEASURE_DEFS.find(x=>x.id==="waist_circumference");if(d){d.dynamicRule="navelMorphLandmark";d.adjustable=false;d.implementation="ANSUR-/Omphalion-Taillenebene direkt aus Annys Navel-Morph-Topologie: stomach-navel-out und stomach-navel-up markieren die Nabelregion. Die aktuell gemorphten Vertices definieren die gemeinsame horizontale Ebene für Taillenumfang, Taillenbreite und Taillentiefe; alte feste Höhenoffsets dienen nur noch als historischer Kalibrationsstand und werden für diese Ebene nicht mehr angewendet."}}
{const d=SAMMY_MEASURE_DEFS.find(x=>x.id==="crotch_height");if(d){d.dynamicRule="bulgeMorphLandmark";d.adjustable=false;d.implementation="Crotch-/Schritt-Höhenanker direkt aus Annys bulge-incr Morph-Topologie. Die aktuell gemorphten Vertices der zentralen Bulge-Region bestimmen die semantische Schritt-Höhe; alte feste Crotch-Höhenoffsets werden für diesen Landmark nicht mehr angewendet."}}
let sammyMeasureSession=null;
let sammyMeasureOverlayGroup=null;
let sammyMeasureSelected="chest_circumference";
let sammyMeasureOverlayMode="selected";
let sammyMeasureLandmarksVisible=true;
let sammyMeasureLabelsVisible=false;
let sammyMeasureTransientLabelId=null;
let sammyMeasureTransientLabelTimer=0;
let sammyMeasurePickStart=null;
let sammyMeasureInfoOpen=false;
let sammyMeasureCalibration=null;
let sammyMeasureLastSnapshots={male:null,female:null};
let sammyMeasureRefreshRaf=0;
let sammyMeasureResultsCache={};
let sammyNippleMorphPatchCache=null;
let sammyMeasureLegacyLandmarksForDelta=false; // Solver Lab R2 only: reproduces v0.8.4 waist/crotch semantics on the current mesh.
let sammyNavelMorphPatchCache=null;
let sammyBulgeMorphPatchCache=null;


function sammyUiLoadState(){
 try{return JSON.parse(localStorage.getItem(SAMMY_UI_KEY)||"{}")}catch{return {}}
}
function sammyUiSaveState(patch={}){
 try{
  const cur=sammyUiLoadState();
  localStorage.setItem(SAMMY_UI_KEY,JSON.stringify({...cur,...patch}))
 }catch{}
}
function escapeHtml(value){
 return String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]))
}
let sammyBubbleMotionRaf={};
function sammyCancelBubbleMotion(id){
 const raf=sammyBubbleMotionRaf[id];if(raf){cancelAnimationFrame(raf);delete sammyBubbleMotionRaf[id]}
}
function sammyCancelBubbleMotions(ids){for(const id of ids||[])sammyCancelBubbleMotion(id)}
function sammyBubbleSafeInsets(){
 const cs=getComputedStyle(document.documentElement);
 const num=k=>Math.max(0,parseFloat(cs.getPropertyValue(k))||0);
 return {top:num("--safe-top"),right:num("--safe-right"),bottom:num("--safe-bottom"),left:num("--safe-left")}
}
function sammyBubbleSpan(edge){
 const ins=sammyBubbleSafeInsets(),pad=SAMMY_BUBBLE_PAD,size=SAMMY_BUBBLE_SIZE;
 if(edge==="left"||edge==="right")return {min:ins.top+pad,max:innerHeight-ins.bottom-pad-size};
 return {min:ins.left+pad,max:innerWidth-ins.right-pad-size}
}
function sammyBubbleCrossValue(edge){
 const ins=sammyBubbleSafeInsets(),pad=SAMMY_BUBBLE_PAD,size=SAMMY_BUBBLE_SIZE;
 if(edge==="left")return ins.left+pad;
 if(edge==="right")return innerWidth-ins.right-pad-size;
 if(edge==="top")return ins.top+pad;
 return innerHeight-ins.bottom-pad-size
}
function sammyBubbleClampPos(x,y){
 const ins=sammyBubbleSafeInsets(),pad=SAMMY_BUBBLE_PAD,size=SAMMY_BUBBLE_SIZE;
 return {
  x:Math.max(ins.left+pad,Math.min(innerWidth-ins.right-pad-size,x)),
  y:Math.max(ins.top+pad,Math.min(innerHeight-ins.bottom-pad-size,y))
 }
}
function sammyNearestEdgeFromPos(x,y){
 const ins=sammyBubbleSafeInsets(),pad=SAMMY_BUBBLE_PAD,size=SAMMY_BUBBLE_SIZE;
 const d={
  left:Math.abs(x-(ins.left+pad)),
  right:Math.abs(x-(innerWidth-ins.right-pad-size)),
  top:Math.abs(y-(ins.top+pad)),
  bottom:Math.abs(y-(innerHeight-ins.bottom-pad-size))
 };
 return Object.entries(d).sort((a,b)=>a[1]-b[1])[0][0]
}
function sammyBubbleApply(id){
 const meta=sammyBubbleRegistry[id],el=document.getElementById(id);if(!meta||!el)return;
 el.style.left=`${meta.x}px`;el.style.top=`${meta.y}px`;el.style.right="auto";el.style.bottom="auto";
}
function sammyPersistBubbles(){
 const bubbles={};
 Object.entries(sammyBubbleRegistry).forEach(([id,m])=>{bubbles[id]={x:Math.round(m.x),y:Math.round(m.y),edge:m.edge||sammyNearestEdgeFromPos(m.x,m.y)}});
 sammyUiSaveState({bubbles})
}
function sammyBubbleVisible(id){const el=document.getElementById(id);return !!el&&!el.classList.contains("hidden")}
function sammyBubbleGroupMembers(id){
 const meta=sammyBubbleRegistry[id];if(!meta||!sammyBubbleVisible(id))return [id];
 const edge=meta.edge||sammyNearestEdgeFromPos(meta.x,meta.y),axis=(edge==="left"||edge==="right")?"y":"x";
 const step=SAMMY_BUBBLE_SIZE+SAMMY_BUBBLE_GAP,limit=step+SAMMY_BUBBLE_SNAP;
 const ids=Object.keys(sammyBubbleRegistry)
  .filter(k=>sammyBubbleVisible(k)&&(sammyBubbleRegistry[k].edge||sammyNearestEdgeFromPos(sammyBubbleRegistry[k].x,sammyBubbleRegistry[k].y))===edge)
  .sort((a,b)=>sammyBubbleRegistry[a][axis]-sammyBubbleRegistry[b][axis]);
 const at=ids.indexOf(id);if(at<0)return [id];
 let lo=at,hi=at;
 while(lo>0&&Math.abs(sammyBubbleRegistry[ids[lo]][axis]-sammyBubbleRegistry[ids[lo-1]][axis])<=limit)lo--;
 while(hi<ids.length-1&&Math.abs(sammyBubbleRegistry[ids[hi+1]][axis]-sammyBubbleRegistry[ids[hi]][axis])<=limit)hi++;
 return ids.slice(lo,hi+1)
}
function sammyClearBubbleGroup(id){
 const meta=sammyBubbleRegistry[id];if(!meta?.groupId)return;
 const gid=meta.groupId;
 Object.keys(sammyBubbleRegistry).forEach(k=>{if(sammyBubbleRegistry[k]?.groupId===gid)sammyBubbleRegistry[k].groupId=null});
}
function sammyNormalizeBubbleGroup(ids,edge){
 const size=SAMMY_BUBBLE_SIZE,gap=SAMMY_BUBBLE_GAP,step=size+gap;
 if(!ids?.length)return;
 const axis=(edge==="left"||edge==="right")?"y":"x";
 ids=ids.filter(sammyBubbleVisible).sort((a,b)=>sammyBubbleRegistry[a][axis]-sammyBubbleRegistry[b][axis]);
 if(!ids.length)return;
 const span=sammyBubbleSpan(edge),cross=sammyBubbleCrossValue(edge);
 const positions=ids.map(id=>sammyBubbleRegistry[id][axis]);
 let anchor=positions.reduce((s,v)=>s+v,0)/positions.length - step*(ids.length-1)/2;
 anchor=Math.max(span.min,Math.min(span.max-step*(ids.length-1),anchor));
 ids.forEach((id,i)=>{
  const meta=sammyBubbleRegistry[id];meta.edge=edge;meta.groupId=ids.length>1?(meta.groupId||`grp-${sammyBubbleGroupSeq}`):null;
  if(axis==="y"){meta.x=cross;meta.y=anchor+i*step}else{meta.y=cross;meta.x=anchor+i*step}
  sammyBubbleApply(id)
 });
 if(ids.length>1)sammyBubbleGroupSeq++;
 else ids.forEach(id=>sammyBubbleRegistry[id].groupId=null)
}
function sammyResolveBubbleLayout(){
 // Ungroup everything first; visible bubbles will be re-clustered by edge + proximity.
 Object.keys(sammyBubbleRegistry).forEach(id=>{const m=sammyBubbleRegistry[id];if(m)m.groupId=null});
 const visible=Object.keys(sammyBubbleRegistry).filter(sammyBubbleVisible);
 visible.forEach(id=>{
  const m=sammyBubbleRegistry[id],cl=sammyBubbleClampPos(m.x,m.y);m.x=cl.x;m.y=cl.y;m.edge=m.edge||sammyNearestEdgeFromPos(m.x,m.y);
  const cross=sammyBubbleCrossValue(m.edge);if(m.edge==="left"||m.edge==="right")m.x=cross;else m.y=cross;
 });
 for(const edge of ["left","right","top","bottom"]){
  const axis=(edge==="left"||edge==="right")?"y":"x";
  const ids=visible.filter(id=>sammyBubbleRegistry[id].edge===edge).sort((a,b)=>sammyBubbleRegistry[a][axis]-sammyBubbleRegistry[b][axis]);
  if(!ids.length)continue;
  // prevent overlap first
  const span=sammyBubbleSpan(edge),step=SAMMY_BUBBLE_SIZE+SAMMY_BUBBLE_GAP;
  let prev=-1e9;
  ids.forEach(id=>{const m=sammyBubbleRegistry[id];m[axis]=Math.max(m[axis],prev===-1e9?span.min:prev+step);prev=m[axis]});
  let overflow=prev-span.max;if(overflow>0)ids.slice().reverse().forEach(id=>{const m=sammyBubbleRegistry[id];m[axis]-=overflow});
  // cluster close neighbors into linked groups
  let cluster=[ids[0]];
  for(let i=1;i<ids.length;i++){
   const a=sammyBubbleRegistry[ids[i-1]][axis],b=sammyBubbleRegistry[ids[i]][axis];
   if(Math.abs(b-a)<=step+SAMMY_BUBBLE_SNAP)cluster.push(ids[i]);
   else{sammyNormalizeBubbleGroup(cluster,edge);cluster=[ids[i]]}
  }
  sammyNormalizeBubbleGroup(cluster,edge);
 }
 sammyPersistBubbles()
}

const SAMMY_BUBBLE_EDGE_MAGNET=48;
function sammyBubbleEdgeDistance(edge,x,y){const cross=sammyBubbleCrossValue(edge);return (edge==="left"||edge==="right")?Math.abs(x-cross):Math.abs(y-cross)}
function sammyBubbleCandidateEdge(x,y){
 const edges=["left","right","top","bottom"].map(edge=>[edge,sammyBubbleEdgeDistance(edge,x,y)]).sort((a,b)=>a[1]-b[1]);return edges[0][1]<=SAMMY_BUBBLE_EDGE_MAGNET?edges[0][0]:null
}
function sammyBubbleRestoreSnapshot(snapshot,exceptId=null){
 if(!snapshot)return;for(const [id,s] of Object.entries(snapshot)){if(id===exceptId||!sammyBubbleRegistry[id])continue;Object.assign(sammyBubbleRegistry[id],{x:s.x,y:s.y,edge:s.edge,groupId:s.groupId||null});sammyBubbleApply(id)}
}
function sammyPreviewBubbleInsertion(id,edge,desiredAxis,snapshot){
 const axis=(edge==="left"||edge==="right")?"y":"x",cross=sammyBubbleCrossValue(edge),span=sammyBubbleSpan(edge),step=SAMMY_BUBBLE_SIZE+SAMMY_BUBBLE_GAP;
 // Start every preview from the pointer-down arrangement so leaving/re-entering an edge never accumulates drift.
 sammyBubbleRestoreSnapshot(snapshot,id);
 const others=Object.keys(sammyBubbleRegistry).filter(k=>k!==id&&sammyBubbleVisible(k)&&((sammyBubbleRegistry[k].edge||sammyNearestEdgeFromPos(sammyBubbleRegistry[k].x,sammyBubbleRegistry[k].y))===edge));
 const entries=others.map(k=>({id:k,pos:sammyBubbleRegistry[k][axis]}));entries.push({id,pos:Math.max(span.min,Math.min(span.max,desiredAxis)),drag:true});entries.sort((a,b)=>a.pos-b.pos);
 const di=entries.findIndex(e=>e.id===id),pos=entries.map(e=>e.pos);pos[di]=entries[di].pos;
 // Collision propagation: insertion from either direction pushes neighbors away rather than refusing the snap.
 for(let i=di-1;i>=0;i--)if(pos[i]>pos[i+1]-step)pos[i]=pos[i+1]-step;
 for(let i=di+1;i<pos.length;i++)if(pos[i]<pos[i-1]+step)pos[i]=pos[i-1]+step;
 if(pos[0]<span.min){const sh=span.min-pos[0];for(let i=0;i<pos.length;i++)pos[i]+=sh}
 if(pos[pos.length-1]>span.max){const sh=span.max-pos[pos.length-1];for(let i=0;i<pos.length;i++)pos[i]+=sh}
 // Re-run constraints after boundary shift so insertion between two bubbles remains exact.
 for(let i=1;i<pos.length;i++)if(pos[i]<pos[i-1]+step)pos[i]=pos[i-1]+step;
 if(pos[pos.length-1]>span.max){const sh=span.max-pos[pos.length-1];for(let i=0;i<pos.length;i++)pos[i]+=sh}
 entries.forEach((e,i)=>{const m=sammyBubbleRegistry[e.id];m.edge=edge;m.groupId=null;if(axis==="y"){m.x=cross;m.y=pos[i]}else{m.y=cross;m.x=pos[i]}sammyBubbleApply(e.id)});
 return true
}
function sammyFlingBubble(id,vx=0,vy=0){
 sammyCancelBubbleMotion(id);
 const meta=sammyBubbleRegistry[id];if(!meta)return;
 const maxV=2400,speed=Math.hypot(vx,vy);
 if(speed>maxV){const q=maxV/speed;vx*=q;vy*=q}
 const predicted=sammyBubbleClampPos(meta.x+vx*.18,meta.y+vy*.18);
 const edge=sammyNearestEdgeFromPos(predicted.x,predicted.y),span=sammyBubbleSpan(edge),cross=sammyBubbleCrossValue(edge);
 let tx=predicted.x,ty=predicted.y;
 if(edge==="left"||edge==="right"){tx=cross;ty=Math.max(span.min,Math.min(span.max,predicted.y))}
 else{ty=cross;tx=Math.max(span.min,Math.min(span.max,predicted.x))}
 // A zero/slow release still visibly accelerates to the nearest edge.
 const k=42,damping=10.5,start=performance.now();let last=start;
 const tick=now=>{
  const dt=Math.min(.032,Math.max(.001,(now-last)/1000));last=now;
  const ax=(tx-meta.x)*k-vx*damping,ay=(ty-meta.y)*k-vy*damping;
  vx+=ax*dt;vy+=ay*dt;
  meta.x+=vx*dt;meta.y+=vy*dt;
  const cl=sammyBubbleClampPos(meta.x,meta.y);meta.x=cl.x;meta.y=cl.y;meta.edge=null;meta.groupId=null;sammyBubbleApply(id);
  const dist=Math.hypot(tx-meta.x,ty-meta.y),v=Math.hypot(vx,vy);
  if((dist<.7&&v<22)||now-start>1050){
   meta.x=tx;meta.y=ty;meta.edge=edge;sammyBubbleApply(id);delete sammyBubbleMotionRaf[id];sammyResolveBubbleLayout();return
  }
  sammyBubbleMotionRaf[id]=requestAnimationFrame(tick)
 };
 sammyBubbleMotionRaf[id]=requestAnimationFrame(tick)
}
function sammyFlingBubbleGroup(ids,edge,axisVelocity=0){
 ids=(ids||[]).filter(sammyBubbleVisible);if(!ids.length)return;
 sammyCancelBubbleMotions(ids);
 const axis=(edge==="left"||edge==="right")?"y":"x",span=sammyBubbleSpan(edge);
 const starts=ids.map(id=>({id,v:sammyBubbleRegistry[id][axis]}));
 const min0=Math.min(...starts.map(s=>s.v)),max0=Math.max(...starts.map(s=>s.v));
 let shift=0,v=Math.max(-2200,Math.min(2200,axisVelocity)),last=performance.now(),start=last;
 const finish=()=>{ids.forEach(id=>delete sammyBubbleMotionRaf[id]);sammyResolveBubbleLayout()};
 const tick=now=>{
  const dt=Math.min(.032,Math.max(.001,(now-last)/1000));last=now;
  shift+=v*dt;v*=Math.exp(-7.5*dt);
  if(min0+shift<span.min){shift=span.min-min0;v=0}
  if(max0+shift>span.max){shift=span.max-max0;v=0}
  for(const s of starts){
   const m=sammyBubbleRegistry[s.id];m.edge=edge;
   if(axis==="y"){m.x=sammyBubbleCrossValue(edge);m.y=s.v+shift}else{m.y=sammyBubbleCrossValue(edge);m.x=s.v+shift}
   sammyBubbleApply(s.id)
  }
  if(Math.abs(v)<18||now-start>850){finish();return}
  const raf=requestAnimationFrame(tick);ids.forEach(id=>sammyBubbleMotionRaf[id]=raf)
 };
 const raf=requestAnimationFrame(tick);ids.forEach(id=>sammyBubbleMotionRaf[id]=raf)
}


let sammyMeasureScope="common";
let sammyMeasureInfoOpenFor=null;
function sammyMeasureSexKey(){return annyParams?.gender>=.5?"female":"male"}
function sammyMeasureSexLabel(){return sammyMeasureSexKey()==="female"?"♀ weiblich":"♂ männlich"}
function sammyMeasureOtherSexSymbol(){return sammyMeasureSexKey()==="female"?"♂":"♀"}
function sammyMeasureScopeLabel(){return sammyMeasureScope==="common"?"UNISEX":(sammyMeasureScope==="female"?"♀ spezifisch":"♂ spezifisch")}
function sammyMeasureBlankState(){return {offsetCm:0,spanOffsetCm:0,comment:"",status:"ungeprüft"}}
function sammyMeasureSameV1(a,b){
 if(!a||!b)return false;return Number(a.offsetCm||0)===Number(b.offsetCm||0)&&String(a.comment||"")===String(b.comment||"")&&String(a.status||"ungeprüft")===String(b.status||"ungeprüft")
}
function sammyMeasureMigrateV1(v1){
 const out={schema:"sammy-measure-calibration-v2",common:{},male:{},female:{}};
 for(const d of SAMMY_MEASURE_DEFS){
  const m=v1?.male?.[d.id],f=v1?.female?.[d.id],blank=sammyMeasureBlankState();
  if(m&&f&&sammyMeasureSameV1(m,f)){
   out.common[d.id]={...blank,...m,spanOffsetCm:0};out.male[d.id]={override:false};out.female[d.id]={override:false}
  }else{
   out.common[d.id]={...blank};
   out.male[d.id]=m?{override:true,...blank,...m,spanOffsetCm:0}:{override:false};
   out.female[d.id]=f?{override:true,...blank,...f,spanOffsetCm:0}:{override:false}
  }
 }
 return out
}
function sammyMeasureDefaultCalibration(){
 const base=JSON.parse(JSON.stringify(SAMMY_MEASURE_FACTORY_V2));
 base.schema="sammy-measure-calibration-v2";
 for(const d of SAMMY_MEASURE_DEFS){
  if(!base.common[d.id])base.common[d.id]=sammyMeasureBlankState();
  if(!base.male[d.id])base.male[d.id]={override:false};
  if(!base.female[d.id])base.female[d.id]={override:false}
 }
 return base
}
function sammyMeasureLoadCalibration(){
 if(sammyMeasureCalibration)return sammyMeasureCalibration;
 let base=sammyMeasureDefaultCalibration();
 try{
  const v2=JSON.parse(localStorage.getItem(SAMMY_MEASURE_KEY)||"null");
  const v1=JSON.parse(localStorage.getItem(SAMMY_MEASURE_LEGACY_KEY)||"null");
  const saved=v2?.schema==="sammy-measure-calibration-v2"?v2:(v1?sammyMeasureMigrateV1(v1):null);
  if(saved){
   for(const d of SAMMY_MEASURE_DEFS){
    if(saved.common?.[d.id])base.common[d.id]={...base.common[d.id],...saved.common[d.id]};
    for(const sex of ["male","female"])if(saved?.[sex]?.[d.id])base[sex][d.id]={...base[sex][d.id],...saved[sex][d.id]}
   }
  }
 }catch(e){console.warn("Measure calibration load/migrate",e)}
 sammyMeasureCalibration=base;sammyMeasureSaveCalibration();return base
}
function sammyMeasureSaveCalibration(){try{if(sammyMeasureCalibration)localStorage.setItem(SAMMY_MEASURE_KEY,JSON.stringify(sammyMeasureCalibration))}catch(e){console.warn("Measure calibration save",e)}}
function sammyMeasureCommonCal(id){const all=sammyMeasureLoadCalibration();if(!all.common[id])all.common[id]=sammyMeasureBlankState();return all.common[id]}
function sammyMeasureSpecificCal(id,sex){const all=sammyMeasureLoadCalibration();if(!all[sex][id])all[sex][id]={override:false};return all[sex][id]}
function sammyMeasureResolvedCal(id,scope=sammyMeasureScope){
 const common=sammyMeasureCommonCal(id);
 if(scope==="common")return common;
 const spec=sammyMeasureSpecificCal(id,scope);return spec.override?{...common,...spec}:common
}
function sammyMeasureEditableCal(id){
 if(sammyMeasureScope==="common")return sammyMeasureCommonCal(id);
 const spec=sammyMeasureSpecificCal(id,sammyMeasureScope);
 if(!spec.override){Object.assign(spec,{...sammyMeasureCommonCal(id),override:true})}
 return spec
}
function sammyMeasureClearSpecific(id){if(sammyMeasureScope==="common")return;const all=sammyMeasureLoadCalibration();all[sammyMeasureScope][id]={override:false};sammyMeasureSaveCalibration()}
function sammyMeasurementPositions(){return geometry?.attributes?.position?.array||currentDisplayRest()}
function sammyMeasurementIndex(){return geometry?.index?.array||currentDisplayTriangles()?.data}
function sammyMeasureBBox(){
 const p=sammyMeasurementPositions();if(!p)return null;let minX=Infinity,minY=Infinity,minZ=Infinity,maxX=-Infinity,maxY=-Infinity,maxZ=-Infinity;
 for(let i=0;i<p.length;i+=3){const x=p[i],y=p[i+1],z=p[i+2];minX=Math.min(minX,x);minY=Math.min(minY,y);minZ=Math.min(minZ,z);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);maxZ=Math.max(maxZ,z)}
 return {minX,minY,minZ,maxX,maxY,maxZ,width:maxX-minX,height:maxY-minY,depth:maxZ-minZ,cx:(minX+maxX)/2,cy:(minY+maxY)/2,cz:(minZ+maxZ)/2}
}
function sammyMeasureJoint(name){
 const j=PUBLIC_JOINT_NAMES.indexOf(name),w=currentPoseWorld||poseBindWorldActive||poseBindWorld;if(j<0||!w)return null;
 const o=j*16,dy=(morphSammyTargetActive&&shapeEngine==="anny")?annyGroundOffsetY:0;return [w[o+3],w[o+7]+dy,w[o+11]]
}
function sammyMeasureLerp(a,b,t){return a&&b?[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t]:null}
function sammyMeasureBaseY(section){
 const box=sammyMeasureBBox();if(!box)return 0;
 const hips=sammyMeasureJoint("Hips"),sp1=sammyMeasureJoint("Spine1"),sp2=sammyMeasureJoint("Spine2"),ch=sammyMeasureJoint("Chest"),n1=sammyMeasureJoint("Neck1"),n2=sammyMeasureJoint("Neck2"),leg=sammyMeasureJoint("RightLeg"),shin=sammyMeasureJoint("RightShin"),foot=sammyMeasureJoint("RightFoot");
 if(section==="chest"&&sp2&&ch)return sp2[1]*.58+ch[1]*.42;
 if(section==="waist"&&hips&&sp1)return hips[1]*.42+sp1[1]*.58;
 if(section==="hip"&&hips&&leg)return hips[1]*.36+leg[1]*.64;
 if(section==="crotch"&&leg)return leg[1];
 if(section==="neck"&&n1&&n2)return n1[1]*.45+n2[1]*.55;
 if(section==="neckBase"&&n1)return n1[1]-.012;
 if(section==="thigh"&&leg&&shin)return leg[1]*.66+shin[1]*.34;
 if(section==="calf"&&shin&&foot)return shin[1]*.55+foot[1]*.45;
 if(section==="ankle"&&foot)return foot[1]+.025;
 const frac={chest:.70,waist:.57,hip:.48,neck:.86,neckBase:.82,thigh:.37,calf:.20,ankle:.07}[section]??.49;return box.minY+box.height*frac
}
function sammyPlaneSliceY(y,maxAbsX=Infinity,xCenter=0,maxAbsZ=Infinity,zCenter=0){
 const p=sammyMeasurementPositions(),idx=sammyMeasurementIndex();if(!p||!idx)return null;const pts=[],eps=1e-7;
 const add=(ia,ib)=>{const ao=ia*3,bo=ib*3,ya=p[ao+1],yb=p[bo+1],da=ya-y,db=yb-y;if(Math.abs(da)<eps&&Math.abs(db)<eps)return;if((da>eps&&db>eps)||(da<-eps&&db<-eps))return;const den=yb-ya;if(Math.abs(den)<eps)return;const t=(y-ya)/den;if(t<-eps||t>1+eps)return;const x=p[ao]+(p[bo]-p[ao])*t,z=p[ao+2]+(p[bo+2]-p[ao+2])*t;if(Math.abs(x-xCenter)<=maxAbsX&&Math.abs(z-zCenter)<=maxAbsZ)pts.push([x,z])};
 for(let k=0;k<idx.length;k+=3){const a=idx[k],b=idx[k+1],c=idx[k+2];add(a,b);add(b,c);add(c,a)}return sammySliceStats(y,pts,"Y")
}
function sammyPlaneSliceX(x,yCenter=0,maxAbsY=Infinity,zCenter=0,maxAbsZ=Infinity){
 const p=sammyMeasurementPositions(),idx=sammyMeasurementIndex();if(!p||!idx)return null;const pts=[],eps=1e-7;
 const add=(ia,ib)=>{const ao=ia*3,bo=ib*3,xa=p[ao],xb=p[bo],da=xa-x,db=xb-x;if(Math.abs(da)<eps&&Math.abs(db)<eps)return;if((da>eps&&db>eps)||(da<-eps&&db<-eps))return;const den=xb-xa;if(Math.abs(den)<eps)return;const t=(x-xa)/den;if(t<-eps||t>1+eps)return;const y=p[ao+1]+(p[bo+1]-p[ao+1])*t,z=p[ao+2]+(p[bo+2]-p[ao+2])*t;if(Math.abs(y-yCenter)<=maxAbsY&&Math.abs(z-zCenter)<=maxAbsZ)pts.push([y,z])};
 for(let k=0;k<idx.length;k+=3){const a=idx[k],b=idx[k+1],c=idx[k+2];add(a,b);add(b,c);add(c,a)}return sammySliceStats(x,pts,"X")
}
function sammySliceStats(plane,pts,axis){
 if(pts.length<6)return {axis,plane,points:pts,hull:[],circ:NaN,width:NaN,depth:NaN,minA:NaN,maxA:NaN,minB:NaN,maxB:NaN};
 const uniq=[],seen=new Set();for(const q of pts){const key=`${Math.round(q[0]*100000)},${Math.round(q[1]*100000)}`;if(!seen.has(key)){seen.add(key);uniq.push(q)}}
 const hull=convexHull2D(uniq);let minA=Infinity,maxA=-Infinity,minB=Infinity,maxB=-Infinity;for(const q of hull){minA=Math.min(minA,q[0]);maxA=Math.max(maxA,q[0]);minB=Math.min(minB,q[1]);maxB=Math.max(maxB,q[1])}
 return {axis,plane,points:uniq,hull,circ:hullPerimeter(hull)*100,width:(maxA-minA)*100,depth:(maxB-minB)*100,minA,maxA,minB,maxB}
}
function sammyMeasureSection(section,offsetCm=0){
 const hips=sammyMeasureJoint("Hips"),la=sammyMeasureJoint("LeftArm"),ra=sammyMeasureJoint("RightArm"),box=sammyMeasureBBox();const centerX=hips?.[0]??box?.cx??0,shoulderSpan=(la&&ra)?Math.abs(la[0]-ra[0]):(box?.width||.6),y=sammyMeasureBaseY(section)+offsetCm/100;
 if(section==="thigh"||section==="calf"||section==="ankle"){
  const center=section==="thigh"?sammyMeasureJoint("RightLeg"):(section==="calf"?sammyMeasureLerp(sammyMeasureJoint("RightShin"),sammyMeasureJoint("RightFoot"),.45):sammyMeasureJoint("RightFoot"));
  return sammyPlaneSliceY(y,.16,center?.[0]??centerX,.20,center?.[2]??box.cz)
 }
 const maxX=section==="chest"?Math.max(.20,shoulderSpan*.62):(section==="neck"||section==="neckBase"?Math.max(.10,shoulderSpan*.25):Infinity);
 return sammyPlaneSliceY(y,maxX,centerX)
}
function sammyMeasureArmSlice(section,offsetCm=0){
 const arm=sammyMeasureJoint("RightArm"),fore=sammyMeasureJoint("RightForeArm"),hand=sammyMeasureJoint("RightHand"),box=sammyMeasureBBox();if(!arm||!fore||!hand)return null;
 let base,dir;
 if(section==="upperarm"){base=sammyMeasureLerp(arm,fore,.52);dir=Math.sign(fore[0]-arm[0])||1}
 else{base=sammyMeasureLerp(fore,hand,.88);dir=Math.sign(hand[0]-fore[0])||1}
 const x=base[0]+dir*offsetCm/100;return sammyPlaneSliceX(x,base[1],.15,base[2],.18)
}
function sammyMeasureApplySpan(baseCm,spanCm){return Math.max(.1,Number(baseCm||0)+Number(spanCm||0))}

function sammyComputeAllMeasures(){
 const out={},sections=new Map();for(const d of SAMMY_MEASURE_DEFS)out[d.id]=sammyComputeMeasure(d,sections);sammyMeasureResultsCache=out;
 const sex=sammyMeasureSexKey();sammyMeasureLastSnapshots[sex]={time:new Date().toISOString(),scope:sammyMeasureScope,values:Object.fromEntries(SAMMY_MEASURE_DEFS.map(d=>[d.id,Number.isFinite(out[d.id].valueCm)?Number(out[d.id].valueCm.toFixed(4)):null]))};return out
}

// ---------------------------------------------------------------------------
// v0.7.3 semantic / scalable measurement engine
// ---------------------------------------------------------------------------
const SAMMY_MEASURE_REFERENCE_STATURE_CM={male:192.4463,female:178.1307};
function sammyMeasureModelCal(id){return sammyMeasureResolvedCal(id,sammyMeasureScope==="common"?"common":sammyMeasureSexKey())}
function sammyMeasureScaleFactor(){const b=sammyMeasureBBox(),ref=SAMMY_MEASURE_REFERENCE_STATURE_CM[sammyMeasureSexKey()]||185;return b&&ref>0?(b.height*100/ref):1}
function sammyMeasureScaledCm(v){return Number(v||0)*sammyMeasureScaleFactor()}
function sammyMeasureAnchorOffset(id){return sammyMeasureScaledCm(sammyMeasureModelCal(id).offsetCm)}
function sammyMeasureSpanOffset(id){return sammyMeasureScaledCm(sammyMeasureModelCal(id).spanOffsetCm)}
function sammyVecNorm(a){const l=Math.hypot(a[0],a[1],a[2])||1;return [a[0]/l,a[1]/l,a[2]/l]}
function sammyVecCross(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]}
function sammyVecDot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]}
function sammyVecAdd(a,b,s=1){return [a[0]+b[0]*s,a[1]+b[1]*s,a[2]+b[2]*s]}
function sammyVecSub(a,b){return [a[0]-b[0],a[1]-b[1],a[2]-b[2]]}
function sammyPlaneBasis(normal){
 const n=sammyVecNorm(normal),ref=Math.abs(n[1])>.88?[1,0,0]:[0,1,0],u=sammyVecNorm(sammyVecCross(ref,n)),v=sammyVecNorm(sammyVecCross(n,u));return {n,u,v}
}
function sammyPlaneSliceArbitraryV3(origin,normal,maxRadius=Infinity){
 const p=sammyMeasurementPositions(),idx=sammyMeasurementIndex();if(!p||!idx)return null;const {n,u,v}=sammyPlaneBasis(normal),pts=[],eps=1e-7;
 const add=(ia,ib)=>{const ao=ia*3,bo=ib*3,a=[p[ao],p[ao+1],p[ao+2]],b=[p[bo],p[bo+1],p[bo+2]],da=sammyVecDot(sammyVecSub(a,origin),n),db=sammyVecDot(sammyVecSub(b,origin),n);if(Math.abs(da)<eps&&Math.abs(db)<eps)return;if((da>eps&&db>eps)||(da<-eps&&db<-eps))return;const den=db-da;if(Math.abs(den)<eps)return;const t=-da/den;if(t<-eps||t>1+eps)return;const q=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t],d=sammyVecSub(q,origin),A=sammyVecDot(d,u),B=sammyVecDot(d,v);if(Math.hypot(A,B)<=maxRadius)pts.push([A,B])};
 for(let k=0;k<idx.length;k+=3){const a=idx[k],b=idx[k+1],c=idx[k+2];add(a,b);add(b,c);add(c,a)}
 const s=sammySliceStats(0,pts,"P");s.origin=origin.slice();s.normal=n;s.u=u;s.v=v;return s
}
function sammyPlaneSliceYLimbV3(y,which="right",maxAbsZ=.22){
 const p=sammyMeasurementPositions(),idx=sammyMeasurementIndex();if(!p||!idx)return null;const box=sammyMeasureBBox(),r=sammyMeasureJoint(which==="right"?"RightLeg":"LeftLeg"),l=sammyMeasureJoint(which==="right"?"LeftLeg":"RightLeg");if(!r||!l)return sammyPlaneSliceY(y);const pts=[],eps=1e-7,zc=r[2]??box.cz;
 const add=(ia,ib)=>{const ao=ia*3,bo=ib*3,ya=p[ao+1],yb=p[bo+1],da=ya-y,db=yb-y;if(Math.abs(da)<eps&&Math.abs(db)<eps)return;if((da>eps&&db>eps)||(da<-eps&&db<-eps))return;const den=yb-ya;if(Math.abs(den)<eps)return;const t=(y-ya)/den;if(t<-eps||t>1+eps)return;const x=p[ao]+(p[bo]-p[ao])*t,z=p[ao+2]+(p[bo+2]-p[ao+2])*t;if(Math.abs(x-r[0])<=Math.abs(x-l[0])+1e-8&&Math.abs(z-zc)<=maxAbsZ)pts.push([x,z])};
 for(let k=0;k<idx.length;k+=3){const a=idx[k],b=idx[k+1],c=idx[k+2];add(a,b);add(b,c);add(c,a)}return sammySliceStats(y,pts,"Y")
}
function sammyAnnyLocalBlendshapePairV7(label){
 if(!annyMeta||!annyLowPack?.blendshapes?.data)return null;
 const i=(annyMeta.local_change_labels||[]).indexOf(label);if(i<0)return null;
 const first=Number(annyMeta.phenotype_blendshape_count)+i*2;return [first,first+1]
}
function sammyNippleMorphPatchV7(){
 if(sammyNippleMorphPatchCache)return sammyNippleMorphPatchCache;
 if(!annyMeta||!annyLowPack?.blendshapes?.data)return null;
 const point=sammyAnnyLocalBlendshapePairV7("nipple-point-incr"),size=sammyAnnyLocalBlendshapePairV7("nipple-size-incr");
 if(!point&&!size)return null;
 const b=annyLowPack.blendshapes.data,N=Number(annyLowPack.template_vertices?.shape?.[0]||4505),stride=N*3;
 const mag=(pair,v)=>{if(!pair)return 0;let sum=0;for(const a of pair){const o=a*stride+v*3,dx=Number(b[o]||0),dy=Number(b[o+1]||0),dz=Number(b[o+2]||0);sum+=Math.hypot(dx,dy,dz)}return sum};
 const rows=new Array(N);let maxP=0,maxS=0;
 for(let v=0;v<N;v++){const wp=mag(point,v),ws=mag(size,v);rows[v]=[v,wp,ws];maxP=Math.max(maxP,wp);maxS=Math.max(maxS,ws)}
 if(maxP<1e-12&&maxS<1e-12)return null;
 // Point morph is primary because it is concentrated on the nipple tip/centre.
 // Size morph is a secondary atlas signal that stabilises the surrounding patch.
 const scored=[];for(const [v,wp,ws] of rows){const pn=maxP>0?wp/maxP:0,sn=maxS>0?ws/maxS:0;if(pn<.075&&sn<.16)continue;const score=pn*.82+sn*.18;if(score>0)scored.push({v,score,pn,sn})}
 scored.sort((a,b)=>b.score-a.score);
 // Keep a compact semantic patch; diffuse tiny blendshape tails are intentionally discarded.
 const keep=scored.slice(0,Math.min(180,Math.max(24,scored.length)));
 sammyNippleMorphPatchCache={vertices:keep,pointLabel:!!point,sizeLabel:!!size,maxPoint:maxP,maxSize:maxS};return sammyNippleMorphPatchCache
}
function sammyNippleMorphAnchorsV7(){
 const patch=sammyNippleMorphPatchV7(),p=sammyMeasurementPositions(),box=sammyMeasureBBox();if(!patch?.vertices?.length||!p||!box)return null;
 const n=p.length/3,useMid=n>6000&&lowMap?.data?.length;let left=[0,0,0,0],right=[0,0,0,0],all=[0,0,0,0];
 const add=(acc,x,y,z,w)=>{acc[0]+=x*w;acc[1]+=y*w;acc[2]+=z*w;acc[3]+=w};
 for(const it of patch.vertices){let v=it.v;if(useMid){const mv=Number(lowMap.data[v]);if(Number.isFinite(mv))v=mv}const o=v*3;if(o+2>=p.length)continue;const x=Number(p[o]),y=Number(p[o+1]),z=Number(p[o+2]),w=Math.max(.001,it.score);if(![x,y,z].every(Number.isFinite))continue;add(all,x,y,z,w);add(x<box.cx?left:right,x,y,z,w)}
 const fin=a=>a[3]>1e-8?[a[0]/a[3],a[1]/a[3],a[2]/a[3]]:null,L=fin(left),R=fin(right),A=fin(all);if(!A)return null;
 // If one side is sparse, the combined patch still gives a stable chest level.
 const y=(L&&R)?(L[1]+R[1])*.5:A[1];return {y,left:L,right:R,center:A,patchCount:patch.vertices.length}
}
function sammySemanticMorphPatchV8(labels,weights=null,maxKeep=120,threshold=.10){
 if(!annyMeta||!annyLowPack?.blendshapes?.data)return null;
 const pairs=(labels||[]).map((label,i)=>({label,pair:sammyAnnyLocalBlendshapePairV7(label),weight:Number(weights?.[i]??1)})).filter(x=>x.pair&&x.weight>0);if(!pairs.length)return null;
 const b=annyLowPack.blendshapes.data,N=Number(annyLowPack.template_vertices?.shape?.[0]||4505),stride=N*3,maxima=new Array(pairs.length).fill(0),rows=new Array(N);
 const mag=(pair,v)=>{let sum=0;for(const a of pair){const o=a*stride+v*3,dx=Number(b[o]||0),dy=Number(b[o+1]||0),dz=Number(b[o+2]||0);sum+=Math.hypot(dx,dy,dz)}return sum};
 for(let v=0;v<N;v++){const m=pairs.map((x,i)=>{const q=mag(x.pair,v);maxima[i]=Math.max(maxima[i],q);return q});rows[v]=m}
 if(!maxima.some(x=>x>1e-12))return null;
 const scored=[];for(let v=0;v<N;v++){let score=0,wSum=0,peak=0;for(let i=0;i<pairs.length;i++){const n=maxima[i]>0?rows[v][i]/maxima[i]:0,wt=pairs[i].weight;score+=n*wt;wSum+=wt;peak=Math.max(peak,n)}score=wSum?score/wSum:0;if(peak>=threshold&&score>0)scored.push({v,score,peak})}
 scored.sort((a,b)=>b.score-a.score);if(!scored.length)return null;
 // Keep only the concentrated semantic core. Weighting by score² later makes diffuse morph tails negligible.
 const keep=scored.slice(0,Math.min(maxKeep,Math.max(18,scored.length)));return {vertices:keep,labels:pairs.map(x=>x.label),maxima}
}
function sammySemanticMorphAnchorV8(patch,midlineBias=true){
 const p=sammyMeasurementPositions(),box=sammyMeasureBBox();if(!patch?.vertices?.length||!p||!box)return null;const n=p.length/3,useMid=n>6000&&lowMap?.data?.length;let sx=0,sy=0,sz=0,sw=0;
 for(const it of patch.vertices){let v=it.v;if(useMid){const mv=Number(lowMap.data[v]);if(Number.isFinite(mv))v=mv}const o=v*3;if(o+2>=p.length)continue;const x=Number(p[o]),y=Number(p[o+1]),z=Number(p[o+2]);if(![x,y,z].every(Number.isFinite))continue;let w=Math.max(.0001,it.score*it.score);if(midlineBias){const half=Math.max(.04,box.width*.24),r=Math.abs(x-box.cx)/half;w*=1/(1+r*r*2.5)}sx+=x*w;sy+=y*w;sz+=z*w;sw+=w}
 if(sw<1e-9)return null;const point=[sx/sw,sy/sw,sz/sw];return {point,y:point[1],patchCount:patch.vertices.length,labels:patch.labels||[]}
}
function sammyNavelMorphAnchorV8(){
 if(!sammyNavelMorphPatchCache)sammyNavelMorphPatchCache=sammySemanticMorphPatchV8(["stomach-navel-out","stomach-navel-up"],[.68,.32],110,.085);
 return sammySemanticMorphAnchorV8(sammyNavelMorphPatchCache,true)
}
function sammyBulgeMorphAnchorV8(){
 if(!sammyBulgeMorphPatchCache)sammyBulgeMorphPatchCache=sammySemanticMorphPatchV8(["bulge-incr"],[1],120,.085);
 return sammySemanticMorphAnchorV8(sammyBulgeMorphPatchCache,true)
}
function sammyMeasureChestSliceV7(){
 const a=sammyNippleMorphAnchorsV7();if(a&&Number.isFinite(a.y)){const s=sammyMeasureTorsoSliceYV5(a.y);if(s&&Number.isFinite(s.circ)){s.semanticAnchor="nippleMorphLandmark";s.nippleAnchors=a;return s}}
 // Safe fallback only if the expected Anny morph atlas is unavailable.
 const y=sammyMeasureBaseY("chest");const s=sammyMeasureTorsoSliceYV5(y);if(s)s.semanticAnchor="chestFallback";return s
}
function sammyMeasureSharedPlaneY(section){
 if(section==="chest"){const a=sammyNippleMorphAnchorsV7();return a&&Number.isFinite(a.y)?a.y:sammyMeasureBaseY("chest");}
 if(section==="waist"){if(sammyMeasureLegacyLandmarksForDelta)return sammyMeasureBaseY("waist")+sammyMeasureAnchorOffset("waist_circumference")/100;const a=sammyNavelMorphAnchorV8();return a&&Number.isFinite(a.y)?a.y:sammyMeasureBaseY("waist")+sammyMeasureAnchorOffset("waist_circumference")/100;}
 if(section==="hip")return sammyMeasureBaseY("hip")+sammyMeasureAnchorOffset("buttock_circumference")/100;
 return sammyMeasureBaseY(section)
}
function sammySearchYSlicesV3(y0,y1,count,kind="circ",limb=false){
 let best=null;for(let i=0;i<count;i++){const y=y0+(y1-y0)*(count===1?0:i/(count-1)),s=limb?sammyPlaneSliceYLimbV3(y):sammyPlaneSliceY(y);if(!s||!Number.isFinite(s[kind]))continue;if(!best||s[kind]>best[kind])best=s}return best
}
function sammySearchYMinV3(y0,y1,count,limb=true){
 let best=null;for(let i=0;i<count;i++){const y=y0+(y1-y0)*(count===1?0:i/(count-1)),s=limb?sammyPlaneSliceYLimbV3(y):sammyPlaneSliceY(y);if(!s||!Number.isFinite(s.circ))continue;if(!best||s.circ<best.circ)best=s}return best
}
function sammySearchArmMaxV3(a,b,t0,t1,count=20){
 if(!a||!b)return null;const axis=sammyVecSub(b,a),len=Math.hypot(...axis);if(len<1e-6)return null;let best=null;for(let i=0;i<count;i++){const t=t0+(t1-t0)*(i/(count-1)),o=sammyMeasureLerp(a,b,t),s=sammyPlaneSliceArbitraryV3(o,axis,Math.max(.06,Math.min(.11,len*.38)));if(!s||!Number.isFinite(s.circ))continue;if(!best||s.circ>best.circ)best=s}return best
}
function sammyMeasureNeckBaseDynamicV4(n1,n2,axis,maxRadius){
 // Search the local "knee" where the neck starts widening into trapezius/shoulder.
 // n1 is the lower neck joint, n2 the upper reference; therefore larger t = higher.
 const samples=[];for(let i=0;i<15;i++){const t=.08+i*(.54/14),o=sammyMeasureLerp(n1,n2,t),q=sammyPlaneSliceArbitraryV3(o,axis,maxRadius);if(q&&Number.isFinite(q.circ)&&Number.isFinite(q.width))samples.push({t,o,q})}
 if(samples.length<4)return sammyMeasureLerp(n1,n2,.26);
 let best=null;for(let i=1;i<samples.length;i++){
  const lower=samples[i-1],upper=samples[i];
  // Strong fall in circumference/width while moving upward marks the trapezius transition.
  const dc=Math.max(0,lower.q.circ-upper.q.circ),dw=Math.max(0,lower.q.width-upper.q.width),score=dc+dw*1.35;
  if(!best||score>best.score)best={score,t:upper.t}
 }
 const t=THREE.MathUtils.clamp((best?.t??.26)+.015,.14,.46);return sammyMeasureLerp(n1,n2,t)
}
function sammyMeasureNeckSliceV3(base=false){
 const n1=sammyMeasureJoint("Neck1"),n2=sammyMeasureJoint("Neck2")||sammyMeasureJoint("Head"),la=sammyMeasureJoint("LeftArm"),ra=sammyMeasureJoint("RightArm");if(!n1||!n2)return null;const axis=sammyVecNorm(sammyVecSub(n2,n1)),id=base?"neck_base_circumference":"neck_circumference",off=sammyMeasureAnchorOffset(id)/100,shoulder=(la&&ra)?Math.abs(la[0]-ra[0]):.4,maxRadius=Math.max(.085,shoulder*.27);
 let origin=base?sammyMeasureNeckBaseDynamicV4(n1,n2,axis,maxRadius):sammyMeasureLerp(n1,n2,.70);origin=sammyVecAdd(origin,axis,off);return sammyPlaneSliceArbitraryV3(origin,axis,maxRadius)
}
function sammyMeasureCrotchYV3(){if(sammyMeasureLegacyLandmarksForDelta)return sammyMeasureBaseY("crotch")+sammyMeasureAnchorOffset("crotch_height")/100;const a=sammyBulgeMorphAnchorV8();return a&&Number.isFinite(a.y)?a.y:sammyMeasureBaseY("crotch")+sammyMeasureAnchorOffset("crotch_height")/100}
function sammyMeasurePelvisExtremumV3(kind="circ"){
 const box=sammyMeasureBBox();if(!box)return null;const crotch=sammyMeasureCrotchYV3(),waist=sammyMeasureSharedPlaneY("waist"),span=Math.max(.08,waist-crotch);const lower=crotch+Math.max(.018,span*.10),upper=waist-Math.max(.014,span*.08);if(!(upper>lower))return null;
 // Buttock/Hip extrema may move substantially with body shape, but never below
 // the crotch/perineal landmark and never up into the Omphalion waist region.
 return sammySearchYSlicesV3(lower,upper,36,kind,false)
}
function sammyMeasureTorsoSliceYV5(y){
 const hips=sammyMeasureJoint("Hips"),la=sammyMeasureJoint("LeftArm"),ra=sammyMeasureJoint("RightArm"),box=sammyMeasureBBox();if(!box)return null;const centerX=hips?.[0]??box.cx,shoulderSpan=(la&&ra)?Math.abs(la[0]-ra[0]):box.width,maxX=Math.max(.20,shoulderSpan*.62);return sammyPlaneSliceY(y,maxX,centerX)
}
function sammyMeasureChestSliceV6(){return sammyMeasureChestSliceV7()}

function sammyMeasureHipLevelV6(){
 const box=sammyMeasureBBox();if(!box)return null;const crotch=sammyMeasureCrotchYV3(),waist=sammyMeasureSharedPlaneY("waist"),span=waist-crotch;if(!(span>.08))return null;
 // The actual hip level sits in the upper pelvis, distinctly above the maximal
 // buttock circumference. Find the widest pelvic slice only inside this higher zone.
 const lower=crotch+span*.50,upper=crotch+span*.82;if(!(upper>lower))return null;return sammySearchYSlicesV3(lower,upper,32,"width",false)
}
function sammyMeasureNaturalWaistV3(){
 const box=sammyMeasureBBox();if(!box)return null;const omphalion=sammyMeasureSharedPlaneY("waist"),chest=sammyMeasureSharedPlaneY("chest"),band=Math.max(.09,chest-omphalion),lower=omphalion-band*.14,upper=chest-band*.22;if(!(upper>lower))return null;return sammySearchYMinV3(lower,upper,32,false)
}
function sammyMeasureNearestVertexV3(target,filter=null){
 const p=sammyMeasurementPositions();if(!p)return target;let best=Infinity,out=target;for(let i=0;i<p.length;i+=3){const q=[p[i],p[i+1],p[i+2]];if(filter&&!filter(q))continue;const dx=q[0]-target[0],dy=q[1]-target[1],dz=q[2]-target[2],d=dx*dx+dy*dy+dz*dz;if(d<best){best=d;out=q}}return out
}
function sammyComputeMeasure(def,sectionCache=null){
 const cal=sammyMeasureModelCal(def.id),off=sammyMeasureScaledCm(cal.offsetCm),span=sammyMeasureScaledCm(cal.spanOffsetCm),box=sammyMeasureBBox();if(!box)return {valueCm:NaN};
 if(def.kind==="stature")return {valueCm:box.height*100,line:{kind:"stature",box}};
 if(def.kind==="shoulder"){
  const l=sammyMeasureJoint("LeftArm"),r=sammyMeasureJoint("RightArm");if(!l||!r)return {valueCm:NaN};const y=(l[1]+r[1])*.5+off/100,z=(l[2]+r[2])*.5,cx=(l[0]+r[0])*.5,total=sammyMeasureApplySpan(Math.abs(l[0]-r[0])*100,span)/100;return {valueCm:total*100,line:{kind:"segment",a:[cx-total/2,y,z],b:[cx+total/2,y,z]},anchors:{left:[cx-total/2,y,z],right:[cx+total/2,y,z]}}
 }
 if(def.kind==="crotchHeight"){
  const semantic=sammyMeasureLegacyLandmarksForDelta?null:sammyBulgeMorphAnchorV8(),y=sammyMeasureCrotchYV3(),anchor=semantic?.point||[box.cx,y,box.cz];return {valueCm:(y-box.minY)*100,line:{kind:"crotch",y,box},anchor}
 }
 if(def.kind==="torsoHeight"){
  const sh=sammyComputeMeasure(SAMMY_MEASURE_DEFS.find(d=>d.id==="biacromial_breadth"),sectionCache),cr=sammyComputeMeasure(SAMMY_MEASURE_DEFS.find(d=>d.id==="crotch_height"),sectionCache);if(!sh?.line||!cr?.line)return {valueCm:NaN};const top=(sh.line.a[1]+sh.line.b[1])*.5,bottom=cr.line.y,z=box.maxZ+box.depth*.03;return {valueCm:Math.abs(top-bottom)*100,line:{kind:"segment",a:[box.cx,bottom,z],b:[box.cx,top,z]}}
 }
 if(def.kind==="tibialeHeight"){
  const sh=sammyMeasureJoint("RightShin");if(!sh)return {valueCm:NaN};const y=sh[1]+off/100;return {valueCm:(y-box.minY)*100,line:{kind:"segment",a:[sh[0],box.minY,sh[2]],b:[sh[0],y,sh[2]]},anchor:[sh[0],y,sh[2]]}
 }
 if(def.kind==="upperlegHeight"){
  const leg=sammyMeasureJoint("RightLeg"),td=sammyComputeMeasure(SAMMY_MEASURE_DEFS.find(d=>d.id==="tibiale_height"),sectionCache);if(!leg||!td?.line)return {valueCm:NaN};const y2=td.line.b[1];return {valueCm:Math.abs(leg[1]-y2)*100,line:{kind:"segment",a:leg,b:[leg[0],y2,leg[2]]}}
 }
 if(def.kind==="jointSegment"){
  const a=sammyMeasureJoint(def.joints[0]),b=sammyMeasureJoint(def.joints[1]);if(!a||!b)return {valueCm:NaN};const aa=[a[0],a[1]+off/100,a[2]],bb=[b[0],b[1]+off/100,b[2]],val=Math.hypot(bb[0]-aa[0],bb[1]-aa[1],bb[2]-aa[2])*100;return {valueCm:val,line:{kind:"segment",a:aa,b:bb}}
 }
 if(def.kind==="shoulderLength"){
  const a=sammyMeasureJoint("RightShoulder"),b=sammyMeasureJoint("RightArm");if(!a||!b)return {valueCm:NaN};const aa=[a[0],a[1]+off/100,a[2]],bb=[b[0],b[1]+off/100,b[2]];return {valueCm:Math.hypot(bb[0]-aa[0],bb[1]-aa[1],bb[2]-aa[2])*100,line:{kind:"segment",a:aa,b:bb}}
 }
 if(def.kind==="neckHeight"){
  const a=sammyMeasureJoint("Neck1"),b=sammyMeasureJoint("Neck2")||sammyMeasureJoint("Head");if(!a||!b)return {valueCm:NaN};const axis=sammyVecNorm(sammyVecSub(b,a)),bb=sammyVecAdd(b,axis,off/100);return {valueCm:Math.hypot(bb[0]-a[0],bb[1]-a[1],bb[2]-a[2])*100,line:{kind:"segment",a,b:bb}}
 }
 if(def.kind==="waistBackLength"||def.kind==="frontChest"){
  const n=sammyMeasureJoint("Neck1")||sammyMeasureJoint("Chest"),wy=sammyMeasureSharedPlaneY("waist")+off/100;if(!n)return {valueCm:NaN};const z=def.kind==="frontChest"?box.maxZ+box.depth*.03:box.minZ-box.depth*.03;return {valueCm:Math.abs(n[1]-wy)*100,line:{kind:"segment",a:[box.cx,wy,z],b:[box.cx,n[1],z]}}
 }
 if(def.kind==="waistToHip"){
  const wy=sammyMeasureSharedPlaneY("waist"),hs=sammyMeasurePelvisExtremumV3("circ"),hy=hs?.plane??sammyMeasureSharedPlaneY("hip"),z=box.maxZ+box.depth*.03;return {valueCm:Math.abs(wy-hy)*100,line:{kind:"segment",a:[box.cx,hy,z],b:[box.cx,wy,z]}}
 }
 let slice=null;
 if(def.id==="neck_circumference")slice=sammyMeasureNeckSliceV3(false);
 else if(def.id==="neck_base_circumference")slice=sammyMeasureNeckSliceV3(true);
 else if(def.id==="natural_waist_circumference")slice=sammyMeasureNaturalWaistV3();
 else if(def.id==="buttock_circumference")slice=sammyMeasurePelvisExtremumV3("circ");
 else if(def.id==="hip_breadth"||def.id==="hip_circumference"){
  const key="semantic:hipLevel:v6";slice=sectionCache?.get(key);if(!slice){slice=sammyMeasureHipLevelV6();if(sectionCache&&slice)sectionCache.set(key,slice)}
 }
 else if(def.id==="calf_circumference"){
  const sh=sammyMeasureJoint("RightShin"),ft=sammyMeasureJoint("RightFoot");if(sh&&ft){const low=sammyMeasureLerp(ft,sh,.20)[1],high=sammyMeasureLerp(ft,sh,.72)[1];slice=sammySearchYSlicesV3(low,high,26,"circ",true)}
 }
 else if(def.id==="ankle_circumference"){
  const sh=sammyMeasureJoint("RightShin"),ft=sammyMeasureJoint("RightFoot");if(sh&&ft){const low=sammyMeasureLerp(ft,sh,.02)[1],high=sammyMeasureLerp(ft,sh,.28)[1];slice=sammySearchYMinV3(low,high,20,true)}
 }
 else if(def.id==="thigh_circumference"){
  const y=sammyMeasureBaseY("thigh")+off/100;slice=sammyPlaneSliceYLimbV3(y)
 }
 else if(def.id==="upperarm_circumference")slice=sammySearchArmMaxV3(sammyMeasureJoint("RightArm"),sammyMeasureJoint("RightForeArm"),.52,.68,24);
 else if(def.id==="forearm_circumference")slice=sammySearchArmMaxV3(sammyMeasureJoint("RightForeArm"),sammyMeasureJoint("RightHand"),.18,.72,26);
 else if(def.id==="wrist_circumference"){
  const a=sammyMeasureJoint("RightForeArm"),b=sammyMeasureJoint("RightHand");if(a&&b){const axis=sammyVecSub(b,a),len=Math.hypot(...axis),t=THREE.MathUtils.clamp(.88+(len?off/100/len:0),.70,.98),o=sammyMeasureLerp(a,b,t);slice=sammyPlaneSliceArbitraryV3(o,axis,Math.max(.055,len*.35))}
 }
 else if(def.section==="chest"){
  const key="semantic:chest:v7:nippleMorph";slice=sectionCache?.get(key);if(!slice){slice=sammyMeasureChestSliceV7();if(sectionCache&&slice)sectionCache.set(key,slice)}
 }
 else if(def.section==="waist"){slice=sammyPlaneSliceY(sammyMeasureSharedPlaneY("waist"));if(slice){const a=sammyNavelMorphAnchorV8();slice.semanticAnchor=a?"navelMorphLandmark":"waistFallback";slice.navelAnchor=a||null}}
 else if(def.kind==="limbCircPlane"){}
 else{
  const key=`${def.section}:${off.toFixed(3)}`;slice=sectionCache?.get(key);if(!slice){slice=sammyMeasureSection(def.section,off);if(sectionCache&&slice)sectionCache.set(key,slice)}
 }
 if(!slice)return {valueCm:NaN};
 if(def.kind==="sliceCirc"||def.kind==="limbCircY"||def.kind==="limbCircX"||def.kind==="limbCircPlane")return {valueCm:slice.circ,line:{kind:slice.axis==="P"?"loopP":(slice.axis==="X"?"loopX":"loop"),slice}};
 if(def.kind==="sliceWidth"){
  const total=sammyMeasureApplySpan(slice.width,span)/100,c=(slice.minA+slice.maxA)/2;return {valueCm:total*100,line:{kind:"width",slice,minX:c-total/2,maxX:c+total/2}}
 }
 if(def.kind==="sliceDepth"){
  const total=sammyMeasureApplySpan(slice.depth,span)/100,c=(slice.minB+slice.maxB)/2;return {valueCm:total*100,line:{kind:"depth",slice,minZ:c-total/2,maxZ:c+total/2}}
 }
 return {valueCm:NaN}
}
function sammySliceWorldPointV3(slice,q){
 if(slice.axis==="P")return [slice.origin[0]+slice.u[0]*q[0]+slice.v[0]*q[1],slice.origin[1]+slice.u[1]*q[0]+slice.v[1]*q[1],slice.origin[2]+slice.u[2]*q[0]+slice.v[2]*q[1]];
 if(slice.axis==="X")return [slice.plane,q[0],q[1]];return [q[0],slice.plane,q[1]]
}
function sammySliceCenterWorldV3(slice){
 if(slice.axis==="P")return slice.origin.slice();const a=(slice.minA+slice.maxA)/2,b=(slice.minB+slice.maxB)/2;return sammySliceWorldPointV3(slice,[a,b])
}
function sammyMeasureLandmarksV3(results){
 const out=[],add=(label,p,measure)=>{if(p&&p.every(Number.isFinite))out.push({label,point:p,measure})};
 const sh=results.biacromial_breadth?.line;if(sh?.a&&sh?.b){const box=sammyMeasureBBox(),cx=box?.cx||0,la=sammyMeasureJoint("LeftArm"),ra=sammyMeasureJoint("RightArm"),lp=la&&Math.abs(sh.b[0]-la[0])<Math.abs(sh.a[0]-la[0])?sh.b:sh.a,rp=ra&&Math.abs(sh.a[0]-ra[0])<Math.abs(sh.b[0]-ra[0])?sh.a:sh.b,sideFilter=t=>q=>Math.sign(q[0]-cx)===Math.sign(t[0]-cx)||Math.abs(q[0]-cx)<.005;add("Acromion L",sammyMeasureNearestVertexV3(lp,sideFilter(lp)),"biacromial_breadth");add("Acromion R",sammyMeasureNearestVertexV3(rp,sideFilter(rp)),"biacromial_breadth")}
 const pointOnSlice=(id,which)=>{const s=results[id]?.line?.slice;if(!s?.hull?.length)return null;let q=s.hull[0];for(const x of s.hull){if(which==="front"&&x[1]>q[1])q=x;if(which==="back"&&x[1]<q[1])q=x}return sammySliceWorldPointV3(s,q)};
 const nip=sammyNippleMorphAnchorsV7();if(nip?.left)add("Nipple L",nip.left,"chest_circumference");if(nip?.right)add("Nipple R",nip.right,"chest_circumference");if(!nip?.left&&!nip?.right)add("Chest",pointOnSlice("chest_circumference","front"),"chest_circumference");
 const nav=sammyNavelMorphAnchorV8();add("Omphalion · Navel",nav?.point||pointOnSlice("waist_circumference","front"),"waist_circumference");
 add("Natural Waist",pointOnSlice("natural_waist_circumference","front"),"natural_waist_circumference");
 add("Buttock",pointOnSlice("buttock_circumference","back"),"buttock_circumference");const hs=results.hip_breadth?.line?.slice||results.hip_circumference?.line?.slice;if(hs)add("Hip level",sammySliceCenterWorldV3(hs),"hip_breadth");
 const cr=results.crotch_height?.line;if(cr?.y!=null){const b=cr.box,bul=sammyBulgeMorphAnchorV8();add("Crotch · Bulge",bul?.point||sammyMeasureNearestVertexV3([b.cx,cr.y,b.cz],q=>Math.abs(q[0]-b.cx)<.08&&Math.abs(q[1]-cr.y)<.035),"crotch_height")}
 for(const [id,label] of [["neck_circumference","Neck"],["neck_base_circumference","Neck Base"],["wrist_circumference","Stylion/Wrist"],["thigh_circumference","Thigh level"],["calf_circumference","Calf max"],["ankle_circumference","Ankle min"],["upperarm_circumference","Biceps level"],["forearm_circumference","Forearm max"]]){const s=results[id]?.line?.slice;if(s)add(label,sammySliceCenterWorldV3(s),id)}
 const rad=sammyMeasureJoint("RightForeArm"),tib=results.tibiale_height?.anchor,troch=sammyMeasureJoint("RightLeg");add("Radiale",rad,"upperarm_length");add("Tibiale",tib,"tibiale_height");add("Trochanterion proxy",troch,"upperleg_height");return out
}
function sammyMeasureLinePoints(result){
 const line=result?.line;if(!line)return null;
 if(line.kind==="loop")return {points:line.slice.hull.map(q=>[q[0],line.slice.plane,q[1]]),closed:true};
 if(line.kind==="loopX")return {points:line.slice.hull.map(q=>[line.slice.plane,q[0],q[1]]),closed:true};
 if(line.kind==="loopP")return {points:line.slice.hull.map(q=>sammySliceWorldPointV3(line.slice,q)),closed:true};
 if(line.kind==="width"){const s=line.slice,z=(s.minB+s.maxB)/2;return {points:[[line.minX,s.plane,z],[line.maxX,s.plane,z]],closed:false}}
 if(line.kind==="depth"){const s=line.slice,x=(s.minA+s.maxA)/2;return {points:[[x,s.plane,line.minZ],[x,s.plane,line.maxZ]],closed:false}}
 if(line.kind==="segment")return {points:[line.a,line.b],closed:false};
 if(line.kind==="stature"){const b=line.box,x=b.minX-b.width*.06,z=b.maxZ+b.depth*.025;return {points:[[x,b.minY,z],[x,b.maxY,z]],closed:false}}
 if(line.kind==="crotch"){const b=line.box,z=b.maxZ+b.depth*.025;return {points:[[b.cx,b.minY,z],[b.cx,line.y,z]],closed:false}}return null
}
function sammyAddLandmarkV3(item,selected=false){
 const b=sammyMeasureBBox(),r=Math.max(.006,(b?.height||1.8)*.0052),g=new THREE.SphereGeometry(r,12,9),m=new THREE.MeshBasicMaterial({color:selected?0xffdf72:0xf2f3f6,transparent:true,opacity:selected?1:.94,depthTest:false,depthWrite:false}),dot=new THREE.Mesh(g,m);dot.position.set(...item.point);dot.renderOrder=44;dot.userData.sammyMeasureId=item.measure;dot.userData.sammyMeasureLandmark=true;sammyMeasureOverlayGroup.add(dot);
 if(!(sammyMeasureLabelsVisible||sammyMeasureTransientLabelId===item.measure))return;
 const c=document.createElement("canvas");c.width=256;c.height=48;const x=c.getContext("2d");x.fillStyle="rgba(18,19,23,.86)";x.fillRect(0,3,256,42);x.font="600 20px system-ui, sans-serif";x.textAlign="center";x.textBaseline="middle";x.fillStyle=selected?"#ffdf72":"#f3f3f5";x.fillText(item.label,128,24);const tex=new THREE.CanvasTexture(c),mat=new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false,depthWrite:false}),sp=new THREE.Sprite(mat);sp.position.set(item.point[0],item.point[1]+r*2.2,item.point[2]);sp.scale.set(.115,.022,1);sp.renderOrder=45;sp.userData.sammyMeasureId=item.measure;sammyMeasureOverlayGroup.add(sp)
}
function sammyUpdateMeasureOverlay(results){
 sammyClearMeasureOverlay();if(!sammyMeasureSession||(sammyMeasureOverlayMode==="none"&&!sammyMeasureLandmarksVisible))return;sammyMeasureOverlayGroup=new THREE.Group();sammyMeasureOverlayGroup.name="SammyMeasurementOverlayV073";scene.add(sammyMeasureOverlayGroup);
 if(sammyMeasureOverlayMode!=="none"){const defs=sammyMeasureOverlayMode==="all"?SAMMY_MEASURE_DEFS:SAMMY_MEASURE_DEFS.filter(d=>d.id===sammyMeasureSelected);for(const d of defs){const lp=sammyMeasureLinePoints(results[d.id]);if(lp)sammyAddMeasureLine(lp.points,d.id,d.id===sammyMeasureSelected,lp.closed)}}
 if(sammyMeasureLandmarksVisible)for(const lm of sammyMeasureLandmarksV3(results))sammyAddLandmarkV3(lm,lm.measure===sammyMeasureSelected)
}
function sammyMeasureSetLandmarks(on=!sammyMeasureLandmarksVisible){sammyMeasureLandmarksVisible=!!on;const b=$("#sammyMeasureLandmarks");if(b){b.classList.toggle("active",sammyMeasureLandmarksVisible);b.textContent=sammyMeasureLandmarksVisible?"Landmarks AN":"Landmarks AUS"}sammyMeasureRefresh(false)}
function sammyMeasureSetLabels(on=!sammyMeasureLabelsVisible){sammyMeasureLabelsVisible=!!on;const b=$("#sammyMeasureLabels");if(b){b.classList.toggle("active",sammyMeasureLabelsVisible);b.textContent=sammyMeasureLabelsVisible?"Namen AN":"Namen AUS"}sammyMeasureRefresh(false)}
function sammyMeasureShowTransientLabel(id){sammyMeasureTransientLabelId=id;clearTimeout(sammyMeasureTransientLabelTimer);sammyMeasureTransientLabelTimer=setTimeout(()=>{sammyMeasureTransientLabelId=null;if(sammyMeasureSession&&!sammyMeasureLabelsVisible)sammyMeasureRefresh(false)},1800)}
function sammyMeasureSelectFromOverlay(id){if(!id||!SAMMY_MEASURE_DEFS.some(d=>d.id===id))return false;sammyMeasureSelected=id;sammyMeasureInfoOpenFor=null;sammyMeasureShowTransientLabel(id);sammyMeasureRefresh(true);requestAnimationFrame(()=>document.querySelector(`.sammyMeasureRow[data-id="${id}"]`)?.scrollIntoView({block:"nearest",behavior:"smooth"}));return true}
function sammyMeasurePickAt(clientX,clientY){
 if(!sammyMeasureSession||!sammyMeasureOverlayGroup)return false;const rect=renderer.domElement.getBoundingClientRect(),x=((clientX-rect.left)/rect.width)*2-1,y=-((clientY-rect.top)/rect.height)*2+1,ray=new THREE.Raycaster(),b=sammyMeasureBBox();ray.params.Line.threshold=Math.max(.012,(b?.height||1.8)*.008);ray.params.Points.threshold=ray.params.Line.threshold;ray.setFromCamera(new THREE.Vector2(x,y),cam);const hits=ray.intersectObjects(sammyMeasureOverlayGroup.children,true);for(const h of hits){const id=h.object?.userData?.sammyMeasureId;if(id)return sammyMeasureSelectFromOverlay(id)}return false
}
function sammyInstallMeasurePicking(){
 if(renderer.domElement.dataset.sammyMeasurePicking)return;renderer.domElement.dataset.sammyMeasurePicking="1";
 renderer.domElement.addEventListener("pointerdown",e=>{if(sammyMeasureSession)sammyMeasurePickStart={id:e.pointerId,x:e.clientX,y:e.clientY}});
 renderer.domElement.addEventListener("pointerup",e=>{const a=sammyMeasurePickStart;sammyMeasurePickStart=null;if(!a||a.id!==e.pointerId||!sammyMeasureSession)return;if(Math.hypot(e.clientX-a.x,e.clientY-a.y)>9)return;sammyMeasurePickAt(e.clientX,e.clientY)});
 renderer.domElement.addEventListener("pointercancel",()=>{sammyMeasurePickStart=null})
}
function sammyMeasureSyncLocalUiV3(){
 setAnnyUiFromParams();
 document.querySelectorAll("#annyLocalGroups .annySlider").forEach(row=>{
  const raw=row.querySelector("label small")?.textContent||"";
  if(!raw||!(raw in annyLocalValues))return;
  const input=row.querySelector("input"),out=row.querySelector("output"),v=Number(annyLocalValues[raw])||0;
  if(input)input.value=String(v);if(out)out.value=v.toFixed(2)
 })
}
function sammyMeasureRandomLocalV3(extreme=false){
 if(!annyMeta?.local_change_labels)return;for(const k of Object.keys(annyLocalValues))annyLocalValues[k]=0;const cats=new Set(["torso","breast","stomach","buttocks","arms","legs","neck"]),pool=annyMeta.local_change_labels.filter(k=>cats.has(annyMeta.local_change_categories[k]));for(let n=0;n<(extreme?10:4)&&pool.length;n++){const i=Math.floor(Math.random()*pool.length),k=pool.splice(i,1)[0],amp=extreme?.85:.32;annyLocalValues[k]=(Math.random()*2-1)*amp}
 document.querySelectorAll("#sammyLocalMount .annySlider").forEach(row=>{const raw=row.querySelector("label small")?.textContent||"";if(raw&&raw in annyLocalValues){const input=row.querySelector("input"),out=row.querySelector("output");if(input)input.value=annyLocalValues[raw];if(out)out.value=Number(annyLocalValues[raw]).toFixed(2)}})
}
function sammyMeasureRandomize(extreme=false){
 if(!annyPackLoaded){const st=$("#sammyMeasureRandomStatus");if(st)st.textContent="Anny-Pack noch nicht aktiv.";return}const sex=Math.random()<.5?0:1,edge=()=>Math.random()<.5?(Math.random()*.12):(.88+Math.random()*.12),mid=(lo=.12,hi=.88)=>lo+Math.random()*(hi-lo);
 annyParams.gender=sex;annyParams.age=extreme?(Math.random()<.5?SAMMY_ADULT_SHAPE_AGE_MIN:SAMMY_ADULT_SHAPE_AGE_MAX):(SAMMY_ADULT_SHAPE_AGE_MIN+(SAMMY_ADULT_SHAPE_AGE_MAX-SAMMY_ADULT_SHAPE_AGE_MIN)*mid(.05,.95));annyParams.height=extreme?edge():mid(.08,.92);annyParams.weight=extreme?edge():mid(.08,.92);annyParams.muscle=extreme?edge():mid(.08,.92);annyParams.proportions=extreme?edge():mid(.08,.92);annyParams.cupsize=sex?(extreme?edge():mid(.08,.92)):.5;annyParams.firmness=sex?(extreme?edge():mid(.10,.95)):.5;annyParams.african=.5;annyParams.asian=.5;annyParams.caucasian=.5;sammyMeasureRandomLocalV3(extreme);sammyMeasureScope=sex?"female":"male";applyAnnyParams();sammyMeasureOverlayMode="all";sammyMeasureLandmarksVisible=true;for(const [id,m] of [["#sammyMeasureShowSelected","selected"],["#sammyMeasureShowAll","all"],["#sammyMeasureShowNone","none"]])$(id)?.classList.toggle("active",sammyMeasureOverlayMode===m);sammyMeasureSetLandmarks(true);requestAnimationFrame(()=>{sammyMeasureRefresh(true);const st=$("#sammyMeasureRandomStatus"),r=sammyMeasureResultsCache.stature?.valueCm;if(st)st.textContent=`${extreme?"EXTREME":"RANDOM"} · ${sex?"♀":"♂"} · ${Number.isFinite(r)?r.toFixed(1)+" cm":"—"} · ${Math.round(sammyShapeAgeToYears())} J. · H ${annyParams.height.toFixed(2)} · W ${annyParams.weight.toFixed(2)} · M ${annyParams.muscle.toFixed(2)} · P ${annyParams.proportions.toFixed(2)}`})
}

// -----------------------------------------------------------------------------
// Sammy v0.8.7 SOLVER-WHITELIST CALIBRATION + NIPPLE LANDMARK + EARLY INTRO CAMERA
// Logical L/R slider grouping + cheap screening of all plausible interactions
// + deep scans only for pairs that actually show non-additive behaviour.
// -----------------------------------------------------------------------------
const SAMMY_CAL_DB="sammy-calibration-lab-v084",SAMMY_CAL_DB_VERSION=1,SAMMY_CAL_RUN_STORE="runs",SAMMY_CAL_RECORD_STORE="records";
const SAMMY_CAL_SCHEMA="sammy-calibration-lab-v2";
const SAMMY_CAL_CONFIG={
 quick:{label:"Quick",refs:2,levels:3,screenMaxPairs:500,screenRefs:1,screenCombos:1,screenThresholdCm:.55,deepMaxPairs:24,interactionRefs:2,globalSamples:300,validationSamples:60,localPerGlobal:5,localAmp:.52,liveDelay:55},
 standard:{label:"Standard",refs:4,levels:5,screenMaxPairs:null,screenRefs:1,screenCombos:1,screenThresholdCm:.40,deepMaxPairs:220,interactionRefs:2,globalSamples:1800,validationSamples:250,localPerGlobal:9,localAmp:.68,liveDelay:60},
 deep:{label:"Deep",refs:6,levels:7,screenMaxPairs:null,screenRefs:2,screenCombos:2,screenThresholdCm:.25,deepMaxPairs:700,interactionRefs:4,globalSamples:6000,validationSamples:750,localPerGlobal:15,localAmp:.90,liveDelay:65}
};
let sammyCalDBPromise=null;
let sammyCalibration={mode:"standard",running:false,paused:false,cancelRequested:false,turbo:false,run:null,lastRun:null};
function sammyCalOpenDB(){if(sammyCalDBPromise)return sammyCalDBPromise;sammyCalDBPromise=new Promise((resolve,reject)=>{const req=indexedDB.open(SAMMY_CAL_DB,SAMMY_CAL_DB_VERSION);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(SAMMY_CAL_RUN_STORE))db.createObjectStore(SAMMY_CAL_RUN_STORE,{keyPath:"runId"});if(!db.objectStoreNames.contains(SAMMY_CAL_RECORD_STORE)){const st=db.createObjectStore(SAMMY_CAL_RECORD_STORE,{keyPath:"id"});st.createIndex("runId","runId",{unique:false})}};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||new Error("Calibration-DB konnte nicht geöffnet werden"))});return sammyCalDBPromise}
async function sammyCalPutRun(run){run.updatedAt=new Date().toISOString();const db=await sammyCalOpenDB();return new Promise((resolve,reject)=>{const tx=db.transaction(SAMMY_CAL_RUN_STORE,"readwrite");tx.objectStore(SAMMY_CAL_RUN_STORE).put(run);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error||new Error("Calibration-Run speichern fehlgeschlagen"))})}
async function sammyCalPutRecord(record){const db=await sammyCalOpenDB();return new Promise((resolve,reject)=>{const tx=db.transaction(SAMMY_CAL_RECORD_STORE,"readwrite");tx.objectStore(SAMMY_CAL_RECORD_STORE).put(record);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error||new Error("Calibration-Record speichern fehlgeschlagen"))})}
async function sammyCalGetRuns(){const db=await sammyCalOpenDB();return new Promise((resolve,reject)=>{const tx=db.transaction(SAMMY_CAL_RUN_STORE,"readonly"),q=tx.objectStore(SAMMY_CAL_RUN_STORE).getAll();q.onsuccess=()=>resolve(q.result||[]);q.onerror=()=>reject(q.error)})}
async function sammyCalGetRecords(runId){const db=await sammyCalOpenDB();return new Promise((resolve,reject)=>{const tx=db.transaction(SAMMY_CAL_RECORD_STORE,"readonly"),idx=tx.objectStore(SAMMY_CAL_RECORD_STORE).index("runId"),q=idx.getAll(IDBKeyRange.only(runId));q.onsuccess=()=>resolve((q.result||[]).sort((a,b)=>(a.ordinal??0)-(b.ordinal??0)));q.onerror=()=>reject(q.error)})}
async function sammyCalDeleteRun(runId){const db=await sammyCalOpenDB();await new Promise((resolve,reject)=>{const tx=db.transaction([SAMMY_CAL_RUN_STORE,SAMMY_CAL_RECORD_STORE],"readwrite"),rs=tx.objectStore(SAMMY_CAL_RUN_STORE),st=tx.objectStore(SAMMY_CAL_RECORD_STORE),idx=st.index("runId");rs.delete(runId);const q=idx.openKeyCursor(IDBKeyRange.only(runId));q.onsuccess=()=>{const c=q.result;if(c){st.delete(c.primaryKey);c.continue()}};tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)});}
function sammyCalRunId(){return `cal-${new Date().toISOString().replace(/[:.]/g,"-")}-${Math.random().toString(36).slice(2,7)}`}
function sammyCalCoreDefaults(gender=0){return {gender,age:.79,muscle:.5,weight:.5,height:.5,proportions:.5,cupsize:gender?.58:.5,firmness:gender?.56:.5,african:.5,asian:.5,caucasian:.5}}
function sammyCalReferences(){return [
 {id:"male_avg",label:"♂ Average",core:sammyCalCoreDefaults(0)},
 {id:"female_avg",label:"♀ Average",core:sammyCalCoreDefaults(1)},
 {id:"male_lean",label:"♂ Lean",core:{...sammyCalCoreDefaults(0),height:.60,weight:.24,muscle:.36,proportions:.48,age:.77}},
 {id:"female_curvy",label:"♀ Curvy",core:{...sammyCalCoreDefaults(1),height:.48,weight:.62,muscle:.35,proportions:.55,cupsize:.76,firmness:.58,age:.77}},
 {id:"male_muscular",label:"♂ Muscular",core:{...sammyCalCoreDefaults(0),height:.66,weight:.60,muscle:.84,proportions:.56,age:.82}},
 {id:"female_tall",label:"♀ Tall",core:{...sammyCalCoreDefaults(1),height:.82,weight:.45,muscle:.48,proportions:.62,cupsize:.48,age:.82}}
]}
const SAMMY_CAL_EXCLUDED_REGION_CATEGORIES=new Set(["mouth","nose","eyes","ears","eyebrows","head","chin","cheek","forehead","hands","feet"]);
const SAMMY_CAL_MANUAL_IDS=new Set([
 "core:firmness","core:african","core:asian","core:caucasian",
 "local:nipple-point-incr","local:nipple-size-incr","local:bulge-incr",
 "local:stomach-navel-out","local:stomach-navel-up",
 "local:neck-trans-out","local:torso-trans-forward","local:torso-trans-out","local:hip-trans-out","local:hip-trans-forward"
]);
const SAMMY_CAL_SPECIAL_IDS=new Set(["local:stomach-pregnant-incr"]);
const SAMMY_CAL_REDUNDANT_IDS=new Set([
 "local:upperlegs-height-incr",
 "localpair:lowerarm-scale-horiz-incr",
 "localpair:upperarm-scale-depth-incr",
 "localpair:upperarm-scale-vert-incr"
]);
function sammyCalAllSliderDefs(){
 const core=[
  ["gender","Gender",0,1,"core"],["age","Alter / shapeAge",SAMMY_ADULT_SHAPE_AGE_MIN,SAMMY_ADULT_SHAPE_AGE_MAX,"core"],["height","Height",0,1,"core"],["weight","Weight",0,1,"core"],["muscle","Muscle",0,1,"core"],["proportions","Proportions",0,1,"core"],["cupsize","Cupsize",0,1,"core"],["firmness","Firmness",0,1,"core"],["african","African phenotype",0,1,"phenotype"],["asian","Asian phenotype",0,1,"phenotype"],["caucasian","Caucasian phenotype",0,1,"phenotype"]
 ].map(([id,label,min,max,category])=>({id:`core:${id}`,key:id,label,kind:"core",category,min,max,unit:id==="age"?"shapeAge":"raw"}));
 const labels=[...(annyMeta?.local_change_labels||[])],set=new Set(labels),used=new Set(),locals=[];
 for(const key of labels){if(used.has(key))continue;const cat=annyMeta?.local_change_categories?.[key]||"other";if(key.startsWith("l-")&&set.has(`r-${key.slice(2)}`)){const base=key.slice(2),rk=`r-${base}`;used.add(key);used.add(rk);locals.push({id:`localpair:${base}`,key:base,keys:[key,rk],label:`${prettyAnnyLabel(base)} · L+R`,kind:"localGroup",category:cat,min:-1,max:1,unit:"raw",symmetry:"paired"});continue}if(key.startsWith("r-")&&set.has(`l-${key.slice(2)}`)){used.add(key);continue}used.add(key);locals.push({id:`local:${key}`,key,label:prettyAnnyLabel(key),kind:"local",category:cat,min:-1,max:1,unit:"raw"})}
 return [...core,...locals]
}
function sammyCalSliderPolicy(d){
 const id=d?.id||"",cat=d?.category||"other";
 if(SAMMY_CAL_EXCLUDED_REGION_CATEGORIES.has(cat))return {role:"excluded",reason:"region not required for body-measure solver"};
 if(cat==="legs"&&(id.includes("lowerleg")||id.includes("knee")||id.includes("calf")||id.includes("leg-valgus")))return {role:"excluded",reason:"lower leg / knee excluded from solver"};
 if(SAMMY_CAL_SPECIAL_IDS.has(id))return {role:"special",reason:"special body state; never infer from ordinary body measures"};
 if(SAMMY_CAL_REDUNDANT_IDS.has(id))return {role:"redundant",reason:"effect duplicated by a retained semantic measure morph"};
 if(SAMMY_CAL_MANUAL_IDS.has(id))return {role:"manual",reason:"visual/positional parameter not inferred by the automatic measure solver"};
 return {role:"solver",reason:"retained automatic solver degree of freedom"};
}
function sammyCalPolicySnapshot(all=sammyCalAllSliderDefs()){
 const counts={solver:0,manual:0,special:0,redundant:0,excluded:0},excluded=[];
 for(const d of all){const p=sammyCalSliderPolicy(d);counts[p.role]=(counts[p.role]||0)+1;if(p.role!=="solver")excluded.push({id:d.id,label:d.label,category:d.category,role:p.role,reason:p.reason})}
 return {logicalAll:all.length,solverCount:counts.solver,counts,excluded};
}
function sammyCalSliderDefs(){const all=sammyCalAllSliderDefs();return all.filter(d=>sammyCalSliderPolicy(d).role==="solver").map(d=>({...d,solverRole:"solver"}))}
function sammyCalIsLocal(d){return d?.kind==="local"||d?.kind==="localGroup"}
function sammyCalLevels(slider,count){if(count<=1)return [(slider.min+slider.max)/2];const out=[];for(let i=0;i<count;i++){let t=i/(count-1);if(count===3)t=[.12,.5,.88][i];if(count===5)t=[0,.25,.5,.75,1][i];out.push(slider.min+(slider.max-slider.min)*t)}return out}
function sammyCalDescriptor(run,id){return run.sliders.find(x=>x.id===id)}
function sammyCalRef(run,id){return run.references.find(x=>x.id===id)}
function sammyCalMakeShape(ref){return {core:{...ref.core},local:{}}}
function sammyCalSliderValue(shape,d){if(d.kind==="localGroup"){const vals=(d.keys||[]).map(k=>Number(shape.local[k]||0));return vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:0}return d.kind==="local"?Number(shape.local[d.key]||0):Number(shape.core[d.key]??.5)}
function sammyCalSetSlider(shape,d,value){if(d.kind==="localGroup")for(const k of d.keys||[])shape.local[k]=Number(value);else if(d.kind==="local")shape.local[d.key]=Number(value);else shape.core[d.key]=Number(value);return shape}
function sammyCalSparseShape(shape){return {core:{...shape.core,ageYears:sammyShapeAgeToYears(shape.core.age,shape.core.gender)},local:Object.entries(shape.local||{}).filter(([,v])=>Math.abs(Number(v))>1e-7)}}
function sammyCalMeasureObject(results){return Object.fromEntries(SAMMY_MEASURE_DEFS.map(d=>[d.id,Number.isFinite(results[d.id]?.valueCm)?Number(results[d.id].valueCm.toFixed(4)):null]))}
async function sammyCalShowFrame(results){sammyMeasureResultsCache=results;sammyMeasureOverlayMode="all";sammyMeasureLandmarksVisible=true;sammyMeasureLabelsVisible=false;sammyUpdateMeasureOverlay(results);for(const d of SAMMY_MEASURE_DEFS){const el=document.querySelector(`[data-measure-value="${d.id}"]`);if(el)el.textContent=sammyMeasureFormat(results[d.id]?.valueCm)}if(sammyCalibration.turbo){await new Promise(r=>setTimeout(r,0));return}await new Promise(r=>requestAnimationFrame(()=>setTimeout(r,SAMMY_CAL_CONFIG[sammyCalibration.run?.mode||sammyCalibration.mode].liveDelay)))}
async function sammyCalApplyShape(shape){annyParams={...annyParams,...shape.core,age:sammyClampAdultShapeAge(shape.core.age)};for(const k of Object.keys(annyLocalValues))annyLocalValues[k]=0;for(const [k,v] of Object.entries(shape.local||{}))if(k in annyLocalValues)annyLocalValues[k]=Number(v)||0;sammyMeasureScope=annyParams.gender>=.5?"female":"male";applyAnnyParams();sammyMeasureSyncLocalUiV3();const results=sammyComputeAllMeasures();await sammyCalShowFrame(results);return results}
function sammyCalStageLabel(stage){return ({reference:"0 · Referenzkörper",single:"1 · Slider Scan",analysis:"2 · Relevanzanalyse",screen:"3 · Paar-Screening",interaction:"4 · Tiefe Interaktionen",global:"5 · Global Sampling",validation:"6 · Validierung",complete:"7 · Fertig"})[stage]||stage}
function sammyCalStageTotal(run){const c=SAMMY_CAL_CONFIG[run.mode];if(run.stage==="reference")return run.references.length;if(run.stage==="single")return run.sliders.length*run.references.length*c.levels;if(run.stage==="analysis")return 1;if(run.stage==="screen")return (run.candidatePairs?.length||0)*Math.max(1,c.screenRefs)*Math.max(1,c.screenCombos);if(run.stage==="interaction")return (run.deepInteractionPairs?.length||0)*Math.min(c.interactionRefs,run.references.length)*4;if(run.stage==="global")return c.globalSamples;if(run.stage==="validation")return c.validationSamples;return 1}
function sammyCalStatus(detail=""){const run=sammyCalibration.run||sammyCalibration.lastRun,stage=run?.stage||"—",total=run?sammyCalStageTotal(run):0,cursor=run?.cursor||0,p=total?Math.min(1,cursor/total):0;const st=$("#sammyCalibrationStatus"),bar=$("#sammyCalibrationProgressBar"),cur=$("#sammyCalibrationCurrent");if(st)st.textContent=run?`${sammyCalStageLabel(stage)} · ${Math.min(cursor,total)} / ${total}${sammyCalibration.paused?" · PAUSE":""}`:"Noch kein Calibration-Lauf.";if(bar)bar.style.width=`${(p*100).toFixed(1)}%`;if(cur&&detail)cur.textContent=detail;const start=$("#sammyCalibrationStart"),pause=$("#sammyCalibrationPause"),reset=$("#sammyCalibrationReset");if(start)start.textContent=sammyCalibration.running?"Läuft …":(run&&run.stage!=="complete"?"Fortsetzen":"Neue Kalibrierung");if(start)start.disabled=sammyCalibration.running;if(pause)pause.disabled=!sammyCalibration.running;if(reset)reset.disabled=sammyCalibration.running}
function sammyCalLiveReadout(results,detail){const el=$("#sammyCalibrationLiveMeasures");if(!el)return;const ids=["stature","chest_circumference","waist_circumference","natural_waist_circumference","buttock_circumference","hip_breadth","hip_circumference","upperarm_circumference","calf_circumference"];el.innerHTML=`<b>${escapeHtml(detail||"LIVE")}</b>`+ids.map(id=>{const d=SAMMY_MEASURE_DEFS.find(x=>x.id===id),v=results?.[id]?.valueCm;return `<span>${escapeHtml(d?.label||id)} <strong>${Number.isFinite(v)?v.toFixed(1):"—"} cm</strong></span>`}).join("")}
function sammyCalNewRun(mode=sammyCalibration.mode){const c=SAMMY_CAL_CONFIG[mode],refs=sammyCalReferences().slice(0,c.refs),all=sammyCalAllSliderDefs(),policy=sammyCalPolicySnapshot(all),sliders=all.filter(d=>sammyCalSliderPolicy(d).role==="solver").map(d=>({...d,solverRole:"solver"}));return {schema:SAMMY_CAL_SCHEMA,runId:sammyCalRunId(),appVersion:"0.8.7",mode,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),stage:"reference",cursor:0,ordinal:0,references:refs,sliders,solverPolicy:policy,referenceMeasures:{},effects:{},relevantSliderIds:[],candidatePairs:[],deepInteractionPairs:[],screening:{thresholdCm:c.screenThresholdCm,byPair:{},screenedCount:0,strongCount:0},validation:{sumSq:{},count:{},overallSumSq:0,overallCount:0},notes:{measurementEngine:"v0.8.7 semantic MEAS; Anny nipple-morph chest landmark + Navel/Omphalion waist landmark + Bulge/Crotch landmark + shared upper hip width/circumference + mid-biceps level",rawMorphUnits:"core 0..1 except age 0.70..1.00; logical local sliders -1..1",symmetry:"matching l-/r- Anny morphs are calibrated as one logical L+R slider",solverWhitelist:"Calibration scans only retained body-solver degrees of freedom; head/face, hands, feet, lower legs/knees, manual/special parameters and safe redundancies remain available in FORM but are excluded here",interactionStrategy:"all plausible retained pairs cheap-screened in Standard/Deep; only non-additive pairs receive deep scan",liveDefault:true}}}
function sammyCalEffectSlot(run,d){return run.effects[d.id]??={id:d.id,label:d.label,kind:d.kind,category:d.category,members:d.keys||[d.key],maxAbs:{},regression:{}}}
function sammyCalUpdateEffects(run,d,ref,shape,measureObj){const base=run.referenceMeasures[ref.id];if(!base)return;const x=sammyCalSliderValue(shape,d)-(sammyCalIsLocal(d)?0:Number(ref.core[d.key]??.5)),slot=sammyCalEffectSlot(run,d);for(const m of SAMMY_MEASURE_DEFS){const y=(measureObj[m.id]??NaN)-(base[m.id]??NaN);if(!Number.isFinite(y))continue;slot.maxAbs[m.id]=Math.max(Number(slot.maxAbs[m.id]||0),Math.abs(y));if(Math.abs(x)>1e-8){const r=slot.regression[m.id]??={n:0,sx:0,sy:0,sxx:0,sxy:0};r.n++;r.sx+=x;r.sy+=y;r.sxx+=x*x;r.sxy+=x*y}}}
function sammyCalSlope(run,sliderId,measureId){const r=run.effects?.[sliderId]?.regression?.[measureId];if(!r||r.n<2)return 0;const den=r.n*r.sxx-r.sx*r.sx;return Math.abs(den)>1e-9?(r.n*r.sxy-r.sx*r.sy)/den:0}
function sammyCalEffectSimilarity(run,aId,bId){const va=[],vb=[];for(const m of SAMMY_MEASURE_DEFS){va.push(sammyCalSlope(run,aId,m.id));vb.push(sammyCalSlope(run,bId,m.id))}let dot=0,aa=0,bb=0;for(let i=0;i<va.length;i++){dot+=va[i]*vb[i];aa+=va[i]*va[i];bb+=vb[i]*vb[i]}if(aa<1e-8||bb<1e-8)return {cosine:0,ratio:0};return {cosine:dot/Math.sqrt(aa*bb),ratio:Math.sqrt(aa/bb)}}
function sammyCalAnalyze(run){const c=SAMMY_CAL_CONFIG[run.mode],threshold=.15,scored=[];run.relevantSliderIds=[];for(const d of run.sliders){const e=run.effects[d.id],max=e?Math.max(0,...Object.values(e.maxAbs||{}).map(Number)):0;if(max>=threshold){run.relevantSliderIds.push(d.id);scored.push({id:d.id,max:Number(max.toFixed(4))})}}const rel=run.relevantSliderIds.map(id=>sammyCalDescriptor(run,id)).filter(Boolean),pairs=[],redundant=[];for(let i=0;i<rel.length;i++)for(let j=i+1;j<rel.length;j++){const a=run.effects[rel[i].id],b=run.effects[rel[j].id];let score=0,shared=0;for(const m of SAMMY_MEASURE_DEFS){const x=Number(a?.maxAbs?.[m.id]||0),y=Number(b?.maxAbs?.[m.id]||0);if(x>=threshold&&y>=threshold){shared++;score+=Math.min(x,y)}}if(shared){const p={a:rel[i].id,b:rel[j].id,score:Number(score.toFixed(4)),shared};pairs.push(p);const sim=sammyCalEffectSimilarity(run,p.a,p.b);if(Math.abs(sim.cosine)>=.995&&sim.ratio>=.75&&sim.ratio<=1.333)redundant.push({...p,cosine:Number(sim.cosine.toFixed(5)),magnitudeRatio:Number(sim.ratio.toFixed(4))})}}pairs.sort((a,b)=>b.score-a.score);const target=c.screenMaxPairs?Math.min(c.screenMaxPairs,pairs.length):pairs.length;run.candidatePairs=pairs.slice(0,target);run.deepInteractionPairs=[];run.screening={thresholdCm:c.screenThresholdCm,byPair:{},screenedCount:0,strongCount:0};run.analysis={thresholdCm:threshold,relevantCount:run.relevantSliderIds.length,totalSliders:run.sliders.length,rawAnnyLocalCount:(annyMeta?.local_change_labels||[]).length,logicalAllCount:run.solverPolicy?.logicalAll??run.sliders.length,logicalSliderCount:run.sliders.length,solverExcludedCount:(run.solverPolicy?.logicalAll??run.sliders.length)-run.sliders.length,pairedLogicalCount:run.sliders.filter(d=>d.kind==="localGroup").length,pairCandidatesTotal:pairs.length,pairCandidatesScreenTarget:run.candidatePairs.length,redundancyCandidates:redundant.sort((a,b)=>Math.abs(b.cosine)-Math.abs(a.cosine)).slice(0,120),topRelevant:scored.sort((a,b)=>b.max-a.max).slice(0,40)}}
function sammyCalPairValue(d,hi){if(sammyCalIsLocal(d))return hi?.68:-.68;if(d.key==="age")return hi?.94:.74;if(d.key==="gender")return hi?1:0;return d.min+(d.max-d.min)*(hi?.75:.25)}
function sammyCalPredictTwo(run,ref,a,b,shape){const base=run.referenceMeasures[ref.id],out={};for(const m of SAMMY_MEASURE_DEFS){let v=base?.[m.id];if(!Number.isFinite(v)){out[m.id]=null;continue}for(const d of [a,b])v+=sammyCalSlope(run,d.id,m.id)*(sammyCalSliderValue(shape,d)-(sammyCalIsLocal(d)?0:Number(ref.core[d.key]??.5)));out[m.id]=Number(v.toFixed(4))}return out}
function sammyCalPairKey(pair){return `${pair.a}__X__${pair.b}`}
function sammyCalScreenReference(run,pair,slot=0){const a=sammyCalDescriptor(run,pair.a),b=sammyCalDescriptor(run,pair.b),breast=[a,b].some(d=>d?.category==="breast"||["cupsize","firmness"].includes(d?.key)),first=breast?(sammyCalRef(run,"female_avg")||run.references[1]||run.references[0]):(sammyCalRef(run,"male_avg")||run.references[0]);if(slot===0)return first;const alt=first?.id==="female_avg"?(sammyCalRef(run,"male_avg")||run.references[0]):(sammyCalRef(run,"female_avg")||run.references[1]||run.references[0]);return alt||first}
function sammyCalScreenValues(a,b,combo=0){if(combo%2===0)return [sammyCalPairValue(a,true),sammyCalPairValue(b,true)];return [sammyCalPairValue(a,false),sammyCalPairValue(b,true)]}
function sammyCalUpdateScreenSummary(run,pair,ref,aValue,bValue,residuals,maxResidual){const key=sammyCalPairKey(pair),tops=Object.entries(residuals).sort((x,y)=>Math.abs(y[1])-Math.abs(x[1])).slice(0,4).map(([measureId,residualCm])=>({measureId,residualCm})),prev=run.screening.byPair[key];if(!prev||maxResidual>prev.maxResidualCm)run.screening.byPair[key]={a:pair.a,b:pair.b,pairScore:pair.score,shared:pair.shared,maxResidualCm:Number(maxResidual.toFixed(4)),referenceId:ref.id,aValue:Number(aValue.toFixed(6)),bValue:Number(bValue.toFixed(6)),topResiduals:tops};run.screening.screenedCount++}
function sammyCalFinalizeScreening(run){const c=SAMMY_CAL_CONFIG[run.mode],all=Object.values(run.screening.byPair||{}),strong=all.filter(x=>x.maxResidualCm>=c.screenThresholdCm).sort((a,b)=>b.maxResidualCm-a.maxResidualCm||b.pairScore-a.pairScore);run.screening.strongCount=strong.length;run.screening.maxResidualCm=strong.length?strong[0].maxResidualCm:0;run.deepInteractionPairs=strong.slice(0,c.deepMaxPairs).map(x=>({a:x.a,b:x.b,score:x.pairScore,shared:x.shared,screenResidualCm:x.maxResidualCm}));run.screening.deepSelectedCount=run.deepInteractionPairs.length}
let sammyCalPrimeCache=[2];function sammyCalPrime(n){while(sammyCalPrimeCache.length<=n){let x=sammyCalPrimeCache.at(-1)+1;for(;;x++){let ok=true;for(const p of sammyCalPrimeCache){if(p*p>x)break;if(x%p===0){ok=false;break}}if(ok){sammyCalPrimeCache.push(x);break}}}return sammyCalPrimeCache[n]}
function sammyCalHalton(index,dim){let n=index+1,b=sammyCalPrime(dim),f=1,r=0;while(n>0){f/=b;r+=f*(n%b);n=Math.floor(n/b)}return r}
function sammyCalGlobalShape(run,index,validation=false){const sex=index%2,shape=sammyCalMakeShape({core:sammyCalCoreDefaults(sex)}),q=(d)=>sammyCalHalton(index+(validation?100003:0),d);shape.core.gender=sex;shape.core.age=SAMMY_ADULT_SHAPE_AGE_MIN+(SAMMY_ADULT_SHAPE_AGE_MAX-SAMMY_ADULT_SHAPE_AGE_MIN)*q(0);shape.core.height=.04+.92*q(1);shape.core.weight=.04+.92*q(2);shape.core.muscle=.04+.92*q(3);shape.core.proportions=.04+.92*q(4);shape.core.cupsize=sex?(.04+.92*q(5)):.5;const relevant=run.relevantSliderIds.map(id=>sammyCalDescriptor(run,id)).filter(d=>sammyCalIsLocal(d)),cfg=SAMMY_CAL_CONFIG[run.mode],k=Math.min(cfg.localPerGlobal,relevant.length);if(relevant.length)for(let j=0;j<k;j++){const ix=(index*17+j*31)%relevant.length,d=relevant[ix],v=(q(12+j*2)*2-1)*cfg.localAmp;sammyCalSetSlider(shape,d,v)}return shape}
function sammyCalPredictGlobal(run,shape){const ref=shape.core.gender>=.5?sammyCalRef(run,"female_avg"):sammyCalRef(run,"male_avg"),base=run.referenceMeasures[ref?.id];if(!ref||!base)return null;const out={};for(const m of SAMMY_MEASURE_DEFS){let v=base[m.id];if(!Number.isFinite(v)){out[m.id]=null;continue}for(const id of run.relevantSliderIds){const d=sammyCalDescriptor(run,id);if(!d)continue;const delta=sammyCalSliderValue(shape,d)-(sammyCalIsLocal(d)?0:Number(ref.core[d.key]??.5));if(Math.abs(delta)>1e-8)v+=sammyCalSlope(run,id,m.id)*delta}out[m.id]=Number(v.toFixed(4))}return out}
function sammyCalUpdateValidation(run,actual,pred){if(!pred)return;for(const m of SAMMY_MEASURE_DEFS){const a=actual[m.id],p=pred[m.id];if(!Number.isFinite(a)||!Number.isFinite(p))continue;const e=a-p;run.validation.sumSq[m.id]=(run.validation.sumSq[m.id]||0)+e*e;run.validation.count[m.id]=(run.validation.count[m.id]||0)+1;run.validation.overallSumSq+=e*e;run.validation.overallCount++}}
function sammyCalFinalizeValidation(run){run.validation.rmseByMeasure={};for(const m of SAMMY_MEASURE_DEFS){const n=run.validation.count[m.id]||0;if(n)run.validation.rmseByMeasure[m.id]=Number(Math.sqrt(run.validation.sumSq[m.id]/n).toFixed(4))}run.validation.overallRmseCm=run.validation.overallCount?Number(Math.sqrt(run.validation.overallSumSq/run.validation.overallCount).toFixed(4)):null}
function sammyCalAdvance(run,stage){run.stage=stage;run.cursor=0}
async function sammyCalRecord(run,stage,cursor,detail,shape,results,extra={},compact=false){const rec={schema:"sammy-calibration-record-v2",id:`${run.runId}:${stage}:${String(cursor).padStart(7,"0")}`,runId:run.runId,ordinal:run.ordinal++,stage,cursor,time:new Date().toISOString(),detail,shape:sammyCalSparseShape(shape),...(compact?{}:{measures:sammyCalMeasureObject(results)}),...extra};await sammyCalPutRecord(rec);return rec}
async function sammyCalStepReference(run){const ref=run.references[run.cursor],shape=sammyCalMakeShape(ref),results=await sammyCalApplyShape(shape),mo=sammyCalMeasureObject(results);run.referenceMeasures[ref.id]=mo;sammyCalLiveReadout(results,`Referenz · ${ref.label}`);await sammyCalRecord(run,"reference",run.cursor,ref.label,shape,results,{referenceId:ref.id});run.cursor++;if(run.cursor>=run.references.length)sammyCalAdvance(run,"single")}
async function sammyCalStepSingle(run){const c=SAMMY_CAL_CONFIG[run.mode],perSlider=run.references.length*c.levels,si=Math.floor(run.cursor/perSlider),rem=run.cursor%perSlider,ri=Math.floor(rem/c.levels),li=rem%c.levels,d=run.sliders[si],ref=run.references[ri],levels=sammyCalLevels(d,c.levels),value=levels[li],shape=sammyCalSetSlider(sammyCalMakeShape(ref),d,value),results=await sammyCalApplyShape(shape),mo=sammyCalMeasureObject(results),detail=`${d.label} · ${value.toFixed(3)} · ${ref.label}`;sammyCalUpdateEffects(run,d,ref,shape,mo);sammyCalLiveReadout(results,detail);await sammyCalRecord(run,"single",run.cursor,detail,shape,results,{sliderId:d.id,sliderMembers:d.keys||[d.key],value:Number(value.toFixed(6)),referenceId:ref.id});run.cursor++;if(run.cursor>=run.sliders.length*run.references.length*c.levels)sammyCalAdvance(run,"analysis")}
async function sammyCalStepAnalysis(run){sammyCalAnalyze(run);run.cursor=1;sammyCalStatus(`Logische Slider ${run.analysis.logicalSliderCount} · relevant ${run.analysis.relevantCount} · Paar-Screen ${run.analysis.pairCandidatesScreenTarget}/${run.analysis.pairCandidatesTotal}`);await sammyCalPutRun(run);sammyCalAdvance(run,"screen")}
async function sammyCalStepScreen(run){const c=SAMMY_CAL_CONFIG[run.mode],perPair=Math.max(1,c.screenRefs)*Math.max(1,c.screenCombos),pi=Math.floor(run.cursor/perPair),rem=run.cursor%perPair,refSlot=Math.floor(rem/Math.max(1,c.screenCombos)),combo=rem%Math.max(1,c.screenCombos),pair=run.candidatePairs[pi],a=sammyCalDescriptor(run,pair.a),b=sammyCalDescriptor(run,pair.b),ref=sammyCalScreenReference(run,pair,refSlot),shape=sammyCalMakeShape(ref),vals=sammyCalScreenValues(a,b,combo);sammyCalSetSlider(shape,a,vals[0]);sammyCalSetSlider(shape,b,vals[1]);const results=await sammyCalApplyShape(shape),actual=sammyCalMeasureObject(results),pred=sammyCalPredictTwo(run,ref,a,b,shape),residuals={};let maxResidual=0;for(const m of SAMMY_MEASURE_DEFS){if(Number.isFinite(actual[m.id])&&Number.isFinite(pred[m.id])){const e=actual[m.id]-pred[m.id];residuals[m.id]=Number(e.toFixed(4));maxResidual=Math.max(maxResidual,Math.abs(e))}}sammyCalUpdateScreenSummary(run,pair,ref,vals[0],vals[1],residuals,maxResidual);const detail=`SCREEN · ${a.label} × ${b.label} · Δmax ${maxResidual.toFixed(2)} cm`;sammyCalLiveReadout(results,detail);const tops=Object.entries(residuals).sort((x,y)=>Math.abs(y[1])-Math.abs(x[1])).slice(0,4).map(([measureId,residualCm])=>({measureId,residualCm}));await sammyCalRecord(run,"screen",run.cursor,detail,shape,results,{pair:{a:a.id,b:b.id,aValue:vals[0],bValue:vals[1],score:pair.score},referenceId:ref.id,maxResidualCm:Number(maxResidual.toFixed(4)),topResiduals:tops},true);run.cursor++;if(run.cursor>=run.candidatePairs.length*perPair){sammyCalFinalizeScreening(run);sammyCalAdvance(run,"interaction")}}
async function sammyCalStepInteraction(run){const c=SAMMY_CAL_CONFIG[run.mode],refs=run.references.slice(0,Math.min(c.interactionRefs,run.references.length)),perPair=refs.length*4,pi=Math.floor(run.cursor/perPair),rem=run.cursor%perPair,ri=Math.floor(rem/4),combo=rem%4,pair=run.deepInteractionPairs[pi],a=sammyCalDescriptor(run,pair.a),b=sammyCalDescriptor(run,pair.b),ref=refs[ri],shape=sammyCalMakeShape(ref),av=sammyCalPairValue(a,combo>=2),bv=sammyCalPairValue(b,combo%2===1);sammyCalSetSlider(shape,a,av);sammyCalSetSlider(shape,b,bv);const results=await sammyCalApplyShape(shape),actual=sammyCalMeasureObject(results),pred=sammyCalPredictTwo(run,ref,a,b,shape),residuals={};let maxResidual=0;for(const m of SAMMY_MEASURE_DEFS){if(Number.isFinite(actual[m.id])&&Number.isFinite(pred[m.id])){const e=actual[m.id]-pred[m.id];residuals[m.id]=Number(e.toFixed(4));maxResidual=Math.max(maxResidual,Math.abs(e))}}const detail=`DEEP · ${a.label} × ${b.label} · ${ref.label}`;sammyCalLiveReadout(results,detail);await sammyCalRecord(run,"interaction",run.cursor,detail,shape,results,{pair:{a:a.id,b:b.id,aValue:av,bValue:bv,score:pair.score,screenResidualCm:pair.screenResidualCm},referenceId:ref.id,additiveResidualCm:residuals,maxResidualCm:Number(maxResidual.toFixed(4))});run.cursor++;if(run.cursor>=run.deepInteractionPairs.length*refs.length*4)sammyCalAdvance(run,"global")}
async function sammyCalStepGlobal(run){const shape=sammyCalGlobalShape(run,run.cursor,false),results=await sammyCalApplyShape(shape),detail=`Global sample ${run.cursor+1}`;sammyCalLiveReadout(results,detail);await sammyCalRecord(run,"global",run.cursor,detail,shape,results,{sampling:"deterministic Halton core + sparse relevant logical-local subset; L/R groups applied symmetrically"});run.cursor++;if(run.cursor>=SAMMY_CAL_CONFIG[run.mode].globalSamples)sammyCalAdvance(run,"validation")}
async function sammyCalStepValidation(run){const shape=sammyCalGlobalShape(run,run.cursor,true),pred=sammyCalPredictGlobal(run,shape),results=await sammyCalApplyShape(shape),actual=sammyCalMeasureObject(results);sammyCalUpdateValidation(run,actual,pred);const detail=`Validation ${run.cursor+1}`;sammyCalLiveReadout(results,detail);await sammyCalRecord(run,"validation",run.cursor,detail,shape,results,{predictedMeasures:pred});run.cursor++;if(run.cursor>=SAMMY_CAL_CONFIG[run.mode].validationSamples){sammyCalFinalizeValidation(run);sammyCalAdvance(run,"complete");run.completedAt=new Date().toISOString()}}
async function sammyCalRunner(){const run=sammyCalibration.run;if(!run)return;sammyCalibration.running=true;sammyCalibration.paused=false;sammyCalibration.cancelRequested=false;sammyCalStatus("Calibration startet …");try{while(sammyCalibration.running&&!sammyCalibration.paused&&!sammyCalibration.cancelRequested&&run.stage!=="complete"){if(run.stage==="reference")await sammyCalStepReference(run);else if(run.stage==="single")await sammyCalStepSingle(run);else if(run.stage==="analysis")await sammyCalStepAnalysis(run);else if(run.stage==="screen"){if(!run.candidatePairs?.length){sammyCalFinalizeScreening(run);sammyCalAdvance(run,"global")}else await sammyCalStepScreen(run)}else if(run.stage==="interaction"){if(!run.deepInteractionPairs?.length)sammyCalAdvance(run,"global");else await sammyCalStepInteraction(run)}else if(run.stage==="global")await sammyCalStepGlobal(run);else if(run.stage==="validation")await sammyCalStepValidation(run);else throw new Error(`Unbekannte Calibration-Stufe ${run.stage}`);await sammyCalPutRun(run);sammyCalStatus()}if(run.stage==="complete"){sammyCalibration.running=false;sammyCalibration.lastRun=run;sammyCalStatus(`Fertig · additive Validierungs-RMSE ${run.validation?.overallRmseCm??"—"} cm`);const cur=$("#sammyCalibrationCurrent");if(cur)cur.textContent=`Calibration abgeschlossen · ${run.ordinal} Tests · ${run.analysis?.relevantCount??0} relevante logische Slider · ${run.screening?.strongCount??0} nichtlineare Paare · RMSE ${run.validation?.overallRmseCm??"—"} cm`}}catch(e){console.error("Calibration Lab",e);sammyCalibration.running=false;sammyCalibration.paused=true;sammyCalStatus(`FEHLER: ${e?.message||e}`);sammyReportError?.(e,{source:"Calibration Lab"})}finally{sammyCalibration.running=false;sammyCalStatus()}}
async function sammyCalStartOrResume(){if(sammyCalibration.running)return;if(typeof sammySolverLab!=="undefined"&&sammySolverLab?.running){sammyCalStatus("Solver Lab läuft noch · zuerst pausieren.");return}if(!annyPackLoaded){sammyCalStatus("Anny-Pack ist noch nicht bereit.");return}if(!sammyMeasureSession){sammyCalStatus("MEAS zuerst öffnen.");return}let run=sammyCalibration.run;if(!run||run.stage==="complete"){run=sammyCalNewRun(sammyCalibration.mode);sammyCalibration.run=run;await sammyCalPutRun(run)}sammyCalibration.paused=false;sammyCalibration.cancelRequested=false;sammyCalRunner()}
function sammyCalPause(){if(!sammyCalibration.running)return;sammyCalibration.paused=true;sammyCalibration.running=false;sammyCalStatus("Pausiert · Fortschritt ist gespeichert.")}
async function sammyCalReset(){if(sammyCalibration.running){sammyCalStatus("Bitte den Lauf zuerst pausieren.");return}const run=sammyCalibration.run||sammyCalibration.lastRun;if(run)await sammyCalDeleteRun(run.runId);sammyCalibration.run=null;sammyCalibration.lastRun=null;sammyCalStatus("Calibration-Lauf gelöscht. Bereit für einen neuen Lauf.")}
function sammyCalSetMode(mode){if(!SAMMY_CAL_CONFIG[mode]||sammyCalibration.running)return;sammyCalibration.mode=mode;document.querySelectorAll("[data-cal-mode]").forEach(b=>b.classList.toggle("active",b.dataset.calMode===mode));sammyCalStatus(`Modus ${SAMMY_CAL_CONFIG[mode].label}`)}
function sammyCalToggleTurbo(){sammyCalibration.turbo=!sammyCalibration.turbo;const b=$("#sammyCalibrationTurbo");if(b){b.classList.toggle("active",sammyCalibration.turbo);b.textContent=sammyCalibration.turbo?"Turbo AN":"LIVE · Standard"}}
async function sammyCalLoadLatest(){try{const runs=(await sammyCalGetRuns()).sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)));const active=runs.find(r=>r.stage!=="complete")||runs[0]||null;sammyCalibration.run=active;sammyCalibration.lastRun=active;if(active){sammyCalibration.mode=active.mode||"standard";document.querySelectorAll("[data-cal-mode]").forEach(b=>b.classList.toggle("active",b.dataset.calMode===sammyCalibration.mode));sammyCalStatus(active.stage==="complete"?"Letzter Lauf ist abgeschlossen.":"Gespeicherter Lauf kann fortgesetzt werden.")}else sammyCalStatus()}catch(e){console.warn("Calibration resume",e)}}
function sammyCalSummary(run){return {schema:"sammy-calibration-summary-v2",runId:run.runId,appVersion:run.appVersion,mode:run.mode,createdAt:run.createdAt,completedAt:run.completedAt||null,totalRecords:run.ordinal,measureCount:SAMMY_MEASURE_DEFS.length,sliderCounts:{rawAnnyLocal:run.analysis?.rawAnnyLocalCount??null,logicalAll:run.analysis?.logicalAllCount??run.solverPolicy?.logicalAll??null,solverWhitelist:run.analysis?.logicalSliderCount??run.sliders?.length??null,solverExcluded:run.analysis?.solverExcludedCount??null,logicalPairedLR:run.analysis?.pairedLogicalCount??null,relevant:run.analysis?.relevantCount??null},solverPolicy:run.solverPolicy||null,analysis:run.analysis||null,screening:run.screening?{thresholdCm:run.screening.thresholdCm,screenedCount:run.screening.screenedCount,strongCount:run.screening.strongCount,deepSelectedCount:run.screening.deepSelectedCount,maxResidualCm:run.screening.maxResidualCm,topStrong:Object.values(run.screening.byPair||{}).filter(x=>x.maxResidualCm>=run.screening.thresholdCm).sort((a,b)=>b.maxResidualCm-a.maxResidualCm).slice(0,120)}:null,deepInteractionPairs:run.deepInteractionPairs||[],validation:run.validation||null,notes:run.notes||{}}}
async function sammyCalExport(summaryOnly=false){const run=sammyCalibration.run||sammyCalibration.lastRun;if(!run){sammyCalStatus("Kein Calibration-Lauf zum Exportieren.");return}sammyCalStatus(summaryOnly?"Summary JSON wird erstellt …":"FULL JSON wird zusammengestellt …");const summary=sammyCalSummary(run),base={schema:SAMMY_CAL_SCHEMA,app:"Sammy",version:"0.8.7",generated:new Date().toISOString(),interpretation:{purpose:"Morph/Slider → Körpermaß-Kalibrierung für den späteren inversen Sammy Body Solver",rawSliderUnits:{core:"0..1; age/shapeAge 0.70..1.00",logicalLocal:"-1..1; L/R-Paare werden gleichzeitig gesetzt",measurements:"cm"},stages:{reference:"Referenzkörper",single:"logische Einzelslider",analysis:"Relevanz, Redundanz und Paarselektion",screen:"günstiger Test aller plausiblen Paar-Kandidaten",interaction:"tiefer Rastertest nur für nicht-additive Paare",global:"mehrdimensionale Körperstichprobe",validation:"additives Basismodell gegen unbekannte Körper",complete:"Lauf abgeschlossen"},note:"ANSUR folgt erst nach dieser Morph-Kalibrierung. Brusthöhe nutzt Annys nipple-point/nipple-size Morph-Topologie; ANSUR-Taillenhöhe nutzt Navel-Morph-Vertices; Crotch Height nutzt Bulge-Morph-Vertices. Der vorhandene v0.8.4 Deep-Datensatz bleibt als Solver-Kalibrierbasis gültig; die Landmark-Änderungen sind semantische Konsistenzkorrekturen. Calibration v0.8.7 nutzt zusätzlich eine aus Quick+Deep abgeleitete Solver-Whitelist: irrelevante Regionen, Manual/Special-Parameter und sichere Redundanzen werden nicht mehr gescannt."},summary,measureDefinitions:SAMMY_MEASURE_DEFS.map(d=>({id:d.id,label:d.label,ansur:d.ansur,kind:d.kind,section:d.section||null,group:d.group||null,internal:!!d.internal,autoSearch:d.autoSearch||null,dynamicRule:d.dynamicRule||null}))};let payload;if(summaryOnly)payload=base;else{const records=await sammyCalGetRecords(run.runId);payload={...base,run,measureCalibration:JSON.parse(JSON.stringify(sammyMeasureLoadCalibration())),records}}const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=summaryOnly?`Sammy_Calibration_Summary_${run.mode}_${run.runId}.json`:`Sammy_Calibration_FULL_${run.mode}_${run.runId}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500);sammyCalStatus(summaryOnly?"Summary exportiert.":`FULL Export · ${payload.records.length} Records`)}
function sammyCalInitUI(){document.querySelectorAll("[data-cal-mode]").forEach(b=>b.onclick=()=>sammyCalSetMode(b.dataset.calMode));const start=$("#sammyCalibrationStart"),pause=$("#sammyCalibrationPause"),reset=$("#sammyCalibrationReset"),exp=$("#sammyCalibrationExport"),sum=$("#sammyCalibrationSummaryExport"),turbo=$("#sammyCalibrationTurbo");if(start)start.onclick=sammyCalStartOrResume;if(pause)pause.onclick=sammyCalPause;if(reset)reset.onclick=sammyCalReset;if(exp)exp.onclick=()=>sammyCalExport(false);if(sum)sum.onclick=()=>sammyCalExport(true);if(turbo)turbo.onclick=sammyCalToggleTurbo;sammyCalSetMode("standard");sammyCalLoadLatest()}

// -----------------------------------------------------------------------------
// Sammy v0.8.9 PRODUCTION SOLVER R4 (R2 retained as source model)
// Reuses the completed Calibration Lab Deep dataset. No recalibration required.
// Benchmarks additive / single-slider quadratic / measured pair interaction /
// global residual ridge models, then tests inverse reconstruction offline and
// finally against the real current mesh with a small number of truth passes.
// -----------------------------------------------------------------------------
const SAMMY_SOLVER_DB="sammy-solver-lab-v087",SAMMY_SOLVER_DB_VERSION=1,SAMMY_SOLVER_RUN_STORE="runs",SAMMY_SOLVER_RECORD_STORE="records";
const SAMMY_SOLVER_SCHEMA="sammy-solver-lab-v2";
const SAMMY_SOLVER_CONFIG={
 quick:{label:"Quick",deltaSamples:120,forwardTargets:180,inverseTargets:70,truthTargets:6,truthPasses:2,inverseIterations:12,liveDelay:45,ridgeLambda:1,deltaRidgeLambda:.45},
 standard:{label:"Standard",deltaSamples:300,forwardTargets:500,inverseTargets:250,truthTargets:24,truthPasses:3,inverseIterations:18,liveDelay:55,ridgeLambda:1,deltaRidgeLambda:.55},
 deep:{label:"Deep",deltaSamples:600,forwardTargets:null,inverseTargets:null,truthTargets:60,truthPasses:4,inverseIterations:24,liveDelay:60,ridgeLambda:1,deltaRidgeLambda:.65}
};
const SAMMY_SOLVER_LOW_WEIGHT_MEASURES=new Set(["wrist_circumference","calf_circumference","ankle_circumference","tibiale_height"]);
let sammySolverDBPromise=null,sammySolverRuntimeCache=null;
let sammySolverLab={mode:"standard",running:false,paused:false,cancelRequested:false,run:null,lastRun:null};
function sammySolverOpenDB(){if(sammySolverDBPromise)return sammySolverDBPromise;sammySolverDBPromise=new Promise((resolve,reject)=>{const q=indexedDB.open(SAMMY_SOLVER_DB,SAMMY_SOLVER_DB_VERSION);q.onupgradeneeded=()=>{const db=q.result;if(!db.objectStoreNames.contains(SAMMY_SOLVER_RUN_STORE))db.createObjectStore(SAMMY_SOLVER_RUN_STORE,{keyPath:"runId"});if(!db.objectStoreNames.contains(SAMMY_SOLVER_RECORD_STORE)){const st=db.createObjectStore(SAMMY_SOLVER_RECORD_STORE,{keyPath:"id"});st.createIndex("runId","runId",{unique:false})}};q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error||new Error("Solver-DB konnte nicht geöffnet werden"))});return sammySolverDBPromise}
async function sammySolverPutRun(run){run.updatedAt=new Date().toISOString();const db=await sammySolverOpenDB();return new Promise((resolve,reject)=>{const tx=db.transaction(SAMMY_SOLVER_RUN_STORE,"readwrite");tx.objectStore(SAMMY_SOLVER_RUN_STORE).put(run);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error||new Error("Solver-Run speichern fehlgeschlagen"))})}
async function sammySolverPutRecord(rec){const db=await sammySolverOpenDB();return new Promise((resolve,reject)=>{const tx=db.transaction(SAMMY_SOLVER_RECORD_STORE,"readwrite");tx.objectStore(SAMMY_SOLVER_RECORD_STORE).put(rec);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error||new Error("Solver-Record speichern fehlgeschlagen"))})}
async function sammySolverRecord(run,stage,detail,extra={}){const rec={schema:"sammy-solver-record-v1",id:`${run.runId}:${String(run.ordinal).padStart(7,"0")}`,runId:run.runId,ordinal:run.ordinal++,stage,time:new Date().toISOString(),detail,...extra};await sammySolverPutRecord(rec);return rec}
async function sammySolverGetRuns(){const db=await sammySolverOpenDB();return new Promise((resolve,reject)=>{const tx=db.transaction(SAMMY_SOLVER_RUN_STORE,"readonly"),q=tx.objectStore(SAMMY_SOLVER_RUN_STORE).getAll();q.onsuccess=()=>resolve(q.result||[]);q.onerror=()=>reject(q.error)})}
async function sammySolverGetRecords(runId){const db=await sammySolverOpenDB();return new Promise((resolve,reject)=>{const tx=db.transaction(SAMMY_SOLVER_RECORD_STORE,"readonly"),q=tx.objectStore(SAMMY_SOLVER_RECORD_STORE).index("runId").getAll(IDBKeyRange.only(runId));q.onsuccess=()=>resolve((q.result||[]).sort((a,b)=>(a.ordinal||0)-(b.ordinal||0)));q.onerror=()=>reject(q.error)})}
async function sammySolverDeleteRun(runId){const db=await sammySolverOpenDB();await new Promise((resolve,reject)=>{const tx=db.transaction([SAMMY_SOLVER_RUN_STORE,SAMMY_SOLVER_RECORD_STORE],"readwrite"),rs=tx.objectStore(SAMMY_SOLVER_RUN_STORE),st=tx.objectStore(SAMMY_SOLVER_RECORD_STORE),idx=st.index("runId");rs.delete(runId);const q=idx.openKeyCursor(IDBKeyRange.only(runId));q.onsuccess=()=>{const c=q.result;if(c){st.delete(c.primaryKey);c.continue()}};tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)});sammySolverRuntimeCache=null}
function sammySolverRunId(){return `solver-${new Date().toISOString().replace(/[:.]/g,"-")}-${Math.random().toString(36).slice(2,7)}`}
async function sammySolverEachCalRecord(runId,stage,fn){const db=await sammyCalOpenDB();return new Promise((resolve,reject)=>{let matched=0;const tx=db.transaction(SAMMY_CAL_RECORD_STORE,"readonly"),idx=tx.objectStore(SAMMY_CAL_RECORD_STORE).index("runId"),q=idx.openCursor(IDBKeyRange.only(runId));q.onsuccess=()=>{const c=q.result;if(!c){resolve(matched);return}const r=c.value;if(!stage||r.stage===stage){try{fn(r,matched);matched++}catch(e){reject(e);return}}c.continue()};q.onerror=()=>reject(q.error||new Error("Calibration-Records lesen fehlgeschlagen"));tx.onerror=()=>reject(tx.error||new Error("Calibration-Records lesen fehlgeschlagen"))})}
async function sammySolverFindCalibration(){const runs=(await sammyCalGetRuns()).filter(r=>r?.stage==="complete"&&Array.isArray(r.sliders)&&r.sliders.length>0);runs.sort((a,b)=>{const ma=a.mode==="deep"?3:a.mode==="standard"?2:1,mb=b.mode==="deep"?3:b.mode==="standard"?2:1;if(mb!==ma)return mb-ma;const oa=Number(a.ordinal||0),ob=Number(b.ordinal||0);if(ob!==oa)return ob-oa;return String(b.completedAt||b.updatedAt||"").localeCompare(String(a.completedAt||a.updatedAt||""))});return runs[0]||null}
function sammySolverStageLabel(stage){return ({delta:"0 · Landmark Delta",deltaFit:"1 · Delta-Modell",model:"2 · Modellauf",forward:"3 · Forward Benchmark",inverse:"4 · Inverse Solver",sync:"5 · Delta Check",truth:"6 · Mesh Reality Check",productionPrep:"0 · R5 Profil",productionOffline:"1 · R5 Offline Precheck",productionTruth:"2 · R5 Real-Mesh Guard",complete:"3 · Fertig"})[stage]||stage}
function sammySolverStageTotal(run){const c=SAMMY_SOLVER_CONFIG[run?.mode||sammySolverLab.mode];if(!run)return 1;if(run.schema===SAMMY_PRODUCTION_SCHEMA){if(run.stage==="productionPrep")return 1;if(run.stage==="productionOffline")return run.inverseTargetCount||0;if(run.stage==="productionTruth")return run.truthTargetIndices?.length||0;return 1}if(run.stage==="delta")return c.deltaSamples;if(run.stage==="deltaFit")return 1;if(run.stage==="model")return 4;if(run.stage==="forward")return run.forwardTargetCount||0;if(run.stage==="inverse")return run.inverseTargetCount||0;if(run.stage==="sync")return 2;if(run.stage==="truth")return (run.truthTargetIndices?.length||0)*(1+c.truthPasses);return 1}
function sammySolverStatus(detail=""){const run=sammySolverLab.run||sammySolverLab.lastRun,st=$("#sammySolverStatus"),bar=$("#sammySolverProgressBar"),cur=$("#sammySolverCurrent"),start=$("#sammySolverStart"),pause=$("#sammySolverPause"),reset=$("#sammySolverReset");if(run){const total=sammySolverStageTotal(run),cursor=Number(run.cursor||0),p=total?Math.min(1,cursor/total):0;if(st)st.textContent=`${sammySolverStageLabel(run.stage)} · ${Math.min(cursor,total)} / ${total}${sammySolverLab.paused?" · PAUSE":""}`;if(bar)bar.style.width=`${(p*100).toFixed(1)}%`}else{if(st)st.textContent="Bereit · benötigt einen abgeschlossenen Solver-R2-Lauf.";if(bar)bar.style.width="0%"}if(cur&&detail)cur.textContent=detail;if(start){start.disabled=sammySolverLab.running;start.textContent=sammySolverLab.running?"Läuft …":(run&&run.stage!=="complete"?"Fortsetzen":"Neuer Production-Test")}if(pause)pause.disabled=!sammySolverLab.running;if(reset)reset.disabled=sammySolverLab.running}
function sammySolverLive(text,rows=[]){const el=$("#sammySolverLive");if(!el)return;el.innerHTML=`<b>${escapeHtml(text||"SOLVER")}</b>`+rows.map(([a,b])=>`<span>${escapeHtml(a)} <strong>${escapeHtml(String(b))}</strong></span>`).join("")}
function sammySolverSetMode(mode){if(!SAMMY_SOLVER_CONFIG[mode]||sammySolverLab.running)return;sammySolverLab.mode=mode;document.querySelectorAll("[data-solver-mode]").forEach(b=>b.classList.toggle("active",b.dataset.solverMode===mode));sammySolverStatus(`Modus ${SAMMY_SOLVER_CONFIG[mode].label} · R4: erst maximaler Fit, dann Nullraum-Cleanup ohne den Fit zu verlieren`)}
function sammySolverMeasureWeights(measureIds){return measureIds.map(id=>SAMMY_SOLVER_LOW_WEIGHT_MEASURES.has(id)?.25:1)}
function sammySolverShapeLocalMap(shape){return Array.isArray(shape?.local)?Object.fromEntries(shape.local):{...(shape?.local||{})}}
function sammySolverShapeValue(shape,d,localMap=null){if(d.kind==="core")return Number(shape?.core?.[d.key]??.5);const lm=localMap||sammySolverShapeLocalMap(shape);if(d.kind==="localGroup"){const ks=d.keys||[],vs=ks.map(k=>Number(lm[k]||0));return vs.length?vs.reduce((a,b)=>a+b,0)/vs.length:0}return Number(lm[d.key]||0)}
function sammySolverRefValue(ref,d){return d.kind==="core"?Number(ref?.core?.[d.key]??.5):0}
function sammySolverDeltas(shape,model,sexOverride=null){const sex=sexOverride==null?(Number(shape?.core?.gender||0)>=.5?1:0):sexOverride,ref=model.refs[sex?"female_avg":"male_avg"],lm=sammySolverShapeLocalMap(shape),out=new Float64Array(model.n);for(let i=0;i<model.n;i++)out[i]=sammySolverShapeValue(shape,model.sliderDefs[i],lm)-sammySolverRefValue(ref,model.sliderDefs[i]);return out}
function sammySolverBaseArray(model,sex){return model.referenceMeasures[sex?"female_avg":"male_avg"]}
function sammySolverAdditive(model,ds,sex,baseAdjust=null){const out=Float64Array.from(sammySolverBaseArray(model,sex));for(let i=0;i<model.n;i++){const x=ds[i];if(Math.abs(x)<1e-12)continue;const off=i*model.m;for(let j=0;j<model.m;j++)out[j]+=model.linear[off+j]*x}if(baseAdjust)for(let j=0;j<model.m;j++)out[j]+=Number(baseAdjust[j]||0);return out}
function sammySolverQuadratic(model,ds,sex,baseAdjust=null){const out=sammySolverAdditive(model,ds,sex,baseAdjust);for(let i=0;i<model.n;i++){const x=ds[i]*ds[i];if(x<1e-14)continue;const off=i*model.m;for(let j=0;j<model.m;j++)out[j]+=model.quadratic[off+j]*x}return out}
function sammySolverPairPrediction(model,ds,sex,baseAdjust=null){const out=sammySolverQuadratic(model,ds,sex,baseAdjust);for(const p of model.pairs){const x=ds[p.i]*ds[p.j];if(Math.abs(x)<1e-14)continue;const k=p.k;for(let j=0;j<model.m;j++)out[j]+=k[j]*x}return out}
function sammySolverFeatures(model,ds){const f=new Float64Array(model.featureCount);f[0]=1;for(let i=0;i<model.n;i++)f[1+i]=ds[i];let off=1+model.n;const z=model.coreFeatureIndices.map(i=>ds[i]);for(let i=0;i<z.length;i++)f[off++]=z[i]*z[i];for(let i=0;i<z.length;i++)for(let j=i+1;j<z.length;j++)f[off++]=z[i]*z[j];return f}
function sammySolverFinalPrediction(model,ds,sex,baseAdjust=null){const out=sammySolverQuadratic(model,ds,sex,baseAdjust),f=sammySolverFeatures(model,ds),B=sex?model.ridgeFemale:model.ridgeMale;for(let i=0;i<model.featureCount;i++){const x=f[i];if(Math.abs(x)<1e-14)continue;const off=i*model.m;for(let j=0;j<model.m;j++)out[j]+=B[off+j]*x}return out}
function sammySolverJacobian(model,ds,sex){const J=new Float64Array(model.m*model.n),B=sex?model.ridgeFemale:model.ridgeMale;for(let i=0;i<model.n;i++){const off=i*model.m,broff=(1+i)*model.m;for(let j=0;j<model.m;j++)J[j*model.n+i]=model.linear[off+j]+2*ds[i]*model.quadratic[off+j]+B[broff+j]}let row=1+model.n;const z=model.coreFeatureIndices.map(i=>ds[i]);for(let a=0;a<z.length;a++){const si=model.coreFeatureIndices[a],boff=row++*model.m;for(let j=0;j<model.m;j++)J[j*model.n+si]+=2*z[a]*B[boff+j]}for(let a=0;a<z.length;a++)for(let b=a+1;b<z.length;b++){const ia=model.coreFeatureIndices[a],ib=model.coreFeatureIndices[b],boff=row++*model.m;for(let j=0;j<model.m;j++){const q=B[boff+j];J[j*model.n+ia]+=z[b]*q;J[j*model.n+ib]+=z[a]*q}}return J}
function sammySolverCholesky(A,n){const L=new Float64Array(n*n);for(let i=0;i<n;i++)for(let j=0;j<=i;j++){let s=A[i*n+j];for(let k=0;k<j;k++)s-=L[i*n+k]*L[j*n+k];if(i===j){if(!(s>1e-12))s=1e-12;L[i*n+j]=Math.sqrt(s)}else L[i*n+j]=s/L[j*n+j]}return L}
function sammySolverCholeskySolveVec(L,b,n){const y=new Float64Array(n),x=new Float64Array(n);for(let i=0;i<n;i++){let s=b[i];for(let k=0;k<i;k++)s-=L[i*n+k]*y[k];y[i]=s/L[i*n+i]}for(let i=n-1;i>=0;i--){let s=y[i];for(let k=i+1;k<n;k++)s-=L[k*n+i]*x[k];x[i]=s/L[i*n+i]}return x}
function sammySolverCholeskySolveMatrix(A,B,n,rhs){const L=sammySolverCholesky(A,n),out=new Float64Array(n*rhs),v=new Float64Array(n);for(let c=0;c<rhs;c++){for(let r=0;r<n;r++)v[r]=B[r*rhs+c];const x=sammySolverCholeskySolveVec(L,v,n);for(let r=0;r<n;r++)out[r*rhs+c]=x[r]}return out}
function sammySolverRMSE(actual,pred,weights=null){let ss=0,n=0;for(let i=0;i<actual.length;i++){const a=Number(actual[i]),p=Number(pred[i]),w=weights?Number(weights[i]||0):1;if(!Number.isFinite(a)||!Number.isFinite(p)||w<=0)continue;const e=a-p;ss+=w*e*e;n+=w}return n?Math.sqrt(ss/n):Infinity}
function sammySolverMetricNew(modelNames,measureIds){const models={};for(const name of modelNames)models[name]={sumSq:0,count:0,perSumSq:Object.fromEntries(measureIds.map(id=>[id,0])),perCount:Object.fromEntries(measureIds.map(id=>[id,0])),cases:[]};return {models}}
function sammySolverMetricAdd(metric,name,actual,pred,measureIds,caseId){const m=metric.models[name];let ss=0,n=0;for(let i=0;i<measureIds.length;i++){const a=Number(actual[i]),p=Number(pred[i]);if(!Number.isFinite(a)||!Number.isFinite(p))continue;const e=a-p,e2=e*e;m.sumSq+=e2;m.count++;m.perSumSq[measureIds[i]]+=e2;m.perCount[measureIds[i]]++;ss+=e2;n++}m.cases.push({id:caseId,rmseCm:n?Number(Math.sqrt(ss/n).toFixed(4)):null})}
function sammySolverMetricFinalize(metric,measureIds){for(const m of Object.values(metric.models)){m.overallRmseCm=m.count?Number(Math.sqrt(m.sumSq/m.count).toFixed(4)):null;m.rmseByMeasure={};for(const id of measureIds){const n=m.perCount[id]||0;if(n)m.rmseByMeasure[id]=Number(Math.sqrt(m.perSumSq[id]/n).toFixed(4))}m.cases.sort((a,b)=>(b.rmseCm||0)-(a.rmseCm||0));m.worstCases=m.cases.slice(0,20);delete m.cases}return metric}
function sammySolverHydrate(run){if(sammySolverRuntimeCache?.runId===run.runId)return sammySolverRuntimeCache.model;const x=run.model;if(!x)return null;const model={...x,linear:Float64Array.from(x.linear),quadratic:Float64Array.from(x.quadratic),ridgeMale:Float64Array.from(x.ridgeMale),ridgeFemale:Float64Array.from(x.ridgeFemale),referenceMeasures:{male_avg:Float64Array.from(x.referenceMeasures.male_avg),female_avg:Float64Array.from(x.referenceMeasures.female_avg)},pairs:(x.pairs||[]).map(p=>({...p,k:Float64Array.from(p.k)}))};sammySolverRuntimeCache={runId:run.runId,model};return model}
function sammySolverCompactShape(shape){const src=shape?.local||{},local=Array.isArray(src)?src.map(x=>[x[0],Number(x[1])]):Object.entries(src).filter(([,v])=>Math.abs(Number(v)||0)>1e-9).map(([k,v])=>[k,Number(v)]);return {core:{...(shape?.core||{})},local}}
function sammySolverNewRun(mode,calRun){return {schema:SAMMY_SOLVER_SCHEMA,runId:sammySolverRunId(),appVersion:"0.8.7",mode,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),stage:"delta",cursor:0,ordinal:0,calibrationRunId:calRun.runId,calibrationVersion:calRun.appVersion,calibrationMode:calRun.mode,calibrationRecords:Number(calRun.ordinal||0),deltaModel:null,deltaSummary:null,model:null,targets:[],forwardTargetCount:0,inverseTargetCount:0,truthTargetIndices:[],truthSeeds:{},truthState:{},baseAdjust:{male:null,female:null},forward:null,inverse:{sumSq:0,count:0,paramSumSq:0,paramCount:0,cases:[]},truth:{sumSqInitial:0,countInitial:0,sumSqBest:0,countBest:0,perSumSq:{},perCount:{},cases:[]},notes:{source:"completed Calibration Lab run in IndexedDB",deltaStrategy:"measure v0.8.4 legacy waist/crotch and current Navel/Bulge semantics on the same new bodies; learn sex-specific compact ridge correction; apply it mathematically to every old Calibration record before rebuilding the Forward model",modelStrategy:"corrected Calibration records → single-slider linear+quadratic fit → isolated deep-pair bilinear → global residual ridge; final inverse uses corrected globalRidge",inverseStrategy:"gender and age are treated as known context; male cupsize fixed; damped weighted minimum-norm solver with bounds",truthStrategy:"source target and reconstructed body are both measured with current v0.8.7 Nipple/Navel/Bulge landmarks"}}}
function sammySolverReferenceMap(calRun){return Object.fromEntries((calRun.references||[]).map(r=>[r.id,r]))}
function sammySolverMeasuresFromRecord(r,measureIds){return measureIds.map(id=>Number(r.measures?.[id]))}
function sammySolverSelectEven(total,count){if(!total||!count)return[];if(count>=total)return Array.from({length:total},(_,i)=>i);const out=[];for(let i=0;i<count;i++)out.push(Math.min(total-1,Math.round(i*(total-1)/(count-1))));return [...new Set(out)]}

// -----------------------------------------------------------------------------
// v0.8.7 Landmark Delta + Solver R2
// -----------------------------------------------------------------------------
function sammySolverDeltaFeatureBase(calRun){const measureIds=SAMMY_MEASURE_DEFS.map(d=>d.id),sliderDefs=(calRun.sliders||[]).map(d=>({id:d.id,key:d.key,keys:d.keys||null,label:d.label,kind:d.kind,category:d.category,min:d.min,max:d.max})),n=sliderDefs.length,m=measureIds.length,sliderIndex=Object.fromEntries(sliderDefs.map((d,i)=>[d.id,i])),refs=sammySolverReferenceMap(calRun),coreIds=["core:age","core:height","core:weight","core:muscle","core:proportions","core:cupsize"],coreFeatureIndices=coreIds.map(id=>sliderIndex[id]).filter(i=>i!=null),featureCount=1+n+coreFeatureIndices.length+(coreFeatureIndices.length*(coreFeatureIndices.length-1))/2;return {n,m,measureIds,sliderDefs,sliderIndex,refs:{male_avg:refs.male_avg,female_avg:refs.female_avg},coreFeatureIndices,featureCount}}
function sammySolverDeltaRuntime(run){const x=run?.deltaModel;if(!x)return null;return {...x,coeffMale:Float64Array.from(x.coeffMale||[]),coeffFemale:Float64Array.from(x.coeffFemale||[])}}
function sammySolverDeltaPrediction(deltaModel,shape){if(!deltaModel)return new Float64Array(SAMMY_MEASURE_DEFS.length);const sex=Number(shape?.core?.gender||0)>=.5?1:0,ds=sammySolverDeltas(shape,deltaModel,sex),f=sammySolverFeatures(deltaModel,ds),B=sex?deltaModel.coeffFemale:deltaModel.coeffMale,out=new Float64Array(deltaModel.m);for(let i=0;i<deltaModel.featureCount;i++){const q=f[i];if(Math.abs(q)<1e-14)continue;const off=i*deltaModel.m;for(let j=0;j<deltaModel.m;j++)out[j]+=B[off+j]*q}return out}
function sammySolverCorrectMeasureArrayV2(measures,shape,deltaModel,measureIds){const d=sammySolverDeltaPrediction(deltaModel,shape),out=new Float64Array(measureIds.length);for(let j=0;j<measureIds.length;j++)out[j]=Number(measures?.[measureIds[j]])+Number(d[j]||0);return out}
function sammySolverDeltaMeasurePair(){let current,legacy;sammyMeasureLegacyLandmarksForDelta=false;current=sammyComputeAllMeasures();try{sammyMeasureLegacyLandmarksForDelta=true;legacy=sammyComputeAllMeasures()}finally{sammyMeasureLegacyLandmarksForDelta=false;sammyMeasureResultsCache=current}return {current:sammyCalMeasureObject(current),legacy:sammyCalMeasureObject(legacy)}}
async function sammySolverStepDelta(run){const cfg=SAMMY_SOLVER_CONFIG[run.mode],cal=(await sammyCalGetRuns()).find(r=>r.runId===run.calibrationRunId);if(!cal)throw new Error("Quell-Kalibrierung nicht mehr gefunden");const i=run.cursor,shape=sammyCalGlobalShape(cal,500000+i,false);await sammySolverApplyShape(shape);const pair=sammySolverDeltaMeasurePair(),delta={},ids=SAMMY_MEASURE_DEFS.map(d=>d.id);let mx=0,mxId="";for(const id of ids){const v=Number(pair.current[id])-Number(pair.legacy[id]);delta[id]=Number(v.toFixed(5));if(Math.abs(v)>mx){mx=Math.abs(v);mxId=id}}await sammySolverRecord(run,"delta",`Landmark Delta ${i+1}`,{sampleIndex:i,shape:sammySolverCompactShape(shape),legacyMeasures:pair.legacy,currentMeasures:pair.current,deltaCm:delta});sammySolverLive(`Landmark Delta ${i+1}/${cfg.deltaSamples}`,[['größtes Δ',`${mx.toFixed(2)} cm`],['Maß',mxId||'—'],['Semantik','v0.8.4 → Navel/Bulge']]);run.cursor++;if(run.cursor>=cfg.deltaSamples){run.stage="deltaFit";run.cursor=0}}
async function sammySolverFitDelta(run){const cfg=SAMMY_SOLVER_CONFIG[run.mode],cal=(await sammyCalGetRuns()).find(r=>r.runId===run.calibrationRunId);if(!cal)throw new Error("Quell-Kalibrierung nicht mehr gefunden");const base=sammySolverDeltaFeatureBase(cal),records=(await sammySolverGetRecords(run.runId)).filter(r=>r.stage==="delta").sort((a,b)=>(a.sampleIndex||0)-(b.sampleIndex||0)),F=base.featureCount,m=base.m,xtx=[new Float64Array(F*F),new Float64Array(F*F)],xty=[new Float64Array(F*m),new Float64Array(F*m)],mean=[new Float64Array(m),new Float64Array(m)],meanN=[0,0],maxAbs=new Float64Array(m);let train=0,hold=0;for(const r of records){const sex=Number(r.shape?.core?.gender||0)>=.5?1:0,d=base.measureIds.map(id=>Number(r.deltaCm?.[id]||0));for(let j=0;j<m;j++)maxAbs[j]=Math.max(maxAbs[j],Math.abs(d[j]));if((Number(r.sampleIndex)||0)%5===0){hold++;continue}train++;meanN[sex]++;for(let j=0;j<m;j++)mean[sex][j]+=d[j];const ds=sammySolverDeltas(r.shape,base,sex),f=sammySolverFeatures(base,ds),A=xtx[sex],Y=xty[sex];for(let a=0;a<F;a++){const fa=f[a];if(Math.abs(fa)<1e-14)continue;for(let b=0;b<=a;b++){const v=fa*f[b];A[a*F+b]+=v;if(a!==b)A[b*F+a]+=v}const off=a*m;for(let j=0;j<m;j++)Y[off+j]+=fa*d[j]}}for(let s=0;s<2;s++)if(meanN[s])for(let j=0;j<m;j++)mean[s][j]/=meanN[s];const coeff=[];for(let s=0;s<2;s++){const A=xtx[s];for(let i=0;i<F;i++)A[i*F+i]+=i===0?1e-6:cfg.deltaRidgeLambda;coeff[s]=sammySolverCholeskySolveMatrix(A,xty[s],F,m)}const model={schema:"sammy-landmark-delta-model-v1",sourceCalibrationRunId:cal.runId,n:base.n,m,measureIds:base.measureIds,sliderDefs:base.sliderDefs,sliderIndex:base.sliderIndex,refs:base.refs,coreFeatureIndices:base.coreFeatureIndices,featureCount:F,coeffMale:Array.from(coeff[0]),coeffFemale:Array.from(coeff[1]),ridgeLambda:cfg.deltaRidgeLambda,samples:records.length,trainSamples:train,validationSamples:hold};const rt={...model,coeffMale:coeff[0],coeffFemale:coeff[1]},perSS=Object.fromEntries(base.measureIds.map(id=>[id,0])),perN=Object.fromEntries(base.measureIds.map(id=>[id,0]));let ss=0,n=0,ssAffected=0,nAffected=0,ssConst=0,nConst=0;const affected=base.measureIds.filter((id,j)=>maxAbs[j]>.05);for(const r of records){if((Number(r.sampleIndex)||0)%5!==0)continue;const sex=Number(r.shape?.core?.gender||0)>=.5?1:0,p=sammySolverDeltaPrediction(rt,r.shape);for(let j=0;j<m;j++){const a=Number(r.deltaCm?.[base.measureIds[j]]||0),e=a-p[j],e2=e*e;ss+=e2;n++;perSS[base.measureIds[j]]+=e2;perN[base.measureIds[j]]++;if(maxAbs[j]>.05){ssAffected+=e2;nAffected++;const ec=a-mean[sex][j];ssConst+=ec*ec;nConst++}}}const rmseByMeasure={};for(const id of base.measureIds){const q=perN[id]||0;if(q)rmseByMeasure[id]=Number(Math.sqrt(perSS[id]/q).toFixed(4))}run.deltaModel=model;run.deltaSummary={samples:records.length,trainSamples:train,validationSamples:hold,affectedMeasureIds:affected,maxAbsDeltaCm:Object.fromEntries(base.measureIds.map((id,j)=>[id,Number(maxAbs[j].toFixed(4))])),overallRmseCm:n?Number(Math.sqrt(ss/n).toFixed(4)):null,affectedRmseCm:nAffected?Number(Math.sqrt(ssAffected/nAffected).toFixed(4)):null,sexConstantAffectedRmseCm:nConst?Number(Math.sqrt(ssConst/nConst).toFixed(4)):null,rmseByMeasure};sammySolverLive("Landmark-Delta-Modell fertig",[["Samples",records.length],["betroffene Maße",affected.length],["Sex-Konstante",`${run.deltaSummary.sexConstantAffectedRmseCm} cm`],["dynamisches Ridge",`${run.deltaSummary.affectedRmseCm} cm`]]);await sammySolverRecord(run,"delta-fit","Landmark Delta model",{summary:run.deltaSummary,model:{featureCount:F,ridgeLambda:cfg.deltaRidgeLambda}});run.stage="model";run.cursor=0}
async function sammySolverBuildModelV2(run,calRun){const cfg=SAMMY_SOLVER_CONFIG[run.mode],delta=sammySolverDeltaRuntime(run),measureIds=SAMMY_MEASURE_DEFS.map(d=>d.id),sliderDefs=(calRun.sliders||[]).map(d=>({id:d.id,key:d.key,keys:d.keys||null,label:d.label,kind:d.kind,category:d.category,min:d.min,max:d.max})),n=sliderDefs.length,m=measureIds.length,sliderIndex=Object.fromEntries(sliderDefs.map((d,i)=>[d.id,i])),refs=sammySolverReferenceMap(calRun),correctedRefs={};for(const r of calRun.references||[]){const sh={core:{...r.core},local:{}};correctedRefs[r.id]=sammySolverCorrectMeasureArrayV2(calRun.referenceMeasures?.[r.id]||{},sh,delta,measureIds)}const referenceMeasures={male_avg:Array.from(correctedRefs.male_avg),female_avg:Array.from(correctedRefs.female_avg)},sx2=new Float64Array(n),sx3=new Float64Array(n),sx4=new Float64Array(n),b1=new Float64Array(n*m),b2=new Float64Array(n*m);run.cursor=0;sammySolverStatus("Modell 1/4 · korrigierte Einzelslider …");let seenSingle=0;await sammySolverEachCalRecord(calRun.runId,"single",r=>{const i=sliderIndex[r.sliderId];if(i==null)return;const ref=refs[r.referenceId],d=sliderDefs[i],dx=sammySolverShapeValue(r.shape,d)-sammySolverRefValue(ref,d),x2=dx*dx,x3=x2*dx,x4=x2*x2;if(x2<1e-12)return;const y=sammySolverCorrectMeasureArrayV2(r.measures,r.shape,delta,measureIds),base=correctedRefs[r.referenceId];sx2[i]+=x2;sx3[i]+=x3;sx4[i]+=x4;for(let j=0;j<m;j++){const q=y[j]-base[j],o=i*m+j;b1[o]+=dx*q;b2[o]+=x2*q}if(++seenSingle%250===0)sammySolverStatus(`Modell 1/4 · ${seenSingle} korrigierte Single-Records`)});const linear=new Float64Array(n*m),quadratic=new Float64Array(n*m);for(let i=0;i<n;i++){const det=sx2[i]*sx4[i]-sx3[i]*sx3[i];for(let j=0;j<m;j++){const o=i*m+j;if(Math.abs(det)>1e-10){linear[o]=(b1[o]*sx4[i]-b2[o]*sx3[i])/det;quadratic[o]=(b2[o]*sx2[i]-b1[o]*sx3[i])/det}else linear[o]=b1[o]/Math.max(sx2[i],1e-12)}}run.cursor=1;await sammySolverPutRun(run);const deepPairs=calRun.deepInteractionPairs||[],pairIndex=new Map(),pairs=deepPairs.map(p=>({i:sliderIndex[p.a],j:sliderIndex[p.b],a:p.a,b:p.b,num:new Float64Array(m),den:0,k:null,screenResidualCm:Number(p.screenResidualCm||0)})).filter(p=>p.i!=null&&p.j!=null);pairs.forEach((p,i)=>pairIndex.set([p.a,p.b].sort().join("||"),i));sammySolverStatus(`Modell 2/4 · ${pairs.length} korrigierte Paarmodelle …`);let seenPair=0;await sammySolverEachCalRecord(calRun.runId,"interaction",r=>{const key=[r.pair?.a,r.pair?.b].sort().join("||"),pi=pairIndex.get(key),p=pi==null?null:pairs[pi];if(!p)return;const ref=refs[r.referenceId],da=sammySolverShapeValue(r.shape,sliderDefs[p.i])-sammySolverRefValue(ref,sliderDefs[p.i]),db=sammySolverShapeValue(r.shape,sliderDefs[p.j])-sammySolverRefValue(ref,sliderDefs[p.j]),x=da*db;if(Math.abs(x)<1e-12)return;const y=sammySolverCorrectMeasureArrayV2(r.measures,r.shape,delta,measureIds),base=correctedRefs[r.referenceId];for(let j=0;j<m;j++){const oi=p.i*m+j,oj=p.j*m+j,isolated=(y[j]-base[j])-(linear[oi]*da+quadratic[oi]*da*da+linear[oj]*db+quadratic[oj]*db*db);p.num[j]+=x*isolated}p.den+=x*x;if(++seenPair%500===0)sammySolverStatus(`Modell 2/4 · ${seenPair} Interaction-Records`)});for(const p of pairs){const den=Math.max(p.den,1e-12);p.k=Array.from(p.num,v=>v/den);delete p.num;delete p.den}run.cursor=2;await sammySolverPutRun(run);const coreIds=["core:age","core:height","core:weight","core:muscle","core:proportions","core:cupsize"],coreFeatureIndices=coreIds.map(id=>sliderIndex[id]).filter(i=>i!=null),featureCount=1+n+coreFeatureIndices.length+(coreFeatureIndices.length*(coreFeatureIndices.length-1))/2,xtx=[new Float64Array(featureCount*featureCount),new Float64Array(featureCount*featureCount)],xty=[new Float64Array(featureCount*m),new Float64Array(featureCount*m)],tempModel={n,m,measureIds,sliderDefs,sliderIndex,refs:{male_avg:refs.male_avg,female_avg:refs.female_avg},referenceMeasures:{male_avg:Float64Array.from(referenceMeasures.male_avg),female_avg:Float64Array.from(referenceMeasures.female_avg)},linear,quadratic,pairs:[],coreFeatureIndices,featureCount,ridgeMale:new Float64Array(featureCount*m),ridgeFemale:new Float64Array(featureCount*m)};sammySolverStatus("Modell 3/4 · korrigierte 6.000 Global-Samples …");let seenGlobal=0;await sammySolverEachCalRecord(calRun.runId,"global",r=>{const sex=Number(r.shape?.core?.gender||0)>=.5?1:0,ds=sammySolverDeltas(r.shape,tempModel,sex),pred=sammySolverQuadratic(tempModel,ds,sex),actual=sammySolverCorrectMeasureArrayV2(r.measures,r.shape,delta,measureIds),f=sammySolverFeatures(tempModel,ds),A=xtx[sex],Y=xty[sex];for(let a=0;a<featureCount;a++){const fa=f[a];if(Math.abs(fa)<1e-14)continue;for(let b=0;b<=a;b++){const v=fa*f[b];A[a*featureCount+b]+=v;if(a!==b)A[b*featureCount+a]+=v}const off=a*m;for(let j=0;j<m;j++)Y[off+j]+=fa*(actual[j]-pred[j])}if(++seenGlobal%250===0)sammySolverStatus(`Modell 3/4 · ${seenGlobal} Global-Samples`)});const ridge=[];for(let sex=0;sex<2;sex++){const A=xtx[sex];for(let i=0;i<featureCount;i++)A[i*featureCount+i]+=i===0?1e-6:cfg.ridgeLambda;ridge[sex]=sammySolverCholeskySolveMatrix(A,xty[sex],featureCount,m)}run.cursor=3;await sammySolverPutRun(run);const targets=[];sammySolverStatus("Modell 4/4 · korrigierte Validation-Ziele …");await sammySolverEachCalRecord(calRun.runId,"validation",r=>{const a=sammySolverCorrectMeasureArrayV2(r.measures,r.shape,delta,measureIds);targets.push({sourceId:r.id,sourceCursor:r.cursor,shape:sammySolverCompactShape(r.shape),measures:Object.fromEntries(measureIds.map((id,j)=>[id,Number(a[j])]))})});targets.sort((a,b)=>(a.sourceCursor||0)-(b.sourceCursor||0));const model={schema:"sammy-forward-model-v2",sourceCalibrationRunId:calRun.runId,sourceCalibrationVersion:calRun.appVersion,landmarkDeltaSchema:run.deltaModel?.schema||null,n,m,measureIds,sliderDefs,sliderIndex,refs:{male_avg:refs.male_avg,female_avg:refs.female_avg},referenceMeasures,linear:Array.from(linear),quadratic:Array.from(quadratic),pairs:pairs.map(p=>({i:p.i,j:p.j,a:p.a,b:p.b,k:p.k,screenResidualCm:p.screenResidualCm})),coreFeatureIndices,featureCount,ridgeMale:Array.from(ridge[0]),ridgeFemale:Array.from(ridge[1]),training:{singleRecords:seenSingle,deepPairRecords:seenPair,deepPairs:pairs.length,globalSamples:seenGlobal,validationTargets:targets.length,ridgeLambda:cfg.ridgeLambda,semanticCorrection:"v0.8.4 records + learned Navel/Bulge delta"}};run.model=model;run.targets=targets;const maxForward=cfg.forwardTargets==null?targets.length:Math.min(cfg.forwardTargets,targets.length),maxInverse=cfg.inverseTargets==null?targets.length:Math.min(cfg.inverseTargets,targets.length);run.forwardTargetCount=maxForward;run.inverseTargetCount=maxInverse;run.truthTargetIndices=sammySolverSelectEven(maxInverse,Math.min(cfg.truthTargets,maxInverse));run.cursor=4;sammySolverRuntimeCache=null;await sammySolverPutRun(run);sammySolverStatus(`Korrigiertes Forward-Modell fertig · ${n} Slider · ${targets.length} Holdout-Körper`)}
async function sammySolverStepSyncV2(run){const model=sammySolverHydrate(run),sex=run.cursor,ref=model.refs[sex?"female_avg":"male_avg"],shape={core:{...ref.core},local:{}},results=await sammySolverApplyShape(shape),actual=sammySolverMeasureArray(results,model),pred=sammySolverBaseArray(model,sex),delta=Array.from(actual,(v,j)=>Number((v-pred[j]).toFixed(5)));run.baseAdjust[sex?"female":"male"]=delta;sammySolverLive("Delta Reference Check",[[sex?"♀ Referenz":"♂ Referenz","aktuell vs. korrigiertes Modell"],["Rest-Δ max",`${Math.max(...delta.map(Math.abs)).toFixed(2)} cm`]]);await sammySolverRecord(run,"sync",sex?"Female delta reference check":"Male delta reference check",{sex,residualCm:delta,currentMeasures:Object.fromEntries(model.measureIds.map((id,j)=>[id,Number(actual[j].toFixed(4))]))});run.cursor++;if(run.cursor>=2){run.stage="truth";run.cursor=0}}
async function sammySolverBuildModel(run,calRun){const cfg=SAMMY_SOLVER_CONFIG[run.mode],measureIds=SAMMY_MEASURE_DEFS.map(d=>d.id),sliderDefs=(calRun.sliders||[]).map(d=>({id:d.id,key:d.key,keys:d.keys||null,label:d.label,kind:d.kind,category:d.category,min:d.min,max:d.max})),n=sliderDefs.length,m=measureIds.length,sliderIndex=Object.fromEntries(sliderDefs.map((d,i)=>[d.id,i])),refs=sammySolverReferenceMap(calRun),referenceMeasures={male_avg:measureIds.map(id=>Number(calRun.referenceMeasures?.male_avg?.[id])),female_avg:measureIds.map(id=>Number(calRun.referenceMeasures?.female_avg?.[id]))},linear=new Float64Array(n*m),qNum=new Float64Array(n*m),qDen=new Float64Array(n);for(let i=0;i<n;i++)for(let j=0;j<m;j++)linear[i*m+j]=sammyCalSlope(calRun,sliderDefs[i].id,measureIds[j]);run.cursor=0;sammySolverStatus("Modell 1/4 · Einzelslider-Nichtlinearität …");let seen=0;await sammySolverEachCalRecord(calRun.runId,"single",r=>{const i=sliderIndex[r.sliderId];if(i==null)return;const ref=refs[r.referenceId],d=sliderDefs[i],lm=sammySolverShapeLocalMap(r.shape),dx=sammySolverShapeValue(r.shape,d,lm)-sammySolverRefValue(ref,d),x2=dx*dx;if(x2<1e-12)return;for(let j=0;j<m;j++){const y=Number(r.measures?.[measureIds[j]])-Number(calRun.referenceMeasures?.[ref.id]?.[measureIds[j]])-linear[i*m+j]*dx;qNum[i*m+j]+=x2*y}qDen[i]+=x2*x2;if(++seen%250===0)sammySolverStatus(`Modell 1/4 · ${seen} Single-Records`)});const quadratic=new Float64Array(n*m);for(let i=0;i<n;i++){const den=Math.max(qDen[i],1e-12);for(let j=0;j<m;j++)quadratic[i*m+j]=qNum[i*m+j]/den}run.cursor=1;await sammySolverPutRun(run);
 const deepPairs=calRun.deepInteractionPairs||[],pairIndex=new Map(),pairs=deepPairs.map(p=>({i:sliderIndex[p.a],j:sliderIndex[p.b],a:p.a,b:p.b,num:new Float64Array(m),den:0,k:null,screenResidualCm:Number(p.screenResidualCm||0)})).filter(p=>p.i!=null&&p.j!=null);pairs.forEach((p,i)=>pairIndex.set([p.a,p.b].sort().join("||"),i));sammySolverStatus(`Modell 2/4 · ${pairs.length} tiefe Paarmodelle …`);seen=0;await sammySolverEachCalRecord(calRun.runId,"interaction",r=>{const key=[r.pair?.a,r.pair?.b].sort().join("||"),pi=pairIndex.get(key),p=pi==null?null:pairs[pi];if(!p)return;const ref=refs[r.referenceId],da=sammySolverShapeValue(r.shape,sliderDefs[p.i])-sammySolverRefValue(ref,sliderDefs[p.i]),db=sammySolverShapeValue(r.shape,sliderDefs[p.j])-sammySolverRefValue(ref,sliderDefs[p.j]),x=da*db;if(Math.abs(x)<1e-12)return;for(let j=0;j<m;j++){const id=measureIds[j],raw=Number(r.additiveResidualCm?.[id]||0),isolated=raw-quadratic[p.i*m+j]*da*da-quadratic[p.j*m+j]*db*db;p.num[j]+=x*isolated}p.den+=x*x;if(++seen%500===0)sammySolverStatus(`Modell 2/4 · ${seen} Interaction-Records`)});for(const p of pairs){const den=Math.max(p.den,1e-12);p.k=Array.from(p.num,v=>v/den);delete p.num;delete p.den}run.cursor=2;await sammySolverPutRun(run);
 const coreIds=["core:age","core:height","core:weight","core:muscle","core:proportions","core:cupsize"],coreFeatureIndices=coreIds.map(id=>sliderIndex[id]).filter(i=>i!=null),featureCount=1+n+coreFeatureIndices.length+(coreFeatureIndices.length*(coreFeatureIndices.length-1))/2,xtx=[new Float64Array(featureCount*featureCount),new Float64Array(featureCount*featureCount)],xty=[new Float64Array(featureCount*m),new Float64Array(featureCount*m)];const tempModel={n,m,measureIds,sliderDefs,sliderIndex,refs:{male_avg:refs.male_avg,female_avg:refs.female_avg},referenceMeasures:{male_avg:Float64Array.from(referenceMeasures.male_avg),female_avg:Float64Array.from(referenceMeasures.female_avg)},linear,quadratic,pairs:[],coreFeatureIndices,featureCount,ridgeMale:new Float64Array(featureCount*m),ridgeFemale:new Float64Array(featureCount*m)};sammySolverStatus("Modell 3/4 · 6.000 Global-Samples → Residualmodell …");seen=0;await sammySolverEachCalRecord(calRun.runId,"global",r=>{const sex=Number(r.shape?.core?.gender||0)>=.5?1:0,ds=sammySolverDeltas(r.shape,tempModel,sex),pred=sammySolverQuadratic(tempModel,ds,sex),f=sammySolverFeatures(tempModel,ds),A=xtx[sex],Y=xty[sex];for(let a=0;a<featureCount;a++){const fa=f[a];if(Math.abs(fa)<1e-14)continue;for(let b=0;b<=a;b++){const v=fa*f[b];A[a*featureCount+b]+=v;if(a!==b)A[b*featureCount+a]+=v}const off=a*m;for(let j=0;j<m;j++)Y[off+j]+=fa*(Number(r.measures?.[measureIds[j]])-pred[j])}if(++seen%250===0)sammySolverStatus(`Modell 3/4 · ${seen} Global-Samples`)});const ridge=[];for(let sex=0;sex<2;sex++){const A=xtx[sex];for(let i=0;i<featureCount;i++)A[i*featureCount+i]+=i===0?1e-6:cfg.ridgeLambda;ridge[sex]=sammySolverCholeskySolveMatrix(A,xty[sex],featureCount,m)}run.cursor=3;await sammySolverPutRun(run);
 const targets=[];sammySolverStatus("Modell 4/4 · unabhängige Validation-Ziele laden …");await sammySolverEachCalRecord(calRun.runId,"validation",r=>{targets.push({sourceId:r.id,sourceCursor:r.cursor,shape:sammySolverCompactShape(r.shape),measures:Object.fromEntries(measureIds.map(id=>[id,Number(r.measures?.[id])]))})});targets.sort((a,b)=>(a.sourceCursor||0)-(b.sourceCursor||0));const model={schema:"sammy-forward-model-v1",sourceCalibrationRunId:calRun.runId,sourceCalibrationVersion:calRun.appVersion,n,m,measureIds,sliderDefs,sliderIndex,refs:{male_avg:refs.male_avg,female_avg:refs.female_avg},referenceMeasures,linear:Array.from(linear),quadratic:Array.from(quadratic),pairs:pairs.map(p=>({i:p.i,j:p.j,a:p.a,b:p.b,k:p.k,screenResidualCm:p.screenResidualCm})),coreFeatureIndices,featureCount,ridgeMale:Array.from(ridge[0]),ridgeFemale:Array.from(ridge[1]),training:{singleRecords:Number(calRun.sliders?.length||0)*(calRun.references?.length||0)*(SAMMY_CAL_CONFIG[calRun.mode]?.levels||0),deepPairs:pairs.length,globalSamples:seen,validationTargets:targets.length,ridgeLambda:cfg.ridgeLambda}};run.model=model;run.targets=targets;const maxForward=cfg.forwardTargets==null?targets.length:Math.min(cfg.forwardTargets,targets.length),maxInverse=cfg.inverseTargets==null?targets.length:Math.min(cfg.inverseTargets,targets.length);run.forwardTargetCount=maxForward;run.inverseTargetCount=maxInverse;run.truthTargetIndices=sammySolverSelectEven(maxInverse,Math.min(cfg.truthTargets,maxInverse));run.cursor=4;sammySolverRuntimeCache=null;await sammySolverPutRun(run);sammySolverStatus(`Forward-Modell fertig · ${n} Slider · ${targets.length} Holdout-Körper`)}
function sammySolverTargetArrays(run,target){const model=sammySolverHydrate(run),actual=Float64Array.from(model.measureIds.map(id=>Number(target.measures[id]))),sex=Number(target.shape?.core?.gender||0)>=.5?1:0,ds=sammySolverDeltas(target.shape,model,sex);return {model,actual,sex,ds}}
async function sammySolverStepForward(run){const model=sammySolverHydrate(run),chunk=20,end=Math.min(run.forwardTargetCount,run.cursor+chunk);if(!run.forward)run.forward=sammySolverMetricNew(["additive","quadratic","pair","globalRidge"],model.measureIds);for(let i=run.cursor;i<end;i++){const t=run.targets[i],{actual,sex,ds}=sammySolverTargetArrays(run,t);sammySolverMetricAdd(run.forward,"additive",actual,sammySolverAdditive(model,ds,sex),model.measureIds,t.sourceId);sammySolverMetricAdd(run.forward,"quadratic",actual,sammySolverQuadratic(model,ds,sex),model.measureIds,t.sourceId);sammySolverMetricAdd(run.forward,"pair",actual,sammySolverPairPrediction(model,ds,sex),model.measureIds,t.sourceId);sammySolverMetricAdd(run.forward,"globalRidge",actual,sammySolverFinalPrediction(model,ds,sex),model.measureIds,t.sourceId)}run.cursor=end;sammySolverStatus(`Forward Benchmark · ${run.cursor}/${run.forwardTargetCount}`);if(run.cursor>=run.forwardTargetCount){sammySolverMetricFinalize(run.forward,model.measureIds);const ranked=Object.entries(run.forward.models).sort((a,b)=>(a[1].overallRmseCm??Infinity)-(b[1].overallRmseCm??Infinity));run.selectedForwardModel=ranked[0]?.[0]||"globalRidge";const rows=ranked.map(([k,v])=>[`${k}${k===run.selectedForwardModel?" · BEST":""}`,`${v.overallRmseCm} cm`]);sammySolverLive("Forward Holdout RMSE",rows);await sammySolverRecord(run,"forward","Forward-Modellvergleich",{selectedForwardModel:run.selectedForwardModel,models:Object.fromEntries(Object.entries(run.forward.models).map(([k,v])=>[k,{overallRmseCm:v.overallRmseCm,rmseByMeasure:v.rmseByMeasure,worstCases:v.worstCases}]))});run.stage="inverse";run.cursor=0}}
function sammySolverBounds(model,sex){const ref=model.refs[sex?"female_avg":"male_avg"],lo=new Float64Array(model.n),hi=new Float64Array(model.n);for(let i=0;i<model.n;i++){const d=model.sliderDefs[i],r=sammySolverRefValue(ref,d);lo[i]=Number(d.min)-r;hi[i]=Number(d.max)-r}return {lo,hi}}
function sammySolverKnownContextDs(model,targetShape,sex){const ref=model.refs[sex?"female_avg":"male_avg"],ds=new Float64Array(model.n),fixed=new Set();for(const id of ["core:gender","core:age"]){const i=model.sliderIndex[id];if(i!=null){ds[i]=sammySolverShapeValue(targetShape,model.sliderDefs[i])-sammySolverRefValue(ref,model.sliderDefs[i]);fixed.add(i)}}if(!sex){const i=model.sliderIndex["core:cupsize"];if(i!=null)fixed.add(i)}return {ds,fixed}}
function sammySolverDampedStep(model,ds,sex,error,weights,fixed,lambda=.8,maxStep=.18){const J=sammySolverJacobian(model,ds,sex),free=[];for(let i=0;i<model.n;i++)if(!fixed.has(i))free.push(i);const mm=model.m,nn=free.length,G=new Float64Array(mm*mm),rhs=new Float64Array(mm),sw=weights.map(Math.sqrt);for(let a=0;a<mm;a++){rhs[a]=error[a]*sw[a];for(let b=0;b<=a;b++){let s=0;for(let k=0;k<nn;k++){const ia=J[a*model.n+free[k]]*sw[a],ib=J[b*model.n+free[k]]*sw[b];s+=ia*ib}G[a*mm+b]=s;G[b*mm+a]=s}G[a*mm+a]+=lambda}const z=sammySolverCholeskySolveVec(sammySolverCholesky(G,mm),rhs,mm),step=new Float64Array(model.n);let mx=0;for(let k=0;k<nn;k++){const i=free[k];let s=0;for(let a=0;a<mm;a++)s+=J[a*model.n+i]*sw[a]*z[a];step[i]=s;mx=Math.max(mx,Math.abs(s))}if(mx>maxStep){const q=maxStep/mx;for(let i=0;i<model.n;i++)step[i]*=q}return step}
function sammySolverSolveTarget(run,targetMeasures,targetShape,baseAdjust=null,initialDs=null){const model=sammySolverHydrate(run),sex=Number(targetShape?.core?.gender||0)>=.5?1:0,{ds:contextDs,fixed}=sammySolverKnownContextDs(model,targetShape,sex),ds=initialDs?Float64Array.from(initialDs):contextDs,{lo,hi}=sammySolverBounds(model,sex),weights=sammySolverMeasureWeights(model.measureIds),target=Float64Array.from(model.measureIds.map(id=>Number(targetMeasures[id]))),cfg=SAMMY_SOLVER_CONFIG[run.mode];for(const i of fixed)ds[i]=contextDs[i];let lambda=.8,bestRmse=Infinity,bestDs=Float64Array.from(ds),bestPred=null,stale=0,it=0;for(it=0;it<cfg.inverseIterations;it++){const pred=sammySolverFinalPrediction(model,ds,sex,baseAdjust),err=new Float64Array(model.m);for(let j=0;j<model.m;j++)err[j]=target[j]-pred[j];const rm=sammySolverRMSE(target,pred,weights);if(rm<bestRmse){bestRmse=rm;bestDs=Float64Array.from(ds);bestPred=Float64Array.from(pred);stale=0}else stale++;if(rm<.05||stale>=4)break;const step=sammySolverDampedStep(model,ds,sex,err,weights,fixed,lambda,.18);let improved=false;for(const alpha of [1,.55,.25]){const nd=Float64Array.from(ds);for(let i=0;i<model.n;i++)if(!fixed.has(i))nd[i]=Math.max(lo[i],Math.min(hi[i],nd[i]+alpha*step[i]));const np=sammySolverFinalPrediction(model,nd,sex,baseAdjust),nr=sammySolverRMSE(target,np,weights);if(nr<rm-1e-5){ds.set(nd);lambda=Math.max(.05,lambda*.85);improved=true;break}}if(!improved)lambda*=2}return {sex,ds:Array.from(bestDs),predicted:Array.from(bestPred||sammySolverFinalPrediction(model,bestDs,sex,baseAdjust)),weightedRmseCm:Number(bestRmse.toFixed(4)),iterations:it+1}}
async function sammySolverStepInverse(run){const i=run.cursor,t=run.targets[i],model=sammySolverHydrate(run),sol=sammySolverSolveTarget(run,t.measures,t.shape),sex=sol.sex,ref=model.refs[sex?"female_avg":"male_avg"],trueDs=sammySolverDeltas(t.shape,model,sex);let ps=0,pn=0;for(let k=0;k<model.n;k++){if(model.sliderDefs[k].id==="core:gender"||model.sliderDefs[k].id==="core:age"||(!sex&&model.sliderDefs[k].id==="core:cupsize"))continue;const e=sol.ds[k]-trueDs[k];ps+=e*e;pn++}const prms=pn?Math.sqrt(ps/pn):0;run.inverse.sumSq+=sol.weightedRmseCm*sol.weightedRmseCm;run.inverse.count++;run.inverse.paramSumSq+=prms*prms;run.inverse.paramCount++;run.inverse.cases.push({targetIndex:i,sourceId:t.sourceId,surrogateRmseCm:sol.weightedRmseCm,parameterRms:Number(prms.toFixed(4)),iterations:sol.iterations});if(run.truthTargetIndices.includes(i))run.truthSeeds[String(i)]={ds:sol.ds,surrogateRmseCm:sol.weightedRmseCm};await sammySolverRecord(run,"inverse",`Inverse ${i+1}`,{targetIndex:i,sourceId:t.sourceId,surrogateRmseCm:sol.weightedRmseCm,parameterRms:Number(prms.toFixed(4)),iterations:sol.iterations,solutionDs:sol.ds});run.cursor++;if(run.cursor%10===0||run.cursor>=run.inverseTargetCount)sammySolverLive("Inverse Solver",[["Ziel",`${run.cursor}/${run.inverseTargetCount}`],["letzter Surrogate-RMSE",`${sol.weightedRmseCm} cm`],["Parameter-Distanz",prms.toFixed(3)]]);if(run.cursor>=run.inverseTargetCount){run.inverse.overallSurrogateRmseCm=run.inverse.count?Number(Math.sqrt(run.inverse.sumSq/run.inverse.count).toFixed(4)):null;run.inverse.parameterRms=run.inverse.paramCount?Number(Math.sqrt(run.inverse.paramSumSq/run.inverse.paramCount).toFixed(4)):null;run.inverse.cases.sort((a,b)=>b.surrogateRmseCm-a.surrogateRmseCm);run.inverse.worstCases=run.inverse.cases.slice(0,20);delete run.inverse.cases;run.stage="sync";run.cursor=0}}
function sammySolverDsToShape(run,ds,sex,targetShape){const model=sammySolverHydrate(run),ref=model.refs[sex?"female_avg":"male_avg"],shape={core:{...ref.core},local:{}},arr=Float64Array.from(ds);for(let i=0;i<model.n;i++){const d=model.sliderDefs[i],abs=sammySolverRefValue(ref,d)+arr[i];sammyCalSetSlider(shape,d,abs)}shape.core.gender=sex;if(Number.isFinite(targetShape?.core?.age))shape.core.age=targetShape.core.age;if(!sex)shape.core.cupsize=.5;return shape}
async function sammySolverApplyShape(shape){annyParams={...annyParams,...shape.core,age:sammyClampAdultShapeAge(shape.core.age)};for(const k of Object.keys(annyLocalValues))annyLocalValues[k]=0;for(const [k,v] of Object.entries(shape.local||{}))if(k in annyLocalValues)annyLocalValues[k]=Number(v)||0;sammyMeasureScope=annyParams.gender>=.5?"female":"male";applyAnnyParams();sammyMeasureSyncLocalUiV3();const results=sammyComputeAllMeasures();sammyMeasureResultsCache=results;sammyMeasureOverlayMode="all";sammyMeasureLandmarksVisible=true;sammyMeasureLabelsVisible=false;sammyUpdateMeasureOverlay(results);await new Promise(r=>requestAnimationFrame(()=>setTimeout(r,SAMMY_SOLVER_CONFIG[sammySolverLab.run?.mode||sammySolverLab.mode].liveDelay)));return results}
function sammySolverMeasureArray(results,model){return Float64Array.from(model.measureIds.map(id=>Number(results[id]?.valueCm)))}
async function sammySolverStepSync(run){const model=sammySolverHydrate(run),sex=run.cursor,ref=model.refs[sex?"female_avg":"male_avg"],shape={core:{...ref.core},local:{}},results=await sammySolverApplyShape(shape),actual=sammySolverMeasureArray(results,model),old=sammySolverBaseArray(model,sex),delta=Array.from(actual,(v,j)=>Number((v-old[j]).toFixed(5)));run.baseAdjust[sex?"female":"male"]=delta;sammySolverLive("Landmark Sync",[[sex?"♀ Referenz":"♂ Referenz","aktuell gemessen"],["Δ max",`${Math.max(...delta.map(Math.abs)).toFixed(2)} cm`]]);await sammySolverRecord(run,"sync",sex?"Female reference sync":"Male reference sync",{sex,baseAdjustCm:delta,currentMeasures:Object.fromEntries(model.measureIds.map((id,j)=>[id,Number(actual[j].toFixed(4))]))});run.cursor++;if(run.cursor>=2){run.stage="truth";run.cursor=0}}
function sammySolverTruthWeights(model){return sammySolverMeasureWeights(model.measureIds)}
function sammySolverTruthUpdate(run,targetIndex,actual,target,phase,ds){const model=sammySolverHydrate(run),weights=sammySolverTruthWeights(model),weighted=sammySolverRMSE(target,actual,weights),all=sammySolverRMSE(target,actual),st=run.truthState[String(targetIndex)];if(phase===1){run.truth.sumSqInitial+=all*all;run.truth.countInitial++}if(all<Number(st.bestRmseCm??Infinity)){st.bestRmseCm=Number(all.toFixed(4));st.bestWeightedRmseCm=Number(weighted.toFixed(4));st.bestDs=Array.from(ds);st.bestActual=Array.from(actual)}return {all,weighted}}
function sammySolverTruthCorrection(run,state,actual,target){const model=sammySolverHydrate(run),sex=state.sex,weights=sammySolverTruthWeights(model),err=new Float64Array(model.m);for(let j=0;j<model.m;j++)err[j]=target[j]-actual[j];const fixed=sammySolverKnownContextDs(model,state.targetShape,sex).fixed,worsened=Number.isFinite(state.bestRmseCm)&&Number.isFinite(state.lastRmseCm)&&state.bestRmseCm<state.lastRmseCm-1e-6,step=sammySolverDampedStep(model,Float64Array.from(state.ds),sex,err,weights,fixed,1.2,worsened?.08:.12),{lo,hi}=sammySolverBounds(model,sex),nd=Float64Array.from(state.bestDs||state.ds),alpha=worsened?.35:.55;for(let i=0;i<model.n;i++)if(!fixed.has(i))nd[i]=Math.max(lo[i],Math.min(hi[i],nd[i]+alpha*step[i]));return Array.from(nd)}
async function sammySolverStepTruth(run){const cfg=SAMMY_SOLVER_CONFIG[run.mode],stride=1+cfg.truthPasses,slot=Math.floor(run.cursor/stride),phase=run.cursor%stride,targetIndex=run.truthTargetIndices[slot],t=run.targets[targetIndex],model=sammySolverHydrate(run);let st=run.truthState[String(targetIndex)];if(!st){const seed=run.truthSeeds[String(targetIndex)];st=run.truthState[String(targetIndex)]={targetIndex,sourceId:t.sourceId,targetShape:t.shape,sex:Number(t.shape?.core?.gender||0)>=.5?1:0,ds:Array.from(seed?.ds||sammySolverKnownContextDs(model,t.shape,Number(t.shape?.core?.gender||0)>=.5?1:0).ds),bestDs:null,bestRmseCm:Infinity,bestWeightedRmseCm:Infinity,lastRmseCm:Infinity,targetMeasures:null,initialRmseCm:null}}if(phase===0){const sourceShape={core:{...t.shape.core},local:Object.fromEntries(t.shape.local||[])},results=await sammySolverApplyShape(sourceShape),target=sammySolverMeasureArray(results,model);st.targetMeasures=Array.from(target);const fresh=sammySolverSolveTarget(run,Object.fromEntries(model.measureIds.map((id,j)=>[id,target[j]])),t.shape,null,st.ds);st.ds=fresh.ds;st.bestDs=Array.from(fresh.ds);st.surrogateCurrentRmseCm=fresh.weightedRmseCm;sammySolverLive(`Truth ${slot+1}/${run.truthTargetIndices.length} · Zielkörper`,[["aktuelle Landmark-Maße","erfasst"],["Surrogate Solve",`${fresh.weightedRmseCm} cm`]]);await sammySolverRecord(run,"truth-target",`Truth target ${targetIndex}`,{targetIndex,sourceId:t.sourceId,currentTargetMeasures:Object.fromEntries(model.measureIds.map((id,j)=>[id,Number(target[j].toFixed(4))])),surrogateCurrentRmseCm:fresh.weightedRmseCm})}else{const shape=sammySolverDsToShape(run,st.ds,st.sex,t.shape),results=await sammySolverApplyShape(shape),actual=sammySolverMeasureArray(results,model),target=Float64Array.from(st.targetMeasures),score=sammySolverTruthUpdate(run,targetIndex,actual,target,phase,st.ds);if(phase===1)st.initialRmseCm=Number(score.all.toFixed(4));st.lastRmseCm=Number(score.all.toFixed(4));sammySolverLive(`Truth ${slot+1}/${run.truthTargetIndices.length} · Pass ${phase}/${cfg.truthPasses}`,[['aktuell',`${score.all.toFixed(3)} cm`],["best",`${Number(st.bestRmseCm).toFixed(3)} cm`],["weighted",`${score.weighted.toFixed(3)} cm`]]);await sammySolverRecord(run,"truth-pass",`Truth ${targetIndex} pass ${phase}`,{targetIndex,phase,actualRmseCm:Number(score.all.toFixed(4)),weightedRmseCm:Number(score.weighted.toFixed(4)),bestRmseCm:st.bestRmseCm,solutionDs:Array.from(st.ds)});if(phase<cfg.truthPasses)st.ds=sammySolverTruthCorrection(run,st,actual,target);else{run.truth.sumSqBest+=Number(st.bestRmseCm)**2;run.truth.countBest++;for(let j=0;j<model.m;j++){const e=Number(st.bestActual?.[j])-Number(target[j]);const id=model.measureIds[j];run.truth.perSumSq[id]=(run.truth.perSumSq[id]||0)+e*e;run.truth.perCount[id]=(run.truth.perCount[id]||0)+1}run.truth.cases.push({targetIndex,sourceId:t.sourceId,initialRmseCm:st.initialRmseCm,bestRmseCm:st.bestRmseCm,passes:cfg.truthPasses});delete run.truthState[String(targetIndex)]}}run.cursor++;if(run.cursor>=run.truthTargetIndices.length*stride){run.truth.initialOverallRmseCm=run.truth.countInitial?Number(Math.sqrt(run.truth.sumSqInitial/run.truth.countInitial).toFixed(4)):null;run.truth.bestOverallRmseCm=run.truth.countBest?Number(Math.sqrt(run.truth.sumSqBest/run.truth.countBest).toFixed(4)):null;run.truth.rmseByMeasure={};for(const id of model.measureIds){const n=run.truth.perCount[id]||0;if(n)run.truth.rmseByMeasure[id]=Number(Math.sqrt(run.truth.perSumSq[id]/n).toFixed(4))}run.truth.cases.sort((a,b)=>b.bestRmseCm-a.bestRmseCm);run.truth.worstCases=run.truth.cases.slice(0,20);delete run.truth.cases;run.stage="complete";run.completedAt=new Date().toISOString();run.cursor=1}}
async function sammySolverRunner(){const run=sammySolverLab.run;if(!run)return;sammySolverLab.running=true;sammySolverLab.paused=false;sammySolverLab.cancelRequested=false;sammySolverStatus("Delta + Solver R2 startet …");try{while(sammySolverLab.running&&!sammySolverLab.paused&&!sammySolverLab.cancelRequested&&run.stage!=="complete"){if(run.stage==="delta")await sammySolverStepDelta(run);else if(run.stage==="deltaFit")await sammySolverFitDelta(run);else if(run.stage==="model"){const cal=(await sammyCalGetRuns()).find(r=>r.runId===run.calibrationRunId);if(!cal)throw new Error("Quell-Kalibrierung nicht mehr in IndexedDB gefunden");await sammySolverBuildModelV2(run,cal);run.stage="forward";run.cursor=0}else if(run.stage==="forward")await sammySolverStepForward(run);else if(run.stage==="inverse")await sammySolverStepInverse(run);else if(run.stage==="sync")await sammySolverStepSyncV2(run);else if(run.stage==="truth")await sammySolverStepTruth(run);else throw new Error(`Unbekannte Solver-Stufe ${run.stage}`);await sammySolverPutRun(run);sammySolverStatus()}if(run.stage==="complete"){sammySolverLab.running=false;sammySolverLab.lastRun=run;const d=run.deltaSummary?.affectedRmseCm,f=run.forward?.models?.globalRidge?.overallRmseCm,i=run.inverse?.overallSurrogateRmseCm,t=run.truth?.bestOverallRmseCm;sammySolverStatus(`Fertig · Delta ${d??"—"} cm · Forward ${f??"—"} cm · Mesh ${t??"—"} cm`);sammySolverLive("DELTA + SOLVER R2 FERTIG",[["Delta Holdout",`${d??"—"} cm`],["Forward Holdout",`${f??"—"} cm`],["Inverse Surrogate",`${i??"—"} cm`],["Mesh nach Refinement",`${t??"—"} cm`]])}}catch(e){console.error("Solver Lab",e);sammyMeasureLegacyLandmarksForDelta=false;sammySolverLab.running=false;sammySolverLab.paused=true;sammySolverStatus(`FEHLER: ${e?.message||e}`);sammyReportError?.(e,{source:"Solver Lab R2"})}finally{sammyMeasureLegacyLandmarksForDelta=false;sammySolverLab.running=false;sammySolverStatus()}}
async function sammySolverStartOrResume(){if(sammySolverLab.running)return;if(sammyCalibration?.running){sammySolverStatus("Calibration Lab läuft noch · zuerst pausieren.");return}if(!annyPackLoaded){sammySolverStatus("Anny-Pack ist noch nicht bereit.");return}if(!sammyMeasureSession){sammySolverStatus("MEAS zuerst öffnen.");return}let run=sammySolverLab.run;if(!run||run.stage==="complete"){const cal=await sammySolverFindCalibration();if(!cal){sammySolverStatus("Keine abgeschlossene Calibration in IndexedDB gefunden.");return}run=sammySolverNewRun(sammySolverLab.mode,cal);sammySolverLab.run=run;sammySolverRuntimeCache=null;await sammySolverPutRun(run);sammySolverStatus(`Quelle: ${cal.mode.toUpperCase()} ${cal.appVersion} · ${cal.ordinal||0} Records`)}sammySolverLab.paused=false;sammySolverLab.cancelRequested=false;sammySolverRunner()}
function sammySolverPause(){if(!sammySolverLab.running)return;sammySolverLab.paused=true;sammySolverLab.running=false;sammySolverStatus("Pausiert · Solver-Fortschritt gespeichert.")}
async function sammySolverReset(){if(sammySolverLab.running){sammySolverStatus("Bitte zuerst pausieren.");return}const run=sammySolverLab.run||sammySolverLab.lastRun;if(run)await sammySolverDeleteRun(run.runId);sammySolverLab.run=null;sammySolverLab.lastRun=null;sammySolverRuntimeCache=null;sammySolverStatus("Solver-Lauf gelöscht. Calibration-Daten bleiben erhalten.")}
async function sammySolverLoadLatest(){return sammyProductionLoadLatest()}
function sammySolverSummary(run){const forward=run.forward?{models:Object.fromEntries(Object.entries(run.forward.models||{}).map(([k,v])=>[k,{overallRmseCm:v.overallRmseCm,rmseByMeasure:v.rmseByMeasure,worstCases:v.worstCases}]))}:null;return {schema:"sammy-solver-summary-v2",runId:run.runId,appVersion:run.appVersion,mode:run.mode,createdAt:run.createdAt,completedAt:run.completedAt||null,calibration:{runId:run.calibrationRunId,version:run.calibrationVersion,mode:run.calibrationMode,records:run.calibrationRecords},landmarkDelta:run.deltaSummary?{...run.deltaSummary,model:{schema:run.deltaModel?.schema,featureCount:run.deltaModel?.featureCount,ridgeLambda:run.deltaModel?.ridgeLambda}}:null,model:run.model?{sliderCount:run.model.n,measureCount:run.model.m,pairDiagnosticCount:run.model.pairs?.length||0,featureCount:run.model.featureCount,training:run.model.training,selectedForwardModel:run.selectedForwardModel||null,strategy:"v0.8.4 Calibration records are first corrected by the learned Navel/Bulge landmark delta; corrected globalRidge = fitted single linear+quadratic terms + corrected pair interactions + sex-specific global residual ridge."}:null,forward,inverse:run.inverse?{overallSurrogateRmseCm:run.inverse.overallSurrogateRmseCm,parameterRms:run.inverse.parameterRms,worstCases:run.inverse.worstCases}:null,deltaReferenceCheck:run.baseAdjust,truth:run.truth?{initialOverallRmseCm:run.truth.initialOverallRmseCm,bestOverallRmseCm:run.truth.bestOverallRmseCm,rmseByMeasure:run.truth.rmseByMeasure,worstCases:run.truth.worstCases,testedTargets:run.truth.countBest}:null,notes:run.notes}}
async function sammySolverExport(summaryOnly=false){const run=sammySolverLab.run||sammySolverLab.lastRun;if(!run){sammySolverStatus("Kein Solver-Lauf zum Exportieren.");return}const summary=sammySolverSummary(run),base={schema:SAMMY_SOLVER_SCHEMA,app:"Sammy",version:"0.8.7",generated:new Date().toISOString(),purpose:"Compact Landmark-Delta + Solver R2: learns the shape-dependent v0.8.4 → Navel/Bulge measurement correction, upgrades the existing Deep Calibration dataset mathematically, then reruns Forward, inverse and real-mesh validation.",summary};let payload=base;if(!summaryOnly){const records=await sammySolverGetRecords(run.runId);payload={...base,run,records}}const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=summaryOnly?`Sammy_SolverR2_Summary_${run.mode}_${run.runId}.json`:`Sammy_SolverR2_FULL_${run.mode}_${run.runId}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500);sammySolverStatus(summaryOnly?"Solver-R2-Summary exportiert.":"Solver-R2-FULL exportiert.")}

// -----------------------------------------------------------------------------
// Sammy v0.8.10 PRODUCTION SOLVER R5 · mesh-guarded canonicalization
// Reuses the completed Solver R2 model/targets. No new Calibration/Delta data.
// Phase 1: proven R2 inverse + real-mesh refinement to the best measurement fit.
// Phase 2: propose targeted Scale/Translation neutralization with lower-cost
// compensation, but accept each cleanup only after measuring the REAL mesh.
// Rejected changes are rolled back and retried smaller; if no cleanup is safe,
// the exact mesh-refined R2 solution is retained as the production fallback.
// -----------------------------------------------------------------------------
const SAMMY_PRODUCTION_SCHEMA="sammy-solver-production-lab-v2";
const SAMMY_PRODUCTION_STRATEGIES=["baseline","production"];
const SAMMY_PRODUCTION_LABELS={baseline:"R2 Baseline",production:"R5 Mesh-Guarded"};
const SAMMY_PRODUCTION_TRUTH_TARGETS={quick:8,standard:24,deep:60};
const SAMMY_PRODUCTION_CANON_EVALS={quick:6,standard:10,deep:14};
const SAMMY_PRODUCTION_CANON_ALPHAS={translation:[.35,.18,.09,.045],scale:[.28,.14,.07,.035]};
const SAMMY_PRODUCTION_BODY_GUARD_CM=.02;

function sammyProductionClass(d){
 const id=String(d?.id||"").toLowerCase(),label=String(d?.label||"").toLowerCase();
 if(d?.kind==="core")return"core";
 if(id.includes("measure-")||label.startsWith("measure "))return"measure";
 if(id.includes("trans-")||id.endsWith("-trans-up")||id.includes("trans-forward")||id.includes("trans-out"))return"translation";
 if(id.includes("scale-"))return"scale";
 return"anatomical";
}
function sammyProductionBasePenalty(d,cls){
 const id=String(d?.id||"");
 if(cls==="measure")return .32;
 if(cls==="anatomical")return 1.1;
 if(cls==="scale")return 2.7;
 if(cls==="translation")return 8;
 if(id==="core:height")return .7;
 if(id==="core:cupsize")return .9;
 if(id==="core:weight"||id==="core:muscle"||id==="core:proportions")return 1.4;
 return 1;
}
function sammyProductionProfile(model,sex=0){
 const {lo,hi}=sammySolverBounds(model,sex),rows=[],cleanupPenalty=new Float64Array(model.n);
 for(let i=0;i<model.n;i++){
  const d=model.sliderDefs[i],cls=sammyProductionClass(d),x=Math.max(.12,.5*Math.max(Math.abs(lo[i]),Math.abs(hi[i]))),off=i*model.m;
  let ss=0,mx=0;
  for(let j=0;j<model.m;j++){
   const a=model.linear[off+j]*x+model.quadratic[off+j]*x*x,b=-model.linear[off+j]*x+model.quadratic[off+j]*x*x,e=Math.max(Math.abs(a),Math.abs(b));
   ss+=e*e;mx=Math.max(mx,e);
  }
  const purity=ss>1e-12?Math.max(0,Math.min(1,mx/Math.sqrt(ss))):0,base=sammyProductionBasePenalty(d,cls),purityStrength=cls==="measure"?.15:(cls==="anatomical"?.5:(cls==="scale"||cls==="translation"?.75:0)),mult=1+purityStrength*(1-purity)*(1-purity),clean=base*mult;
  cleanupPenalty[i]=clean;
  rows.push({id:d.id,label:d.label,class:cls,purity:Number(purity.toFixed(4)),cleanupPenalty:Number(clean.toFixed(4))});
 }
 return {rows,cleanupPenalty:Array.from(cleanupPenalty)};
}
function sammyProductionCost(run,ds,targetShape){
 const model=sammySolverHydrate(run),sex=Number(targetShape?.core?.gender||0)>=.5?1:0,{fixed}=sammySolverKnownContextDs(model,targetShape,sex),pen=run.productionProfile.cleanupPenalty;
 let cost=0,n=0;
 for(let i=0;i<model.n;i++){
  if(fixed.has(i))continue;
  const x=Number(ds[i]||0);cost+=Number(pen[i]||1)*x*x;n++;
 }
 return n?cost/n:0;
}
function sammyProductionUsage(run,ds,targetShape){
 const model=sammySolverHydrate(run),sex=Number(targetShape?.core?.gender||0)>=.5?1:0,{fixed}=sammySolverKnownContextDs(model,targetShape,sex),sum={},count={};
 let active=0;
 for(let i=0;i<model.n;i++){
  if(fixed.has(i))continue;
  const x=Number(ds[i]||0),c=sammyProductionClass(model.sliderDefs[i]);
  sum[c]=(sum[c]||0)+x*x;count[c]=(count[c]||0)+1;if(Math.abs(x)>.1)active++;
 }
 const classRms={};for(const c of Object.keys(sum))classRms[c]=Number(Math.sqrt(sum[c]/Math.max(1,count[c])).toFixed(4));
 return {activeCount:active,priorityCost:Number(sammyProductionCost(run,ds,targetShape).toFixed(6)),classRms};
}
function sammyProductionPercentile(values,p){
 if(!values?.length)return null;
 const a=values.slice().sort((x,y)=>x-y),q=(a.length-1)*p,lo=Math.floor(q),hi=Math.ceil(q),f=q-lo;
 return Number((a[lo]*(1-f)+a[hi]*f).toFixed(4));
}
async function sammyProductionFindSource(){
 const runs=(await sammySolverGetRuns()).filter(r=>r?.schema===SAMMY_SOLVER_SCHEMA&&r.stage==="complete"&&r.model&&Array.isArray(r.targets)&&r.targets.length);
 runs.sort((a,b)=>String(b.completedAt||b.updatedAt||"").localeCompare(String(a.completedAt||a.updatedAt||"")));
 return runs[0]||null;
}
function sammyProductionWeightedStep(model,ds,sex,error,weights,fixed,penalties,lambda=.45,maxStep=.10){
 const J=sammySolverJacobian(model,ds,sex),free=[];
 for(let i=0;i<model.n;i++)if(!fixed.has(i))free.push(i);
 const G=new Float64Array(model.m*model.m),rhs=new Float64Array(model.m),sw=weights.map(Math.sqrt);
 for(let a=0;a<model.m;a++){
  rhs[a]=error[a]*sw[a];
  for(let b=0;b<=a;b++){
   let q=0;
   for(const i of free){const inv=1/Math.max(.08,Number(penalties[i]||1)),ja=J[a*model.n+i]*sw[a],jb=J[b*model.n+i]*sw[b];q+=ja*jb*inv;}
   G[a*model.m+b]=q;G[b*model.m+a]=q;
  }
  G[a*model.m+a]+=lambda;
 }
 const z=sammySolverCholeskySolveVec(sammySolverCholesky(G,model.m),rhs,model.m),step=new Float64Array(model.n);
 let mx=0;
 for(const i of free){
  const inv=1/Math.max(.08,Number(penalties[i]||1));let q=0;
  for(let a=0;a<model.m;a++)q+=J[a*model.n+i]*sw[a]*z[a];
  step[i]=inv*q;mx=Math.max(mx,Math.abs(step[i]));
 }
 if(mx>maxStep){const f=maxStep/mx;for(let i=0;i<model.n;i++)step[i]*=f;}
 return step;
}
function sammyProductionMetricNew(){
 return {sumSq:0,count:0,paramSumSq:0,paramCount:0,activeSum:0,costSum:0,classSum:{},classCount:{},rmseValues:[],cases:[]};
}
function sammyProductionMetricAdd(run,targetIndex,t,sol){
 const model=sammySolverHydrate(run),m=run.offlineBaseline,sex=sol.sex,trueDs=sammySolverDeltas(t.shape,model,sex),fixed=sammySolverKnownContextDs(model,t.shape,sex).fixed;
 let ps=0,pn=0;
 for(let k=0;k<model.n;k++){if(fixed.has(k))continue;const e=Number(sol.ds[k])-trueDs[k];ps+=e*e;pn++;}
 const prms=pn?Math.sqrt(ps/pn):0,u=sammyProductionUsage(run,sol.ds,t.shape),r=Number(sol.weightedRmseCm);
 m.sumSq+=r*r;m.count++;m.rmseValues.push(r);m.paramSumSq+=prms*prms;m.paramCount++;m.activeSum+=u.activeCount;m.costSum+=u.priorityCost;
 for(const [c,v] of Object.entries(u.classRms)){m.classSum[c]=(m.classSum[c]||0)+v;m.classCount[c]=(m.classCount[c]||0)+1;}
 m.cases.push({targetIndex,sourceId:t.sourceId,surrogateRmseCm:r,parameterRms:Number(prms.toFixed(4)),activeCount:u.activeCount,priorityCost:u.priorityCost,iterations:Number(sol.iterations||0)});
 return u;
}
function sammyProductionMetricFinalize(run){
 const m=run.offlineBaseline;
 m.overallSurrogateRmseCm=m.count?Number(Math.sqrt(m.sumSq/m.count).toFixed(4)):null;
 m.parameterRms=m.paramCount?Number(Math.sqrt(m.paramSumSq/m.paramCount).toFixed(4)):null;
 m.meanActiveSliders=m.count?Number((m.activeSum/m.count).toFixed(2)):null;
 m.meanPriorityCost=m.count?Number((m.costSum/m.count).toFixed(6)):null;
 m.p90BodyRmseCm=sammyProductionPercentile(m.rmseValues,.90);m.p95BodyRmseCm=sammyProductionPercentile(m.rmseValues,.95);m.maxBodyRmseCm=m.rmseValues.length?Number(Math.max(...m.rmseValues).toFixed(4)):null;
 m.classUsageRms={};for(const c of Object.keys(m.classSum))m.classUsageRms[c]=Number((m.classSum[c]/Math.max(1,m.classCount[c])).toFixed(4));
 m.cases.sort((a,b)=>b.surrogateRmseCm-a.surrogateRmseCm);m.worstCases=m.cases.slice(0,15);delete m.cases;delete m.rmseValues;
 const d=run.proposalDiagnostics,n=Math.max(1,d.available);
 d.availablePct=Number((100*d.available/Math.max(1,d.count)).toFixed(2));d.meanPredictedFitDeltaCm=Number((d.predictedFitDeltaSum/n).toFixed(4));d.meanPredictedCostReductionPct=Number((d.costReductionSum/n).toFixed(2));
}
function sammyCanonicalCandidateScore(run,ds,targetShape,i,attempts={}){
 const model=sammySolverHydrate(run),cls=sammyProductionClass(model.sliderDefs[i]);if(cls!=="scale"&&cls!=="translation")return -Infinity;
 const x=Math.abs(Number(ds[i]||0));if(x<.06)return -Infinity;
 const p=Number(run.productionProfile.cleanupPenalty[i]||1),a=Number(attempts[i]||0);
 return p*x*x/(1+.7*a);
}
function sammyCanonicalBuildProposal(run,targetMeasures,targetShape,currentDs,targetIndex,alphaPos=0){
 const model=sammySolverHydrate(run),sex=Number(targetShape?.core?.gender||0)>=.5?1:0,{fixed}=sammySolverKnownContextDs(model,targetShape,sex),cls=sammyProductionClass(model.sliderDefs[targetIndex]),alphas=SAMMY_PRODUCTION_CANON_ALPHAS[cls];
 if(!alphas||fixed.has(targetIndex)||alphaPos<0||alphaPos>=alphas.length)return null;
 const ds=Float64Array.from(currentDs),x=Number(ds[targetIndex]||0);if(Math.abs(x)<.06)return null;
 const {lo,hi}=sammySolverBounds(model,sex),alpha=alphas[alphaPos],maxRaw=cls==="translation"?.18:.14,rawDelta=Math.max(-maxRaw,Math.min(maxRaw,-x*alpha));
 if(Math.abs(rawDelta)<.005)return null;
 const J=sammySolverJacobian(model,ds,sex),weights=sammySolverMeasureWeights(model.measureIds),error=new Float64Array(model.m);
 for(let j=0;j<model.m;j++)error[j]=-J[j*model.n+targetIndex]*rawDelta;
 const fixed2=new Set(fixed);fixed2.add(targetIndex);
 const compensation=sammyProductionWeightedStep(model,ds,sex,error,weights,fixed2,run.productionProfile.cleanupPenalty,.4,.10),nd=Float64Array.from(ds);
 nd[targetIndex]=Math.max(lo[targetIndex],Math.min(hi[targetIndex],nd[targetIndex]+rawDelta));
 for(let i=0;i<model.n;i++)if(!fixed2.has(i))nd[i]=Math.max(lo[i],Math.min(hi[i],nd[i]+compensation[i]));
 const target=Float64Array.from(model.measureIds.map(id=>Number(targetMeasures[id]))),pred0=sammySolverFinalPrediction(model,ds,sex),pred1=sammySolverFinalPrediction(model,nd,sex),fit0=sammySolverRMSE(target,pred0,weights),fit1=sammySolverRMSE(target,pred1,weights),cost0=sammyProductionCost(run,ds,targetShape),cost1=sammyProductionCost(run,nd,targetShape),reduction=cost0>1e-12?100*(cost0-cost1)/cost0:0;
 if(!Number.isFinite(fit1)||!Number.isFinite(cost1)||cost1>=cost0-1e-8||reduction<.12||fit1>fit0+Math.max(.08,.12*fit0))return null;
 return {targetIndex,sliderId:model.sliderDefs[targetIndex].id,label:model.sliderDefs[targetIndex].label,class:cls,alphaPos,alpha,ds:Array.from(nd),surrogateFitBeforeCm:Number(fit0.toFixed(4)),surrogateFitAfterCm:Number(fit1.toFixed(4)),surrogateFitDeltaCm:Number((fit1-fit0).toFixed(4)),costBefore:Number(cost0.toFixed(6)),costAfter:Number(cost1.toFixed(6)),costReductionPct:Number(reduction.toFixed(2)),targetValueBefore:Number(x.toFixed(5)),targetValueAfter:Number(nd[targetIndex].toFixed(5))};
}
function sammyCanonicalNextProposal(run,targetMeasures,targetShape,currentDs,state){
 const model=sammySolverHydrate(run),sex=Number(targetShape?.core?.gender||0)>=.5?1:0,{fixed}=sammySolverKnownContextDs(model,targetShape,sex),blocked=new Set(state.blocked||[]),attempts=state.attemptCounts||{};
 const ranked=[];
 for(let i=0;i<model.n;i++){if(fixed.has(i)||blocked.has(i))continue;const score=sammyCanonicalCandidateScore(run,currentDs,targetShape,i,attempts);if(Number.isFinite(score)&&score>0)ranked.push([score,i]);}
 ranked.sort((a,b)=>b[0]-a[0]);
 for(const [,i] of ranked){const cls=sammyProductionClass(model.sliderDefs[i]),alphas=SAMMY_PRODUCTION_CANON_ALPHAS[cls]||[];for(let ap=0;ap<alphas.length;ap++){const p=sammyCanonicalBuildProposal(run,targetMeasures,targetShape,currentDs,i,ap);if(p)return p;}blocked.add(i);}
 state.blocked=Array.from(blocked);return null;
}
function sammyCanonicalRetryProposal(run,targetMeasures,targetShape,currentDs,state,previous){
 if(!previous)return sammyCanonicalNextProposal(run,targetMeasures,targetShape,currentDs,state);
 const model=sammySolverHydrate(run),cls=sammyProductionClass(model.sliderDefs[previous.targetIndex]),alphas=SAMMY_PRODUCTION_CANON_ALPHAS[cls]||[];
 for(let ap=previous.alphaPos+1;ap<alphas.length;ap++){const p=sammyCanonicalBuildProposal(run,targetMeasures,targetShape,currentDs,previous.targetIndex,ap);if(p)return p;}
 const blocked=new Set(state.blocked||[]);blocked.add(previous.targetIndex);state.blocked=Array.from(blocked);return sammyCanonicalNextProposal(run,targetMeasures,targetShape,currentDs,state);
}
function sammyCanonicalMeasureWorsenLimit(id){
 if(SAMMY_SOLVER_LOW_WEIGHT_MEASURES.has(id))return .5;
 if(String(id).includes("circumference"))return .35;
 return .25;
}
function sammyCanonicalGuard(run,state,target,candidateActual,proposal){
 const model=sammySolverHydrate(run),baseRmse=Number(state.baselineRmseCm),candRmse=sammySolverRMSE(target,candidateActual),bodyLimit=baseRmse+SAMMY_PRODUCTION_BODY_GUARD_CM;
 let worstWorsen=-Infinity,worstMeasure=null,worstLimit=null,worstOverLimit=-Infinity,measureOk=true;
 for(let j=0;j<model.m;j++){
  const id=model.measureIds[j],b=Math.abs(Number(state.baselineActual[j])-Number(target[j])),c=Math.abs(Number(candidateActual[j])-Number(target[j])),w=c-b,lim=sammyCanonicalMeasureWorsenLimit(id),over=w-lim;
  if(w>worstWorsen){worstWorsen=w;worstMeasure=id;worstLimit=lim;}
  if(over>worstOverLimit)worstOverLimit=over;
  if(w>lim+1e-9)measureOk=false;
 }
 const costBefore=Number(state.currentCost),costAfter=Number(proposal.costAfter),costOk=Number.isFinite(costAfter)&&costAfter<costBefore-Math.max(1e-7,.001*costBefore),bodyOk=Number.isFinite(candRmse)&&candRmse<=bodyLimit+1e-9,accepted=costOk&&bodyOk&&measureOk;
 return {accepted,candidateRmseCm:Number(candRmse.toFixed(4)),bodyLimitCm:Number(bodyLimit.toFixed(4)),worstMeasure,worstMeasureWorsenCm:Number(worstWorsen.toFixed(4)),worstMeasureLimitCm:Number(Number(worstLimit).toFixed(4)),worstOverLimitCm:Number(worstOverLimit.toFixed(4)),costBefore:Number(costBefore.toFixed(6)),costAfter:Number(costAfter.toFixed(6)),costOk,bodyOk,measureOk};
}
function sammyProductionNewRun(mode,source){
 const cfg=SAMMY_SOLVER_CONFIG[mode],cnt=cfg.inverseTargets==null?source.targets.length:Math.min(cfg.inverseTargets,source.targets.length),truthCount=Math.min(SAMMY_PRODUCTION_TRUTH_TARGETS[mode]||24,cnt);
 return {schema:SAMMY_PRODUCTION_SCHEMA,runId:`production-r5-${new Date().toISOString().replace(/[:.]/g,"-")}-${Math.random().toString(36).slice(2,7)}`,appVersion:"0.8.10",mode,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),stage:"productionPrep",cursor:0,ordinal:0,sourceSolverRunId:source.runId,sourceSolverVersion:source.appVersion,calibrationRunId:source.calibrationRunId,calibrationVersion:source.calibrationVersion,model:source.model,targets:source.targets,inverseTargetCount:cnt,truthTargetIndices:sammySolverSelectEven(cnt,truthCount),productionProfile:null,offlineBaseline:null,proposalDiagnostics:null,productionSeeds:{},productionTruthTargets:{},productionTruthState:{},productionTruth:null,truthSlot:0,truthPhase:"target",truthPass:1,truthEval:0,meshComparison:null,notes:{purpose:"Production Solver R5: preserve the mesh-refined R2 fit, then canonicalize only through real-mesh guarded cleanup",phase1:"R2 inverse + the proven real-mesh refinement is completed first and becomes the immutable fallback",phase2:"surrogate/Jacobian data only PROPOSE targeted Scale/Translation neutralization; every proposal is measured on the real mesh before acceptance",guard:`fixed per-body guard +${SAMMY_PRODUCTION_BODY_GUARD_CM.toFixed(2)} cm over that body's R2 mesh fit, plus per-measure deterioration guards and rollback`,fallback:"if no cleanup passes the real-mesh guard, production output is exactly the mesh-refined R2 body",corePolicy:"gender/age remain known context; R5 canonicalization targets only Scale/Translation controls, not latent Weight/Muscle/Proportions"}};
}
async function sammyProductionStepPrep(run){
 const model=sammySolverHydrate(run),profile=sammyProductionProfile(model,0),counts={};for(const row of profile.rows)counts[row.class]=(counts[row.class]||0)+1;
 run.productionProfile={...profile,classCounts:counts};run.offlineBaseline=sammyProductionMetricNew();run.proposalDiagnostics={count:0,available:0,predictedFitDeltaSum:0,costReductionSum:0,byClass:{}};run.stage="productionOffline";run.cursor=0;
 sammySolverLive("R5 CANONICAL PROFILE",[["Measure",counts.measure||0],["Anatomical",counts.anatomical||0],["Scale",counts.scale||0],["Translation",counts.translation||0],["Mesh guard",`+${SAMMY_PRODUCTION_BODY_GUARD_CM.toFixed(2)} cm`]]);
 await sammySolverRecord(run,"production-prep","R5 mesh-guarded profile",{classCounts:counts,sliderPriorities:profile.rows,canonEvalLimit:SAMMY_PRODUCTION_CANON_EVALS[run.mode]});
}
async function sammyProductionStepOffline(run){
 const i=run.cursor,t=run.targets[i],base=sammySolverSolveTarget(run,t.measures,t.shape),u=sammyProductionMetricAdd(run,i,t,base),probeState={blocked:[],attemptCounts:{}},probe=sammyCanonicalNextProposal(run,t.measures,t.shape,base.ds,probeState),d=run.proposalDiagnostics;
 d.count++;if(probe){d.available++;d.predictedFitDeltaSum+=Number(probe.surrogateFitDeltaCm||0);d.costReductionSum+=Number(probe.costReductionPct||0);d.byClass[probe.class]=(d.byClass[probe.class]||0)+1;}
 if(run.truthTargetIndices.includes(i))run.productionSeeds[String(i)]=base.ds;
 await sammySolverRecord(run,"production-offline",`R5 offline ${i+1}`,{targetIndex:i,sourceId:t.sourceId,baseline:{surrogateRmseCm:base.weightedRmseCm,usage:u,solutionDs:base.ds},firstCanonicalProposal:probe?{sliderId:probe.sliderId,class:probe.class,alpha:probe.alpha,surrogateFitDeltaCm:probe.surrogateFitDeltaCm,costReductionPct:probe.costReductionPct}:null});
 run.cursor++;
 if(run.cursor%10===0||run.cursor>=run.inverseTargetCount)sammySolverLive("R5 OFFLINE PRECHECK",[["Holdout",`${run.cursor}/${run.inverseTargetCount}`],["R2 Fit",`${base.weightedRmseCm} cm`],["Mesh cleanup",probe?`${probe.class} proposal`:`kein sicherer Vorschlag`]]);
 if(run.cursor>=run.inverseTargetCount){sammyProductionMetricFinalize(run);run.productionTruth={};for(const s of SAMMY_PRODUCTION_STRATEGIES)run.productionTruth[s]={sumSqInitial:0,countInitial:0,sumSqBest:0,countBest:0,perSumSq:{},perCount:{},bodyRmseValues:[],cases:[],usage:{activeSum:0,costSum:0,count:0,classSum:{},classCount:{}}};run.stage="productionTruth";run.cursor=0;run.truthSlot=0;run.truthPhase="target";run.truthPass=1;run.truthEval=0;}
}
function sammyProductionBaselineCorrection(run,state,actual,target){
 const model=sammySolverHydrate(run),sex=state.sex,weights=sammySolverMeasureWeights(model.measureIds),err=new Float64Array(model.m);for(let j=0;j<model.m;j++)err[j]=target[j]-actual[j];
 const fixed=sammySolverKnownContextDs(model,state.targetShape,sex).fixed,{lo,hi}=sammySolverBounds(model,sex),base=Float64Array.from(state.bestDs||state.ds),worsened=Number.isFinite(state.bestRmseCm)&&Number.isFinite(state.lastRmseCm)&&state.bestRmseCm<state.lastRmseCm-1e-6,step=sammySolverDampedStep(model,base,sex,err,weights,fixed,1.2,worsened?.08:.12),nd=Float64Array.from(base),alpha=worsened?.35:.55;
 for(let i=0;i<model.n;i++)if(!fixed.has(i))nd[i]=Math.max(lo[i],Math.min(hi[i],nd[i]+alpha*step[i]));return Array.from(nd);
}
function sammyProductionTruthAccumulate(run,strategy,targetIndex,t,state,target){
 const model=sammySolverHydrate(run),m=run.productionTruth[strategy],r=Number(state.bestRmseCm),u=sammyProductionUsage(run,state.bestDs,t.shape);
 m.sumSqBest+=r*r;m.countBest++;m.bodyRmseValues.push(r);
 for(let j=0;j<model.m;j++){const e=Number(state.bestActual?.[j])-Number(target[j]),id=model.measureIds[j];m.perSumSq[id]=(m.perSumSq[id]||0)+e*e;m.perCount[id]=(m.perCount[id]||0)+1;}
 m.usage.activeSum+=u.activeCount;m.usage.costSum+=u.priorityCost;m.usage.count++;for(const [c,v] of Object.entries(u.classRms)){m.usage.classSum[c]=(m.usage.classSum[c]||0)+v;m.usage.classCount[c]=(m.usage.classCount[c]||0)+1;}
 m.cases.push({targetIndex,sourceId:t.sourceId,initialRmseCm:state.initialRmseCm,bestRmseCm:r,passes:Number(state.passes||SAMMY_SOLVER_CONFIG[run.mode].truthPasses),activeCount:u.activeCount,priorityCost:u.priorityCost,classRms:u.classRms,canonicalization:state.canonicalization||null});
}
function sammyProductionFinalizeTruth(run){
 const model=sammySolverHydrate(run);
 for(const [,m] of Object.entries(run.productionTruth)){
  m.initialOverallRmseCm=m.countInitial?Number(Math.sqrt(m.sumSqInitial/m.countInitial).toFixed(4)):null;m.bestOverallRmseCm=m.countBest?Number(Math.sqrt(m.sumSqBest/m.countBest).toFixed(4)):null;m.p90BodyRmseCm=sammyProductionPercentile(m.bodyRmseValues,.90);m.p95BodyRmseCm=sammyProductionPercentile(m.bodyRmseValues,.95);m.maxBodyRmseCm=m.bodyRmseValues.length?Number(Math.max(...m.bodyRmseValues).toFixed(4)):null;m.rmseByMeasure={};
  for(const id of model.measureIds){const n=m.perCount[id]||0;if(n)m.rmseByMeasure[id]=Number(Math.sqrt(m.perSumSq[id]/n).toFixed(4));}
  m.meanActiveSliders=m.usage.count?Number((m.usage.activeSum/m.usage.count).toFixed(2)):null;m.meanPriorityCost=m.usage.count?Number((m.usage.costSum/m.usage.count).toFixed(6)):null;m.classUsageRms={};for(const c of Object.keys(m.usage.classSum))m.classUsageRms[c]=Number((m.usage.classSum[c]/Math.max(1,m.usage.classCount[c])).toFixed(4));m.cases.sort((a,b)=>b.bestRmseCm-a.bestRmseCm);m.worstCases=m.cases.slice(0,20);delete m.cases;delete m.usage;delete m.bodyRmseValues;
 }
 run.meshComparison=sammyProductionCompareTruth(run.productionTruth);
}
function sammyProductionCompareTruth(truth){
 const b=truth?.baseline,p=truth?.production;if(!b||!p)return null;
 const pct=(before,after)=>Number.isFinite(before)&&Math.abs(before)>1e-12?Number((100*(before-after)/Math.abs(before)).toFixed(2)):null,delta=Number(((p.bestOverallRmseCm??0)-(b.bestOverallRmseCm??0)).toFixed(4)),guard=delta<=SAMMY_PRODUCTION_BODY_GUARD_CM+.002,costReduction=pct(b.meanPriorityCost,p.meanPriorityCost),translationReduction=pct(b.classUsageRms?.translation,p.classUsageRms?.translation),scaleReduction=pct(b.classUsageRms?.scale,p.classUsageRms?.scale),ready=guard&&Number(costReduction||0)>0;
 return {meshDeltaCm:delta,meshDeltaPct:Number.isFinite(b.bestOverallRmseCm)&&b.bestOverallRmseCm?Number((100*delta/b.bestOverallRmseCm).toFixed(2)):null,priorityCostReductionPct:costReduction,activeSliderReductionPct:pct(b.meanActiveSliders,p.meanActiveSliders),scaleUsageReductionPct:scaleReduction,translationUsageReductionPct:translationReduction,fitGuardCm:SAMMY_PRODUCTION_BODY_GUARD_CM,passesFitGuard:guard,productionReady:ready};
}
function sammyCanonicalFinishTarget(run,targetIndex,t,target,cstate){
 const finalState={initialRmseCm:cstate.baselineRmseCm,bestRmseCm:cstate.currentRmseCm,bestDs:Array.from(cstate.currentDs),bestActual:Array.from(cstate.currentActual),passes:cstate.evaluations,canonicalization:{evaluations:cstate.evaluations,accepted:cstate.accepted,rejected:cstate.rejected,costBefore:Number(cstate.baselineCost.toFixed(6)),costAfter:Number(cstate.currentCost.toFixed(6)),costReductionPct:cstate.baselineCost>1e-12?Number((100*(cstate.baselineCost-cstate.currentCost)/cstate.baselineCost).toFixed(2)):0,blockedSliderCount:(cstate.blocked||[]).length,acceptedByClass:cstate.acceptedByClass||{},rejectedByReason:cstate.rejectedByReason||{}}};
 const m=run.productionTruth.production;m.sumSqInitial+=cstate.baselineRmseCm*cstate.baselineRmseCm;m.countInitial++;sammyProductionTruthAccumulate(run,"production",targetIndex,t,finalState,target);delete run.productionTruthState[`canonical:${targetIndex}`];
 run.truthSlot++;run.truthPhase="target";run.truthPass=1;run.truthEval=0;run.cursor=run.truthSlot;
}
async function sammyProductionStepTruth(run){
 const cfg=SAMMY_SOLVER_CONFIG[run.mode],slot=run.truthSlot||0;
 if(slot>=run.truthTargetIndices.length){sammyProductionFinalizeTruth(run);run.stage="complete";run.completedAt=new Date().toISOString();run.cursor=1;return;}
 const targetIndex=run.truthTargetIndices[slot],t=run.targets[targetIndex],model=sammySolverHydrate(run),phase=run.truthPhase||"target";
 if(phase==="target"){
  const sourceShape={core:{...t.shape.core},local:Object.fromEntries(t.shape.local||[])},results=await sammySolverApplyShape(sourceShape),target=sammySolverMeasureArray(results,model);run.productionTruthTargets[String(targetIndex)]=Array.from(target);run.truthPhase="baseline";run.truthPass=1;
  sammySolverLive(`Mesh Ziel ${slot+1}/${run.truthTargetIndices.length}`,[["aktuelle Landmark-Maße","erfasst"],["Ablauf","R2 fit → echter Mesh-Guard"]]);
  await sammySolverRecord(run,"production-truth-target",`R5 truth target ${targetIndex}`,{targetIndex,sourceId:t.sourceId,currentTargetMeasures:Object.fromEntries(model.measureIds.map((id,j)=>[id,Number(target[j].toFixed(4))]))});return;
 }
 const target=Float64Array.from(run.productionTruthTargets[String(targetIndex)]),targetObj=Object.fromEntries(model.measureIds.map((id,j)=>[id,target[j]]));
 if(phase==="baseline"){
  const key=`baseline:${targetIndex}`;let st=run.productionTruthState[key];
  if(!st){const seed=run.productionSeeds[String(targetIndex)],fresh=sammySolverSolveTarget(run,targetObj,t.shape,null,seed);st=run.productionTruthState[key]={targetIndex,targetShape:t.shape,sex:fresh.sex,ds:fresh.ds,bestDs:Array.from(fresh.ds),bestRmseCm:Infinity,lastRmseCm:Infinity,bestActual:null,initialRmseCm:null};}
  const shape=sammySolverDsToShape(run,st.ds,st.sex,t.shape),results=await sammySolverApplyShape(shape),actual=sammySolverMeasureArray(results,model),all=sammySolverRMSE(target,actual),weighted=sammySolverRMSE(target,actual,sammySolverMeasureWeights(model.measureIds)),pass=run.truthPass||1;
  if(pass===1){st.initialRmseCm=Number(all.toFixed(4));const m=run.productionTruth.baseline;m.sumSqInitial+=all*all;m.countInitial++;}
  st.lastRmseCm=Number(all.toFixed(4));if(all<Number(st.bestRmseCm??Infinity)){st.bestRmseCm=Number(all.toFixed(4));st.bestDs=Array.from(st.ds);st.bestActual=Array.from(actual);}
  sammySolverLive(`R2 Baseline · ${slot+1}/${run.truthTargetIndices.length}`,[["Pass",`${pass}/${cfg.truthPasses}`],["aktuell",`${all.toFixed(3)} cm`],["best",`${Number(st.bestRmseCm).toFixed(3)} cm`]]);
  await sammySolverRecord(run,"production-truth-pass",`baseline truth ${targetIndex} pass ${pass}`,{strategy:"baseline",targetIndex,pass,actualRmseCm:Number(all.toFixed(4)),weightedRmseCm:Number(weighted.toFixed(4)),bestRmseCm:st.bestRmseCm,solutionDs:Array.from(st.ds)});
  if(pass<cfg.truthPasses){st.ds=sammyProductionBaselineCorrection(run,st,actual,target);run.truthPass=pass+1;return;}
  sammyProductionTruthAccumulate(run,"baseline",targetIndex,t,{...st,passes:cfg.truthPasses},target);
  const baseCost=sammyProductionCost(run,st.bestDs,t.shape);run.productionTruthState[`canonical:${targetIndex}`]={targetIndex,targetShape:t.shape,sex:st.sex,baselineDs:Array.from(st.bestDs),baselineActual:Array.from(st.bestActual),baselineRmseCm:Number(st.bestRmseCm),baselineCost:baseCost,currentDs:Array.from(st.bestDs),currentActual:Array.from(st.bestActual),currentRmseCm:Number(st.bestRmseCm),currentCost:baseCost,evaluations:0,accepted:0,rejected:0,blocked:[],attemptCounts:{},acceptedByClass:{},rejectedByReason:{},pending:null};delete run.productionTruthState[key];run.truthPhase="canonical";run.truthEval=0;return;
 }
 if(phase==="canonical"){
  const key=`canonical:${targetIndex}`,cs=run.productionTruthState[key],maxEvals=SAMMY_PRODUCTION_CANON_EVALS[run.mode]||10;
  if(!cs||cs.evaluations>=maxEvals){if(cs)sammyCanonicalFinishTarget(run,targetIndex,t,target,cs);else{run.truthSlot++;run.truthPhase="target";}return;}
  let proposal=cs.pending;
  if(!proposal)proposal=sammyCanonicalNextProposal(run,targetObj,t.shape,cs.currentDs,cs);
  if(!proposal){sammyCanonicalFinishTarget(run,targetIndex,t,target,cs);return;}
  const shape=sammySolverDsToShape(run,proposal.ds,cs.sex,t.shape),results=await sammySolverApplyShape(shape),actual=sammySolverMeasureArray(results,model),guard=sammyCanonicalGuard(run,cs,target,actual,proposal);cs.evaluations++;run.truthEval=cs.evaluations;
  const cls=proposal.class,id=proposal.sliderId;cs.attemptCounts[proposal.targetIndex]=Number(cs.attemptCounts[proposal.targetIndex]||0)+1;
  if(guard.accepted){cs.accepted++;cs.acceptedByClass[cls]=(cs.acceptedByClass[cls]||0)+1;cs.currentDs=Array.from(proposal.ds);cs.currentActual=Array.from(actual);cs.currentRmseCm=guard.candidateRmseCm;cs.currentCost=proposal.costAfter;cs.pending=null;if(Math.abs(Number(cs.currentDs[proposal.targetIndex]||0))<.06){const b=new Set(cs.blocked||[]);b.add(proposal.targetIndex);cs.blocked=Array.from(b);}}
  else{cs.rejected++;const reason=!guard.costOk?"cost":(!guard.bodyOk?"body":"measure");cs.rejectedByReason[reason]=(cs.rejectedByReason[reason]||0)+1;cs.pending=sammyCanonicalRetryProposal(run,targetObj,t.shape,cs.currentDs,cs,proposal);}
  const reduction=cs.baselineCost>1e-12?100*(cs.baselineCost-cs.currentCost)/cs.baselineCost:0;
  sammySolverLive(`R5 MESH-GUARD · ${slot+1}/${run.truthTargetIndices.length}`,[["Test",`${cs.evaluations}/${maxEvals}`],["Slider",id],["Ergebnis",guard.accepted?"ACCEPT":"ROLLBACK"],["Mesh",`${guard.candidateRmseCm} / ≤${guard.bodyLimitCm} cm`],["Prior-Kosten",`−${reduction.toFixed(1)}%`]]);
  await sammySolverRecord(run,"production-canonical-eval",`R5 canonical ${targetIndex} eval ${cs.evaluations}`,{targetIndex,sourceId:t.sourceId,sliderId:id,class:cls,alpha:proposal.alpha,alphaPos:proposal.alphaPos,proposal:{surrogateFitBeforeCm:proposal.surrogateFitBeforeCm,surrogateFitAfterCm:proposal.surrogateFitAfterCm,costBefore:proposal.costBefore,costAfter:proposal.costAfter,costReductionPct:proposal.costReductionPct,targetValueBefore:proposal.targetValueBefore,targetValueAfter:proposal.targetValueAfter},meshGuard:guard,accepted:guard.accepted,currentRmseCm:cs.currentRmseCm,currentCost:Number(cs.currentCost.toFixed(6)),solutionDs:guard.accepted?Array.from(cs.currentDs):null});
  if(cs.evaluations>=maxEvals)sammyCanonicalFinishTarget(run,targetIndex,t,target,cs);return;
 }
 throw new Error(`Unbekannte R5 Truth-Phase ${phase}`);
}
async function sammyProductionRunner(){
 const run=sammySolverLab.run;if(!run)return;sammySolverLab.running=true;sammySolverLab.paused=false;sammySolverLab.cancelRequested=false;sammySolverStatus("Production Solver R5 startet …");
 try{
  while(sammySolverLab.running&&!sammySolverLab.paused&&!sammySolverLab.cancelRequested&&run.stage!=="complete"){
   if(run.stage==="productionPrep")await sammyProductionStepPrep(run);else if(run.stage==="productionOffline")await sammyProductionStepOffline(run);else if(run.stage==="productionTruth")await sammyProductionStepTruth(run);else throw new Error(`Unbekannte Production-Stufe ${run.stage}`);
   await sammySolverPutRun(run);sammySolverStatus();
  }
  if(run.stage==="complete"){
   sammySolverLab.running=false;sammySolverLab.lastRun=run;const b=run.productionTruth?.baseline?.bestOverallRmseCm,p=run.productionTruth?.production?.bestOverallRmseCm,g=run.meshComparison?.passesFitGuard;
   sammySolverStatus(`Fertig · R2 ${b??"—"} cm · R5 ${p??"—"} cm · Mesh-Guard ${g?"PASS":"CHECK"}`);
   sammySolverLive("PRODUCTION SOLVER R5 FERTIG",[["R2 Baseline",`${b??"—"} cm`],["R5 Mesh-Guarded",`${p??"—"} cm`],["Fit-Guard",g?"PASS":"CHECK"],["Translation Δ",`${run.meshComparison?.translationUsageReductionPct??"—"}%`]]);
  }
 }catch(e){console.error("Production Solver R5",e);sammySolverLab.running=false;sammySolverLab.paused=true;sammySolverStatus(`FEHLER: ${e?.message||e}`);sammyReportError?.(e,{source:"Solver Lab R5"});}
 finally{sammySolverLab.running=false;sammySolverStatus();}
}
async function sammyProductionStartOrResume(){
 if(sammySolverLab.running)return;if(sammyCalibration?.running){sammySolverStatus("Calibration Lab läuft noch · zuerst pausieren.");return;}if(!annyPackLoaded){sammySolverStatus("Anny-Pack ist noch nicht bereit.");return;}if(!sammyMeasureSession){sammySolverStatus("MEAS zuerst öffnen.");return;}
 let run=sammySolverLab.run;
 if(!run||run.schema!==SAMMY_PRODUCTION_SCHEMA||run.stage==="complete"){
  const source=await sammyProductionFindSource();if(!source){sammySolverStatus("Kein abgeschlossener Solver-R2-Lauf in IndexedDB gefunden. Bitte zuerst R2 abschließen/importieren.");return;}
  run=sammyProductionNewRun(sammySolverLab.mode,source);sammySolverLab.run=run;sammySolverRuntimeCache=null;await sammySolverPutRun(run);sammySolverStatus(`R2-Quelle ${source.appVersion} · ${source.targets.length} Holdouts · R5 erzeugt keine neue Kalibrierung`);
 }
 sammySolverLab.paused=false;sammySolverLab.cancelRequested=false;sammyProductionRunner();
}
async function sammyProductionLoadLatest(){
 try{
  const runs=(await sammySolverGetRuns()).filter(r=>r?.schema===SAMMY_PRODUCTION_SCHEMA).sort((a,b)=>String(b.updatedAt||"").localeCompare(String(a.updatedAt||""))),active=runs.find(r=>r.stage!=="complete")||runs[0]||null;sammySolverLab.run=active;sammySolverLab.lastRun=active;sammySolverRuntimeCache=null;
  if(active){sammySolverLab.mode=active.mode||"standard";document.querySelectorAll("[data-solver-mode]").forEach(b=>b.classList.toggle("active",b.dataset.solverMode===sammySolverLab.mode));sammySolverStatus(active.stage==="complete"?`Letzter R5-Lauf fertig · Mesh ${active.productionTruth?.production?.bestOverallRmseCm??"—"} cm`:"Gespeicherter R5-Lauf kann fortgesetzt werden.");}
  else{const src=await sammyProductionFindSource();sammySolverStatus(src?`R2-Quelle bereit · ${src.targets.length} Holdouts · R5 kann starten.`:"Kein abgeschlossener R2-Lauf gefunden.");}
 }catch(e){console.warn("Production R5 resume",e);}
}
function sammyProductionSummary(run){
 const prof=run.productionProfile?{classCounts:run.productionProfile.classCounts,sliderPriorities:run.productionProfile.rows}:null;
 return {schema:"sammy-solver-production-summary-v2",runId:run.runId,appVersion:run.appVersion,mode:run.mode,createdAt:run.createdAt,completedAt:run.completedAt||null,sourceSolver:{runId:run.sourceSolverRunId,version:run.sourceSolverVersion,calibrationRunId:run.calibrationRunId,calibrationVersion:run.calibrationVersion},profile:prof,offline:{baseline:run.offlineBaseline,proposalDiagnostics:run.proposalDiagnostics},mesh:run.productionTruth,meshComparison:run.meshComparison,notes:run.notes};
}
async function sammyProductionExport(summaryOnly=false){
 const run=sammySolverLab.run||sammySolverLab.lastRun;if(!run||run.schema!==SAMMY_PRODUCTION_SCHEMA){sammySolverStatus("Kein Solver-R5-Lauf zum Exportieren.");return;}
 const summary=sammyProductionSummary(run),base={schema:SAMMY_PRODUCTION_SCHEMA,app:"Sammy",version:"0.8.10",generated:new Date().toISOString(),purpose:"Production Solver R5: mesh-refined R2 fit first; targeted Scale/Translation canonicalization only when each proposed change passes the real current-mesh guard.",summary};let payload=base;
 if(!summaryOnly){const records=await sammySolverGetRecords(run.runId);payload={...base,run,records};}
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=summaryOnly?`Sammy_SolverR5_Summary_${run.mode}_${run.runId}.json`:`Sammy_SolverR5_FULL_${run.mode}_${run.runId}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500);sammySolverStatus(summaryOnly?"Solver-R5-Summary exportiert.":"Solver-R5-FULL exportiert.");
}

function sammySolverInitUI(){document.querySelectorAll("[data-solver-mode]").forEach(b=>b.onclick=()=>sammySolverSetMode(b.dataset.solverMode));const start=$("#sammySolverStart"),pause=$("#sammySolverPause"),reset=$("#sammySolverReset"),sum=$("#sammySolverSummaryExport"),full=$("#sammySolverExport");if(start)start.onclick=sammyProductionStartOrResume;if(pause)pause.onclick=sammySolverPause;if(reset)reset.onclick=sammySolverReset;if(sum)sum.onclick=()=>sammyProductionExport(true);if(full)full.onclick=()=>sammyProductionExport(false);sammySolverSetMode("standard");sammyProductionLoadLatest()}


// -----------------------------------------------------------------------------
// Sammy v0.8.11 DIMENSIONS + R5 validation/stress loop
// Strictly additive subsystem. Existing R5/MEAS/Anny/SOMA/Rig paths are reused
// without modification. Full targets (31 cm measures) -> R5 production solve.
// Test loop mixes preserved R2 validation holdouts with fresh deterministic
// plausible and edge bodies, and evaluates the actual current mesh end-to-end.
// -----------------------------------------------------------------------------
const SAMMY_DIMENSIONS_SCHEMA="sammy-dimensions-validation-v1";
const SAMMY_DIMENSIONS_VERSION="0.8.11";
const SAMMY_DIMENSIONS_TEST_CONFIG={
 quick:{label:"Quick",bodies:8,canonEvals:6},
 standard:{label:"Standard",bodies:30,canonEvals:10},
 deep:{label:"Deep",bodies:80,canonEvals:14},
 stress:{label:"Stress",bodies:160,canonEvals:14}
};
const sammyDimensionsLab={mode:"deep",run:null,lastRun:null,running:false,paused:false,cancelRequested:false,manualRunning:false,sex:0};
let sammyDimensionsSourceCache=null;

function sammyDimensionsYearsToShapeAge(years,gender=0){
 const lo=sammyAdultMinYears(gender),y=Math.max(lo,Math.min(SAMMY_ADULT_MAX_YEARS,Number(years)||lo)),t=(y-lo)/Math.max(1e-9,SAMMY_ADULT_MAX_YEARS-lo);
 return sammyClampAdultShapeAge(SAMMY_ADULT_SHAPE_AGE_MIN+t*(SAMMY_ADULT_SHAPE_AGE_MAX-SAMMY_ADULT_SHAPE_AGE_MIN));
}
function sammyDimensionsContextShape(){
 const sex=sammyDimensionsLab.sex>=.5?1:0,ageInput=$("#sammyDimensionsAge"),years=Number(ageInput?.value)||Math.round(sammyShapeAgeToYears(annyParams.age,sex)),age=sammyDimensionsYearsToShapeAge(years,sex);
 return {core:{gender:sex,age},local:{}};
}
function sammyDimensionsMeasureObject(results){return Object.fromEntries(SAMMY_MEASURE_DEFS.map(d=>[d.id,Number(results?.[d.id]?.valueCm)]))}
function sammyDimensionsReadTargets(){
 const out={};let missing=[];
 for(const d of SAMMY_MEASURE_DEFS){const el=document.querySelector(`[data-dim-measure="${d.id}"]`),v=Number(el?.value);if(!Number.isFinite(v)||v<=0)missing.push(d.label);else out[d.id]=v;}
 return {targets:out,missing};
}
function sammyDimensionsFillTargets(results=sammyMeasureResultsCache){
 if(!results)results=sammyComputeAllMeasures();
 for(const d of SAMMY_MEASURE_DEFS){const el=document.querySelector(`[data-dim-measure="${d.id}"]`),v=Number(results?.[d.id]?.valueCm);if(el&&Number.isFinite(v))el.value=v.toFixed(2);}
 const sex=annyParams.gender>=.5?1:0;sammyDimensionsSetSex(sex);const age=$("#sammyDimensionsAge");if(age)age.value=String(Math.round(sammyShapeAgeToYears(annyParams.age,sex)));
 sammyDimensionsStatus("Aktueller Körper als 31 Zielmaße übernommen.");
}
function sammyDimensionsSetSex(sex){
 sammyDimensionsLab.sex=Number(sex)>=.5?1:0;
 document.querySelectorAll("[data-dim-sex]").forEach(b=>b.classList.toggle("active",Number(b.dataset.dimSex)===sammyDimensionsLab.sex));
 const age=$("#sammyDimensionsAge");if(age){age.min=String(Math.round(sammyAdultMinYears(sammyDimensionsLab.sex)));const v=Math.max(Number(age.min),Math.min(70,Number(age.value)||35));age.value=String(v);}
}
function sammyDimensionsRenderInputs(){
 const host=$("#sammyDimensionsInputs");if(!host)return;
 host.innerHTML=SAMMY_MEASURE_DEFS.map(d=>`<label class="sammyDimensionsMeasureRow"><span>${escapeHtml(d.label)}</span><input type="number" inputmode="decimal" step="0.1" min="1" data-dim-measure="${escapeHtml(d.id)}" placeholder="cm"><em>cm</em></label>`).join("");
}
function sammyDimensionsRenderResult(targets,actual,summary){
 const host=$("#sammyDimensionsResult");if(!host)return;
 const rows=SAMMY_MEASURE_DEFS.map(d=>{const t=Number(targets?.[d.id]),a=Number(actual?.[d.id]),e=a-t;return `<div class="sammyDimensionsResultRow"><span>${escapeHtml(d.label)}</span><b>${Number.isFinite(t)?t.toFixed(1):"—"}</b><b>${Number.isFinite(a)?a.toFixed(1):"—"}</b><strong class="${Math.abs(e)>.75?"warn":""}">${Number.isFinite(e)?`${e>=0?"+":""}${e.toFixed(2)}`:"—"}</strong></div>`}).join("");
 host.innerHTML=`<div class="sammyDimensionsResultSummary"><b>R5 Ergebnis</b><span>Mesh-RMSE <strong>${summary.finalRmseCm.toFixed(3)} cm</strong></span><span>R2 vorher <strong>${summary.baselineRmseCm.toFixed(3)} cm</strong></span><span>Cleanup <strong>${summary.canonicalization.accepted}/${summary.canonicalization.evaluations} akzeptiert</strong></span></div><div class="sammyDimensionsResultHead"><span>Maß</span><b>Ziel</b><b>Ist</b><strong>Δ</strong></div>${rows}`;
}
function sammyDimensionsStatus(detail=""){
 const run=sammyDimensionsLab.run||sammyDimensionsLab.lastRun,st=$("#sammyDimensionsTestStatus"),bar=$("#sammyDimensionsTestProgress"),start=$("#sammyDimensionsTestStart"),pause=$("#sammyDimensionsTestPause"),reset=$("#sammyDimensionsTestReset"),cur=$("#sammyDimensionsTestCurrent");
 if(run){const total=Number(run.totalBodies||1),cursor=Number(run.cursor||0),pct=Math.min(1,cursor/Math.max(1,total));if(st)st.textContent=`${run.stage==="complete"?"Fertig":"Test"} · ${Math.min(cursor,total)} / ${total}${sammyDimensionsLab.paused?" · PAUSE":""}`;if(bar)bar.style.width=`${(100*pct).toFixed(1)}%`;}else{if(st)st.textContent="Bereit · R5-Quelle wird automatisch verwendet.";if(bar)bar.style.width="0%";}
 if(cur&&detail)cur.textContent=detail;if(start){start.disabled=sammyDimensionsLab.running||sammyDimensionsLab.manualRunning;start.textContent=sammyDimensionsLab.running?"Läuft …":(run&&run.stage!=="complete"?"Fortsetzen":"Testschleife starten");}if(pause)pause.disabled=!sammyDimensionsLab.running;if(reset)reset.disabled=sammyDimensionsLab.running;
}
function sammyDimensionsLive(title,rows=[]){const el=$("#sammyDimensionsTestLive");if(!el)return;el.innerHTML=`<b>${escapeHtml(title)}</b>`+rows.map(([a,b])=>`<span>${escapeHtml(a)} <strong>${escapeHtml(String(b))}</strong></span>`).join("")}
function sammyDimensionsSetMode(mode){if(!SAMMY_DIMENSIONS_TEST_CONFIG[mode]||sammyDimensionsLab.running)return;sammyDimensionsLab.mode=mode;document.querySelectorAll("[data-dim-mode]").forEach(b=>b.classList.toggle("active",b.dataset.dimMode===mode));const c=SAMMY_DIMENSIONS_TEST_CONFIG[mode];sammyDimensionsStatus(`${c.label}: ${c.bodies} echte End-to-End-Körper · davon 20 % bekannte Regression, 60 % frisch plausibel, 20 % Edge · Fortschritt wird nach jedem Körper gespeichert.`)}

async function sammyDimensionsFindSource(){
 if(sammyDimensionsSourceCache?.stage==="complete")return sammyDimensionsSourceCache;
 const src=await sammyProductionFindSource();sammyDimensionsSourceCache=src;return src;
}
function sammyDimensionsRuntimeFromSource(source,runId="dimensions-manual"){
 const runtime={runId:`${runId}:r5`,model:source.model,mode:"deep",productionProfile:null};const model=sammySolverHydrate(runtime),profile=sammyProductionProfile(model,0),counts={};for(const row of profile.rows)counts[row.class]=(counts[row.class]||0)+1;runtime.productionProfile={...profile,classCounts:counts};return runtime;
}
function sammyDimensionsRuntimeFromRun(run){return {runId:`${run.runId}:r5`,model:run.model,mode:"deep",productionProfile:run.productionProfile}}

async function sammyDimensionsSolveEngine(runtime,targetMeasures,contextShape,canonEvalLimit=14,onProgress=null,restoreFinal=false){
 const model=sammySolverHydrate(runtime),target=Float64Array.from(model.measureIds.map(id=>Number(targetMeasures[id]))),weights=sammySolverMeasureWeights(model.measureIds),fresh=sammySolverSolveTarget(runtime,targetMeasures,contextShape),cfg=SAMMY_SOLVER_CONFIG.deep;
 const st={targetShape:contextShape,sex:fresh.sex,ds:Array.from(fresh.ds),bestDs:Array.from(fresh.ds),bestRmseCm:Infinity,lastRmseCm:Infinity,bestActual:null,initialRmseCm:null};
 for(let pass=1;pass<=cfg.truthPasses;pass++){
  const shape=sammySolverDsToShape(runtime,st.ds,st.sex,contextShape),results=await sammySolverApplyShape(shape),actual=sammySolverMeasureArray(results,model),rmse=sammySolverRMSE(target,actual),weighted=sammySolverRMSE(target,actual,weights);if(pass===1)st.initialRmseCm=Number(rmse.toFixed(4));st.lastRmseCm=Number(rmse.toFixed(4));if(rmse<Number(st.bestRmseCm)){st.bestRmseCm=Number(rmse.toFixed(4));st.bestDs=Array.from(st.ds);st.bestActual=Array.from(actual);st.bestWeightedRmseCm=Number(weighted.toFixed(4));}
  if(onProgress)onProgress({phase:"fit",pass,total:cfg.truthPasses,rmseCm:rmse,bestRmseCm:st.bestRmseCm});if(pass<cfg.truthPasses)st.ds=sammyProductionBaselineCorrection(runtime,st,actual,target);
 }
 const baselineUsage=sammyProductionUsage(runtime,st.bestDs,contextShape),cs={baselineRmseCm:Number(st.bestRmseCm),baselineActual:Array.from(st.bestActual),baselineCost:Number(sammyProductionCost(runtime,st.bestDs,contextShape)),currentRmseCm:Number(st.bestRmseCm),currentActual:Array.from(st.bestActual),currentDs:Array.from(st.bestDs),sex:st.sex,currentCost:Number(sammyProductionCost(runtime,st.bestDs,contextShape)),blocked:[],attemptCounts:{},pending:null,evaluations:0,accepted:0,rejected:0,acceptedByClass:{},rejectedByReason:{}};
 let pending=null;
 while(cs.evaluations<canonEvalLimit){
  let proposal=pending||sammyCanonicalNextProposal(runtime,targetMeasures,contextShape,cs.currentDs,cs);pending=null;if(!proposal)break;
  const shape=sammySolverDsToShape(runtime,proposal.ds,cs.sex,contextShape),results=await sammySolverApplyShape(shape),actual=sammySolverMeasureArray(results,model),guard=sammyCanonicalGuard(runtime,cs,target,actual,proposal);cs.evaluations++;cs.attemptCounts[proposal.targetIndex]=Number(cs.attemptCounts[proposal.targetIndex]||0)+1;
  if(guard.accepted){cs.accepted++;cs.acceptedByClass[proposal.class]=(cs.acceptedByClass[proposal.class]||0)+1;cs.currentDs=Array.from(proposal.ds);cs.currentActual=Array.from(actual);cs.currentRmseCm=guard.candidateRmseCm;cs.currentCost=proposal.costAfter;if(Math.abs(Number(cs.currentDs[proposal.targetIndex]||0))<.06){const b=new Set(cs.blocked||[]);b.add(proposal.targetIndex);cs.blocked=Array.from(b);}}
  else{cs.rejected++;const reason=!guard.costOk?"cost":(!guard.bodyOk?"body":"measure");cs.rejectedByReason[reason]=(cs.rejectedByReason[reason]||0)+1;pending=sammyCanonicalRetryProposal(runtime,targetMeasures,contextShape,cs.currentDs,cs,proposal);}
  if(onProgress)onProgress({phase:"canonical",evaluation:cs.evaluations,total:canonEvalLimit,accepted:guard.accepted,sliderId:proposal.sliderId,rmseCm:guard.candidateRmseCm,currentRmseCm:cs.currentRmseCm});
 }
 if(restoreFinal){const finalShape=sammySolverDsToShape(runtime,cs.currentDs,cs.sex,contextShape),finalResults=await sammySolverApplyShape(finalShape);cs.currentActual=Array.from(sammySolverMeasureArray(finalResults,model));cs.currentRmseCm=Number(sammySolverRMSE(target,cs.currentActual).toFixed(4));}
 const finalUsage=sammyProductionUsage(runtime,cs.currentDs,contextShape),canon={evaluations:cs.evaluations,accepted:cs.accepted,rejected:cs.rejected,costBefore:Number(cs.baselineCost.toFixed(6)),costAfter:Number(cs.currentCost.toFixed(6)),costReductionPct:cs.baselineCost>1e-12?Number((100*(cs.baselineCost-cs.currentCost)/cs.baselineCost).toFixed(2)):0,acceptedByClass:cs.acceptedByClass,rejectedByReason:cs.rejectedByReason,blockedSliderCount:(cs.blocked||[]).length};
 return {baseline:{initialRmseCm:st.initialRmseCm,bestRmseCm:Number(st.bestRmseCm),actual:Array.from(st.bestActual),ds:Array.from(st.bestDs),usage:baselineUsage,surrogateRmseCm:fresh.weightedRmseCm},production:{bestRmseCm:Number(cs.currentRmseCm),actual:Array.from(cs.currentActual),ds:Array.from(cs.currentDs),usage:finalUsage},canonicalization:canon};
}

function sammyDimensionsRand(seed){let x=(Number(seed)||1)>>>0;return ()=>{x=(x+0x6D2B79F5)>>>0;let t=x;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296}}
function sammyDimensionsFreshShape(runtime,index,kind){
 const model=sammySolverHydrate(runtime),rnd=sammyDimensionsRand(0x51A77EED+index*104729+(kind==="edge"?7919:0)),sex=index%2,ref=model.refs[sex?"female_avg":"male_avg"],ds=new Float64Array(model.n),{lo,hi}=sammySolverBounds(model,sex),edge=kind==="edge";
 const setAbs=(id,val)=>{const i=model.sliderIndex[id];if(i==null)return;const d=model.sliderDefs[i],r=sammySolverRefValue(ref,d);ds[i]=Math.max(lo[i],Math.min(hi[i],Number(val)-r));};
 const range=(a,b)=>a+(b-a)*rnd();setAbs("core:gender",sex);setAbs("core:age",range(.70,1));for(const id of ["core:height","core:weight","core:muscle","core:proportions"])setAbs(id,range(edge?.03:.12,edge?.97:.88));setAbs("core:cupsize",sex?range(edge?.03:.12,edge?.97:.88):.5);
 for(let i=0;i<model.n;i++){
  const d=model.sliderDefs[i],id=d.id;if(id.startsWith("core:"))continue;const cls=sammyProductionClass(d),prob=edge?({measure:.68,anatomical:.62,scale:.45,translation:.24}[cls]||.4):({measure:.40,anatomical:.34,scale:.18,translation:.08}[cls]||.25);if(rnd()>prob){ds[i]=0;continue;}const amp=edge?({measure:.82,anatomical:.72,scale:.48,translation:.28}[cls]||.55):({measure:.50,anatomical:.44,scale:.28,translation:.14}[cls]||.35),raw=(rnd()*2-1)*amp;ds[i]=Math.max(lo[i],Math.min(hi[i],raw));
 }
 const age=ref.core?.age!=null?Math.max(.70,Math.min(1,sammySolverRefValue(ref,model.sliderDefs[model.sliderIndex["core:age"]])+ds[model.sliderIndex["core:age"]])):range(.70,1),shape=sammySolverDsToShape(runtime,ds,sex,{core:{gender:sex,age},local:{}});shape.core.firmness=.5;shape.core.african=.5;shape.core.asian=.5;shape.core.caucasian=.5;return {shape,kind,sex,sourceId:`fresh-${kind}-${String(index).padStart(4,"0")}`};
}
function sammyDimensionsTestCase(run,index,source){
 const runtime=sammyDimensionsRuntimeFromRun(run),slot=index%5;if(slot===0&&source?.targets?.length){const j=(index*137+17)%source.targets.length,t=source.targets[j],shape={core:{...t.shape.core},local:Array.isArray(t.shape.local)?Object.fromEntries(t.shape.local):{...(t.shape.local||{})}};return {shape,kind:"regression",sex:Number(shape.core.gender)>=.5?1:0,sourceId:`r2-holdout-${j}`};}
 return sammyDimensionsFreshShape(runtime,index,slot===4?"edge":"plausible");
}
function sammyDimensionsStatsNew(model){return {count:0,baselineSumSq:0,finalSumSq:0,bodyRmse:[],baselineBodyRmse:[],thresholds:{le050:0,le075:0,le100:0,le150:0},perMeasure:Object.fromEntries(model.measureIds.map(id=>[id,{ss:0,abs:0,bias:0,count:0,maxAbs:0,absValues:[]}])),byKind:{},bySex:{male:{count:0,sumSq:0},female:{count:0,sumSq:0}},canon:{evaluations:0,accepted:0,rejected:0,costBefore:0,costAfter:0,acceptedByClass:{},rejectedByReason:{}},usage:{baseline:{classSum:{},count:0,cost:0,active:0},final:{classSum:{},count:0,cost:0,active:0}},cases:[],nonFinite:0};}
function sammyDimensionsStatsAdd(run,index,testCase,targetMeasures,result){
 const model=sammySolverHydrate(sammyDimensionsRuntimeFromRun(run)),s=run.stats,b=Number(result.baseline.bestRmseCm),f=Number(result.production.bestRmseCm);if(!Number.isFinite(f)){s.nonFinite++;return;}s.count++;s.baselineSumSq+=b*b;s.finalSumSq+=f*f;s.baselineBodyRmse.push(b);s.bodyRmse.push(f);if(f<=.5)s.thresholds.le050++;if(f<=.75)s.thresholds.le075++;if(f<=1)s.thresholds.le100++;if(f<=1.5)s.thresholds.le150++;
 const k=s.byKind[testCase.kind]||(s.byKind[testCase.kind]={count:0,sumSq:0,baselineSumSq:0});k.count++;k.sumSq+=f*f;k.baselineSumSq+=b*b;const sx=testCase.sex?"female":"male";s.bySex[sx].count++;s.bySex[sx].sumSq+=f*f;
 for(let j=0;j<model.m;j++){const id=model.measureIds[j],e=Number(result.production.actual[j])-Number(targetMeasures[id]),a=Math.abs(e),p=s.perMeasure[id];p.ss+=e*e;p.abs+=a;p.bias+=e;p.count++;p.maxAbs=Math.max(p.maxAbs,a);p.absValues.push(a);}
 const c=result.canonicalization;s.canon.evaluations+=c.evaluations;s.canon.accepted+=c.accepted;s.canon.rejected+=c.rejected;s.canon.costBefore+=c.costBefore;s.canon.costAfter+=c.costAfter;for(const [x,v] of Object.entries(c.acceptedByClass||{}))s.canon.acceptedByClass[x]=(s.canon.acceptedByClass[x]||0)+v;for(const [x,v] of Object.entries(c.rejectedByReason||{}))s.canon.rejectedByReason[x]=(s.canon.rejectedByReason[x]||0)+v;
 for(const which of ["baseline","final"]){const u=which==="baseline"?result.baseline.usage:result.production.usage,d=s.usage[which];d.count++;d.cost+=Number(u.priorityCost||0);d.active+=Number(u.activeCount||0);for(const [x,v] of Object.entries(u.classRms||{}))d.classSum[x]=(d.classSum[x]||0)+Number(v||0);}
 s.cases.push({index,sourceId:testCase.sourceId,kind:testCase.kind,sex:sx,baselineRmseCm:b,finalRmseCm:f,deltaCm:Number((f-b).toFixed(4)),canonicalization:c});
}
function sammyDimensionsStatsSummary(run){
 const s=run.stats,n=Math.max(1,s.count),pct=x=>Number((100*x/n).toFixed(1)),rm=v=>Number(Math.sqrt(v/n).toFixed(4)),byKind={},bySex={};for(const [k,v] of Object.entries(s.byKind)){byKind[k]={count:v.count,baselineRmseCm:Number(Math.sqrt(v.baselineSumSq/Math.max(1,v.count)).toFixed(4)),finalRmseCm:Number(Math.sqrt(v.sumSq/Math.max(1,v.count)).toFixed(4))};}for(const [k,v] of Object.entries(s.bySex))bySex[k]={count:v.count,rmseCm:v.count?Number(Math.sqrt(v.sumSq/v.count).toFixed(4)):null};
 const perMeasure={};for(const [id,p] of Object.entries(s.perMeasure)){const q=Math.max(1,p.count);perMeasure[id]={rmseCm:Number(Math.sqrt(p.ss/q).toFixed(4)),maeCm:Number((p.abs/q).toFixed(4)),biasCm:Number((p.bias/q).toFixed(4)),p95AbsCm:sammyProductionPercentile(p.absValues,.95),maxAbsCm:Number(p.maxAbs.toFixed(4))};}
 const usage={};for(const which of ["baseline","final"]){const d=s.usage[which],q=Math.max(1,d.count),classes={};for(const [k,v] of Object.entries(d.classSum))classes[k]=Number((v/q).toFixed(4));usage[which]={meanPriorityCost:Number((d.cost/q).toFixed(6)),meanActiveSliders:Number((d.active/q).toFixed(2)),classUsageRms:classes};}
 const reductionPct=(a,b)=>Number.isFinite(a)&&Math.abs(a)>1e-12?Number((100*(a-b)/Math.abs(a)).toFixed(2)):null,costReduction=s.canon.costBefore>1e-12?Number((100*(s.canon.costBefore-s.canon.costAfter)/s.canon.costBefore).toFixed(2)):0,worst=s.cases.slice().sort((a,b)=>b.finalRmseCm-a.finalRmseCm).slice(0,20),best=s.cases.slice().sort((a,b)=>a.finalRmseCm-b.finalRmseCm).slice(0,10);
 return {count:s.count,totalBodies:run.totalBodies,completedPct:Number((100*s.count/Math.max(1,run.totalBodies)).toFixed(1)),baselineOverallRmseCm:rm(s.baselineSumSq),finalOverallRmseCm:rm(s.finalSumSq),improvementPct:s.baselineSumSq>0?Number((100*(rm(s.baselineSumSq)-rm(s.finalSumSq))/rm(s.baselineSumSq)).toFixed(2)):0,p50BodyRmseCm:sammyProductionPercentile(s.bodyRmse,.50),p90BodyRmseCm:sammyProductionPercentile(s.bodyRmse,.90),p95BodyRmseCm:sammyProductionPercentile(s.bodyRmse,.95),maxBodyRmseCm:s.bodyRmse.length?Number(Math.max(...s.bodyRmse).toFixed(4)):null,successRatesPct:{le050:pct(s.thresholds.le050),le075:pct(s.thresholds.le075),le100:pct(s.thresholds.le100),le150:pct(s.thresholds.le150)},byKind,bySex,perMeasure,usageComparison:{priorityCostReductionPct:reductionPct(usage.baseline.meanPriorityCost,usage.final.meanPriorityCost),activeSliderReductionPct:reductionPct(usage.baseline.meanActiveSliders,usage.final.meanActiveSliders),scaleUsageReductionPct:reductionPct(usage.baseline.classUsageRms.scale,usage.final.classUsageRms.scale),translationUsageReductionPct:reductionPct(usage.baseline.classUsageRms.translation,usage.final.classUsageRms.translation)},canonicalization:{meanEvaluations:Number((s.canon.evaluations/n).toFixed(2)),meanAccepted:Number((s.canon.accepted/n).toFixed(2)),meanRejected:Number((s.canon.rejected/n).toFixed(2)),costReductionPct:costReduction,acceptedByClass:s.canon.acceptedByClass,rejectedByReason:s.canon.rejectedByReason},usage,nonFinite:s.nonFinite,worstCases:worst,bestCases:best};
}
function sammyDimensionsNewRun(mode,source){
 const cfg=SAMMY_DIMENSIONS_TEST_CONFIG[mode],runtime=sammyDimensionsRuntimeFromSource(source,`dim-prep-${Date.now()}`),model=sammySolverHydrate(runtime);return {schema:SAMMY_DIMENSIONS_SCHEMA,runId:`dimensions-${new Date().toISOString().replace(/[:.]/g,"-")}-${Math.random().toString(36).slice(2,7)}`,appVersion:SAMMY_DIMENSIONS_VERSION,mode,solverMode:"deep",createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),stage:"testing",cursor:0,ordinal:0,totalBodies:cfg.bodies,canonEvalLimit:cfg.canonEvals,sourceSolverRunId:source.runId,sourceSolverVersion:source.appVersion,calibrationRunId:source.calibrationRunId,model:source.model,productionProfile:runtime.productionProfile,stats:sammyDimensionsStatsNew(model),summary:null,notes:{purpose:"End-to-end DIMENSIONS validation: 31 measured cm targets -> R5 production solver -> real mesh -> remeasurement",corpus:"20% preserved R2 holdout regression + 60% fresh deterministic plausible bodies + 20% fresh deterministic edge bodies",knownContext:"only gender + adult age are supplied to the inverse solver; all other source slider values remain hidden",productionPath:"R2 inverse + four real-mesh refinement passes + R5 mesh-guarded Scale/Translation canonicalization",resume:"saved after every completed body; an interrupted body is safely repeated"}};
}
async function sammyDimensionsGetSourceForRun(run){const runs=await sammySolverGetRuns();return runs.find(r=>r.runId===run.sourceSolverRunId)||sammyDimensionsFindSource()}
async function sammyDimensionsTestOne(run,index){
 const source=await sammyDimensionsGetSourceForRun(run);if(!source)throw new Error("R2-Quelle für DIMENSIONS-Test nicht gefunden");const runtime=sammyDimensionsRuntimeFromRun(run),tc=sammyDimensionsTestCase(run,index,source),targetResults=await sammySolverApplyShape(tc.shape),targetMeasures=sammyDimensionsMeasureObject(targetResults),context={core:{gender:tc.sex,age:Number(tc.shape.core.age)},local:{}};
 const result=await sammyDimensionsSolveEngine(runtime,targetMeasures,context,run.canonEvalLimit,p=>{if(p.phase==="fit")sammyDimensionsLive(`Körper ${index+1}/${run.totalBodies} · ${tc.kind}`,[['R2 Mesh-Pass',`${p.pass}/${p.total}`],['aktuell',`${Number(p.rmseCm).toFixed(3)} cm`],['best',`${Number(p.bestRmseCm).toFixed(3)} cm`]]);else sammyDimensionsLive(`Körper ${index+1}/${run.totalBodies} · R5 Guard`,[["Cleanup",`${p.evaluation}/${p.total}`],["Slider",p.sliderId],["Status",p.accepted?"ACCEPT":"ROLLBACK"],["Mesh",`${Number(p.currentRmseCm).toFixed(3)} cm`]])},false);
 sammyDimensionsStatsAdd(run,index,tc,targetMeasures,result);await sammySolverRecord(run,"dimensions-body",`DIMENSIONS body ${index+1}`,{testIndex:index,kind:tc.kind,sourceId:tc.sourceId,sex:tc.sex,ageShape:Number(tc.shape.core.age),ageYears:Number(sammyShapeAgeToYears(tc.shape.core.age,tc.sex).toFixed(2)),targetMeasures,result:{baseline:result.baseline,production:result.production,canonicalization:result.canonicalization}});
}
async function sammyDimensionsRunner(){
 const run=sammyDimensionsLab.run;if(!run)return;sammyDimensionsLab.running=true;sammyDimensionsLab.paused=false;sammyDimensionsLab.cancelRequested=false;sammyDimensionsStatus("DIMENSIONS End-to-End-Test startet …");
 try{while(sammyDimensionsLab.running&&!sammyDimensionsLab.paused&&!sammyDimensionsLab.cancelRequested&&run.stage!=="complete"){
   const i=run.cursor;if(i>=run.totalBodies){run.summary=sammyDimensionsStatsSummary(run);run.stage="complete";run.completedAt=new Date().toISOString();await sammySolverPutRun(run);break;}await sammyDimensionsTestOne(run,i);run.cursor=i+1;run.summary=sammyDimensionsStatsSummary(run);await sammySolverPutRun(run);sammyDimensionsStatus(`Körper ${run.cursor}/${run.totalBodies} fertig · R5 ${run.summary.finalOverallRmseCm} cm · P95 ${run.summary.p95BodyRmseCm} cm`);
  }
  if(run.stage==="complete"){sammyDimensionsLab.lastRun=run;sammyDimensionsLab.running=false;sammyDimensionsStatus(`Fertig · ${run.summary.count} Körper · R5 ${run.summary.finalOverallRmseCm} cm · P95 ${run.summary.p95BodyRmseCm} cm · Worst ${run.summary.maxBodyRmseCm} cm`);sammyDimensionsLive("DIMENSIONS TEST FERTIG",[["Körper",run.summary.count],["R5 Gesamt",`${run.summary.finalOverallRmseCm} cm`],["P95",`${run.summary.p95BodyRmseCm} cm`],["≤ 1,0 cm",`${run.summary.successRatesPct.le100}%`],["Edge",`${run.summary.byKind.edge?.finalRmseCm??"—"} cm`]]);}
 }catch(e){console.error("DIMENSIONS Test",e);sammyDimensionsLab.running=false;sammyDimensionsLab.paused=true;sammyDimensionsStatus(`FEHLER: ${e?.message||e}`);sammyReportError?.(e,{source:"DIMENSIONS Testloop"});}
 finally{sammyDimensionsLab.running=false;sammyDimensionsStatus();}
}
async function sammyDimensionsStartOrResume(){
 if(sammyDimensionsLab.running||sammyDimensionsLab.manualRunning)return;if(sammyCalibration?.running||sammySolverLab?.running){sammyDimensionsStatus("Calibration/Solver-Lab läuft noch · zuerst pausieren.");return;}if(!annyPackLoaded){sammyDimensionsStatus("Anny-Pack ist noch nicht bereit.");return;}if(!sammyMeasureSession){sammyDimensionsStatus("MEAS zuerst öffnen.");return;}
 let run=sammyDimensionsLab.run;if(!run||run.schema!==SAMMY_DIMENSIONS_SCHEMA||run.stage==="complete"){const source=await sammyDimensionsFindSource();if(!source){sammyDimensionsStatus("Kein abgeschlossener Solver-R2-Lauf gefunden.");return;}run=sammyDimensionsNewRun(sammyDimensionsLab.mode,source);sammyDimensionsLab.run=run;sammySolverRuntimeCache=null;await sammySolverPutRun(run);}sammyDimensionsLab.paused=false;sammyDimensionsLab.cancelRequested=false;sammyDimensionsRunner();
}
function sammyDimensionsPause(){if(!sammyDimensionsLab.running)return;sammyDimensionsLab.paused=true;sammyDimensionsStatus("Pause nach dem aktuellen Körper; Fortschritt bis zum letzten fertigen Körper ist gespeichert.")}
async function sammyDimensionsReset(){const run=sammyDimensionsLab.run;if(sammyDimensionsLab.running||!run)return;if(!confirm("Gespeicherten DIMENSIONS-Testlauf löschen? R2/R5/Calibration bleiben erhalten."))return;await sammySolverDeleteRun(run.runId);sammyDimensionsLab.run=null;sammyDimensionsLab.lastRun=null;sammyDimensionsStatus("DIMENSIONS-Testlauf gelöscht. R2/R5-Daten unverändert.");sammyDimensionsLive("DIMENSIONS",[["Status","bereit"]]);}
async function sammyDimensionsLoadLatest(){try{const runs=(await sammySolverGetRuns()).filter(r=>r?.schema===SAMMY_DIMENSIONS_SCHEMA).sort((a,b)=>String(b.updatedAt||"").localeCompare(String(a.updatedAt||""))),active=runs.find(r=>r.stage!=="complete")||runs[0]||null;sammyDimensionsLab.run=active;sammyDimensionsLab.lastRun=active;if(active){sammyDimensionsLab.mode=active.mode||"deep";document.querySelectorAll("[data-dim-mode]").forEach(b=>b.classList.toggle("active",b.dataset.dimMode===sammyDimensionsLab.mode));sammyDimensionsStatus(active.stage==="complete"?`Letzter Test fertig · ${active.summary?.count||0} Körper · ${active.summary?.finalOverallRmseCm??"—"} cm`:`Gespeicherter Test kann bei Körper ${Number(active.cursor||0)+1} fortgesetzt werden.`);}else sammyDimensionsStatus("Bereit · noch kein DIMENSIONS-Testlauf.");}catch(e){console.warn("DIMENSIONS resume",e)}}
async function sammyDimensionsExport(summaryOnly=false){const run=sammyDimensionsLab.run||sammyDimensionsLab.lastRun;if(!run){sammyDimensionsStatus("Kein DIMENSIONS-Testlauf zum Exportieren.");return;}const summary=run.summary||sammyDimensionsStatsSummary(run),base={schema:SAMMY_DIMENSIONS_SCHEMA,app:"Sammy",version:SAMMY_DIMENSIONS_VERSION,generated:new Date().toISOString(),purpose:"End-to-end DIMENSIONS/R5 validation on preserved holdouts plus fresh deterministic plausible/edge bodies.",summary,notes:run.notes};let payload=base;if(!summaryOnly){const records=await sammySolverGetRecords(run.runId);payload={...base,run,records};}const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=summaryOnly?`Sammy_DIMENSIONS_Test_Summary_${run.mode}_${run.runId}.json`:`Sammy_DIMENSIONS_Test_FULL_${run.mode}_${run.runId}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500);sammyDimensionsStatus(summaryOnly?"DIMENSIONS Summary exportiert.":"DIMENSIONS FULL exportiert.");}
async function sammyDimensionsManualSolve(){
 if(sammyDimensionsLab.running||sammyDimensionsLab.manualRunning)return;if(sammyCalibration?.running||sammySolverLab?.running){sammyDimensionsStatus("Calibration/Solver-Lab läuft noch · zuerst pausieren.");return;}if(!annyPackLoaded||!sammyMeasureSession){sammyDimensionsStatus("MEAS und Anny müssen bereit sein.");return;}const {targets,missing}=sammyDimensionsReadTargets();if(missing.length){sammyDimensionsStatus(`Es fehlen ${missing.length} Zielmaße. Erst aktuellen Körper übernehmen oder alle 31 Werte eintragen.`);return;}const source=await sammyDimensionsFindSource();if(!source){sammyDimensionsStatus("Kein abgeschlossener R2-Solver gefunden.");return;}sammyDimensionsLab.manualRunning=true;const solveBtn=$("#sammyDimensionsSolve");if(solveBtn)solveBtn.disabled=true;sammyDimensionsStatus("31 Zielmaße werden mit R5 gelöst …");
 try{const runtime=sammyDimensionsRuntimeFromSource(source,`dimensions-manual-${Date.now()}`),context=sammyDimensionsContextShape(),result=await sammyDimensionsSolveEngine(runtime,targets,context,14,p=>{if(p.phase==="fit")sammyDimensionsLive("DIMENSIONS · R2 FIT",[["Pass",`${p.pass}/${p.total}`],["Mesh",`${Number(p.rmseCm).toFixed(3)} cm`]]);else sammyDimensionsLive("DIMENSIONS · R5 MESH-GUARD",[["Cleanup",`${p.evaluation}/${p.total}`],["Slider",p.sliderId],["Status",p.accepted?"ACCEPT":"ROLLBACK"],["Mesh",`${Number(p.currentRmseCm).toFixed(3)} cm`]])},true),model=sammySolverHydrate(runtime),actual=Object.fromEntries(model.measureIds.map((id,j)=>[id,Number(result.production.actual[j])]));sammyDimensionsRenderResult(targets,actual,{baselineRmseCm:result.baseline.bestRmseCm,finalRmseCm:result.production.bestRmseCm,canonicalization:result.canonicalization});sammyDimensionsStatus(`Fertig · echter Mesh-RMSE ${result.production.bestRmseCm.toFixed(3)} cm · R2 vorher ${result.baseline.bestRmseCm.toFixed(3)} cm.`);}
 catch(e){console.error("DIMENSIONS manual",e);sammyDimensionsStatus(`FEHLER: ${e?.message||e}`);sammyReportError?.(e,{source:"DIMENSIONS manual"});}
 finally{sammyDimensionsLab.manualRunning=false;const solveBtn=$("#sammyDimensionsSolve");if(solveBtn)solveBtn.disabled=false;}
}
function sammyDimensionsInitUI(){
 sammyDimensionsRenderInputs();document.querySelectorAll("[data-dim-sex]").forEach(b=>b.onclick=()=>sammyDimensionsSetSex(Number(b.dataset.dimSex)));document.querySelectorAll("[data-dim-mode]").forEach(b=>b.onclick=()=>sammyDimensionsSetMode(b.dataset.dimMode));const fill=$("#sammyDimensionsFromCurrent"),solve=$("#sammyDimensionsSolve"),start=$("#sammyDimensionsTestStart"),pause=$("#sammyDimensionsTestPause"),reset=$("#sammyDimensionsTestReset"),sum=$("#sammyDimensionsTestSummary"),full=$("#sammyDimensionsTestExport");if(fill)fill.onclick=()=>sammyDimensionsFillTargets();if(solve)solve.onclick=sammyDimensionsManualSolve;if(start)start.onclick=sammyDimensionsStartOrResume;if(pause)pause.onclick=sammyDimensionsPause;if(reset)reset.onclick=sammyDimensionsReset;if(sum)sum.onclick=()=>sammyDimensionsExport(true);if(full)full.onclick=()=>sammyDimensionsExport(false);sammyDimensionsSetSex(annyParams.gender>=.5?1:0);const age=$("#sammyDimensionsAge");if(age)age.value=String(Math.round(sammyShapeAgeToYears(annyParams.age,sammyDimensionsLab.sex)));sammyDimensionsSetMode("deep");sammyDimensionsLoadLatest();
}

function sammyClearMeasureOverlay(){if(!sammyMeasureOverlayGroup)return;scene.remove(sammyMeasureOverlayGroup);sammyMeasureOverlayGroup.traverse(o=>{o.geometry?.dispose?.();if(o.material?.map)o.material.map.dispose?.();o.material?.dispose?.()});sammyMeasureOverlayGroup=null}
function sammyAddMeasureLine(points,id,selected=false,closed=false){if(!points?.length)return;const arr=new Float32Array(points.length*3);for(let i=0;i<points.length;i++){arr[i*3]=points[i][0];arr[i*3+1]=points[i][1];arr[i*3+2]=points[i][2]}const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.BufferAttribute(arr,3));const mat=new THREE.LineBasicMaterial({color:selected?0xffdf72:0xe1e3e8,transparent:true,opacity:selected?1:.78,depthTest:false,depthWrite:false,linewidth:selected?3:2});const line=closed?new THREE.LineLoop(g,mat):new THREE.Line(g,mat);line.renderOrder=40;line.userData.sammyMeasureId=id;sammyMeasureOverlayGroup.add(line)}


function sammyMeasureFormat(v){return Number.isFinite(v)?`${v.toFixed(1)} cm`:"—"}
function sammyMeasureStateBadge(id){
 if(sammyMeasureScope==="common")return sammyMeasureCommonCal(id).status||"ungeprüft";
 const spec=sammyMeasureSpecificCal(id,sammyMeasureScope);return spec.override?(spec.status||"ungeprüft"):"erbt Unisex"
}
function sammyMeasureInlineEditor(d,c){
 const off=Number(c.offsetCm)||0,span=Number(c.spanOffsetCm)||0,range=d.range||0,spanRange=d.spanRange||20,scopeSpecific=sammyMeasureScope!=="common",isOverride=scopeSpecific&&sammyMeasureSpecificCal(d.id,sammyMeasureScope).override;
 const dynamicSemantic=["nippleMorphLandmark","navelMorphLandmark","bulgeMorphLandmark"].includes(d.dynamicRule);
 const dynamicNote=d.dynamicRule==="nippleMorphLandmark"?`<div class="sammyMeasureAutoRule"><b>Brust · Nipple-Morph-Landmark</b><small>Für Männer und Frauen wird die Messebene direkt aus den Mesh-Vertices abgeleitet, die Annys nipple-point / nipple-size Morphs beeinflussen.</small></div>`:d.dynamicRule==="navelMorphLandmark"?`<div class="sammyMeasureAutoRule"><b>Taille · Navel-Morph-Landmark</b><small>Die ANSUR-/Omphalion-Ebene folgt direkt der von stomach-navel-out / stomach-navel-up markierten Nabelregion.</small></div>`:d.dynamicRule==="bulgeMorphLandmark"?`<div class="sammyMeasureAutoRule"><b>Crotch · Bulge-Morph-Landmark</b><small>Die Schritt-Höhe folgt direkt der von bulge-incr markierten zentralen Mesh-Region.</small></div>`:"";
 const auto=d.anchorSource?`<div class="sammyMeasureAutoRule"><b>Gemeinsamer Landmark</b><small>Diese Messebene wird automatisch von ${escapeHtml(SAMMY_MEASURE_DEFS.find(x=>x.id===d.anchorSource)?.label||d.anchorSource)} übernommen.</small></div>`:(dynamicNote||(d.autoSearch?`<div class="sammyMeasureAutoRule"><b>Automatische ${d.autoSearch==="min"?"Minimum":"Maximum"}-Suche</b><small>Die Position wird aus der aktuellen Körpergeometrie ermittelt und skaliert mit dem Mesh.</small></div>`:""));
 const position=d.adjustable&&!d.autoSearch&&!dynamicSemantic?`<div class="sammyMeasureInlineField"><div class="sammyMeasureOffsetHead"><label>Landmark / Messebene feinjustieren</label><span data-inline-off>${off>=0?"+":""}${off.toFixed(1)} cm</span></div><input data-measure-offset type="range" min="${-range}" max="${range}" step="0.1" value="${off}"><small class="sammyMeasureMirrorHint">v0.8.7 skaliert diesen Kalibrierwert proportional zur aktuellen Körperhöhe.</small></div>`:"";
 const spanCtl=d.spanAdjust?`<div class="sammyMeasureInlineField"><div class="sammyMeasureOffsetHead"><label>${escapeHtml(d.spanLabel||"Breitenkorrektur gesamt")}</label><span data-inline-span>${span>=0?"+":""}${span.toFixed(1)} cm</span></div><input data-measure-span type="range" min="${-spanRange}" max="${spanRange}" step="0.1" value="${span}"><small class="sammyMeasureMirrorHint">symmetrisch · skaliert mit Körperhöhe</small></div>`:"";
 const status=c.status||"ungeprüft";
 return `<div class="sammyMeasureInlineEditor">${auto}${position}${spanCtl}<div class="sammyMeasureStatusButtons" role="group" aria-label="Prüfstatus"><button data-status="ungeprüft" class="${status==="ungeprüft"?"active":""}" type="button">ungeprüft</button><button data-status="prüfen" class="${status==="prüfen"?"active":""}" type="button">prüfen</button><button data-status="bestätigt" class="${status==="bestätigt"?"active":""}" type="button">bestätigt</button></div><textarea data-measure-comment placeholder="Kommentar · ${escapeHtml(sammyMeasureScopeLabel())}">${escapeHtml(c.comment||"")}</textarea><div class="sammyMeasureInlineActions"><button data-measure-reset type="button">Werte zurücksetzen</button>${scopeSpecific?`<button data-measure-inherit type="button" ${isOverride?"":"disabled"}>Unisex übernehmen</button>`:""}</div>${sammyMeasureInfoOpenFor===d.id?`<div class="sammyMeasureInfoBox"><b>ANSUR-II / Referenz</b><p>${escapeHtml(d.ansurInfo)}</p><b>Sammy-Implementierung v0.8.7</b><p>${escapeHtml(d.implementation)}</p><b>Quelle</b><p>ANSUR II · Measurer's Handbook NATICK/TR-11/017. Interne/abgeleitete Maße sind ausdrücklich als solche markiert.</p></div>`:""}</div>`
}
function sammyMeasureRenderList(results){
 const list=$("#sammyMeasureList");if(!list)return;const other=sammyMeasureOtherSexSymbol(),scroll=list.closest(".sammyPanelScroll"),keep=scroll?.scrollTop||0;
 list.innerHTML=SAMMY_MEASURE_DEFS.map(d=>{
  const c=sammyMeasureResolvedCal(d.id,sammyMeasureScope),v=results[d.id]?.valueCm,selected=d.id===sammyMeasureSelected;
  return `<div class="sammyMeasureRow ${selected?"selected":""}" data-id="${d.id}"><div class="sammyMeasureRowHead"><button class="sammyMeasureMain" type="button"><b>${escapeHtml(d.label)}</b><small><strong data-measure-value="${d.id}">${sammyMeasureFormat(v)}</strong><span class="sammyMeasureState">${escapeHtml(sammyMeasureStateBadge(d.id))}</span></small></button><button class="sammyMeasureIconBtn sammyMeasureInfoBtn ${sammyMeasureInfoOpenFor===d.id?"active":""}" type="button" aria-label="ANSUR Info">i</button><button class="sammyMeasureIconBtn sammyMeasureSexBtn" type="button" aria-label="Zum anderen Geschlecht wechseln"><span>${other}</span></button></div>${selected?sammyMeasureInlineEditor(d,c):""}</div>`
 }).join("");
 list.querySelectorAll(".sammyMeasureRow").forEach(row=>{
  const id=row.dataset.id,d=SAMMY_MEASURE_DEFS.find(x=>x.id===id);
  row.querySelector(".sammyMeasureMain").onclick=()=>{sammyMeasureSelected=id;sammyMeasureInfoOpenFor=null;sammyMeasureRefresh(true)};
  row.querySelector(".sammyMeasureInfoBtn").onclick=()=>{sammyMeasureSelected=id;sammyMeasureInfoOpenFor=sammyMeasureInfoOpenFor===id?null:id;sammyMeasureRefresh(true)};
  row.querySelector(".sammyMeasureSexBtn").onclick=()=>{sammyMeasureSelected=id;sammyMeasureSwitchSex()};
  if(!row.classList.contains("selected"))return;
  const edit=()=>sammyMeasureEditableCal(id);
  const off=row.querySelector("[data-measure-offset]");if(off)off.oninput=e=>{const c=edit();c.offsetCm=Number(e.target.value)||0;sammyMeasureSaveCalibration();row.querySelector("[data-inline-off]").textContent=`${c.offsetCm>=0?"+":""}${c.offsetCm.toFixed(1)} cm`;sammyMeasureScheduleRefresh(false)};
  const sp=row.querySelector("[data-measure-span]");if(sp)sp.oninput=e=>{const c=edit();c.spanOffsetCm=Number(e.target.value)||0;sammyMeasureSaveCalibration();row.querySelector("[data-inline-span]").textContent=`${c.spanOffsetCm>=0?"+":""}${c.spanOffsetCm.toFixed(1)} cm`;sammyMeasureScheduleRefresh(false)};
  row.querySelectorAll("[data-status]").forEach(b=>b.onclick=()=>{const c=edit();c.status=b.dataset.status;sammyMeasureSaveCalibration();sammyMeasureRefresh(true)});
  const ta=row.querySelector("[data-measure-comment]");if(ta)ta.oninput=e=>{const c=edit();c.comment=e.target.value;sammyMeasureSaveCalibration()};
  const reset=row.querySelector("[data-measure-reset]");if(reset)reset.onclick=()=>{const c=edit();c.offsetCm=0;c.spanOffsetCm=0;sammyMeasureSaveCalibration();sammyMeasureRefresh(true)};
  const inherit=row.querySelector("[data-measure-inherit]");if(inherit)inherit.onclick=()=>{sammyMeasureClearSpecific(id);sammyMeasureRefresh(true)}
 });
 requestAnimationFrame(()=>{if(scroll)scroll.scrollTop=keep})
}
function sammyMeasureRefresh(full=true){
 if(!sammyMeasureSession)return;let results;
 if(full||!Object.keys(sammyMeasureResultsCache).length)results=sammyComputeAllMeasures();else{results={...sammyMeasureResultsCache};const def=SAMMY_MEASURE_DEFS.find(d=>d.id===sammyMeasureSelected);if(def)results[def.id]=sammyComputeMeasure(def,new Map());sammyMeasureResultsCache=results}
 const sex=$("#sammyMeasureSexLabel");if(sex)sex.textContent=`${sammyMeasureSexLabel()} · ${sammyMeasureScopeLabel()}`;
 const uni=$("#sammyMeasureUnisex");if(uni)uni.classList.toggle("active",sammyMeasureScope==="common");
 if(full)sammyMeasureRenderList(results);else{const n=document.querySelector(`[data-measure-value="${sammyMeasureSelected}"]`);if(n)n.textContent=sammyMeasureFormat(results[sammyMeasureSelected]?.valueCm)}
 sammyUpdateMeasureOverlay(results)
}
function sammyMeasureScheduleRefresh(full=false){cancelAnimationFrame(sammyMeasureRefreshRaf);sammyMeasureRefreshRaf=requestAnimationFrame(()=>sammyMeasureRefresh(full))}
function sammyMeasureSetOverlayMode(mode){sammyMeasureOverlayMode=mode;for(const [id,m] of [["#sammyMeasureShowSelected","selected"],["#sammyMeasureShowAll","all"],["#sammyMeasureShowNone","none"]])$(id)?.classList.toggle("active",mode===m);sammyMeasureRefresh(false)}
function sammyMeasurementIdentityPose(){const rel=new Float32Array(poseJointCount*9);for(let j=0;j<poseJointCount;j++)mat3Identity(rel,j*9);return rel}
function sammyApplyMeasurementRelative(rel,label){if(morphSammyTargetActive&&shapeEngine==="anny")return applyAnnyAxis16RetargetPose(currentDisplayRest(),rel,false,false,label);return applyRelativePoseMatrices(currentDisplayRest(),rel,false,false,label)}
function sammyEnterMeasureMode(){
 if(sammyMeasureSession)return;sammyMeasureLoadCalibration();sammyMeasureScope=sammyMeasureSexKey();sammyMeasureInfoOpenFor=null;sammyMeasureLandmarksVisible=true;sammyMeasureLabelsVisible=false;sammyMeasureTransientLabelId=null;
 sammyMeasureSession={camera:sammyCaptureCameraState(),relative:lastAppliedRelative3?new Float32Array(lastAppliedRelative3):null,running:poseAnimRunning,mode:poseAnimMode,frame:userAnimCurrentFrame,skeleton:rigDebugVisible,originalGender:annyParams.gender,originalShape:{...annyParams},originalLocal:{...(annyLocalValues||{})}};
 stopPoseAnimation(false);if(rigDebugVisible)sammyToggleSkeleton();const endpoint=annyParams.gender>=.5?1:0;if(Math.abs(annyParams.gender-endpoint)>1e-6){annyParams.gender=endpoint;applyAnnyParams()}
 sammyApplyMeasurementRelative(sammyMeasurementIdentityPose(),"Sammy Measurement T-Pose");sammyCameraTo("measure",900,false);sammyCalLoadLatest();sammySolverLoadLatest();const lb=$("#sammyMeasureLandmarks"),nb=$("#sammyMeasureLabels");if(lb){lb.classList.add("active");lb.textContent="Landmarks AN"}if(nb){nb.classList.remove("active");nb.textContent="Namen AUS"}sammyMeasureRefresh(true)
}
function sammyExitMeasureMode(instantCamera=false){
 const s=sammyMeasureSession;if(!s)return null;if(sammyCalibration?.running)sammyCalPause();if(sammySolverLab?.running)sammySolverPause();sammyMeasureSession=null;sammyClearMeasureOverlay();
 if(s.originalShape){annyParams={...s.originalShape};annyLocalValues={...(s.originalLocal||{})};applyAnnyParams();sammyMeasureSyncLocalUiV3()}
 else if(Number.isFinite(s.originalGender)&&Math.abs(annyParams.gender-s.originalGender)>1e-6){annyParams.gender=s.originalGender;applyAnnyParams()}
 if(s.relative)sammyApplyMeasurementRelative(s.relative,"Sammy Measurement → vorherige Pose");if(s.camera)sammyCameraTweenToState(s.camera,instantCamera?0:850,!!instantCamera);if(s.skeleton&&!rigDebugVisible)sammyToggleSkeleton();if(s.running&&s.mode==="user"&&userAnimLoaded)startPoseAnimation("user",Math.max(0,Math.min(userAnimFrames-1,s.frame||0)));return s.camera||null
}
function sammyMeasureSwitchSex(){
 if(!sammyMeasureSession)return;const target=sammyMeasureSexKey()==="female"?"male":"female";sammyMeasureScope=target;annyParams.gender=target==="female"?1:0;applyAnnyParams();requestAnimationFrame(()=>sammyMeasureRefresh(true))
}
function sammyMeasureUseUnisex(){if(!sammyMeasureSession)return;sammyMeasureScope="common";sammyMeasureRefresh(true)}
function sammyMeasureExport(){
 const current=sammyComputeAllMeasures(),sex=sammyMeasureSexKey();sammyMeasureLastSnapshots[sex]={time:new Date().toISOString(),scope:sammyMeasureScope,values:Object.fromEntries(SAMMY_MEASURE_DEFS.map(d=>[d.id,Number.isFinite(current[d.id].valueCm)?Number(current[d.id].valueCm.toFixed(4)):null]))};
 const payload={schema:"sammy-measure-calibration-v2",app:"Sammy",version:"0.8.7",generated:new Date().toISOString(),ansur:{database:"ANSUR II",handbook:"NATICK/TR-11/017",note:"ANSUR II public database contains many more direct measures; Sammy v0.8.7 bestimmt Brust-, ANSUR-Taillen- und Crotch-Höhen semantisch aus Nipple-, Navel- bzw. Bulge-Morph-Vertices, trennt Gesäßumfang von der höheren Hüftebene und behält den mittleren Bizepsbereich; Calibration Lab behält L/R-Gruppierung und adaptives Paar-Screening."},currentModelSex:sex,currentCalibrationScope:sammyMeasureScope,definitions:SAMMY_MEASURE_DEFS.map(({id,label,ansur,kind,section,adjustable,range,spanAdjust,spanRange,group,internal,autoSearch,dynamicRule,ansurInfo,implementation})=>({id,label,ansur,kind,section:section||null,adjustable,rangeCm:range||0,spanAdjust:!!spanAdjust,spanRangeCm:spanRange||0,group:group||null,internal:!!internal,autoSearch:autoSearch||null,dynamicRule:dynamicRule||null,ansurInfo,implementation})),calibration:JSON.parse(JSON.stringify(sammyMeasureLoadCalibration())),lastSnapshots:sammyMeasureLastSnapshots,currentShape:{gender:annyParams.gender,age:annyParams.age,ageYears:sammyShapeAgeToYears(),muscle:annyParams.muscle,weight:annyParams.weight,height:annyParams.height,proportions:annyParams.proportions,cupsize:annyParams.cupsize,firmness:annyParams.firmness,activeLocal:Object.entries(annyLocalValues||{}).filter(([,v])=>Math.abs(Number(v))>1e-6)},geometry:{lod:displayLOD,vertices:geometry?.attributes?.position?.count||0,triangles:(geometry?.index?.count||0)/3,tapeBridge:"semantic landmarks + planar/arbitrary section hull + extremum search"}};
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`Sammy_Measure_Calibration_v2_${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1200)
}


// ---------------------------------------------------------------------------
// Sammy v0.8.17.1 · ANSUR LAB D3 live visual alignment audit
// Scope: ANSUR visual/statistical mode only. R2/R5/DIMENSIONS/MEAS/Anny/SOMA/
// rig/startup helpers are reused but intentionally not modified.
// ---------------------------------------------------------------------------
const SAMMY_ANS_RESULTS_KEY="sammy-ansur-lab-v1-results"; // keep A/B across upgrade
const SAMMY_ANS_D_SCHEMA="sammy-ansur-endtoend-v1";
const SAMMY_ANS_D_CONFIG={quick:{label:"Quick",people:6,canonEvals:8},standard:{label:"Standard",people:15,canonEvals:10},deep:{label:"Deep",people:30,canonEvals:14},stress:{label:"Stress",people:60,canonEvals:14}};
const SAMMY_ANS_D2_SCHEMA="sammy-ansur-alignment-v1";
const SAMMY_ANS_D2_VARIANTS=["T24","K7","K5"];
const SAMMY_ANS_D2_CONFIG={
 quick:{label:"Quick",people:4,hardPasses:4,softPasses:4,canonEvals:4},
 standard:{label:"Standard",people:12,hardPasses:6,softPasses:6,canonEvals:6},
 deep:{label:"Deep",people:30,hardPasses:8,softPasses:8,canonEvals:8},
 stress:{label:"Stress",people:60,hardPasses:10,softPasses:10,canonEvals:10}
};
const SAMMY_ANS_D3_SCHEMA="sammy-ansur-alignment-audit-v1";
const SAMMY_ANS_D3_CONFIG={
 quick:{label:"Quick",people:3,passes:4,rescuePasses:2},
 standard:{label:"Standard",people:8,passes:5,rescuePasses:3},
 deep:{label:"Deep",people:16,passes:6,rescuePasses:3},
 stress:{label:"Stress",people:30,passes:7,rescuePasses:4}
};
const SAMMY_ANS_D3_BUNDLES=[
 {id:"chest_section",label:"Brust · Querschnitt",ids:["chest_circumference","chest_breadth","chest_depth"]},
 {id:"shoulder_chest",label:"Schulter + Brust",ids:["biacromial_breadth","shoulder_length","chest_circumference","chest_breadth","chest_depth"]},
 {id:"waist_section",label:"Taille · Querschnitt",ids:["waist_circumference","waist_breadth","waist_depth"]},
 {id:"pelvis",label:"Becken / Gesäß",ids:["buttock_circumference","hip_breadth"]},
 {id:"neck",label:"Hals",ids:["neck_circumference","neck_base_circumference"]},
 {id:"arms",label:"Arme",ids:["wrist_circumference","upperarm_length","lowerarm_length"]},
 {id:"legs",label:"Beine",ids:["thigh_circumference","calf_circumference","ankle_circumference","tibiale_height","upperleg_height"]},
 {id:"vertical",label:"Vertikale Proportionen",ids:["stature","crotch_height","torso_height","waist_back_length"]}
];
let sammyAnsLab={worker:null,running:null,runA:null,runB:null,runC:null,lastError:null,dMode:"deep",dRun:null,dRunning:false,dPaused:false,dExitAfterPause:false,dRestore:null,d2Mode:"deep",d2Run:null,d2Running:false,d2Paused:false,d2ExitAfterPause:false,d2Restore:null,d3Mode:"deep",d3Run:null,d3Running:false,d3Paused:false,d3ExitAfterPause:false,d3Restore:null,d3Cache:null,d3Visual:true,d3VisualFrame:null,dPrepOwner:"D",dPrepResolve:null,dPrepReject:null,bridgeData:null,bridgePromise:null};
function sammyAnsApplyStoredPanelHeight(){const p=$("#sammyAnsPanel");if(!p)return;const state=sammyUiLoadState(),h=Number(state.panelHeights?.ansur||0);if(h)p.style.setProperty("--sammy-panel-h",`${h}px`);p.classList.toggle("compact",!!h&&h<138)}
function sammyAnsOpenPanel(){const p=$("#sammyAnsPanel");if(!p)return;document.querySelectorAll(".sammyPanel").forEach(x=>x.classList.toggle("open",x===p));sammyAnsApplyStoredPanelHeight();sammyAnsRefreshUi()}
function sammyAnsClosePanel(){const p=$("#sammyAnsPanel");p?.classList.remove("open")}
// ---- ANSUR Prediction Research A/B/C --------------------------------------
function sammyAnsStored(){try{return JSON.parse(localStorage.getItem(SAMMY_ANS_RESULTS_KEY)||"{}")||{}}catch{return {}}}
function sammyAnsPersist(){try{localStorage.setItem(SAMMY_ANS_RESULTS_KEY,JSON.stringify({runA:sammyAnsLab.runA,runB:sammyAnsLab.runB,runC:sammyAnsLab.runC}))}catch(e){console.warn("ANSUR LAB result persistence failed",e)}}
function sammyAnsStatus(text,cls=""){const n=$("#sammyAnsStatus");if(!n)return;n.textContent=text;n.className=`sammyStatus ${cls}`.trim()}
function sammyAnsProgress(run,p){const map={A:"#sammyAnsAProgress",B:"#sammyAnsBProgress",C:"#sammyAnsCProgress",DPREP:sammyAnsLab.dPrepOwner==="D3"?"#sammyAnsD3Progress":sammyAnsLab.dPrepOwner==="D2"?"#sammyAnsD2Progress":"#sammyAnsDProgress"},n=$(map[run]);if(n)n.style.width=`${Math.max(0,Math.min(1,Number(p)||0))*100}%`}
function sammyAnsInputLabel(id){const src=sammyAnsLab.runA?.dataset?.candidateInputs||[];return src.find(x=>x.id===id)?.label||({stature:"Körperhöhe",weightkg:"Gewicht",chest_circumference:"Brustumfang",waist_circumference:"Taillenumfang",buttock_circumference:"Gesäß-/Hüftumfang",biacromial_breadth:"Schulterbreite",crotch_height:"Crotch Height",torso_height:"Schulter → Schritt",thigh_circumference:"Oberschenkelumfang",wrist_circumference:"Handgelenkumfang",calf_circumference:"Wadenumfang"}[id]||id)}
function sammyAnsSetList(set){return (set||[]).map(sammyAnsInputLabel).join(" · ")}
function sammyAnsRenderA(){const n=$("#sammyAnsAResult"),r=sammyAnsLab.runA;if(!n)return;if(!r){n.innerHTML="";return}const rows=[5,6,7].map(k=>{const q=r.bestSets?.[String(k)];return q?`<div class="sammyAnsResultRow"><b>${k}</b><span>${sammyAnsSetList(q.set)}</span><strong>nRMSE ${q.score.toFixed(3)}</strong></div>`:""}).join("");n.innerHTML=`<div class="sammyAnsResultTitle"><b>Research Sweep fertig</b><span>λ ${r.selectedLambda} · Testsplit unangetastet</span></div>${rows}`}
function sammyAnsRenderB(){const n=$("#sammyAnsBResult"),r=sammyAnsLab.runB;if(!n)return;if(!r){n.innerHTML="";return}const rows=[5,6,7].map(k=>{const q=r.sets?.[String(k)];return q?`<div class="sammyAnsResultRow"><b>${k}</b><span>${q.overallRmseCm.toFixed(2)} cm · nRMSE ${q.normalizedRmse.toFixed(3)}</span><strong>P95 ${q.bodyDistribution?.p95?.toFixed(2)||"–"} cm</strong></div>`:""}).join("");n.innerHTML=`<div class="sammyAnsResultTitle"><b>Blind Validation fertig</b><span>912 Personen · B war erster Testzugriff</span></div>${rows}`}
function sammyAnsRenderC(){const n=$("#sammyAnsCResult"),r=sammyAnsLab.runC;if(!n)return;if(!r){n.innerHTML="";return}const fam=r.recommendedFamily||"—",f=r.families?.[fam],rows=[5,6,7].map(k=>{const q=f?.results?.[String(k)],m=q?.selectedModel;if(!q)return"";return `<div class="sammyAnsResultRow"><b>${k}</b><span>${m?.kind||"—"} λ ${m?.lambda??"—"} · ${sammyAnsSetList(q.inputs)}</span><strong>${q.test?.primaryFairRmseCm?.toFixed(2)||"—"} cm</strong></div>`}).join("");n.innerHTML=`<div class="sammyAnsResultTitle"><b>C fertig · ${fam}</b><span>24 feste Primärziele · Messfehler + Unsicherheit</span></div>${rows}`}
function sammyAnsRefreshUi(){sammyAnsRenderA();sammyAnsRenderB();sammyAnsRenderC();const busy=!!sammyAnsLab.running,a=$("#sammyAnsRunA"),b=$("#sammyAnsRunB"),c=$("#sammyAnsRunC"),meshBusy=sammyAnsLab.dRunning||sammyAnsLab.d2Running||sammyAnsLab.d3Running;if(a)a.disabled=busy||meshBusy;if(b)b.disabled=busy||meshBusy||!sammyAnsLab.runA;if(c)c.disabled=busy||meshBusy||!sammyAnsLab.runA||!sammyAnsLab.runB;const ex1=$("#sammyAnsSummaryExport"),ex2=$("#sammyAnsFullExport");if(ex1)ex1.disabled=!sammyAnsLab.runA&&!sammyAnsLab.runB&&!sammyAnsLab.runC;if(ex2)ex2.disabled=!sammyAnsLab.runA&&!sammyAnsLab.runB&&!sammyAnsLab.runC;sammyAnsDRefreshUi();sammyAnsD2RefreshUi();sammyAnsD3RefreshUi();if(!busy&&!sammyAnsLab.dRunning&&!sammyAnsLab.d2Running&&!sammyAnsLab.d3Running){if(sammyAnsLab.runC)sammyAnsStatus("A + B + C abgeschlossen · End-to-End D ist freigeschaltet.","ok");else if(sammyAnsLab.runB)sammyAnsStatus("A + B abgeschlossen · C prüft Modell-Tiefe, Messfehler und Unsicherheit.","ok");else if(sammyAnsLab.runA)sammyAnsStatus("A abgeschlossen · Blind Validation B ist freigeschaltet.","ok");else sammyAnsStatus("Bereit · A nutzt ausschließlich Train + Validation.")}}
function sammyAnsWorker(){if(sammyAnsLab.worker)return sammyAnsLab.worker;if(typeof Worker==="undefined")throw new Error("Web Worker wird von diesem Browser nicht unterstützt.");const w=new Worker("./ansur-lab-worker.js?v=0.8.17");w.onmessage=e=>{const m=e.data||{};if(m.type==="progress"){sammyAnsProgress(m.run,m.progress);if(m.run==="DPREP"){if(sammyAnsLab.dPrepOwner==="D3")sammyAnsD3Status(m.text);else if(sammyAnsLab.dPrepOwner==="D2")sammyAnsD2Status(m.text);else sammyAnsDStatus(m.text)}else sammyAnsStatus(m.text);return}if(m.type==="error"){const rej=sammyAnsLab.dPrepReject;sammyAnsLab.dPrepResolve=null;sammyAnsLab.dPrepReject=null;sammyAnsLab.running=null;sammyAnsLab.lastError=m;w.terminate();sammyAnsLab.worker=null;if(rej)rej(new Error(m.message));sammyAnsStatus(`${m.run} · ${m.message}`,"error");sammyAnsRefreshUi();return}if(m.type==="result"){if(m.run==="A")sammyAnsLab.runA=m.result;if(m.run==="B")sammyAnsLab.runB=m.result;if(m.run==="C")sammyAnsLab.runC=m.result;const res=sammyAnsLab.dPrepResolve;if(m.run==="DPREP"){sammyAnsLab.dPrepResolve=null;sammyAnsLab.dPrepReject=null;if(res)res(m.result)}sammyAnsLab.running=null;w.terminate();sammyAnsLab.worker=null;if(m.run!=="DPREP")sammyAnsPersist();sammyAnsRefreshUi()}};w.onerror=e=>{const rej=sammyAnsLab.dPrepReject;sammyAnsLab.dPrepResolve=null;sammyAnsLab.dPrepReject=null;sammyAnsLab.running=null;try{w.terminate()}catch{}sammyAnsLab.worker=null;if(rej)rej(new Error(e.message||"Worker-Fehler"));sammyAnsStatus(`Worker-Fehler: ${e.message||"unbekannt"}`,"error");sammyAnsRefreshUi()};sammyAnsLab.worker=w;return w}
function sammyAnsRunA(){if(sammyAnsLab.running||sammyAnsLab.dRunning)return;try{sammyAnsLab.running="A";sammyAnsProgress("A",0);sammyAnsStatus("A · Research Sweep startet …");sammyAnsRefreshUi();sammyAnsWorker().postMessage({type:"runA"})}catch(e){sammyAnsLab.running=null;sammyAnsStatus(e.message||String(e),"error");sammyAnsRefreshUi()}}
function sammyAnsRunB(){if(sammyAnsLab.running||sammyAnsLab.dRunning||!sammyAnsLab.runA)return;try{sammyAnsLab.running="B";sammyAnsProgress("B",0);sammyAnsStatus("B · Blind Validation startet …");sammyAnsRefreshUi();sammyAnsWorker().postMessage({type:"runB",runA:sammyAnsLab.runA})}catch(e){sammyAnsLab.running=null;sammyAnsStatus(e.message||String(e),"error");sammyAnsRefreshUi()}}
function sammyAnsRunC(){if(sammyAnsLab.running||sammyAnsLab.dRunning||!sammyAnsLab.runA||!sammyAnsLab.runB)return;try{sammyAnsLab.running="C";sammyAnsProgress("C",0);sammyAnsStatus("C · Modell-Tiefe + Robustheit startet …");sammyAnsRefreshUi();sammyAnsWorker().postMessage({type:"runC",runA:sammyAnsLab.runA,runB:sammyAnsLab.runB})}catch(e){sammyAnsLab.running=null;sammyAnsStatus(e.message||String(e),"error");sammyAnsRefreshUi()}}
function sammyAnsPrepareD(count,family,owner="D"){if(sammyAnsLab.running)throw new Error("ANSUR Worker läuft bereits.");sammyAnsLab.dPrepOwner=owner;return new Promise((resolve,reject)=>{sammyAnsLab.running="DPREP";sammyAnsLab.dPrepResolve=resolve;sammyAnsLab.dPrepReject=reject;sammyAnsProgress("DPREP",0);sammyAnsWorker().postMessage({type:"prepareD",runC:sammyAnsLab.runC,count,family})})}
function sammyAnsExport(summaryOnly=false){if(!sammyAnsLab.runA&&!sammyAnsLab.runB&&!sammyAnsLab.runC)return;const generated=new Date().toISOString(),base={schema:"sammy-ansur-lab-v2",app:"Sammy",version:"0.8.17",generated,purpose:"ANSUR II A/B/C: initial research, first blind validation, then post-blind model-depth/noise/uncertainty diagnostics before real R5 mesh validation D.",summary:{runA:sammyAnsLab.runA?{generated:sammyAnsLab.runA.generated,selectedLambda:sammyAnsLab.runA.selectedLambda,bestSets:sammyAnsLab.runA.bestSets}:null,runB:sammyAnsLab.runB?{generated:sammyAnsLab.runB.generated,ranking:sammyAnsLab.runB.ranking,recommendedInputCount:sammyAnsLab.runB.recommendedInputCount}:null,runC:sammyAnsLab.runC?{generated:sammyAnsLab.runC.generated,recommendedFamily:sammyAnsLab.runC.recommendedFamily,familyValidationScores:sammyAnsLab.runC.familyValidationScores,recommendedModels:sammyAnsLab.runC.recommendedModels,noise:sammyAnsLab.runC.noise,uncertainty:sammyAnsLab.runC.uncertainty}:null}};const payload=summaryOnly?base:{...base,runA:sammyAnsLab.runA,runB:sammyAnsLab.runB,runC:sammyAnsLab.runC};const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=summaryOnly?`Sammy_ANSUR_Lab_Summary_${generated.replace(/[:.]/g,"-")}.json`:`Sammy_ANSUR_Lab_FULL_${generated.replace(/[:.]/g,"-")}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500)}
function sammyAnsReset(){if(sammyAnsLab.running||sammyAnsLab.dRunning){sammyAnsStatus("Lauf läuft noch · Reset danach.");return}sammyAnsLab.runA=null;sammyAnsLab.runB=null;sammyAnsLab.runC=null;sammyAnsLab.lastError=null;try{localStorage.removeItem(SAMMY_ANS_RESULTS_KEY)}catch{}for(const r of ["A","B","C"])sammyAnsProgress(r,0);sammyAnsRefreshUi()}

// ---- D · ANSUR prediction -> complete 31 targets -> frozen R5 -> real mesh -
async function sammyAnsBridgeLoad(){if(sammyAnsLab.bridgeData)return sammyAnsLab.bridgeData;if(sammyAnsLab.bridgePromise)return sammyAnsLab.bridgePromise;sammyAnsLab.bridgePromise=(async()=>{const r=await fetch("./ansur-dimensions-bridge-v1.json?v=0.8.17",{cache:"force-cache"});if(!r.ok)throw new Error(`ANSUR→DIMENSIONS Bridge HTTP ${r.status}`);const d=await r.json();if(d?.schema!=="sammy-ansur-to-dimensions-bridge-v1")throw new Error("ANSUR→DIMENSIONS Bridge ungültig");sammyAnsLab.bridgeData=d;return d})().finally(()=>{sammyAnsLab.bridgePromise=null});return sammyAnsLab.bridgePromise}
function sammyAnsBridgePredict(bridge,sex,ageYears,primary){const key=sex?"female":"male",m=bridge.models?.[key],a=bridge.inputAlignment?.[key];if(!m)throw new Error("Bridge-Modell fehlt");const out=Object.fromEntries(m.outputIds.map((id,j)=>[id,Number(m.meanY[j])]));for(let i=0;i<m.inputIds.length;i++){const id=m.inputIds[i],raw=id==="ageYears"?Number(ageYears):Number(primary[id]);if(!Number.isFinite(raw))throw new Error(`Bridge-Input fehlt: ${id}`);let v=raw;if(a?.inputIds?.[i]===id){const za=(raw-Number(a.ansurMean[i]))/Math.max(1e-9,Number(a.ansurStd[i])),zc=Math.max(-Number(a.zClamp||3.25),Math.min(Number(a.zClamp||3.25),za));v=Number(a.calibrationMean[i])+zc*Number(a.calibrationStd[i])}const z=(v-Number(m.meanX[i]))/Math.max(1e-9,Number(m.stdX[i]));for(let j=0;j<m.outputIds.length;j++)out[m.outputIds[j]]+=z*Number(m.coeff[i][j])}const bounds=bridge.outputBounds?.[key]||{};for(const [id,v] of Object.entries(out)){const b=bounds[id];if(Array.isArray(b)&&b.length===2)out[id]=Math.max(Number(b[0]),Math.min(Number(b[1]),Number(v)))}if(Number.isFinite(Number(primary.waist_back_length)))out.front_chest_length=Number(primary.waist_back_length);return out}
function sammyAnsDTarget31(run,person,n,bridge){const v=person.variants?.[String(n)],primary={};for(const id of run.prep.primaryTargetIds)primary[id]=Number(v?.predicted?.[id]);const extra=sammyAnsBridgePredict(bridge,person.sex,person.ageYears,primary),target={...primary,...extra};for(const d of SAMMY_MEASURE_DEFS)if(!Number.isFinite(Number(target[d.id])))throw new Error(`D Zielmaß fehlt: ${d.id}`);return target}
function sammyAnsDStatsNew(primaryIds){const make=()=>({count:0,predSS:0,meshSS:0,predBody:[],meshBody:[],knownSS:0,knownN:0,perMeasure:Object.fromEntries(primaryIds.map(id=>[id,{predSS:0,meshSS:0,meshAbs:0,meshBias:0,n:0,absValues:[]}])),bySex:{male:{ss:0,n:0},female:{ss:0,n:0}},canon:{eval:0,accepted:0,rejected:0},cases:[]});return {primaryIds:[...primaryIds],variants:{"5":make(),"6":make(),"7":make()},paired:{},nonFinite:0}}
function sammyAnsDStatsAdd(run,personIndex,n,person,target31,result){const s=run.stats.variants[String(n)],model=sammySolverHydrate({runId:"ansur-d-stats",model:run.model}),idx=Object.fromEntries(model.measureIds.map((id,i)=>[id,i])),mesh=result.production.actual,pred=person.variants[String(n)].predicted,known=new Set(person.variants[String(n)].inputs),sex=person.sex?"female":"male";let pss=0,mss=0,mn=0,knownSS=0,knownN=0;for(const id of run.stats.primaryIds){const truth=Number(person.actual[id]),pe=Number(pred[id])-truth,me=Number(mesh[idx[id]])-truth;if(!Number.isFinite(pe)||!Number.isFinite(me)){run.stats.nonFinite++;continue}pss+=pe*pe;mss+=me*me;mn++;s.predSS+=pe*pe;s.meshSS+=me*me;const q=s.perMeasure[id],a=Math.abs(me);q.predSS+=pe*pe;q.meshSS+=me*me;q.meshAbs+=a;q.meshBias+=me;q.n++;q.absValues.push(a);s.bySex[sex].ss+=me*me;s.bySex[sex].n++;if(known.has(id)){s.knownSS+=me*me;s.knownN++;knownSS+=me*me;knownN++}}s.count++;const predBody=Math.sqrt(pss/Math.max(1,mn)),meshBody=Math.sqrt(mss/Math.max(1,mn));s.predBody.push(predBody);s.meshBody.push(meshBody);const c=result.canonicalization;s.canon.eval+=c.evaluations;s.canon.accepted+=c.accepted;s.canon.rejected+=c.rejected;s.cases.push({personIndex,rowIndex:person.rowIndex,sex,predictionRmseCm:Number(predBody.toFixed(4)),meshRmseCm:Number(meshBody.toFixed(4)),knownInputMeshRmseCm:knownN?Number(Math.sqrt(knownSS/knownN).toFixed(4)):null,canonicalization:c});const pair=run.stats.paired[String(personIndex)]||(run.stats.paired[String(personIndex)]={});pair[String(n)]=meshBody}
function sammyAnsDVariantSummary(v){const denom=Math.max(1,v.count),per={},measureCount=Math.max(1,Object.keys(v.perMeasure).length);for(const [id,q] of Object.entries(v.perMeasure)){const n=Math.max(1,q.n);per[id]={predictionRmseCm:Number(Math.sqrt(q.predSS/n).toFixed(4)),meshRmseCm:Number(Math.sqrt(q.meshSS/n).toFixed(4)),meshMaeCm:Number((q.meshAbs/n).toFixed(4)),meshBiasCm:Number((q.meshBias/n).toFixed(4)),p95AbsCm:sammyProductionPercentile(q.absValues,.95)}}const a=v.meshBody.slice().sort((x,y)=>x-y),bySex={};for(const [k,q] of Object.entries(v.bySex))bySex[k]={rmseCm:q.n?Number(Math.sqrt(q.ss/q.n).toFixed(4)):null};return {count:v.count,predictionRmseCm:Number(Math.sqrt(v.predSS/Math.max(1,v.count*measureCount)).toFixed(4)),meshRmseCm:Number(Math.sqrt(v.meshSS/Math.max(1,v.count*measureCount)).toFixed(4)),knownInputMeshRmseCm:v.knownN?Number(Math.sqrt(v.knownSS/v.knownN).toFixed(4)):null,p50BodyRmseCm:sammyProductionPercentile(a,.5),p90BodyRmseCm:sammyProductionPercentile(a,.9),p95BodyRmseCm:sammyProductionPercentile(a,.95),maxBodyRmseCm:a.length?Number(a.at(-1).toFixed(4)):null,bySex,perMeasure:per,canonicalization:{meanEvaluations:Number((v.canon.eval/denom).toFixed(2)),meanAccepted:Number((v.canon.accepted/denom).toFixed(2)),meanRejected:Number((v.canon.rejected/denom).toFixed(2))},worstCases:v.cases.slice().sort((x,y)=>y.meshRmseCm-x.meshRmseCm).slice(0,12)} }
function sammyAnsDStatsSummary(run){const variants=Object.fromEntries([5,6,7].map(n=>[String(n),sammyAnsDVariantSummary(run.stats.variants[String(n)])])),d56=[],d67=[],d57=[];for(const p of Object.values(run.stats.paired)){if(Number.isFinite(p["5"])&&Number.isFinite(p["6"]))d56.push(p["6"]-p["5"]);if(Number.isFinite(p["6"])&&Number.isFinite(p["7"]))d67.push(p["7"]-p["6"]);if(Number.isFinite(p["5"])&&Number.isFinite(p["7"]))d57.push(p["7"]-p["5"])}const mean=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;return {schema:"sammy-ansur-endtoend-summary-v1",mode:run.mode,family:run.family,people:run.prep.peopleCount,totalBuilds:run.totalBuilds,completedBuilds:run.cursor,completedPct:Number((100*run.cursor/Math.max(1,run.totalBuilds)).toFixed(1)),primaryTargetCount:run.stats.primaryIds.length,variants,pairedMeanBodyDeltaCm:{sixMinusFive:mean(d56)==null?null:Number(mean(d56).toFixed(4)),sevenMinusSix:mean(d67)==null?null:Number(mean(d67).toFixed(4)),sevenMinusFive:mean(d57)==null?null:Number(mean(d57).toFixed(4))},nonFinite:run.stats.nonFinite,bridgeValidation:run.bridgeValidation,notes:{score:"Only 24 direct+derived ANSUR-comparable measures are scored. Seven bridge-only Sammy targets are construction priors, not ANSUR truth.",path:"5/6/7 real inputs -> ANSUR model -> 24 primary targets -> 7 Sammy bridge targets -> frozen DIMENSIONS/R5 -> real mesh -> MEAS."}}}
function sammyAnsDStatus(text=""){const n=$("#sammyAnsDStatus");if(n&&text)n.textContent=text;const run=sammyAnsLab.dRun,bar=$("#sammyAnsDProgress");if(run&&bar)bar.style.width=`${(100*Number(run.cursor||0)/Math.max(1,Number(run.totalBuilds||1))).toFixed(1)}%`}
function sammyAnsDRender(){const n=$("#sammyAnsDResult"),run=sammyAnsLab.dRun;if(!n)return;if(!run?.summary){n.innerHTML="";return}const s=run.summary,fmt=(v,d=2)=>v==null||v===""?"–":Number.isFinite(Number(v))?Number(v).toFixed(d):"–",rows=[5,6,7].map(k=>{const q=s.variants?.[String(k)];if(!q)return"";if(!Number(q.count||0))return `<div class="sammyAnsResultRow"><b>${k}</b><span>noch nicht berechnet</span><strong>–</strong></div>`;return `<div class="sammyAnsResultRow"><b>${k}</b><span>Prediction ${fmt(q.predictionRmseCm)} · Mesh ${fmt(q.meshRmseCm)} cm</span><strong>P95 ${fmt(q.p95BodyRmseCm)}</strong></div>`}).join("");n.innerHTML=`<div class="sammyAnsResultTitle"><b>D ${run.stage==="complete"?"fertig":"Zwischenstand"} · ${run.family}</b><span>${run.cursor}/${run.totalBuilds} Builds · 24 Primärmaße</span></div>${rows}`}
function sammyAnsDRefreshUi(){sammyAnsDRender();const run=sammyAnsLab.dRun,busy=sammyAnsLab.dRunning||sammyAnsLab.d2Running||sammyAnsLab.d3Running||!!sammyAnsLab.running,start=$("#sammyAnsDStart"),pause=$("#sammyAnsDPause"),reset=$("#sammyAnsDReset"),sum=$("#sammyAnsDSummary"),full=$("#sammyAnsDFull");document.querySelectorAll("[data-ans-d-mode]").forEach(b=>{b.classList.toggle("active",b.dataset.ansDMode===sammyAnsLab.dMode);b.disabled=busy||(run&&run.stage!=="complete")});if(start){start.disabled=busy||!sammyAnsLab.runC;start.textContent=sammyAnsLab.dRunning?"Läuft …":(run&&run.stage!=="complete"?"Fortsetzen":"End-to-End starten")}if(pause)pause.disabled=!sammyAnsLab.dRunning;if(reset)reset.disabled=busy||!run;if(sum)sum.disabled=!run;if(full)full.disabled=!run;if(run){const s=run.summary;if(run.stage==="complete")sammyAnsDStatus(`Fertig · ${run.prep.peopleCount} Personen × 3 · 5/6/7 Mesh ${s?.variants?.["5"]?.meshRmseCm??"—"} / ${s?.variants?.["6"]?.meshRmseCm??"—"} / ${s?.variants?.["7"]?.meshRmseCm??"—"} cm`);else if(!sammyAnsLab.dRunning)sammyAnsDStatus(`Gespeichert · Build ${Number(run.cursor||0)+1}/${run.totalBuilds} kann fortgesetzt werden.`)}else sammyAnsDStatus("C abschließen · danach 5/6/7 paarweise durch echten R5-Mesh testen.")}
function sammyAnsDSetMode(mode){if(!SAMMY_ANS_D_CONFIG[mode]||sammyAnsLab.dRunning||sammyAnsLab.d2Running||sammyAnsLab.d3Running||sammyAnsLab.running||sammyAnsLab.dRun?.stage&&sammyAnsLab.dRun.stage!=="complete")return;sammyAnsLab.dMode=mode;sammyAnsDRefreshUi()}
function sammyAnsDCaptureState(){return {core:{...annyParams},local:{...(annyLocalValues||{})},relative:lastAppliedRelative3?Array.from(lastAppliedRelative3):null,running:poseAnimRunning,mode:poseAnimMode,frame:userAnimCurrentFrame,overlayVisible:sammyMeasureOverlayGroup?.visible??false}}
async function sammyAnsDMeasurementPose(){stopPoseAnimation(false);sammyApplyMeasurementRelative(sammyMeasurementIdentityPose(),"ANSUR D measurement T-Pose");await new Promise(r=>requestAnimationFrame(()=>r()))}
async function sammyAnsDRestoreState(){const s=sammyAnsLab.dRestore;sammyAnsLab.dRestore=null;if(!s)return;annyParams={...s.core};annyLocalValues={...s.local};applyAnnyParams();sammyMeasureSyncLocalUiV3();if(s.relative)sammyApplyMeasurementRelative(new Float32Array(s.relative),"ANSUR D → previous pose");sammyClearMeasureOverlay();if(s.running&&s.mode==="user"&&userAnimLoaded)startPoseAnimation("user",Math.max(0,Math.min(userAnimFrames-1,s.frame||0)));await new Promise(r=>requestAnimationFrame(()=>r()))}
function sammyAnsDRuntime(run){return {runId:`${run.runId}:r5`,model:run.model,mode:"deep",productionProfile:run.productionProfile}}
async function sammyAnsDNewRun(){const cfg=SAMMY_ANS_D_CONFIG[sammyAnsLab.dMode],source=await sammyDimensionsFindSource();if(!source)throw new Error("Kein abgeschlossener R2/R5-Source gefunden.");const family=sammyAnsLab.runC?.recommendedFamily||"consumer";sammyAnsDStatus(`D vorbereitet · ${cfg.people} Personen × 3 · ${family} …`);const prep=await sammyAnsPrepareD(cfg.people,family),bridge=await sammyAnsBridgeLoad(),runtime=sammyDimensionsRuntimeFromSource(source,`ansur-d-prep-${Date.now()}`),model=sammySolverHydrate(runtime);const run={schema:SAMMY_ANS_D_SCHEMA,runId:`ansur-e2e-${new Date().toISOString().replace(/[:.]/g,"-")}-${Math.random().toString(36).slice(2,7)}`,appVersion:"0.8.17",mode:sammyAnsLab.dMode,family,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),stage:"testing",cursor:0,totalBuilds:prep.peopleCount*3,canonEvalLimit:cfg.canonEvals,sourceSolverRunId:source.runId,sourceSolverVersion:source.appVersion,calibrationRunId:source.calibrationRunId,model:source.model,productionProfile:runtime.productionProfile,prep,bridgeValidation:bridge.validation,stats:sammyAnsDStatsNew(prep.primaryTargetIds),summary:null,notes:{testPartition:"same post-blind 15% test partition already opened in B; D is end-to-end validation, not a new untouched blind set",paired:"same ANSUR persons are reconstructed with 5, 6 and 7 inputs",bridge:"seven Sammy-only/proxy targets are generated by a compact bridge trained on corrected 6000 calibration bodies and are excluded from ANSUR score",solver:"frozen R5; no solver parameters changed"}};return run}
async function sammyAnsDTestOne(run,buildIndex){const personIndex=Math.floor(buildIndex/3),n=[5,6,7][buildIndex%3],person=run.prep.people[personIndex],bridge=await sammyAnsBridgeLoad(),target31=sammyAnsDTarget31(run,person,n,bridge),context={core:{gender:person.sex,age:sammyDimensionsYearsToShapeAge(person.ageYears,person.sex)},local:{}},runtime=sammyAnsDRuntime(run);sammyAnsDStatus(`D · Person ${personIndex+1}/${run.prep.peopleCount} · ${n} Angaben · R5 …`);const result=await sammyDimensionsSolveEngine(runtime,target31,context,run.canonEvalLimit,p=>{if(sammyMeasureOverlayGroup)sammyMeasureOverlayGroup.visible=false;if(p.phase==="fit")sammyAnsDStatus(`D · ${personIndex+1}/${run.prep.peopleCount} · ${n} Maße · R2 Mesh ${p.pass}/${p.total} · ${Number(p.rmseCm).toFixed(2)} cm`);else sammyAnsDStatus(`D · ${personIndex+1}/${run.prep.peopleCount} · ${n} Maße · R5 Guard ${p.evaluation}/${p.total} · ${p.accepted?"ACCEPT":"ROLLBACK"}`)},false);sammyAnsDStatsAdd(run,personIndex,n,person,target31,result);await sammySolverRecord(run,"ansur-e2e",`ANSUR D person ${personIndex+1} · ${n} inputs`,{buildIndex,personIndex,inputCount:n,rowIndex:person.rowIndex,sex:person.sex,ageYears:person.ageYears,inputs:person.variants[String(n)].inputs,predictedPrimary:Object.fromEntries(run.prep.primaryTargetIds.map(id=>[id,person.variants[String(n)].predicted[id]])),actualPrimary:Object.fromEntries(run.prep.primaryTargetIds.map(id=>[id,person.actual[id]])),target31,result:{baseline:result.baseline,production:result.production,canonicalization:result.canonicalization}});sammyClearMeasureOverlay()}
async function sammyAnsDRunner(){const run=sammyAnsLab.dRun;if(!run)return;sammyAnsLab.dRunning=true;sammyAnsLab.dPaused=false;sammyAnsLab.dExitAfterPause=false;document.body.classList.add("sammy-ansur-d-running");sammyAnsLab.dRestore=sammyAnsDCaptureState();sammyAnsDRefreshUi();try{await sammyAnsDMeasurementPose();while(sammyAnsLab.dRunning&&!sammyAnsLab.dPaused&&run.stage!=="complete"){const i=run.cursor;if(i>=run.totalBuilds){run.summary=sammyAnsDStatsSummary(run);run.stage="complete";run.completedAt=new Date().toISOString();await sammySolverPutRun(run);break}await sammyAnsDTestOne(run,i);run.cursor=i+1;run.summary=sammyAnsDStatsSummary(run);await sammySolverPutRun(run);sammyAnsDRefreshUi()}if(run.stage==="complete"){run.summary=sammyAnsDStatsSummary(run);sammyAnsDStatus(`D fertig · Mesh 5/6/7: ${run.summary.variants["5"].meshRmseCm} / ${run.summary.variants["6"].meshRmseCm} / ${run.summary.variants["7"].meshRmseCm} cm`)}else if(sammyAnsLab.dPaused)sammyAnsDStatus(`D pausiert · ${run.cursor}/${run.totalBuilds} Builds gespeichert.`)}catch(e){console.error("ANSUR End-to-End D",e);sammyAnsLab.dPaused=true;sammyAnsDStatus(`FEHLER: ${e?.message||e}`);sammyReportError?.(e,{source:"ANSUR End-to-End D"})}finally{sammyAnsLab.dRunning=false;document.body.classList.remove("sammy-ansur-d-running");await sammyAnsDRestoreState();sammyAnsDRefreshUi();sammyAnsLab.dExitAfterPause=false}}
async function sammyAnsDStartOrResume(){if(sammyAnsLab.dRunning||sammyAnsLab.d2Running||sammyAnsLab.d3Running||sammyAnsLab.running||!sammyAnsLab.runC)return;if(!annyPackLoaded){sammyAnsDStatus("Anny-Pack ist noch nicht bereit.");return}try{let run=sammyAnsLab.dRun;if(!run||run.schema!==SAMMY_ANS_D_SCHEMA||run.stage==="complete"){run=await sammyAnsDNewRun();sammyAnsLab.dRun=run;sammySolverRuntimeCache=null;await sammySolverPutRun(run)}sammyAnsDRunner()}catch(e){sammyAnsLab.running=null;sammyAnsDStatus(`FEHLER: ${e?.message||e}`);sammyReportError?.(e,{source:"ANSUR D start"});sammyAnsRefreshUi()}}
function sammyAnsDPause(){if(!sammyAnsLab.dRunning)return;sammyAnsLab.dPaused=true;sammyAnsDStatus("Pause nach dem aktuellen 5/6/7-Build · letzter fertiger Build ist gespeichert.")}
async function sammyAnsDReset(){const run=sammyAnsLab.dRun;if(sammyAnsLab.dRunning||sammyAnsLab.d2Running||sammyAnsLab.d3Running||sammyAnsLab.running||!run)return;if(!confirm("Gespeicherten ANSUR End-to-End-D-Lauf löschen? A/B/C und R5 bleiben erhalten."))return;await sammySolverDeleteRun(run.runId);sammyAnsLab.dRun=null;sammyAnsProgress("DPREP",0);sammyAnsDStatus("D-Lauf gelöscht · A/B/C und R5 unverändert.");sammyAnsDRefreshUi()}
async function sammyAnsDLoadLatest(){try{const runs=(await sammySolverGetRuns()).filter(r=>r?.schema===SAMMY_ANS_D_SCHEMA).sort((a,b)=>String(b.updatedAt||"").localeCompare(String(a.updatedAt||""))),active=runs.find(r=>r.stage!=="complete")||runs[0]||null;sammyAnsLab.dRun=active;if(active){sammyAnsLab.dMode=active.mode||"deep";sammyAnsDRefreshUi()}}catch(e){console.warn("ANSUR D resume",e)}}
async function sammyAnsDExport(summaryOnly=false){const run=sammyAnsLab.dRun;if(!run){sammyAnsDStatus("Kein D-Lauf zum Exportieren.");return}const summary=run.summary||sammyAnsDStatsSummary(run),base={schema:SAMMY_ANS_D_SCHEMA,app:"Sammy",version:"0.8.17",generated:new Date().toISOString(),purpose:"ANSUR sparse inputs -> statistical body prediction -> 31 DIMENSIONS targets -> frozen R5 -> real mesh -> comparison against 24 genuinely comparable ANSUR measurements.",summary,notes:run.notes};let payload=base;if(!summaryOnly){const records=await sammySolverGetRecords(run.runId);payload={...base,run,records}}const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=summaryOnly?`Sammy_ANSUR_D_Summary_${run.mode}_${run.runId}.json`:`Sammy_ANSUR_D_FULL_${run.mode}_${run.runId}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500)}


// ---- ANSUR D2 · alignment + weighted/lexicographic constraints ------------
function sammyAnsD2Fmt(v,d=2){return v==null||v===""||!Number.isFinite(Number(v))?"–":Number(v).toFixed(d)}
function sammyAnsD2Status(text=""){const n=$("#sammyAnsD2Status");if(n&&text)n.textContent=text;const run=sammyAnsLab.d2Run,bar=$("#sammyAnsD2Progress");if(run&&bar)bar.style.width=`${(100*Number(run.cursor||0)/Math.max(1,Number(run.totalBuilds||1))).toFixed(1)}%`}
function sammyAnsD2SetMode(mode){if(!SAMMY_ANS_D2_CONFIG[mode]||sammyAnsLab.d2Running||sammyAnsLab.dRunning||sammyAnsLab.d3Running||sammyAnsLab.running||sammyAnsLab.d2Run?.stage&&sammyAnsLab.d2Run.stage!=="complete")return;sammyAnsLab.d2Mode=mode;sammyAnsD2RefreshUi()}
function sammyAnsD2VariantLabel(v){return v==="T24"?"T24 · Full Truth":v==="K7"?"K7 · 7 echte Angaben":"K5 · 5 echte Angaben"}
function sammyAnsD2Render(){const host=$("#sammyAnsD2Result"),run=sammyAnsLab.d2Run;if(!host)return;if(!run?.summary){host.innerHTML="";return}const s=run.summary,rows=SAMMY_ANS_D2_VARIANTS.map(v=>{const q=s.variants?.[v];if(!q||!q.count)return `<div class="sammyAnsResultRow"><b>${v}</b><span>noch nicht berechnet</span><strong>–</strong></div>`;return `<div class="sammyAnsResultRow"><b>${v}</b><span>Truth ${sammyAnsD2Fmt(q.primaryTruthRmseCm)} cm · Hard ${sammyAnsD2Fmt(q.hardInputRmseCm)} cm · P95 ${sammyAnsD2Fmt(q.p95BodyRmseCm)}</span><strong>${sammyAnsD2Fmt(q.targetFitRmseCm)} cm Ziel-Fit</strong></div>`}).join(""),verdict=s.alignmentVerdict?`<div class="sammyAnsResultTitle"><b>${escapeHtml(s.alignmentVerdict.label)}</b><span>${escapeHtml(s.alignmentVerdict.detail)}</span></div>`:"";host.innerHTML=`${verdict}${rows}`}
function sammyAnsD2RefreshUi(){const run=sammyAnsLab.d2Run,active=run&&run.stage!=="complete",start=$("#sammyAnsD2Start"),pause=$("#sammyAnsD2Pause"),reset=$("#sammyAnsD2Reset"),sum=$("#sammyAnsD2Summary"),full=$("#sammyAnsD2Full");document.querySelectorAll("[data-ans-d2-mode]").forEach(x=>{x.classList.toggle("active",x.dataset.ansD2Mode===sammyAnsLab.d2Mode);x.disabled=sammyAnsLab.d2Running||sammyAnsLab.dRunning||sammyAnsLab.d3Running||!!sammyAnsLab.running||!!active});if(start){start.disabled=sammyAnsLab.d2Running||sammyAnsLab.dRunning||sammyAnsLab.d3Running||!!sammyAnsLab.running||!sammyAnsLab.runC;start.textContent=sammyAnsLab.d2Running?"Läuft …":active?"Fortsetzen":"D2 starten"}if(pause)pause.disabled=!sammyAnsLab.d2Running;if(reset)reset.disabled=sammyAnsLab.d2Running||sammyAnsLab.dRunning||sammyAnsLab.d3Running||!!sammyAnsLab.running||!run;if(sum)sum.disabled=!run;if(full)full.disabled=!run;sammyAnsD2Render();if(run){if(run.stage==="complete")sammyAnsD2Status(`D2 fertig · T24/K7/K5 Truth: ${sammyAnsD2Fmt(run.summary?.variants?.T24?.primaryTruthRmseCm)} / ${sammyAnsD2Fmt(run.summary?.variants?.K7?.primaryTruthRmseCm)} / ${sammyAnsD2Fmt(run.summary?.variants?.K5?.primaryTruthRmseCm)} cm`);else if(!sammyAnsLab.d2Running)sammyAnsD2Status(`Gespeichert · ${run.cursor}/${run.totalBuilds} Builds · Fortsetzen möglich.`)}else sammyAnsD2Status("Bereit · T24 trennt Mapping/Expressivität von Prediction-Fehlern.")}
function sammyAnsD2Uncertainty(run,n,id){const b=run.uncertainty?.[String(n)]?.bandsCm?.[id],p68=Number(b?.p68);return Number.isFinite(p68)&&p68>.05?Math.max(.25,p68):1.5}
function sammyAnsD2Case(run,person,variant,bridge){const model=sammySolverHydrate(run),primaryIds=run.prep.primaryTargetIds,truth=Object.fromEntries(primaryIds.map(id=>[id,Number(person.actual[id])])),inputN=variant==="K7"?7:variant==="K5"?5:null,pred=inputN?person.variants[String(inputN)]?.predicted:null,inputs=inputN?(person.variants[String(inputN)]?.inputs||[]):[],hardIds=variant==="T24"?[...primaryIds]:inputs.filter(id=>primaryIds.includes(id)),hardSet=new Set(hardIds),primary={};for(const id of primaryIds){let v=variant==="T24"?truth[id]:Number(pred?.[id]);if(hardSet.has(id))v=truth[id];primary[id]=v}const extra=sammyAnsBridgePredict(bridge,person.sex,person.ageYears,primary),target31={...primary,...extra};for(const id of model.measureIds)if(!Number.isFinite(Number(target31[id])))throw new Error(`D2 Zielmaß fehlt: ${id}`);const primarySet=new Set(primaryIds),bridgeIds=model.measureIds.filter(id=>!primarySet.has(id)),softIds=primaryIds.filter(id=>!hardSet.has(id)),hardW=new Float64Array(model.m),softW=new Float64Array(model.m);for(let j=0;j<model.m;j++){const id=model.measureIds[j],base=SAMMY_SOLVER_LOW_WEIGHT_MEASURES.has(id)?.25:1;if(hardSet.has(id)){hardW[j]=64;softW[j]=25}else if(primarySet.has(id)){const sig=sammyAnsD2Uncertainty(run,inputN||7,id),w=Math.max(.08,Math.min(2.5,1/(sig*sig)));hardW[j]=.10*w*base;softW[j]=w*base}else{hardW[j]=.0125*base;softW[j]=.03*base}}return {variant,inputN,truth,primary,target31,hardIds,softIds,bridgeIds,hardWeights:Array.from(hardW),softWeights:Array.from(softW),inputs}}
function sammyAnsD2Metrics(model,actual,c){const idx=model.measureIndex||Object.fromEntries(model.measureIds.map((id,i)=>[id,i])),rm=(ids,target)=>{let ss=0,n=0,mx=0,bias=0;const absById={};for(const id of ids){const j=idx[id],a=Number(actual[j]),t=Number(target[id]);if(!Number.isFinite(a)||!Number.isFinite(t))continue;const e=a-t,ae=Math.abs(e);ss+=e*e;bias+=e;mx=Math.max(mx,ae);absById[id]=ae;n++}return {rmse:n?Math.sqrt(ss/n):Infinity,maxAbs:mx,bias:n?bias/n:0,n,absById}},hard=rm(c.hardIds,c.primary),truth=rm(Object.keys(c.truth),c.truth),target=rm(Object.keys(c.primary),c.primary),soft=rm(c.softIds,c.primary),bridge=rm(c.bridgeIds,c.target31),w=Float64Array.from(c.softWeights),targetVec=Float64Array.from(model.measureIds.map(id=>Number(c.target31[id])));return {hardRmse:hard.rmse,hardMaxAbs:hard.maxAbs,hardBias:hard.bias,hardAbs:hard.absById,primaryTruthRmse:truth.rmse,primaryTruthBias:truth.bias,primaryTargetRmse:target.rmse,softTargetRmse:soft.rmse,bridgeTargetRmse:bridge.rmse,weightedTargetRmse:sammySolverRMSE(targetVec,actual,w)}}
function sammyAnsD2HardGuard(candidate,anchor,variant,phase="soft"){const rmseSlack=phase==="hard"?(variant==="T24"?.12:.035):(variant==="T24"?.08:.05),perSlack=phase==="hard"?(variant==="T24"?.45:.14):(variant==="T24"?.25:.15);if(candidate.hardRmse>anchor.hardRmse+rmseSlack)return false;for(const [id,a] of Object.entries(anchor.hardAbs||{})){const c=Number(candidate.hardAbs?.[id]);if(Number.isFinite(c)&&c>Number(a)+perSlack)return false}return true}
function sammyAnsD2SurrogateSolve(runtime,c,context,weights,initialDs=null,iterations=50){const model=sammySolverHydrate(runtime),sex=Number(context?.core?.gender||0)>=.5?1:0,{ds:ctx,fixed}=sammySolverKnownContextDs(model,context,sex),ds=initialDs?Float64Array.from(initialDs):Float64Array.from(ctx),{lo,hi}=sammySolverBounds(model,sex),target=Float64Array.from(model.measureIds.map(id=>Number(c.target31[id]))),W=Array.from(weights),cfg=Math.max(iterations,SAMMY_SOLVER_CONFIG.deep.inverseIterations),seed=sammySolverSolveTarget(runtime,c.target31,context,null,initialDs);if(!initialDs)ds.set(seed.ds);for(const i of fixed)ds[i]=ctx[i];let lambda=.55,best=Infinity,bestDs=Float64Array.from(ds),stale=0;for(let it=0;it<cfg;it++){const pred=sammySolverFinalPrediction(model,ds,sex),err=new Float64Array(model.m);for(let j=0;j<model.m;j++)err[j]=target[j]-pred[j];const r=sammySolverRMSE(target,pred,W);if(r<best){best=r;bestDs=Float64Array.from(ds);stale=0}else stale++;if(stale>=7)break;const step=sammySolverDampedStep(model,ds,sex,err,W,fixed,lambda,.20);let improved=false;for(const alpha of [1,.55,.25]){const nd=Float64Array.from(ds);for(let i=0;i<model.n;i++)if(!fixed.has(i))nd[i]=Math.max(lo[i],Math.min(hi[i],nd[i]+alpha*step[i]));const nr=sammySolverRMSE(target,sammySolverFinalPrediction(model,nd,sex),W);if(nr<r-1e-5){ds.set(nd);lambda=Math.max(.04,lambda*.82);improved=true;break}}if(!improved)lambda=Math.min(40,lambda*2)}return {ds:Array.from(bestDs),weightedRmseCm:Number(best.toFixed(4)),sex}}
function sammyAnsD2BoundCount(model,ds,sex){const {lo,hi}=sammySolverBounds(model,sex);let n=0;for(let i=0;i<model.n;i++){const x=Number(ds[i]);if(Math.abs(x-lo[i])<.015||Math.abs(x-hi[i])<.015)n++}return n}
async function sammyAnsD2Apply(runtime,ds,sex,context){const shape=sammySolverDsToShape(runtime,ds,sex,context),results=await sammySolverApplyShape(shape),model=sammySolverHydrate(runtime);return Array.from(sammySolverMeasureArray(results,model))}
function sammyAnsD2StepDs(runtime,ds,sex,actual,c,weights,context,maxStep=.16){const model=sammySolverHydrate(runtime),target=Float64Array.from(model.measureIds.map(id=>Number(c.target31[id]))),err=new Float64Array(model.m);for(let j=0;j<model.m;j++)err[j]=target[j]-Number(actual[j]);const fixed=sammySolverKnownContextDs(model,context,sex).fixed,pen=new Array(model.n).fill(1),step=sammyProductionWeightedStep(model,ds,sex,err,Array.from(weights),fixed,pen,.55,maxStep),{lo,hi}=sammySolverBounds(model,sex);return {step,fixed,lo,hi}}
async function sammyAnsD2Fit(runtime,c,context,cfg,onProgress){const model=sammySolverHydrate(runtime),seed=sammyAnsD2SurrogateSolve(runtime,c,context,c.hardWeights,null,55),sex=seed.sex;let ds=Array.from(seed.ds),actual=await sammyAnsD2Apply(runtime,ds,sex,context),metrics=sammyAnsD2Metrics(model,actual,c),initialMetrics={...metrics},evals=1,hardAccepted=0,softAccepted=0,stale=0;const tryPhase=async(phase,passes,weights,anchor=null)=>{for(let pass=1;pass<=passes;pass++){const {step,fixed,lo,hi}=sammyAnsD2StepDs(runtime,ds,sex,actual,c,weights,context,phase==="hard"?.18:.12);let accepted=false;for(const alpha of [1,.45]){const nd=Array.from(ds);for(let i=0;i<model.n;i++)if(!fixed.has(i))nd[i]=Math.max(lo[i],Math.min(hi[i],nd[i]+alpha*step[i]));const na=await sammyAnsD2Apply(runtime,nd,sex,context);evals++;const nm=sammyAnsD2Metrics(model,na,c);let ok=false;if(phase==="hard"){const guard=sammyAnsD2HardGuard(nm,metrics,c.variant,"hard");ok=guard&&(nm.hardRmse<metrics.hardRmse-.002||nm.hardMaxAbs<metrics.hardMaxAbs-.01||(nm.hardRmse<=metrics.hardRmse+.004&&nm.primaryTargetRmse<metrics.primaryTargetRmse-.01))}else{const hardOk=sammyAnsD2HardGuard(nm,anchor,c.variant,"soft");ok=hardOk&&(nm.weightedTargetRmse<metrics.weightedTargetRmse-.002||nm.hardRmse<metrics.hardRmse-.01)}if(ok){ds=nd;actual=na;metrics=nm;accepted=true;if(phase==="hard")hardAccepted++;else softAccepted++;break}}if(onProgress)onProgress({phase,pass,total:passes,accepted,metrics,evals});if(!accepted)stale++;else stale=0;if(stale>=3)break;if(phase==="hard"&&metrics.hardRmse<.20)break}};await tryPhase("hard",cfg.hardPasses,c.hardWeights);const hardAnchor={...metrics};stale=0;if(c.softIds.length)await tryPhase("soft",cfg.softPasses,c.softWeights,hardAnchor);const beforeCanon={...metrics},costBefore=sammyProductionCost(runtime,ds,context);let currentCost=costBefore,canonEval=0,canonAccepted=0,canonRejected=0,pending=null,canonByClass={},rejectReason={};const cs={blocked:[],attemptCounts:{},currentDs:Array.from(ds),currentActual:Array.from(actual),currentRmseCm:metrics.weightedTargetRmse,currentCost};while(canonEval<cfg.canonEvals){let proposal=pending||sammyCanonicalNextProposal(runtime,c.target31,context,ds,cs);pending=null;if(!proposal)break;const na=await sammyAnsD2Apply(runtime,proposal.ds,sex,context);evals++;canonEval++;cs.attemptCounts[proposal.targetIndex]=Number(cs.attemptCounts[proposal.targetIndex]||0)+1;const nm=sammyAnsD2Metrics(model,na,c),costOk=proposal.costAfter<currentCost-1e-8,hardOk=sammyAnsD2HardGuard(nm,hardAnchor,c.variant,"canon"),targetOk=nm.weightedTargetRmse<=metrics.weightedTargetRmse+.025,ok=costOk&&hardOk&&targetOk;if(ok){ds=Array.from(proposal.ds);actual=na;metrics=nm;currentCost=proposal.costAfter;cs.currentDs=Array.from(ds);cs.currentActual=Array.from(actual);cs.currentRmseCm=metrics.weightedTargetRmse;cs.currentCost=currentCost;canonAccepted++;canonByClass[proposal.class]=(canonByClass[proposal.class]||0)+1}else{canonRejected++;const why=!costOk?"cost":!hardOk?"hard":"target";rejectReason[why]=(rejectReason[why]||0)+1;pending=sammyCanonicalRetryProposal(runtime,c.target31,context,ds,cs,proposal)}if(onProgress)onProgress({phase:"canon",evaluation:canonEval,total:cfg.canonEvals,accepted:ok,metrics,sliderId:proposal.sliderId,evals})}actual=await sammyAnsD2Apply(runtime,ds,sex,context);evals++;metrics=sammyAnsD2Metrics(model,actual,c);return {sex,ds,actual,initialMetrics,hardAnchor,beforeCanon,finalMetrics:metrics,evaluations:evals,hardAccepted,softAccepted,boundCount:sammyAnsD2BoundCount(model,ds,sex),canonicalization:{evaluations:canonEval,accepted:canonAccepted,rejected:canonRejected,costBefore:Number(costBefore.toFixed(6)),costAfter:Number(currentCost.toFixed(6)),costReductionPct:costBefore>1e-9?Number((100*(costBefore-currentCost)/costBefore).toFixed(2)):0,acceptedByClass:canonByClass,rejectedByReason:rejectReason}}}
function sammyAnsD2StatsNew(primaryIds){const make=()=>({count:0,truthSS:0,targetSS:0,hardSS:0,hardN:0,initialTruthSS:0,body:[],hardBody:[],targetBody:[],bounds:0,evals:0,canonAccepted:0,canonEval:0,bySex:{male:{ss:0,n:0},female:{ss:0,n:0}},perMeasure:Object.fromEntries(primaryIds.map(id=>[id,{ss:0,bias:0,abs:[],n:0}])),cases:[]});return {primaryIds:[...primaryIds],variants:{T24:make(),K7:make(),K5:make()},paired:{},nonFinite:0}}
function sammyAnsD2StatsAdd(run,personIndex,person,c,result){const s=run.stats.variants[c.variant],m=result.finalMetrics,mi=result.initialMetrics,model=sammySolverHydrate(run),idx=Object.fromEntries(model.measureIds.map((id,i)=>[id,i])),sex=person.sex?"female":"male";s.count++;s.truthSS+=m.primaryTruthRmse*m.primaryTruthRmse;s.targetSS+=m.primaryTargetRmse*m.primaryTargetRmse;s.initialTruthSS+=mi.primaryTruthRmse*mi.primaryTruthRmse;if(c.hardIds.length){s.hardSS+=m.hardRmse*m.hardRmse*c.hardIds.length;s.hardN+=c.hardIds.length}s.body.push(m.primaryTruthRmse);s.hardBody.push(m.hardRmse);s.targetBody.push(m.primaryTargetRmse);s.bounds+=result.boundCount;s.evals+=result.evaluations;s.canonAccepted+=result.canonicalization.accepted;s.canonEval+=result.canonicalization.evaluations;s.bySex[sex].ss+=m.primaryTruthRmse*m.primaryTruthRmse;s.bySex[sex].n++;for(const id of run.stats.primaryIds){const e=Number(result.actual[idx[id]])-Number(person.actual[id]);if(!Number.isFinite(e)){run.stats.nonFinite++;continue}const q=s.perMeasure[id];q.ss+=e*e;q.bias+=e;q.abs.push(Math.abs(e));q.n++}const rec={personIndex,rowIndex:person.rowIndex,sex,variant:c.variant,initialTruthRmseCm:Number(mi.primaryTruthRmse.toFixed(4)),primaryTruthRmseCm:Number(m.primaryTruthRmse.toFixed(4)),hardInputRmseCm:Number(m.hardRmse.toFixed(4)),hardMaxAbsCm:Number(m.hardMaxAbs.toFixed(4)),targetFitRmseCm:Number(m.primaryTargetRmse.toFixed(4)),weightedTargetRmseCm:Number(m.weightedTargetRmse.toFixed(4)),boundCount:result.boundCount,evaluations:result.evaluations,canonicalization:result.canonicalization};s.cases.push(rec);const pair=run.stats.paired[String(personIndex)]||(run.stats.paired[String(personIndex)]={});pair[c.variant]=m.primaryTruthRmse}
function sammyAnsD2VariantSummary(v){const n=Math.max(1,v.count),per={};for(const [id,q] of Object.entries(v.perMeasure)){per[id]={rmseCm:q.n?Number(Math.sqrt(q.ss/q.n).toFixed(4)):null,biasCm:q.n?Number((q.bias/q.n).toFixed(4)):null,p95AbsCm:sammyProductionPercentile(q.abs,.95)}}const sex={};for(const [k,q] of Object.entries(v.bySex))sex[k]={rmseCm:q.n?Number(Math.sqrt(q.ss/q.n).toFixed(4)):null};return {count:v.count,initialPrimaryTruthRmseCm:Number(Math.sqrt(v.initialTruthSS/n).toFixed(4)),primaryTruthRmseCm:Number(Math.sqrt(v.truthSS/n).toFixed(4)),targetFitRmseCm:Number(Math.sqrt(v.targetSS/n).toFixed(4)),hardInputRmseCm:v.hardN?Number(Math.sqrt(v.hardSS/v.hardN).toFixed(4)):null,p50BodyRmseCm:sammyProductionPercentile(v.body,.5),p90BodyRmseCm:sammyProductionPercentile(v.body,.9),p95BodyRmseCm:sammyProductionPercentile(v.body,.95),maxBodyRmseCm:v.body.length?Number(Math.max(...v.body).toFixed(4)):null,meanBoundSliders:Number((v.bounds/n).toFixed(2)),meanMeshEvaluations:Number((v.evals/n).toFixed(2)),meanCanonicalAccepted:v.canonEval?Number((v.canonAccepted/n).toFixed(2)):0,bySex:sex,perMeasure:per,worstCases:v.cases.slice().sort((a,b)=>b.primaryTruthRmseCm-a.primaryTruthRmseCm).slice(0,12)} }
function sammyAnsD2Summary(run){const variants=Object.fromEntries(SAMMY_ANS_D2_VARIANTS.map(v=>[v,sammyAnsD2VariantSummary(run.stats.variants[v])])),t=variants.T24,k7=variants.K7,k5=variants.K5,alignment=t.count?(t.primaryTruthRmseCm<=.75?{level:"good",label:"T24 kompatibel",detail:`24 echte ANSUR-Maße sind im Sammy-Mesh gut reproduzierbar (${t.primaryTruthRmseCm.toFixed(2)} cm).`}:t.primaryTruthRmseCm<=1.5?{level:"partial",label:"T24 nur teilweise kompatibel",detail:`Restfehler ${t.primaryTruthRmseCm.toFixed(2)} cm deutet auf Mapping/Expressivität einzelner Maße.`}:{level:"mismatch",label:"T24 Mapping/Expressivität auffällig",detail:`Selbst 24 echte Maße bleiben bei ${t.primaryTruthRmseCm.toFixed(2)} cm; ANSUR↔Sammy muss semantisch/alignment-seitig geprüft werden.`}):null;const meanDelta=(a,b)=>{const d=[];for(const q of Object.values(run.stats.paired))if(Number.isFinite(q[a])&&Number.isFinite(q[b]))d.push(q[b]-q[a]);return d.length?Number((d.reduce((x,y)=>x+y,0)/d.length).toFixed(4)):null};return {schema:"sammy-ansur-alignment-summary-v1",mode:run.mode,people:run.prep.peopleCount,totalBuilds:run.totalBuilds,completedBuilds:run.cursor,completedPct:Number((100*run.cursor/Math.max(1,run.totalBuilds)).toFixed(1)),variants,alignmentVerdict:alignment,pairedTruthDeltaCm:{K7minusT24:meanDelta("T24","K7"),K5minusT24:meanDelta("T24","K5"),K5minusK7:meanDelta("K7","K5")},previousD:run.previousD||null,nonFinite:run.stats.nonFinite,interpretation:{T24:"24 echte ANSUR-Maße + nur schwache Bridge; testet Mapping/Anny-Expressivität.",K7:"7 reale Eingaben hart; übrige ANSUR-Predictions nach empirischer C-Unsicherheit weich.",K5:"5 reale Eingaben hart; übrige ANSUR-Predictions nach empirischer C-Unsicherheit weich.",guard:"Hard inputs zuerst; Soft-Fit und R5-Canonicalization dürfen sie nur innerhalb enger Real-Mesh-Grenzen verändern."}}}
async function sammyAnsD2NewRun(){const cfg=SAMMY_ANS_D2_CONFIG[sammyAnsLab.d2Mode],source=await sammyDimensionsFindSource();if(!source)throw new Error("Kein abgeschlossener R2/R5-Source gefunden.");const family=sammyAnsLab.runC?.recommendedFamily||"consumer";sammyAnsD2Status(`D2 vorbereitet · ${cfg.people} Personen × T24/K7/K5 · ${family} …`);const prep=await sammyAnsPrepareD(cfg.people,family,"D2"),bridge=await sammyAnsBridgeLoad(),runtime=sammyDimensionsRuntimeFromSource(source,`ansur-d2-prep-${Date.now()}`),old=(await sammySolverGetRuns()).filter(r=>r?.schema===SAMMY_ANS_D_SCHEMA&&r.stage==="complete"&&r.summary).sort((a,b)=>String(b.completedAt||b.updatedAt||"").localeCompare(String(a.completedAt||a.updatedAt||"")))[0];return {schema:SAMMY_ANS_D2_SCHEMA,runId:`ansur-d2-${new Date().toISOString().replace(/[:.]/g,"-")}-${Math.random().toString(36).slice(2,7)}`,ordinal:0,appVersion:"0.8.17",mode:sammyAnsLab.d2Mode,family,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),stage:"testing",cursor:0,totalBuilds:prep.peopleCount*SAMMY_ANS_D2_VARIANTS.length,config:{...cfg},sourceSolverRunId:source.runId,sourceSolverVersion:source.appVersion,calibrationRunId:source.calibrationRunId,model:source.model,productionProfile:runtime.productionProfile,prep,uncertainty:sammyAnsLab.runC?.uncertainty||{},bridgeValidation:bridge.validation,stats:sammyAnsD2StatsNew(prep.primaryTargetIds),summary:null,previousD:old?.summary?{runId:old.runId,mode:old.mode,variants:Object.fromEntries([5,6,7].map(n=>[String(n),{meshRmseCm:old.summary.variants?.[String(n)]?.meshRmseCm,knownInputMeshRmseCm:old.summary.variants?.[String(n)]?.knownInputMeshRmseCm}]))}:null,notes:{solver:"R5 source/model frozen; D2 adds a separate weighted lexicographic mesh-fit/guard layer only.",truth:"T24 uses actual 24 ANSUR-comparable measures, not statistical predictions.",known:"K5/K7 keep real user-entered measurement targets hard; weightkg remains an ANSUR statistical input, never an Anny kg slider.",soft:"Predicted measures are weighted by C empirical p68 uncertainty; bridge-only measures are weak construction priors.",score:"All reported Truth RMSE values compare real mesh against the 24 actual ANSUR measurements."}}}
function sammyAnsD2Runtime(run){return {runId:`${run.runId}:weighted`,model:run.model,mode:"deep",productionProfile:run.productionProfile}}
async function sammyAnsD2TestOne(run,buildIndex){const pi=Math.floor(buildIndex/SAMMY_ANS_D2_VARIANTS.length),variant=SAMMY_ANS_D2_VARIANTS[buildIndex%SAMMY_ANS_D2_VARIANTS.length],person=run.prep.people[pi],bridge=await sammyAnsBridgeLoad(),c=sammyAnsD2Case(run,person,variant,bridge),context={core:{gender:person.sex,age:sammyDimensionsYearsToShapeAge(person.ageYears,person.sex)},local:{}},runtime=sammyAnsD2Runtime(run);sammyAnsD2Status(`D2 · Person ${pi+1}/${run.prep.peopleCount} · ${variant} · Hard-Fit …`);const result=await sammyAnsD2Fit(runtime,c,context,run.config,p=>{if(sammyMeasureOverlayGroup)sammyMeasureOverlayGroup.visible=false;if(p.phase==="hard")sammyAnsD2Status(`D2 · ${pi+1}/${run.prep.peopleCount} · ${variant} · HARD ${p.pass}/${p.total} · ${sammyAnsD2Fmt(p.metrics.hardRmse)} cm`);else if(p.phase==="soft")sammyAnsD2Status(`D2 · ${pi+1}/${run.prep.peopleCount} · ${variant} · SOFT ${p.pass}/${p.total} · Truth ${sammyAnsD2Fmt(p.metrics.primaryTruthRmse)} cm`);else sammyAnsD2Status(`D2 · ${pi+1}/${run.prep.peopleCount} · ${variant} · R5 Guard ${p.evaluation}/${p.total} · ${p.accepted?"ACCEPT":"ROLLBACK"}`)},false);sammyAnsD2StatsAdd(run,pi,person,c,result);await sammySolverRecord(run,"ansur-d2",`ANSUR D2 person ${pi+1} · ${variant}`,{buildIndex,personIndex:pi,variant,rowIndex:person.rowIndex,sex:person.sex,ageYears:person.ageYears,inputs:c.inputs,hardIds:c.hardIds,softIds:c.softIds,targetPrimary:c.primary,actualPrimary:c.truth,target31:c.target31,weights:{hard:c.hardWeights,soft:c.softWeights},result:{initialMetrics:result.initialMetrics,hardAnchor:result.hardAnchor,beforeCanonicalization:result.beforeCanon,finalMetrics:result.finalMetrics,boundCount:result.boundCount,evaluations:result.evaluations,canonicalization:result.canonicalization,solutionDs:result.ds,actual:result.actual}});sammyClearMeasureOverlay()}
async function sammyAnsD2Runner(){const run=sammyAnsLab.d2Run;if(!run)return;sammyAnsLab.d2Running=true;sammyAnsLab.d2Paused=false;sammyAnsLab.d2ExitAfterPause=false;document.body.classList.add("sammy-ansur-d-running");sammyAnsLab.d2Restore=sammyAnsDCaptureState();sammyAnsD2RefreshUi();try{await sammyAnsDMeasurementPose();while(sammyAnsLab.d2Running&&!sammyAnsLab.d2Paused&&run.stage!=="complete"){const i=run.cursor;if(i>=run.totalBuilds){run.summary=sammyAnsD2Summary(run);run.stage="complete";run.completedAt=new Date().toISOString();await sammySolverPutRun(run);break}await sammyAnsD2TestOne(run,i);run.cursor=i+1;run.summary=sammyAnsD2Summary(run);await sammySolverPutRun(run);sammyAnsD2RefreshUi()}if(run.stage==="complete")sammyAnsD2Status(`D2 fertig · T24/K7/K5 Truth ${sammyAnsD2Fmt(run.summary.variants.T24.primaryTruthRmseCm)} / ${sammyAnsD2Fmt(run.summary.variants.K7.primaryTruthRmseCm)} / ${sammyAnsD2Fmt(run.summary.variants.K5.primaryTruthRmseCm)} cm`);else if(sammyAnsLab.d2Paused)sammyAnsD2Status(`D2 pausiert · ${run.cursor}/${run.totalBuilds} Builds gespeichert.`)}catch(e){console.error("ANSUR D2",e);sammyAnsLab.d2Paused=true;sammyAnsD2Status(`FEHLER: ${e?.message||e}`);sammyReportError?.(e,{source:"ANSUR D2"})}finally{sammyAnsLab.d2Running=false;document.body.classList.remove("sammy-ansur-d-running");const st=sammyAnsLab.d2Restore;sammyAnsLab.d2Restore=null;if(st){annyParams={...st.core};annyLocalValues={...st.local};applyAnnyParams();sammyMeasureSyncLocalUiV3();if(st.relative)sammyApplyMeasurementRelative(new Float32Array(st.relative),"ANSUR D2 → previous pose");sammyClearMeasureOverlay();if(st.running&&st.mode==="user"&&userAnimLoaded)startPoseAnimation("user",Math.max(0,Math.min(userAnimFrames-1,st.frame||0)));await new Promise(r=>requestAnimationFrame(()=>r()))}sammyAnsD2RefreshUi();sammyAnsRefreshUi();sammyAnsLab.d2ExitAfterPause=false}}
async function sammyAnsD2StartOrResume(){if(sammyAnsLab.d2Running||sammyAnsLab.dRunning||sammyAnsLab.d3Running||sammyAnsLab.running||!sammyAnsLab.runC)return;if(!annyPackLoaded){sammyAnsD2Status("Anny-Pack ist noch nicht bereit.");return}try{let run=sammyAnsLab.d2Run;if(!run||run.schema!==SAMMY_ANS_D2_SCHEMA||run.stage==="complete"){run=await sammyAnsD2NewRun();sammyAnsLab.d2Run=run;sammySolverRuntimeCache=null;await sammySolverPutRun(run)}sammyAnsD2Runner()}catch(e){sammyAnsLab.running=null;sammyAnsD2Status(`FEHLER: ${e?.message||e}`);sammyReportError?.(e,{source:"ANSUR D2 start"});sammyAnsRefreshUi()}}
function sammyAnsD2Pause(){if(!sammyAnsLab.d2Running)return;sammyAnsLab.d2Paused=true;sammyAnsD2Status("Pause nach dem aktuellen D2-Build · letzter fertiger Build bleibt gespeichert.")}
async function sammyAnsD2Reset(){const run=sammyAnsLab.d2Run;if(sammyAnsLab.d2Running||sammyAnsLab.dRunning||sammyAnsLab.d3Running||sammyAnsLab.running||!run)return;if(!confirm("Gespeicherten D2 Alignment-Lauf löschen? A/B/C, D1 und R5 bleiben erhalten."))return;await sammySolverDeleteRun(run.runId);sammyAnsLab.d2Run=null;const b=$("#sammyAnsD2Progress");if(b)b.style.width="0%";sammyAnsD2Status("D2 gelöscht · A/B/C, D1 und R5 unverändert.");sammyAnsD2RefreshUi()}
async function sammyAnsD2LoadLatest(){try{const runs=(await sammySolverGetRuns()).filter(r=>r?.schema===SAMMY_ANS_D2_SCHEMA).sort((a,b)=>String(b.updatedAt||"").localeCompare(String(a.updatedAt||""))),active=runs.find(r=>r.stage!=="complete")||runs[0]||null;sammyAnsLab.d2Run=active;if(active){sammyAnsLab.d2Mode=active.mode||"deep";sammyAnsD2RefreshUi()}}catch(e){console.warn("ANSUR D2 resume",e)}}
async function sammyAnsD2Export(summaryOnly=false){const run=sammyAnsLab.d2Run;if(!run){sammyAnsD2Status("Kein D2-Lauf zum Exportieren.");return}const summary=run.summary||sammyAnsD2Summary(run),base={schema:SAMMY_ANS_D2_SCHEMA,app:"Sammy",version:"0.8.17",generated:new Date().toISOString(),purpose:"D2 alignment/constraint validation: T24 full ANSUR truth vs K7/K5 uncertainty-weighted sparse inputs through a real-mesh lexicographic fit and R5-guarded canonicalization.",summary,notes:run.notes};let payload=base;if(!summaryOnly){const records=await sammySolverGetRecords(run.runId);payload={...base,run,records}}const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=summaryOnly?`Sammy_ANSUR_D2_Summary_${run.mode}_${run.runId}.json`:`Sammy_ANSUR_D2_FULL_${run.mode}_${run.runId}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500)}


function sammyAnsD3MeasureLabel(id){return SAMMY_MEASURE_DEFS.find(d=>d.id===id)?.label||id}
function sammyAnsD3VisualColor(delta,isAnchor=false){if(isAnchor)return 0xaeb4bf;const a=Math.abs(Number(delta));return a<=.5?0x88e6a2:a<=1.5?0xffd66f:0xff8b78}
function sammyAnsD3AddVisualLine(points,id,color,closed=false,anchor=false){if(!points?.length||!sammyMeasureOverlayGroup)return;const arr=new Float32Array(points.length*3);for(let i=0;i<points.length;i++){arr[i*3]=points[i][0];arr[i*3+1]=points[i][1];arr[i*3+2]=points[i][2]}const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.BufferAttribute(arr,3));const mat=new THREE.LineBasicMaterial({color,transparent:true,opacity:anchor?.72:1,depthTest:false,depthWrite:false,linewidth:anchor?2:3});const line=closed?new THREE.LineLoop(g,mat):new THREE.Line(g,mat);line.renderOrder=48;line.userData.sammyMeasureId=id;sammyMeasureOverlayGroup.add(line)}
function sammyAnsD3VisualHide(){sammyClearMeasureOverlay();const h=$("#sammyAnsAuditHud");if(h){h.classList.remove("visible");h.setAttribute("aria-hidden","true")}sammyAnsLab.d3VisualFrame=null}
function sammyAnsD3VisualShow(c,meta={}){if(!sammyAnsLab.d3Visual){sammyAnsD3VisualHide();return}const results=sammyMeasureResultsCache;if(!results)return;sammyClearMeasureOverlay();sammyMeasureOverlayGroup=new THREE.Group();sammyMeasureOverlayGroup.name="SammyANSURAuditOverlay";scene.add(sammyMeasureOverlayGroup);const ids=[...new Set([...c.focusIds,...c.anchorIds])],rows=[];for(const id of ids){const r=results[id],actual=Number(r?.valueCm),target=Number(c.truth[id]);if(!Number.isFinite(actual)||!Number.isFinite(target))continue;const delta=actual-target,isAnchor=c.anchorIds.includes(id),lp=sammyMeasureLinePoints(r);if(lp)sammyAnsD3AddVisualLine(lp.points,id,sammyAnsD3VisualColor(delta,isAnchor),lp.closed,isAnchor);rows.push({id,label:sammyAnsD3MeasureLabel(id),actual,target,delta,isAnchor})}const h=$("#sammyAnsAuditHud"),title=$("#sammyAnsAuditTitle"),sub=$("#sammyAnsAuditSub"),body=$("#sammyAnsAuditRows");if(title)title.textContent=`D3 LIVE · ${c.test.kind==="bundle"?"BUNDLE":"SINGLE"} · ${c.test.label}`;if(sub)sub.textContent=`Person ${Number(meta.personIndex||0)+1}/${Number(meta.people||1)} · ${meta.rescue?"RESCUE · ":""}${meta.phase||"FIT"}${meta.pass?` ${meta.pass}/${meta.total}`:""}`;if(body)body.innerHTML=rows.map(q=>`<div class="sammyAnsAuditRow ${q.isAnchor?"anchor":""}"><b>${escapeHtml(q.label)}</b><span>Ziel ${q.target.toFixed(1)}</span><span>Ist ${q.actual.toFixed(1)}</span><strong class="${Math.abs(q.delta)<=.5?"ok":Math.abs(q.delta)<=1.5?"warn":"bad"}">${q.delta>=0?"+":""}${q.delta.toFixed(1)} cm</strong></div>`).join("");if(h){h.classList.add("visible");h.setAttribute("aria-hidden","false")}sammyAnsLab.d3VisualFrame={test:c.test.id,rows}}
function sammyAnsD3ToggleVisual(){sammyAnsLab.d3Visual=!sammyAnsLab.d3Visual;const b=$("#sammyAnsD3Visual");if(b){b.classList.toggle("active",sammyAnsLab.d3Visual);b.textContent=sammyAnsLab.d3Visual?"LIVE AN":"LIVE AUS"}if(!sammyAnsLab.d3Visual)sammyAnsD3VisualHide();sammyAnsD3RefreshUi()}
function sammyAnsMiniTransport(){if(sammyAnsLab.d3Running){sammyAnsD3Pause();return}const run=sammyAnsLab.d3Run;if(run&&run.stage!=="complete")sammyAnsD3StartOrResume()}
function sammyAnsRefreshMiniTransport(){const b=$("#sammyAnsMiniPlayPause");if(!b)return;const active=sammyAnsLab.d3Run&&sammyAnsLab.d3Run.stage!=="complete";b.disabled=!sammyAnsLab.d3Running&&!active;b.textContent=sammyAnsLab.d3Running?"Ⅱ":"▶";b.setAttribute("aria-label",sammyAnsLab.d3Running?"D3 nach aktuellem Fit pausieren":"D3 fortsetzen")}
function sammyAnsD3Fmt(v,d=2){return v==null||v===""||!Number.isFinite(Number(v))?"–":Number(v).toFixed(d)}
function sammyAnsD3Status(text=""){const n=$("#sammyAnsD3Status");if(n&&text)n.textContent=text;const run=sammyAnsLab.d3Run,bar=$("#sammyAnsD3Progress");if(run&&bar)bar.style.width=`${(100*Number(run.cursor||0)/Math.max(1,Number(run.totalBuilds||1))).toFixed(1)}%`}
function sammyAnsD3SetMode(mode){if(!SAMMY_ANS_D3_CONFIG[mode]||sammyAnsLab.d3Running||sammyAnsLab.d2Running||sammyAnsLab.dRunning||sammyAnsLab.running||sammyAnsLab.d3Run?.stage&&sammyAnsLab.d3Run.stage!=="complete")return;sammyAnsLab.d3Mode=mode;sammyAnsD3RefreshUi()}
function sammyAnsD3Tests(primaryIds){const p=new Set(primaryIds),singles=primaryIds.map(id=>({id:`single:${id}`,kind:"single",label:SAMMY_MEASURE_DEFS.find(d=>d.id===id)?.label||id,ids:[id]})),bundles=SAMMY_ANS_D3_BUNDLES.map(b=>({...b,kind:"bundle",ids:b.ids.filter(id=>p.has(id))})).filter(b=>b.ids.length>=2);return [...singles,...bundles]}
function sammyAnsD3Render(){const host=$("#sammyAnsD3Result"),run=sammyAnsLab.d3Run;if(!host)return;if(!run?.summary){host.innerHTML="";return}const s=run.summary,topSingles=(s.singleSignals||[]).slice(0,5).map(q=>`<div class="sammyAnsResultRow"><b>${escapeHtml(q.label)}</b><span>${escapeHtml(q.signalLabel)} · Bias ${sammyAnsD3Fmt(q.biasCm)} · sensitive Bounds ${sammyAnsD3Fmt(q.meanSensitiveBounds,1)}</span><strong>${sammyAnsD3Fmt(q.rmseCm)} cm</strong></div>`).join(""),bundles=(s.bundleSignals||[]).map(q=>`<div class="sammyAnsResultRow"><b>${escapeHtml(q.label)}</b><span>${escapeHtml(q.signalLabel)} · Singles ${sammyAnsD3Fmt(q.singleReferenceRmseCm)} · Ratio ${sammyAnsD3Fmt(q.conflictRatio,2)}×</span><strong>${sammyAnsD3Fmt(q.rmseCm)} cm</strong></div>`).join("");host.innerHTML=`<div class="sammyAnsResultTitle"><b>${escapeHtml(s.verdict?.label||"Alignment Audit")}</b><span>${escapeHtml(s.verdict?.detail||"")}</span></div>${topSingles}${bundles}`}
function sammyAnsD3RefreshUi(){const run=sammyAnsLab.d3Run,active=run&&run.stage!=="complete",start=$("#sammyAnsD3Start"),pause=$("#sammyAnsD3Pause"),reset=$("#sammyAnsD3Reset"),sum=$("#sammyAnsD3Summary"),full=$("#sammyAnsD3Full"),visual=$("#sammyAnsD3Visual");if(visual){visual.classList.toggle("active",sammyAnsLab.d3Visual);visual.textContent=sammyAnsLab.d3Visual?"LIVE AN":"LIVE AUS"}sammyAnsRefreshMiniTransport();document.querySelectorAll("[data-ans-d3-mode]").forEach(x=>{x.classList.toggle("active",x.dataset.ansD3Mode===sammyAnsLab.d3Mode);x.disabled=sammyAnsLab.d3Running||sammyAnsLab.d2Running||sammyAnsLab.dRunning||!!sammyAnsLab.running||!!active});if(start){start.disabled=sammyAnsLab.d3Running||sammyAnsLab.d2Running||sammyAnsLab.dRunning||!!sammyAnsLab.running||!sammyAnsLab.runC;start.textContent=sammyAnsLab.d3Running?"Läuft …":active?"Fortsetzen":"Audit starten"}if(pause)pause.disabled=!sammyAnsLab.d3Running;if(reset)reset.disabled=sammyAnsLab.d3Running||sammyAnsLab.d2Running||sammyAnsLab.dRunning||!!sammyAnsLab.running||!run;if(sum)sum.disabled=!run;if(full)full.disabled=!run;sammyAnsD3Render();if(run){if(run.stage==="complete")sammyAnsD3Status(`Audit fertig · ${run.summary?.singleSignals?.filter(q=>q.signal==="reachable").length||0}/${run.prep.primaryTargetIds.length} Singles klar erreichbar · ${run.summary?.bundleSignals?.filter(q=>q.signal==="conflict").length||0} Bundle-Konflikte.`);else if(!sammyAnsLab.d3Running)sammyAnsD3Status(`Gespeichert · ${run.cursor}/${run.totalBuilds} Fits · Fortsetzen möglich.`)}else sammyAnsD3Status("Bereit · Singles + anatomische Bundles trennen Mapping, Range und Constraint-Konflikte.")}
function sammyAnsD3BaselineKey(run,pi){return `${run.runId}:${pi}`}
async function sammyAnsD3Baseline(run,pi,person,runtime,context){const key=sammyAnsD3BaselineKey(run,pi),hit=sammyAnsLab.d3Cache;if(hit?.key===key)return hit;const model=sammySolverHydrate(runtime),sex=Number(person.sex)>=.5?1:0,{ds}=sammySolverKnownContextDs(model,context,sex),actual=await sammyAnsD2Apply(runtime,Array.from(ds),sex,context);if(actual.some(v=>!Number.isFinite(Number(v))))throw new Error(`D3 Baseline enthält ungültige Maße · Person ${pi+1}`);const base={key,sex,ds:Array.from(ds),actual:Array.from(actual)};sammyAnsLab.d3Cache=base;return base}
function sammyAnsD3Case(run,person,test,baseline){const model=sammySolverHydrate(run),idx=model.measureIndex||Object.fromEntries(model.measureIds.map((id,i)=>[id,i])),truth=Object.fromEntries(run.prep.primaryTargetIds.map(id=>[id,Number(person.actual[id])])),focusIds=[...test.ids],anchorIds=focusIds.includes("stature")?[]:["stature"],hardIds=[...new Set([...anchorIds,...focusIds])],target31=Object.fromEntries(model.measureIds.map((id,j)=>[id,Number(baseline.actual[j])]));for(const id of hardIds)target31[id]=truth[id];const weights=new Float64Array(model.m).fill(.008),rescueWeights=new Float64Array(model.m).fill(.004);for(const id of hardIds){const j=idx[id];if(j==null)continue;weights[j]=id==="stature"&&!focusIds.includes("stature")?100:64;rescueWeights[j]=id==="stature"&&!focusIds.includes("stature")?80:128}return {test,truth,focusIds,anchorIds,hardIds,target31,weights:Array.from(weights),rescueWeights:Array.from(rescueWeights),baselineActual:Array.from(baseline.actual)}}
function sammyAnsD3Metrics(model,actual,c){const idx=model.measureIndex||Object.fromEntries(model.measureIds.map((id,i)=>[id,i])),rm=(ids,target)=>{let ss=0,n=0,b=0,mx=0,abs={};for(const id of ids){const j=idx[id],a=Number(actual[j]),t=Number(target[id]);if(!Number.isFinite(a)||!Number.isFinite(t))continue;const e=a-t,ae=Math.abs(e);ss+=e*e;b+=e;mx=Math.max(mx,ae);abs[id]=ae;n++}return {rmse:n?Math.sqrt(ss/n):0,bias:n?b/n:0,maxAbs:mx,abs,n}},focus=rm(c.focusIds,c.truth),anchor=rm(c.anchorIds,c.truth),hard=rm(c.hardIds,c.truth);let css=0,cn=0;const hardSet=new Set(c.hardIds),primarySet=new Set(c.truth?Object.keys(c.truth):[]);for(const id of primarySet){if(hardSet.has(id))continue;const j=idx[id],a=Number(actual[j]),b=Number(c.baselineActual[j]);if(Number.isFinite(a)&&Number.isFinite(b)){const e=a-b;css+=e*e;cn++}}return {focusRmse:focus.rmse,focusBias:focus.bias,focusMaxAbs:focus.maxAbs,focusAbs:focus.abs,anchorRmse:anchor.rmse,anchorMaxAbs:anchor.maxAbs,hardRmse:hard.rmse,hardMaxAbs:hard.maxAbs,collateralDriftRmse:cn?Math.sqrt(css/cn):0}}
function sammyAnsD3SensitiveBounds(model,ds,sex,focusIds){const idx=model.measureIndex||Object.fromEntries(model.measureIds.map((id,i)=>[id,i])),rows=focusIds.map(id=>idx[id]).filter(i=>i!=null),J=sammySolverJacobian(model,Float64Array.from(ds),sex),{lo,hi}=sammySolverBounds(model,sex),rank=[];for(let i=0;i<model.n;i++){const sid=model.sliderDefs[i]?.id;if(sid==="core:gender"||sid==="core:age"||(!sex&&sid==="core:cupsize"))continue;let ss=0;for(const r of rows){const v=J[r*model.n+i];ss+=v*v}rank.push({i,s:rows.length?Math.sqrt(ss/rows.length):0})}rank.sort((a,b)=>b.s-a.s);const top=rank.filter(x=>x.s>.01).slice(0,10),bound=top.filter(x=>Math.abs(Number(ds[x.i])-lo[x.i])<.02||Math.abs(Number(ds[x.i])-hi[x.i])<.02);return {count:bound.length,ids:bound.map(x=>model.sliderDefs[x.i]?.id||String(x.i)),top:top.map(x=>({id:model.sliderDefs[x.i]?.id||String(x.i),s:Number(x.s.toFixed(4))}))}}
async function sammyAnsD3Fit(runtime,c,context,cfg,onProgress){const model=sammySolverHydrate(runtime),seed=sammyAnsD2SurrogateSolve(runtime,c,context,c.weights,null,50),sex=seed.sex;let ds=Array.from(seed.ds),actual=await sammyAnsD2Apply(runtime,ds,sex,context),metrics=sammyAnsD3Metrics(model,actual,c),initial={...metrics},evals=1,accepted=0,rescueAccepted=0,stale=0;if(onProgress)await onProgress({phase:"SEED",rescue:false,pass:0,total:cfg.passes,accepted:true,metrics,evals});const phase=async(weights,passes,rescue=false)=>{for(let pass=1;pass<=passes;pass++){const {step,fixed,lo,hi}=sammyAnsD2StepDs(runtime,ds,sex,actual,c,weights,context,rescue?.12:.17);let ok=false;for(const alpha of rescue?[.7,.35,.18]:[1,.5,.25]){const nd=Array.from(ds);for(let i=0;i<model.n;i++)if(!fixed.has(i))nd[i]=Math.max(lo[i],Math.min(hi[i],nd[i]+alpha*step[i]));const na=await sammyAnsD2Apply(runtime,nd,sex,context);evals++;const nm=sammyAnsD3Metrics(model,na,c),anchorLimit=c.anchorIds.length?Math.max(.35,metrics.anchorRmse+(rescue?.12:.08)):Infinity,anchorOk=nm.anchorRmse<=anchorLimit,better=nm.hardRmse<metrics.hardRmse-.002||(anchorOk&&nm.focusRmse<metrics.focusRmse-.003);if(anchorOk&&better){ds=nd;actual=na;metrics=nm;ok=true;accepted++;if(rescue)rescueAccepted++;break}}if(!ok&&sammyAnsLab.d3Visual){actual=await sammyAnsD2Apply(runtime,ds,sex,context);evals++;metrics=sammyAnsD3Metrics(model,actual,c)}if(onProgress)await onProgress({phase:rescue?"RESCUE":"FIT",rescue,pass,total:passes,accepted:ok,metrics,evals});stale=ok?0:stale+1;if(stale>=3)break;if(metrics.focusRmse<.20&&(!c.anchorIds.length||metrics.anchorRmse<.30))break}};await phase(c.weights,cfg.passes,false);let rescueUsed=false;if(metrics.focusRmse>.75&&cfg.rescuePasses){rescueUsed=true;stale=0;await phase(c.rescueWeights,cfg.rescuePasses,true)}actual=await sammyAnsD2Apply(runtime,ds,sex,context);evals++;metrics=sammyAnsD3Metrics(model,actual,c);if(onProgress)await onProgress({phase:"FINAL",rescue:false,pass:0,total:0,accepted:true,metrics,evals});const sensitive=sammyAnsD3SensitiveBounds(model,ds,sex,c.focusIds),measureIndex=model.measureIndex||Object.fromEntries(model.measureIds.map((id,i)=>[id,i])),requested=Math.sqrt(c.focusIds.reduce((ss,id)=>{const j=measureIndex[id];if(j==null)return ss;const e=Number(c.truth[id])-Number(c.baselineActual[j]);return Number.isFinite(e)?ss+e*e:ss},0)/Math.max(1,c.focusIds.length));return {sex,ds,actual,initialMetrics:initial,finalMetrics:metrics,evaluations:evals,accepted,rescueUsed,rescueAccepted,boundCount:sammyAnsD2BoundCount(model,ds,sex),sensitiveBounds:sensitive,requestedDeltaRmse:requested}}
function sammyAnsD3StatsNew(tests){return {nonFinite:0,tests:Object.fromEntries(tests.map(t=>[t.id,{id:t.id,kind:t.kind,label:t.label,ids:[...t.ids],count:0,focusSs:0,focusN:0,biasSum:0,bodyRmses:[],anchorSs:0,anchorN:0,collateralSs:0,collateralN:0,boundSum:0,sensitiveBoundSum:0,rescueCount:0,evalSum:0,requestedSs:0,boundIds:{},bySex:{male:{ss:0,n:0},female:{ss:0,n:0}}}]))}}
function sammyAnsD3StatsAdd(run,person,test,c,result){const q=run.stats.tests[test.id],m=result.finalMetrics;q.count++;for(const id of c.focusIds){const e=Number(result.actual[run.model.measureIds.indexOf(id)])-Number(c.truth[id]);if(Number.isFinite(e)){q.focusSs+=e*e;q.focusN++;q.biasSum+=e;const sx=Number(person.sex)>=.5?q.bySex.female:q.bySex.male;sx.ss+=e*e;sx.n++}else run.stats.nonFinite++}q.bodyRmses.push(m.focusRmse);if(c.anchorIds.length){q.anchorSs+=m.anchorRmse*m.anchorRmse;q.anchorN++}q.collateralSs+=m.collateralDriftRmse*m.collateralDriftRmse;q.collateralN++;q.boundSum+=result.boundCount;q.sensitiveBoundSum+=result.sensitiveBounds.count;q.rescueCount+=result.rescueUsed?1:0;q.evalSum+=result.evaluations;q.requestedSs+=result.requestedDeltaRmse*result.requestedDeltaRmse;for(const id of result.sensitiveBounds.ids)q.boundIds[id]=(q.boundIds[id]||0)+1}
function sammyAnsD3Percentile(a,p){if(!a.length)return null;const b=[...a].sort((x,y)=>x-y),x=(b.length-1)*p,i=Math.floor(x),f=x-i;return b[i]+(b[Math.min(b.length-1,i+1)]-b[i])*f}
function sammyAnsD3TestSummary(q){const rm=q.focusN?Math.sqrt(q.focusSs/q.focusN):null,bias=q.focusN?q.biasSum/q.focusN:null,p95=sammyAnsD3Percentile(q.bodyRmses,.95),sx=k=>q.bySex[k].n?Math.sqrt(q.bySex[k].ss/q.bySex[k].n):null,topBounds=Object.entries(q.boundIds).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([id,count])=>({id,count}));return {id:q.id,kind:q.kind,label:q.label,ids:q.ids,count:q.count,rmseCm:rm,biasCm:bias,p95BodyRmseCm:p95,maxBodyRmseCm:q.bodyRmses.length?Math.max(...q.bodyRmses):null,reachPct050:q.bodyRmses.length?100*q.bodyRmses.filter(x=>x<=.5).length/q.bodyRmses.length:null,reachPct100:q.bodyRmses.length?100*q.bodyRmses.filter(x=>x<=1).length/q.bodyRmses.length:null,meanAnchorRmseCm:q.anchorN?Math.sqrt(q.anchorSs/q.anchorN):0,meanCollateralDriftCm:q.collateralN?Math.sqrt(q.collateralSs/q.collateralN):0,meanBoundSliders:q.count?q.boundSum/q.count:0,meanSensitiveBounds:q.count?q.sensitiveBoundSum/q.count:0,rescuePct:q.count?100*q.rescueCount/q.count:0,meanMeshEvaluations:q.count?q.evalSum/q.count:0,requestedDeltaRmseCm:q.count?Math.sqrt(q.requestedSs/q.count):0,topSensitiveBoundSliders:topBounds,bySex:{male:{rmseCm:sx("male")},female:{rmseCm:sx("female")}}}}
function sammyAnsD3SingleSignal(q){if(!q.count||!Number.isFinite(q.rmseCm))return {...q,signal:"pending",signalLabel:"noch nicht berechnet"};let signal="mixed",label="gemischt / weiter prüfen";if(q.rmseCm<=.5){signal="reachable";label="klar erreichbar"}else if(q.rmseCm<=1){signal="partial";label="weitgehend erreichbar"}else if(q.meanSensitiveBounds>=1){signal="range";label="Range / Expressivität verdächtig"}else if(Math.abs(q.biasCm)>=Math.max(.75,.6*q.rmseCm)){signal="mapping";label="Mapping / Semantik verdächtig"}else{signal="hard";label="isoliert schwer erreichbar"}return {...q,signal,signalLabel:label}}
function sammyAnsD3Summary(run){const all=Object.fromEntries(Object.entries(run.stats.tests).map(([id,q])=>[id,sammyAnsD3TestSummary(q)])),singles=Object.values(all).filter(q=>q.kind==="single").map(sammyAnsD3SingleSignal),singleByMeasure=Object.fromEntries(singles.map(q=>[q.ids[0],q])),bundles=Object.values(all).filter(q=>q.kind==="bundle").map(q=>{if(!q.count||!Number.isFinite(q.rmseCm))return {...q,singleReferenceRmseCm:null,conflictRatio:null,signal:"pending",signalLabel:"noch nicht berechnet"};const refs=q.ids.map(id=>singleByMeasure[id]?.rmseCm).filter(Number.isFinite),sr=refs.length?Math.sqrt(refs.reduce((ss,x)=>ss+x*x,0)/refs.length):null,ratio=Number.isFinite(sr)&&sr>.05?q.rmseCm/sr:null;let signal="mixed",label="gemischt";if(q.rmseCm<=.75){signal="compatible";label="Bundle kompatibel"}else if(Number.isFinite(sr)&&sr<=.8&&q.rmseCm>1.2){signal="conflict";label="Kombinations-/Definitionskonflikt"}else if(Number.isFinite(ratio)&&ratio>=1.6&&q.rmseCm>1){signal="conflict";label="Kombinations-/Definitionskonflikt"}else if(q.meanSensitiveBounds>=1.5){signal="range";label="Bundle stößt an Range"}else label="Bundle teilweise erreichbar";return {...q,singleReferenceRmseCm:sr,conflictRatio:ratio,signal,signalLabel:label}}),singleSignals=[...singles].sort((a,b)=>b.rmseCm-a.rmseCm),bundleSignals=[...bundles].sort((a,b)=>(b.conflictRatio||0)-(a.conflictRatio||0)),mapping=singleSignals.filter(q=>q.signal==="mapping").length,range=singleSignals.filter(q=>q.signal==="range").length,conflict=bundleSignals.filter(q=>q.signal==="conflict").length,reachable=singleSignals.filter(q=>q.signal==="reachable").length,verdict={label:"Alignment Audit abgeschlossen",detail:`${reachable}/${singles.length} Singles klar erreichbar · ${mapping} Mapping-Signale · ${range} Range-Signale · ${conflict}/${bundles.length} Bundle-Konflikte.`};return {schema:"sammy-ansur-alignment-audit-summary-v1",mode:run.mode,people:run.prep.peopleCount,testCount:run.tests.length,totalBuilds:run.totalBuilds,completedBuilds:run.cursor,completedPct:Number((100*run.cursor/Math.max(1,run.totalBuilds)).toFixed(1)),nonFinite:run.stats.nonFinite,verdict,singleSignals,bundleSignals,allTests:all,interpretation:{single:"Jedes ANSUR-Maß wird isoliert mit Stature als Größenanker getestet; Stature selbst allein. Andere Maße werden nur schwach am neutralen Sammy-Ausgangskörper gehalten.",bundle:"Anatomische Gruppen werden gemeinsam gegen dieselbe reale ANSUR-Person gefittet. Ein stark schlechteres Bundle als seine Singles ist ein Konfliktsignal.",range:"Viele der für das Ziel sensitivsten Slider am Limit + hoher Restfehler spricht für Range/Expressivität.",mapping:"Großer, gleichgerichteter Single-Bias ohne entsprechendes Bound-Signal spricht eher für Semantik/Mapping; dies ist ein Diagnose-Signal, kein automatischer Offset.",scope:"R5/DIMENSIONS/Prediction werden nicht verändert; Audit benutzt das echte Mesh und den bestehenden Forward-Jacobian nur als Suchrichtung."}}}
function sammyAnsD3Runtime(run){return {runId:`${run.runId}:audit`,model:run.model,mode:"deep",productionProfile:run.productionProfile}}
async function sammyAnsD3NewRun(){const cfg=SAMMY_ANS_D3_CONFIG[sammyAnsLab.d3Mode],source=await sammyDimensionsFindSource();if(!source)throw new Error("Kein abgeschlossener R2/R5-Source gefunden.");const family=sammyAnsLab.runC?.recommendedFamily||"consumer";sammyAnsD3Status(`Audit vorbereitet · ${cfg.people} Personen · Singles + Bundles …`);const prep=await sammyAnsPrepareD(cfg.people,family,"D3"),runtime=sammyDimensionsRuntimeFromSource(source,`ansur-d3-prep-${Date.now()}`),tests=sammyAnsD3Tests(prep.primaryTargetIds);return {schema:SAMMY_ANS_D3_SCHEMA,runId:`ansur-d3-${new Date().toISOString().replace(/[:.]/g,"-")}-${Math.random().toString(36).slice(2,7)}`,ordinal:0,appVersion:"0.8.17.1",mode:sammyAnsLab.d3Mode,family,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),stage:"testing",cursor:0,totalBuilds:prep.peopleCount*tests.length,config:{...cfg},sourceSolverRunId:source.runId,sourceSolverVersion:source.appVersion,calibrationRunId:source.calibrationRunId,model:source.model,productionProfile:runtime.productionProfile,prep,tests,stats:sammyAnsD3StatsNew(tests),summary:null,notes:{sourceD2:"D2 showed T24 mismatch; D3 isolates each mapped ANSUR measure and then recombines anatomical bundles.",anchor:"Non-stature singles/bundles keep actual ANSUR stature as a hard size anchor to prevent trivial fitting by globally resizing the body.",neutral:"All non-tested dimensions are weakly regularized to the sex/age-matched Sammy reference mesh, not to ANSUR predictions.",solver:"R5, DIMENSIONS and ANSUR prediction are frozen; D3 is a separate diagnostic real-mesh fit."}}}
async function sammyAnsD3TestOne(run,buildIndex){const ti=buildIndex%run.tests.length,pi=Math.floor(buildIndex/run.tests.length),test=run.tests[ti],person=run.prep.people[pi],runtime=sammyAnsD3Runtime(run),context={core:{gender:person.sex,age:sammyDimensionsYearsToShapeAge(person.ageYears,person.sex)},local:{}},baseline=await sammyAnsD3Baseline(run,pi,person,runtime,context),c=sammyAnsD3Case(run,person,test,baseline);sammyAnsD3Status(`Audit · Person ${pi+1}/${run.prep.peopleCount} · ${ti+1}/${run.tests.length} · ${test.label} …`);const result=await sammyAnsD3Fit(runtime,c,context,run.config,async p=>{sammyAnsD3Status(`Audit · ${pi+1}/${run.prep.peopleCount} · ${test.label} · ${p.phase==="FINAL"?"FINAL":p.rescue?"RESCUE ":""}${p.pass?`${p.pass}/${p.total} · `:""}${sammyAnsD3Fmt(p.metrics.focusRmse)} cm`);if(sammyAnsLab.d3Visual){sammyAnsD3VisualShow(c,{personIndex:pi,people:run.prep.peopleCount,phase:p.phase,pass:p.pass,total:p.total,rescue:p.rescue});await new Promise(r=>requestAnimationFrame(()=>r()))}});sammyAnsD3StatsAdd(run,person,test,c,result);await sammySolverRecord(run,"ansur-d3",`ANSUR D3 person ${pi+1} · ${test.id}`,{buildIndex,personIndex:pi,testIndex:ti,test,rowIndex:person.rowIndex,sex:person.sex,ageYears:person.ageYears,truth:Object.fromEntries(c.hardIds.map(id=>[id,c.truth[id]])),baseline:Object.fromEntries(run.model.measureIds.map((id,j)=>[id,c.baselineActual[j]])),result:{initialMetrics:result.initialMetrics,finalMetrics:result.finalMetrics,requestedDeltaRmse:result.requestedDeltaRmse,boundCount:result.boundCount,sensitiveBounds:result.sensitiveBounds,rescueUsed:result.rescueUsed,rescueAccepted:result.rescueAccepted,evaluations:result.evaluations,solutionDs:result.ds,actual:Object.fromEntries(run.model.measureIds.map((id,j)=>[id,result.actual[j]]))}});if(sammyAnsLab.d3Visual)await new Promise(r=>setTimeout(r,180));else sammyClearMeasureOverlay()}
async function sammyAnsD3Runner(){const run=sammyAnsLab.d3Run;if(!run)return;sammyAnsLab.d3Running=true;sammyAnsLab.d3Paused=false;sammyAnsD3VisualHide();sammyAnsLab.d3ExitAfterPause=false;sammyAnsLab.d3Cache=null;document.body.classList.add("sammy-ansur-d-running");sammyAnsLab.d3Restore=sammyAnsDCaptureState();sammyAnsD3RefreshUi();try{await sammyAnsDMeasurementPose();while(sammyAnsLab.d3Running&&!sammyAnsLab.d3Paused&&run.stage!=="complete"){const i=run.cursor;if(i>=run.totalBuilds){run.summary=sammyAnsD3Summary(run);run.stage="complete";run.completedAt=new Date().toISOString();await sammySolverPutRun(run);break}await sammyAnsD3TestOne(run,i);run.cursor=i+1;run.summary=sammyAnsD3Summary(run);await sammySolverPutRun(run);sammyAnsD3RefreshUi()}if(run.stage==="complete")sammyAnsD3Status(`Audit fertig · ${run.summary.verdict.detail}`);else if(sammyAnsLab.d3Paused)sammyAnsD3Status(`Audit pausiert · ${run.cursor}/${run.totalBuilds} Fits gespeichert.`)}catch(e){console.error("ANSUR D3 Audit",e);sammyAnsLab.d3Paused=true;sammyAnsD3Status(`FEHLER: ${e?.message||e}`);sammyReportError?.(e,{source:"ANSUR D3 Alignment Audit"})}finally{sammyAnsLab.d3Running=false;sammyAnsLab.d3Cache=null;document.body.classList.remove("sammy-ansur-d-running");const st=sammyAnsLab.d3Restore;sammyAnsLab.d3Restore=null;if(st){annyParams={...st.core};annyLocalValues={...st.local};applyAnnyParams();sammyMeasureSyncLocalUiV3();if(st.relative)sammyApplyMeasurementRelative(new Float32Array(st.relative),"ANSUR D3 → previous pose");sammyClearMeasureOverlay();if(st.running&&st.mode==="user"&&userAnimLoaded)startPoseAnimation("user",Math.max(0,Math.min(userAnimFrames-1,st.frame||0)));await new Promise(r=>requestAnimationFrame(()=>r()))}sammyAnsD3RefreshUi();sammyAnsRefreshUi();sammyAnsLab.d3ExitAfterPause=false;sammyAnsD3VisualHide()}}
async function sammyAnsD3StartOrResume(){if(sammyAnsLab.d3Running||sammyAnsLab.d2Running||sammyAnsLab.dRunning||sammyAnsLab.running||!sammyAnsLab.runC)return;if(!annyPackLoaded){sammyAnsD3Status("Anny-Pack ist noch nicht bereit.");return}try{let run=sammyAnsLab.d3Run;if(!run||run.schema!==SAMMY_ANS_D3_SCHEMA||run.stage==="complete"){run=await sammyAnsD3NewRun();sammyAnsLab.d3Run=run;sammySolverRuntimeCache=null;await sammySolverPutRun(run)}sammyAnsD3Runner()}catch(e){sammyAnsLab.running=null;sammyAnsD3Status(`FEHLER: ${e?.message||e}`);sammyReportError?.(e,{source:"ANSUR D3 start"});sammyAnsRefreshUi()}}
function sammyAnsD3Pause(){if(!sammyAnsLab.d3Running)return;sammyAnsLab.d3Paused=true;sammyAnsD3Status("Pause nach dem aktuellen Audit-Fit · letzter fertiger Fit bleibt gespeichert.")}
async function sammyAnsD3Reset(){const run=sammyAnsLab.d3Run;if(sammyAnsLab.d3Running||sammyAnsLab.d2Running||sammyAnsLab.dRunning||sammyAnsLab.running||!run)return;if(!confirm("Gespeicherten D3 Alignment-Audit löschen? A/B/C, D1, D2 und R5 bleiben erhalten."))return;await sammySolverDeleteRun(run.runId);sammyAnsLab.d3Run=null;sammyAnsLab.d3Cache=null;sammyAnsD3VisualHide();const b=$("#sammyAnsD3Progress");if(b)b.style.width="0%";sammyAnsD3Status("D3 gelöscht · A/B/C, D1, D2 und R5 unverändert.");sammyAnsD3RefreshUi()}
async function sammyAnsD3LoadLatest(){try{const runs=(await sammySolverGetRuns()).filter(r=>r?.schema===SAMMY_ANS_D3_SCHEMA).sort((a,b)=>String(b.updatedAt||"").localeCompare(String(a.updatedAt||""))),active=runs.find(r=>r.stage!=="complete")||runs[0]||null;sammyAnsLab.d3Run=active;if(active){sammyAnsLab.d3Mode=active.mode||"deep";sammyAnsD3RefreshUi()}}catch(e){console.warn("ANSUR D3 resume",e)}}
async function sammyAnsD3Export(summaryOnly=false){const run=sammyAnsLab.d3Run;if(!run){sammyAnsD3Status("Kein D3-Audit zum Exportieren.");return}const summary=run.summary||sammyAnsD3Summary(run),base={schema:SAMMY_ANS_D3_SCHEMA,app:"Sammy",version:"0.8.17.1",generated:new Date().toISOString(),purpose:"ANSUR↔Sammy Alignment Audit: real-mesh isolated measure reachability with stature anchor plus anatomical bundle compatibility, range and mapping diagnostics.",summary,notes:run.notes};let payload=base;if(!summaryOnly){const records=await sammySolverGetRecords(run.runId);payload={...base,run,records}}const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=summaryOnly?`Sammy_ANSUR_D3_Audit_Summary_${run.mode}_${run.runId}.json`:`Sammy_ANSUR_D3_Audit_FULL_${run.mode}_${run.runId}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500)}

function sammyAnsInitUI(){const s=sammyAnsStored();sammyAnsLab.runA=s.runA||null;sammyAnsLab.runB=s.runB||null;sammyAnsLab.runC=s.runC||null;const mini=$("#sammyAnsMiniPlayPause"),visual=$("#sammyAnsD3Visual"),a=$("#sammyAnsRunA"),b=$("#sammyAnsRunB"),c=$("#sammyAnsRunC"),sum=$("#sammyAnsSummaryExport"),full=$("#sammyAnsFullExport"),reset=$("#sammyAnsReset"),close=$("#sammyAnsClose"),ds=$("#sammyAnsDStart"),dp=$("#sammyAnsDPause"),dr=$("#sammyAnsDReset"),dSum=$("#sammyAnsDSummary"),dFull=$("#sammyAnsDFull"),d2s=$("#sammyAnsD2Start"),d2p=$("#sammyAnsD2Pause"),d2r=$("#sammyAnsD2Reset"),d2Sum=$("#sammyAnsD2Summary"),d2Full=$("#sammyAnsD2Full"),d3s=$("#sammyAnsD3Start"),d3p=$("#sammyAnsD3Pause"),d3r=$("#sammyAnsD3Reset"),d3Sum=$("#sammyAnsD3Summary"),d3Full=$("#sammyAnsD3Full");if(mini)mini.onclick=sammyAnsMiniTransport;if(visual)visual.onclick=sammyAnsD3ToggleVisual;if(a)a.onclick=sammyAnsRunA;if(b)b.onclick=sammyAnsRunB;if(c)c.onclick=sammyAnsRunC;if(sum)sum.onclick=()=>sammyAnsExport(true);if(full)full.onclick=()=>sammyAnsExport(false);if(reset)reset.onclick=sammyAnsReset;if(close)close.onclick=sammyClosePanels;document.querySelectorAll("[data-ans-d-mode]").forEach(x=>x.onclick=()=>sammyAnsDSetMode(x.dataset.ansDMode));if(ds)ds.onclick=sammyAnsDStartOrResume;if(dp)dp.onclick=sammyAnsDPause;if(dr)dr.onclick=sammyAnsDReset;if(dSum)dSum.onclick=()=>sammyAnsDExport(true);if(dFull)dFull.onclick=()=>sammyAnsDExport(false);document.querySelectorAll("[data-ans-d2-mode]").forEach(x=>x.onclick=()=>sammyAnsD2SetMode(x.dataset.ansD2Mode));if(d2s)d2s.onclick=sammyAnsD2StartOrResume;if(d2p)d2p.onclick=sammyAnsD2Pause;if(d2r)d2r.onclick=sammyAnsD2Reset;if(d2Sum)d2Sum.onclick=()=>sammyAnsD2Export(true);if(d2Full)d2Full.onclick=()=>sammyAnsD2Export(false);document.querySelectorAll("[data-ans-d3-mode]").forEach(x=>x.onclick=()=>sammyAnsD3SetMode(x.dataset.ansD3Mode));if(d3s)d3s.onclick=sammyAnsD3StartOrResume;if(d3p)d3p.onclick=sammyAnsD3Pause;if(d3r)d3r.onclick=sammyAnsD3Reset;if(d3Sum)d3Sum.onclick=()=>sammyAnsD3Export(true);if(d3Full)d3Full.onclick=()=>sammyAnsD3Export(false);sammyAnsDLoadLatest();sammyAnsD2LoadLatest();sammyAnsD3LoadLatest();sammyAnsRefreshUi()}

function sammyOpenPanel(id){
 if((sammyAnsLab.dRunning||sammyAnsLab.d2Running||sammyAnsLab.d3Running)&&id!=="sammyAnsPanel")return;
 const before=document.querySelector(".sammyPanel.open")?.id||null;
 if(before===id)return;
 // When switching directly between special camera modes, first restore the
 // underlying user camera instantly, then start the next smooth transition.
 if(before==="sammyAnimPanel"&&id!=="sammyAnimPanel"&&sammyPreAnimationCamera){
  const state=sammyPreAnimationCamera;sammyPreAnimationCamera=null;sammyCameraTweenToState(state,0,true)
 }
 if(before==="sammyMeasurePanel"&&id!=="sammyMeasurePanel")sammyExitMeasureMode(true);
 if(id==="sammyAnimPanel"&&before!=="sammyAnimPanel"&&!sammyIntroActive)sammyPreAnimationCamera=sammyCaptureCameraState();
 document.querySelectorAll(".sammyPanel").forEach(p=>p.classList.toggle("open",p.id===id));
 document.querySelectorAll(".sammyBubble").forEach(b=>b.classList.toggle("active",b.dataset.panel===id));
 const p=document.getElementById(id);
 if(p){
  const state=sammyUiLoadState(),key=p.dataset.panelKey;
  const h=Number(state.panelHeights?.[key]||0);
  if(h){p.style.setProperty("--sammy-panel-h",`${h}px`);if(key==="animation"||key==="ansur")p.classList.toggle("compact",h<138)}
 }
 if(id==="sammyAnimPanel"&&!sammyIntroActive)sammyCameraTo("anim-panel",820,false);
 if(id==="sammyMeasurePanel"&&!sammyIntroActive)sammyEnterMeasureMode()
}
function sammyClosePanels(){
 const before=document.querySelector(".sammyPanel.open")?.id||null;
 document.querySelectorAll(".sammyPanel").forEach(p=>p.classList.remove("open"));
 document.querySelectorAll(".sammyBubble").forEach(b=>b.classList.remove("active"));
 if(before==="sammyAnimPanel"&&!sammyIntroActive)sammyRestorePreAnimationCamera();
 if(before==="sammyMeasurePanel"&&!sammyIntroActive)sammyExitMeasureMode()
}
function sammyInstallBubbleDrag(el,defaultX,defaultY){
 const state=sammyUiLoadState(),saved=state.bubbles?.[el.id];
 const initial=sammyBubbleClampPos(Number(saved?.x??defaultX),Number(saved?.y??defaultY));
 sammyBubbleRegistry[el.id]={x:initial.x,y:initial.y,edge:saved?.edge||sammyNearestEdgeFromPos(initial.x,initial.y),groupId:null};
 sammyResolveBubbleLayout();
 let pid=null,sx=0,sy=0,ox=0,oy=0,moved=false,groupIds=[],groupStart=[],groupEdge=null,draggingGroup=false,detached=false;
 let lastPX=0,lastPY=0,lastPT=0,velX=0,velY=0,layoutSnapshot=null,snapPreviewEdge=null;
 el.addEventListener("pointerdown",e=>{
  pid=e.pointerId;el.setPointerCapture(pid);sx=e.clientX;sy=e.clientY;moved=false;detached=false;
  lastPX=e.clientX;lastPY=e.clientY;lastPT=performance.now();velX=0;velY=0;
  const meta=sammyBubbleRegistry[el.id];ox=meta.x;oy=meta.y;snapPreviewEdge=null;
  layoutSnapshot=Object.fromEntries(Object.entries(sammyBubbleRegistry).map(([id,m])=>[id,{x:m.x,y:m.y,edge:m.edge,groupId:m.groupId}]));
  groupIds=sammyBubbleGroupMembers(el.id);sammyCancelBubbleMotions(groupIds);
  draggingGroup=groupIds.length>1;
  groupStart=groupIds.map(id=>({id,x:sammyBubbleRegistry[id].x,y:sammyBubbleRegistry[id].y}));
  groupEdge=meta.edge||sammyNearestEdgeFromPos(meta.x,meta.y);
  e.preventDefault()
 });
 el.addEventListener("pointermove",e=>{
  if(pid!==e.pointerId)return;
  const now=performance.now(),dt=Math.max(4,now-lastPT),ivx=(e.clientX-lastPX)/dt*1000,ivy=(e.clientY-lastPY)/dt*1000;
  velX=velX*.58+ivx*.42;velY=velY*.58+ivy*.42;lastPX=e.clientX;lastPY=e.clientY;lastPT=now;
  const dx=e.clientX-sx,dy=e.clientY-sy;if(Math.hypot(dx,dy)>5)moved=true;
  const meta=sammyBubbleRegistry[el.id];
  if(draggingGroup&&!detached){
   const axis=(groupEdge==="left"||groupEdge==="right")?"y":"x";
   const delta=axis==="y"?dy:dx;
   const crossDelta=Math.abs(axis==="y"?dx:dy);
   const currentCross=(axis==="y"?meta.x:meta.y)+(axis==="y"?dx:dy);
   const expectedCross=sammyBubbleCrossValue(groupEdge);
   if(crossDelta>SAMMY_BUBBLE_DETACH || Math.abs(currentCross-expectedCross)>SAMMY_BUBBLE_DETACH){
    detached=true;draggingGroup=false;
    groupIds.filter(id=>id!==el.id).forEach(id=>sammyBubbleRegistry[id].groupId=null);
    meta.groupId=null;
    // Continue from the visible dragged position instead of jumping back to pointer-down.
    ox=meta.x;oy=meta.y;sx=e.clientX;sy=e.clientY;
   }else{
    const span=sammyBubbleSpan(groupEdge),min0=Math.min(...groupStart.map(s=>s[axis])),max0=Math.max(...groupStart.map(s=>s[axis]));
    let shift=delta;
    if(min0+shift<span.min)shift=span.min-min0;
    if(max0+shift>span.max)shift=span.max-max0;
    groupStart.forEach(s=>{
      const m=sammyBubbleRegistry[s.id];m.edge=groupEdge;m.groupId=`drag-${el.id}`;
      if(axis==="y"){m.x=sammyBubbleCrossValue(groupEdge);m.y=s.y+shift}else{m.y=sammyBubbleCrossValue(groupEdge);m.x=s.x+shift}
      sammyBubbleApply(s.id)
    });
    return
   }
  }
  const cl=sammyBubbleClampPos(ox+(e.clientX-sx),oy+(e.clientY-sy)),edge=sammyBubbleCandidateEdge(cl.x,cl.y);
  if(edge){
   const axis=(edge==="left"||edge==="right")?"y":"x",desired=axis==="y"?cl.y:cl.x;
   sammyPreviewBubbleInsertion(el.id,edge,desired,layoutSnapshot);snapPreviewEdge=edge
  }else{
   if(snapPreviewEdge)sammyBubbleRestoreSnapshot(layoutSnapshot,el.id);
   snapPreviewEdge=null;meta.x=cl.x;meta.y=cl.y;meta.edge=null;meta.groupId=null;sammyBubbleApply(el.id)
  }
 });
 el.addEventListener("pointerup",e=>{
  if(pid!==e.pointerId)return;pid=null;
  if(!moved){
   const meta=sammyBubbleRegistry[el.id];meta.edge=sammyNearestEdgeFromPos(meta.x,meta.y);
   const cross=sammyBubbleCrossValue(meta.edge);if(meta.edge==="left"||meta.edge==="right")meta.x=cross;else meta.y=cross;
   sammyResolveBubbleLayout();
   const panel=document.getElementById(el.dataset.panel);
   if(panel?.classList.contains("open"))sammyClosePanels();else sammyOpenPanel(el.dataset.panel);
   return
  }
  if(snapPreviewEdge){
   const edge=snapPreviewEdge;snapPreviewEdge=null;sammyResolveBubbleLayout();const ids=sammyBubbleGroupMembers(el.id),axisV=(edge==="left"||edge==="right")?velY:velX;
   if(Math.abs(axisV)>220)sammyFlingBubbleGroup(ids,edge,axisV);else sammyPersistBubbles();return
  }
  if(draggingGroup&&!detached){const axisV=(groupEdge==="left"||groupEdge==="right")?velY:velX;sammyFlingBubbleGroup(groupIds,groupEdge,axisV)}else sammyFlingBubble(el.id,velX,velY)
 });
 el.addEventListener("pointercancel",()=>{pid=null;sammyResolveBubbleLayout()});
 window.addEventListener("resize",()=>{sammyCancelBubbleMotions(Object.keys(sammyBubbleRegistry));sammyResolveBubbleLayout()})
}
function sammyInstallPanelResize(panel){
 const grip=panel.querySelector(".sammyResizeGrip");if(!grip)return;
 let pid=null,startY=0,startH=0;
 const isCompactable=panel.dataset.panelKey==="animation"||panel.dataset.panelKey==="ansur",minH=isCompactable?82:190;
 const applyCompact=h=>{if(isCompactable)panel.classList.toggle("compact",h<138)};
 grip.addEventListener("pointerdown",e=>{
  pid=e.pointerId;grip.setPointerCapture(pid);startY=e.clientY;startH=panel.getBoundingClientRect().height;
  if(isCompactable&&panel.classList.contains("compact")){panel.classList.remove("compact");startH=138}
  e.preventDefault()
 });
 grip.addEventListener("pointermove",e=>{
  if(pid!==e.pointerId)return;
  const h=Math.max(minH,Math.min(innerHeight*.82,startH+(startY-e.clientY)));
  panel.style.setProperty("--sammy-panel-h",`${h}px`);applyCompact(h)
 });
 grip.addEventListener("pointerup",e=>{
  if(pid!==e.pointerId)return;pid=null;
  let h=Math.round(panel.getBoundingClientRect().height);
  if(isCompactable&&h<138){h=86;panel.style.setProperty("--sammy-panel-h","86px");panel.classList.add("compact")}
  const state=sammyUiLoadState();
  sammyUiSaveState({panelHeights:{...(state.panelHeights||{}),[panel.dataset.panelKey]:h}})
 });
 const state=sammyUiLoadState(),stored=Number(state.panelHeights?.[panel.dataset.panelKey]||0);
 if(stored)applyCompact(stored)
}
function sammyMountShapeControls(){
 const mounts=[
  ["#annyCoreControls","#sammyCoreMount"],
  ["#annyAdvancedPhenotypes","#sammyAdvancedMount"],
  ["#annyLocalGroups","#sammyLocalMount"]
 ];
 for(const [source,target] of mounts){
  const s=$(source),t=$(target);if(s&&t&&s.parentElement!==t)t.appendChild(s)
 }
}
function sammyFilterShapeControls(q){
 q=String(q||"").trim().toLowerCase();
 document.querySelectorAll("#sammyShapePanel .annySlider").forEach(r=>r.hidden=!!q&&!String(r.dataset.search||r.textContent).toLowerCase().includes(q));
 document.querySelectorAll("#sammyShapePanel .annyLocalCategory").forEach(d=>{
  const shown=[...d.querySelectorAll(".annySlider")].some(r=>!r.hidden);
  d.hidden=!shown;if(q&&shown)d.open=true
 })
}
async function sammyApplyUserFrame(frame){
 if(!userAnimLoaded)return;
 const f=Math.max(0,Math.min(userAnimFrames-1,Math.round(Number(frame)||0)));
 stopPoseAnimation(false);userAnimCurrentFrame=f;
 if(!morphSammyTargetActive){const ok=await activateMorphableSammyTarget();if(!ok)return}
 const off=f*poseJointCount*9,rel=userAnimRel.subarray(off,off+poseJointCount*9);
 applyAnnyAxis16RetargetPose(currentDisplayRest(),rel,true,false,"Sammy Frame-Auswahl");
 refreshRigDebug();sammySyncAnimationUi()
}

function sammySetSkeletonBodyView(on){
 if(!mesh?.material||!geometry)return;
 if(on===sammySkeletonViewActive)return;
 sammySkeletonViewActive=on;
 if(on){
  sammySkeletonSavedMaterial=mesh.material;
  const baseColor=sammySkeletonSavedMaterial?.color?.getHex?.()??0xc8c9cf;
  mesh.material=new THREE.MeshBasicMaterial({
   color:baseColor,transparent:true,opacity:.16,depthTest:true,depthWrite:true,
   side:THREE.FrontSide
  });
  sammyApplySkeletonShellIndex()
 }else{
  const ghost=mesh.material;
  if(sammySkeletonSavedMaterial)mesh.material=sammySkeletonSavedMaterial;
  if(ghost&&ghost!==sammySkeletonSavedMaterial)ghost.dispose?.();
  sammySkeletonSavedMaterial=null;
  sammyRestoreOriginalMeshIndex()
 }
}
function sammyRestoreOriginalMeshIndex(){
 if(!geometry||!sammyOriginalIndex)return;
 geometry.setIndex(new THREE.BufferAttribute(sammyOriginalIndex,1))
}
function sammyApplySkeletonShellIndex(){
 if(!geometry?.index||!annyLastCoeffs)return;
 const current=geometry.index.array,signature=`${geometry.attributes.position.count}:${current.length}`;
 if(!sammyOriginalIndex||sammySkeletonIndexSignature!==signature){
  sammyOriginalIndex=new current.constructor(current);
  sammySkeletonShellIndex=null;sammySkeletonIndexSignature=signature
 }
 if(!sammySkeletonShellIndex)sammySkeletonShellIndex=sammyBuildSkeletonShellIndex();
 if(sammySkeletonShellIndex)geometry.setIndex(new THREE.BufferAttribute(sammySkeletonShellIndex,1))
}
function sammyBuildSkeletonShellIndex(){
 try{
  const src=sammyOriginalIndex;if(!src)return null;
  const rest=currentDisplayRest(),rig=reconstructExactAnnyRestRig(annyLastCoeffs);
  const neck=PUBLIC_JOINT_NAMES.indexOf("Neck"),head=PUBLIC_JOINT_NAMES.indexOf("Head"),top=PUBLIC_JOINT_NAMES.indexOf("HeadTop_End");
  if(neck<0||head<0||top<0)return new src.constructor(src);
  const pos=j=>[rig.restWorld[j*16+3],rig.restWorld[j*16+7]+annyGroundOffsetY,rig.restWorld[j*16+11]];
  const pn=pos(neck),ph=pos(head),pt=pos(top);
  const hc=[(ph[0]+pt[0])*.5,(ph[1]+pt[1])*.5,(ph[2]+pt[2])*.5];
  const headLen=Math.max(.12,Math.hypot(pt[0]-pn[0],pt[1]-pn[1],pt[2]-pn[2])),radius=headLen*1.22,kept=[];
  let removed=0;
  for(let k=0;k<src.length;k+=3){
   const ia=src[k],ib=src[k+1],ic=src[k+2],a=ia*3,b=ib*3,c=ic*3;
   const ax=rest[a],ay=rest[a+1],az=rest[a+2],bx=rest[b],by=rest[b+1],bz=rest[b+2],cx=rest[c],cy=rest[c+1],cz=rest[c+2];
   const mx=(ax+bx+cx)/3,my=(ay+by+cy)/3,mz=(az+bz+cz)/3,rx=mx-hc[0],ry=my-hc[1],rz=mz-hc[2],dist=Math.hypot(rx,ry,rz);
   let hide=false;
   if(dist<radius){
    const e1x=bx-ax,e1y=by-ay,e1z=bz-az,e2x=cx-ax,e2y=cy-ay,e2z=cz-az;
    const nx=e1y*e2z-e1z*e2y,ny=e1z*e2x-e1x*e2z,nz=e1x*e2y-e1y*e2x,nl=Math.hypot(nx,ny,nz),rl=Math.max(1e-9,dist);
    const radialDot=nl>1e-12?(nx*rx+ny*ry+nz*rz)/(nl*rl):1;
    hide=radialDot<.12
   }
   if(hide)removed++;else kept.push(ia,ib,ic)
  }
  const Out=src.constructor,out=new Out(kept.length);out.set(kept);
  console.info(`Sammy skeleton shell: ${removed} inner-head triangles hidden`);
  return out
 }catch(e){
  console.warn("Skeleton shell filter failed",e);
  return sammyOriginalIndex?new sammyOriginalIndex.constructor(sammyOriginalIndex):null
 }
}
function sammyToggleSkeleton(){
 rigDebugUseExpanded=false;disposeRigDebugObjects();toggleRigDebug();
 sammySetSkeletonBodyView(rigDebugVisible);sammySyncAnimationUi()
}


function sammyCaptureCurrentAnimation(nameOverride=""){
 return {
  id:`anim-${Date.now()}-${sammyAnimationSeq++}`,
  name:nameOverride||userAnimName||"Animation",
  data:userAnimRel,frames:userAnimFrames,fps:userAnimFps,
  source:userAnimSource||"",currentFrame:0
 }
}
function sammySetActiveAnimation(entry,autoplay=true){
 if(!entry)return;
 stopPoseAnimation(false);
 sammyActiveAnimationId=entry.id;
 userAnimRel=entry.data;userAnimFrames=entry.frames;userAnimFps=entry.fps;
 userAnimLoaded=true;userAnimName=entry.name;userAnimSource=entry.source;userAnimCurrentFrame=Math.max(0,Math.min(entry.frames-1,entry.currentFrame||0));
 if($("#animCompareFrame")){$("#animCompareFrame").min="0";$("#animCompareFrame").max=String(Math.max(0,entry.frames-1));$("#animCompareFrame").value=String(userAnimCurrentFrame)}
 sammyRenderAnimationLibrary();sammySyncAnimationUi();
 if(autoplay)startPoseAnimation("user",userAnimCurrentFrame)
}
function sammyAnimationIndex(){
 return sammyAnimationLibrary.findIndex(x=>x.id===sammyActiveAnimationId)
}
function sammyStepAnimation(delta){
 if(!sammyAnimationLibrary.length)return;
 let i=sammyAnimationIndex();if(i<0)i=0;
 i=(i+delta+sammyAnimationLibrary.length)%sammyAnimationLibrary.length;
 sammySetActiveAnimation(sammyAnimationLibrary[i],true)
}
function sammyTogglePlayback(){
 if(!userAnimLoaded)return;
 if(poseAnimRunning&&poseAnimMode==="user")stopPoseAnimation(false);
 else startPoseAnimation("user",userAnimCurrentFrame||0);
 sammySyncAnimationUi()
}
function sammyDeleteAnimation(id){
 const i=sammyAnimationLibrary.findIndex(x=>x.id===id);if(i<0)return;
 const wasActive=sammyActiveAnimationId===id;
 sammyAnimationLibrary.splice(i,1);
 if(wasActive){
  stopPoseAnimation(false);
  if(sammyAnimationLibrary.length){
   const next=sammyAnimationLibrary[Math.min(i,sammyAnimationLibrary.length-1)];
   sammySetActiveAnimation(next,false)
  }else{
   sammyActiveAnimationId=null;userAnimRel=null;userAnimFrames=0;userAnimLoaded=false;userAnimName="";userAnimSource="";userAnimCurrentFrame=0
  }
 }
 sammyRenderAnimationLibrary();sammySyncAnimationUi()
}
function sammySyncLibraryOrderFromDom(){
 const ids=[...document.querySelectorAll("#sammyAnimLibrary .sammyAnimItem")].map(x=>x.dataset.id);
 const by=new Map(sammyAnimationLibrary.map(x=>[x.id,x]));
 sammyAnimationLibrary=ids.map(id=>by.get(id)).filter(Boolean)
}
function sammyInstallLibraryDrag(row){
 let timer=0,dragging=false,pid=null;
 const cancel=()=>{clearTimeout(timer);timer=0};
 row.addEventListener("pointerdown",e=>{
  if(e.target.closest(".sammyAnimDelete"))return;
  pid=e.pointerId;dragging=false;
  timer=setTimeout(()=>{
   dragging=true;row.classList.add("dragging");
   try{row.setPointerCapture(pid)}catch{}
   navigator.vibrate?.(8)
  },380)
 });
 row.addEventListener("pointermove",e=>{
  if(pid!==e.pointerId||!dragging)return;e.preventDefault();
  const hit=document.elementFromPoint(e.clientX,e.clientY)?.closest?.(".sammyAnimItem");
  if(!hit||hit===row||hit.parentElement!==row.parentElement)return;
  const r=hit.getBoundingClientRect();
  if(e.clientY<r.top+r.height/2)hit.before(row);else hit.after(row)
 });
 const end=e=>{
  if(pid!==null&&e.pointerId!==undefined&&e.pointerId!==pid)return;
  cancel();
  if(dragging){row.classList.remove("dragging");sammySyncLibraryOrderFromDom()}
  else if(e.type==="pointerup"&&!e.target.closest(".sammyAnimDelete")){
   const entry=sammyAnimationLibrary.find(x=>x.id===row.dataset.id);if(entry)sammySetActiveAnimation(entry,true)
  }
  dragging=false;pid=null
 };
 row.addEventListener("pointerup",end);row.addEventListener("pointercancel",end);row.addEventListener("pointerleave",cancel)
}
function sammyRenderAnimationLibrary(){
 const box=$("#sammyAnimLibrary"),count=$("#sammyLibraryCount");if(!box)return;
 if(count)count.textContent=String(sammyAnimationLibrary.length);
 if(!sammyAnimationLibrary.length){box.innerHTML='<div class="sammyLibraryEmpty">Noch keine Animation importiert.</div>';return}
 box.innerHTML="";
 for(const entry of sammyAnimationLibrary){
  const row=document.createElement("div");row.className="sammyAnimItem"+(entry.id===sammyActiveAnimationId?" active":"");row.dataset.id=entry.id;
  row.innerHTML=`<div class="sammyAnimGrab">≡</div><div class="sammyAnimMeta"><b>${escapeHtml(entry.name)}</b><small>${entry.frames} Frames · ${entry.fps} fps</small></div><button class="sammyAnimDelete" type="button" aria-label="Löschen">×</button>`;
  row.querySelector(".sammyAnimDelete").onclick=e=>{e.stopPropagation();sammyDeleteAnimation(entry.id)};
  sammyInstallLibraryDrag(row);box.appendChild(row)
 }
}
async function sammyImportAnimationFiles(files){
 const list=[...files||[]];if(!list.length||sammyLibraryLoading)return;
 sammyLibraryLoading=true;stopPoseAnimation(false);
 const status=$("#sammyAnimStatus");let firstNew=null,okCount=0,failCount=0;
 try{
  for(let i=0;i<list.length;i++){
   const f=list[i];
   if(status){status.textContent=`Import ${i+1}/${list.length}: ${f.name}`;status.className="sammyStatus"}
   try{
    const ok=await loadUserAnimationFile(f);
    if(!ok){failCount++;continue}
    const entry=sammyCaptureCurrentAnimation(f.name);
    sammyAnimationLibrary.push(entry);okCount++;if(!firstNew)firstNew=entry
   }catch(e){failCount++;sammyReportError(e,{source:`Animationsimport: ${f.name}`})}
  }
  if(firstNew)sammySetActiveAnimation(firstNew,true);
  else if(status){status.textContent="Keine Animation konnte importiert werden.";status.className="sammyStatus error"}
  if(okCount&&status){
   status.textContent=`${okCount} Animation${okCount===1?"":"en"} importiert${failCount?` · ${failCount} fehlgeschlagen`:""}`;
   status.className=failCount?"sammyStatus":"sammyStatus ok"
  }
 }finally{
  sammyLibraryLoading=false;
  const input=$("#sammyAnimFile");if(input)input.value="";
  sammyRenderAnimationLibrary();sammySyncAnimationUi()
 }
}

function sammySyncAnimationUi(){
 const status=$("#sammyAnimStatus"),range=$("#sammyFrameRange"),num=$("#sammyFrameNumber"),out=$("#sammyFrameOut");
 if(!status)return;
 if(!userAnimLoaded){
  status.textContent="Keine Animation geladen";status.className="sammyStatus";
  for(const x of [range,num])if(x)x.disabled=true;
  if(out)out.textContent="0 / 0";return
 }
 status.textContent=`${userAnimName} · ${userAnimFrames} Frames · ${userAnimFps} fps`;
 status.className="sammyStatus ok";
 const max=Math.max(0,userAnimFrames-1),f=Math.max(0,Math.min(max,userAnimCurrentFrame||0));
 if(range){range.disabled=false;range.max=String(max);if(!range.matches(":active"))range.value=String(f)}
 if(num){num.disabled=false;num.max=String(max);if(!num.matches(":focus"))num.value=String(f)}
 if(out)out.textContent=`${f} / ${max}`;
 const sk=$("#sammySkeleton");if(sk){sk.textContent=rigDebugVisible?"Skelett ausblenden":"Skelett anzeigen";sk.classList.toggle("active",rigDebugVisible)}
 const mini=$("#sammyMiniPlayPause");if(mini){mini.textContent=poseAnimRunning&&poseAnimMode==="user"?"Ⅱ":"▶";mini.disabled=!userAnimLoaded}
 const prev=$("#sammyPrevAnim"),next=$("#sammyNextAnim");if(prev)prev.disabled=sammyAnimationLibrary.length<2;if(next)next.disabled=sammyAnimationLibrary.length<2;
 const active=sammyAnimationLibrary.find(x=>x.id===sammyActiveAnimationId);if(active)active.currentFrame=f
}
async function sammyLoadAndPlay(file){
 if(!file)return;
 const status=$("#sammyAnimStatus");
 try{
  sammyIntroActive=false;sammyIntroPhase="interrupted";
  if(status){status.textContent="Animation wird geladen …";status.className="sammyStatus"}
  const ok=await loadUserAnimationFile(file);if(!ok)throw new Error("Animation konnte nicht geladen werden.");
  if(!morphSammyTargetActive){const morphOk=await activateMorphableSammyTarget();if(!morphOk)throw new Error("Morphbares Sammy konnte nicht aktiviert werden.")}
  userAnimCurrentFrame=0;startPoseAnimation("user",0);sammySyncAnimationUi()
 }catch(e){sammyReportError(e,{source:"Animation laden"});if(status){status.textContent=e.message||String(e);status.className="sammyStatus error"}}
}
function sammyRuntimeSnapshot(){
 return {
  app:"Sammy",version:"0.7.1",time:new Date().toISOString(),
  url:location.href,userAgent:navigator.userAgent,
  runtime:{
   autoBootDone,shapePass,shapeEngine,displayLOD,annyPackLoaded,annyMidLoaded,
   poseReady,currentRigMode,poseJointCount,targetJointCount,morphSammyTargetActive,
   rigDebugVisible,rigAxesVisible
  },
  animation:{
   loaded:userAnimLoaded,name:userAnimName,source:userAnimSource,frames:userAnimFrames,
   fps:userAnimFps,currentFrame:userAnimCurrentFrame,running:poseAnimRunning,mode:poseAnimMode
  },
  shape:annyLastCoeffs?{...annyParams,activeLocal:Object.entries(annyLocalValues||{}).filter(([,v])=>Math.abs(v)>1e-6)}:null
 }
}
function sammyReportError(error,extra={}){
 try{
  const e=error instanceof Error?error:new Error(typeof error==="string"?error:JSON.stringify(error));
  const item={
   time:new Date().toISOString(),message:e.message||String(e),name:e.name||"Error",
   stack:e.stack||"",extra,snapshot:sammyRuntimeSnapshot()
  };
  sammyErrors.unshift(item);if(sammyErrors.length>40)sammyErrors.length=40;
  const bubble=$("#sammyErrorBubble"),count=$("#sammyErrorCount"),summary=$("#sammyErrorSummary"),list=$("#sammyErrorList");
  bubble?.classList.remove("hidden");if(count)count.textContent=String(sammyErrors.length);
  if(summary){summary.textContent=`${sammyErrors.length} Fehler erfasst · zuletzt: ${item.message}`;summary.className="sammyStatus error"}
  if(list){
   list.innerHTML=sammyErrors.map((x,i)=>`<div class="sammyErrorItem"><b>${i+1}. ${escapeHtml(x.name)} · ${escapeHtml(x.time.slice(11,19))}</b>${escapeHtml(x.message)}${x.extra?.source?`<br>Quelle: ${escapeHtml(String(x.extra.source))}`:""}${x.stack?`<pre>${escapeHtml(x.stack.slice(0,2400))}</pre>`:""}</div>`).join("")
  }
 }catch{}
}
function sammyDiagnosticsPayload(){return {schema:"sammy-diagnostics-v1",generated:new Date().toISOString(),snapshot:sammyRuntimeSnapshot(),errors:sammyErrors}}
async function sammyCopyDiagnostics(){
 const text=JSON.stringify(sammyDiagnosticsPayload(),null,2);
 try{await navigator.clipboard.writeText(text);$("#sammyErrorSummary").textContent="Diagnose in Zwischenablage kopiert."}
 catch{sammyDownloadDiagnostics()}
}
function sammyDownloadDiagnostics(){
 const b=new Blob([JSON.stringify(sammyDiagnosticsPayload(),null,2)],{type:"application/json"});
 const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=`Sammy_Diagnostics_${new Date().toISOString().replace(/[:.]/g,"-")}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)
}
function sammyInstallErrorCapture(){
 const originalError=console.error.bind(console);
 console.error=(...args)=>{
  originalError(...args);
  const first=args.find(x=>x instanceof Error) || new Error(args.map(x=>typeof x==="string"?x:JSON.stringify(x)).join(" "));
  sammyReportError(first,{source:"console.error"})
 };
 window.addEventListener("error",e=>{
  if(e.error)sammyReportError(e.error,{source:"window.error",filename:e.filename,line:e.lineno,column:e.colno});
  else if(e.target&&e.target!==window)sammyReportError(new Error(`Ressource konnte nicht geladen werden: ${e.target.src||e.target.href||e.target.tagName}`),{source:"resource"})
 },true);
 window.addEventListener("unhandledrejection",e=>sammyReportError(e.reason instanceof Error?e.reason:new Error(String(e.reason)),{source:"unhandledrejection"}))
}


function sammyCurrentBodyHeightCm(){
 try{return Number(measureCurrentRestShape()?.height)||0}catch{}
 if(geometry){geometry.computeBoundingBox();return geometry.boundingBox?(geometry.boundingBox.max.y-geometry.boundingBox.min.y)*100:0}
 return 0
}
function sammyCameraSnapshot(){
 const p=cam.position,r=cam.rotation,t=orbit.target,distance=p.distanceTo(t),bodyHeightCm=sammyCurrentBodyHeightCm();
 return {
  position:{x:p.x,y:p.y,z:p.z},
  rotationDeg:{x:THREE.MathUtils.radToDeg(r.x),y:THREE.MathUtils.radToDeg(r.y),z:THREE.MathUtils.radToDeg(r.z)},
  target:{x:t.x,y:t.y,z:t.z},distance,cameraZoom:cam.zoom,fov:cam.fov,
  bodyHeightCm,referenceHeightCm:sammyCameraReferenceHeightCm||bodyHeightCm
 }
}
function sammyFormatCameraSnapshot(){
 const s=sammyCameraSnapshot(),f=n=>Number(n).toFixed(4),d=n=>Number(n).toFixed(2);
 return `Position
x ${f(s.position.x)}
y ${f(s.position.y)}
z ${f(s.position.z)}

Rotation (°)
x ${d(s.rotationDeg.x)}
y ${d(s.rotationDeg.y)}
z ${d(s.rotationDeg.z)}

Orbit-Target
x ${f(s.target.x)}
y ${f(s.target.y)}
z ${f(s.target.z)}

Zoom/Abstand
Distanz ${f(s.distance)}
camera.zoom ${f(s.cameraZoom)}
FOV ${d(s.fov)}°

Körper
Höhe ${d(s.bodyHeightCm)} cm
Kamera-Referenz ${d(s.referenceHeightCm)} cm
Y-Skalierung ${f(s.referenceHeightCm? s.bodyHeightCm/s.referenceHeightCm : 1)}`
}
function sammyUpdateCameraDebug(){
 const panel=$("#sammyCameraDebugPanel"),out=$("#sammyCameraDebugReadout");
 if(!panel||panel.classList.contains("hidden")||!out)return;
 out.textContent=sammyFormatCameraSnapshot()
}
function sammyToggleCameraDebug(force){
 const panel=$("#sammyCameraDebugPanel");if(!panel)return;
 const show=force??panel.classList.contains("hidden");
 panel.classList.toggle("hidden",!show);
 sammyUpdateCameraDebug()
}
async function sammyCopyCameraDebug(){
 const text=sammyFormatCameraSnapshot();
 try{
  await navigator.clipboard.writeText(text);
  const b=$("#sammyCameraCopy"),old=b.textContent;b.textContent="Kopiert ✓";
  setTimeout(()=>b.textContent=old,900)
 }catch(e){sammyReportError(e,{source:"Kamerawerte kopieren"})}
}

const SAMMY_CAMERA_REFERENCE={
 greeting:{position:{x:-0.0261,y:2.3739,z:2.5719},target:{x:-0.0184,y:1.4007,z:0.0205},zoom:1,fov:32},
 edit:{position:{x:-0.0049,y:1.3074,z:1.7603},target:{x:-0.0049,y:1.2563,z:0.0526},zoom:1,fov:32},
 "anim-panel":{position:{x:0.9224,y:2.2272,z:3.4677},target:{x:0.0518,y:1.0473,z:0.1839},zoom:1,fov:32}
};
function sammyCameraHeightScale(){
 const h=sammyCurrentBodyHeightCm();
 if(!sammyCameraReferenceHeightCm&&h>0)sammyCameraReferenceHeightCm=h;
 return sammyCameraReferenceHeightCm>0&&h>0?h/sammyCameraReferenceHeightCm:1
}
function sammyCameraTargets(mode="edit"){
 if(mode==="measure"){
  const b=sammyMeasureBBox();if(!b)return sammyCameraTargets("edit");
  const vfov=THREE.MathUtils.degToRad(32),aspect=Math.max(.45,cam.aspect||innerWidth/innerHeight),hfov=2*Math.atan(Math.tan(vfov/2)*aspect);
  const distV=b.height/(2*Math.tan(vfov/2))*1.12,distH=b.width/(2*Math.tan(hfov/2))*1.12,dist=Math.max(distV,distH,b.height*1.55);
  // The bottom calibration sheet occupies a large part of the viewport. Looking lower on the body moves the complete T-pose upward into the free upper area.
  const targetY=b.minY+b.height*.34,target=new THREE.Vector3(b.cx,targetY,b.cz),pos=new THREE.Vector3(b.cx,targetY,b.cz+dist);
  return {target,pos,zoom:1,fov:32}
 }
 const ref=SAMMY_CAMERA_REFERENCE[mode]||SAMMY_CAMERA_REFERENCE.edit,sy=sammyCameraHeightScale();
 const target=new THREE.Vector3(ref.target.x,ref.target.y*sy,ref.target.z);
 const pos=new THREE.Vector3(ref.position.x,ref.position.y*sy,ref.position.z);
 return {target,pos,zoom:ref.zoom,fov:ref.fov}
}
function sammyCaptureCameraState(){
 return {position:cam.position.clone(),target:orbit.target.clone(),zoom:cam.zoom,fov:cam.fov}
}
function sammyCameraTweenToState(state,duration=850,instant=false){
 if(!state)return;
 if(instant){
  cam.position.copy(state.position);orbit.target.copy(state.target);cam.zoom=state.zoom??cam.zoom;cam.fov=state.fov??cam.fov;cam.updateProjectionMatrix();orbit.update();sammyCameraTween=null;return
 }
 sammyCameraTween={start:performance.now(),duration,p0:cam.position.clone(),p1:state.position.clone(),t0:orbit.target.clone(),t1:state.target.clone(),z0:cam.zoom,z1:state.zoom??cam.zoom,f0:cam.fov,f1:state.fov??cam.fov}
}
function sammyCameraTo(mode="edit",duration=850,instant=false){
 const t=sammyCameraTargets(mode);if(!t)return;
 sammyCameraTweenToState({position:t.pos,target:t.target,zoom:t.zoom,fov:t.fov},duration,instant)
}
function sammyUpdateCameraTween(now){
 const tw=sammyCameraTween;if(!tw)return;let t=Math.min(1,(now-tw.start)/tw.duration);t=t*t*(3-2*t);
 cam.position.lerpVectors(tw.p0,tw.p1,t);orbit.target.lerpVectors(tw.t0,tw.t1,t);
 cam.zoom=tw.z0+(tw.z1-tw.z0)*t;cam.fov=tw.f0+(tw.f1-tw.f0)*t;cam.updateProjectionMatrix();
 if(t>=1)sammyCameraTween=null
}
function sammyRestorePreAnimationCamera(duration=820){
 if(!sammyPreAnimationCamera)return;
 const state=sammyPreAnimationCamera;sammyPreAnimationCamera=null;sammyCameraTweenToState(state,duration,false)
}
function sammyBlendRelativePose(a,b,t,out){
 const J=poseJointCount,q0=new THREE.Quaternion(),q1=new THREE.Quaternion(),q=new THREE.Quaternion();
 for(let j=0;j<J;j++){const o=j*9;rowMat3ToQuat(a,o,q0);rowMat3ToQuat(b,o,q1);q.copy(q0).slerp(q1,t).normalize();quatToRowMat3(q,out,o)}
 return out
}

function sammyApplySoftSmile(){
 if(!annyMeta?.local_change_labels?.length)return [];
 const labels=annyMeta.local_change_labels;
 const norm=s=>String(s).trim().toLowerCase().replace(/[_-]+/g," ").replace(/\s+/g," ");
 let key=labels.find(x=>norm(x)==="mouth angles up");
 if(!key)key=labels.find(x=>/mouth\s+angles?\s+up/i.test(norm(x)));
 if(!key){
  console.warn('Sammy: Anny-Modifier "mouth angles up" wurde nicht gefunden; Gesicht bleibt neutral.');
  return []
 }
 if(key in annyLocalValues)annyLocalValues[key]=0.8;
 applyAnnyParams();
 console.info(`Sammy soft smile: "${key}" = 0.8`);
 return [key]
}

async function sammyLoadGreeting(){
 const res=await fetch("./standing-greeting.fbx?v=0.7.1",{cache:"force-cache"});
 if(!res.ok)throw new Error(`Standing Greeting konnte nicht geladen werden: HTTP ${res.status}`);
 const conv=await convertMixamoFbxMotion(await res.arrayBuffer(),"Standing Greeting.fbx");
 sammyIntroRel=conv.data;sammyIntroFrames=conv.frames;sammyIntroFps=conv.fps||30;
 if(!sammyIntroFrames)throw new Error("Standing Greeting enthält keine Frames.");
 sammyEditPoseRel=new Float32Array(sammyIntroRel.subarray(0,poseJointCount*9));
 return true
}
function sammyStartGreeting(){
 if(!sammyIntroRel||!sammyIntroFrames)return sammyFinishIntro();
 stopPoseAnimation(false);
 // Apply frame 0 BEFORE revealing the scene, so the user never sees the old
 // oversized pre-greeting camera/body state.
 const first=sammyIntroRel.subarray(0,poseJointCount*9);
 applyAnnyAxis16RetargetPose(currentDisplayRest(),first,false,false,"Sammy Begrüßung · Frame 0");
 sammyCameraTo("greeting",0,true);
 sammyIntroEditCameraStarted=false;
 sammyIntroActive=true;sammyIntroPhase="clip";sammyIntroStart=performance.now();
 requestAnimationFrame(()=>requestAnimationFrame(()=>{sammyHideSplash();document.body.classList.add("sammy-ready")}))
}
function sammyUpdateIntro(now){
 if(!sammyIntroActive||!sammyIntroRel)return;
 if(sammyIntroPhase==="clip"){
  const raw=(now-sammyIntroStart)/1000*sammyIntroFps,f0=Math.min(sammyIntroFrames-1,Math.floor(raw)),f1=Math.min(sammyIntroFrames-1,f0+1),t=Math.min(1,raw-f0);
  const a=sammyIntroRel.subarray(f0*poseJointCount*9,(f0+1)*poseJointCount*9),b=sammyIntroRel.subarray(f1*poseJointCount*9,(f1+1)*poseJointCount*9);
  const blended=new Float32Array(poseJointCount*9);sammyBlendRelativePose(a,b,t,blended);applyAnnyAxis16RetargetPose(currentDisplayRest(),blended,false,false,"Sammy Begrüßung");
  const remainingClipSeconds=Math.max(0,(sammyIntroFrames-1-raw)/Math.max(1,sammyIntroFps));
  if(!sammyIntroEditCameraStarted&&remainingClipSeconds<=SAMMY_INTRO_EDIT_CAMERA_LEAD_SECONDS){sammyIntroEditCameraStarted=true;sammyCameraTo("edit",900,false)}
  if(raw>=sammyIntroFrames-1){sammyIntroPhase="blend";sammyIntroBlendStart=now;sammyIntroBlendFrom=new Float32Array(blended)}
 }else if(sammyIntroPhase==="blend"){
  let t=Math.min(1,(now-sammyIntroBlendStart)/700);t=t*t*(3-2*t);
  const blended=new Float32Array(poseJointCount*9);sammyBlendRelativePose(sammyIntroBlendFrom,sammyEditPoseRel,t,blended);applyAnnyAxis16RetargetPose(currentDisplayRest(),blended,false,false,"Sammy → Bearbeitungsposition");
  if(t>=1)sammyFinishIntro()
 }
}
function sammyFinishIntro(){
 sammyIntroActive=false;sammyIntroPhase="done";
 if(sammyEditPoseRel)applyAnnyAxis16RetargetPose(currentDisplayRest(),sammyEditPoseRel,false,false,"Sammy Bearbeitungsposition");
 if(!sammyIntroEditCameraStarted){sammyIntroEditCameraStarted=true;sammyCameraTo("edit",900,false)}
 const input=$("#sammyAnimFile");if(input)input.disabled=false;
 document.body.classList.add("sammy-ready");
 bootStatus("SAMMY BEREIT","Begrüßung abgeschlossen.","ok");
 sammySyncAnimationUi()
}
function sammyHideSplash(){$("#sammySplash")?.classList.add("gone")}
async function sammyPrepareIntro(){
 try{
  await sammyLoadGreeting();
  const s=$("#sammySplashStage");if(s)s.textContent="Sammy ist bereit.";
  sammyStartGreeting()
 }catch(e){sammyReportError(e,{source:"Start-Begrüßung"});sammyHideSplash();sammyFinishIntro()}
}

async function sammyOnRuntimeReady(){
 sammyMountShapeControls();sammySyncAnimationUi();
 const input=$("#sammyAnimFile");if(input)input.disabled=true;
 if(!sammyCameraReferenceHeightCm)sammyCameraReferenceHeightCm=sammyCurrentBodyHeightCm();
 sammyApplySoftSmile();
 await sammyPrepareIntro()
}
function sammyInitUi(){
 if(sammyUiReady)return;sammyUiReady=true;
 sammyInstallErrorCapture();
 sammyMountShapeControls();sammyRenderAnimationLibrary();

 const w=innerWidth,h=innerHeight;
 sammyInstallBubbleDrag($("#sammyAnimBubble"),w-66,Math.max(90,h*.26));
 sammyInstallBubbleDrag($("#sammyShapeBubble"),w-66,Math.max(160,h*.39));
 sammyInstallBubbleDrag($("#sammyMeasureBubble"),w-66,Math.max(230,h*.52));
 sammyInstallBubbleDrag($("#sammyAnsBubble"),w-66,Math.max(300,h*.65));
 // error bubble starts hidden but still receives a persisted/default position
 sammyInstallBubbleDrag($("#sammyErrorBubble"),8,Math.max(220,h*.62));
 document.querySelectorAll(".sammyPanel").forEach(sammyInstallPanelResize);
 document.querySelectorAll(".sammyPanelClose").forEach(b=>b.onclick=sammyClosePanels);
 sammyAnsInitUI();

 $("#sammyAnimFile").disabled=true;
 $("#sammyAnimFile").onchange=e=>{if(e.target.files?.length)sammyImportAnimationFiles(e.target.files)};
 $("#sammyMiniPlayPause").onclick=()=>sammyTogglePlayback();
 $("#sammyPrevAnim").onclick=()=>sammyStepAnimation(-1);
 $("#sammyNextAnim").onclick=()=>sammyStepAnimation(1);
 $("#sammySkeleton").onclick=()=>sammyToggleSkeleton();
 $("#sammyMeasureShowSelected").onclick=()=>sammyMeasureSetOverlayMode("selected");
 $("#sammyMeasureShowAll").onclick=()=>sammyMeasureSetOverlayMode("all");
 $("#sammyMeasureShowNone").onclick=()=>sammyMeasureSetOverlayMode("none");
 const measureLandmarksBtn=$("#sammyMeasureLandmarks");if(measureLandmarksBtn)measureLandmarksBtn.onclick=()=>sammyMeasureSetLandmarks();
 const measureLabelsBtn=$("#sammyMeasureLabels");if(measureLabelsBtn)measureLabelsBtn.onclick=()=>sammyMeasureSetLabels();
 sammyInstallMeasurePicking();
 sammyCalInitUI();
 sammySolverInitUI();
 sammyDimensionsInitUI();
 const measureRandomBtn=$("#sammyMeasureRandom");if(measureRandomBtn)measureRandomBtn.onclick=()=>sammyMeasureRandomize(false);
 const measureRandomExtremeBtn=$("#sammyMeasureRandomExtreme");if(measureRandomExtremeBtn)measureRandomExtremeBtn.onclick=()=>sammyMeasureRandomize(true);
 $("#sammyMeasureExport").onclick=sammyMeasureExport;
 $("#sammyMeasureUnisex").onclick=sammyMeasureUseUnisex;
 let frameRaf=0;
 const frameHandler=e=>{
  const f=Number(e.target.value)||0;
  $("#sammyFrameRange").value=String(f);$("#sammyFrameNumber").value=String(f);
  clearTimeout(frameRaf);frameRaf=setTimeout(()=>sammyApplyUserFrame(f),20)
 };
 $("#sammyFrameRange").oninput=frameHandler;$("#sammyFrameNumber").onchange=frameHandler;
 $("#sammyShapeSearch").oninput=e=>sammyFilterShapeControls(e.target.value);
 $("#sammyResetShape").onclick=()=>{resetAnnyPreset(annyParams.gender>=.5?1:0);$("#sammyShapeSearch").value="";sammyFilterShapeControls("")};

 $("#sammyCameraDebugBtn").onclick=()=>sammyToggleCameraDebug();
 $("#sammyCameraDebugClose").onclick=()=>sammyToggleCameraDebug(false);
 $("#sammyCameraCopy").onclick=sammyCopyCameraDebug;
 $("#sammyCopyDiagnostics").onclick=sammyCopyDiagnostics;
 $("#sammyExportDiagnostics").onclick=sammyDownloadDiagnostics;
 $("#sammyClearErrors").onclick=()=>{
  sammyErrors=[];$("#sammyErrorCount").textContent="0";$("#sammyErrorList").innerHTML="";
  $("#sammyErrorSummary").textContent="Fehlerliste geleert.";$("#sammyErrorBubble").classList.add("hidden");sammyClosePanels()
 };
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
$("#animFile").onchange=async e=>{const f=e.target.files?.[0];if(f){await loadUserAnimationFile(f);sammySyncAnimationUi()}};
$("#animUser").onclick=()=>startPoseAnimation("user");
$("#animImportFps").onchange=e=>{userAnimFps=Math.max(1,Math.min(120,Number(e.target.value)||30));e.target.value=String(userAnimFps)};
$("#retryStartup").onclick=autoStartRuntime;
$("#oracleStart").onclick=startRigOracleComparison;
$("#oracleExportProbe").onclick=exportRigOracleProbe;
$("#oracleResultFile").onchange=e=>loadRigOracleResult(e.target.files?.[0]);
$("#oracleLoadRepoPair").onclick=loadOraclePairFromRepo;
$("#testAxisReferenceFix").onclick=testAxisReferenceFixFromRepo;
$("#oracleToggleOfficialMesh").onclick=toggleOracleOfficialMesh;
$("#oracleExit").onclick=exitRigOracleComparison;
$("#oracleOpacity").oninput=e=>{if(oracleModeActive)oracleSetBodyOpacity(Number(e.target.value));else if($("#oracleOpacityOut"))$("#oracleOpacityOut").textContent=`${Math.round(Number(e.target.value)*100)} %`};
$("#activateMorphSammy").onclick=activateMorphableSammyTarget;
$("#applyMorphSammyFrame").onclick=applyCurrentFrameToMorphSammy;
$("#refreshMorphAudit").onclick=()=>{annyExactRigCache=null;annyRigParity=validateAnnyExactRigParity();if(annyLastCoeffs)reconstructExactAnnyRestRig(annyLastCoeffs);updateMorphSammyInfo()};
$("#toggleMixamoCompare").onclick=()=>{morphSammyTargetActive=false;$("#activateMorphSammy")?.classList.remove("activeAnim");setMixamoCompareVisible(!mixamoCompareVisible)};
$("#exportMixamoCompare").onclick=exportMixamoComparisonFrame;
$("#animCompareFrame").onchange=async()=>{
 if(!userAnimLoaded)return;
 const f=Math.max(0,Math.min(userAnimFrames-1,Math.round(Number($("#animCompareFrame").value)||0)));userAnimCurrentFrame=f;$("#animCompareFrame").value=String(f);
 const off=f*poseJointCount*9,rel=userAnimRel.subarray(off,off+poseJointCount*9);applyRelativePoseMatrices(currentDisplayRest(),rel,true,false,"Import-Vergleichsframe");
 if(mixamoCompareVisible){const b=await ensureMixamoCompareBridge();applyRelativeToExactAxis16Bridge(b,rel)}
};
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
   info("#decisionInfo",`✓ v0.7.1: Anny ersetzt nur die Identity-/Rest-Shape-Quelle. Das gerenderte Low-LOD bleibt kanonische SOMA-Topologie und läuft danach durch denselben bereits getesteten shape-adaptiven 122-Joint-LBS-Pfad.

Aktuell im Browser steuerbar: ALLE nativen Anny-Phänotypen (Gender, Age, Height, Weight, Muscle, Proportions, Cupsize, Firmness sowie die drei Legacy-Phenotype-Anteile) plus sämtliche lokalen Anny-Changes aus dem offiziellen Asset. Male/Female bleiben als schnelle Presets; der native Gender-Blend ist im Advanced-Bereich ebenfalls sichtbar.

Der entscheidende Test ist jetzt visuell: einzelne Parameter und lokale Changes isoliert bewegen, Low↔Mid vergleichen und anschließend dieselben Posen/Animationen benutzen. Mid nutzt echte 18.056 SOMA-Vertices plus die v0.7.1 18k×122-Skinweights. Wenn Shape + Rebind + Pose stabil bleiben, ist die Architektur Anny-Identity → SOMA-Rig bestätigt.

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

// Sammy v0.7.1: production shell + automatic runtime.
sammyInitUi();
setTimeout(()=>autoStartRuntime(),0);
