#!/usr/bin/env python3
"""Build a Mixamo bridge FBX from the canonical SOMA public-78 rig.

Run inside Blender:
  blender --background --factory-startup --python build_sammy_mixamo_bridge.py -- \
    --rigpack soma_current_rig_pack_v0026.npz \
    --core .soma-upstream/assets/SOMA_neutral.npz \
    --out mixamo_bridge/Sammy_Mixamo_Bridge.fbx

The output intentionally uses only the public 78-joint contract. The internal
122-joint SOMA target/twist rig remains a Sammy runtime detail.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import sys
from pathlib import Path

import bpy
import numpy as np
from mathutils import Vector

BRIDGE_VERSION = "sammy-mixamo-bridge-v1"
EXPECTED_PUBLIC_JOINTS = 78
EXPECTED_VERTICES = 4505


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def decode_utf8(a: np.ndarray) -> str:
    return bytes(np.asarray(a, dtype=np.uint8).tolist()).decode("utf-8")


def decode_names(a: np.ndarray) -> list[str]:
    text = decode_utf8(a)
    # Support the original legacy pack separator as well as current real LF.
    names = text.split("\n") if "\n" in text else text.split("\\n")
    return [x.strip() for x in names if x.strip()]


def y_up_to_blender_z_up(v: np.ndarray) -> np.ndarray:
    """Right-handed +90 deg X rotation: (x,y,z) -> (x,-z,y)."""
    out = np.empty_like(v, dtype=np.float64)
    out[..., 0] = v[..., 0]
    out[..., 1] = -v[..., 2]
    out[..., 2] = v[..., 1]
    return out


def choose_tail(j: int, names: list[str], parents: np.ndarray, heads: np.ndarray) -> np.ndarray:
    name = names[j]
    preferred = {
        "Root": "Hips",
        "Hips": "Spine1",
        "Spine1": "Spine2",
        "Spine2": "Chest",
        "Chest": "Neck1",
        "Neck1": "Neck2",
        "Neck2": "Head",
        "Head": "HeadEnd",
        "LeftShoulder": "LeftArm",
        "LeftArm": "LeftForeArm",
        "LeftForeArm": "LeftHand",
        "LeftHand": "LeftHandMiddle1",
        "RightShoulder": "RightArm",
        "RightArm": "RightForeArm",
        "RightForeArm": "RightHand",
        "RightHand": "RightHandMiddle1",
        "LeftLeg": "LeftShin",
        "LeftShin": "LeftFoot",
        "LeftFoot": "LeftToeBase",
        "LeftToeBase": "LeftToeEnd",
        "RightLeg": "RightShin",
        "RightShin": "RightFoot",
        "RightFoot": "RightToeBase",
        "RightToeBase": "RightToeEnd",
    }
    by_name = {n: i for i, n in enumerate(names)}
    if preferred.get(name) in by_name:
        c = by_name[preferred[name]]
        d = heads[c] - heads[j]
        if np.linalg.norm(d) > 1e-5:
            return heads[c].copy()

    children = [i for i, p in enumerate(parents) if i != j and int(p) == j]
    # For finger chains and most simple bones the first child is exactly the
    # desired endpoint. For branching joints the preferred table handles the
    # important torso/hand cases above.
    for c in children:
        d = heads[c] - heads[j]
        if np.linalg.norm(d) > 1e-5:
            return heads[c].copy()

    # Leaf: continue the parent direction by a short visible bone length.
    p = int(parents[j])
    if 0 <= p < len(names) and p != j:
        d = heads[j] - heads[p]
    else:
        d = np.array([0.0, 0.0, 1.0], dtype=np.float64)
    ln = float(np.linalg.norm(d))
    if ln < 1e-5:
        d = np.array([0.0, 0.0, 1.0], dtype=np.float64)
        ln = 1.0
    d /= ln
    return heads[j] + d * max(0.018, min(0.06, ln * 0.35))


def main() -> None:
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    ap = argparse.ArgumentParser()
    ap.add_argument("--rigpack", required=True)
    ap.add_argument("--core", required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args(argv)

    rig_path = Path(args.rigpack).resolve()
    core_path = Path(args.core).resolve()
    out_path = Path(args.out).resolve()
    out_path.parent.mkdir(parents=True, exist_ok=True)

    if not rig_path.exists():
        raise FileNotFoundError(rig_path)
    if not core_path.exists():
        raise FileNotFoundError(core_path)

    with np.load(rig_path, allow_pickle=False) as rp:
        names = decode_names(rp["public_joint_names_utf8"])
        parents = np.asarray(rp["public_joint_parent_ids"], dtype=np.int32)
        bind_world = np.asarray(rp["public_bind_pose_world"], dtype=np.float64).reshape(-1, 4, 4)
        vertices_cm = np.asarray(rp["public_bind_shape_low"], dtype=np.float64).reshape(-1, 3)
        skin_data = np.asarray(rp["public_skinning_data"], dtype=np.float64)
        skin_indices = np.asarray(rp["public_skinning_indices"], dtype=np.int32)
        skin_indptr = np.asarray(rp["public_skinning_indptr"], dtype=np.int32)
        skin_shape = tuple(map(int, np.asarray(rp["public_skinning_shape"]).tolist()))
        source_sha = decode_utf8(rp["source_git_sha"]) if "source_git_sha" in rp else "unknown"

    if len(names) != EXPECTED_PUBLIC_JOINTS:
        raise RuntimeError(f"Public rig has {len(names)} joints, expected {EXPECTED_PUBLIC_JOINTS}")
    if vertices_cm.shape != (EXPECTED_VERTICES, 3):
        raise RuntimeError(f"Bind shape {vertices_cm.shape}, expected ({EXPECTED_VERTICES},3)")
    if skin_shape != (EXPECTED_VERTICES, EXPECTED_PUBLIC_JOINTS):
        raise RuntimeError(f"Skinning shape {skin_shape}, expected {(EXPECTED_VERTICES, EXPECTED_PUBLIC_JOINTS)}")

    with np.load(core_path, allow_pickle=False) as core:
        if "triangles_low" not in core:
            raise RuntimeError("SOMA_neutral.npz does not contain triangles_low")
        faces = np.asarray(core["triangles_low"], dtype=np.int64).reshape(-1, 3)

    if faces.min() < 0 or faces.max() >= EXPECTED_VERTICES:
        raise RuntimeError(f"triangles_low references vertex range {faces.min()}..{faces.max()}")

    # SOMA rig-pack coordinates are centimeters and Y-up. Build in meters,
    # centered horizontally with feet on the ground before Blender's Z-up scene.
    vertices_src = vertices_cm / 100.0
    joints_src = bind_world[:, :3, 3] / 100.0
    ground_y = float(vertices_src[:, 1].min())
    center_x = float((vertices_src[:, 0].min() + vertices_src[:, 0].max()) * 0.5)
    center_z = float((vertices_src[:, 2].min() + vertices_src[:, 2].max()) * 0.5)
    shift_src = np.array([-center_x, -ground_y, -center_z], dtype=np.float64)
    vertices_src = vertices_src + shift_src
    joints_src = joints_src + shift_src

    vertices = y_up_to_blender_z_up(vertices_src)
    heads = y_up_to_blender_z_up(joints_src)

    # Clean deterministic scene.
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (bpy.data.meshes, bpy.data.armatures, bpy.data.materials):
        pass

    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0
    scene.render.fps = 30

    # Mesh.
    mesh_data = bpy.data.meshes.new("Sammy_Bridge_Body")
    mesh_data.from_pydata(vertices.tolist(), [], faces.tolist())
    mesh_data.update(calc_edges=False)
    mesh_obj = bpy.data.objects.new("Sammy_Mixamo_Bridge_Body", mesh_data)
    bpy.context.collection.objects.link(mesh_obj)
    for poly in mesh_data.polygons:
        poly.use_smooth = True

    mat = bpy.data.materials.new("Sammy_Bridge_Gray")
    mat.diffuse_color = (0.55, 0.58, 0.63, 1.0)
    mesh_data.materials.append(mat)

    # Public-78 armature only.
    arm_data = bpy.data.armatures.new("Sammy_SOMA_Public78")
    arm_obj = bpy.data.objects.new("Sammy_SOMA_Public78", arm_data)
    bpy.context.collection.objects.link(arm_obj)
    arm_obj["SammyBridgeVersion"] = BRIDGE_VERSION
    arm_obj["SammySourceRig"] = "NVlabs/SOMA-X public 78"
    arm_obj["SammySourceRigSHA"] = source_sha
    arm_obj["SammyRuntimeTargetRig"] = "122 internal joints generated inside Sammy; not exported to Mixamo"

    bpy.context.view_layer.objects.active = arm_obj
    arm_obj.select_set(True)
    mesh_obj.select_set(False)
    bpy.ops.object.mode_set(mode="EDIT")

    ebones = []
    tails = []
    for j, name in enumerate(names):
        eb = arm_data.edit_bones.new(name)
        h = heads[j]
        t = choose_tail(j, names, parents, heads)
        if np.linalg.norm(t - h) < 1e-5:
            t = h + np.array([0.0, 0.0, 0.03])
        eb.head = Vector(map(float, h))
        eb.tail = Vector(map(float, t))
        eb.roll = 0.0
        eb.use_deform = True
        ebones.append(eb)
        tails.append(np.asarray(t, dtype=np.float64))

    for j, eb in enumerate(ebones):
        p = int(parents[j])
        if j != 0 and 0 <= p < len(ebones) and p != j:
            eb.parent = ebones[p]
            eb.use_connect = False

    bpy.ops.object.mode_set(mode="OBJECT")

    # Preserve original public joint index as an FBX custom property where the
    # exporter supports it. This gives the later importer another recognition aid.
    for j, name in enumerate(names):
        bone = arm_data.bones.get(name)
        if bone is not None:
            bone["SomaPublicIndex"] = j

    # Skinning: pack is CSC [vertices x joints]. Assign every positive weight.
    for j, name in enumerate(names):
        vg = mesh_obj.vertex_groups.new(name=name)
        start, end = int(skin_indptr[j]), int(skin_indptr[j + 1])
        for p in range(start, end):
            v = int(skin_indices[p])
            w = float(skin_data[p])
            if w > 1e-10:
                vg.add([v], w, "REPLACE")

    arm_mod = mesh_obj.modifiers.new(name="Sammy_SOMA_Public78", type="ARMATURE")
    arm_mod.object = arm_obj
    arm_mod.use_vertex_groups = True
    mesh_obj.parent = arm_obj
    mesh_obj.matrix_parent_inverse = arm_obj.matrix_world.inverted()

    mesh_obj["SammyBridgeVersion"] = BRIDGE_VERSION
    mesh_obj["SammyPurpose"] = "Upload this rigged bridge character to Mixamo; download animation with skin for first roundtrip test"

    # Select only the two intended objects: Adobe explicitly warns against extra
    # scene objects for character processing.
    bpy.ops.object.select_all(action="DESELECT")
    arm_obj.select_set(True)
    mesh_obj.select_set(True)
    bpy.context.view_layer.objects.active = arm_obj

    bpy.ops.export_scene.fbx(
        filepath=str(out_path),
        check_existing=False,
        use_selection=True,
        global_scale=1.0,
        apply_unit_scale=True,
        apply_scale_options="FBX_SCALE_UNITS",
        use_space_transform=True,
        bake_space_transform=False,
        object_types={"ARMATURE", "MESH"},
        use_mesh_modifiers=True,
        mesh_smooth_type="FACE",
        use_subsurf=False,
        use_mesh_edges=False,
        add_leaf_bones=False,
        primary_bone_axis="Y",
        secondary_bone_axis="X",
        use_armature_deform_only=False,
        armature_nodetype="LIMBNODE",
        bake_anim=False,
        path_mode="AUTO",
        embed_textures=False,
        axis_forward="-Z",
        axis_up="Y",
        use_custom_props=True,
    )

    if not out_path.exists() or out_path.stat().st_size < 100_000:
        raise RuntimeError(f"FBX output missing or implausibly small: {out_path}")

    manifest = {
        "schema": BRIDGE_VERSION,
        "source_rig_sha": source_sha,
        "source_rig_pack_sha256": sha256(rig_path),
        "source_core_sha256": sha256(core_path),
        "fbx_sha256": sha256(out_path),
        "fbx_bytes": out_path.stat().st_size,
        "vertex_count": int(vertices.shape[0]),
        "triangle_count": int(faces.shape[0]),
        "public_joint_count": len(names),
        "joint_names": names,
        "joint_parent_ids": parents.astype(int).tolist(),
        "source_to_bridge_shift_m_yup": shift_src.tolist(),
        "source_coordinate_system": "SOMA browser contract: meters, +Y up",
        "blender_build_coordinate_system": "meters, +Z up; vector map (x,y,z)->(x,-z,y)",
        "fbx_export_axis": {"up": "+Y", "forward": "-Z"},
        "source_public_bind_pose_world_m": (bind_world / np.array([[[1,1,1,100],[1,1,1,100],[1,1,1,100],[1,1,1,1]]], dtype=np.float64)).reshape(len(names),16).tolist(),
        "bridge_heads_blender_m": heads.tolist(),
        "bridge_tails_blender_m": np.asarray(tails).tolist(),
        "notes": [
            "Only public 78 SOMA joints are exported.",
            "Internal 122-joint/twist topology is regenerated in Sammy after motion import.",
            "First Mixamo roundtrip should be downloaded WITH SKIN, FBX Binary, 30 fps, keyframe reduction None, preferably In Place.",
        ],
    }
    manifest_path = out_path.with_name(out_path.stem + "_manifest.json")
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    print(json.dumps({
        "fbx": str(out_path),
        "bytes": out_path.stat().st_size,
        "sha256": manifest["fbx_sha256"],
        "joints": len(names),
        "vertices": int(vertices.shape[0]),
        "triangles": int(faces.shape[0]),
        "manifest": str(manifest_path),
    }, indent=2))


if __name__ == "__main__":
    main()
