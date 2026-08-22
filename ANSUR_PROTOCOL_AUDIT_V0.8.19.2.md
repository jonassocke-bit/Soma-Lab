# SAMMY v0.8.19.2 · PROT audit

## Implementiert
- Pose-first UI: Stehen / Sitzen als Hauptauswahl.
- Alle Maße der aktiven Basispose werden gleichzeitig als Overlay dargestellt; aktives Maß ist deutlich hervorgehoben.
- Alle 18 Protocol-Landmarks bleiben als anklickbare Anker sichtbar.
- Klick auf Messlinie wählt das Maß; Klick auf Anker springt zu einem zugehörigen Maß und öffnet die Ankerinfo.
- Kompakte Info-Karten verwenden zugeschnittene ANSUR-Abbildungen statt kompletter PDF-Seiten.
- Strikte Region-Masks auf Skinweights: Torso, Hals, Kopf sowie linke/rechte Arme und Beine getrennt; kein Whole-Body-Fallback für regionale Maße.
- Standing: keine erzwungene Default-Fußspreizung mehr. Links/rechts-Richtung wird aus dem tatsächlichen SOMA-Rig abgeleitet statt aus angenommenem X-Vorzeichen.
- Sonder-Fußstände verwenden seitenfeste Ziele; dadurch kein absichtliches Überkreuzen mehr.
- Armrichtung verwendet ebenfalls die tatsächliche Links/rechts-Seite und zusätzlichen Abstand zum Torso.
- Boden, Sitzfläche und Fußstütze werden aus der jeweils aktuellen Pose / Mesh-Boundingbox neu aufgebaut.

## Referenzbilder
- 24 / 24 Maße besitzen einen `cropImage`-Ausschnitt.
- 18 / 18 Landmarks besitzen einen `cropImage`-Ausschnitt (Calf/Ankle nutzen die passende Messabbildung als Referenz).

## Region-Policy
Produktive PROT-Messvorschauen suchen nicht im ganzen Körper. Regionale Querschnitte werden aus Dreieckskanten erzeugt, deren Vertices zur erlaubten Skinweight-Region gehören. Wenn keine sichere Region-Geometrie entsteht, wird die Messung blockiert statt auf Whole Body zurückzufallen.

Explizit getrennt sind u. a.:
- `leftThigh` / `rightThigh`
- `leftCalf` / `rightCalf`
- `leftAnkle` / `rightAnkle`
- `leftUpperArm` / `rightUpperArm`
- `leftForeArm` / `rightForeArm`
- `leftHand` / `rightHand`
- `torso`
- `neck` / `neckBase`
- `head`

## Statische Checks
- `node --check app.js`: bestanden.
- `ansur-protocol-v1.json`: valides JSON.
- HTML IDs: eindeutig.
- 24 Protocol-Maße vorhanden.
- ZIP-Struktur: flach, keine Unterordner.

## Noch visuell zu prüfen
Die korrigierten Arm-/Beinrichtungen müssen auf dem echten iPhone/Safari-WebGL-Render bestätigt werden. Der lokale Container konnte Chromium nicht mit funktionsfähigem WebGL starten; deshalb wird kein visueller Erfolg behauptet, bevor der Build auf dem Zielgerät geprüft wurde.
