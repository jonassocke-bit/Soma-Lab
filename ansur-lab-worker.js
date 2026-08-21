/* Sammy v0.8.14 · ANSUR LAB worker
   A: train+validation research sweep.
   B: first access to physically separate blind test partition.
   C: post-blind model-depth / consumer-set / noise / uncertainty diagnostics.
   DPREP: prepare paired ANSUR persons + predictions for real R5 mesh validation.
   Heavy statistics stay off the Three.js/UI thread. */
"use strict";
const TRAINVAL_URL="./ansur-prediction-trainval-v1.json?v=0.8.14";
const TEST_URL="./ansur-prediction-test-v1.json?v=0.8.14";
let DATA=null,COL=null,ROWS=null,IDX=null,TEST_LOADED=false,STATS=new Map();
const LAMBDAS=[0,0.05,0.2,0.8,2.5,8];
const QUAD_LAMBDAS=[0.1,1,10,50];
const BEAM_WIDTH=6;
const CONSUMER_SETS={
 "5":["stature","weightkg","chest_circumference","waist_circumference","buttock_circumference"],
 "6":["stature","weightkg","chest_circumference","waist_circumference","buttock_circumference","biacromial_breadth"],
 "7":["stature","weightkg","chest_circumference","waist_circumference","buttock_circumference","biacromial_breadth","crotch_height"]
};
function postProgress(run,progress,text,extra={}){postMessage({type:"progress",run,progress,text,...extra})}
function percentile(sorted,q){if(!sorted.length)return 0;const p=(sorted.length-1)*q,i=Math.floor(p),f=p-i;return sorted[i]+(sorted[Math.min(sorted.length-1,i+1)]-sorted[i])*f}
function keySet(a){return [...a].sort().join("|")}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function rndFactory(seed=1){let x=seed>>>0;return ()=>{x=(x+0x6D2B79F5)>>>0;let t=x;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296}}
function normal(rng){let u=0,v=0;while(u<=1e-12)u=rng();while(v<=1e-12)v=rng();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)}
async function ensureData(run,includeTest=false){
 if(!DATA){
  postProgress(run,.015,"ANSUR Train+Validation wird geladen …");const r=await fetch(TRAINVAL_URL,{cache:"force-cache"});if(!r.ok)throw new Error(`ANSUR Train+Validation HTTP ${r.status}`);DATA=await r.json();if(DATA?.schema!=="sammy-ansur-prediction-dataset-v1"||DATA?.partition!=="trainval"||!Array.isArray(DATA.rows))throw new Error("ANSUR Train+Validation Dataset ungültig");ROWS=DATA.rows.slice();COL=Object.fromEntries(DATA.columns.map((c,i)=>[c,i]));IDX={};for(const split of [0,1,2])for(const sex of [0,1])IDX[`${split}:${sex}`]=[];for(let i=0;i<ROWS.length;i++){const r0=ROWS[i],sp=r0[COL.split],sx=r0[COL.sex];IDX[`${sp}:${sx}`]?.push(i)}postProgress(run,.03,`${ROWS.length.toLocaleString("de-DE")} Train+Validation-Personen bereit · Blind Test noch nicht geladen.`)
 }
 if(includeTest&&!TEST_LOADED){
  postProgress(run,.045,"Blind-Testpartition wird geladen …");const r=await fetch(TEST_URL,{cache:"force-cache"});if(!r.ok)throw new Error(`ANSUR Blind Test HTTP ${r.status}`);const d=await r.json();if(d?.schema!==DATA.schema||d?.partition!=="test"||!Array.isArray(d.rows))throw new Error("ANSUR Blind-Test-Dataset ungültig");const base=ROWS.length;ROWS.push(...d.rows);for(let i=base;i<ROWS.length;i++){const r0=ROWS[i],sp=r0[COL.split],sx=r0[COL.sex];if(sp!==2)throw new Error("Blind-Testpartition enthält Nicht-Test-Zeilen");IDX[`${sp}:${sx}`].push(i)}TEST_LOADED=true;postProgress(run,.06,`${d.rows.length.toLocaleString("de-DE")} Testpersonen geladen.`)
 }
 return DATA
}
function targetMeta(id){return DATA.targets.find(t=>t.sammyId===id)}
function targetIds(primaryOnly=false){return DATA.targets.filter(t=>!primaryOnly||t.quality!=="proxy").map(t=>t.sammyId)}
function outputIds(inputs){const known=new Set(inputs);return DATA.targets.map(t=>t.sammyId).filter(id=>!known.has(id))}
function rowFeature(row,id){return row[COL[id]]}
function indicesFor(splits,sex){const out=[];for(const sp of splits)out.push(...IDX[`${sp}:${sex}`]);return out}
function invert(A){
 const n=A.length,M=Array.from({length:n},(_,i)=>{const r=new Float64Array(n*2);for(let j=0;j<n;j++)r[j]=A[i][j];r[n+i]=1;return r});
 for(let c=0;c<n;c++){let p=c,b=Math.abs(M[c][c]);for(let r=c+1;r<n;r++){const v=Math.abs(M[r][c]);if(v>b){b=v;p=r}}if(b<1e-11)throw new Error("Ridge-Matrix singulär");if(p!==c){const t=M[c];M[c]=M[p];M[p]=t}const d=M[c][c];for(let j=0;j<n*2;j++)M[c][j]/=d;for(let r=0;r<n;r++){if(r===c)continue;const f=M[r][c];if(Math.abs(f)<1e-15)continue;for(let j=0;j<n*2;j++)M[r][j]-=f*M[c][j]}}
 return Array.from({length:n},(_,i)=>Float64Array.from(M[i].slice(n)))
}
function statsKey(trainSplits,sex){return `${[...trainSplits].sort().join("")}:${sex}`}
function buildStats(trainSplits,sex){
 const key=statsKey(trainSplits,sex);if(STATS.has(key))return STATS.get(key);const idx=indicesFor(trainSplits,sex),featAll=["age",...DATA.candidateInputs.map(x=>x.id)],targetAll=DATA.targets.map(t=>t.sammyId),q=featAll.length,m=targetAll.length,n=idx.length,muX=new Float64Array(q),sdX=new Float64Array(q),muY=new Float64Array(m),sdY=new Float64Array(m);
 for(const ix of idx){const r=ROWS[ix];for(let j=0;j<q;j++)muX[j]+=rowFeature(r,featAll[j]);for(let k=0;k<m;k++)muY[k]+=rowFeature(r,targetAll[k])}for(let j=0;j<q;j++)muX[j]/=n;for(let k=0;k<m;k++)muY[k]/=n;
 for(const ix of idx){const r=ROWS[ix];for(let j=0;j<q;j++){const d=rowFeature(r,featAll[j])-muX[j];sdX[j]+=d*d}for(let k=0;k<m;k++){const d=rowFeature(r,targetAll[k])-muY[k];sdY[k]+=d*d}}for(let j=0;j<q;j++){sdX[j]=Math.sqrt(sdX[j]/Math.max(1,n-1));if(sdX[j]<1e-9)sdX[j]=1}for(let k=0;k<m;k++){sdY[k]=Math.sqrt(sdY[k]/Math.max(1,n-1));if(sdY[k]<1e-9)sdY[k]=1}
 const xx=Array.from({length:q},()=>new Float64Array(q)),xy=Array.from({length:q},()=>new Float64Array(m)),x=new Float64Array(q);
 for(const ix of idx){const r=ROWS[ix];for(let j=0;j<q;j++)x[j]=(rowFeature(r,featAll[j])-muX[j])/sdX[j];for(let a=0;a<q;a++){const xa=x[a];for(let b=0;b<q;b++)xx[a][b]+=xa*x[b];for(let k=0;k<m;k++)xy[a][k]+=xa*rowFeature(r,targetAll[k])}}
 const st={idx,featAll,targetAll,featIndex:Object.fromEntries(featAll.map((x,i)=>[x,i])),targetIndex:Object.fromEntries(targetAll.map((x,i)=>[x,i])),n,muX,sdX,muY,sdY,xx,xy};STATS.set(key,st);return st
}
function fitSexModel(trainSplits,sex,inputs,outputs,lambda){
 const st=buildStats(trainSplits,sex),feat=["age",...inputs],p=1+feat.length,m=outputs.length,xtx=Array.from({length:p},()=>new Float64Array(p)),xty=Array.from({length:p},()=>new Float64Array(m));xtx[0][0]=st.n;
 const mu=new Float64Array(feat.length),sd=new Float64Array(feat.length),yMu=new Float64Array(m),ySd=new Float64Array(m);
 for(let j=0;j<feat.length;j++){const fj=st.featIndex[feat[j]];mu[j]=st.muX[fj];sd[j]=st.sdX[fj]}
 for(let k=0;k<m;k++){const tk=st.targetIndex[outputs[k]];yMu[k]=st.muY[tk];ySd[k]=st.sdY[tk];xty[0][k]=st.n*st.muY[tk]}
 for(let a=0;a<feat.length;a++){const fa=st.featIndex[feat[a]];for(let b=0;b<feat.length;b++){const fb=st.featIndex[feat[b]];xtx[a+1][b+1]=st.xx[fa][fb]}for(let k=0;k<m;k++){const tk=st.targetIndex[outputs[k]];xty[a+1][k]=st.xy[fa][tk]}}
 for(let j=1;j<p;j++)xtx[j][j]+=lambda;xtx[0][0]+=1e-10;const inv=invert(xtx),coef=Array.from({length:p},()=>new Float64Array(m));for(let a=0;a<p;a++)for(let k=0;k<m;k++){let z=0;for(let b=0;b<p;b++)z+=inv[a][b]*xty[b][k];coef[a][k]=z}return {kind:"linear",feat,outputs,mu,sd,yMu,ySd,coef}
}
function quadDesign(z){const q=z.length,p=1+q+q+q*(q-1)/2,d=new Float64Array(p);let o=0;d[o++]=1;for(let i=0;i<q;i++)d[o++]=z[i];for(let i=0;i<q;i++)d[o++]=z[i]*z[i];for(let i=0;i<q;i++)for(let j=i+1;j<q;j++)d[o++]=z[i]*z[j];return d}
function fitSexModelQuadratic(trainSplits,sex,inputs,outputs,lambda){
 const st=buildStats(trainSplits,sex),idx=indicesFor(trainSplits,sex),feat=["age",...inputs],q=feat.length,p=1+q+q+q*(q-1)/2,m=outputs.length,mu=new Float64Array(q),sd=new Float64Array(q),yMu=new Float64Array(m),ySd=new Float64Array(m);
 for(let j=0;j<q;j++){const f=st.featIndex[feat[j]];mu[j]=st.muX[f];sd[j]=st.sdX[f]}for(let k=0;k<m;k++){const t=st.targetIndex[outputs[k]];yMu[k]=st.muY[t];ySd[k]=st.sdY[t]}
 const xtx=Array.from({length:p},()=>new Float64Array(p)),xty=Array.from({length:p},()=>new Float64Array(m)),z=new Float64Array(q);
 for(const ix of idx){const row=ROWS[ix];for(let j=0;j<q;j++)z[j]=(rowFeature(row,feat[j])-mu[j])/sd[j];const d=quadDesign(z);for(let a=0;a<p;a++){const da=d[a];for(let b=0;b<=a;b++){const v=da*d[b];xtx[a][b]+=v;if(a!==b)xtx[b][a]+=v}for(let k=0;k<m;k++)xty[a][k]+=da*rowFeature(row,outputs[k])}}
 for(let j=1;j<p;j++)xtx[j][j]+=lambda;xtx[0][0]+=1e-10;const inv=invert(xtx),coef=Array.from({length:p},()=>new Float64Array(m));for(let a=0;a<p;a++)for(let k=0;k<m;k++){let s=0;for(let b=0;b<p;b++)s+=inv[a][b]*xty[b][k];coef[a][k]=s}return {kind:"quadratic",feat,outputs,mu,sd,yMu,ySd,coef}
}
function featureValue(row,id,overrides){return overrides&&Object.prototype.hasOwnProperty.call(overrides,id)?overrides[id]:rowFeature(row,id)}
function predictRow(model,row,out,overrides=null){
 const m=model.outputs.length;if(model.kind==="quadratic"){const z=new Float64Array(model.feat.length);for(let j=0;j<z.length;j++)z[j]=(featureValue(row,model.feat[j],overrides)-model.mu[j])/model.sd[j];const d=quadDesign(z);for(let k=0;k<m;k++){let s=0;for(let a=0;a<d.length;a++)s+=d[a]*model.coef[a][k];out[k]=s}return out}
 const p=model.coef.length;for(let k=0;k<m;k++)out[k]=model.coef[0][k];for(let a=1;a<p;a++){const z=(featureValue(row,model.feat[a-1],overrides)-model.mu[a-1])/model.sd[a-1];for(let k=0;k<m;k++)out[k]+=z*model.coef[a][k]}return out
}
function fitPair(trainSplits,inputs,outputs,kind,lambda){const models={};for(const sex of [0,1])models[sex]=kind==="quadratic"?fitSexModelQuadratic(trainSplits,sex,inputs,outputs,lambda):fitSexModel(trainSplits,sex,inputs,outputs,lambda);return models}
function evalModels(models,evalBySex,inputs,includeCases=false){
 const outputs=models[0].outputs,m=outputs.length;let weightedNormSq=0,weightedCmSq=0,weightedN=0,rawSq=0,rawN=0;const per=Object.fromEntries(outputs.map(id=>[id,{sq:0,abs:0,bias:0,n:0,absVals:[]}]));const bySex={male:{sq:0,n:0},female:{sq:0,n:0}},cases=[];
 for(const sex of [0,1]){const model=models[sex],pred=new Float64Array(m),idx=evalBySex[sex],sx=sex===0?"male":"female";for(const ix of idx){const row=ROWS[ix];predictRow(model,row,pred);let bodySq=0,bodyN=0;for(let k=0;k<m;k++){const id=outputs[k],meta=targetMeta(id),w=Number(meta?.evaluationWeight||1),e=pred[k]-rowFeature(row,id),ae=Math.abs(e),z=e/model.ySd[k];weightedNormSq+=w*z*z;weightedCmSq+=w*e*e;weightedN+=w;rawSq+=e*e;rawN++;bodySq+=e*e;bodyN++;const q=per[id];q.sq+=e*e;q.abs+=ae;q.bias+=e;q.n++;if(includeCases)q.absVals.push(ae);bySex[sx].sq+=e*e;bySex[sx].n++}if(includeCases)cases.push({rowIndex:ix,sex:sx,bodyRmseCm:Math.sqrt(bodySq/Math.max(1,bodyN))})}}
 const perMeasure={};for(const id of outputs){const q=per[id],a=q.absVals.sort((x,y)=>x-y);perMeasure[id]={label:targetMeta(id)?.label||id,quality:targetMeta(id)?.quality||"direct",rmseCm:Math.sqrt(q.sq/Math.max(1,q.n)),maeCm:q.abs/Math.max(1,q.n),biasCm:q.bias/Math.max(1,q.n),p95AbsCm:includeCases?percentile(a,.95):null}}
 const result={normalizedRmse:Math.sqrt(weightedNormSq/Math.max(1,weightedN)),weightedRmseCm:Math.sqrt(weightedCmSq/Math.max(1,weightedN)),overallRmseCm:Math.sqrt(rawSq/Math.max(1,rawN)),unknownTargetCount:m,perMeasure,bySex:{male:{rmseCm:Math.sqrt(bySex.male.sq/Math.max(1,bySex.male.n))},female:{rmseCm:Math.sqrt(bySex.female.sq/Math.max(1,bySex.female.n))}}};
 if(includeCases){cases.sort((a,b)=>a.bodyRmseCm-b.bodyRmseCm);result.bodyDistribution={p50:percentile(cases.map(x=>x.bodyRmseCm),.5),p90:percentile(cases.map(x=>x.bodyRmseCm),.9),p95:percentile(cases.map(x=>x.bodyRmseCm),.95),max:cases.at(-1)?.bodyRmseCm||0};result.worstCases=[...cases].sort((a,b)=>b.bodyRmseCm-a.bodyRmseCm).slice(0,20)}return result
}
function fitEvaluate(inputs,lambda,trainSplits=[0],evalSplit=1,includeCases=false){const outputs=outputIds(inputs),models=fitPair(trainSplits,inputs,outputs,"linear",lambda),evalBySex={0:indicesFor([evalSplit],0),1:indicesFor([evalSplit],1)};return evalModels(models,evalBySex,inputs,includeCases)}
function meanBaseline(inputs,trainSplits=[0],evalSplit=1){
 const outputs=outputIds(inputs),models={};for(const sex of [0,1]){const st=buildStats(trainSplits,sex),m=outputs.length,yMu=new Float64Array(m),ySd=new Float64Array(m);for(let k=0;k<m;k++){const tk=st.targetIndex[outputs[k]];yMu[k]=st.muY[tk];ySd[k]=st.sdY[tk]}const coef=[Float64Array.from(yMu)];models[sex]={kind:"linear",feat:[],outputs,mu:new Float64Array(0),sd:new Float64Array(0),yMu,ySd,coef}}return evalModels(models,{0:indicesFor([evalSplit],0),1:indicesFor([evalSplit],1)},inputs,false)
}
function fairEvaluate(models,evalBySex,inputs,{includeCases=true,noiseCm=0,noiseKg=0,reps=1,seed=81401}={}){
 const allIds=targetIds(false),primaryIds=targetIds(true),allIndex=Object.fromEntries(allIds.map((id,i)=>[id,i])),known=new Set(inputs),per=Object.fromEntries(allIds.map(id=>[id,{ss:0,abs:0,bias:0,n:0,absVals:[]}])) ,bySex={male:{ss:0,n:0},female:{ss:0,n:0}},body=[];let primarySS=0,primaryN=0,allSS=0,allN=0,knownSS=0,knownN=0;
 for(const sex of [0,1]){const model=models[sex],pred=new Float64Array(allIds.length),sx=sex?"female":"male";for(const ix of evalBySex[sex])for(let rep=0;rep<reps;rep++){
   const row=ROWS[ix],over={};if(noiseCm>0||noiseKg>0){const rng=rndFactory((seed+ix*131071+rep*8191+sex*97)>>>0);for(const id of inputs){const sd=id==="weightkg"?noiseKg:noiseCm;if(sd>0)over[id]=rowFeature(row,id)+normal(rng)*sd}}
   predictRow(model,row,pred,over);let bss=0,bn=0;
   for(const id of allIds){const truth=rowFeature(row,id),val=known.has(id)?featureValue(row,id,over):pred[allIndex[id]],e=val-truth,ae=Math.abs(e),q=per[id];q.ss+=e*e;q.abs+=ae;q.bias+=e;q.n++;if(includeCases&&reps===1)q.absVals.push(ae);allSS+=e*e;allN++;if(known.has(id)){knownSS+=e*e;knownN++}if(targetMeta(id)?.quality!=="proxy"){primarySS+=e*e;primaryN++;bss+=e*e;bn++;bySex[sx].ss+=e*e;bySex[sx].n++}}
   if(includeCases&&reps===1)body.push({rowIndex:ix,sex:sx,rmseCm:Math.sqrt(bss/Math.max(1,bn))});
  }}
 const perMeasure={};for(const id of allIds){const q=per[id],a=q.absVals.sort((x,y)=>x-y);perMeasure[id]={quality:targetMeta(id)?.quality||"direct",knownInput:known.has(id),rmseCm:Math.sqrt(q.ss/Math.max(1,q.n)),maeCm:q.abs/Math.max(1,q.n),biasCm:q.bias/Math.max(1,q.n),p95AbsCm:a.length?percentile(a,.95):null}}
 body.sort((a,b)=>a.rmseCm-b.rmseCm);return {primaryTargetCount:primaryIds.length,allTargetCount:allIds.length,knownTargetCount:allIds.filter(id=>known.has(id)).length,primaryFairRmseCm:Math.sqrt(primarySS/Math.max(1,primaryN)),all26FairRmseCm:Math.sqrt(allSS/Math.max(1,allN)),knownInputRmseCm:knownN?Math.sqrt(knownSS/knownN):0,bySex:{male:{rmseCm:Math.sqrt(bySex.male.ss/Math.max(1,bySex.male.n))},female:{rmseCm:Math.sqrt(bySex.female.ss/Math.max(1,bySex.female.n))}},perMeasure,...(includeCases&&reps===1?{bodyDistribution:{p50:percentile(body.map(x=>x.rmseCm),.5),p90:percentile(body.map(x=>x.rmseCm),.9),p95:percentile(body.map(x=>x.rmseCm),.95),max:body.at(-1)?.rmseCm||0},worstCases:[...body].sort((a,b)=>b.rmseCm-a.rmseCm).slice(0,20)}:{})}
}
function chooseModelOnValidation(inputs,progressCb=null){
 const outputs=targetIds(false),evalBySex={0:indicesFor([1],0),1:indicesFor([1],1)},candidates=[];let pos=0,total=LAMBDAS.length+QUAD_LAMBDAS.length;
 for(const lambda of LAMBDAS){const models=fitPair([0],inputs,outputs,"linear",lambda),ev=fairEvaluate(models,evalBySex,inputs,{includeCases:false});candidates.push({kind:"linear",lambda,validation:ev});pos++;progressCb?.(pos/total,`Linear λ ${lambda}`)}
 for(const lambda of QUAD_LAMBDAS){const models=fitPair([0],inputs,outputs,"quadratic",lambda),ev=fairEvaluate(models,evalBySex,inputs,{includeCases:false});candidates.push({kind:"quadratic",lambda,validation:ev});pos++;progressCb?.(pos/total,`Quadratic λ ${lambda}`)}
 candidates.sort((a,b)=>a.validation.primaryFairRmseCm-b.validation.primaryFairRmseCm);return {winner:candidates[0],candidates}
}
function empiricalUncertainty(inputs,spec){
 const outputs=targetIds(false),trainModels=fitPair([0],inputs,outputs,spec.kind,spec.lambda),allIndex=Object.fromEntries(outputs.map((id,i)=>[id,i])),bands={},absBy=Object.fromEntries(outputs.map(id=>[id,[]]));
 for(const sex of [0,1]){const pred=new Float64Array(outputs.length);for(const ix of indicesFor([1],sex)){const row=ROWS[ix];predictRow(trainModels[sex],row,pred);for(const id of outputs){if(inputs.includes(id))continue;absBy[id].push(Math.abs(pred[allIndex[id]]-rowFeature(row,id)))}}}
 for(const id of outputs){const a=absBy[id].sort((x,y)=>x-y);if(!a.length)continue;bands[id]={p68:percentile(a,.68),p90:percentile(a,.90),p95:percentile(a,.95)}}
 const finalModels=fitPair([0,1],inputs,outputs,spec.kind,spec.lambda),coverage={p68:{hit:0,n:0},p90:{hit:0,n:0},p95:{hit:0,n:0}},perTarget={};
 for(const id of outputs)if(bands[id])perTarget[id]={p68:0,p90:0,p95:0,n:0};
 for(const sex of [0,1]){const pred=new Float64Array(outputs.length);for(const ix of indicesFor([2],sex)){const row=ROWS[ix];predictRow(finalModels[sex],row,pred);for(const id of outputs){if(!bands[id])continue;const e=Math.abs(pred[allIndex[id]]-rowFeature(row,id)),q=perTarget[id];q.n++;for(const k of ["p68","p90","p95"]){coverage[k].n++;if(e<=bands[id][k]){coverage[k].hit++;q[k]++}}}}}
 const cov={};for(const k of ["p68","p90","p95"])cov[k]=100*coverage[k].hit/Math.max(1,coverage[k].n);for(const [id,q] of Object.entries(perTarget))for(const k of ["p68","p90","p95"])q[k]=100*q[k]/Math.max(1,q.n);return {bandsCm:bands,testCoveragePct:cov,perTargetCoveragePct:perTarget}
}
async function runA(){
 await ensureData("A",false);const start=performance.now(),default5=DATA.default5;postProgress("A",.05,"A · Modellvergleich auf Train → Validation …");const baseline=meanBaseline(default5,[0],1),models=[];let best=null;
 for(let i=0;i<LAMBDAS.length;i++){const l=LAMBDAS[i],r=fitEvaluate(default5,l,[0],1,false),kind=l===0?"OLS":"Ridge";models.push({kind,lambda:l,...r});if(l>0&&(!best||r.normalizedRmse<best.normalizedRmse))best={lambda:l,...r};postProgress("A",.07+.13*(i+1)/LAMBDAS.length,`Modellvergleich · λ ${l}`)}
 const lambda=best.lambda,required=DATA.candidateInputs.filter(x=>x.required).map(x=>x.id),optional=DATA.candidateInputs.filter(x=>!x.required).map(x=>x.id);let beam=[{set:required,score:fitEvaluate(required,lambda,[0],1,false).normalizedRmse}],snapshots={},evalDone=0,evalEstimate=190;
 for(let size=3;size<=7;size++){const cand=[],seen=new Set();for(const b of beam)for(const add of optional){if(b.set.includes(add))continue;const set=[...b.set,add].sort(),key=keySet(set);if(seen.has(key))continue;seen.add(key);const ev=fitEvaluate(set,lambda,[0],1,false);cand.push({set,score:ev.normalizedRmse,rmseCm:ev.overallRmseCm,weightedRmseCm:ev.weightedRmseCm,unknownTargetCount:ev.unknownTargetCount});evalDone++;if(evalDone%3===0)postProgress("A",Math.min(.91,.22+.69*evalDone/evalEstimate),`Input-Suche · ${size} Angaben · ${evalDone} Kandidaten geprüft`)}cand.sort((a,b)=>a.score-b.score);beam=cand.slice(0,BEAM_WIDTH);if(size>=5)snapshots[String(size)]=beam.slice(0,3)}
 const bestSets={};for(const n of [5,6,7])bestSets[String(n)]=snapshots[String(n)][0];const result={schema:"sammy-ansur-research-sweep-v1",generated:new Date().toISOString(),durationMs:Math.round(performance.now()-start),dataset:{population:DATA.population,split:DATA.split,targets:DATA.targets,candidateInputs:DATA.candidateInputs,freeContext:DATA.freeContext},leakageGuard:"Run A used split 0=train and split 1=validation only; split 2=test was not evaluated.",default5,modelComparison:{mean:{...baseline},candidates:models,bestRidge:best},selectedLambda:lambda,beamWidth:BEAM_WIDTH,bestSets};postProgress("A",1,"A · Research Sweep abgeschlossen.");postMessage({type:"result",run:"A",result})
}
async function runB(runAResult){
 await ensureData("B",true);if(!runAResult?.bestSets)throw new Error("Run B braucht einen abgeschlossenen Research Sweep A.");const start=performance.now(),sets=runAResult.bestSets,lambda=runAResult.selectedLambda,results={};let i=0;
 for(const n of [5,6,7]){const inputs=sets[String(n)].set;postProgress("B",.08+.26*i,`Blind Test · ${n} Angaben · final auf Train+Validation fitten …`);results[String(n)]={inputs,lambda,...fitEvaluate(inputs,lambda,[0,1],2,true)};i++}
 const ranked=Object.entries(results).map(([n,r])=>({n:Number(n),normalizedRmse:r.normalizedRmse,overallRmseCm:r.overallRmseCm,p95BodyRmseCm:r.bodyDistribution.p95})).sort((a,b)=>a.normalizedRmse-b.normalizedRmse);const result={schema:"sammy-ansur-blind-validation-v1",generated:new Date().toISOString(),durationMs:Math.round(performance.now()-start),dataset:{population:DATA.population,split:DATA.split},leakageGuard:"Run B retrained on train+validation and evaluated split 2=test for the first time.",selectedLambda:lambda,sets:results,ranking:ranked,recommendedInputCount:ranked[0]?.n||null};postProgress("B",1,"B · Blind Validation abgeschlossen.");postMessage({type:"result",run:"B",result})
}
async function runC(runAResult,runBResult){
 await ensureData("C",true);if(!runAResult?.bestSets||!runBResult?.sets)throw new Error("C braucht abgeschlossene Läufe A + B.");const start=performance.now(),families={optimized:{sets:Object.fromEntries([5,6,7].map(n=>[String(n),runAResult.bestSets[String(n)].set]))},consumer:{sets:CONSUMER_SETS}},evalTest={0:indicesFor([2],0),1:indicesFor([2],1)};let task=0,totalTasks=6;
 for(const [family,f] of Object.entries(families)){f.results={};for(const n of [5,6,7]){const inputs=f.sets[String(n)];postProgress("C",.05+.48*task/totalTasks,`C · ${family} ${n} Angaben · Linear vs Quadratic …`);const sel=chooseModelOnValidation(inputs,(p,t)=>postProgress("C",.05+.48*(task+p)/totalTasks,`C · ${family} ${n} · ${t}`)),spec={kind:sel.winner.kind,lambda:sel.winner.lambda},models=fitPair([0,1],inputs,targetIds(false),spec.kind,spec.lambda),test=fairEvaluate(models,evalTest,inputs,{includeCases:true});f.results[String(n)]={inputs,selectedModel:spec,validation:sel.winner.validation,test,modelCandidates:sel.candidates.map(x=>({kind:x.kind,lambda:x.lambda,primaryFairRmseCm:x.validation.primaryFairRmseCm,all26FairRmseCm:x.validation.all26FairRmseCm}))};task++}}
 const famScores=Object.fromEntries(Object.entries(families).map(([k,f])=>[k,[5,6,7].reduce((s,n)=>s+f.results[String(n)].validation.primaryFairRmseCm,0)/3])),recommendedFamily=famScores.consumer<=famScores.optimized*1.02?"consumer":"optimized",rec=families[recommendedFamily];
 postProgress("C",.56,`C · Messfehler-Robustheit · ${recommendedFamily} …`);const noise={};for(const n of [5,6,7]){const r=rec.results[String(n)],models=fitPair([0,1],r.inputs,targetIds(false),r.selectedModel.kind,r.selectedModel.lambda);noise[String(n)]={};for(const level of [.5,1,2])noise[String(n)][String(level)]={inputNoiseCm:level,inputNoiseKg:level,repetitions:6,...fairEvaluate(models,evalTest,r.inputs,{includeCases:false,noiseCm:level,noiseKg:level,reps:6,seed:814000+n*100+Math.round(level*10)})}}
 postProgress("C",.76,"C · Unsicherheitskalibrierung auf Validation → Test …");const uncertainty={};for(const n of [5,6,7]){const r=rec.results[String(n)];uncertainty[String(n)]=empiricalUncertainty(r.inputs,r.selectedModel);postProgress("C",.76+.18*(n-4)/3,`C · Unsicherheit ${n}/7`)}
 const result={schema:"sammy-ansur-robustness-v1",generated:new Date().toISOString(),durationMs:Math.round(performance.now()-start),status:"post-blind diagnostic; B already opened the held-out test partition",primaryTargetIds:targetIds(true),proxyTargetIds:DATA.targets.filter(t=>t.quality==="proxy").map(t=>t.sammyId),fixedTargetScoring:"24 direct+derived ANSUR-comparable targets use a fixed denominator; known target inputs count as exact observations (or as noisy observations in the noise simulation).",families,familyValidationScores:famScores,recommendedFamily,recommendedSets:rec.sets,recommendedModels:Object.fromEntries([5,6,7].map(n=>[String(n),rec.results[String(n)].selectedModel])),noise,uncertainty};postProgress("C",1,"C · Robustness + Model Depth abgeschlossen.");postMessage({type:"result",run:"C",result})
}
function takeEven(arr,k){if(k<=0)return[];if(k>=arr.length)return arr.slice();const out=[];for(let i=0;i<k;i++){const p=k===1?.5:i/(k-1),j=Math.round(p*(arr.length-1));out.push(arr[j])}return [...new Set(out)]}
function selectTestPeople(count){
 const out=[];for(const sex of [0,1]){const idx=indicesFor([2],sex),st=buildStats([0,1],sex),ids=["stature","weightkg","waist_circumference","buttock_circumference"],score=ix=>ids.reduce((s,id,j)=>{const fi=st.featIndex[id],z=(rowFeature(ROWS[ix],id)-st.muX[fi])/st.sdX[fi];return s+z*[1,.75,.55,.35][j]},0);const sorted=idx.slice().sort((a,b)=>score(a)-score(b)),k=sex?Math.floor(count/2):Math.ceil(count/2);out.push(...takeEven(sorted,k))}out.sort((a,b)=>a-b);return out.slice(0,count)
}
async function prepareD(runCResult,count=30,family=null){
 await ensureData("DPREP",true);if(!runCResult?.families)throw new Error("D braucht C · Robustness.");const fam=family||runCResult.recommendedFamily||"consumer",src=runCResult.families[fam];if(!src)throw new Error(`Unbekannte D-Familie ${fam}`);const specs={},models={};for(const n of [5,6,7]){const r=src.results[String(n)],spec=r.selectedModel;specs[String(n)]={inputs:r.inputs,kind:spec.kind,lambda:spec.lambda};models[String(n)]=fitPair([0,1],r.inputs,targetIds(false),spec.kind,spec.lambda)}
 const ids=targetIds(false),people=[],selected=selectTestPeople(Math.max(1,Math.min(120,Number(count)||30)));let pos=0;for(const ix of selected){const row=ROWS[ix],sex=Number(rowFeature(row,"sex"))>=.5?1:0,actual=Object.fromEntries(ids.map(id=>[id,rowFeature(row,id)])),variants={};for(const n of [5,6,7]){const spec=specs[String(n)],pred=new Float64Array(ids.length);predictRow(models[String(n)][sex],row,pred);const values={};for(let k=0;k<ids.length;k++)values[ids[k]]=spec.inputs.includes(ids[k])?actual[ids[k]]:pred[k];variants[String(n)]={inputs:spec.inputs,predicted:values}}people.push({rowIndex:ix,sex,ageYears:rowFeature(row,"age"),actual,variants});pos++;if(pos%4===0)postProgress("DPREP",.10+.86*pos/selected.length,`D vorbereitet · ${pos}/${selected.length} Personen`)}
 const result={schema:"sammy-ansur-endtoend-prep-v1",generated:new Date().toISOString(),family:fam,peopleCount:people.length,variants:[5,6,7],primaryTargetIds:targetIds(true),proxyTargetIds:DATA.targets.filter(t=>t.quality==="proxy").map(t=>t.sammyId),specs,people};postProgress("DPREP",1,"D · Testpersonen + Predictions vorbereitet.");postMessage({type:"result",run:"DPREP",result})
}
self.onmessage=async e=>{const msg=e.data||{};try{if(msg.type==="runA")await runA();else if(msg.type==="runB")await runB(msg.runA);else if(msg.type==="runC")await runC(msg.runA,msg.runB);else if(msg.type==="prepareD")await prepareD(msg.runC,msg.count,msg.family);else if(msg.type==="ping"){await ensureData("PING",false);postMessage({type:"pong",population:DATA.population})}}catch(err){const run=msg.type==="runA"?"A":msg.type==="runB"?"B":msg.type==="runC"?"C":msg.type==="prepareD"?"DPREP":"?";postMessage({type:"error",run,message:err?.message||String(err),stack:err?.stack||""})}};
