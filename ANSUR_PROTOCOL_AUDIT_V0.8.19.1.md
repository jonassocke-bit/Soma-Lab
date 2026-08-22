# SAMMY v0.8.19.1 · Native Pose Rescue + PROT Measurement Overlay Audit

## Ziel dieses Rescue-Stands

v0.8.19.1 verwirft den in v0.8.19.0 gescheiterten PROT-Posepfad. Die vom Nutzer bereitgestellten Standing-/Sitting-FBX bleiben nur Referenzassets; PROT lädt oder retargetet sie nicht. Ebenso werden keine lokalen Euler-Winkel als Pose-Heuristik verwendet.

Die Änderung bleibt fachlich getrennt:

- ANSUR-Protokoll / Landmark-Verifikation = PROT
- vorhandene geometrische Mesh-Messung = MEAS
- ANSUR↔Sammy-Mapping = `ansur-protocol-v1.json`
- Solver/Optimierung = unverändert

## Pose-Architektur

Es existieren genau zwei kanonische Grundposen:

1. `standing` – Anthropometric Standing
2. `sitting` – Anthropometric Sitting

Beide werden nativ auf dem SOMA/Axis16-Rig aus gewünschten Welt-Richtungen der Segmentketten aufgebaut und über den vorhandenen `Axis16 → Anny/SOMA`-Pfad angewendet.

### Standing

Automatisierte geometrische Constraints:

- Hips→Spine→Chest→Neck→Head aufrecht
- Beine symmetrisch und gestreckt
- Fuß-/Sprunggelenk-Abstand als reales Ziel in cm (Basis ~2 cm; Protokollzustände können 10/30 cm anfordern)
- Arme locker seitlich
- keine FBX-Hand-/Fingerpose

### Sitting

Automatisierte geometrische Constraints:

- Rumpf-/Halskette aufrecht
- Oberschenkel horizontal nach vorn
- Unterschenkel vertikal
- Knie geometrisch ungefähr 90°
- Füße behalten ihre kanonische Weltorientierung
- Oberarme seitlich, Unterarme horizontal nach vorn
- transparente Sitz-/Fußstützen-Hilfen werden aus der resultierenden Körpergeometrie erzeugt

Physischer Sitzkontakt, exakter 8-cm-Sitzkantenabstand und Frankfurt-Ebene bleiben visuelle Freigabepunkte; sie werden nicht als bereits physikalisch exakt behauptet.

## Sonderstellungen / Modifier

Die 11 Protokollzustände bleiben als `base + modifiers + conditions` erhalten. v0.8.19.1 automatisiert nur Modifier, deren Geometrie robust und numerisch prüfbar ist (z. B. Fußabstand, entspannte Arme). Komplexe Hand-/Kontaktzustände wie `hands_on_hips`, `right_hand_chest`, `palm_up` werden bis zur Freigabe der Basisposen ausdrücklich **nicht automatisch erzwungen**. Die UI kennzeichnet sie als `AUTO AUSGESETZT` und verhindert eine versehentliche Pose-Freigabe.

## Measurement-Lab-Geometrie in PROT

PROT verwendet jetzt direkt die vorhandene Measurement-Lab-Pipeline:

- `sammyComputeAllMeasures()`
- `sammyMeasureLinePoints()`

Für das aktuell gewählte der 24 Zielmaße werden angezeigt:

- bestehender MEAS-Wert in cm
- echte vorhandene Messgeometrie als gelbe Linie / Loop
- ein 3D-Label mit Maßname + aktuellem Wert

Die UI kennzeichnet diese Darstellung als `MEAS CURRENT`: Sie ist die bestehende Measurement-Lab-Implementierung und wird **nicht** stillschweigend als bereits freigegebene ANSUR-Protokollgeometrie ausgegeben.

## Statische Prüfungen

- `node --check app.js`: PASS
- `ansur-protocol-v1.json`: gültiges JSON
- HTML: keine doppelten IDs
- Version in `app.js`, `index.html`, CSS-/JS-Cache-Bust: `0.8.19.1`
- 24/24 Protocol-Maß-IDs existieren in `SAMMY_MEASURE_DEFS`
- 24/24 Maße referenzieren existierende Protokollposen
- alle 11 Protokollposen referenzieren eine der zwei Basisposen
- alle Modifier-IDs sind vorhanden
- alle referenzierten ANSUR-JPGs sind vorhanden
- PROT-Code enthält keine `FBXLoader`-, `sourceFbx`- oder Euler-Pose-Heuristik
- Protocol-JSON enthält kein `sourceFbx`

## Was damit bewusst noch nicht bewiesen ist

Die finale optische Qualität der beiden nativen Grundposen auf dem echten iPhone/Safari-Mannequin muss weiterhin visuell geprüft werden. Dieser Stand ist aber strukturell anders als die beiden gescheiterten Ansätze: keine fremde FBX-Bindpose und keine geratenen lokalen Bone-Achsen mehr.

Abnahme auf dem Gerät:

1. Standing: keine gekreuzten Beine, Füße/Fersen plausibel zusammen, Rumpf aufrecht, Arme seitlich.
2. Sitting: Oberschenkel horizontal, Knie ~90°, Unterschenkel vertikal, Füße plausibel, Rumpf aufrecht.
3. Bei jedem der 24 Maße erscheint in PROT eine gelbe MEAS-Geometrie und ein aktueller cm-Wert, sofern die bestehende MEAS-Implementierung für den aktuellen Mesh-Zustand einen gültigen Schnitt/Segment liefert.
4. Komplexe Modifier dürfen vor Basisfreigabe nicht automatisch zu neuen grotesken Posen führen.
