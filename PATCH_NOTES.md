# v0.8.29.0 · Body Bank Solver Architecture 1.0 + Active Audit

- Phase-2-Audit als deduplizierter Body-Bank-Index kompiliert: 246 trusted / 83 frontier / 36 negative / 15 unchecked.
- Neuer trusted-only Top-K-Retrieval-Pfad im SOLV-Panel.
- Shortlist wird wirklich rekonstruiert und mit aktuellen Meshmaßen gerankt.
- Local Fit nur Höhe + direkte Brust/Taille/Hüfte, kleine Bounds, keine Cross-Region-Rettung.
- Globaler Non-Worsening-Rollback auf den auditierten Seed.
- 8er held-out Blind-Proof; echtes Zielalter, kein kg-Score und keine kg-Vorauswahl.
- BANK erhält ACTIVE-Modus; Accepted-Votes werden sofort lokale trusted-user Seeds.
- Known-bad Shoulder-Joint-Proxy aus Retrieval/Gates entfernt.
- Resume-Fix für frühere unchecked Phase-2-Fälle.

---

# v0.8.28.5

- BANK Dual-Viewport nutzt nur noch die freie Viewer-Fläche außerhalb des Menüs.
- iPhone/Bottom-Sheet: bisheriger oberer A-Bereich wird mittig in A/B geteilt.
- Desktop: freier Bereich links vom Panel wird in A/B geteilt.
- Panel-Resize aktualisiert die Viewer-Grenze automatisch.
- Kein Eingriff in Audit-Queue, Bewertung, Statur-Gate oder übrige App-Modi.

# v0.8.28.4

BODY BANK: vollständig blind gemischte 400er Queue, aktuelle Testkategorie verborgen, zwei unabhängige BANK-only Viewports mit Last-Interaction-Auswahl und optionalem per-Viewport AutoFit. Adult-Sampling zeigt keine Rest-Mesh-Statur >205 cm. Schnellgrund startet leer; Kopfgröße/Head-Fat bleibt bewusst vertagt.

# v0.8.28.3 · BODY BANK Phase 2

- Phase-1-Human-Audit als reproduzierbarer Seed eingebaut.
- 400er Zielaudit: 160 lokale Proportionsfälle, 160 Extremfälle, 60 Randfälle, 20 verdeckte Wiederholungen.
- Nutzerhinweis „alle Unsicheren = Beine zu lang“ als lokale Human-Annotation übernommen.
- Alte fehleranfällige BANK-Umfangssnapshots nicht weiterverwendet.
- Neue exakte Rest-Rig-Bein/Torso-Verhältnisse pro Vote.
- Optionaler persistenter Schnellgrund ohne Kommentarzwang.
- Zoom/Orbit, Pose-/Animationsaudit und lokale Verdict-Semantik unverändert.

---

# v0.8.28.2 · BODY BANK Audit View / Motion

- Manual zoom/orbit persists exactly across body changes, voting and pose/motion changes.
- Only explicit Vorne / ¾ / Seite / Hinten selection reframes the camera.
- Adds T-Pose, Standing, Squat, Run and Action static audit poses.
- Adds Walk and Rig-Stress loops with play/pause and speed control.
- Reuses the existing animation pipeline for direct `.fbx` / `.npy` / `.npz` import in BODY BANK.
- Vote snapshots use pose-independent rest-shape measurements; motion cannot contaminate hidden numeric audit values.
- Vote export records view, motion, running state, speed and camera review context.
- 95+5 sampling and local body-family semantics unchanged.

---

# v0.8.26.6 · Solver Shape Layer 1.0

- Keeps canonical ANSUR24-PROT-v2 operators untouched; adds separate locked Solver Shape features.
- Chest circumference stays canonical; chest breadth/depth get a fixed +2/+4/+6 cm shape band.
- Adds canonical waist width/depth + upper-abdomen width envelope against lateral waviness.
- Re-enables `stomach-pregnant-incr` only under the neutral solver role **Abdominal Projection**, positive-only and conditionally when circumference+depth are missing and the waist is not too narrow.
- Uses Upper-Thigh and Upperarm band maxima as visible-shape proxies; ANSUR values remain separately reported.
- Fresh finite-difference Shape Jacobian and bounded line search on local morphs only.
- Full canonical ANSUR remeasurement after torso and final stages with explicit checkpoint rollback.
- Uses only the same five consumed cases; 902-row Prediction reserve remains untouched.

---

# v0.8.26.4 · Solver Architecture Audit / Anatomical Routing + Predictive Polish

- Hard 24-measure anatomical routing prevents unrelated local morphs from entering a residual pool.
- Seven Repair-v1.6 rows are fresh-only: no stale Deep vector or stale `topMeasureIds` may rank candidates.
- Removes premature solver fusion of Depth/Horizontal axes; legacy coupled maps split at runtime.
- Restores required direct target morphs (including Wrist/Ankle) as fresh-only supplements when missing.
- PRA 1.2 measures up to five anatomical DOFs freshly, then selects up to three by actual derivative/collateral/reach.
- Predictive Newton/least-squares landing replaces the old fixed ±0.14 local / ±0.045 core residual clip.
- Residual scheduler: max 12 actions, critical-first, max two same-focus actions in a row, state-local stalls and capacity-limited diagnosis.
- Persistent locks protect critical measurements once they are inside product tolerance.
- Best-checkpoint rollback prevents late accepted trades from leaving a worse final body.
- ±1.15/±1.30 is now opened only for the exact locally bound-blocked DOF; coarse stages remain inside normal bounds and core axes never extrapolate.
- Measurement operators, Reliability, FitMetrics, Proof Objective and frozen ANSUR/statistical data remain unchanged.

---

# v0.8.26.3 · Pragmatic Repair 1.1 / Residual Convergence

- Fixes missing PRA `ordinal` initialization that could overwrite Case records in IndexedDB.
- Summary requires 5 unique case IDs before issuing a useful/partial/no-benefit decision.
- Adds up to 6 fresh residual relinearizations per body.
- Prioritizes the strongest still-wrong product measure and uses up to 3 locally relevant DOFs.
- Falls back to single-DOF trials when the combined residual step is not safe.
- Adaptive ±1.15 / ±1.30 only when a local linear morph is demonstrably bound-blocked in the needed direction.
- Core axes are not extrapolated; Flexed Forearm remains diagnostic.
- Previous v0.8.26.2 Pragmatic-Repair JSON can be imported as a source for the corrected rerun.

---

# v0.8.26.2 · Pragmatic Repair 1.0

- One bounded product-oriented repair loop on the 5 already-consumed Real-ANSUR focus bodies.
- Fresh combined Thorax solve using existing Dorsi/Pectoral/V-Shape/Bust/Underbust/Shoulder-Distance controls.
- Selected linear local morphs may reach ±1.15; final Escape stage may reach ±1.30. Core axes are never extrapolated.
- Product metrics prioritize stature, shoulder frame, torso circumferences and torso/shoulder lengths.
- Chest Breadth remains supporting because its ANSUR↔surface bridge is unresolved.
- Flexed Forearm is nearly diagnostic-only and cannot force a permanently enlarged rest forearm.
- Conservative muscle-prior settle only when product fit stays essentially unchanged.
- No new ANSUR rows, no new morph assets, no Proof-1.6 or ANSUR24 changes.

---

# v0.8.26.0

- Adds Real ANSUR Stress Gate 1.0 on 10 observed held-out ANSUR II test rows.
- 4 typical + 6 observed edge profiles, balanced 5 male / 5 female.
- One mandatory solve per person; all edge cases and suspicious typical cases receive one deterministic far-seed retest.
- Checkpoint/resume after every seed/person.
- Blind holdout: `torso_height` + `upperleg_height`.
- Stress Summary/FULL JSON and blind AUDT support.
- Creates a 902-row untouched final reserve for later 24-vs-7-vs-5 few-measure prediction validation.
- Proof 1.6 solver science remains frozen.

---

# v0.8.25.9

- Proof 1.6 solver science/gates unchanged.
- Solver WebGL heartbeat instead of continuous 60-fps render during compute.
- Exact repeated-shape ANSUR24 measurement cache + performance timings.
- Heavy Result Review refresh deferred until proof completion instead of rebuilding after every seed.
- Experimental non-gating torso surface-continuity diagnostic.
- Blind Audit quality tag: `torso-transition-angular`.
- Proof Inspector reorganized as simple-first `ERGEBNIS PRÜFEN`; technical details collapsed.
- Added next-phase roadmap for extreme/plausible stress, held-out real ANSUR validation and few-measure prediction mask.

---

# PATCH NOTES · v0.8.25.7

## SOLVER V2 PROOF 1.6
- Adds bounded post-solve POLISH: final WARN/FAIL body → fresh remeasurement → at most two tighter reruns.
- No repeated STAT/multistart; no hidden source use; conflict-controls excluded.
- Unchanged measurement, target-validity, repair, reliability and gate semantics.

## INSPECTOR 1.2
- Simple decision summary first.
- Technical details collapsed by default.
- POLISH stage replay and diagnostics.

## v0.8.25.8 — Solver V2 Proof 1.6 Boot Hotfix
- Restores four Solver V2 Proof UI/runtime helpers accidentally omitted in v0.8.25.7.
- Fixes iPhone/Safari `sammySolverV2ProofSetMode` ReferenceError and `sammySolverV2ProofStatus is not a function` TypeError.
- No Solver V2 scientific behavior changed; Proof remains v1.6 / bounded Polish 1.0.

## v0.8.26.1 · Real ANSUR Representability Lab 1.0
- 5 bereits verbrauchte Stress-Körper statt neuer held-out Personen.
- trennt Chest/Shoulder/Forearm-Probleme in Solver-Kapazität, Morphraum und Messzustand/-brücke.
- Composition-Prior-Probe gegen unnötig hohe Muskeldefinition.
- experimentelle seitliche Torso-Normalen-Kontinuität.
- Proof 1.6 / ANSUR24 / 902er Prediction-Reserve unverändert.

## v0.8.26.4.1
Boot/UI-Hotfix: ungültigen `rc`-Verweis aus der alten Representability-Renderansicht entfernt. Keine Solver-/Messänderung.

## v0.8.26.5 — Morph ↔ Messebene Alignment Lab 1.0
- Kanonische ANSUR24-PROT-v2-Ebenen bleiben unverändert.
- Neues diagnostisches Shape-Band für Chest, Abdomen, Thigh und Upperarm.
- Basisebene wird gelockt; Morph-Wirkmaximum und beste Zielnähe werden unabhängig gemessen.
- `stomach-pregnant-incr` wird testweise nur als `Abdominal Projection` ausgewertet.
- Keine neuen ANSUR-Fälle; Prediction-Reserve bleibt 902.

### v0.8.27.0

Produktionsrichtung auf Body Fit Minimal umgestellt: 5-Maße-Maske bleibt, ANSUR nur Statistikprior, kleiner regionaler Fit, permanente Volumen-/Gewichtsrückmeldung und Frauen-Cup A–H/Auto von Anfang an. Historische Solver-V2-Labs bleiben unverändert als Research-Pfad verfügbar.

## v0.8.27.1
Body Fit Priority Fix: Masse jetzt Weight+Muscle am realen Mesh, danach Hüfte/Taille Recovery; direkter Hüftmorph erhält deutlich mehr automatischen Arbeitsraum und einen eigenen manuellen Regler.

## v0.8.27.2 · Deployment + Defaults Fix
- Sichtbarer Build-Stempel 0.8.27.2; gemeldeter vorheriger Test lief noch mit v0.8.27.0.
- Body-Fit Defaults: 174 / 88.5 / 103 / 86 / 113.
- Priority-Fix v0.8.27.1 bleibt aktiv: Masse über Weight+Muscle vor regionaler Recovery.

## v0.8.29.0 · Body Bank Solver 1.0 + Active Audit 1.0
- Phase-2-Audit zu `body-bank-index-v1` kompiliert: 246 trusted / 83 frontier / 36 negative / 15 unchecked.
- Neuer SOLV-Pfad: Trusted Top-K Retrieval → echte Shortlist-Meshmessung → kleiner Height/Chest/Waist/Hip-Local-Fit.
- Globaler Non-Worsening-Gate mit vollständigem Rollback auf den auditierten Seed.
- 8er Blind-Holdout-Proof gegen höhenangepassten neutralen Anny-Start.
- BANK erhält ACTIVE-Modus; Votes lernen lokal sofort als trusted-user/frontier-user/negative-user.
- Shoulder-Joint-Proxy explizit aus Body-Bank-Retrieval/Gates ausgeschlossen; Phase-2-Resume springt auf offene Fälle.

