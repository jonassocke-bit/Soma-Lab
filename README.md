# SOMA Browser PoC v0.2.4

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


## v0.2.4 – Current Expanded 122-Joint LBS

Nach dem realen iPhone-Test von v0.2.0 ist der kompakte v0026-Rig-Pack bewiesen. v0.2.4 aktiviert nun den eigentlichen Expanded-Skinning-Pfad:

- 77 user-facing SOMA Pose-Joints bleiben die Bedien-/Motion-Schnittstelle.
- Intern werden die aktuellen 122 Target-Joints aus dem v0026-Rig verwendet.
- Low-LOD Skinweights stammen direkt aus `target_skinning_*` des erzeugten Current Rig-Packs.
- Public RBF Skeleton-Fit läuft beim Shape-Morphing weiter.
- Die fitted Public-Bindpose wird über SOMAs Procedural-Translation-Matrix auf den Expanded Target-Rig übertragen.
- Die acht SOMA Twist-Segmente werden aus dem Sidecar kompiliert; deren Twist-Helfer werden automatisch aus der Public-Pose abgeleitet.
- Der aktuelle Sidecar-Modus `aligned_x_swing_twist` wird browserseitig ausgewertet.
- NVIDIA Motion, manuelle Joint-Slider und Shape-Regler gehen nach Aktivierung alle durch den Expanded-LBS-Pfad.
- Rig-Debug kann zwischen Public 78 und Expanded 122 umschalten.

Noch bewusst offen: das vollständige shape-adaptive **Rotation-Fitting** der offiziellen `SkeletonTransfer`-Pipeline. v0.2.4 verwendet für die Shape-Anpassung die offiziellen vorberechneten RBF-Jointpositionen und die aktuelle Procedural-Expansion, aber noch keine vollständige Browser-Portierung des Kabsch/Newton-Schulz Rotations-Fits.

- v0.2.4 merkt die zuletzt tatsächlich angewendete 78-Joint-Relativpose. Shape-Regler können dadurch eine laufende/aktuelle Pose nach dem Rebind wieder anwenden, statt beim Morphen ungewollt auf die Slider-Nullpose zurückzuspringen.


## v0.2.4 – 122-Joint-Hierarchie reihenfolgeunabhängig

Der erste echte iPhone-Test von v0.2.1 erreichte `PACK OK`, stoppte beim Aktivieren des Expanded-Rigs aber mit `122 FEHLER`. Der sichtbare Ablauf zeigte, dass der Public-Rig-Teil bereits initialisiert war und der Fehler erst beim Expanded-Posepfad auftrat.

Diese Version entfernt deshalb eine unzulässige Annahme aus dem Browser-FK: Target-Joints müssen **nicht** in Parent-vor-Child-Reihenfolge im USD/Pack stehen. Sowohl die T-Pose-Prüfung als auch der Expanded-Pose-FK werden jetzt rekursiv/hierarchiegetrieben aufgebaut und erkennen echte Zyklen/ungültige Parents explizit.

Zusätzlich:
- Public `t_pose_world` wird browserseitig robust aus `public_t_pose_local + parent_ids` rekonstruiert.
- Punkt 5 zeigt bei einem Fehler jetzt direkt die exakte Aktivierungsstufe und Fehlermeldung.
- Bei einem 122-Fehler fällt die App sauber auf den funktionierenden Current-Public-78-Pfad zurück.
- Im Rig-Pack-Infofeld wird die Zahl der Parent-Vorwärtsverweise angezeigt.

Der vorhandene `soma_current_rig_pack_v0026.npz` und dessen persistenter Cache bleiben unverändert gültig; der GitHub-Actions-Builder muss für v0.2.4 nicht erneut ausgeführt werden.


## v0.2.4 – robuster Current-Rig-Pack Loader

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


## v0.2.4 – Joint-Name-Separator-Fix

Die v0.2.3-Fehlermeldung hat den eigentlichen Fehler sichtbar gemacht:
Der erste erzeugte Rig-Pack speichert `target_joint_names_utf8` und
`public_joint_names_utf8` mit dem *literalen* Trenner `\n` statt echten
Newline-Zeichen. Dadurch sah der Browser die komplette Namensliste als einen
einzigen Namen und konnte z. B. `LeftArm -> LeftForeArm` nicht auflösen.

v0.2.4:
- liest sowohl echte Newlines als auch den bereits erzeugten Legacy-`\n`-Pack,
- prüft 122 Target- und 78 Public-Namen explizit,
- prüft alle Twist-Joint-Namen vor Aktivierung,
- korrigiert zusätzlich den Extractor für jede spätere Rig-Pack-Neuerzeugung.

Der vorhandene `soma_current_rig_pack_v0026.npz` muss NICHT neu erzeugt werden.
