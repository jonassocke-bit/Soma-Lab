# Sammy v0.8.19.1 · Native Pose Rescue + PROT Measurement Overlay

Basis: v0.8.19.0. Dieser Stand ist bewusst ein **Rescue-/Verifikationsstand** nach dem fehlgeschlagenen FBX-Poseversuch. MEAS, ANSUR-Protokoll, Solver und Produktionsdefinitionen bleiben getrennt.

## Was v0.8.19.1 ausdrücklich verwirft

Der PROT-Modus retargetet die beiden Nutzer-FBX **nicht mehr** in Sammy. Ebenfalls entfernt ist der Ansatz, Posekorrekturen über geratenen lokale Euler-Achsen einzelner Bones zu erzeugen. Genau diese beiden Wege führten in v0.8.19.0 zu gekreuzten Beinen, falschen Armstellungen und unbrauchbaren Sitzposen.

Die Dateien `sammy-ansur-standing-source.fbx` und `sammy-ansur-sitting-source.fbx` bleiben nur als lokale Referenzassets im flachen Paket; PROT lädt sie nicht.

## Zwei native Basisposen

PROT besitzt weiterhin genau zwei kanonische Grundposen:

1. `Anthropometric Standing`
2. `Anthropometric Sitting`

Sie werden jetzt direkt aus der vorhandenen SOMA/Axis16-Referenzgeometrie aufgebaut. Die Poseengine beschreibt gewünschte **Welt-Richtungen** von Gelenksegmenten und wandelt sie anschließend in Public-78-Relative-Matrizen um. Die Anwendung auf den aktuellen Körper erfolgt über Sammys bereits vorhandenen exakten `Axis16 → Anny/SOMA`-Pfad.

### Standing

Automatisch und numerisch prüfbar:

- Becken-/Rumpf-/Halskette wird zur Welt-Y-Achse aufgerichtet;
- beide Beine bleiben gerade und symmetrisch;
- Fuß-/Knöchelabstand wird geometrisch auf das Ziel geführt (Standard ca. 2 cm als technische Annäherung an „heels together as much as possible“);
- Arme hängen reproduzierbar an den Seiten;
- Fuß-/Zehenorientierung bleibt in der kanonischen Axis16-Weltorientierung.

### Sitting

Automatisch und numerisch prüfbar:

- Rumpf/Hals werden aufgerichtet;
- Oberschenkel werden horizontal nach vorn ausgerichtet;
- Unterschenkel werden vertikal nach unten ausgerichtet;
- Füße/Zehen bleiben in der kanonischen flachen/forward Orientierung;
- Oberarme hängen seitlich, Unterarme werden horizontal nach vorn geführt;
- nach dem Skinning wird der ganze Körper auf das gleiche Bodenniveau wie die Restpose verschoben, damit die Sitzpose nicht mehr in der Luft schwebt.

Sitzkante, reale Kontaktkräfte, Footrest-Höhe und Frankfurt-Ebene bleiben sichtbare Prüfkriterien. Die App behauptet dafür keine physikalische Simulation.

## Sicherheitsbremse für Sonderposen

Bis **Standing und Sitting visuell freigegeben** sind, werden komplexe Modifier absichtlich nicht mehr automatisch geraten. Dazu gehören unter anderem:

- Hände auf Hüften;
- rechte Hand auf Brust;
- Palm-up / Palm-forward Twist;
- WBX-Fäuste und detaillierte Armhaltung;
- Hände auf Schoß / Sitzkontaktziele.

PROT zeigt diese Anforderungen weiterhin aus dem ANSUR-Protokoll, kennzeichnet sie aber als `AUTO AUSGESETZT`. Ein solcher Pose-Schritt kann nicht versehentlich mit `Pose ✓` freigegeben werden.

Numerisch sichere Standbreiten-Modifier (10 cm, Thigh-clearance-Startwert, Crotch-Setup, 30 cm) bleiben aktiv, weil sie aus echter Weltgeometrie statt lokaler Boneachsen berechnet werden.

## PROT zeigt jetzt endlich die vorhandene MEAS-Geometrie

Für jedes der 24 PROT-Zielmaße wird die bereits existierende Measurement-Lab-Pipeline wiederverwendet:

- `sammyComputeAllMeasures()` berechnet den aktuellen Wert;
- `sammyMeasureLinePoints()` liefert die bestehende Linie / Schleife / Breite / Tiefe / Segmentdarstellung;
- PROT zeichnet diese Geometrie **gelb direkt auf dem Mannequin**;
- im Panel steht der aktuelle Wert in cm als `MEAS CURRENT`;
- `Messlinie AN/AUS` blendet nur diese bestehende MEAS-Geometrie um.

Wichtig: `MEAS CURRENT` ist bewusst **noch keine ANSUR-Freigabe**. Es zeigt den aktuellen Produktions-/Measurement-Lab-Stand als Vergleichsebene, während PDF-Definition, Landmark-Audit und Protokollfreigabe separat bleiben.

## Audit-State v2

Weil die Posearchitektur geändert wurde, verwendet PROT einen neuen Audit-State `sammy-ansur-protocol-audit-v2`. Alte Posefreigaben aus dem fehlgeschlagenen v0.8.19.0-Pfad werden nicht still weiterverwendet.

## Erwarteter iPhone-Test

Zuerst nur die zwei Buttons **Stehen** und **Sitzen** prüfen.

Standing muss erfüllen:

- keine gekreuzten Beine;
- Füße nahe beieinander und nach vorn;
- Rumpf senkrecht;
- Kopf/Hals nicht deutlich nach vorne geknickt;
- Arme ruhig seitlich.

Sitting muss erfüllen:

- klar erkennbare Sitzhaltung statt Knien/Schweben;
- Oberschenkel annähernd horizontal;
- Knie annähernd 90°;
- Unterschenkel annähernd vertikal;
- Füße flach/forward auf Bodenniveau;
- Rumpf aufrecht;
- Unterarme nach vorn.

Dann drei Messvisualisierungen prüfen:

1. `Acromion-Radiale Length` → gelbes Segment am rechten Oberarm;
2. `Waist Circumference (Omphalion)` → gelbe geschlossene Umfangslinie;
3. `Chest Depth` → gelbe Tiefenlinie + Wert in `MEAS CURRENT`.

## Ehrliche Grenze dieses Builds

Die JS-/JSON-/Paketstruktur kann statisch geprüft werden, aber die exakte Anny-Pose kann in dieser Arbeitsumgebung nicht mit dem produktiven extern geladenen Anny-Pack visuell gerendert werden. Daher ist v0.8.19.1 **kein behaupteter Pose-Erfolg**, sondern der erste Build, der die bekannten architektonischen Fehler beseitigt und die Posequalität mit numerischen Metriken + iPhone-Sichtprüfung verifizierbar macht.

Falls auch diese zwei nativen Basen visuell falsch sind, ist die nächste sinnvolle Alternative **kein weiterer Winkelversuch**, sondern Pose-Authoring auf exakt demselben SOMA/Anny-Rig in einem externen Rig-Editor (z. B. Blender) und Import der fertigen nativen Local-Ref-Posematrizen.

## Paketstruktur

Das GitHub-Paket bleibt vollständig flach. Keine Asset-Unterordner.
