#!/usr/bin/env python3
"""
Generate a compact Anny-v0.6 identity grid on canonical SOMA topology.

This is intentionally NOT a new rig runtime. It bakes only rest-shape geometry
for a small set of native Anny phenotype dimensions. Soma-Lab then feeds those
rest vertices into its existing SOMA v0026 rig/rebind/LBS path.

Pinned Anny source:
72104cac8242d1735ec06433b65bec5e26953ce7
"""
from __future__ import annotations

import hashlib, importlib.metadata, itertools, json, sys
from pathlib import Path
import numpy as np
import torch
import anny

ANNY_EXPECTED_SHA="72104cac8242d1735ec06433b65bec5e26953ce7"

GENDER=np.asarray([0.0,1.0],dtype=np.float32)
HEIGHT=np.asarray([0.0,1.0],dtype=np.float32)
WEIGHT=np.asarray([0.0,0.5,1.0],dtype=np.float32)
MUSCLE=np.asarray([0.0,0.5,1.0],dtype=np.float32)
PROPORTIONS=np.asarray([0.0,1.0],dtype=np.float32)
CUPSIZE=np.asarray([0.0,0.5,1.0],dtype=np.float32)

# Kept fixed only for the first integration proof.
FIXED_AGE=np.float32(2.0/3.0)   # Anny tutorial's young-adult region
FIXED_FIRMNESS=np.float32(0.5)
FIXED_RACE=np.float32(0.5)      # equal values -> normalized to 1/3 each by Anny

def b(s:str)->np.ndarray:
    return np.frombuffer(s.encode("utf-8"),dtype=np.uint8).copy()

def sha256(path:Path)->str:
    h=hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda:f.read(1024*1024),b""):
            h.update(chunk)
    return h.hexdigest()

def main():
    if len(sys.argv)!=3:
        raise SystemExit("Usage: extract_anny_soma_pack.py <existing soma_current_rig_pack_v0026.npz> <output.npz>")
    rigpack=Path(sys.argv[1]).resolve()
    out=Path(sys.argv[2]).resolve()
    if not rigpack.exists():
        raise FileNotFoundError(f"Existing SOMA browser rig pack missing: {rigpack}")

    with np.load(rigpack,allow_pickle=False) as rp:
        lod=np.asarray(rp["lod_mid_to_low"],dtype=np.int64)
    if lod.shape!=(4505,):
        raise RuntimeError(f"Unexpected SOMA low map {lod.shape}; expected (4505,)")

    print("Instantiate official Anny v0.6 path: rig='soma', topology='soma' ...",flush=True)
    model=anny.Anny(
        rig="soma",
        topology="soma",
        pose_parameterization="local-ref",
        phenotypes="all",
        local_changes="none",
        facial_actions="none",
    ).to(device=torch.device("cpu"),dtype=torch.float32)
    model.eval()

    labels=list(model.phenotype_labels)
    required={"gender","age","muscle","weight","height","proportions","cupsize","firmness","african","asian","caucasian"}
    missing=sorted(required-set(labels))
    if missing:
        raise RuntimeError(f"Anny phenotype labels changed; missing {missing}. Available: {labels}")

    V=int(model.template_vertices.shape[0])
    if V!=18056:
        raise RuntimeError(f"Anny SOMA topology vertex count {V}; expected canonical SOMA mid 18056")
    if int(lod.max())>=V:
        raise RuntimeError("SOMA low map exceeds Anny SOMA vertex count")

    combos=list(itertools.product(range(2),range(2),range(3),range(3),range(2),range(3)))
    N=len(combos)
    print(f"Generate {N} native Anny anchor combinations in chunks ...",flush=True)

    all_low=np.empty((N,len(lod),3),dtype=np.float32)
    batch_size=24

    # Official Anny geometry is Z-up. Current SOMA browser/runtime is Y-up.
    # Same transform used by Anny's own test_soma.py for comparison with SOMA-X.
    P=torch.tensor([[1.0,0.0,0.0],[0.0,0.0,1.0],[0.0,-1.0,0.0]],dtype=torch.float32)

    for start in range(0,N,batch_size):
        chunk=combos[start:start+batch_size]
        B=len(chunk)
        params={name:torch.full((B,),0.5,dtype=torch.float32) for name in labels}
        params["age"].fill_(float(FIXED_AGE))
        params["firmness"].fill_(float(FIXED_FIRMNESS))
        for race in ("african","asian","caucasian"):
            params[race].fill_(float(FIXED_RACE))
        for row,(ig,ih,iw,im,ip,ic) in enumerate(chunk):
            params["gender"][row]=float(GENDER[ig])
            params["height"][row]=float(HEIGHT[ih])
            params["weight"][row]=float(WEIGHT[iw])
            params["muscle"][row]=float(MUSCLE[im])
            params["proportions"][row]=float(PROPORTIONS[ip])
            params["cupsize"][row]=float(CUPSIZE[ic])

        with torch.no_grad():
            result=model(phenotype_kwargs=params)
            rest=result["rest_vertices"].to(dtype=torch.float32)
            if rest.ndim!=3 or rest.shape[1:]!=(V,3):
                raise RuntimeError(f"Unexpected Anny rest_vertices shape {tuple(rest.shape)}")
            yup=rest@P.T
            low=yup[:,torch.as_tensor(lod,dtype=torch.long),:].cpu().numpy().astype(np.float32)
        all_low[start:start+B]=low
        print(f"  {start+B:3d}/{N}",flush=True)

    # Hard unit sanity check: do not silently guess units.
    heights=all_low[:,:,1].max(axis=1)-all_low[:,:,1].min(axis=1)
    med=float(np.median(heights))
    if not (0.8<med<2.6):
        raise RuntimeError(f"Anny/SOMA unit sanity failed: median body height {med:.4f}. Expected meters after Y-up conversion.")

    grid=all_low.reshape(2,2,3,3,2,3,len(lod),3)
    version=importlib.metadata.version("anny")
    arrays=dict(
        schema_version=b("anny-soma-browser-identity-grid-v1"),
        source_git_sha=b(ANNY_EXPECTED_SHA),
        anny_version=b(version),
        topology=b("soma"),
        coordinate_system=b("SOMA browser: meters, +Y up"),
        gender_anchors=GENDER,
        height_anchors=HEIGHT,
        weight_anchors=WEIGHT,
        muscle_anchors=MUSCLE,
        proportions_anchors=PROPORTIONS,
        cupsize_anchors=CUPSIZE,
        fixed_age=np.asarray([FIXED_AGE],dtype=np.float32),
        fixed_firmness=np.asarray([FIXED_FIRMNESS],dtype=np.float32),
        fixed_race=np.asarray([FIXED_RACE,FIXED_RACE,FIXED_RACE],dtype=np.float32),
        lod_mid_to_low=lod.astype(np.int32),
        grid_rest_low=grid.astype(np.float32),
        height_range_m=np.asarray([float(heights.min()),float(heights.max())],dtype=np.float32),
    )
    np.savez_compressed(out,**arrays)

    meta=dict(
        schema="anny-soma-browser-identity-grid-v1",
        source_git_sha=ANNY_EXPECTED_SHA,
        anny_version=version,
        topology="soma",
        low_vertex_count=int(len(lod)),
        grid_shape=list(grid.shape),
        rest_shape_count=N,
        fixed_age=float(FIXED_AGE),
        fixed_firmness=float(FIXED_FIRMNESS),
        height_range_m=[float(heights.min()),float(heights.max())],
        pack_bytes=out.stat().st_size,
        pack_sha256=sha256(out),
    )
    out.with_suffix(".json").write_text(json.dumps(meta,indent=2),encoding="utf-8")
    print(json.dumps(meta,indent=2),flush=True)

if __name__=="__main__":
    main()
