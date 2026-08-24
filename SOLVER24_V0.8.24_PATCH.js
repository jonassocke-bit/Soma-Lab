
// -----------------------------------------------------------------------------
// Sammy v0.8.24.0 · SOLVER24 CALIBRATION + PROPORTION + STABILITY PASS
// Conservative late override on top of v0.8.23 MASS + ANSUR24-PROT-v2.
// Goals:
//  - keep semantic DOFs present for persistent residuals (especially forearm)
//  - protect solved stature while leg segments are refined
//  - detect under-actuated rows instead of forcing unrelated sliders
//  - rescue seeds that stall after 0–1 useful passes
//  - export a signed-bias / saturation / seed-selection audit for every run
//  - keep provisional Chest Breadth from over-compressing the torso
// No target measurement is silently changed.
// -----------------------------------------------------------------------------

const SAMMY_SOLVER24_V824_SCHEMA="sammy-solver24-calibration-pass-v1";
const SAMMY_SOLVER24_V824_MAX_CANDIDATES=20;
const SAMMY_SOLVER24_V824_UNDERACTUATED_SENSITIVITY=.20;

for(const [mode,extra] of Object.entries({
 quick:{v824RescueAttempts:1,v824RescueMinRmse:1.15},
 standard:{v824RescueAttempts:1,v824RescueMinRmse:.95},
 deep:{v824RescueAttempts:1,v824RescueMinRmse:.85},
 stress:{v824RescueAttempts:1,v824RescueMinRmse:.85}
}))Object.assign(SAMMY_SOLVER24_CONFIG[mode]||{},extra);

sammySolver24.v824ActiveDiagnostics=null;
sammySolver24.v824LastDiagnostics=null;

function sammySolver24V824Slider(id){return sammySolver24.prior?.sliders?.find?.(d=>d.id===id)||null}
function sammySolver24V824Err(target,actual,id){
 const t=sammySolver24Finite(target?.[id]),a=sammySolver24Finite(actual?.[id]);
 return Number.isFinite(t)&&Number.isFinite(a)?a-t:NaN
}
function sammySolver24V824AbsErr(target,actual,id){const e=sammySolver24V824Err(target,actual,id);return Number.isFinite(e)?Math.abs(e):0}
function sammySolver24V824RatioPenalty(target,actual){
 const vals={};for(const id of ["upperarm_circumference","forearm_circumference","wrist_circumference"]){const t=sammySolver24Finite(target?.[id]),a=sammySolver24Finite(actual?.[id]);if(!(t>0&&a>0))return 0;vals[id]={t,a}}
 const logDelta=(a,b,c,d)=>Math.log(a/b)-Math.log(c/d);
 const p1=logDelta(vals.upperarm_circumference.a,vals.forearm_circumference.a,vals.upperarm_circumference.t,vals.forearm_circumference.t);
 const p2=logDelta(vals.forearm_circumference.a,vals.wrist_circumference.a,vals.forearm_circumference.t,vals.wrist_circumference.t);
 return p1*p1+p2*p2
}
function sammySolver24V824DiagRow(id,residual,maxSensitivity,boost){
 const d=sammySolver24.v824ActiveDiagnostics;if(!d)return;
 const q=d.rows[id]||(d.rows[id]={seen:0,underactuated:0,maxAbsResidualCm:0,maxSensitivity:0,maxAppliedBoost:1});
 q.seen++;q.maxAbsResidualCm=Math.max(q.maxAbsResidualCm,Math.abs(Number(residual)||0));q.maxSensitivity=Math.max(q.maxSensitivity,Number(maxSensitivity)||0);q.maxAppliedBoost=Math.max(q.maxAppliedBoost,Number(boost)||1);if(maxSensitivity<SAMMY_SOLVER24_V824_UNDERACTUATED_SENSITIVITY)q.underactuated++
}

// Candidate floor: preserve the existing influence-prior ranking, but do not let
// high-value semantic controls disappear merely because a global score is diluted
// by 23 other rows. All controls below already exist in the calibrated v1 prior.
const sammySolver24CandidatesV8230=sammySolver24Candidates;
sammySolver24Candidates=function(shape,target,actual,count){
 const out=sammySolver24CandidatesV8230(shape,target,actual,count),sex=Number(shape?.core?.gender)>=.5?1:0,seen=new Set(out.map(d=>d.id));
 const add=id=>{const d=sammySolver24V824Slider(id);if(d&&!seen.has(id)&&sammySolver24FreeSlider(d,sex)&&out.length<SAMMY_SOLVER24_V824_MAX_CANDIDATES){seen.add(id);out.push(d)}};
 const ae=id=>sammySolver24V824AbsErr(target,actual,id);
 if(ae("forearm_circumference")>.75){
  for(const id of ["localpair:lowerarm-fat-incr","localpair:lowerarm-muscle-incr","localpair:lowerarm-scale-depth-incr","localpair:lowerarm-scale-vert-incr"])add(id)
 }
 if(ae("upperarm_circumference")>.75){for(const id of ["local:measure-upperarm-circ-incr","localpair:upperarm-fat-incr","localpair:upperarm-muscle-incr","localpair:upperarm-shoulder-muscle-incr"])add(id)}
 if(ae("stature")>.60||ae("crotch_height")>.80||ae("tibiale_height")>.50){for(const id of ["core:height","local:measure-upperleg-height-incr","local:measure-lowerleg-height-incr"])add(id)}
 if(ae("chest_breadth")>.80)add("local:torso-scale-horiz-incr");
 if(ae("chest_depth")>.65)add("local:torso-scale-depth-incr");
 if(ae("chest_circumference")>1.0){for(const id of ["local:measure-bust-circ-incr","local:torso-muscle-pectoral-incr","local:torso-muscle-dorsi-incr"])add(id)}
 if(ae("neck_circumference")>.70){for(const id of ["local:measure-neck-circ-incr","local:neck-scale-depth-incr","local:neck-scale-horiz-incr"])add(id)}
 if(ae("ankle_circumference")>.35)add("local:measure-ankle-circ-incr");
 if(ae("thigh_circumference")>.80){for(const id of ["local:measure-thigh-circ-incr","localpair:upperleg-fat-incr","localpair:upperleg-muscle-incr"])add(id)}
 return out
};

// Adaptive row pass. The v0.8.23 solver still applies the ANSUR allowable-error
// normalization afterwards. These factors only express hierarchy/stability.
// If the current local Jacobian says a row has no useful actuator, its boost is
// suppressed rather than driving unrelated body parts to extreme values.
const sammySolver24SolveStepV8230=sammySolver24SolveStep;
sammySolver24SolveStep=function(J,residual,cands,shape,cfg,lambda){
 const k=cands.length,m=SAMMY_INFLUENCE_24_IDS.length,J2=new Float64Array(J),r2=new Float64Array(residual);
 for(let j=0;j<m;j++){
  const id=SAMMY_INFLUENCE_24_IDS[j],abs=Math.abs(Number(residual[j])||0);let boost=1,maxSens=0;
  for(let i=0;i<k;i++)maxSens=Math.max(maxSens,Math.abs(Number(J[j*k+i])||0));
  if(id==="stature")boost=abs>2?1.45:(abs>.70?1.20:1.08);
  else if(id==="crotch_height"||id==="tibiale_height")boost=abs>1.25?1.24:(abs>.55?1.12:1);
  else if(id==="forearm_circumference")boost=abs>2?1.28:(abs>.75?1.14:1);
  else if(id==="neck_circumference")boost=abs>2?1.16:(abs>.75?1.08:1);
  else if(id==="ankle_circumference")boost=abs>.75?1.10:1;
  // Chest Breadth is explicitly still an unresolved surface/compression proxy in
  // ANSUR24-PROT-v2. Do not let it squash an otherwise plausible torso.
  else if(id==="chest_breadth")boost=.82;
  if(maxSens<SAMMY_SOLVER24_V824_UNDERACTUATED_SENSITIVITY&&abs>.5)boost=Math.min(boost,.86);
  sammySolver24V824DiagRow(id,residual[j],maxSens,boost);
  if(boost!==1){r2[j]*=boost;for(let i=0;i<k;i++)J2[j*k+i]*=boost}
 }
 return sammySolver24SolveStepV8230(J2,r2,cands,shape,cfg,lambda)
};

async function sammySolver24V824NoStep(shape,target){
 const rr=await sammySolver24ApplyShape(shape,false),actual=sammySolver24MeasureObject(rr),rmse=sammySolver24Rmse(target,actual),cost=sammySolver24ShapeCost(shape),sex=Number(shape?.core?.gender)>=.5?1:0,plausibility=sammySolver24CurrentPlausibility(rr,sex),mass=sammyMassEvaluateCandidate(sammySolver24.massActiveTarget);
 return {shape,actual,rmse,cost,alpha:0,plausibility,mass,objective:sammyMassObjective(rmse,mass),v824Rejected:true}
}

// Acceptance guards are target-relative, not population-normalizing: unusual real
// people stay legal. Once stature is close, a later circumference pass may no
// longer throw it away. Likewise, while the arm is still visibly unresolved, a
// step may not substantially worsen the target's own upperarm/forearm/wrist ratio.
const sammySolver24TryStepV8230=sammySolver24TryStep;
sammySolver24TryStep=async function(shape,target,baseActual,cands,step){
 const trial=await sammySolver24TryStepV8230(shape,target,baseActual,cands,step);if(!trial||trial.shape===shape||trial.alpha===0)return trial;
 const h0=sammySolver24V824AbsErr(target,baseActual,"stature"),h1=sammySolver24V824AbsErr(target,trial.actual,"stature");
 if(h0<=1.0&&h1>h0+.22){const d=sammySolver24.v824ActiveDiagnostics;if(d)d.heightGuardRejects++;return sammySolver24V824NoStep(shape,target)}
 const fore=Math.max(sammySolver24V824AbsErr(target,baseActual,"forearm_circumference"),sammySolver24V824AbsErr(target,trial.actual,"forearm_circumference"));
 if(fore>1.2){const p0=sammySolver24V824RatioPenalty(target,baseActual),p1=sammySolver24V824RatioPenalty(target,trial.actual);if(p1>p0*1.18+.0015){const d=sammySolver24.v824ActiveDiagnostics;if(d)d.armRatioGuardRejects++;return sammySolver24V824NoStep(shape,target)}}
 return trial
};

function sammySolver24V824CompactDiagnostics(d){
 if(!d)return null;const rows=Object.fromEntries(Object.entries(d.rows||{}).map(([id,q])=>[id,{seen:q.seen,underactuated:q.underactuated,maxAbsResidualCm:Number(q.maxAbsResidualCm.toFixed(4)),maxSensitivity:Number(q.maxSensitivity.toFixed(4)),maxAppliedBoost:Number(q.maxAppliedBoost.toFixed(3))}]));
 return {schema:SAMMY_SOLVER24_V824_SCHEMA,targetIndex:d.targetIndex,seedIndex:d.seedIndex,rescueAttempted:!!d.rescueAttempted,rescueAccepted:!!d.rescueAccepted,heightGuardRejects:d.heightGuardRejects||0,armRatioGuardRejects:d.armRatioGuardRejects||0,rows}
}

// One bounded rescue pass for seeds that effectively never left their start.
// Smaller finite-difference probes + lower regularization make it a different
// local attempt; the original result is retained unless the combined objective
// really improves.
const sammySolver24SolveSeedV8230=sammySolver24SolveSeed;
sammySolver24SolveSeed=async function(target,seedShape,targetIndex,seedIndex,totalSolves,solveIndex){
 const cfg=SAMMY_SOLVER24_CONFIG[sammySolver24.mode],diag={schema:SAMMY_SOLVER24_V824_SCHEMA,targetIndex,seedIndex,rows:{},heightGuardRejects:0,armRatioGuardRejects:0,rescueAttempted:false,rescueAccepted:false};sammySolver24.v824ActiveDiagnostics=diag;
 let first=await sammySolver24SolveSeedV8230(target,seedShape,targetIndex,seedIndex,totalSolves,solveIndex),chosen=first;
 const improve=Number(first.initialRmseCm)-Number(first.finalRmseCm),stalled=(Number(first.iterations)<=1||improve<.08)&&Number(first.finalRmseCm)>Number(cfg.v824RescueMinRmse||1);
 if(stalled&&Number(cfg.v824RescueAttempts||0)>0){
  diag.rescueAttempted=true;const saved={candidates:cfg.candidates,iterations:cfg.iterations,deltaCore:cfg.deltaCore,deltaLocal:cfg.deltaLocal,lambda:cfg.lambda,maxCoreStep:cfg.maxCoreStep,maxLocalStep:cfg.maxLocalStep};
  try{
   cfg.candidates=Math.min(SAMMY_SOLVER24_V824_MAX_CANDIDATES,Number(saved.candidates)+4);cfg.iterations=Math.max(4,Number(saved.iterations));cfg.deltaCore=Number(saved.deltaCore)*.72;cfg.deltaLocal=Number(saved.deltaLocal)*.68;cfg.lambda=Math.max(.18,Number(saved.lambda)*.52);cfg.maxCoreStep=Number(saved.maxCoreStep)*.82;cfg.maxLocalStep=Number(saved.maxLocalStep)*.88;
   const rescue=await sammySolver24SolveSeedV8230(target,first.shape,targetIndex,seedIndex,totalSolves,solveIndex),a=Number(first.objectiveScore??first.finalRmseCm),b=Number(rescue.objectiveScore??rescue.finalRmseCm);
   if(b<a-.015||(Math.abs(b-a)<.015&&Number(rescue.finalRmseCm)<Number(first.finalRmseCm)-.03)){chosen=rescue;diag.rescueAccepted=true}
  }finally{Object.assign(cfg,saved)}
 }
 const compact=sammySolver24V824CompactDiagnostics(diag);chosen={...chosen,calibrationDiagnostics:compact,rescue:{attempted:diag.rescueAttempted,accepted:diag.rescueAccepted,initialCandidateRmseCm:first.initialRmseCm,preRescueRmseCm:first.finalRmseCm,finalRmseCm:chosen.finalRmseCm}};sammySolver24.v824LastDiagnostics=compact;sammySolver24.v824ActiveDiagnostics=null;return chosen
};

function sammySolver24V824BestObjective(solutions){return (solutions||[]).slice().sort((a,b)=>Number(a.objectiveScore??a.finalRmseCm)-Number(b.objectiveScore??b.finalRmseCm))[0]||null}
function sammySolver24V824BestFit(solutions){return (solutions||[]).slice().sort((a,b)=>Number(a.finalRmseCm)-Number(b.finalRmseCm))[0]||null}
function sammySolver24V824Saturation(shape,d){
 const v=sammySolver24SliderValue(shape,d),lo=Number(d.min),hi=Number(d.max);if(!(Number.isFinite(v)&&Number.isFinite(lo)&&Number.isFinite(hi)&&hi>lo))return null;const u=(v-lo)/(hi-lo);return Math.min(u,1-u)
}
function sammySolver24V824BuildBiasAudit(targets,byTarget){
 const rows=[];for(const id of SAMMY_INFLUENCE_24_IDS){const errors=[];for(let i=0;i<targets.length;i++){const s=sammySolver24V824BestObjective(byTarget[i]),t=sammySolver24Finite(targets[i]?.measures?.[id]),a=sammySolver24Finite(s?.allMeasures?.[id]);if(Number.isFinite(t)&&Number.isFinite(a))errors.push(a-t)}if(!errors.length)continue;
  const n=errors.length,mean=errors.reduce((a,b)=>a+b,0)/n,mae=errors.reduce((a,b)=>a+Math.abs(b),0)/n,rmse=Math.sqrt(errors.reduce((a,b)=>a+b*b,0)/n),pos=errors.filter(e=>e>0).length,neg=errors.filter(e=>e<0).length,sign=Math.max(pos,neg)/n,allowMm=Number(sammyAns24V2Spec(id).allowableObserverErrorMm),allowCm=allowMm/10,systematic=n>=4&&sign>=.75&&Math.abs(mean)>Math.max(.35,allowCm*1.25),calibrationSuspect=n>=4&&sign>=.875&&Math.abs(mean)>Math.max(.60,allowCm*2);
  rows.push({id,label:SAMMY_MEASURE_DEFS.find(d=>d.id===id)?.label||id,n,meanSignedErrorCm:Number(mean.toFixed(4)),maeCm:Number(mae.toFixed(4)),rmseCm:Number(rmse.toFixed(4)),positive:pos,negative:neg,sameSignFraction:Number(sign.toFixed(3)),allowableObserverErrorMm:allowMm,systematic,calibrationSuspect,provisional:id==="chest_breadth"})
 }
 rows.sort((a,b)=>b.maeCm-a.maeCm);
 const sats=new Map();for(let i=0;i<targets.length;i++){const s=sammySolver24V824BestObjective(byTarget[i]);if(!s?.shape)continue;const sex=Number(s.shape.core?.gender)>=.5?1:0;for(const d of sammySolver24.prior?.sliders||[]){if(!sammySolver24FreeSlider(d,sex))continue;const edge=sammySolver24V824Saturation(s.shape,d);if(edge!=null&&edge<=.05){const q=sats.get(d.id)||{id:d.id,label:d.label,count:0};q.count++;sats.set(d.id,q)}}}
 const saturated=[...sats.values()].sort((a,b)=>b.count-a.count||a.id.localeCompare(b.id));
 const under=new Map();for(const sols of byTarget)for(const s of sols||[]){for(const [id,q] of Object.entries(s.calibrationDiagnostics?.rows||{})){if(!q.seen)continue;const x=under.get(id)||{id,seen:0,underactuated:0,maxSensitivity:0};x.seen+=q.seen;x.underactuated+=q.underactuated;x.maxSensitivity=Math.max(x.maxSensitivity,q.maxSensitivity);under.set(id,x)}}
 const underactuated=[...under.values()].map(q=>({...q,fraction:q.seen?Number((q.underactuated/q.seen).toFixed(3)):0})).filter(q=>q.fraction>=.5).sort((a,b)=>b.fraction-a.fraction);
 return {schema:"sammy-solver24-bias-audit-v1",interpretation:"Signed errors are final mesh minus target. Systematic flags are diagnostics, not automatic target corrections.",rows,systematic:rows.filter(r=>r.systematic),calibrationSuspects:rows.filter(r=>r.calibrationSuspect),saturatedSliders:saturated,underactuatedRows:underactuated}
}

// Keep both notions of "best" visible. v0.8.23 intentionally selects by the
// combined measure+mass objective; v0.8.24 reports the pure fit winner alongside
// it instead of hiding disagreements between the two rankings.
const sammySolver24TargetSummaryV8230=sammySolver24TargetSummary;
sammySolver24TargetSummary=function(target,solutions){
 const q=sammySolver24TargetSummaryV8230(target,solutions),fit=sammySolver24V824BestFit(solutions),obj=sammySolver24V824BestObjective(solutions);
 q.bestFitSeedIndex=fit?.seedIndex??null;q.bestFitRmseCm=fit?.finalRmseCm??null;q.bestObjectiveSeedIndex=obj?.seedIndex??null;q.bestObjectiveRmseCm=obj?.finalRmseCm??null;q.objectiveVsFitGapCm=fit&&obj?Number((Number(obj.finalRmseCm)-Number(fit.finalRmseCm)).toFixed(4)):null;q.calibrationDiagnostics=obj?.calibrationDiagnostics||null;q.rescue=obj?.rescue||null;return q
};

const sammySolver24ComputeSummaryV8230=sammySolver24ComputeSummary;
sammySolver24ComputeSummary=function(run,targets,byTarget){
 const q=sammySolver24ComputeSummaryV8230(run,targets,byTarget);q.schema="sammy-solver24-summary-v4";q.calibrationPassSchema=SAMMY_SOLVER24_V824_SCHEMA;q.measurementCalibrationAudit=sammySolver24V824BuildBiasAudit(targets,byTarget);q.notes={...(q.notes||{}),v0824:"Semantic candidate floor for persistent local residuals; under-actuation-aware adaptive rows; stature conservation guard; target-relative arm-ratio guard; one bounded stall-rescue pass; dual objective-vs-fit reporting; signed bias/saturation audit. Chest Breadth remains provisional and is deliberately down-weighted rather than silently offset."};return q
};

const sammySolver24RenderResultsV8230=sammySolver24RenderResults;
sammySolver24RenderResults=function(){
 sammySolver24RenderResultsV8230();const e=$("#sammySolver24Results"),run=sammySolver24.run||sammySolver24.lastRun;if(!e||!run?.summary?.targets?.length)return;const cards=[...e.querySelectorAll(".sammySolver24Result")];run.summary.targets.forEach((q,i)=>{const span=cards[i]?.querySelector("span");if(!span)return;if(q.rescue?.attempted)span.insertAdjacentHTML("beforeend",` · Rescue ${q.rescue.accepted?"✓":"–"}`);if(Number.isFinite(q.objectiveVsFitGapCm)&&q.objectiveVsFitGapCm>.08)span.insertAdjacentHTML("beforeend",` · Fit↔Obj Δ ${Number(q.objectiveVsFitGapCm).toFixed(2)} cm`)})
};

const sammySolver24SetModeV8230=sammySolver24SetMode;
sammySolver24SetMode=function(mode){sammySolver24SetModeV8230(mode);const cur=$("#sammySolver24Current");if(cur)cur.textContent+=` CAL v0.8.24: Forearm/Arm-Semantik bleibt im lokalen Jacobian; Height wird nach Konvergenz geschützt; Stalls bekommen einen Rescue-Pass; Summary exportiert Bias + Sättigung + Under-actuation.`};
