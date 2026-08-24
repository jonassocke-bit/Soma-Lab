# Sammy v0.8.24.2 — Boot-order hotfix

## Symptom
App remains on the initial splash text **„Körpermodell wird vorbereitet …“**.

## Cause / invariant
The project already had this failure class in v0.8.20.0/1: UI/bootstrap execution must never occur before later LAB lexical (`const`/`let`) declarations have been initialized. v0.8.24.1 appended the MORPH OBSERVATORY v1.1 code after the historical boot block, violating the architectural boot-order invariant again.

## Fix
- Removed the earlier `sammyInitUi()` / `autoStartRuntime()` execution point.
- Converted the Morph Observatory top-level UI IIFE into `sammyMorphObsInstallUi()`.
- At the **absolute end of `app.js`**, after all LAB declarations, execute in this order:
  1. `sammyInitUi()`
  2. `sammyMorphObsInstallUi()`
  3. `setTimeout(() => autoStartRuntime(), 0)`
- Bumped app/cache version to **0.8.24.2**.

## Scope
No changes to Solver24, ANSUR24-PROT-v2 measurement definitions, mesh measurement geometry, sex-split Observatory logic, neutral diagnostic semantics, or Atlas v2 rendering.
