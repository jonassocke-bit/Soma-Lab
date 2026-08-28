# Next Phase after Morph Alignment — v0.8.26.5

1. Alignment JSON auswerten.
2. Nur Regionen übernehmen, bei denen **beste Zielnähe** und **Morph-Wirkzentrum** konsistent in demselben Nachbarband liegen.
3. Kanonische ANSUR-Messung bleibt weiterhin separat.
4. Bestätigte Regionen bekommen später eine eigene gelockte `Solver Shape Plane` oder ein kleines `Regional Envelope`.
5. `Abdominal Projection` nur dann als neutralen Solver-DOF freigeben, wenn mehrere Körper überwiegend Tiefen- statt Breitenzuwachs zeigen und die visuelle Form plausibel bleibt.
6. Danach kompakter 5-Körper-Retest; erst dann der finale 10er Real-ANSUR-Sanity-Lauf.
7. Anschließend Body-Lab-v1 einfrieren und Few-Measure Prediction / Benutzermaske fortsetzen.
