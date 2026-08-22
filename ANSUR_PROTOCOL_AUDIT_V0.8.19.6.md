# SAMMY ANSUR Protocol Audit · v0.8.19.6

## Scope
Incremental update from v0.8.19.5. MEAS remains the geometry source; PROT remains the ANSUR review/audit layer.

## Implemented
- Comment popup: explicit pointer/touch ownership and 16 px textarea on mobile, so canvas picking/orbit cannot steal text entry.
- Unified header XYZ editor for both landmarks and measures.
- Landmark direct placement: tap target on current mannequin, snap only inside the landmark's strict region; mirrored landmark groups store a canonical lateral offset and update the opposite side symmetrically.
- Dynamic-search marker `d` for: ankle min, calf max, buttock max, hip-breadth upper-pelvis max, neck-base transition, upper-arm max proxy, forearm max proxy.
- Dynamic search zone is rendered only for the currently selected dynamic measure.
- Strict arbitrary-plane (`P`) region slicing added, so arm-circumference proxy loops cannot fall back to whole-body geometry.
- Visible ANSUR reference crops moved to one atlas (`ansur-crops-atlas.jpg` + JSON); full source pages remain only in `ANSUR_SOURCE_PAGES.zip`.

## ANSUR II measure scope
The handbook defines 94 directly measured dimensions. Full mapping audit is included as `ANSUR_II_94_MEASURE_MAPPING_V0.8.19.6.json` / `.md`.

Current mapping result:
- 22 direct MEAS mappings
- 2 explicit protocol-mismatch proxies
- 70 not implemented in MEAS

PROT continues to show only ANSUR-II dimension concepts that currently have a MEAS implementation/proxy. Sammy-only derived `torso_height` and `upperleg_height` were removed from PROT.

### Added ANSUR concepts
- `Biceps Circumference, Flexed` → MEAS `upperarm_circumference` **proxy**. ANSUR requires right arm forward, elbow ~90°, clenched fist/maximal flexion. Current MEAS searches a dynamic upper-arm maximum and is not claimed equivalent.
- `Forearm Circumference, Flexed` → MEAS `forearm_circumference` **proxy**. ANSUR measures at the elbow crease in the flexed-arm protocol. Current MEAS dynamic forearm maximum is not claimed equivalent.

## Static validation
- Protocol dimensions: 24 / 24 unique.
- PROT derived Sammy-only dimensions: 0.
- PROT IDs missing from MEAS: 0.
- Full ANSUR mapping: 94 / 94 entries.
- Crop atlas: 42 / 42 referenced crop keys present.
- Strict body-region policy retained; whole-body is used only for Stature.
- JavaScript syntax: `node --check app.js` passes.
- Final GitHub package: flat root, no individual `crop-*.jpg` or `ansur-page-*.jpg` files.
