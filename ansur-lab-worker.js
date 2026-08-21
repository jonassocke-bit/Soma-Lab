/* Sammy v0.8.13 · ANSUR LAB worker
   Heavy statistical work stays off the Three.js/UI thread.
   Run A: train+validation only. Run B: first access to blind test split. */
"use strict";
const TRAINVAL_URL="./ansur-prediction-trainval-v1.json?v=0.8.13";
const TEST_URL="./ansur-prediction-test-v1.json?v=0.8.13";
let DATA=null,COL=null,ROWS=null,IDX=null,TEST_LOADED=false,STATS=new Map();
const LAMBDAS=[0,0.05,0.2,0.8,2.5,8];
const BEAM_WIDTH=6;
function postProgress(run,progress,text,extra={}){postMessage({type:"progress",run,progress,text,...extra})}
function finite(v){return Number.isFinite(v)?v:0}
function percentile(sorted,q){if(!sorted.length)return 0;const p=(sorted.length-1)*q,i=Math.floor(p),f=p-i;return sorted[i]+(sorted[Math.min(sorted.length-1,i+1)]-sorted[i])*f}
function mean(a){let s=0;for(const v of a)s+=v;return a.length?s/a.length:0}
function keySet(a){return [...a].sort().join("|")}
async function ensureData(run,includeTest=false){
 if(!DATA){
  postProgress(run,.015,"ANSUR Train+Validation wird geladen …");const r=await fetch(TRAINVAL_URL,{cache:"force-cache"});if(!r.ok)throw new Error(`ANSUR Train+Validation HTTP ${r.status}`);DATA=await r.json();if(DATA?.schema!=="sammy-ansur-prediction-dataset-v1"||DATA?.partition!=="trainval"||!Array.isArray(DATA.rows))throw new Error("ANSUR Train+Validation Dataset ungültig");ROWS=DATA.rows;COL=Object.fromEntries(DATA.columns.map((c,i)=>[c,i]));IDX={};for(const split of [0,1,2])for(const sex of [0,1])IDX[`${split}:${sex}`]=[];for(let i=0;i<ROWS.length;i++){const r0=ROWS[i],sp=r0[COL.split],sx=r0[COL.sex];IDX[`${sp}:${sx}`]?.push(i)}postProgress(run,.03,`${ROWS.length.toLocaleString("de-DE")} Train+Validation-Personen bereit · Blind Test noch nicht geladen.`)
 }
 if(includeTest&&!TEST_LOADED){
  postProgress(run,.045,"Blind-Testpartition wird jetzt erstmals geladen …");const r=await fetch(TEST_URL,{cache:"force-cache"});if(!r.ok)throw new Error(`ANSUR Blind Test HTTP ${r.status}`);const d=await r.json();if(d?.schema!==DATA.schema||d?.partition!=="test"||!Array.isArray(d.rows))throw new Error("ANSUR Blind-Test-Dataset ungültig");const base=ROWS.length;ROWS.push(...d.rows);for(let i=base;i<ROWS.length;i++){const r0=ROWS[i],sp=r0[COL.split],sx=r0[COL.sex];if(sp!==2)throw new Error("Blind-Testpartition enthält Nicht-Test-Zeilen");IDX[`${sp}:${sx}`].push(i)}TEST_LOADED=true;postProgress(run,.06,`${d.rows.length.toLocaleString("de-DE")} Blind-Testpersonen geladen.`)
 }
 return DATA
}
function targetMeta(id){return DATA.targets.find(t=>t.sammyId===id)}
function outputIds(inputs){const known=new Set(inputs);return DATA.targets.map(t=>t.sammyId).filter(id=>!known.has(id))}
function rowFeature(row,id){return row[COL[id]]}
function indicesFor(splits,sex){const out=[];for(const sp of splits)out.push(...IDX[`${sp}:${sex}`]);return out}
function invert(A){
 const n=A.length,M=Array.from({length:n},(_,i)=>{const r=new Float64Array(n*2);for(let j=0;j<n;j++)r[j]=A[i][j];r[n+i]=1;return r});
 for(let c=0;c<n;c++){
  let p=c,b=Math.abs(M[c][c]);for(let r=c+1;r<n;r++){const v=Math.abs(M[r][c]);if(v>b){b=v;p=r}}
  if(b<1e-11)throw new Error("Ridge-Matrix singulär");if(p!==c){const t=M[c];M[c]=M[p];M[p]=t}
  const d=M[c][c];for(let j=0;j<n*2;j++)M[c][j]/=d;
  for(let r=0;r<n;r++){if(r===c)continue;const f=M[r][c];if(Math.abs(f)<1e-15)continue;for(let j=0;j<n*2;j++)M[r][j]-=f*M[c][j]}
 }
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
 for(let j=0;j<feat.length;j++){const fj=st.featIndex[feat[j]];mu[j]=st.muX[fj];sd[j]=st.sdX[fj];xtx[0][j+1]=0;xtx[j+1][0]=0}
 for(let k=0;k<m;k++){const tk=st.targetIndex[outputs[k]];yMu[k]=st.muY[tk];ySd[k]=st.sdY[tk];xty[0][k]=st.n*st.muY[tk]}
 for(let a=0;a<feat.length;a++){const fa=st.featIndex[feat[a]];for(let b=0;b<feat.length;b++){const fb=st.featIndex[feat[b]];xtx[a+1][b+1]=st.xx[fa][fb]}for(let k=0;k<m;k++){const tk=st.targetIndex[outputs[k]];xty[a+1][k]=st.xy[fa][tk]}}
 for(let j=1;j<p;j++)xtx[j][j]+=lambda;xtx[0][0]+=1e-10;const inv=invert(xtx),coef=Array.from({length:p},()=>new Float64Array(m));for(let a=0;a<p;a++)for(let k=0;k<m;k++){let z=0;for(let b=0;b<p;b++)z+=inv[a][b]*xty[b][k];coef[a][k]=z}return {feat,outputs,mu,sd,yMu,ySd,coef}
}
function predictRow(model,row,out){const p=model.coef.length,m=model.outputs.length;for(let k=0;k<m;k++)out[k]=model.coef[0][k];for(let a=1;a<p;a++){const z=(rowFeature(row,model.feat[a-1])-model.mu[a-1])/model.sd[a-1];for(let k=0;k<m;k++)out[k]+=z*model.coef[a][k]}return out}
function evalModels(models,evalBySex,inputs,includeCases=false){
 const outputs=outputIds(inputs),m=outputs.length;let weightedNormSq=0,weightedCmSq=0,weightedN=0,rawSq=0,rawN=0;
 const per=Object.fromEntries(outputs.map(id=>[id,{sq:0,abs:0,bias:0,n:0,absVals:[]}]));const bySex={male:{sq:0,n:0},female:{sq:0,n:0}},cases=[];
 for(const sex of [0,1]){const model=models[sex],pred=new Float64Array(m),idx=evalBySex[sex],sx=sex===0?"male":"female";
  for(const ix of idx){const row=ROWS[ix];predictRow(model,row,pred);let bodySq=0,bodyN=0;
   for(let k=0;k<m;k++){const id=outputs[k],meta=targetMeta(id),w=Number(meta?.evaluationWeight||1),e=pred[k]-rowFeature(row,id),ae=Math.abs(e),z=e/model.ySd[k];weightedNormSq+=w*z*z;weightedCmSq+=w*e*e;weightedN+=w;rawSq+=e*e;rawN++;bodySq+=e*e;bodyN++;const q=per[id];q.sq+=e*e;q.abs+=ae;q.bias+=e;q.n++;if(includeCases)q.absVals.push(ae);bySex[sx].sq+=e*e;bySex[sx].n++}
   if(includeCases)cases.push({rowIndex:ix,sex:sx,bodyRmseCm:Math.sqrt(bodySq/Math.max(1,bodyN))})
  }
 }
 const perMeasure={};for(const id of outputs){const q=per[id],a=q.absVals.sort((x,y)=>x-y);perMeasure[id]={label:targetMeta(id)?.label||id,quality:targetMeta(id)?.quality||"direct",rmseCm:Math.sqrt(q.sq/Math.max(1,q.n)),maeCm:q.abs/Math.max(1,q.n),biasCm:q.bias/Math.max(1,q.n),p95AbsCm:includeCases?percentile(a,.95):null}}
 const result={normalizedRmse:Math.sqrt(weightedNormSq/Math.max(1,weightedN)),weightedRmseCm:Math.sqrt(weightedCmSq/Math.max(1,weightedN)),overallRmseCm:Math.sqrt(rawSq/Math.max(1,rawN)),unknownTargetCount:m,perMeasure,bySex:{male:{rmseCm:Math.sqrt(bySex.male.sq/Math.max(1,bySex.male.n))},female:{rmseCm:Math.sqrt(bySex.female.sq/Math.max(1,bySex.female.n))}}};
 if(includeCases){cases.sort((a,b)=>a.bodyRmseCm-b.bodyRmseCm);result.bodyDistribution={p50:percentile(cases.map(x=>x.bodyRmseCm),.5),p90:percentile(cases.map(x=>x.bodyRmseCm),.9),p95:percentile(cases.map(x=>x.bodyRmseCm),.95),max:cases.at(-1)?.bodyRmseCm||0};result.worstCases=[...cases].sort((a,b)=>b.bodyRmseCm-a.bodyRmseCm).slice(0,20)}
 return result
}
function fitEvaluate(inputs,lambda,trainSplits=[0],evalSplit=1,includeCases=false){const outputs=outputIds(inputs),models={},evalBySex={};for(const sex of [0,1]){models[sex]=fitSexModel(trainSplits,sex,inputs,outputs,lambda);evalBySex[sex]=indicesFor([evalSplit],sex)}return evalModels(models,evalBySex,inputs,includeCases)}
function meanBaseline(inputs,trainSplits=[0],evalSplit=1){
 const outputs=outputIds(inputs),models={};for(const sex of [0,1]){const st=buildStats(trainSplits,sex),m=outputs.length,yMu=new Float64Array(m),ySd=new Float64Array(m);for(let k=0;k<m;k++){const tk=st.targetIndex[outputs[k]];yMu[k]=st.muY[tk];ySd[k]=st.sdY[tk]}const coef=[Float64Array.from(yMu)];models[sex]={feat:[],outputs,mu:new Float64Array(0),sd:new Float64Array(0),yMu,ySd,coef}}return evalModels(models,{0:indicesFor([evalSplit],0),1:indicesFor([evalSplit],1)},inputs,false)
}
async function runA(){
 await ensureData("A",false);const start=performance.now(),default5=DATA.default5;postProgress("A",.05,"A · Modellvergleich auf Train → Validation …");
 const baseline=meanBaseline(default5,[0],1),models=[];let best=null;
 for(let i=0;i<LAMBDAS.length;i++){const l=LAMBDAS[i],r=fitEvaluate(default5,l,[0],1,false),kind=l===0?"OLS":"Ridge";models.push({kind,lambda:l,...r});if(l>0&&(!best||r.normalizedRmse<best.normalizedRmse))best={lambda:l,...r};postProgress("A",.07+.13*(i+1)/LAMBDAS.length,`Modellvergleich · λ ${l}`)}
 const lambda=best.lambda,required=DATA.candidateInputs.filter(x=>x.required).map(x=>x.id),optional=DATA.candidateInputs.filter(x=>!x.required).map(x=>x.id);let beam=[{set:required,score:fitEvaluate(required,lambda,[0],1,false).normalizedRmse}],snapshots={};
 let evalDone=0,evalEstimate=190;
 for(let size=3;size<=7;size++){
  const cand=[],seen=new Set();for(const b of beam)for(const add of optional){if(b.set.includes(add))continue;const set=[...b.set,add].sort(),key=keySet(set);if(seen.has(key))continue;seen.add(key);const ev=fitEvaluate(set,lambda,[0],1,false);cand.push({set,score:ev.normalizedRmse,rmseCm:ev.overallRmseCm,weightedRmseCm:ev.weightedRmseCm,unknownTargetCount:ev.unknownTargetCount});evalDone++;if(evalDone%3===0)postProgress("A",Math.min(.91,.22+.69*evalDone/evalEstimate),`Input-Suche · ${size} Angaben · ${evalDone} Kandidaten geprüft`)}
  cand.sort((a,b)=>a.score-b.score);beam=cand.slice(0,BEAM_WIDTH);if(size>=5)snapshots[String(size)]=beam.slice(0,3)
 }
 const bestSets={};for(const n of [5,6,7])bestSets[String(n)]=snapshots[String(n)][0];
 const result={schema:"sammy-ansur-research-sweep-v1",generated:new Date().toISOString(),durationMs:Math.round(performance.now()-start),dataset:{population:DATA.population,split:DATA.split,targets:DATA.targets,candidateInputs:DATA.candidateInputs,freeContext:DATA.freeContext},leakageGuard:"Run A used split 0=train and split 1=validation only; split 2=test was not evaluated.",default5,modelComparison:{mean:{...baseline},candidates:models,bestRidge:best},selectedLambda:lambda,beamWidth:BEAM_WIDTH,bestSets};postProgress("A",1,"A · Research Sweep abgeschlossen.");postMessage({type:"result",run:"A",result})
}
async function runB(runAResult){
 await ensureData("B",true);if(!runAResult?.bestSets)throw new Error("Run B braucht einen abgeschlossenen Research Sweep A.");const start=performance.now(),sets=runAResult.bestSets,lambda=runAResult.selectedLambda,results={};let i=0;
 for(const n of [5,6,7]){const inputs=sets[String(n)].set;postProgress("B",.08+.26*i,`Blind Test · ${n} Angaben · final auf Train+Validation fitten …`);results[String(n)]={inputs,lambda,...fitEvaluate(inputs,lambda,[0,1],2,true)};i++}
 const ranked=Object.entries(results).map(([n,r])=>({n:Number(n),normalizedRmse:r.normalizedRmse,overallRmseCm:r.overallRmseCm,p95BodyRmseCm:r.bodyDistribution.p95})).sort((a,b)=>a.normalizedRmse-b.normalizedRmse);
 const result={schema:"sammy-ansur-blind-validation-v1",generated:new Date().toISOString(),durationMs:Math.round(performance.now()-start),dataset:{population:DATA.population,split:DATA.split},leakageGuard:"Run B retrained on train+validation and evaluated split 2=test for the first time.",selectedLambda:lambda,sets:results,ranking:ranked,recommendedInputCount:ranked[0]?.n||null};postProgress("B",1,"B · Blind Validation abgeschlossen.");postMessage({type:"result",run:"B",result})
}
self.onmessage=async e=>{const msg=e.data||{};try{if(msg.type==="runA")await runA();else if(msg.type==="runB")await runB(msg.runA);else if(msg.type==="ping"){await ensureData("PING",false);postMessage({type:"pong",population:DATA.population})}}catch(err){postMessage({type:"error",run:msg.type==="runA"?"A":msg.type==="runB"?"B":"?",message:err?.message||String(err),stack:err?.stack||""})}};
