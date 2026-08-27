import json, math, copy, statistics
from pathlib import Path
base=Path(__file__).resolve().parent
d=json.load(open(base/'ansur-prediction-test-v1.json'))
cols=d['columns']; idx={c:i for i,c in enumerate(cols)}
rows=d['rows']
selected=[
    (129,'typical-male-a','typical','Typisch · Mann','multivariate Nähe zum sex-spezifischen Zentrum'),
    (114,'typical-male-b','typical','Typisch · Mann · älter','multivariate Nähe zum sex-spezifischen Zentrum mit Altersstreuung'),
    (773,'typical-female-a','typical','Typisch · Frau','multivariate Nähe zum sex-spezifischen Zentrum'),
    (664,'typical-female-b','typical','Typisch · Frau · älter','multivariate Nähe zum sex-spezifischen Zentrum mit Altersstreuung'),
    (140,'edge-male-tall','edge','Randfall · sehr groß · Mann','ca. 98. Perzentil Körperhöhe innerhalb des männlichen held-out Testsplits'),
    (790,'edge-female-short','edge','Randfall · sehr klein · Frau','ca. 2. Perzentil Körperhöhe innerhalb des weiblichen held-out Testsplits'),
    (358,'edge-male-heavy','edge','Randfall · schwer · Mann','ca. 98. Perzentil Gewicht innerhalb des männlichen held-out Testsplits'),
    (757,'edge-female-light','edge','Randfall · leicht · Frau','ca. 2. Perzentil Gewicht innerhalb des weiblichen held-out Testsplits'),
    (493,'edge-male-broad-frame','edge','Randfall · breiter Frame · Mann','ca. 98. Perzentil Biacromial/Hip-Breadth-Verhältnis'),
    (745,'edge-female-long-leg','edge','Randfall · lange Beine · Frau','ca. 98. Perzentil Crotch-Height/Stature-Verhältnis'),
]
measure24=['stature','biacromial_breadth','chest_circumference','chest_breadth','chest_depth','waist_circumference','waist_breadth','waist_depth','buttock_circumference','hip_breadth','crotch_height','neck_circumference','neck_base_circumference','wrist_circumference','thigh_circumference','calf_circumference','ankle_circumference','waist_back_length','upperarm_length','lowerarm_length','upperarm_circumference','forearm_circumference','tibiale_height','shoulder_length']
# sex refs for deterministic far seed / documentation
sexref={}
for sex in [0,1]:
    rr=[r for r in rows if int(r[idx['sex']])==sex]
    sexref['female' if sex else 'male']={
        'statureMedianCm':round(statistics.median(float(r[idx['stature']]) for r in rr),3),
        'weightMedianKg':round(statistics.median(float(r[idx['weightkg']]) for r in rr),3),
        'frameRatioMedian':round(statistics.median(float(r[idx['biacromial_breadth']])/float(r[idx['hip_breadth']]) for r in rr),6),
        'legRatioMedian':round(statistics.median(float(r[idx['crotch_height']])/float(r[idx['stature']]) for r in rr),6),
    }
# z_rms for metadata using 11 stable features within sex
zcols=['stature','weightkg','biacromial_breadth','hip_breadth','waist_circumference','buttock_circumference','crotch_height','tibiale_height','upperarm_length','lowerarm_length','thigh_circumference']
mu_sd={}
for sex in [0,1]:
    rr=[r for r in rows if int(r[idx['sex']])==sex]
    mu_sd[sex]={}
    for c in zcols:
        vals=[float(r[idx[c]]) for r in rr]
        mu=sum(vals)/len(vals); sd=(sum((x-mu)**2 for x in vals)/len(vals))**.5
        mu_sd[sex][c]=(mu,sd)


def percentile_le(vals, value):
    vals=sorted(float(x) for x in vals)
    if not vals: return None
    return round(100.0*sum(x<=float(value) for x in vals)/len(vals),3)

def zrms(row,sex):
    z=[]
    for c in zcols:
        mu,sd=mu_sd[sex][c]; z.append((float(row[idx[c]])-mu)/sd)
    return (sum(x*x for x in z)/len(z))**.5
cases=[]
for order,(ri,cid,kind,label,why) in enumerate(selected):
    r=rows[ri]; sex=int(r[idx['sex']])
    target={m:float(r[idx[m]]) for m in measure24}
    hold={'torso_height':float(r[idx['torso_height']]),'upperleg_height':float(r[idx['upperleg_height']]),'weightkg':float(r[idx['weightkg']])}
    fr=float(r[idx['biacromial_breadth']])/float(r[idx['hip_breadth']]); lr=float(r[idx['crotch_height']])/float(r[idx['stature']])
    sx=[x for x in rows if int(x[idx['sex']])==sex]
    pct={
        'stature':percentile_le([x[idx['stature']] for x in sx],r[idx['stature']]),
        'weightkg':percentile_le([x[idx['weightkg']] for x in sx],r[idx['weightkg']]),
        'frameRatio':percentile_le([float(x[idx['biacromial_breadth']])/float(x[idx['hip_breadth']]) for x in sx],fr),
        'legRatio':percentile_le([float(x[idx['crotch_height']])/float(x[idx['stature']]) for x in sx],lr),
    }
    cases.append({
        'index':order,'id':cid,'kind':kind,'label':label,'selectionReason':why,'sourcePartition':'test','sourceRowIndex':ri,
        'sex':sex,'ageYears':int(round(float(r[idx['age']]))),'weightKg':float(r[idx['weightkg']]),
        'statureCm':float(r[idx['stature']]),'frameRatio':round(fr,6),'legRatio':round(lr,6),'multivariateZRms':round(zrms(r,sex),4),'observedPercentiles':pct,
        'targetMeasures24':target,'holdout':hold
    })
asset={
 'schema':'sammy-solver-v2-real-ansur-stress-suite-v1','appVersion':'0.8.26.0','source':{
   'dataset':'ANSUR II public anthropometric data','file':'ansur-prediction-test-v1.json','partition':'test','originalTestRows':len(rows),
   'statisticalBodyBankUsesHeldOutTest':False,
   'note':'These 10 observed held-out rows are deliberately consumed by the Real-ANSUR Stress Gate. They must be excluded from the later final Few-Measure prediction test.'
 },
 'selection':{
   'caseCount':len(cases),'typicalCount':sum(c['kind']=='typical' for c in cases),'edgeCount':sum(c['kind']=='edge' for c in cases),
   'maleCount':sum(c['sex']==0 for c in cases),'femaleCount':sum(c['sex']==1 for c in cases),
   'method':'deterministic observed-row suite: four low multivariate-z typical rows with age spread + six approximately 2nd/98th percentile observed edge profiles; no synthetic combination of independent extrema',
   'rowIndices':[x[0] for x in selected],
   'futurePredictionRule':'exclude these 10 row indices; use ansur-prediction-final-reserve-v1.json (902 untouched rows) for final few-measure validation'
 },
 'measureIds24':measure24,'holdoutIds':['torso_height','upperleg_height'],'contextHoldoutIds':['weightkg'],'sexReference':sexref,'cases':cases
}
json.dump(asset,open(base/'solver-v2-real-ansur-stress-suite-v1.json','w'),indent=2,ensure_ascii=False)
# final reserve of untouched rows
reserve=copy.deepcopy(d)
excluded=set(x[0] for x in selected)
reserve['schema']='sammy-ansur-prediction-final-reserve-v1'
reserve['version']='0.8.26.0'
reserve['partition']='test-final-reserve'
reserve['sourceOriginal']={'file':'ansur-prediction-test-v1.json','partition':'test','rowCount':len(rows)}
reserve['stressConsumption']={'suite':'solver-v2-real-ansur-stress-suite-v1.json','excludedRowIndices':sorted(excluded),'excludedCount':len(excluded),'remainingUntouchedCount':len(rows)-len(excluded)}
reserve['rows']=[r for i,r in enumerate(rows) if i not in excluded]
json.dump(reserve,open(base/'ansur-prediction-final-reserve-v1.json','w'),separators=(',',':'),ensure_ascii=False)
print('wrote suite',len(cases),'reserve',len(reserve['rows']))
for c in cases:
    print(c['index'],c['id'],'sex',c['sex'],'age',c['ageYears'],'stature',c['statureCm'],'kg',c['weightKg'],'zrms',c['multivariateZRms'])
