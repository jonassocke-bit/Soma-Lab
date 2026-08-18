#!/usr/bin/env python3
"""Export Anny v0.6 as exact browser blendshape engine on canonical SOMA topology.

Outputs two NPZ files:
- low  : 4,505 vertices, startup/fit mode
- mid  : 18,056 vertices, visible/harness surface mode

The browser reconstructs the exact linear Anny rest mesh from template + blendshapes.
No PyTorch is needed on iPhone after this one-time GitHub Action.
"""
from __future__ import annotations

import hashlib, importlib.metadata, json, sys
from pathlib import Path
import numpy as np
import torch
import anny
from anny.models.model_data import PHENOTYPE_VARIATIONS
from anny.paths import get_anny_root_dir

ANNY_EXPECTED_SHA="72104cac8242d1735ec06433b65bec5e26953ce7"
SCHEMA="anny-soma-browser-exact-engine-v2"


def b(s: str) -> np.ndarray:
    return np.frombuffer(s.encode("utf-8"), dtype=np.uint8).copy()


def sha256(path: Path) -> str:
    h=hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda:f.read(1024*1024),b""):
            h.update(chunk)
    return h.hexdigest()


def category_metadata(local_labels: list[str]):
    path=Path(get_anny_root_dir())/"data/mpfb2/targets/target.json"
    mapping={}
    order=[]
    if path.exists():
        data=json.loads(path.read_text(encoding="utf-8"))
        for group_name,group in data.items():
            cat=str(group.get("label") or group_name)
            if cat not in order: order.append(cat)
            for item in group.get("categories",[]):
                candidates=[item.get("label"),item.get("name"),*(item.get("targets") or [])]
                for x in candidates:
                    if x in local_labels:
                        mapping[x]=cat
            for item in group.get("unsorted",[]):
                if isinstance(item,str) and item in local_labels:mapping[item]=cat
                elif isinstance(item,dict):
                    for x in [item.get("label"),item.get("name"),*(item.get("targets") or [])]:
                        if x in local_labels:mapping[x]=cat
    # Conservative readable fallback for any labels not represented in target.json.
    hints=["breast","buttocks","stomach","torso","arms","legs","hands","feet","neck","head","cheek","chin","ears","eyes","forehead","jaw","mouth","nose","genitals"]
    for label in local_labels:
        if label not in mapping:
            found=next((h for h in hints if h in label),"other")
            mapping[label]=found
            if found not in order:order.append(found)
    return mapping,order


def browser_coeffs(meta, mask: np.ndarray, params: dict[str,float], local_values: dict[str,float]):
    variation_names=meta["variation_names"]
    col={n:i for i,n in enumerate(variation_names)}
    vw=np.zeros(len(variation_names),dtype=np.float64)
    for feature in meta["variation_order"]:
        names=meta["phenotype_variations"][feature]
        if feature=="race":
            vals=np.asarray([max(0.0,params["african"]),max(0.0,params["asian"]),max(0.0,params["caucasian"])],dtype=np.float64)
            if vals.sum()<=1e-12:vals[:]=1/3
            else:vals/=vals.sum()
            for n,v in zip(names,vals):vw[col[n]]=v
        else:
            anchors=np.asarray(meta["anchors"][feature],dtype=np.float64)
            value=float(params[feature])
            w=np.zeros(len(anchors),dtype=np.float64)
            if value<=anchors[0]:w[0]=1
            elif value>=anchors[-1]:w[-1]=1
            else:
                i=int(np.searchsorted(anchors,value)-1);t=(value-anchors[i])/(anchors[i+1]-anchors[i]);w[i]=1-t;w[i+1]=t
            for n,v in zip(names,w):vw[col[n]]=v
    phen=np.prod(vw[None,:]*mask + (1-mask),axis=1)
    local=[]
    for label in meta["local_change_labels"]:
        v=float(local_values.get(label,0.0));local.extend([max(v,0.0),max(-v,0.0)])
    return np.concatenate([phen,np.asarray(local,dtype=np.float64)]).astype(np.float32)


def main():
    if len(sys.argv)!=4:
        raise SystemExit("Usage: extract_anny_soma_pack.py <rigpack.npz> <low_out.npz> <mid_out.npz>")
    rigpack=Path(sys.argv[1]).resolve();low_out=Path(sys.argv[2]).resolve();mid_out=Path(sys.argv[3]).resolve()
    with np.load(rigpack,allow_pickle=False) as rp:
        lod=np.asarray(rp["lod_mid_to_low"],dtype=np.int64)
    if lod.shape!=(4505,):raise RuntimeError(f"Unexpected SOMA low map {lod.shape}")

    print("Instantiate official Anny: rig='soma', topology='soma', phenotypes='all', local_changes='all'",flush=True)
    model=anny.Anny(rig="soma",topology="soma",pose_parameterization="local-ref",phenotypes="all",local_changes="all",facial_actions="none").to(device=torch.device("cpu"),dtype=torch.float32)
    model.eval()
    V=int(model.template_vertices.shape[0])
    if V!=18056:raise RuntimeError(f"Anny SOMA topology {V} vertices, expected 18056")

    phenotype_labels=list(model.phenotype_labels)
    local_labels=list(model.local_change_labels)
    blend_labels=list(model.blendshape_labels)
    mask=model.stacked_phenotype_blend_shapes_mask.detach().cpu().numpy().astype(np.uint8)
    P=int(mask.shape[0]);A=int(model.blendshapes.shape[0]);L=len(local_labels)
    if A!=P+2*L:
        raise RuntimeError(f"Blendshape contract changed: A={A}, phenotype={P}, local={L}; expected {P+2*L}")

    variation_order=list(PHENOTYPE_VARIATIONS.keys())
    variations={k:list(v) for k,v in PHENOTYPE_VARIATIONS.items()}
    variation_names=[n for k in variation_order for n in variations[k]]
    if mask.shape[1]!=len(variation_names):raise RuntimeError(f"Mask columns {mask.shape[1]} vs variation names {len(variation_names)}")
    anchors={}
    for feature in ["gender","age","muscle","weight","height","proportions","cupsize","firmness"]:
        anchors[feature]=model.anchors[feature].detach().cpu().numpy().astype(float).tolist()
    categories,category_order=category_metadata(local_labels)
    meta=dict(schema=SCHEMA,source_git_sha=ANNY_EXPECTED_SHA,anny_version=importlib.metadata.version("anny"),topology="soma",coordinate_system="meters,+Y up",phenotype_labels=phenotype_labels,variation_order=variation_order,phenotype_variations=variations,variation_names=variation_names,anchors=anchors,phenotype_blendshape_count=P,blendshape_count=A,local_change_labels=local_labels,local_change_categories=categories,category_order=category_order)

    # Anny is Z-up; current Soma-Lab renderer/runtime is Y-up. This is the same
    # axis conversion used by Anny's own SOMA parity test.
    Pmat=torch.tensor([[1.,0.,0.],[0.,0.,1.],[0.,-1.,0.]],dtype=torch.float32)
    template=(model.template_vertices.detach().cpu()@Pmat.T).numpy().astype(np.float32)
    blend=(model.blendshapes.detach().cpu()@Pmat.T).numpy().astype(np.float32)

    height=float(template[:,1].max()-template[:,1].min())
    if not (0.8<height<2.6):raise RuntimeError(f"Unit sanity failed: template height {height:.4f}")

    # Verify our browser coefficient implementation against official Anny on a
    # mixed phenotype + one local modifier before writing files.
    params={"gender":1.0,"age":0.67,"muscle":0.23,"weight":0.81,"height":0.42,"proportions":0.31,"cupsize":0.76,"firmness":0.62,"african":0.2,"asian":0.3,"caucasian":0.5}
    local_values={local_labels[0]:0.37} if local_labels else {}
    coeff=browser_coeffs(meta,mask.astype(np.float64),params,local_values)
    recon=template+np.einsum("a,avc->vc",coeff,blend,optimize=True)
    with torch.no_grad():
        official=model(phenotype_kwargs={k:torch.tensor([v],dtype=torch.float32) for k,v in params.items()},local_changes_kwargs={k:torch.tensor([v],dtype=torch.float32) for k,v in local_values.items()})["rest_vertices"][0]
        official=(official.cpu()@Pmat.T).numpy()
    maxerr=float(np.max(np.abs(recon-official)))
    if maxerr>2e-5:raise RuntimeError(f"Browser coefficient parity failed: max {maxerr}")
    print(f"Browser coefficient parity max error: {maxerr:.3e}",flush=True)

    common=dict(meta_utf8=b(json.dumps(meta,separators=(",",":"))),phenotype_mask=mask,blendshape_labels_utf8=b("\n".join(blend_labels)),lod_mid_to_low=lod.astype(np.int32))
    low_template=template[lod];low_blend=blend[:,lod,:]
    np.savez_compressed(low_out,**common,template_vertices=low_template,blendshapes=low_blend)
    np.savez_compressed(mid_out,**common,template_vertices=template,blendshapes=blend)

    for path,lodname,count in [(low_out,"low",4505),(mid_out,"mid",18056)]:
        if path.stat().st_size>95*1024*1024:raise RuntimeError(f"{lodname} pack too large for normal Git commit: {path.stat().st_size/1048576:.1f} MB")
        manifest=dict(schema=SCHEMA,lod=lodname,source_git_sha=ANNY_EXPECTED_SHA,anny_version=meta["anny_version"],vertex_count=count,blendshape_count=A,phenotype_blendshape_count=P,local_change_count=L,browser_parity_max_abs=maxerr,pack_bytes=path.stat().st_size,pack_sha256=sha256(path))
        path.with_suffix(".json").write_text(json.dumps(manifest,indent=2),encoding="utf-8")
        print(json.dumps(manifest,indent=2),flush=True)

if __name__=="__main__":main()
