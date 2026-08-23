# ANSUR PROTOCOL AUDIT · v0.8.19.9 focused geometry pass

## Scope
This pass intentionally changes only the four geometry families confirmed in the 2026-08-23 screenshot review. Previously green, unrelated measurements are not redesigned.

## 1 · Neck Circumference + Neck Circumference, Base
- Both circumference planes can be tilted in PROT.
- For the two neck measures, `Neigung` rotates the complete plane about the anatomical left-right axis through the neck/body centre; the obsolete second arbitrary tilt axis is hidden.
- Existing XYZ plane offset remains available.

**Audit:** side view; verify the entire ring tilts coherently and remains a single plane.

## 2 · Shoulder Length
- Exact endpoints: Trapezius R → Acromion R.
- The X/Y projection is mathematically straight between both landmarks.
- Only depth follows the skin surface, so the tape remains a surface distance without the previous nearest-vertex zig-zag.

**Audit:** check from front/back/3-4 view: no saw-tooth path, endpoints exactly on the two landmarks.

## 3 · Waist Back Length (Omphalion)
- Exact top endpoint: canonical Cervicale.
- Bottom: Waist (Omphalion), posterior level.
- Posterior projection is vertically straight; depth follows the body contour.
- The previously approved Cervicale calibration `[0, +8.0, -10.941] cm` is promoted into the canonical landmark and converted out of legacy local audit offsets on migration.

**Audit:** back view must be a straight vertical projection ending exactly at the Cervicale point.

## 4 · Buttock lateral / Hip Breadth
- One source of truth: the horizontal Buttock-Circumference slice at maximum posterior buttock protrusion.
- Buttock lateral L/R = exact lateral extrema of this slice.
- Hip Breadth = horizontal X distance between those exact two extrema.
- Old Hip-Breadth display offsets are cleared on migration and retained as `previousOffsetCmV8198` only for traceability.

**Audit:** both lateral points must sit directly on the Buttock-Circumference ring and be exactly the endpoints of Hip Breadth.

## Existing UI retained
- Selecting a measure in the list does not auto-scroll.
- Linked landmark `Linie` adjustment remains available.
- Comments, status, exports, reference values and strict region masks remain intact.

## Source semantics
ANSUR defines Shoulder Length and Waist Back Length as **surface distances**. Therefore “straight” in v0.8.19.9 means a straight anatomical 2-D projection laid onto the surface, not a floating 3-D chord through/away from the body.
