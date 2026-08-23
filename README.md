# SAMMY / BODY LAB

## v0.8.21.0 · SOLVER 24 V1 · lokaler Real-Mesh-Jacobian

- Neues **LAB → SOLV**: 24 eingefrorene `ANSUR24-PROT-v1` Zielmaße werden zu einem Sammy-Körper rekonstruiert.
- Deep (19.632 Records) + Addendum (672 Records) wurden zu `solver24-prior-v1.json` verdichtet. Dieser Prior dient nur der Kandidatenauswahl/Initialisierung; akzeptierte Schritte werden immer am echten aktuellen Mesh neu gemessen.
- Der Solver baut pro Iteration einen lokalen Finite-Difference-Jacobian, löst regularisiert, testet mehrere Schrittweiten und re-linearisiert nach jedem akzeptierten Schritt.
- Geschlecht und Alter bleiben Kontext; semantische Maß-Morphs werden gegenüber reinen Translationen bevorzugt.
- Quick / Standard / Deep testen 2 / 3 / 4 unabhängige Startkörper pro Ziel.
- `Aktueller Körper → 24 Ziele` ermöglicht eine kontrollierte Rekonstruktion eines bekannten Körpers inklusive Seed-, Parameter- und Nicht-Ziel-Maß-Stabilität.
- `Blind-Test starten` erzeugt versteckte Zielkörper; die Rekonstruktionen gehen anonymisiert in **AUDT**. Zielvektor und Solverpfad bleiben dort verborgen.
- SOLV zeigt ausschließlich das PROT/ANSUR-24-Overlay. Beim Verlassen eines laufenden Solvers wird automatisch pausiert; der SOLV→AUDT-Wechsel lädt den Auditkörper erst nach dem Measurement-Restore.
- Fehlende temporäre Mesh-Maße werden nicht als 0-cm-Werte gewertet; Blind-Läufe stellen vor dem Audit den vorherigen Körper ohne Messlinien wieder her.
- Mess-/Landmark-Geometrie bleibt unverändert und als `ANSUR24-PROT-v1` eingefroren.
- Siehe `SOLVER24_V1_V0.8.21.0.md`.

## v0.8.20.4 · PROT-24 overlay + targeted Influence addendum

- INFL now draws **only the 24 frozen PROT/ANSUR target geometries** instead of the generic 31-measure Measurement-Lab overlay.
- Four direct target morphs accidentally excluded in v0.8.20.3 are explicitly restored to the automatic solver whitelist: Wrist Circ, Ankle Circ, Calf Circ, and Lowerleg Height.
- New **Addendum · 4 Ziel-Slider** run reuses the completed Deep base and measures only those four sliders plus interactions that touch them; no three-hour full rerun is required.
- Addendum runs are linked to the base and are deliberately not treated as standalone Production-Solver calibration data.
- Accepted `ANSUR24-PROT-v1` geometry is unchanged.
- See `INFLUENCE_ADDENDUM_V0.8.20.4.md`.

## v0.8.20.3 · Frozen-24 Influence start + iPhone double-tap guard

- Accepted PROT/MEAS measurement geometry is unchanged from v0.8.20.2.
- LAB → INFL now runs against exactly the 24 canonical ANSUR-compatible measures.
- Quick, Standard and Deep all use five slider levels; depth changes reference bodies, interaction depth and holdout count.
- Phase 3 creates a per-measure influence ranking (Primary / Secondary / Minor), signed slope and non-linearity marker.
- Legacy Measurement-Lab runs are compared as prior evidence, never silently merged with current measurements.
- Standard uses four reference bodies, adaptive pair screening, multi-body samples and holdout validation; pause/resume remains stored in IndexedDB.
- Turbo no longer redraws full measurement overlays every generated body, which materially reduces iPhone/Safari overhead.
- Accidental browser double-tap page zoom is disabled; the Three.js canvas keeps its own touch controls.
- See `INFLUENCE_LAB_V0.8.20.3.md`.

## v0.8.20.2 · Audit-locked geometry correction

This build keeps the v0.8.20.0 LAB hub and fixes the geometry that the 2026-08-23 audit/screenshots showed was still not actually wired through PROT. Cervicale is lowered to the reviewed position, Trapezius aliases Neck lateral, Buttock lateral aliases the exact Hip-Breadth endpoints on the Buttock-Circumference slice, and Shoulder Length now uses the Harness-Lab bidirectional 90° projection method. Waist Back Length is shown as a clean straight vertical guide beside the body while its numeric ANSUR surface-distance target is preserved.

## v0.8.20.0 · LAB hub + Influence + blind Body Audit

- The top-level research entry is now one **LAB** bubble next to ANIM and FORM. MEAS, PROT, ANSR, Influence and Audit open from a centered radial LAB hub instead of filling the right edge with more permanent bubbles.
- Existing PROT remains visually and functionally intact; the new hub only changes navigation.
- **INFL** contains the existing Calibration Lab. Standard mode is the established 5-level slider sweep and remains the quantitative source for measure→parameter influence; Quick/Deep remain available for shorter/deeper runs.
- **AUDT** is a deliberately blind plausibility review: the visible header is only previous, comment, ✓, ×, mark flaw, next. Target measurements and solver path are hidden from the reviewer.
- Flaw marking raycasts directly onto the mannequin and is stored per anonymous test body together with ✓/× and the optional comment. Audit JSON can be exported separately.
- The blind-audit queue can already consume the newest stored real-mesh D3/D2 cases and is intentionally generic so later multi-seed reconstructions of the same target can be inserted without replacing the audit UI.
- Historical note for v0.8.20.0: that release left v0.8.19.9 measurement geometry unchanged. v0.8.20.2 above is the subsequent explicit audit-locked geometry correction.

## v0.8.19.9 · Focused protocol geometry correction

This build is a narrow follow-up to the v0.8.19.7/8 audit: both neck rings use one anatomical tilt axis, Shoulder Length is straight-projected on skin, Waist Back Length is vertically projected on the posterior surface and terminates at canonical Cervicale, and Buttock lateral / Hip Breadth share the exact Buttock-Circumference slice. Existing comments, status state, linked-line editing and compact GitHub packaging are preserved.


This is an incremental correction pass based on the v0.8.19.7 user audit. It preserves approved geometry and manual calibration instead of resetting dynamic points.

- PROT measure-list taps no longer auto-scroll.
- Dynamic landmark = auto mesh anchor + persistent user calibration bias.
- Linked landmarks can move along the associated measurement line.
- Generic circumference planes keep the two-axis audit controls; the two neck circumferences use one anatomical left-right tilt axis in v0.8.19.9.
- Upper-arm region masks exclude shoulder/torso spill.
- The audited +1.6 cm neck-base correction is promoted into shared MEAS geometry.
- v0.8.19.9 further locks Buttock lateral to the Buttock-Circumference extrema, makes Shoulder Length a straight surface projection, and makes Waist Back Length a vertical surface projection ending at Cervicale.
- MEAS remains the geometric source of truth; PROT remains its review layer.
- Flat GitHub package; no individual ANSUR crop JPGs (single atlas only).

## v0.8.19.7 · Canonical ANSUR measurement pass

- MEAS und PROT verwenden jetzt dieselben strikten Skin-Weight-Regionen. Körperteilmaße haben keinen Whole-Body-Fallback.
- Die Audit-Korrekturen wurden in die kanonische Geometrie übernommen: Biacromial direkt Acromion↔Acromion; Hip Breadth auf Buttock-Level; Wrist am Stylion; Thigh am Gluteal Furrow; Arm-/Tibiale-Längen an kanonischen Landmarks; Waist Back Length und Shoulder Length als Oberflächenpfade.
- Dynamische Geometrie ist gekoppelt: Buttock posterior/lateral, Calf maximum, Ankle minimum, Neck Base/Trapezius und Biceps Point werden aus dem aktuellen Mesh neu bestimmt.
- Landmark-Ansicht zeigt wieder die zugehörigen Maßlinien und verbindet Landmark-Gruppen, die gemeinsam ein Maß definieren.
- Flexed-arm und Wrist-90 erhalten numerisch prüfbare native Arm-/Ellenbogen-Constraints. Fist-clench, Supination und max-effort Muskelverformung bleiben als Protokoll-Caveat sichtbar.
- Geänderte Maße und dynamische Landmarks werden beim ersten Start dieser Version für einen neuen Audit auf `ungeprüft` gesetzt; Kommentare bleiben erhalten.
- Die bisherigen Measurement-Lab-Kalibrierungs- und Einflussdaten bleiben bewusst erhalten: sie sind der Startpunkt für die nächste Phase `Maß → Slider-Einfluss`, nachdem der 24er Mess-Audit grün ist.
- Paket bleibt flach; Referenzbilder liegen weiterhin im Atlas statt als Einzel-JPGs.

## v0.8.19.6 · PROT edit + dynamic search + ANSUR-94 audit

- Kommentarpopup ist auf iPhone/Safari ein echtes UI-Eingabefeld und blockiert Picking/Orbit darunter.
- Neuer einheitlicher XYZ-Button in der PROT-Kopfzeile für Landmark- und Maß-Offsets. Landmarke kann zusätzlich direkt auf dem Mannequin neu gesetzt werden; Spiegelpaare übernehmen die Position symmetrisch.
- Dynamisch gesuchte Maße tragen ein kleines `d`; nur beim ausgewählten dynamischen Maß wird dessen tatsächlicher Suchbereich am Mesh eingeblendet.
- PROT enthält nur direkte ANSUR-II-Dimensionskonzepte: die beiden Sammy-Ableitungen `torso_height`/`upperleg_height` wurden entfernt; Biceps Circumference, Flexed und Forearm Circumference, Flexed sind als ausdrücklich nicht äquivalente MEAS-Proxies aufgenommen.
- Vollständiges 94er ANSUR-II↔Sammy-Audit liegt als JSON/MD bei (22 direkt, 2 Proxy, 70 derzeit nicht implementiert).
- Referenz-Crops sind zu `ansur-crops-atlas.jpg/json` zusammengefasst; Einzel-JPGs werden nicht mehr im GitHub-Paket benötigt.

## v0.8.19.5 · PROT reference + comments + compact collapse

- PROT header uses one consistent SVG icon family: previous, info toggle, comment, correct, incorrect, random, next.
- Info is tap-to-toggle; comments are stored per landmark/measure and surfaced via row speech-bubble icons.
- Measure rows show ANSUR II same-sex / same-stature population mean in italic next to the live mesh value.
- Landmark mode suppresses measure lines; landmark markers inherit green/red audit status.
- PROT can collapse to header-only; display toggles and audit/diagnostic exports remain at the end of the scroll area.
- Measure tubes are thicker overall and selected geometry is substantially thicker.


## v0.8.19.4 · PROT compact header / exports / status geometry

- PROT-Kopfzeile: fünf Review-Icons nebeneinander; eigener Schließen-Button entfernt.
- Anzeige-Toggles liegen am Ende des scrollbar Inhalts statt als feste Panel-Leiste.
- Zwei Export-Shortcuts am Scroll-Ende: Audit JSON und Diagnostics JSON.
- Messgeometrie auf dem Mannequin übernimmt den Prüfstatus: grün = korrekt, rot = inkorrekt, neutral = ungeprüft.
- Messlinien werden als echte Tube-Geometrie gerendert, damit die Dicke auf iPhone/WebGL zuverlässig sichtbar ist; die aktive Messung ist nochmals deutlich dicker.

## v0.8.19.3 · PROT streamline / review status

- PROT-Kopfzeile: nur Icons für vorher/nachher, Hold-Info, korrekt/inkorrekt und Schließen.
- Menü in **Landmarks** und **Maße** getrennt; Standing/Sitting-Schalter und Pose-Erklärung aus der sichtbaren Oberfläche entfernt.
- Maß- und Landmark-Zeilen werden grün (korrekt) bzw. rot (inkorrekt) hinterlegt; aktive Auswahl bleibt zusätzlich klar umrandet.
- Hold-Info zeigt nur den relevanten ANSUR-Bildausschnitt; Maß-Crops enthalten ausschließlich die beiden Referenzbilder.
- Untere Ein-Zeilen-Leiste: Maße, Regionen, Namen, Random.
- CAM-Button entfernt; Haupt-Bubbles werden beim ersten Start dieser Version vertikal oben rechts gruppiert.
- Messgeometrie/Regionstrennung bleibt unverändert aus v0.8.19.2 (MEAS als Geometriequelle, strikte anatomische Masks, kein Whole-Body-Fallback).


## v0.8.19.2 · PROT pose-first review
- Standing/Sitting remain the two base views. Arm/leg side signs are derived from the actual SOMA rig, not assumed X directions.
- Default standing no longer forces a foot-spacing transform; special stance modifiers use side-safe targets.
- Floor, seat and footrest are rebuilt from the current posed mesh/joints.
- PROT shows all measures belonging to the active base pose; the selected measure is highlighted and all protocol anchors remain pickable.
- Measure and landmark info uses cropped ANSUR reference images instead of full pages in the default UI.
- Body-part previews use strict skin-weight regions with separate left/right limbs and no whole-body fallback.
# Sammy v0.8.19.0 · ANSUR Protocol / Landmark Lab

Basis: v0.8.18.1. MEAS, DIMENSIONS, R5 und ANSUR-D1/D2/D3 bleiben bewusst getrennt. PROT ist weiterhin der Audit-Layer für die 24 aktuell relevanten ANSUR-Zielmaße, wurde aber bei den Posen grundlegend vereinfacht.

## Pose-Architektur v0.8.19.0

Es gibt jetzt genau **zwei echte Grundposen**:

1. `ANSUR Standing` – Quelle `sammy-ansur-standing-source.fbx` (vom Nutzer bereitgestellte `Standing W_Briefcase Idle.fbx`).
2. `ANSUR Sitting` – Quelle `sammy-ansur-sitting-source.fbx` (vom Nutzer bereitgestellte `Sitting Idle.fbx`).

Die FBX-Dateien werden erst beim Öffnen des PROT-Modus geladen. Sammy liest daraus nur einen stabilen Pose-Zeitpunkt, retargetet die lokalen Rotationsdeltas auf das Public-78/SOMA-Rig und wendet danach deterministische ANSUR-Korrekturen an. Falls ein FBX auf dem Gerät nicht geladen werden kann, wird sichtbar auf das alte Euler-Startpreset zurückgefallen; der Fehler landet in der Diagnose.

### Standing-Korrekturen

- kleine Aufrichtung von Rumpf/Hals/Kopf;
- Standbreite wird über einen Joint-FK-Constraint auf ca. 2 cm Fußgelenk-Abstand gelöst (ANSUR: Fersen so weit wie möglich zusammen);
- die geschlossene rechte Briefcase-Hand wird nicht übernommen: die Fingerpose der offenen linken Hand wird gespiegelt; bei einem Mirror-Fehler werden die rechten Finger neutral geöffnet;
- Gewicht gleichmäßig / Muskelentspannung bleiben Protokollbedingungen und werden nicht als Bone-Transformation behauptet.

### Sitting-Korrekturen

- Hüft-/Knie-/Fußgeometrie stammt aus `Sitting Idle.fbx`;
- Rumpf und der vorgeschobene Kopf/Hals werden gezielt aufgerichtet;
- die ANSUR-Ausgangsstellung der Arme wird reproduzierbar gesetzt: Oberarme seitlich, Ellenbogen ca. 90°, Unterarme nach vorn, Handflächen zueinander;
- Sitzfläche und Fußstütze werden im PROT-Modus als transparente Prüfhilfen visualisiert;
- realer Sitzkantenabstand (~8 cm), Kontakt, Fußstützenhöhe und Frankfurt-Ausrichtung bleiben explizite Prüfkriterien und werden nicht als physikalisch exakt simuliert ausgegeben.

## Abgeleitete Messzustände statt weiterer Grundposen

Alle Sonderstellungen werden aus Standing oder Sitting erzeugt. `ansur-protocol-v1.json` enthält dafür `basePoses`, `modifiers`, `poses`, `utilityPoses` und einen expliziten `poseArchitecture`-Vertrag.

Aktuell verwendete Modifier:

- Hände auf Hüften → Chest Breadth Setup;
- Arme wieder locker → Chest Breadth Measurement;
- Arme leicht vom Körper → Hip Breadth;
- rechte Hand auf Brust → Waist Depth / Thigh setup;
- Ellenbogen 90° + Handfläche oben → Wrist Circumference;
- rechte Handfläche nach vorn → Radiale–Stylion / Lower Arm Length;
- Standbreite ~10 cm → Calf / Ankle;
- Oberschenkel gerade nicht berührend → Thigh Circumference;
- temporäres Beinöffnen → Crotch blade setup; danach zurück zu Standing;
- Standbreite 30 cm + Arme weg + Fäuste → WBX Scan / Region-Debug.

Nicht-geometrische Bedingungen wie Atmung, Gewichtsverteilung, Muskelspannung, Instrumentendruck oder reale Kontaktabstände sind bewusst **Conditions**, keine Posen.

## Zusätzliche sinnvolle Vorschauen

Im PROT-Pose-Kasten gibt es jetzt eine kleine Basis-/Debug-Vorschau:

- Stehen
- Sitzen
- WBX
- Rig A (rein technisch, niemals zum Messen)
- Sitz · Schoß (für spätere Buttock-Knee / Buttock-Popliteal-Protokolle)
- Sitz · Brust (für späteres Abdominal Extension Depth, Sitting)

Diese Vorschauen zählen nicht zur Messfreigabe.

## PROT · Landmark- und Messaudit

- Quelle: `NATICK/TR-11/017 · Measurer’s Handbook: US Army and Marine Corps Anthropometric Surveys, 2010-2011`.
- 24 ANSUR-kompatible Sammy-Ziele; `torso_height` und `upperleg_height` bleiben ausdrücklich abgeleitete Sammy-Ziele.
- Original-Handbook-Seiten für Pose, Landmark, Messung und Appendix-G-Richtwert direkt im Inspector.
- Landmark-Offsets X/Y/Z in cm; Rückprojektion auf anatomische Region-Masks aus Anny/SOMA-Skinweights.
- Torso-Regionen besitzen keinen Whole-Body-Fallback und können dadurch nicht still Arme einfangen.
- Bilaterale Landmark-Gruppen sind fest symmetrisch gekoppelt; Mittellinienpunkte bleiben lateral unverändert.
- Status + Kommentar für Landmark, Pose-Schritt und Messprotokoll; erst alle drei Ebenen machen ein Maß vollständig.
- Random / Random breit bleiben symmetrische Regressionstests innerhalb moderater erwachsener Formbereiche.

## Appendix G

Für die 22 direkten ANSUR-Ziele wird der offizielle `Allowable Observer Error` in mm angezeigt. Die zwei abgeleiteten Sammy-Ziele erhalten keinen erfundenen kombinierten Grenzwert; stattdessen werden die Quellwerte getrennt gezeigt.

## Diagnosefix v0.8.19.0

- `sammy-diagnostics-v1.snapshot.version` verwendet jetzt die tatsächliche App-Version statt des alten hart codierten `0.7.1`.
- Leere `<img src="">`-Zuweisungen im PROT-Inspector wurden entfernt. Safari hatte daraus einen Request auf die Repository-Root-URL erzeugt und fälschlich `Ressource konnte nicht geladen werden: https://.../Soma-Lab/` gemeldet.
- echte Resource-Fehler enthalten jetzt Tag, Element-ID und Klasse; ein leerer/root-identischer Pseudo-Request wird nicht mehr als Fehler erfasst.

## Paketstruktur

Das GitHub-Paket bleibt absichtlich **flach**. Auch die beiden FBX-Posequellen liegen direkt im Repository-Root. Es gibt keine Asset-Unterordner.

## Sicherheitsgrenze

PROT bleibt ein Audit-Layer. Die neuen FBX-Grundposen, Landmark-Offsets und Pose-Freigaben ersetzen in v0.8.19.0 noch nicht automatisch die 31 Produktions-MEAS-Definitionen oder R5. Erst nach visueller/fachlicher Freigabe werden die geprüften Protokolldefinitionen in die Produktionsmessung überführt.


## GitHub compact package
Full ANSUR source-page JPGs are bundled inside `ANSUR_SOURCE_PAGES.zip` to keep the repository upload below 100 files. Runtime info cards use the `crop-*.jpg` files; Appendix-G pages 235–237 remain unpacked because they are referenced directly.

## v0.8.20.2 boot hotfix
- Fixes a startup-order regression introduced with LAB/Blind Audit: `sammyInitUi()` ran before `sammyBodyAudit` lexical state was initialized.
- Startup now runs after all LAB/Audit declarations.
- Geometry from v0.8.20.1 is unchanged.
- `app.js` query version bumped to 0.8.20.2 to avoid stale GitHub Pages/iPhone Safari cache.


## v0.8.21.1
- Solver24 V1.1: conservative real-mesh plausibility hard guard.
- AUDT strict to latest Solver24 blind run; legacy D2/D3 no longer silently substituted.
- Blind target generation itself is guarded.
- ANSUR24-PROT-v1 geometry unchanged.
