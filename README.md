# Sammy v0.6.0

Sammy is the official name of the standalone morphable human-body app that grew
out of the SOMA/Anny browser proof-of-concept.

## Proven baseline frozen before this UI refactor

- Anny identity / phenotype engine on canonical SOMA topology.
- Exact shape-dependent Anny/SOMA rest rig.
- Axis16 / XBotContract65 Mixamo bridge.
- Built-in static Axis16 Mixamo reference; no external T-pose file needed.
- Correct transported native-Anny bone basis for the morphable target.
- Mixamo animation → morphable Sammy tested successfully on iPhone across
  multiple animations.
- Mid display mesh: 18,056 vertices.

The retarget/bind path is treated as **frozen infrastructure** from this point.
UI work must not casually modify it.

## v0.6.0 – production UI

The old PoC dashboard is no longer user-facing. Its DOM remains hidden for now
as a compatibility backend so the proven runtime code can be refactored later
without destabilizing the working rig.

Visible UI:

- only a small `Sammy · v0.6.0` version label;
- movable, edge-docking **ANIM** and **FORM** bubbles;
- bubble positions persist in localStorage;
- each bubble opens a scrollable glass panel;
- panel height is changed by dragging the grip at the top and persists.

### Animation panel

- load `.fbx`, `.npy`, or `.npz`;
- a loaded animation starts immediately;
- morphable Sammy is activated automatically at app startup;
- Stop / Resume continues from the current frame;
- frame slider + numeric frame selection;
- skeleton overlay toggle;
- Axis16 reference remains built in.

### Body-form panel

- all native Anny base sliders;
- advanced native phenotype sliders;
- every local Anny form modifier;
- search/filter;
- one reset button;
- shape changes rebind while preserving the current pose.

### Startup overlay

The old startup dashboard is hidden. A compact translucent toast at the top
shows the asset/runtime stage currently being loaded and disappears when Sammy
is ready.

### Error mode

Error diagnostics are always armed but invisible during normal use.

On the first error a red `!` bubble appears. It captures:

- `console.error`;
- uncaught `window.error`;
- unhandled promise rejections;
- failed page resources where the browser reports them;
- timestamp, error message and stack;
- current Sammy runtime state;
- active animation + frame;
- shape-engine / rig / LOD state.

The panel can copy or export a `sammy-diagnostics-v1` JSON file. This is intended
to make a user screenshot + diagnostic file sufficient for most debugging.

## Next architectural cleanup

The hidden legacy PoC DOM should be removed only after the remaining runtime
functions have been detached from UI IDs. That should be a code-only cleanup,
with the v0.6.0 runtime behavior used as a regression baseline.
