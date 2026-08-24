# Sammy v0.8.24.0 · MORPH OBSERVATORY v1

## Zweck

Vor einem neuen hierarchischen/coarse-to-fine Solver wird der vorhandene Anny-Shape-Space explizit vermessen. Der bisherige Solver behandelte Morphs zu stark als gleichberechtigte numerische Freiheitsgrade. MORF erzeugt deshalb eine maschinenlesbare Wirkungs-Taxonomie und trennt Messdefinition, Rig-Struktur, Meshform und Solverpolitik.

## Semantische Locks aus der manuellen Sichtprüfung

- `Weight × Muscle` bleibt **gekoppelt** und wird nicht in zwei unabhängige physiologische Größen umgedeutet. Derselbe Muscle-Wert hat je nach Weight-Kontext eine andere sichtbare Bedeutung.
- `Proportions` wird separat als grobe **Schulter↔Hüfte-Balance** behandelt; niedriger = breitere Schulter/schmalere Hüfte, höher = umgekehrt. Keine globale Composition-Achse. Werte außerhalb des authored Bereichs 0…1 werden in v1 nicht automatisch extrapoliert.
- `Firmness` ist ein **rein weiblicher Brust-Hängegrad/Straffheitsregler** und kein globaler Body-Composition-Parameter.
- `Cupsize` bleibt lokale weibliche Brustgröße.
- Diese Locks ändern in v0.8.24.0 den Production-Solver noch nicht; MORF soll zuerst die tatsächlichen Wirkungen messen.

## Vier Beobachtungsebenen

1. **RIG / Skeleton Signature**
   - 78 exakte shape-abhängige SOMA-Jointpositionen
   - Joint-Delta pro Morphzustand
   - Segmentlängen Torso, Ober-/Unterarm, Ober-/Unterschenkel
   - Schulter- und Hüftgelenk-Breite

2. **MESH / Geometry Signature**
   - Low-Res-Restmesh, keine posed surface als Morph-Truth
   - regionale RMS-/Max-/XYZ-Verschiebung über dominant geskinnten Körperregionen
   - Bounding-Box-Änderung
   - geschlossenes Meshvolumen über den bestehenden Topologie-/Volumenoperator
   - keine Rohvertex-Deltas im Export, damit FULL-Dateien kompakt bleiben

3. **PROFILE / Section Signature**
   - 25 / 50 / 75 % entlang von Oberarm, Unterarm, Oberschenkel und Unterschenkel
   - zwei Querschnittsachsen + Convex-Hull-Perimeter
   - damit können z. B. `lowerleg-fat`, `lowerleg-muscle` und gekoppelte Depth/Horizontal-Scale-Morphs trotz ähnlichem Calf Circumference räumlich unterschieden werden

4. **ANSUR / Measurement Signature**
   - dieselben 24 `ANSUR24-PROT-v2` Operatoren und MeasurementStates wie Solver24
   - Maße sind Wirkungssignatur, nicht alleinige Morphsemantik

## Automatische Wirkungsfamilien

Nach den Einzel-Sweeps erzeugt MORF Hypothesen für:

- structural / rig
- local surface
- distributed volume
- global mass/composition
- shoulder↔hip balance
- breast/local soft tissue
- context-dependent Morphs
- coupled-axis candidates (z. B. Depth + Horizontal)
- composition alternatives (z. B. Fat vs Muscle derselben Region)
- redundant candidates

Nur morphologisch ähnliche Kandidatenpaare werden anschließend auf echte Nichtadditivität geprüft. Dadurch wird nicht der komplette O(N²)-Sliderraum getestet.

## Interaktion / Potenzierung

Für ein Kandidatenpaar A/B wird bei moderater gemeinsamer Aktivierung geprüft:

`Interaction = Effect(A+B) - Effect(A) - Effect(B)`

Exportiert werden u. a. ANSUR24-Interaktions-RMSE, größtes Maßresiduum, Volumeninteraktion, **vektorielle Rig-Nichtadditivität pro Joint**, regionale mittlere Verschiebungs-Nichtadditivität und die Nichtadditivität der Limb-Profil-Perimeter. Große Werte markieren Paare, die später nicht unabhängig in einem Solver behandelt werden sollten.

Wichtig: Depth/Horizontal-Paare werden als **gekoppelte Achsen-Kandidaten** erkannt, aber nicht irreversibel zu einem Raw-Slider verschmolzen. Solange nur Umfangsinformation vorliegt, kann ein späterer Solver sie gemeinsam steuern; bei zusätzlicher Breadth/Depth- oder Scaninformation bleiben beide Freiheitsgrade separat verfügbar.

## Visueller Atlas

Der Nutzer kann nach einem Lauf einen Slider auswählen. MORF erzeugt dann **on demand** eine einzige 3×3-JPEG-Kontaktseite:

- Zeilen: Min / Referenz / Max
- Spalten: Front / Seite / Rücken

Die Bilder werden bewusst nicht automatisch für alle Morphs gespeichert und sind nicht Bestandteil des FULL-JSON. Das hält iPhone/Safari-Speicher und Exportgröße beherrschbar.

## Modi

- **Quick:** priorisierte Körpermorphs, 3 Levels, wenige Paarchecks
- **Standard:** alle körperrelevanten Core-/Local-Morphs, neutrale ♂/♀ Local-Kontexte plus zusätzliche Weight/Muscle-Kontexte für globale Achsen, 3 Levels
- **Deep:** 5 Levels, mehr Kontextkörper und mehr gezielte Paarinteraktionen

## Solver-Status

Solver24 v0.8.23.0 wird in diesem Build absichtlich nicht umgebaut. Das Observatory ist die Datengrundlage für einen späteren parallelen **hierarchischen Solver**, der voraussichtlich in Stufen arbeitet:

Structural Rig → globale Masse → Schulter/Hüfte → regionale Composition → Segmentlängen/Landmarkpositionen → lokale reine Maßkorrektur.

Frühere Stufen sollen dabei nicht blind hart eingefroren werden, sondern als hochpriorisierte Constraints/Nullraum-Bedingungen geschützt bleiben.


## Laufisolation / iPhone-Sicherheit

MORF besitzt während eines Samples den aktuellen Shape-/Measurement-State. Beim Versuch, das Lab während eines aktiven Samples zu verlassen, wird zuerst eine saubere Pause nach dem atomaren Sample angefordert; danach wird der vorherige Körperzustand restauriert. So können SOLV/INFL nicht parallel gegen einen halbfertigen Observatory-Zustand laufen. Die Records liegen inkrementell in IndexedDB; Rohvertex-Deltas und Atlasbilder werden nicht in den FULL-Export geschrieben.
