# Sammy v0.8.18.1 · ANSUR Protocol / Landmark Lab

Basis: v0.8.17.1. Die bestehende MEAS-, DIMENSIONS-, R5- und ANSUR-D1/D2/D3-Logik bleibt unverändert. Neu ist eine separate PROT-Bubble, in der die 24 tatsächlich für Sammy verwendeten ANSUR-Zielmaße vor jeder weiteren Solver-Anpassung gegen das originale Messprotokoll auditiert werden.

## PROT · ANSUR Protocol Lab

- Quelle: `NATICK/TR-11/017 · Measurer’s Handbook: US Army and Marine Corps Anthropometric Surveys, 2010-2011`.
- Enthält nur die 24 ANSUR-kompatiblen Sammy-Ziele; `torso_height` und `upperleg_height` sind ausdrücklich als abgeleitete Ziele markiert.
- 11 relevante Pose-/Protokollzustände statt einer universellen T-Pose: Anthropometric Standing, Anthropometric Sitting, Chest-Breadth Setup/Measurement, Hip-Breadth arms-away, Waist-Depth right-hand-chest, Thigh special, Calf/Ankle 10-cm stance, Wrist 90° palm-up, relaxed arm/palm-forward und Crotch blade-setup.
- Die Pose-Referenzseite aus dem Handbook ist direkt im Inspector sichtbar. Chest Breadth weist explizit darauf hin, dass volle Inspiration eine Protokollbedingung ist und in Pose V1 noch nicht als Atemvolumen simuliert wird.
- Für jedes relevante Maß werden nur dessen Landmark(s) bzw. dynamische Suchzone eingeblendet. Anklicken öffnet Originalseite, Beschreibung/Procedure/Caution/Instrument aus dem PDF.
- Landmark-Offsets X/Y/Z in cm; jeder Offset wird auf die zulässige anatomische Mesh-Region zurückprojiziert.
- Anatomische Region-Masks werden aus den Anny/SOMA-Skinweights gebildet. `torso` enthält Hips/Spine/Chest/Shoulder, aber keine Arm-/Forearm-/Hand-Vertices; analoge Masken existieren für Neck, Pelvis, Right Arm, Right Thigh, Calf, Ankle, Leg und Head.
- Region-Mask des gewählten Landmark kann als feine Punktwolke eingeblendet werden, damit falsches Geometrie-Fangen visuell prüfbar ist.
- Bilaterale Landmark-Gruppen (u.a. Acromion, Buttock lateral, Trapezius, Neck lateral, Omphalion lateral) sind im Protocol Lab fest gespiegelt gekoppelt. Ein Offset bewegt beide Seiten symmetrisch; Mittellinienpunkte bleiben bei lateralen Korrekturen mittig.
- Auditstatus pro Landmark: korrekt / korrigiert / prüfen / ungeprüft; freies Kommentarfeld; Persistenz in localStorage; Export als `sammy-ansur-protocol-audit-v1` JSON.
- Pose-Status kann pro benötigtem Pose-Schritt separat als korrekt/prüfen markiert werden; die Rig-Winkel sind reproduzierbare Startpresets und werden dort, wo reale Abstände/Atmung nicht automatisch gelöst werden, ausdrücklich als manuell zu verifizieren gekennzeichnet.
- Auch das Messprotokoll selbst besitzt jetzt Status + Kommentar. Erst Landmark(s) + alle Pose-Schritte + Protokollfreigabe zählen ein Maß als vollständig auditiert.
- Random / Random breit erzeugen bewusst moderate erwachsene Körper; lokale L/R-Morphs werden logisch gepaart und immer symmetrisch gesetzt. `Körper Reset` stellt den neutralen Körper der aktuellen Geschlechtsseite wieder her.

## Handbook Assets

`ansur-protocol-v1.json` enthält die aus dem Handbook extrahierten Protokolltexte und die Zuordnung der 24 Ziele zu Pose, Landmark(s), Geometrie-Zone und PDF-Seite. `ansur-page-*.jpg` enthält nur die hierfür benötigten Handbook-Seiten als mobile Referenzbilder (Standardposen, relevante Landmark- und Messseiten).

## v0.8.18.1 Gegencheck / Appendix-G-Richtwerte

- Die 22 direkten ANSUR-Ziele wurden Feld für Feld gegen ihre Handbook-Seiten gegengeprüft; Beschreibung, Landmark-Bezug, Procedure, Instrument und Caution stimmen mit der Quelle überein.
- Die zwei Sammy-Ableitungen `torso_height` und `upperleg_height` bleiben ausdrücklich **keine** direkten ANSUR-Dimensionen.
- Appendix G ist jetzt in PROT sichtbar: pro direktem Maß wird der offizielle **Allowable Observer Error** in mm angezeigt und die zugehörige Tabellen-Seite kann geöffnet werden. Bei abgeleiteten Maßen werden nur die beiden Quell-Richtwerte gezeigt; es wird bewusst kein erfundener kombinierter ANSUR-Grenzwert ausgegeben.
- Crotch, Buttock posterior und Vertex sind undrawn landmarks; ihre bereits vorhandenen Handbook-Seiten 31/32 sind jetzt auch tatsächlich mit dem Inspector verknüpft.
- Bilaterale Landmark-Gruppen sind im Protocol Lab fest gespiegelt gekoppelt. Bei Gruppen mit Mittellinienpunkten (z. B. Omphalion/Neck Base) verschiebt ein lateraler Offset die Mittellinienpunkte nicht mehr versehentlich aus der Sagittalebene.
- Region-Masks haben keinen Whole-Body-Fallback mehr: fehlen Skinweights/Regiondaten, wird die Region leer gelassen statt potenziell Arme/Beine in ein fremdes Maß einzufangen.
- Ein Maß gilt im Fortschrittszähler erst als vollständig geprüft, wenn Landmark(s), alle nötigen Pose-Schritte und das Messprotokoll selbst freigegeben sind.
- GitHub-Paket ist absichtlich **flach**: alle Dateien einschließlich der ANSUR-Seitenbilder liegen im Repository-Root, ohne Unterordner.

## Sicherheitsgrenze

PROT ist bewusst ein Audit-Layer. Die neuen Landmark-Offsets und Pose-Freigaben verändern in v0.8.18.1 **noch nicht** die 31 Produktions-MEAS-Definitionen oder R5. Erst nach manueller Freigabe sollen daraus neue ANSUR-Protocol-Measurements entstehen.
