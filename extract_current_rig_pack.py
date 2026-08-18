#!/usr/bin/env python3
"""One-time current SOMA v0026 -> compact browser rig-pack extractor.

Standalone on purpose: it depends only on numpy/scipy/usd-core and reproduces the
specific official SOMA-X I/O/public-rig/RBF-position preparation needed by Soma-Lab.
"""
from __future__ import annotations

import hashlib, json, subprocess, sys
from pathlib import Path
import numpy as np
from scipy.linalg import lu_factor, lu_solve
from scipy.sparse import csc_matrix
from scipy.spatial.distance import cdist
from pxr import Usd, UsdGeom, UsdSkel

MID_CANDIDATES=("c_skin_mid","c_bodyRig_mid","c_skin")


def sha256(path:Path)->str:
 h=hashlib.sha256()
 with path.open("rb") as f:
  for chunk in iter(lambda:f.read(1024*1024),b""): h.update(chunk)
 return h.hexdigest()


def git_sha(repo:Path)->str:
 return subprocess.check_output(["git","-C",str(repo),"rev-parse","HEAD"],text=True).strip()


def world_to_local(world,parents):
 out=np.empty_like(world)
 for j,p in enumerate(parents): out[j]=np.linalg.inv(world[int(p)])@world[j]
 return out.astype(np.float32)


def local_to_world(local,parents):
 out=np.empty_like(local);out[0]=local[0]
 for j in range(1,len(local)): out[j]=out[int(parents[j])]@local[j]
 return out.astype(np.float32)


def mesh_has_skinning(prim):
 b=UsdSkel.BindingAPI(prim)
 return bool(b.GetJointIndicesPrimvar() and b.GetJointWeightsPrimvar())


def find_mid_skin(stage):
 meshes=[p for p in stage.Traverse() if p.IsA(UsdGeom.Mesh) and mesh_has_skinning(p)]
 by_name={p.GetPath().name:p for p in meshes}
 for n in MID_CANDIDATES:
  if n in by_name:return by_name[n]
 matches=[p for p in meshes if "mid" in p.GetPath().name.lower()]
 if matches:return sorted(matches,key=lambda p:(0 if "skin" in p.GetPath().name.lower() else 1,len(p.GetPath().name)))[0]
 raise RuntimeError("Kein skinned Mid-LOD-Mesh im Template-Rig gefunden. Vorhanden: "+", ".join(sorted(by_name)))


def load_mid_rig(path:Path):
 stage=Usd.Stage.Open(str(path))
 if not stage:raise RuntimeError(f"USD konnte nicht geöffnet werden: {path}")
 skel_prim=next((p for p in stage.Traverse() if p.IsA(UsdSkel.Skeleton)),None)
 if skel_prim is None:raise RuntimeError("Kein UsdSkel.Skeleton gefunden")
 skel=UsdSkel.Skeleton(skel_prim)
 joint_paths=[str(x) for x in skel.GetJointsAttr().Get()];J=len(joint_paths)
 bind_raw=skel.GetBindTransformsAttr().Get();rest_raw=skel.GetRestTransformsAttr().Get()
 if bind_raw is None or len(bind_raw)!=J:raise RuntimeError("bindTransforms fehlen/Count falsch")
 bind_usd=np.asarray(bind_raw,dtype=np.float32).reshape(J,4,4)
 bind_world=bind_usd.swapaxes(-2,-1).copy()
 rest_usd=np.asarray(rest_raw,dtype=np.float32).reshape(J,4,4) if rest_raw is not None else None
 t_local=rest_usd.swapaxes(-2,-1).copy() if rest_usd is not None else bind_world.copy()
 path_to_idx={p:i for i,p in enumerate(joint_paths)}
 parents=[]
 for p in joint_paths:
  parent=p.rsplit("/",1)[0] if "/" in p else "";parents.append(path_to_idx.get(parent,-1))
 parents=np.asarray(parents,dtype=np.int32);parents[parents<0]=0
 t_world=local_to_world(t_local,parents);bind_local=world_to_local(bind_world,parents)
 names=np.asarray([p.split("/")[-1] for p in joint_paths])

 skin_prim=find_mid_skin(stage);mesh=UsdGeom.Mesh(skin_prim)
 pts=mesh.GetPointsAttr().Get()
 if not pts:raise RuntimeError("Mid skin hat keine Punkte")
 bind_shape=np.asarray(pts,dtype=np.float32);V=len(bind_shape)
 binding=UsdSkel.BindingAPI(skin_prim);ji_pv=binding.GetJointIndicesPrimvar();jw_pv=binding.GetJointWeightsPrimvar();K=ji_pv.GetElementSize()
 ji=np.asarray(ji_pv.Get(),dtype=np.int32).reshape(V,K);jw=np.asarray(jw_pv.Get(),dtype=np.float32).reshape(V,K)
 skel_to_idx={name:i for i,name in enumerate(joint_paths)};binding_joints=binding.GetJointsAttr().Get()
 if binding_joints and len(binding_joints)>0: mapping=np.asarray([skel_to_idx.get(str(j),-1) for j in binding_joints],dtype=np.int32)
 else:mapping=np.arange(J,dtype=np.int32)
 vid=np.repeat(np.arange(V,dtype=np.int32),K);jid=mapping[ji.ravel()];wv=jw.ravel();valid=(wv>0)&(jid>=0)
 W=np.zeros((V,J),dtype=np.float32);np.add.at(W,(vid[valid],jid[valid]),wv[valid])
 return dict(joint_names=names,joint_parent_ids=parents,bind_pose_world=bind_world.astype(np.float32),bind_pose_local=bind_local,t_pose_world=t_world,t_pose_local=t_local.astype(np.float32),bind_shape=bind_shape,weights=W,skin_mesh_name=skin_prim.GetPath().name)


def derive_public(target,public_names):
 names=[str(x) for x in target["joint_names"]];name_to_idx={n:i for i,n in enumerate(names)}
 missing=[n for n in public_names if n not in name_to_idx]
 if missing:raise RuntimeError("Public Joints fehlen im Template: "+str(missing))
 keep=np.asarray([name_to_idx[n] for n in public_names],dtype=np.int64);keep_set=set(map(int,keep));remove=set(range(len(names)))-keep_set
 parents=np.asarray(target["joint_parent_ids"],dtype=np.int64);old_to_new={int(old):new for new,old in enumerate(keep)}
 def nearest_kept(old):
  p=int(parents[old])
  while p in remove and p!=int(parents[p]):p=int(parents[p])
  return p
 new_parents=np.zeros(len(keep),dtype=np.int32)
 for ni,old0 in enumerate(keep):
  old=int(old0);p=int(parents[old])
  if p==old:new_parents[ni]=ni;continue
  while p in remove and p!=int(parents[p]):p=int(parents[p])
  new_parents[ni]=old_to_new[p]
 W=target["weights"].copy()
 for rid in sorted(remove):W[:,nearest_kept(rid)]+=W[:,rid]
 W=W[:,keep]
 bw=target["bind_pose_world"][keep].copy();tw=target["t_pose_world"][keep].copy()
 return dict(joint_names=np.asarray(public_names),joint_parent_ids=new_parents,bind_pose_world=bw,bind_pose_local=world_to_local(bw,new_parents),t_pose_world=tw,t_pose_local=world_to_local(tw,new_parents),bind_shape=target["bind_shape"].copy(),weights=W.astype(np.float32))


def children(parents,j):return [i for i,p in enumerate(parents) if i!=j and int(p)==j]


def rbf_basis_weights(points,query):
 points=np.asarray(points,dtype=np.float32);query=np.asarray(query,dtype=np.float32);N=points.shape[0]
 if N==0:return np.zeros(0,dtype=np.float32)
 K=cdist(points,points,metric="euclidean").astype(np.float32);K.flat[::N+1]+=np.float32(1e-8)
 P=np.concatenate([np.ones((N,1),dtype=np.float32),points],axis=1);A=np.block([[K,P],[P.T,np.zeros((4,4),dtype=np.float32)]]).astype(np.float32)
 rhs=np.concatenate([np.linalg.norm(points-query[None,:],axis=1).astype(np.float32),np.asarray([1,*query],dtype=np.float32)])
 lu,piv=lu_factor(A,overwrite_a=True,check_finite=False);sol=lu_solve((lu,piv),rhs,check_finite=False)
 return sol[:N].astype(np.float32)


def precompute_public_rbf(bind_shape,W,parents,bind_world,excluded):
 mask=W>0;mask &= W[:,parents]>0
 zero=np.where(mask.sum(axis=0)==0)[0];mask[:,zero]=W[:,zero]>0;parents_cur=parents.copy()
 while len(zero)>1:
  mask[:,zero] |= W[:,parents_cur][:,zero]>0;zero=np.where(mask.sum(axis=0)==0)[0];new=parents[parents_cur]
  if np.array_equal(new,parents_cur):break
  parents_cur=new
 if np.array_equal(zero,np.asarray([0,1])):
  ch=children(parents,1)
  if ch:mask[:,1]=mask[:,ch].any(axis=1)
 if excluded.size:mask[excluded]=False
 values=[];cols=[];crow=[0]
 for j in range(len(parents)):
  if j==0:crow.append(crow[-1]);continue
  ids=np.where(mask[:,j])[0].astype(np.int32)
  if ids.size==0:raise RuntimeError(f"RBF Joint {j} hat keine Kontrollvertices")
  print(f"RBF {j:02d}/{len(parents)-1}: {ids.size} controls",flush=True)
  w=rbf_basis_weights(bind_shape[ids],bind_world[j,:3,3]);values.append(w);cols.append(ids);crow.append(crow[-1]+len(w))
 return np.concatenate(values).astype(np.float32),np.concatenate(cols).astype(np.int32),np.asarray(crow,dtype=np.int32)


def sparse_parts(W):
 m=csc_matrix(W);return m.data.astype(np.float32),m.indices.astype(np.int32),m.indptr.astype(np.int32),np.asarray(m.shape,dtype=np.int32)


def b(s):return np.frombuffer(str(s).encode("utf-8"),dtype=np.uint8).copy()


def main():
 if len(sys.argv)<3:raise SystemExit("Usage: extract_current_rig_pack.py <SOMA-X repo> <output.npz>")
 root=Path(sys.argv[1]).resolve();out=Path(sys.argv[2]).resolve();assets=root/"assets";rig_path=assets/"SOMA_template_rig.usda";core_path=assets/"SOMA_neutral.npz";proc_path=assets/"SOMA_procedural_transforms.json"
 for p in (rig_path,core_path,proc_path):
  if not p.exists():raise FileNotFoundError(p)
 print("Loading current v0026 USD ...",flush=True);target=load_mid_rig(rig_path)
 proc=json.loads(proc_path.read_text(encoding="utf-8"));public_names=proc["public_rig_derivation"]["main_joint_names"]
 print(f"Expanded target joints: {len(target['joint_names'])}; deriving {len(public_names)} public joints ...",flush=True);public=derive_public(target,public_names)
 with np.load(core_path,allow_pickle=False) as core:
  lod=np.asarray(core["lod_mid_to_low"],dtype=np.int64);eye=np.asarray(core["segment_eye_bags"],dtype=np.int64) if "segment_eye_bags" in core else np.zeros(0,dtype=np.int64);mouth=np.asarray(core["segment_mouth_bag"],dtype=np.int64) if "segment_mouth_bag" in core else np.zeros(0,dtype=np.int64)
 inverse=np.full(target["bind_shape"].shape[0],-1,dtype=np.int64);inverse[lod]=np.arange(len(lod));facial=inverse[np.concatenate([eye,mouth])] if eye.size+mouth.size else np.zeros(0,dtype=np.int64);facial=np.unique(facial[facial>=0]).astype(np.int32)
 target_bind_low=target["bind_shape"][lod].astype(np.float32);public_bind_low=public["bind_shape"][lod].astype(np.float32);target_W=target["weights"][lod].astype(np.float32);public_W=public["weights"][lod].astype(np.float32)
 print("Precomputing official linear-RBF joint-position matrix on Low LOD ...",flush=True);rbf_val,rbf_col,rbf_crow=precompute_public_rbf(public_bind_low,public_W,public["joint_parent_ids"],public["bind_pose_world"],facial)
 td,ti,tp,ts=sparse_parts(target_W);pd,pi,pp,ps=sparse_parts(public_W)
 target_names=[str(x) for x in target["joint_names"]];public_names=[str(x) for x in public["joint_names"]];tby={n:i for i,n in enumerate(target_names)};public_target=np.asarray([tby[n] for n in public_names],dtype=np.int32);pby={n:i for i,n in enumerate(public_names)};tparents=target["joint_parent_ids"];t2p=[]
 for idx in range(len(target_names)):
  cur=idx
  while target_names[cur] not in pby:
   nxt=int(tparents[cur]);
   if nxt==cur:break
   cur=nxt
  t2p.append(pby.get(target_names[cur],0))
 source=git_sha(root);arrays=dict(schema_version=b("soma-browser-current-rig-pack-v1"),source_git_sha=b(source),template_rig_sha256=b(sha256(rig_path)),lod_mid_to_low=lod.astype(np.int32),facial_excluded_low=facial,procedural_json_utf8=np.frombuffer(proc_path.read_bytes(),dtype=np.uint8).copy(),public_target_indices=public_target,target_to_public_indices=np.asarray(t2p,dtype=np.int32),target_joint_names_utf8=b("\n".join(target_names)),target_joint_parent_ids=target["joint_parent_ids"].astype(np.int32),target_bind_pose_world=target["bind_pose_world"].astype(np.float32),target_bind_pose_local=target["bind_pose_local"].astype(np.float32),target_t_pose_world=target["t_pose_world"].astype(np.float32),target_t_pose_local=target["t_pose_local"].astype(np.float32),target_bind_shape_low=target_bind_low,target_skinning_data=td,target_skinning_indices=ti,target_skinning_indptr=tp,target_skinning_shape=ts,public_joint_names_utf8=b("\n".join(public_names)),public_joint_parent_ids=public["joint_parent_ids"].astype(np.int32),public_bind_pose_world=public["bind_pose_world"].astype(np.float32),public_bind_pose_local=public["bind_pose_local"].astype(np.float32),public_t_pose_world=public["t_pose_world"].astype(np.float32),public_t_pose_local=public["t_pose_local"].astype(np.float32),public_bind_shape_low=public_bind_low,public_skinning_data=pd,public_skinning_indices=pi,public_skinning_indptr=pp,public_skinning_shape=ps,public_rbf_crow_indices=rbf_crow,public_rbf_col_indices=rbf_col,public_rbf_values=rbf_val,public_rbf_shape=np.asarray([len(public_names),len(lod)],dtype=np.int32))
 np.savez_compressed(out,**arrays)
 meta=dict(schema="soma-browser-current-rig-pack-v1",source_git_sha=source,template_rig_sha256=sha256(rig_path),template_rig_bytes=rig_path.stat().st_size,skin_mesh_name=target["skin_mesh_name"],target_joint_count=len(target_names),public_joint_count=len(public_names),low_vertex_count=len(lod),rbf_nnz=len(rbf_val),pack_bytes=out.stat().st_size,pack_sha256=sha256(out))
 if out.stat().st_size>95*1024*1024:raise RuntimeError(f"Pack zu groß für normalen Git-Commit: {out.stat().st_size/1048576:.1f} MB")
 out.with_suffix(".json").write_text(json.dumps(meta,indent=2),encoding="utf-8");print(json.dumps(meta,indent=2),flush=True)

if __name__=="__main__":main()
