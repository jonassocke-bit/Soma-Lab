# SOMA Browser PoC v0.5.20

Standalone iPhone/browser feasibility test for NVIDIA SOMA-X.

This deliberately does not modify BODY LAB.

Tests:
1. Direct anonymous download of `SOMA_neutral.npz` from NVIDIA's public Hugging Face repository.
2. Browser-side NPZ/NPY parsing.
3. Low-LOD SOMA mean body render.
4. Real 128-component SOMA PCA shape reconstruction in JavaScript.
5. Public rig/procedural sidecar reachability and joint contract.
6. Explicitly stops before claiming pose support: actual LBS requires a compact extraction of hierarchy, bind transforms and skinning weights from `SOMA_template_rig.usda`.

No MakeHuman code is used.

## v0.1.1

- iOS/Safari-sichere NPY-Payload-Kopie mit ausgerichtetem ArrayBuffer.
- Bounds-Check für abgeschnittene NPY-Payloads.
- Unterstützt `fortran_order=True` durch Konvertierung in C-Reihenfolge; das war der konkrete Abbruchpunkt in v0.1.
- Fehler nennen jetzt das betroffene `.npy`-Array.


## v0.1.2

- Punkt 4 repariert: Der Procedural-Sidecar liegt im offiziellen NVlabs-GitHub-Repository unter `assets/` und nicht am bisher verwendeten Hugging-Face-Root-Pfad.
- Offizielle Quelle für den Rig-Vertrag auf Commit `86632764684281dc98f31ab9c4aac36a4cdbc428` gepinnt.
- Korrektes JSON-Feld verwendet: `public_rig_derivation.main_joint_names`.
- Prüft jetzt explizit 78 Public-Rig-Namen (inkl. Root) und 122 Template-Joints aus dem Sidecar.
- Das große `SOMA_template_rig.usda` wird weiterhin nicht vollständig heruntergeladen.
- Safari-Fehleranzeige für den Rig-Test verbessert, damit künftig auch die eigentliche Fehlermeldung sichtbar bleibt.


## v0.1.3 – persistenter Asset-Cache

- Große SOMA-Daten werden jetzt in einer stabil benannten IndexedDB (`SomaLabAssetCache`) gespeichert.
- Der Cache ist bewusst nicht an die App-Version gekoppelt. Ein in v0.1.3 gespeichertes `SOMA_neutral.npz` wird von späteren Soma-Lab-Versionen wiederverwendet.
- Der 27,5-MB-Shape-Download wird nach dem ersten erfolgreichen Laden aus dem persistenten Cache gelesen.
- Auch der Procedural-Rig-Sidecar nutzt dieselbe Cache-Schicht.
- Künftige große Assets/Rig-Packs sollen über `fetchAssetBytes()` geladen werden und damit automatisch denselben versionsübergreifenden Cache verwenden.
- Ist ein gecachtes Shape-Asset beschädigt, löscht Soma-Lab nur dieses Asset und lädt es genau einmal frisch.
- Wenn der Browser `navigator.storage.persist()` unterstützt, fordert Soma-Lab persistenten Site-Speicher an.

Grenze: Ein App-Versionswechsel löscht den Cache nicht. iOS/Safari kann Website-Daten aber weiterhin entfernen, wenn Website-Daten manuell gelöscht werden, privates Browsen verwendet wird oder das System Site-Daten unter Speicherknappheit bereinigt.


## v0.1.4 – echtes Browser-LBS aus dem eingebetteten Public-Rig

Beim Prüfen des offiziellen SOMA-v0.1-Runtimes zeigte sich, dass die erste öffentliche
`SOMA_neutral.npz` nicht nur Shape-PCA enthielt, sondern auch:

- `joint_parent_ids`
- `bind_pose_world`
- `bind_pose_local`
- `bind_shape`
- sparse CSC-Skinweights (`data`, `indices`, `indptr`, `shape`)

Das Hugging-Face-Asset, das Soma-Lab bereits für den 27,5-MB-Shape-Test verwendet und
versionsübergreifend cached, stammt aus dieser ersten öffentlichen Asset-Generation.
v0.1.4 prüft die Felder zur Laufzeit und verwendet sie nur, wenn sie wirklich vorhanden sind.

Der Browser-Test:

1. validiert 78 Public-Joints inkl. Root,
2. rekonstruiert Low-LOD-Skinweights und behält bis zu 8 Einflüsse pro Vertex,
3. validiert die Bind-Hierarchie, indem `bind_pose_local` per FK gegen `bind_pose_world`
   rekonstruiert wird,
4. validiert eine neutrale LBS-Runde gegen den unverformten Rest-Shape,
5. führt danach echte Joint-Rotation + FK + Linear Blend Skinning vollständig in JavaScript aus,
6. bietet Arm-, Bein-, Wirbelsäulen- und Finger-Presets sowie freie X/Y/Z-Rotation.

Wichtig: Das beweist den echten 78-Joint-Browser-LBS-Pfad des offiziellen SOMA-v0.1-Assets.
Der aktuelle v0.2-Template-Rig besitzt 122 Joints inklusive prozeduraler Twist-Joints. Dessen
kompakte 122→78-Ableitung sowie shape-adaptives Skeleton-Rebinding bleiben eigene Folgetests.


## v0.1.5 – Motion-/Pose-Stresstest

Diese Version baut auf dem bereits auf dem iPhone bewiesenen 78-Joint-Browser-LBS auf.
Es werden keine neuen großen Assets geladen; der versionsübergreifende Cache bleibt unverändert.

Neu:

- deutlich aussagekräftigere Ganzkörper-Presets:
  - T-Pose
  - Arme hoch
  - Kniebeuge
  - Laufpose
  - asymmetrische Action-Pose
  - Greifen/Finger-Curl
- kontinuierlicher **Gang-Loop** als dynamischer Ganzkörpertest
- kontinuierlicher **Rig-Stress** mit großen Schulter-/Armbewegungen, alternierenden Beinen,
  Wirbelsäule, Hals/Kopf und Finger-Curl
- Animationstempo 0,25× bis 2,00×
- Animation läuft mit Zielrate 30 LBS-Updates/s und zeigt:
  - durchschnittliche LBS-Zeit
  - maximale LBS-Zeit
  - Vertex-/Joint-Anzahl
  - die WebGL-Render-FPS bleiben oben rechts sichtbar
- manuelle Gelenkregler oder statische Presets übernehmen automatisch die Kontrolle von einer laufenden Animation.

Wichtig:
Dies ist weiterhin der echte eingebettete 78-Joint-Rig des SOMA-v0.1-Assets.
Der aktualisierte v0.2-Template-Rig mit 122 Joints/Procedural-Twist-Joints und das
shape-adaptive Skeleton-Rebinding bleiben separate Folgetests.


## v0.1.6 – Fix der SOMA-Posekoordinaten

Der v0.1.5-Test hat LBS, Hierarchie und Skinweights erfolgreich bewiesen, aber gleichzeitig
einen Fehler in unserer selbstgebauten Pose-Runtime sichtbar gemacht: Die richtigen Joints
wurden bewegt, aber die Rotationen wurden direkt als

`bind_pose_local × Euler-Delta`

angewendet. Das entspricht nicht SOMAs Posekonvention.

Der offizielle SOMA-Runtime-Pfad benutzt `t_pose_world` als Joint-Orient und transformiert
jede relative Pose-Rotation nach:

`R_final[j] = orient[parent(j)]^T × R_relative[j] × orient[j]`

Erst danach werden die Bind-Translations ergänzt, FK ausgeführt und LBS angewendet.

v0.1.6 portiert genau diese Joint-Orient-Logik in den Browser.

Zusätzliche Prüfungen:
- Bindpose-FK bleibt separat validiert.
- Bind-LBS wird separat gegen den unverformten Restkörper validiert.
- Bei einer All-Zero-Relative-Pose wird geprüft, ob die resultierenden World-Rotationen
  `t_pose_world` reproduzieren.
- „T-Pose“ / „SOMA Nullpose“ nutzt jetzt wirklich die SOMA-All-Zero-Pose statt einer
  von uns geratenen Armrotation.

### Offizielle NVIDIA-Testanimation

Zusätzlich kann `example_animation.npy` direkt aus dem offiziellen SOMA-X-Asset geladen werden.
Sie wird über denselben IndexedDB-Cache wie die 27,5-MB-Shape-Datei dauerhaft gespeichert
(ca. 5,6 MB einmalig).

Die Motion-Konvertierung folgt dem offiziellen Demo:
1. lokale Motion-Rotationen → FK in World Space,
2. `world @ transpose(t_pose_world)`,
3. zurück nach Local Space,
4. Root wird als Identity gepaddet,
5. anschließend die normale SOMA Joint-Orient + FK + LBS Pipeline.

Die offizielle Animation ist damit der aussagekräftigste Gegencheck dafür, ob unsere
Browser-Portierung dieselbe Posekonvention wie NVIDIA verwendet.

Noch offen:
- shape-adaptives Skeleton-Rebinding,
- aktueller v0.2-122-Joint/Procedural-Twist-Rig-Pack,
- Pose-Correctives.


## v0.1.7 – sichtbares Rig-/Achsen-Debug im Viewport

Der Nutzerbefund aus v0.1.5/v0.1.6 war konsistent:
- die *richtigen* Gelenke werden bewegt,
- aber die Wirkung vieler Posen/Animationen ist weiterhin zu stark bzw. teilweise achsenfalsch.

Deshalb kombiniert v0.1.7 zwei Dinge in einem Schritt:
1. die bisherige Pose-/Animationsprüfung bleibt erhalten,
2. zusätzlich wird das aktuell aktive Skinning-Rig direkt im Viewport sichtbar gemacht.

Neu:
- gelbes Knochen-Overlay + grüne Joint-Punkte
- optionale lokale Gelenkachsen (Rot = X, Grün = Y, Blau = Z)
- Einzelgelenk-Tests für das aktuell gewählte Joint: +10°, +20°, +30°, −10°
- direkte Trennung von
  - „Joint korrekt adressiert, aber Achse/Winkel noch falsch“
  - versus
  - „unsere Preset-/Animationswinkel sind einfach zu aggressiv“

Wichtig:
Dieses sichtbare Rig-Debug nutzt weiterhin den aktuell aktiven 78-Joint-Browser-LBS-Pfad.
Es ersetzt noch nicht den späteren echten v0.2-122-Joint/Procedural-Twist-Rig-Pack, hilft aber genau dabei, den Restfehler vor diesem nächsten Schritt sauber einzugrenzen.


## v0.1.8 – adaptives mitmorphendes v0.1-Rig

Aus dem v0.1.7-Debug ergab sich klar:
- kleine Einzelwinkel (z. B. +10°) wirkten nicht grundsätzlich falsch,
- aber das sichtbare Skelett saß bei gemorphten Shapes teilweise außerhalb des Körpervolumens,
- also morphten Mesh und Skelett noch nicht gemeinsam.

Daraufhin führt v0.1.8 eine **experimentelle shape-adaptive Rig-Anpassung** ein, ohne schon den großen v0.2-/122-Joint-Rig-Pack vorauszusetzen.

Grundidee:
- `bind_shape` aus dem eingebetteten SOMA-v0.1-Asset dient als Referenzkörper,
- die vorhandenen Skinweights werden für jedes Joint als weiche Vertex-Anker verwendet,
- daraus werden Joint-Schwerpunkte im `bind_shape` und im aktuellen gemorphten Shape verglichen,
- die Joint-Translationen der Bindpose werden entsprechend angenähert verschoben,
- daraus werden aktive Bindpose/Inverse-Bind-Matrizen neu aufgebaut.

Wichtig:
- Rotationskonvention bleibt die bereits korrigierte SOMA-T-Pose/Joint-Orient-Logik.
- Dies ist **noch kein vollständiges shape-adaptives Rebinding**.
- Der spätere v0.2-/122-Joint-/Twist-Rig-Pack bleibt weiterhin der nächste größere Datenstand.

Ziel dieses Schritts:
Das Skelett soll bei Shape-Änderungen sichtbar besser *im* Mannequin sitzen, bevor wir in den finalen Rig-Pack übergehen.


## v0.1.9 – synthetische Knie-Richtung korrigiert

Die offizielle NVIDIA-Animation funktioniert mit dem adaptiven Rig korrekt genug, während die selbstgebauten synthetischen Posen die Knie sichtbar in die falsche Richtung geknickt haben.

Wichtig: Das war **kein globaler Y-Achsenfehler der SOMA-Runtime**. In unseren synthetischen Presets/Loops wird die Kniebeugung tatsächlich über die lokale X-Komponente der `LeftShin`/`RightShin`-Joints erzeugt. Der dort verwendete Vorzeichenwert war für die SOMA-Posekonvention falsch.

v0.1.9 ändert deshalb nur die selbstgebauten Tests:
- Kniebeuge
- Laufpose
- Action-Pose
- synthetischer Gang-Loop
- synthetischer Rig-Stress

Die offizielle NVIDIA-Animation, Joint-Orient-Mathematik, Skinweights und adaptive Rig-Anpassung bleiben unverändert.


## v0.2.0 – Current Rig-Pack Bootstrap

Der bisherige v0.1-Pfad hat Shape, Browser-LBS, Posekonvention, NVIDIA-Motion und ein erstes mitmorphendes Rig bewiesen. v0.2.0 beginnt deshalb bewusst den Wechsel auf NVIDIAs aktuellen v0026-Rig-Datenstand.

Der aktuelle `SOMA_template_rig.usda` ist ein Git-LFS-Asset mit rund 329 MB. Er wird **nicht** dauerhaft im iPhone-Browser verwendet. Stattdessen liegt diesem Projekt ein einmaliger GitHub-Actions-Extractor bei:

- `extract_current_rig_pack.py`
- `RIGPACK_WORKFLOW.yml`
- `rigpack-setup.html`

Der Builder extrahiert aus dem aktuellen USD:
- Expanded Target-Rig (inkl. procedural/twist joints)
- daraus offiziell abgeleiteten Public SOMA-Rig (78 inkl. Root)
- Bind-/T-Pose und Hierarchien
- Low-LOD-Skinweights für 4505 Vertices
- Public↔Target-Mappings
- kompletten Procedural-Sidecar
- die vorab berechnete lineare RBF-Matrix für die offiziellen Current-Skeleton-Jointpositionen auf Low LOD

Das Browser-Asset heißt `soma_current_rig_pack_v0026.npz` und wird nach dem ersten Laden wieder versionsübergreifend in `SomaLabAssetCache` gespeichert.

### v0.2.0 Testgrenze

Wenn der Pack auf dem iPhone erfolgreich geprüft wurde, kann v0.2.0 bereits den **aktuellen aus v0026 abgeleiteten 78-Joint-Public-Rig** aktivieren und dessen vorab berechnete RBF-Jointpositionen für Shape-Änderungen verwenden.

Noch absichtlich **nicht als bestanden** markiert:
- interner Expanded/Procedural/Twist-LBS-Pfad des aktuellen Target-Rigs
- Current SkeletonTransfer Rotations-Fitting
- Pose-Correctives

Diese kommen erst nach dem realen iPhone-Pack-Test, damit wir die neue Grundlage nicht wieder in einem großen ungetesteten Umbau verstecken.


## v0.5.20 – Current Expanded 122-Joint LBS

Nach dem realen iPhone-Test von v0.2.0 ist der kompakte v0026-Rig-Pack bewiesen. v0.5.20 aktiviert nun den eigentlichen Expanded-Skinning-Pfad:

- 77 user-facing SOMA Pose-Joints bleiben die Bedien-/Motion-Schnittstelle.
- Intern werden die aktuellen 122 Target-Joints aus dem v0026-Rig verwendet.
- Low-LOD Skinweights stammen direkt aus `target_skinning_*` des erzeugten Current Rig-Packs.
- Public RBF Skeleton-Fit läuft beim Shape-Morphing weiter.
- Die fitted Public-Bindpose wird über SOMAs Procedural-Translation-Matrix auf den Expanded Target-Rig übertragen.
- Die acht SOMA Twist-Segmente werden aus dem Sidecar kompiliert; deren Twist-Helfer werden automatisch aus der Public-Pose abgeleitet.
- Der aktuelle Sidecar-Modus `aligned_x_swing_twist` wird browserseitig ausgewertet.
- NVIDIA Motion, manuelle Joint-Slider und Shape-Regler gehen nach Aktivierung alle durch den Expanded-LBS-Pfad.
- Rig-Debug kann zwischen Public 78 und Expanded 122 umschalten.

Noch bewusst offen: das vollständige shape-adaptive **Rotation-Fitting** der offiziellen `SkeletonTransfer`-Pipeline. v0.5.20 verwendet für die Shape-Anpassung die offiziellen vorberechneten RBF-Jointpositionen und die aktuelle Procedural-Expansion, aber noch keine vollständige Browser-Portierung des Kabsch/Newton-Schulz Rotations-Fits.

- v0.5.20 merkt die zuletzt tatsächlich angewendete 78-Joint-Relativpose. Shape-Regler können dadurch eine laufende/aktuelle Pose nach dem Rebind wieder anwenden, statt beim Morphen ungewollt auf die Slider-Nullpose zurückzuspringen.


## v0.5.20 – 122-Joint-Hierarchie reihenfolgeunabhängig

Der erste echte iPhone-Test von v0.2.1 erreichte `PACK OK`, stoppte beim Aktivieren des Expanded-Rigs aber mit `122 FEHLER`. Der sichtbare Ablauf zeigte, dass der Public-Rig-Teil bereits initialisiert war und der Fehler erst beim Expanded-Posepfad auftrat.

Diese Version entfernt deshalb eine unzulässige Annahme aus dem Browser-FK: Target-Joints müssen **nicht** in Parent-vor-Child-Reihenfolge im USD/Pack stehen. Sowohl die T-Pose-Prüfung als auch der Expanded-Pose-FK werden jetzt rekursiv/hierarchiegetrieben aufgebaut und erkennen echte Zyklen/ungültige Parents explizit.

Zusätzlich:
- Public `t_pose_world` wird browserseitig robust aus `public_t_pose_local + parent_ids` rekonstruiert.
- Punkt 5 zeigt bei einem Fehler jetzt direkt die exakte Aktivierungsstufe und Fehlermeldung.
- Bei einem 122-Fehler fällt die App sauber auf den funktionierenden Current-Public-78-Pfad zurück.
- Im Rig-Pack-Infofeld wird die Zahl der Parent-Vorwärtsverweise angezeigt.

Der vorhandene `soma_current_rig_pack_v0026.npz` und dessen persistenter Cache bleiben unverändert gültig; der GitHub-Actions-Builder muss für v0.5.20 nicht erneut ausgeführt werden.


## v0.5.20 – robuster Current-Rig-Pack Loader

Der bereits erzeugte `soma_current_rig_pack_v0026.npz` wird nicht neu erzeugt.

Der Browser versucht ihn jetzt in dieser Reihenfolge:

1. persistenter IndexedDB-iPhone-Cache,
2. GitHub Pages mit Cache-Busting,
3. `raw.githubusercontent.com` als Netzwerk-Fallback.

Falls ein gecachter Rig-Pack beschädigt ist, wird ausschließlich dieser eine
Cacheeintrag gelöscht und einmalig neu geladen. Shape- und Motion-Caches bleiben
unangetastet.

Damit darf ein kurzfristiges GitHub-Pages-/HTTP-Cache-Problem den 122-Joint-Test
nicht mehr blockieren.


## v0.5.20 – Joint-Name-Separator-Fix

Die v0.2.3-Fehlermeldung hat den eigentlichen Fehler sichtbar gemacht:
Der erste erzeugte Rig-Pack speichert `target_joint_names_utf8` und
`public_joint_names_utf8` mit dem *literalen* Trenner `\n` statt echten
Newline-Zeichen. Dadurch sah der Browser die komplette Namensliste als einen
einzigen Namen und konnte z. B. `LeftArm -> LeftForeArm` nicht auflösen.

v0.5.20:
- liest sowohl echte Newlines als auch den bereits erzeugten Legacy-`\n`-Pack,
- prüft 122 Target- und 78 Public-Namen explizit,
- prüft alle Twist-Joint-Namen vor Aktivierung,
- korrigiert zusätzlich den Extractor für jede spätere Rig-Pack-Neuerzeugung.

Der vorhandene `soma_current_rig_pack_v0026.npz` muss NICHT neu erzeugt werden.


## v0.5.20 – Shape-Space Analyzer + semantische Live-Modifier

Neuer PoC-Schritt nach bestandenem Current-v0026-122-Joint-LBS:

1. Das Modell wird für reproduzierbare Messung in die T-Pose gesetzt.
2. Alle 128 SOMA-PCA-Komponenten werden am aktuellen Körper nacheinander mit
   +0,35σ und −0,35σ abgefahren.
3. Diese Morphs werden **real im Viewport gerendert**. Der Scan ist also live sichtbar.
4. Für jeden Perturbationsschritt werden sieben lokale Mess-Proxies ausgewertet:
   - Körperhöhe
   - Schultergelenk-Breite
   - Brustumfang
   - Taillenumfang
   - Hüftumfang
   - Brusttiefe
   - Hüfttiefe
5. Daraus entsteht eine lokale 7×128-Jacobian `Messänderung / PCA-σ`.
6. Die sichtbaren cm-Regler werden anschließend **nicht** auf einzelne PCs gemappt.
   Ein regularisierter Minimum-Norm-Solver kombiniert alle 128 PCs, um den Zielwert
   zu treffen und die übrigen sichtbaren Maße möglichst konstant zu halten.
7. Bei jeder Slider-Bewegung konvergiert der Solver in mehreren kleinen Iterationen
   sichtbar am Modell. Current RBF-Shape-Fit und 122-Joint-Bindpose werden dabei
   nach jeder Formänderung neu aufgebaut.

### Wichtige Grenze dieses PoC

Die Slider-/Solver-Architektur ist real. Die Messdefinitionen für Umfang und Tiefe
sind in v0.5.20 aber bewusst sichtbare, rig-relative horizontale Slice-Proxies.
Sie sind noch **keine** endgültig validierten anthropometrischen BODY-LAB-Maße.
Die nächste Stufe kann diese Messfunktionen durch belastbare Landmark-/Messregeln
ersetzen, ohne die Modifier-Architektur neu zu bauen.


## v0.5.20 – Anny on top of the proven SOMA architecture

This version does **not** restart the project.

Existing components kept unchanged:
- Three.js/browser rendering
- persistent IndexedDB asset cache
- canonical SOMA low topology
- current v0026 rig pack
- 78 public controls -> 122 internal skinning joints
- procedural twist
- adaptive public RBF joint-position fit
- browser LBS, poses, animation and rig debug

Only the rest-shape source becomes selectable:

- `SOMA PCA` = old 128D neutral PCA, kept as A/B reference
- `Anny` = official Anny v0.6 phenotype shapes retopologized to canonical SOMA topology

### Why a generated grid instead of PyTorch on iPhone?

Anny's phenotype blendshape coefficients are piecewise linear at authored phenotype
anchors and are multiplied across active phenotype dimensions. For this first
browser integration proof, GitHub Actions evaluates the **official Anny model**
at the complete Cartesian anchor grid of:

- Gender: 2 anchors (Male/Female)
- Height: 2
- Weight: 3
- Muscle: 3
- Proportions: 2
- Cupsize: 3

That is 216 rest shapes. Adult age (2/3), firmness (0.5) and equal race weights
are fixed for this test.

The browser performs multilinear interpolation inside those anchor cells. Gender
is intentionally **discrete**: there is no male/female mixing in the v0.5.20 UI.

The pack is low-LOD only (4505 vertices), so it is small enough for iPhone and
persistent caching. Once an Anny rest shape is selected, the existing SOMA
shape-adaptive rig is rebuilt and the current pose is re-applied.

### Acceptance test

1. Existing SOMA shape asset loads.
2. Existing current rig pack loads.
3. Expanded 122-joint LBS activates.
4. New Anny pack loads.
5. Switch to Anny.
6. Compare Male Average vs Female Average.
7. Move Height / Weight / Muscle / Proportions / Cupsize one at a time.
8. While Anny is active, test:
   - NVIDIA animation
   - arms overhead
   - squat
   - finger/grip pose
   - shape slider while already posed

Pass condition for this version is **integration stability**, not centimeter
accuracy. No claim is made yet that Anny's native 0–1 parameters equal physical
measurements. If the integration is stable and anatomy is visibly useful, the
next layer is the small measurement-conditioned fitter.


## v0.5.20 – exact Anny engine + Low/Mid + all modifiers

The v0.4 grid is replaced by an exact browser representation of Anny's linear
blendshape engine on canonical SOMA topology. GitHub Actions exports:

- `anny_soma_engine_low_v060_rigv3.npz` – 4,505 vertices, all phenotype + local blendshapes.
- `anny_soma_engine_mid_v060_rigv3.npz` – 18,056 vertices, same exact engine for visual/Harness inspection.

The browser mirrors Anny's official phenotype coefficient logic (piecewise-linear
anchors, multiplicative phenotype masks, normalized race weights, and the native
positive/negative local-change pair coefficients). All `model.local_change_labels`
are exposed dynamically and grouped from Anny's bundled `target.json` categories.

The same workflow also regenerates `soma_current_rig_pack_v0026.npz` with both
Low and Mid 122-joint skinning weights. Skeleton fitting still uses Low; Mid uses
the same fitted 122-joint transforms with the canonical 18,056-vertex skin weights.

Mid is loaded only on demand and cached persistently. This keeps startup small while
allowing direct inspection of the smoother surface that is relevant for Harness use.


## v0.5.20 – Rig-Pack joint-name decoder fix

The Engine-v2 workflow regenerates `soma_current_rig_pack_v0026.npz` with real
newline separators between joint names. v0.5.0 accidentally used a literal
`\\n` split in `loadCurrentRigPack()`, so the complete 122-joint list was read
as one single name and the UI reported:

`Expanded Rig unerwartet klein: 1 Joints`

v0.5.20 uses the existing compatibility decoder `decodePackedJointNames()`, which
supports both:
- the original legacy pack with literal `\\n`
- the current v2 pack with real newlines

No workflow or asset regeneration is required.


## v0.5.20 – automatic runtime, origin fix, motion import

On load the app now automatically loads the SOMA basis, Anny Low, current rig
pack, activates the expanded 122-joint runtime, loads Anny Mid and switches the
visible body to the 18,056-vertex mesh. Manual bootstrap buttons remain only as
debug/recovery controls.

Anny rest geometry is translated to the same ground plane as the existing SOMA
browser reference before skeleton fitting. This removes the ~1 m vertical jump
seen when switching from SOMA-PCA to Anny.

Motion import accepts:
- `.npy` matrix motion `[frames,78|94,4,4]`
- current SOMA converter `.npz` with `poses [frames,77|78,3]`

Imported motion uses the same public-78 -> internal-122 procedural twist/LBS
runtime as the built-in NVIDIA animation. `root_translation` is detected but
ignored for now so imported locomotion plays in-place.


## v0.5.20 – Safari SOMA NPZ parser regression fix

v0.5.2 introduced a fixed-width NumPy string decoder for future motion imports,
but the JavaScript regex was emitted with an extra escape. The runtime therefore
looked for a literal `\d` instead of digit characters in dtypes such as `<U...`
or `|S...`. `SOMA_neutral.npz` contains string metadata, so the automatic startup
failed while decoding the base NPZ before any Anny/Mid/Rig step could run.

v0.5.20 fixes the dtype and NUL regexes and keeps the v0.5.2 automatic startup,
origin normalization, Mid loading, 122-joint activation and animation-import UI.
The Shape error box now also prints the actual error message before the stack.


## v0.5.20 – direct Mixamo Bridge FBX export in Safari

The separate GitHub/Blender bridge workflow is no longer required for the first
Mixamo roundtrip.

A new **Mixamo Bridge** section builds the bridge locally in the browser from
the already loaded Soma-Lab assets:

- canonical SOMA Low body: 4,505 vertices
- canonical low triangles
- SOMA Public-78 hierarchy and bind pose
- Public-78 skin weights, reduced to normalized top-4 influences per vertex for
  a conservative character-exchange contract
- fixed neutral bridge body; current Anny sliders/pose are intentionally not
  exported

The app creates a Three.js `SkinnedMesh`/`Skeleton` and uses
`@comfyorg/fbx-exporter-three` 1.0.1 on demand to serialize a binary FBX. The
exporter is not loaded during normal startup.

Output:
`Sammy_Mixamo_Bridge_Public78.fbx`

The FBX is Y-up, centered horizontally and grounded at Y=0. It contains no
animation. Upload it to Mixamo, apply a motion, then download the returned
character **WITH SKIN** for the first converter/roundtrip analysis.


## v0.5.20 – simplified Mixamo proxy rig

The direct FBX bridge no longer exports the complete SOMA Public-78 skeleton.
The first Mixamo test showed a rigid neck/head relation and unreliable fingers.

The default bridge now exports a deliberately Mixamo-like 54-bone proxy:

- Hips is the skeleton root
- SOMA Spine1/Spine2/Chest -> Mixamo Spine/Spine1/Spine2
- SOMA Neck1 + Neck2 skinning is collapsed into one Mixamo Neck; Head stays separate
- Jaw, eyes, HeadEnd and SOMA Root helper are folded into nearby deform bones
- four-segment SOMA index/middle/ring/pinky chains are collapsed to the classic
  three Mixamo finger phalanges
- source skin weights are merged into proxy bones and normalized to top four

Output:
`Sammy_Mixamo_Proxy54.fbx`

This is only the upload/roundtrip bridge. Sammy's actual runtime remains the
SOMA public-78 -> internal-122 rig.


## v0.5.20 – exact Mixamo X Bot skeleton contract

The uploaded `X Bot.fbx` was parsed directly. Key facts:

- binary FBX version 7700
- 65 LimbNode bones
- hierarchy root = `mixamorig:Hips` (no separate Mixamo Root bone)
- torso = Hips -> Spine -> Spine1 -> Spine2 -> Neck -> Head -> HeadTop_End
- exactly one Neck
- each thumb/index/middle/ring/pinky chain has **four** bones
- all 65 bones have rotation animation channels in the standard file; Hips also has translation
- the standard skeleton uses non-trivial bind-axis/pre-rotation conventions

v0.5.5's three-phalange assumption was therefore wrong.

v0.5.20 embeds only the extracted 65-bone structural/orientation contract — **not**
the X Bot mesh or animation data. The exported bridge keeps the canonical SOMA
body and SOMA joint locations/skin weights but uses Mixamo X Bot bone names,
hierarchy and bind-axis orientations.

Output:
`Sammy_Mixamo_XBotContract65.fbx`


## v0.5.20 – direct Mixamo FBX import / retarget

The real returned roundtrip file `Idle (2).fbx` was inspected first:

- 65 X-Bot-contract bones are preserved
- `mixamorig:Hips` remains the skeleton root
- Neck and Head both have independent animation curves
- the clip is about 18.77 s / 564 keys at 30 fps
- finger bones 1..3 carry rotation curves; the fourth X-Bot finger bone is a
  terminal bone and normally has no own curve

The existing animation picker now accepts the returned `.fbx` directly.

Conversion:
Mixamo FBX -> Three FBXLoader -> sample bone world rotations -> remove imported
bind orientation -> map world-delta motion to SOMA Public-78 -> split one
Mixamo Neck across SOMA Neck1/Neck2 -> convert to the same relative-matrix
convention used by NVIDIA motion -> existing 78->122 runtime.

This deliberately does NOT copy Mixamo Euler values directly, so X-Bot
pre-rotations/local bone axes cancel against the imported bind pose.

Root translation is detected but intentionally ignored for now (in-place).


## v0.5.20 – reject incompatible old Mixamo bridge files

A real test exposed that the supplied `T-Pose.fbx` came from the old
`Sammy_Mixamo_Proxy54` bridge, while `Idle (2).fbx` came from the current
`Sammy_Mixamo_XBotContract65` bridge.

Those skeleton contracts are not interchangeable. v0.5.8 therefore used a
54-bone rest reference to calibrate a 65-bone animation, producing the severe
pose corruption seen on iPhone.

v0.5.20 now hard-validates Mixamo FBX files:
- current contract must contain exactly the 65 X-Bot-contract bones
- old 54-bone Proxy54 files are rejected with an explicit message
- a reference pose and animation must share the same 65-bone signature

This version does not claim to solve the remaining retarget quality by itself;
it prevents invalid cross-generation calibration so the next test uses a
genuinely matching T-pose/animation pair.


## v0.5.20 – bridge is now actually bound in official SOMA T-pose

The iPhone tests narrowed the remaining corruption to shoulders/arms/hands.
A T-pose clip also produced a V-shaped arm pose, while torso/legs/head were
mostly plausible. That is consistent with the bridge having exported the SOMA
neutral bind-shape while Mixamo animation is referenced to a canonical T-pose.

v0.5.20 changes the bridge construction itself:
- `public_bind_shape_low` is LBS-deformed from `public_bind_pose_world` to
  `public_t_pose_world` before export.
- the exported 65-bone X-Bot-compatible skeleton uses the SOMA official
  T-pose joint positions.
- X-Bot bone names/hierarchy/bind-axis orientations remain unchanged.
- the mesh is bound to that skeleton only after both are in the same T-pose.

New bridge filename: `Sammy_Mixamo_XBotContract65_TPose.fbx`.
Animations should be downloaded again from Mixamo using this new bridge; old
animations may contain the previous bridge's baked upper-limb offset.


## v0.5.20 – Mixamo T-pose reference now samples the animation clip

Direct comparison of the new pair proved the bridge itself survives Mixamo
unchanged:
- 4,505 mesh vertices: exact match before/after Mixamo
- 65 bone names + hierarchy: exact match
- static Lcl Translation/Rotation: exact match
- bind-pose matrices: exact match

Mixamo does **not** rewrite the static rig. Its downloaded T-pose file adds the
actual Mixamo T-pose as animation curves on top of that unchanged static rig.
The largest differences are in hands/fingers; shoulders/upper arms are nearly
unchanged in world orientation.

v0.5.8's reference loader captured the static skeleton before evaluating the
clip, so it was mathematically the wrong zero pose. v0.5.20 evaluates frame 0
of the returned Mixamo T-pose animation first and stores those animated world
orientations as the reference for subsequent Mixamo FBX retargeting.

Use `Sammy-T-Pose-Mixamo-Neu.fbx`-type files as reference. A direct app-export
FBX without a Mixamo animation clip is explicitly rejected.


## v0.5.20 – accept Mixamo's legitimate 54-bone motion subset

The v0.5.11 validator was too strict. A freshly downloaded Mixamo animation may
contain only 54 bones even though it originated from the current 65-bone
XBotContract bridge.

This is a normal motion-export reduction: Mixamo can omit 11 non-essential
terminal bones from the animation skeleton:
- `HeadTop_End`
- the ten terminal `*Hand*4` finger/thumb bones

Core animated joints remain present. The existing converter already had safe
fallbacks that inherit missing terminal transforms, so rejecting the file was
unnecessary.

v0.5.20 separates validation:
- T-pose reference FBX: must remain the full 65-bone current contract
- animation FBX: accepts either full 65 or the exact current 54-bone motion
  subset (only those 11 terminal bones may be missing)
- arbitrary 54-bone skeletons are still rejected

This fixes the false "old Proxy54" error shown for fresh Mixamo downloads.


## v0.5.20 – thumb axis + neck follow corrections

Two remaining bridge/retarget issues were isolated.

### Thumb axis
The XBot thumb bind orientation was being copied onto SOMA thumb joint
positions. Unlike the other fingers, SOMA's thumb segment directions differ
substantially from XBot, so the copied local Y/bend axis could be ~25 degrees
away from the actual thumb segment.

For Thumb1..3, v0.5.20 now:
- uses the real SOMA T-pose joint positions,
- aligns local Y exactly toward the next SOMA thumb joint,
- preserves the XBot roll around that primary axis as closely as possible.

### Neck follow
The source Mixamo animation does animate Neck, but less than Head. In the
measured Idle clip Neck rotation ranges are only about 5.8 deg X / 6.6 deg Z,
while Head carries additional motion. Previously SOMA Neck1+Neck2 received
only Mixamo Neck motion, so the visible neck could appear stiff.

v0.5.20 changes both directions:
- export skinning: SOMA Neck2 weights are blended 55% to Mixamo Neck and 45%
  to Mixamo Head instead of 100% Neck;
- import retarget: SOMA Neck2 receives 35% of the Mixamo Neck->Head world
  rotation difference while final Head world orientation stays unchanged.

A new Mixamo roundtrip should be generated from the v0.5.20 bridge because the
thumb bind axes and neck skin weights are part of the exported character.


## v0.5.20 – full 65-bone connection/axis audit

A complete audit was run against the standard Mixamo X Bot, the direct Sammy
T-pose export and the direct Mixamo return.

Verified roundtrip integrity:
- 65/65 bone names and parent connections match X Bot
- hierarchy remains unchanged by Mixamo
- 4,505 mesh vertices and polygon indices remain unchanged
- all 65 skin-weight sets remain numerically unchanged

The broader issue was orientation vs anatomy: copying X Bot world frames
unchanged onto SOMA joint positions is not sufficient.

52 non-terminal bones have a meaningful primary segment; all 52 are now
transported from the canonical X Bot segment direction onto the matching SOMA
T-pose segment direction. 13 terminal bones have no child direction and remain
unchanged.

Pre-v0.5.20 audit:
- 29/52 segment directions differed by >1 degree
- 24/52 by >5 degrees
- 15/52 by >10 degrees
- largest: Thumb2/3 ~38–39°, Head ~25.6°, Pinky1 ~23.5°, Foot ~18.3°,
  Hand→Middle1 ~17.8°, ToeBase ~15.2°, Ring1 ~13.9°, Middle1 ~9.5°,
  Shoulder ~8.8°, Spine/Neck ~7°

The generalized transport rotates the entire canonical X Bot frame with the
shortest world-space rotation from its X Bot segment vector to the corresponding
SOMA segment vector. This adapts anatomy while preserving X Bot roll/twist.

Neck mapping is also geometry-derived:
- SOMA Neck2 skin weights are split per vertex according to real position along
  Neck1→Head, not a fixed 55/45 guess
- Mixamo Neck maps exactly to SOMA Neck1
- SOMA Neck2 world motion is interpolated at its actual T-pose location between
  Mixamo Neck and Head

New bridge:
`Sammy_Mixamo_XBotContract65_TPose_Axis14.fbx`

Full numeric audit:
`MIXAMO_RIG_AUDIT_V0514.json`


## v0.5.20 – targeted thumb plane refinement

After the full v0.5.14 axis audit, Mixamo playback became visibly better across
most of the body. The remaining clearly wrong chain in Mixamo itself was the
thumb chain. That means the remaining issue is still in the exported bridge,
not just in Sammy's re-import.

v0.5.20 therefore keeps the general 52-bone XBot→SOMA frame transport and adds
a dedicated thumb refinement step:
- Thumb1 uses the palm normal (derived from Hand→Index/Middle/Pinky) as a
  guide vector in addition to the actual Thumb1→Thumb2 segment direction.
- Thumb2 and Thumb3 inherit the refined twist from the previous thumb segment
  so the chain keeps a consistent bending plane instead of drifting.
- The final basis is kept as close as possible to the transported XBot frame
  by choosing the sign nearest to the previous basis.

This is intentionally a narrow surgical fix for the one chain that still looked
wrong directly inside Mixamo.

New bridge filename:
`Sammy_Mixamo_XBotContract65_TPose_Axis15.fbx`


## v0.5.20 – semantic hand/finger chain correction

The latest Mixamo screenshot exposed two related symptoms:
1. the palm appeared to fold too early, before the visible knuckles;
2. the distal finger segment stayed straight in a fist.

The uploaded Axis15 app export and Mixamo-returned T-pose were inspected again.
Mixamo preserves the static Axis15 hand rig, so this was already present in the
bridge.

The key finding is a chain-index mismatch:

Standard X Bot (right index, approximate lengths):
- Hand -> Index1: 9.40 cm  (MCP/knuckle)
- Index1 -> Index2: 3.70 cm
- Index2 -> Index3: 2.85 cm
- Index3 -> Index4: 2.77 cm (tip/end)

Axis15/SOMA:
- Hand -> Index1: 3.91 cm
- Index1 -> Index2: 6.32 cm
- Index2 -> Index3: 3.64 cm
- Index3 -> Index4: 2.32 cm
- plus SOMA FingerEnd

This shows SOMA Finger1 is an additional metacarpal joint inside the palm,
whereas Mixamo/XBot Finger1 is the MCP/knuckle. The old 1:1 name mapping
therefore made Mixamo bend the palm at SOMA Finger1.

The distal problem was the other end of the same off-by-one:
Mixamo/XBot Finger4 is a terminal fingertip bone and regular Mixamo motions often
do not animate it. Axis15 had assigned SOMA Finger4 deformation to it, so the
distal phalanx could stay straight.

v0.5.20 remaps Index/Middle/Ring/Pinky as:

Export:
- SOMA Finger1 (metacarpal) -> Mixamo Hand
- SOMA Finger2 (MCP)        -> Mixamo Finger1
- SOMA Finger3 (PIP)        -> Mixamo Finger2
- SOMA Finger4 (DIP)        -> Mixamo Finger3
- SOMA FingerEnd (tip)      -> Mixamo Finger4

Import reverses exactly the same mapping.

Thumb mapping is unchanged because the SOMA and XBot thumb chain lengths/indexing
already correspond much more closely.

The v0.5.14 neck fix and v0.5.15 thumb-plane refinement remain active.

New bridge:
`Sammy_Mixamo_XBotContract65_TPose_Axis16.fbx`


## v0.5.20 – Axis16 import calibration hardening

The new Axis16 pair supplied for verification was checked directly:

- direct app export: FBX 7400
- Mixamo-returned T-pose: FBX 7700
- 65/65 bone names and parent relationships are identical
- all static local translations are identical
- all static local rotations are identical
- mesh: 4,505 vertices, exact vertex match
- polygon indices: exact match
- all 65 skin-weight index/weight sets: exact match
- only tiny FBX serialization noise remains in cluster matrices

The Mixamo-returned reference contains a 0.0333 s / two-key T-pose clip.
That makes it suitable as an exact per-bone calibration reference.

v0.5.20 therefore freezes the export side at Axis16 and focuses on import:

1. A Mixamo T-pose reference is now REQUIRED for Mixamo FBX import.
2. The reference loader samples the animated T-pose, not the static FBX rig.
3. It automatically checks that the chosen reference clip is really static.
4. It stores both:
   - the static bridge world orientation of all 65 bones
   - the animated Mixamo T-pose world orientation of all 65 bones
5. Every animation is checked against the static reference rig before playback.
   This catches accidental mixing of old Axis14/15 animations with Axis16 even
   though those files may all contain the same 65 bone names.
6. Motion deltas are then computed bone-by-bone against the exact animated
   Axis16 Mixamo T-pose.
7. The corrected v0.5.16 hand semantic mapping is preserved on import:
   Mixamo Finger1/2/3/4 -> SOMA Finger2/3/4/End, while SOMA Finger1 follows Hand.
8. The geometric Neck1/Neck2/Head mapping and thumb-plane work remain active.

This build intentionally does not change the now visually successful Axis16
Mixamo export rig.


## v0.5.20 – exact Axis16 roundtrip comparator

The export side is now considered visually successful in Mixamo. Remaining arm/hand differences must therefore be isolated on the Sammy import side.

v0.5.20 adds an apples-to-apples diagnostic path:
- it rebuilds the **exact Axis16 bridge body** that was uploaded to Mixamo
  (4,505 vertices, same topology, same skinweights, same 65-bone contract),
- it drives that exact body with Sammy's retargeted Public78 result,
- it can show this exact comparison body in the viewer instead of the Anny body,
- and it can export a selected imported-animation frame as a diagnostic FBX.

The diagnostic FBX contains:
- the exact Axis16 comparison topology, baked to Sammy's retargeted pose,
- the 65-bone bridge in Sammy's reconstructed pose,
- source animation name, frame and FPS as custom metadata.

This intentionally removes Anny body-shape differences from the comparison.
Upload the diagnostic FBX together with the original Mixamo animation FBX and the same frame number can be compared directly, vertex-for-vertex and bone-for-bone.


## v0.5.20 – static Axis16 rest is the correct motion zero

The uploaded exact comparison pairs were analyzed numerically:
- `Idle.fbx` at frame 101 vs Sammy exact-Axis16 frame 101
- `Headbutt.fbx` at frame 51 vs Sammy exact-Axis16 frame 51
- direct Axis16 export vs Mixamo-returned Axis16 T-pose

Critical result:
Sammy's RETARGETED MOTION DELTAS already match Mixamo essentially perfectly.

Across all 65 bones:
- Idle mean source-vs-Sammy world-motion-delta error: ~0.000004°
- Headbutt mean source-vs-Sammy world-motion-delta error: ~0.000004°

So there is no meaningful dynamic arm/forearm/head retarget error left in the
exact Axis16 comparison. The remaining visible difference is the chosen rest
reference.

Mixamo's downloaded "T-pose" animation is NOT identical to the static Axis16
bridge. It contains deliberate pose offsets, especially:
- Hand/wrist: ~11.61° world offset on each side
- Thumb1: ~12.38° world offset
- Thumb2 and all downstream thumb bones: ~40.20° world offset
- Feet: ~1.99°
- Upper legs: ~1.43°
- Lower legs: ~0.55°
- most torso/arm/neck bones: essentially 0°

v0.5.17/18 treated that animated Mixamo T-pose as zero and subtracted those
offsets from every animation. That explains why the body looked good but the
thumbs remained visibly wrong.

v0.5.20 changes only the import baseline:
- motion deltas are now measured against the STATIC Axis16 bridge skeleton,
- Mixamo's animated T-pose is retained only for compatibility validation and
  diagnostics,
- therefore Mixamo's intended wrist/thumb rest offsets remain in the motion.

The Axis16 exporter, full 52-bone frame transport, hand semantic correction,
thumb-plane export fix and geometric neck mapping are unchanged.

Expected diagnostic behavior:
On the exact Axis16 comparison body, a freshly imported Axis16 Mixamo frame
should now reproduce the corresponding Mixamo bone pose essentially exactly.


## v0.5.20 – explicit mapping to the morphable Sammy / Anny target

The now-proven Mixamo/Axis16 import is treated as the source-motion layer.
The real target is the morphable Anny body on SOMA topology.

There is intentionally no vertex-to-vertex pose transfer from Axis16 to Anny.
Motion is transferred in skeletal pose space:

`Mixamo Axis16`
→ exact Public78 motion delta
→ Public78 joints RBF-fitted to the CURRENT Anny shape
→ SOMA 122-joint expansion
→ procedural twist
→ LBS on the current Anny Low/Mid mesh.

New explicit morph-target mode:
- switches from the exact Axis16 diagnostic body back to the real Anny body,
- ensures Anny + Mid + Expanded-122 are active,
- ensures adaptive Public-RBF fitting is active,
- reapplies the currently imported animation frame,
- preserves/reapplies the current pose while morph sliders change,
- automatically refits the rig after every morph.

A new morph-rig direction audit compares template Public78 chain directions
against the current RBF-fitted skeleton and reports:
- mean angular change,
- maximum angular change + affected chain,
- number of chains above 5° and 10°,
- min/max bone-length scale factor.

This is deliberate. The proven runtime currently adapts joint POSITIONS while
keeping the official SOMA orientation convention. v0.5.20 measures whether a
given Anny morph changes actual bone directions enough to justify a second,
controlled shape-adaptive orientation layer. We do not change those rotations
blindly before a visible failure is demonstrated.

The exact Axis16 comparator remains available as the source-side A/B reference.


## v0.5.27 – exact identity-dependent Anny/SOMA rest rig

The v0.5.20 visual test exposed the real remaining bug. The proven Mixamo
motion was being applied to a morph target whose joint POSITIONS were adapted
with the public RBF, while its rest bone ROTATIONS stayed at the template
orientation. That is not the complete SOMA/Anny skeleton-transfer model.

The official Anny `rig="soma"` implementation already solves this. For every
blendshape identity it constructs a shape-dependent SOMA rest rig from:
- linear blendshape-driven bone heads,
- cached per-bone Procrustes covariance matrices,
- identity-dependent orientation blendshapes,
- SOMA child-offset orientation refinement,
- canonical `reference_bone_orientations` for `local-ref`,
- Anny's own SOMA skinning indices/weights.

v0.5.27 mirrors that exact model in the browser.

### New motion path

`Mixamo Axis16`
→ proven Public78 / local-ref pose delta
→ exact current-identity Anny/SOMA rest rig
→ Anny-compatible local-ref forward kinematics
→ Anny SOMA skinning on the currently morphed Low/Mid body.

The old public-RBF-position + fixed-rotation + expanded-122 path remains only as
a legacy A/B diagnostic path. It is no longer used by "Morphbares Sammy".

### Important conceptual point

We do **not** replace Anny with a fixed SOMA body. `Anny(rig="soma",
topology="soma")` is exactly the desired architecture: morphable Anny identity
on canonical SOMA topology with the SOMA rig convention. The browser had only
been exporting/using an incomplete subset of that model.

### One-time GitHub Action

v0.5.27 changes the Anny pack schema to
`anny-soma-browser-exact-engine-v3`.

Run once:
**Build Anny SOMA Engine v3**

It creates:
- `anny_soma_engine_low_v060_rigv3.npz`
- `anny_soma_engine_mid_v060_rigv3.npz`

The v3 pack additionally contains official rest-rig parity fixtures. On load,
the browser reconstructs those fixtures itself and refuses the exact morph-rig
path if the error exceeds the safety threshold.

### First iPhone test

1. Run the v3 Action once.
2. Reload GitHub Pages.
3. Load the same Axis16 Mixamo T-pose reference.
4. Load `Idle.fbx`.
5. Press **Morphbares Sammy aktivieren**.
6. Compare relaxed arms, knee bend, trunk posture and thumbs against Mixamo.
7. Repeat with Headbutt.
8. Move Anny Height/Weight/Muscle/Gender while the animation runs.

If the rest-rig parity passes but the visible pose is still different, only then
export another exact target/source pair for a frame-by-frame comparison.


## v0.5.27 – NPY int16 parser fix

The v3 Anny/SOMA pack was generated successfully, but iPhone loading stopped at:

`bone_children_indices.npy: NPY dtype <i2 noch nicht unterstützt`

This is a browser parser issue, not a bad v3 pack. The v3 extractor intentionally
stores several compact rig arrays as signed int16:
- `bone_children_indices`
- `vertex_bone_indices`

The browser NPY reader previously supported int32/int64 and uint8/uint16/uint32
but accidentally omitted signed int16.

v0.5.27 adds:
- `<i2` / `Int16Array`
- `<i1` / `Int8Array` for completeness

No GitHub Action rerun is required. The already-generated
`anny_soma_engine_*_rigv3.npz` files remain valid and are reused.


## v0.5.27 – canonical Axis16 rest-pose retarget before motion

The v0.5.22 iPhone screenshots showed that the exact Anny rest-rig reconstruction itself was not enough. The target retained a different neutral/rest posture (arm angle, knee bend, trunk posture and thumb basis), and those offsets remained visible in every imported animation.

The correct retarget order is now explicit:
1. reconstruct the exact identity-dependent Anny/SOMA rest rig,
2. pose that rig into the proven Axis16/Mixamo static reference orientation contract while preserving the target body's own bone lengths,
3. reconstruct the already-proven Public78 WORLD motion deltas from the Mixamo converter,
4. apply those deltas on top of the Axis16-compatible target reference orientations,
5. run absolute-orientation FK on the target's exact Anny rest skeleton,
6. skin the original Anny rest mesh once with Anny's own weights.

This is deliberately different from simply feeding the Mixamo relative matrices into Anny `local-ref`: local-ref preserves the target model's own reference/rest posture, which is exactly the offset the iPhone screenshots exposed.

The 65-bone Axis16 rest orientations are mapped to Public78 with the same semantics already proven by the Mixamo converter:
- Neck2 interpolates Neck→Head geometrically,
- SOMA non-thumb Finger1 follows Hand (metacarpal),
- Mixamo Finger1/2/3/4 map to SOMA Finger2/3/4/End,
- thumbs retain the proven Axis16 chain,
- Jaw/Eyes inherit Head,
- terminal bones inherit when Mixamo does not provide an explicit end bone.

No new GitHub Action is required. The existing v3 Anny packs are reused.


## v0.5.27 – Rig Oracle / Pose Probe wizard

This version intentionally does **not** introduce another retargeting heuristic.

Instead it adds a staged visual/numeric oracle workflow:

1. Freeze exactly one imported Mixamo frame.
2. Make the Anny body translucent and render a thick yellow Browser skeleton
   with `depthTest=false`, so it is visible through the body from every camera angle.
3. Export a `sammy-pose-probe-v1` JSON containing:
   - exact Anny blendshape coefficients,
   - Public78 source relative/world motion deltas,
   - intended target absolute orientations,
   - exact Anny rest bone poses,
   - Browser bone poses / skin transforms / posed vertices.
4. Run the separate `Sammy Pose Oracle` GitHub Action. It uses pinned official
   Anny and its own `parallel_forward_kinematic_absolute_orientations` + LBS.
5. Load the returned `sammy-pose-oracle-v1` JSON in the browser.
6. Overlay:
   - yellow = Browser,
   - cyan = official Anny,
   - orange/red = Browser bones with meaningful error.
7. The UI reports bone rotation error, bone position error, full-vertex RMS/max
   and the worst joints in plain language.

Interpretation is deliberately binary:
- If Browser ≈ official Anny, then FK/skinning is exonerated and the error is
  upstream in the Axis16→Public78/absolute-orientation mapping.
- If Browser differs from official Anny, repair only Browser FK/skinning.

The body opacity is user-adjustable and the optional official Anny posed mesh
can be shown as a cyan wireframe.

Files added:
- `pose_oracle.py`
- `POSE_ORACLE_WORKFLOW.yml`
- `pose-oracle-setup.html`

No new Anny v3 engine-pack build is required.


## v0.5.27 – iOS Oracle file picker fix

On iOS Safari, `pose_probe_oracle.json` was shown disabled/greyed out in the
Files picker even though the file was valid.

Cause: the Oracle `<input type="file">` used `accept=".json"`. iOS file-provider
UTI/MIME handling can reject otherwise valid JSON downloads under such a narrow
filter.

Fix:
- remove the `accept` filter from the Oracle file picker;
- keep strict runtime validation in `loadRigOracleResult()`:
  - schema must be `sammy-pose-oracle-v1`;
  - `probe_id` must match the locally exported probe;
  - exactly 78 bone poses must be present.

So the picker is permissive, while the actual import remains strict.

No GitHub Action rerun is required.


## v0.5.27 – Oracle workflow survives page resets

The previous Oracle workflow had a fundamental UX bug on iPhone: the probe only
existed in JavaScript memory. During the time needed to run the GitHub Action,
Safari/GitHub Pages could reload or discard the page, losing `oracleProbe`.
The returned Oracle JSON was then rejected even though it was correct.

v0.5.27 fixes the workflow itself instead of asking the user to race the page:

1. Every exported pose probe is saved to the existing persistent IndexedDB cache
   before the JSON download begins.
2. After a page reload, the latest exact probe is restored automatically.
3. Step 3 now has a primary button:
   **"Probe + Oracle direkt aus Repo laden"**
4. That button fetches:
   - `./pose_probe_input.json`
   - `./pose_probe_oracle.json`
   directly from the deployed GitHub Pages repository with cache-busting.
5. Their schemas and `probe_id` values are validated before comparison.
6. The frozen Browser body/skeleton are reconstructed directly from the probe
   JSON. The original Mixamo FBX does not need to be loaded again.
7. Manual Oracle-file selection remains only as a fallback.

For the pair already present in the repository, no new Pose Oracle workflow run
is required after deploying v0.5.27.


## v0.5.27 – first substantive Axis16→Anny reference-geometry fix

The Oracle result from v0.5.26 ruled out browser-vs-official-Anny FK/LBS as the
cause of the catastrophic pose: both produced the same result from the same
absolute orientations.

Reviewing the actual runtime then exposed a more specific frame-contract error:

Previous path:
- absolute bone orientations were expressed in the proven Axis16/Mixamo world
  reference;
- BUT child translations were still propagated through Anny's native rest-rig
  matrices (`rig.restWorld` / `rig.restInv`).

That mixes two different rest coordinate systems. Setting a bone's absolute
orientation to an Axis16 frame does not make Anny's native parent→child offset
become the matching Axis16/SOMA T-pose segment.

v0.5.27 separates the two roles:

1. Native exact Anny rig remains the *skin bind* contract.
2. A shape-dependent Axis16-compatible reference skeleton is built:
   - segment direction = official Public78/SOMA T-pose direction;
   - segment length = current exact Anny bone length;
   - bone orientation = proven Axis16 public reference orientation.
3. FK translation propagation uses this Axis16-compatible reference skeleton.
4. Final skin transforms are still `final_pose * inverse(native_anny_rest)`, so
   the native Anny mesh/weights remain the actual bind mesh.
5. The existing repo `pose_probe_input.json` can be tested with one button.
   No FBX reload, no frame selection, and no GitHub Action is required.

The one-click test also audits the constructed reference skeleton numerically
(direction and length preservation) before showing the candidate pose.
