#!/usr/bin/env python3
from __future__ import annotations
import json, sys
from pathlib import Path
import numpy as np
import torch
import anny
import anny.utils.kinematics as kinematics

ANNY_SHA="72104cac8242d1735ec06433b65bec5e26953ce7"
P=np.asarray([[1.,0.,0.],[0.,0.,1.],[0.,-1.,0.]],dtype=np.float32)
P4=np.eye(4,dtype=np.float32);P4[:3,:3]=P
P4_INV=P4.T

def main():
    if len(sys.argv)!=3:
        raise SystemExit("Usage: pose_oracle.py pose_probe_input.json pose_probe_oracle.json")
    inp,out=Path(sys.argv[1]),Path(sys.argv[2])
    probe=json.loads(inp.read_text(encoding="utf-8"))
    if probe.get("schema")!="sammy-pose-probe-v1":
        raise RuntimeError(f"Unexpected probe schema: {probe.get('schema')}")
    coeff=np.asarray(probe["blendshape_coeffs"],dtype=np.float32)
    abs_y=np.asarray(probe["intended_absolute_orientations_y"],dtype=np.float32).reshape(78,3,3)
    ground=float(probe["shape"].get("ground_offset_y",0.0))

    model=anny.Anny(
        rig="soma",topology="soma",pose_parameterization="world-orient",
        phenotypes="all",local_changes="all",facial_actions="none",
        skinning_method="lbs",
    ).to(device=torch.device("cpu"),dtype=torch.float32).eval()
    if list(model.bone_labels)!=list(probe["bone_labels"]):
        raise RuntimeError("Probe bone labels do not match official Anny SOMA-78 labels")

    c=torch.from_numpy(coeff[None])
    rest=model.get_rest_model(c)
    abs_z=np.einsum("ij,bjk->bik",P.T,abs_y).astype(np.float32)
    abs_z_t=torch.from_numpy(abs_z[None])

    with torch.no_grad():
        poses_z,transforms_z=kinematics.parallel_forward_kinematic_absolute_orientations(
            model.kinematic_propagation_fronts,
            rest_bone_poses=rest["rest_bone_poses"],
            absolute_orientations=abs_z_t,
            base_transform=None,
        )
        verts_z=model.get_skinned_vertices(rest["rest_vertices"],transforms_z)

    poses_z=poses_z[0].cpu().numpy()
    transforms_z=transforms_z[0].cpu().numpy()
    verts_z=verts_z[0].cpu().numpy()

    poses_y=np.einsum("ij,bjk->bik",P4,poses_z)
    poses_display_y=poses_y.copy();poses_display_y[:,1,3]+=ground
    transforms_y=np.einsum("ij,bjk,kl->bil",P4,transforms_z,P4_INV)
    verts_y=verts_z@P.T
    verts_display_y=verts_y.copy();verts_display_y[:,1]+=ground

    result={
        "schema":"sammy-pose-oracle-v1",
        "probe_id":probe["probe_id"],
        "source":probe["source"],
        "anny_git_sha":ANNY_SHA,
        "method":"official Anny get_rest_model + parallel_forward_kinematic_absolute_orientations + LBS",
        "bone_labels":list(model.bone_labels),
        "oracle_bone_poses_display_y":poses_display_y.reshape(-1).astype(float).tolist(),
        "oracle_skin_transforms_y":transforms_y.reshape(-1).astype(float).tolist(),
        "oracle_vertices_display_y":verts_display_y.reshape(-1).astype(float).tolist(),
    }
    out.write_text(json.dumps(result,separators=(",",":")),encoding="utf-8")
    print(f"Wrote {out} · {len(model.bone_labels)} bones · {len(verts_display_y)} vertices")

if __name__=="__main__":
    main()
