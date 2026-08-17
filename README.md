# SOMA Browser PoC v0.1.6

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
