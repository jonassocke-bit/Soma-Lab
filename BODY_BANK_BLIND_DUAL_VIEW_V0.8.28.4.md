# BODY BANK Blind Mix + Dual Viewport · v0.8.28.4

## Ziel

Phase 2 bleibt inhaltlich derselbe 400er Grenz-/Extremraum, wird für den Reviewer aber vollständig blind präsentiert. Weder Testtyp, Familie, Variantenrichtung, Ausgangsanker noch Wiederholungsstatus werden während der Bewertung angezeigt.

## Blind-Mix

`body-bank-phase2-plan-v2.json` mischt alle 400 Fälle deterministisch. Direkte Nachbarschaft derselben `familyId` bzw. desselben Elternankers wird vermieden; verdeckte Wiederholungen liegen weit vom Original entfernt. Der gespeicherte Shuffle-Seed macht die Reihenfolge reproduzierbar, ohne dem Reviewer eine Serie zu zeigen.

## Erwachsenen-Statur

Der Audit zeigt keine Erwachsenen über 205 cm. 114 Rezepte des ursprünglichen Phase-2-Plans wurden konservativ vorgekappt; die höchste daraus prognostizierte Statur liegt bei ca. 201 cm. Vor jeder Anzeige prüft die Runtime zusätzlich die tatsächliche pose-unabhängige Rest-Mesh-Statur. Falls sie noch >205 cm ist, wird ausschließlich `height` reduziert, bevor das Mesh sichtbar wird. Wiederholungen erhalten identisch dieselbe angepasste Rezeptur.

## Dual Viewport · nur BANK

BANK rendert dieselbe Szene in zwei Scissor-Viewports A/B auf dem vorhandenen WebGL-Canvas. Beide Kameras besitzen eigene OrbitControls und behalten unabhängig Zoom, Orbit, Pan und Zielpunkt. Der zuletzt berührte, gezoomte oder gedrehte Viewport wird aktiv und dezent markiert.

Die Kamera-UI (`Vorne`, `¾`, `Seite`, `Hinten`, `AutoFit`) wirkt ausschließlich auf den aktiven Viewport. Pose und Animation bleiben absichtlich synchron, damit derselbe Bewegungsframe gleichzeitig aus zwei Richtungen beurteilt werden kann.

## AutoFit

AutoFit ist pro Viewport separat schaltbar. Bei `AN` wird beim Personenwechsel nur die Kamera dieses Viewports neu auf die aktuelle Körper-BBox skaliert; die Blickrichtung bleibt erhalten. Bei `AUS` bleibt der Kamerazustand exakt stehen. Ein expliziter View-Button darf jederzeit neu einrahmen.

## Objektivität

Der optionale Schnellgrund startet jetzt leer. `Beine zu lang` wird nicht mehr vorausgewählt, damit die Phase-1-Beobachtung den neuen Blind-Audit nicht primt.

## Bewusst vertagt: Kopfmodell

Die Quellcodeprüfung von Anny zeigt separate Phenotypachsen (`height`, `weight`, `age` usw.) und zusätzliche lokale Kopf-Morphs (`head-fat`, Kopf-Skalierung). Eine anthropometrische Kopplung von Kopfgröße/Kopffett an Körpergröße/Gewicht ist daher keine sichere implizite Eigenschaft des Modells. Diese Frage bleibt außerhalb des aktuellen Audits und wird später mit bekanntem absolutem Größenmaßstab separat geprüft.
