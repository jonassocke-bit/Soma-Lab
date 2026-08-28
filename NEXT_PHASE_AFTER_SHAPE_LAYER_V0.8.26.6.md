# NEXT PHASE AFTER SOLVER SHAPE LAYER · v0.8.26.6

1. Genau den neuen 5-Körper-Shape-Layer-Lauf ausführen.
2. JSON exportieren und zusätzlich die direkten Vorher/Shape-Layer-Körper visuell prüfen, besonders:
   - heavy male: seitliche Bauch-Welle vs. anteriore Projektion,
   - male chest: aufgeblähte Breite/Tiefe,
   - small female / heavy male: Upper-Thigh-Form,
   - Upperarm nur auf grobe Plausibilität, weil ANSUR flexed.
3. Wenn `USEFUL` und die visuellen Formen plausibel sind:
   - genau ein 10-case Real-ANSUR Sanity Run mit derselben Shape Layer,
   - danach Body-Lab-v1-Baseline einfrieren,
   - Few-Measure Prediction (K5/K7) und Nutzer-Eingabemaske.
4. Wenn `PARTIAL`:
   - nur nachweislich hilfreiche Regeln übernehmen (z.B. Abdominal Projection / Thigh Band), keine neue allgemeine Solverforschung.
5. Wenn `NO-BENEFIT`:
   - Shape Layer bleibt Diagnose; Routing-v2/PRA bleibt Produktionsbasis und Projekt geht trotzdem in die pragmatische Prediction/UI-Phase.

Keine neuen ANSUR-Endreserve-Personen werden für diesen Schritt verbraucht.
