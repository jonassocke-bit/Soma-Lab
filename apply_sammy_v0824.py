#!/usr/bin/env python3
"""Apply Sammy v0.8.24.0 Calibration + Proportion + Stability pass.

Run from the Soma-Lab repository root after placing this script together with
SOLVER24_V0.8.24_PATCH.js and BUILD_MANIFEST_V0.8.24.0.json in any directory.
The script is intentionally conservative: it validates the expected v0.8.23.0
base markers, refuses duplicate application, then changes only runtime version
markers/cache keys and appends the late Solver24 override.
"""
from pathlib import Path
import json
import shutil
import sys

NEW_VERSION = "0.8.24.0"
OLD_VERSION = "0.8.23.0"
PATCH_MARKER = 'const SAMMY_SOLVER24_V824_SCHEMA="sammy-solver24-calibration-pass-v1";'

HERE = Path(__file__).resolve().parent
ROOT = Path.cwd()
APP = ROOT / "app.js"
INDEX = ROOT / "index.html"
PATCH = HERE / "SOLVER24_V0.8.24_PATCH.js"
MANIFEST_SRC = HERE / "BUILD_MANIFEST_V0.8.24.0.json"
MANIFEST_DST = ROOT / "BUILD_MANIFEST_V0.8.24.0.json"


def fail(msg: str) -> None:
    print(f"ERROR: {msg}", file=sys.stderr)
    raise SystemExit(2)


def replace_once(text: str, old: str, new: str, label: str) -> str:
    n = text.count(old)
    if n != 1:
        fail(f"{label}: expected exactly one base marker, found {n}: {old!r}")
    return text.replace(old, new, 1)


if not APP.exists() or not INDEX.exists():
    fail("Run this script from the Soma-Lab repository root (app.js/index.html not found).")
if not PATCH.exists() or not MANIFEST_SRC.exists():
    fail("Keep SOLVER24_V0.8.24_PATCH.js and BUILD_MANIFEST_V0.8.24.0.json next to this script.")

app = APP.read_text(encoding="utf-8")
index = INDEX.read_text(encoding="utf-8")
patch = PATCH.read_text(encoding="utf-8").strip() + "\n"
manifest = json.loads(MANIFEST_SRC.read_text(encoding="utf-8"))
if manifest.get("version") != NEW_VERSION:
    fail("Manifest version does not match v0.8.24.0.")

if PATCH_MARKER in app:
    fail("v0.8.24 Solver24 patch is already present; refusing a duplicate append.")

# Runtime version + cache-busting only. Historical v0.8.23 comments stay intact.
app = replace_once(
    app,
    'const SAMMY_APP_VERSION="0.8.23.0";',
    'const SAMMY_APP_VERSION="0.8.24.0";',
    "app version",
)
app = replace_once(
    app,
    'const SAMMY_SOLVER24_PRIOR_URL="./solver24-prior-v1.json?v=0.8.23.0";',
    'const SAMMY_SOLVER24_PRIOR_URL="./solver24-prior-v1.json?v=0.8.24.0";',
    "solver prior cache key",
)
app = replace_once(
    app,
    'const SAMMY_SOLVER24_ANTHRO_URL="./anthro24-conditional-prior-v1.json?v=0.8.23.0";',
    'const SAMMY_SOLVER24_ANTHRO_URL="./anthro24-conditional-prior-v1.json?v=0.8.24.0";',
    "anthro prior cache key",
)
app = replace_once(
    app,
    'const SAMMY_MASS_V1_URL="./mass-composition-v1.json?v=0.8.23.0";',
    'const SAMMY_MASS_V1_URL="./mass-composition-v1.json?v=0.8.24.0";',
    "mass model cache key",
)

# Must run after the v0.8.23 MASS late overrides, so append at EOF.
app = app.rstrip() + "\n\n" + patch

# index.html has only runtime/display/cache version occurrences at this release.
idx_count = index.count(OLD_VERSION)
if idx_count < 4:
    fail(f"index.html looked unlike the expected v0.8.23.0 base (only {idx_count} version markers).")
index = index.replace(OLD_VERSION, NEW_VERSION)

APP.write_text(app, encoding="utf-8", newline="\n")
INDEX.write_text(index, encoding="utf-8", newline="\n")
if MANIFEST_SRC.resolve() != MANIFEST_DST.resolve():
    shutil.copyfile(MANIFEST_SRC, MANIFEST_DST)

print("Applied Sammy v0.8.24.0 Solver24 calibration/proportion/stability pass.")
print("Changed: app.js, index.html")
print("Added/verified: BUILD_MANIFEST_V0.8.24.0.json")
print("Recommended next: run `node --check app.js` if Node is available, then Stress 8x2 + blind AUDT.")
