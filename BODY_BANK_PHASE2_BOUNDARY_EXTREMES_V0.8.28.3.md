# BODY BANK Phase 2 · Boundary + Extreme Audit · v0.8.28.3

## Ausgangslage

Phase 1 lieferte ein schnelles und konsistentes visuelles Audit. Der Nutzer präzisierte anschließend, dass jede `Unsicher`-Bewertung ausschließlich durch zu lang wirkende Beine ausgelöst wurde. Gleichzeitig zeigte die Auswertung, dass `proportions` und `height` in der unsicheren Gruppe im Mittel höher lagen. Das ist ein Selektionssignal, kein globales Verbot.

## Prüfdesign

Phase 2 kartiert die lokale Grenze statt weitere ähnliche Zufallskörper zu zeigen. 40 akzeptierte Anker werden in vier kleinen Proportionsschritten geprüft. 20 weitere akzeptierte Anker bilden die Basis für acht bewusst weit getriebene Core-Muster. 60 zusätzliche Halton-Randpunkte verbreitern die Abdeckung. 20 verdeckte Wiederholungen prüfen die Konsistenz.

## Geometrische Diagnose

Beim Vote wird das sichtbare Pose-/Animationsmesh nicht vermessen. Stattdessen wird aus `reconstructExactAnnyRestRig(annyLastCoeffs)` das exakte shape-abhängige Rest-Rig verwendet. Die Y-Translation des Ground-Alignments wird berücksichtigt. Die Rest-Mesh-BBox liefert die Körperhöhe.

Gespeichert werden u.a. `hipJointHeightRatio`, `legChainRatio`, `femurTibiaRatio`, `torsoChainRatio`, `pelvisToNeckVerticalRatio`, `shoulderJointBreadthRatio`, `hipJointBreadthRatio`. Der Autocheck testet nur Finite-/Geometrie-Sanity, keine menschliche Plausibilitätsnorm.

## Auditsemantik

Ein Urteil bleibt am exakten Rezept und `familyId` gebunden. `legs-too-long` ist eine Human-Annotation bzw. ein Quick-Reason und keine harte Grenze. Erst nach dem 400er Export darf geprüft werden, ob innerhalb einzelner Familien reproduzierbare sichere Korridore entstehen.
