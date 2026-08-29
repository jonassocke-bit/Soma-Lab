# Sammy v0.8.29.2 — GitHub Visible-Version / Cache Hotfix

v0.8.29.2 korrigiert einen Deployment-/Anzeige-Fehler aus v0.8.29.1: Der Splash-Screen enthielt noch fest `v0.8.28.4`, obwohl Runtime, Titel und Cache-Tags bereits v0.8.29.1 waren. Dadurch sah ein korrekt hochgeladener neuer Build auf GitHub Pages beim Start wie ein alter Stand aus.

Ab diesem Stand prüft der Release-Gate **alle sichtbaren Versionsmarker inklusive Splash** sowie JS-/CSS-Cache-Tags gegen `SAMMY_APP_VERSION`. Solver, Body Bank und ACTIVE-Daten bleiben gegenüber v0.8.29.1 unverändert.

Siehe:
- `GITHUB_VISIBLE_VERSION_HOTFIX_V0.8.29.2.md`
- `RELEASE_NOTES_V0.8.29.2.md`
- `CHANGESET_V0.8.29.2.md`
- `SAMMY_MASTER_STATE.docx`

---

# Sammy v0.8.29.1 — BODY BANK Solver Search Hotfix + Active Merge

v0.8.29.1 repariert den fehlenden manuellen Retrieval-Handler aus v0.8.29.0 und übernimmt den abgeschlossenen 32er ACTIVE-Audit in die kanonische Body Bank. Der Index enthält jetzt 397 eindeutige Nodes: 269 trusted, 91 frontier, 37 negative und keine ungeprüften Phase-2-Nodes mehr.

Der erste 8er Proof unterstützt die neue Body-Bank-Architektur deutlich, hat aber zugleich einen klar falschen Brust-Snapshot sichtbar gemacht. Deshalb trennt dieser Stand Architektur-GO und Mess-Gate ausdrücklich. Proof v1.1 und Retrieval besitzen einen breiten technischen Measurement-Sanity-Gate, der nur katastrophale Messausreißer abfängt.

Siehe:
- `BODY_BANK_SOLVER_HOTFIX_ACTIVE_MERGE_V0.8.29.1.md`
- `RELEASE_NOTES_V0.8.29.1.md`
- `CHANGESET_V0.8.29.1.md`
- `SAMMY_MASTER_STATE.docx`

---

# Sammy v0.8.29.0 — BODY BANK Solver Architecture 1.0 + Active Audit

Der abgeschlossene Phase-2-Blind-Audit wird jetzt erstmals als echte Solver-Datenbasis benutzt. `body-bank-index-v1.json` enthält dedupliziert 246 trusted, 83 frontier, 36 negative und 15 unchecked Körper. Der neue Haupt-POC unter `SOLV` sucht nur unter trusted Körpern, rekonstruiert eine kleine Shortlist wirklich in Anny und fitttet anschließend ausschließlich Höhe, Brust, Taille und Hüfte/Gesäß in engem lokalen Abstand. Ein globaler Non-Worsening-Gate rollt eine insgesamt schlechtere Korrektur vollständig auf den auditierten Seed zurück.

Der `8er Blind-Proof` hält acht trusted Körper vollständig aus der Bank heraus und vergleicht neutralen Start → Retrieval → Local Fit. Gewicht wird im Proof weder gescored noch für die Vorauswahl benutzt. `BANK → ACTIVE` sammelt neue solverrelevante Grenz-/Local-Fit-Körper blind ein; Accepted-Votes werden auf demselben Gerät sofort zusätzliche trusted-user Seeds.

Siehe:
- `BODY_BANK_SOLVER_ARCHITECTURE_1.0_V0.8.29.0.md`
- `RELEASE_NOTES_V0.8.29.0.md`
- `CHANGESET_V0.8.29.0.md`
- `SAMMY_MASTER_STATE.docx`

---

# Sammy v0.8.29.0 — BODY BANK SOLVER 1.0 + ACTIVE AUDIT

Der Phase-2-Human-Audit ist jetzt ein echter Solver-Index: 246 `trusted` Körper werden als Startkörper genutzt; Frontier, lokale Negativpunkte und offene Fälle bleiben strikt getrennt. Der neue bevorzugte POC-Pfad lautet **Body Bank Retrieval → kleiner Local Fit → ACTIVE Audit**.

Im SOLV-Panel gibt es einen falsifizierbaren 8er Blind-Proof sowie eine manuelle Top-K-Suche. Der Local Fit darf nur Höhe, Brust, Taille und Hüfte/Gesäß in engem Seed-Abstand verändern und rollt bei schlechterem Gesamtscore vollständig zurück. Jeder neue Zustand wird erst nach `BANK → ACTIVE` zu einem zusätzlichen sicheren Seed.

Siehe:
- `BODY_BANK_SOLVER_ARCHITECTURE_1.0_V0.8.29.0.md`
- `RELEASE_NOTES_V0.8.29.0.md`
- `CHANGESET_V0.8.29.0.md`
- `SAMMY_MASTER_STATE.docx`

---

# Sammy v0.8.28.5 — BODY BANK Menu-safe Dual Viewport

Der 400er Phase-2-Audit ist jetzt reviewer-blind durchmischt: Testtyp, Familie, Richtung und Wiederholungsstatus bleiben verborgen. BANK besitzt zwei unabhängig zoombare/orbitbare Viewports; die letzte Interaktion wählt die aktive Ansicht, und Vorne / ¾ / Seite / Hinten / AutoFit gelten nur für diese Kamera. AutoFit ist pro Viewport optional.

Erwachsene über 205 cm werden für diesen Audit vor der Anzeige herausgeregelt. Der optionale Schnellgrund startet leer. Das separat beobachtete Kopfgrößen-/Head-Fat-Thema ist im Master State als spätere absolute Größenprüfung dokumentiert und absichtlich nicht Teil dieses Audits.

Siehe:
- `BODY_BANK_MENU_SAFE_DUAL_VIEW_V0.8.28.5.md`
- `RELEASE_NOTES_V0.8.28.5.md`
- `CHANGESET_V0.8.28.5.md`
- `SAMMY_MASTER_STATE.docx`

---

# Sammy v0.8.28.3 — BODY BANK Phase 2 · Boundary / Extreme Audit

Der abgeschlossene 100er Human-Audit aus v0.8.28.2 ist jetzt reproduzierbar als Seed hinterlegt. Phase 2 zeigt 400 gezielt ausgewählte Fälle: lokale Proportionsvarianten um akzeptierte Körperfamilien, absichtliche Extremkombinationen, breite Randstichproben und verdeckte Wiederholungen.

Die bekannte Unsicherheit `Beine zu lang` wird nicht als globale `proportions`-Grenze interpretiert. Stattdessen speichert Phase 2 erstmals robuste pose-unabhängige Bein-/Torso-Verhältnisse aus dem exakten Anny/SOMA-Rest-Rig. Ein optionaler Schnellgrund hält das Audit trotzdem bei einem Klick pro Person.

Siehe:
- `BODY_BANK_PHASE2_BOUNDARY_EXTREMES_V0.8.28.3.md`
- `RELEASE_NOTES_V0.8.28.3.md`
- `CHANGESET_V0.8.28.3.md`
- `SAMMY_MASTER_STATE.docx`

---

# Sammy v0.8.28.2 — BODY BANK Audit View / Motion

v0.8.28.2 macht den visuellen BODY-BANK-Audit bewegungsfähig, ohne die Körperidentität oder die 95+5-Bank zu verändern. **Manueller Zoom und Orbit bleiben jetzt beim Wechsel der Person exakt erhalten**; nur ein expliziter Viewport-Wechsel über Vorne / ¾ / Seite / Hinten rahmt die Kamera neu ein.

Direkt im BANK-Panel stehen T-Pose, Stehen, Kniebeuge, Laufpose und Action-Pose sowie Gang-Loop und Rig-Stress bereit. Eigene `.fbx`/`.npy`/`.npz`-Animationen können über die bestehende Motion-Pipeline importiert werden. Play/Pause und Tempo sind im Audit verfügbar. Numerische Vote-Snapshots bleiben bewusst **pose-unabhängig** und werden aus der Rest-Shape erzeugt; Ansicht/Motion/Kamera werden getrennt als Review-Kontext exportiert.

Siehe:
- `BODY_BANK_AUDIT_VIEW_MOTION_V0.8.28.2.md`
- `RELEASE_NOTES_V0.8.28.2.md`
- `CHANGESET_V0.8.28.2.md`
- `SAMMY_MASTER_STATE.docx`

---

# Sammy v0.8.28.1 — GitHub Pages Cache/Deploy Hotfix

v0.8.28.1 ändert keine Body-Bank-Logik. Der Hotfix korrigiert die in v0.8.28.0 versehentlich stehen gebliebenen `0.8.27.2`-Versions-/Cache-URLs für `app.js` und `style.css`, synchronisiert Titel/Splash/App-Version und legt `.nojekyll` für eine unveränderte statische GitHub-Pages-Auslieferung bei. Dadurch lädt GitHub Pages nach einem Release garantiert die neue JS/CSS-Revision statt ggf. eine gecachte v0.8.27.2-Ressource mit dem v0.8.28.x-HTML zu mischen.

---

# Sammy v0.8.28.0 — Audited Body Bank PoC

v0.8.28.0 führt den neuen **BANK**-Pfad ein, ohne die bisherigen Solver-/Mess-/Morph-Labs zu löschen. Der erste Body-Bank-Test erzeugt deterministisch 95 unterschiedliche Anny-Core-Basiskörper plus 5 verdeckte Wiederholungen. Das menschliche Audit ist absichtlich minimal: **Plausibel / Unsicher / Unplausibel**, vier Kameraansichten, Zurück/Weiter, keine Kommentar- oder Fehlerbeschreibungspflicht.

Wichtig: Eine Ablehnung gilt nur für den exakten Körper und seinen lokalen Familienkontext. Sie wird **niemals** als globales Slider-Verbot interpretiert. Lokale Spezialmorphs sind in Phase 1 deaktiviert; Ziel ist zuerst zu prüfen, ob Annys Core-Formraum als Ausgangsbank brauchbar ist. Der bestehende Blind-Solver-Audit bleibt separat unter `AUDT` erhalten.

Siehe:
- `BODY_BANK_AUDIT_POC_V0.8.28.0.md`
- `RELEASE_NOTES_V0.8.28.0.md`
- `CHANGESET_V0.8.28.0.md`
- `SAMMY_MASTER_STATE.docx`

---

# Sammy v0.8.26.6 — Solver Shape Layer 1.0

v0.8.26.6 trennt erstmals kanonische ANSUR-Referenzmessungen von zusätzlichen morph-aligned Solver-Shape-Features. Chest Breadth/Depth, Abdomen, Upper Thigh und Upperarm erhalten gelockte Regionalbänder; `stomach-pregnant-incr` wird konditional und neutral als **Abdominal Projection** getestet. Vollständige ANSUR24-Neumessungen und Checkpoint-Rollbacks verhindern stille Regressionen. Die 902er Prediction-Reserve bleibt unverändert.

Siehe:
- `RELEASE_NOTES_V0.8.26.6.md`
- `SOLVER_SHAPE_LAYER_1.0_V0.8.26.6.md`
- `NEXT_PHASE_AFTER_SHAPE_LAYER_V0.8.26.6.md`
- `CHANGESET_V0.8.26.6.md`

---

# Sammy v0.8.26.5 — Morph ↔ Messebene Alignment Lab 1.0

v0.8.26.5 quantifiziert separat, wo Annys lokale Morphs relativ zu den kanonischen ANSUR-Ebenen tatsächlich wirken. ANSUR24 selbst bleibt unverändert; fünf bekannte Repair-Körper werden in Chest/Abdomen/Thigh/Upperarm-Bändern gescannt.

---

# Sammy v0.8.26.4 — Solver Architecture Audit · Anatomical Routing + Predictive Polish

v0.8.26.4 korrigiert die Solver-Nutzung vorhandener Freiheitsgrade: harte anatomische Routen, fresh-only Behandlung der sieben Repair-v1.6-Maße, getrennte Raw-DOFs statt vorzeitiger Depth/Horizontal-Fusion, predictive Residual-Landung, fairer Scheduler, persistente kritische Locks und echte adaptive ±115/130-%-Bounds nur bei nachgewiesenem Grenzanschlag. ANSUR24-Messung, Reliability, FitMetrics, Proof Objective, Statistikdaten und die 902er Prediction-Reserve bleiben unverändert.

Siehe:
- `RELEASE_NOTES_V0.8.26.4.md`
- `SOLVER_V2_ARCHITECTURE_AUDIT_1.0_V0.8.26.4.md`
- `REAL_ANSUR_PRAGMATIC_REPAIR_1.2_V0.8.26.4.md`
- `NEXT_PHASE_AFTER_SOLVER_AUDIT_V0.8.26.4.md`
- `CHANGESET_V0.8.26.4.md`

---

# Sammy v0.8.26.3 — Pragmatic Repair 1.1 · Residual Convergence

v0.8.26.3 behebt den v0.8.26.2-Record/Checkpoint-Fehler und lässt den produktorientierten Repair nach den groben Blöcken nicht mehr mit freien Reglern und großen Restfehlern einfach aufhören. Bis zu sechs frische Residual-Re-Linearisationen verfolgen noch falsche kritische Maße; adaptive ±115/130-%-Bounds werden nur bei echtem Grenzanschlag genutzt. Proof 1.6, ANSUR24 und die 902er Prediction-Reserve bleiben unverändert.

Siehe:
- `RELEASE_NOTES_V0.8.26.3.md`
- `REAL_ANSUR_RESIDUAL_CONVERGENCE_1.0_V0.8.26.3.md`
- `NEXT_PHASE_AFTER_RESIDUAL_CONVERGENCE_V0.8.26.3.md`
- `CHANGESET_V0.8.26.3.md`

---

# Sammy v0.8.26.2 — Real ANSUR Pragmatic Repair 1.0

Nach dem Representability Lab wird nicht weiter auf 24/24 Laborperfektion optimiert. v0.8.26.2 testet einen einzigen begrenzten produktorientierten Nachlauf an fünf bereits verbrauchten Real-ANSUR-Körpern: kombinierte Thorax-DOFs, selektive lokale Extrapolation ±115/130 %, regionale Masse/Composition und eine Harness-/Design-relevante Bewertungsmetrik. Flexed Forearm bleibt Diagnose. Proof 1.6, ANSUR24 und die 902er Prediction-Reserve bleiben unverändert.

Siehe:
- `RELEASE_NOTES_V0.8.26.2.md`
- `REAL_ANSUR_PRAGMATIC_REPAIR_1.0_V0.8.26.2.md`
- `NEXT_PHASE_AFTER_PRAGMATIC_REPAIR_V0.8.26.2.md`
- `CHANGESET_V0.8.26.2.md`

---

# Sammy v0.8.26.0 — Real ANSUR Stress Gate 1.0

Der validierte Proof-1.6-Solver bleibt eingefroren. v0.8.26.0 testet ihn erstmals gegen 10 tatsächlich beobachtete held-out ANSUR-II-Messprofile (4 typisch, 6 Randfälle), mit adaptivem Far-Seed-Re-Test, Checkpoint/Resume und zwei Blind-Holdout-Maßen. Die 10 verwendeten Personen werden aus der späteren Few-Measure-Endvalidierung entfernt; 902 Testpersonen bleiben unangetastet.

Siehe:
- `RELEASE_NOTES_V0.8.26.0.md`
- `REAL_ANSUR_STRESS_GATE_1.0_V0.8.26.0.md`
- `NEXT_PHASE_AFTER_REAL_ANSUR_STRESS_V0.8.26.0.md`
- `CHANGESET_V0.8.26.0.md`
- `BUILD_REAL_ANSUR_STRESS_ASSETS_V0.8.26.0.py`

---

# Sammy v0.8.25.9 — Proof 1.6 Performance + Surface Quality + Result Review 1.3

Der validierte Proof-1.6-Solver aus v0.8.25.8 bleibt wissenschaftlich unverändert. v0.8.25.9 reduziert Render-/UI-Last während langer Solverläufe, ergänzt einen exakten laufbezogenen ANSUR24-Messcache und exportiert echte Laufzeit-/Jacobian-Diagnostik.

Zusätzlich gibt es eine **nicht-gatende experimentelle Torso Surface-Continuity-Diagnose** und im Blind Audit den Qualitäts-Tag „Torso-Übergang kantig“. Der bisherige Proof Inspector heißt in der normalen Ansicht **ERGEBNIS PRÜFEN** und zeigt zuerst nur Übersicht, Ziel↔Ergebnis und die verständlich benannte Entstehung des Körpers. Technische Forschungsdetails bleiben eingeklappt verfügbar.

Siehe:
- `RELEASE_NOTES_V0.8.25.9.md`
- `SOLVER_V2_PERFORMANCE_SURFACE_V0.8.25.9.md`
- `SOLVER_V2_RESULT_REVIEW_1.3_V0.8.25.9.md`
- `NEXT_PHASE_ANSUR_STRESS_AND_PREDICTION_V0.8.25.9.md`
- `CHANGESET_V0.8.25.9.md`

---

# Sammy v0.8.25.7 — Solver V2 Proof 1.6 + Inspector 1.2

Proof 1.6 keeps the v0.8.25.6 hierarchical canonical-multistart architecture and adds one bounded convergence experiment: when a normal seed is still WARN/FAIL, its actual final body is freshly remeasured and may run through at most two tighter post-solve POLISH rounds. Statistical initialization and multistart are not repeated. Conflict controls never receive polish.

Inspector 1.2 is simple-first: the top view shows only the decision-relevant metrics and worst remaining measure. Full restart/stage/ANSUR debug data stays available under a collapsed technical section.

Scientific boundary remains frozen: ANSUR24-PROT-v2 operators/MeasurementStates, Proof target and seed validity, Deep repair-v1.6 policy, reliability weights, gate thresholds and the Statistical Body Bank are unchanged.

See:
- `RELEASE_NOTES_V0.8.25.7.md`
- `SOLVER_V2_PROOF_1.6_V0.8.25.7.md`
- `SOLVER_V2_INSPECTOR_1.2_V0.8.25.7.md`
- `CHANGESET_V0.8.25.7.md`

### v0.8.25.8 hotfix
Use v0.8.25.8 instead of v0.8.25.7 for Solver V2 Proof 1.6. It restores four missing Proof UI/runtime helpers that prevented the Proof UI from initializing/starting on Safari. Solver science is unchanged.

## Aktueller Forschungsstand · v0.8.26.3
Proof 1.6 bleibt die eingefrorene inverse Baseline. v0.8.26.3 prüft jetzt gezielt, ob die großen Real-ANSUR-Restfehler tatsächlich Morphraumgrenzen sind oder nur daraus entstanden, dass der produktorientierte Nachlauf nach einem einzigen Block zu früh stoppte. Bis zu sechs frische Residual-Runden nutzen vorhandene Regler weiter; ±115/130 % wird nur bei echtem Bound-Block aktiviert. Die 902er Prediction-Reserve bleibt unangetastet.

### v0.8.26.4.1
Boot/UI-Hotfix auf v0.8.26.4; wissenschaftlicher Solverstand unverändert.

### v0.8.26.5 — Morph ↔ Messebene Alignment
Unter SOLV steht ein fokussierter 5-Körper-Test zur Verfügung, der nicht die ANSUR-Protokollmessung verschiebt, sondern separat untersucht, ob Annys Morph-Wirkmaximum einige Zentimeter neben der kanonischen Ebene liegt. Chest, Abdomen, Thigh und Upperarm werden als kleine gelockte Profile gescannt; `stomach-pregnant-incr` erscheint ausschließlich diagnostisch als **Abdominal Projection**.

## v0.8.27.0 — neuer Produktionspfad

Im SOLV-Panel steht `BODY FIT MINIMAL · PROTOTYPE 1.0` jetzt vor dem historischen Solver-V2-Bereich. Die normale Avatar-Erzeugung soll künftig aus 5 Nutzereingaben, einem statistischen Prior, wenigen direkten Anny-Reglern, Meshvolumen↔Gewicht und einem getrennten Frauenbrust-/Cup-Block entstehen. Die ANSUR24-Solver bleiben als Forschungsarchiv erhalten.

### v0.8.27.1 · Minimal Body Fit Priorität
Produktionsreihenfolge: Größe → Masse (Weight+Muscle via Meshvolumen) → Frame → Taille/Hüfte → Masse-Check → lokale Recovery → Frauen-Cup. ANSUR bleibt Statistik, nicht geometrisches Zielsystem.

### v0.8.27.2 Body Fit
Der Produktionsprototyp startet standardmäßig mit 174 cm, 88.5 kg, Brust 103 cm, Taille 86 cm, Hüfte/Gesäß 113 cm. Vor Tests muss sowohl die globale Versionsanzeige als auch der Body-Fit-Buildstempel 0.8.27.2 zeigen.