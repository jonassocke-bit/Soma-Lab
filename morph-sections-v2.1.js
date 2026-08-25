// Sammy v0.8.24.14 · Profile Section v2.1 geometry engine + Atlas Section Overlay API.
// Pure geometry: no DOM/THREE/solver side effects until MORF explicitly loads this file.
(function(global){
"use strict";

function percentile(values,t){
 if(!values.length)return NaN;
 const a=values.slice().sort((x,y)=>x-y),u=(a.length-1)*t,i=Math.floor(u),f=u-i;
 return a[i]*(1-f)+a[Math.min(a.length-1,i+1)]*f
}
function hull2D(points){
 if(points.length<3)return points.slice();
 const p=points.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]),cross=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]),lo=[],hi=[];
 for(const q of p){while(lo.length>=2&&cross(lo[lo.length-2],lo[lo.length-1],q)<=0)lo.pop();lo.push(q)}
 for(let i=p.length-1;i>=0;i--){const q=p[i];while(hi.length>=2&&cross(hi[hi.length-2],hi[hi.length-1],q)<=0)hi.pop();hi.push(q)}
 lo.pop();hi.pop();return lo.concat(hi)
}
function bbox(rest){
 if(!rest?.length)return null;let minX=Infinity,minY=Infinity,minZ=Infinity,maxX=-Infinity,maxY=-Infinity,maxZ=-Infinity;
 for(let i=0;i<rest.length;i+=3){const x=rest[i],y=rest[i+1],z=rest[i+2];if(!Number.isFinite(x+y+z))continue;minX=Math.min(minX,x);minY=Math.min(minY,y);minZ=Math.min(minZ,z);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);maxZ=Math.max(maxZ,z)}
 return Number.isFinite(minX)?{min:[minX,minY,minZ],max:[maxX,maxY,maxZ]}:null
}
function sectionSide({rest,triangles,regionMap,segment,side,q,centerX}){
 const isArm=segment==="upperarm"||segment==="lowerarm",isLeg=segment==="upperleg"||segment==="lowerleg";
 const sign=side==="left"?-1:1,allowed=[];
 for(let i=0;i<rest.length/3;i++){
  if(regionMap[i]!==segment)continue;
  const x=rest[i*3];
  if((x-centerX)*sign<-.002)continue;
  allowed.push(i)
 }
 if(allowed.length<12)return {valid:false,reason:"insufficient-region-vertices",segment,side,q,count:allowed.length};
 let planeCoord,axisSpan,planeD,project;
 if(isArm){
  const radial=allowed.map(i=>Math.abs(rest[i*3]-centerX)),lo=percentile(radial,.04),hi=percentile(radial,.96);axisSpan=hi-lo;
  if(!(axisSpan>.015))return {valid:false,reason:"degenerate-region-axis",segment,side,q,count:allowed.length};
  planeCoord=centerX+sign*(lo+axisSpan*q);planeD=p=>p[0]-planeCoord;project=p=>[p[1],p[2]]
 }else if(isLeg){
  const ys=allowed.map(i=>rest[i*3+1]),distal=percentile(ys,.04),proximal=percentile(ys,.96);axisSpan=proximal-distal;
  if(!(axisSpan>.02))return {valid:false,reason:"degenerate-region-axis",segment,side,q,count:allowed.length};
  planeCoord=proximal-axisSpan*q;planeD=p=>p[1]-planeCoord;project=p=>[p[0],p[2]]
 }else return {valid:false,reason:"unsupported-segment",segment,side,q,count:allowed.length};

 const allowedSet=new Set(allowed),pts=[],keys=new Set(),eps=1e-8;let triangleHits=0,candidateTriangles=0;
 const add=p=>{const z=project(p),key=`${Math.round(z[0]*1e5)}:${Math.round(z[1]*1e5)}`;if(!keys.has(key)){keys.add(key);pts.push(z)}};
 for(let ti=0;ti+2<triangles.length;ti+=3){
  const ids=[Number(triangles[ti]),Number(triangles[ti+1]),Number(triangles[ti+2])];
  if(ids.some(i=>i<0||i*3+2>=rest.length)||ids.filter(i=>allowedSet.has(i)).length<2)continue;
  candidateTriangles++;
  const P=ids.map(i=>[rest[i*3],rest[i*3+1],rest[i*3+2]]),D=P.map(planeD);
  if(Math.min(...D)>eps||Math.max(...D)<-eps)continue;
  const local=[],lk=new Set(),ladd=p=>{const k=`${Math.round(p[0]*1e6)}:${Math.round(p[1]*1e6)}:${Math.round(p[2]*1e6)}`;if(!lk.has(k)){lk.add(k);local.push(p)}};
  for(const [a,b] of [[0,1],[1,2],[2,0]]){
   if(!allowedSet.has(ids[a])||!allowedSet.has(ids[b]))continue;
   const da=D[a],db=D[b],pa=P[a],pb=P[b];
   if(Math.abs(da)<=eps)ladd(pa);
   if(da*db<-(eps*eps)){const t=da/(da-db);ladd([pa[0]+(pb[0]-pa[0])*t,pa[1]+(pb[1]-pa[1])*t,pa[2]+(pb[2]-pa[2])*t])}
  }
  if(local.length>=2){triangleHits++;for(const p of local)add(p)}
 }
 let method="region-triangle-plane",slabCm=null;
 if(pts.length<6){
  method="region-adaptive-slab";
  for(const frac of [.015,.025,.04,.065,.09]){
   pts.length=0;keys.clear();const slab=Math.max(.002,axisSpan*frac);
   for(const i of allowed){const p=[rest[i*3],rest[i*3+1],rest[i*3+2]];if(Math.abs(planeD(p))<=slab)add(p)}
   if(pts.length>=8){slabCm=Number((slab*100).toFixed(3));break}
  }
 }
 if(pts.length<6)return {valid:false,reason:"insufficient-cross-section",method,segment,side,q,count:pts.length,regionVertices:allowed.length,triangleHits,candidateTriangles,axisSpanCm:Number((axisSpan*100).toFixed(3)),planeCoord:Number(planeCoord.toFixed(6))};
 const hull=hull2D(pts);if(hull.length<3)return {valid:false,reason:"degenerate-hull",method,segment,side,q,count:pts.length,regionVertices:allowed.length};
 let minA=Infinity,maxA=-Infinity,minB=Infinity,maxB=-Infinity,per=0;
 for(const z of hull){minA=Math.min(minA,z[0]);maxA=Math.max(maxA,z[0]);minB=Math.min(minB,z[1]);maxB=Math.max(maxB,z[1])}
 for(let i=0;i<hull.length;i++){const b=hull[(i+1)%hull.length];per+=Math.hypot(b[0]-hull[i][0],b[1]-hull[i][1])}
 return {valid:true,method,segment,side,q,count:pts.length,hullPoints:hull.length,regionVertices:allowed.length,triangleHits,candidateTriangles,axisSpanCm:Number((axisSpan*100).toFixed(3)),planeCoord:Number(planeCoord.toFixed(6)),slabCm,aCm:Number(((maxA-minA)*100).toFixed(3)),bCm:Number(((maxB-minB)*100).toFixed(3)),perimeterCm:Number((per*100).toFixed(3)),worldHull:hull.map(z=>isArm?[planeCoord,z[0],z[1]]:[z[0],planeCoord,z[1]])}
}

function computeLimbProfiles(input){
 const rest=input.rest,triangles=input.triangles,regionMap=input.regionMap;
 const b=bbox(rest),out={};if(!b||!triangles?.length||!regionMap?.length){for(const seg of ["upperarm","lowerarm","upperleg","lowerleg"])out[seg]={"0.25":null,"0.5":null,"0.75":null,_debug:{engine:{reason:"missing-input"}}};return out}
 const centerX=(b.min[0]+b.max[0])*.5;
 for(const segment of ["upperarm","lowerarm","upperleg","lowerleg"]){
  out[segment]={};const debug={};
  for(const q of [.25,.5,.75]){
   const raw=["left","right"].map(side=>sectionSide({rest,triangles,regionMap,segment,side,q,centerX})),good=raw.filter(x=>x.valid&&Number.isFinite(x.perimeterCm));
   if(!good.length){out[segment][String(q)]=null;debug[String(q)]=raw.map(x=>({side:x.side,reason:x.reason,method:x.method||null,count:x.count||0,regionVertices:x.regionVertices||0,triangleHits:x.triangleHits||0,candidateTriangles:x.candidateTriangles||0,axisSpanCm:x.axisSpanCm??null}));continue}
   out[segment][String(q)]={count:good.reduce((n,x)=>n+x.count,0),sideCount:good.length,method:[...new Set(good.map(x=>x.method))].join("+"),triangleHits:good.reduce((n,x)=>n+(x.triangleHits||0),0),aCm:Number((good.reduce((n,x)=>n+x.aCm,0)/good.length).toFixed(3)),bCm:Number((good.reduce((n,x)=>n+x.bCm,0)/good.length).toFixed(3)),perimeterCm:Number((good.reduce((n,x)=>n+x.perimeterCm,0)/good.length).toFixed(3)),axisSpanCm:Number((good.reduce((n,x)=>n+x.axisSpanCm,0)/good.length).toFixed(3))}
  }
  if(Object.keys(debug).length)out[segment]._debug=debug
 }
 return out
}

function computeSectionGeometry(input){
 const rest=input.rest,triangles=input.triangles,regionMap=input.regionMap,segments=Array.isArray(input.segments)&&input.segments.length?input.segments:["upperarm","lowerarm","upperleg","lowerleg"];
 const b=bbox(rest),out=[];if(!b||!triangles?.length||!regionMap?.length)return out;
 const centerX=(b.min[0]+b.max[0])*.5;
 for(const segment of segments){
  if(!["upperarm","lowerarm","upperleg","lowerleg"].includes(segment))continue;
  for(const q of [.25,.5,.75])for(const side of ["left","right"]){
   const g=sectionSide({rest,triangles,regionMap,segment,side,q,centerX});
   if(!g.valid||!Array.isArray(g.worldHull)||g.worldHull.length<3)continue;
   out.push({segment,side,q,method:g.method,aCm:g.aCm,bCm:g.bCm,perimeterCm:g.perimeterCm,points:g.worldHull});
  }
 }
 return out
}

global.SammyMorphSectionsV21={computeLimbProfiles:computeLimbProfiles,computeSectionGeometry:computeSectionGeometry,version:"2.2-atlas"};
})(window);
