#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# Remove repeated history block accidentally inserted by the temporary PR workflow.
portal_path = ROOT / "assets/student-portal.js"
portal = portal_path.read_text(encoding="utf-8")
marker = '    const externalLessons = (Array.isArray(data.externalLessons) ? data.externalLessons : [])'
first = portal.find(marker)
if first < 0:
    raise RuntimeError("Unified history block is missing")
tasks = portal.find('    const tasks = Array.isArray(data.tasks) ? data.tasks : [];', first)
if tasks < 0:
    raise RuntimeError("Tasks marker is missing")
second = portal.find(marker, first + len(marker), tasks)
if second >= 0:
    portal = portal[:second] + portal[tasks:]
portal_path.write_text(portal, encoding="utf-8")

# Collapse repeated idempotent normalizer calls/sorts to one copy.
profile_path = ROOT / "cloudflare-portal/scripts/apply-profile-patch.mjs"
profile = profile_path.read_text(encoding="utf-8")
sort_block = '''  externalLessons.sort((first, second) =>
    String(second?.date || "").localeCompare(String(first?.date || "")),
  );
'''
while sort_block + sort_block in profile:
    profile = profile.replace(sort_block + sort_block, sort_block)
normalize_block = 'normalizeProfileChronology(profile);\n\n'
while normalize_block + normalize_block in profile:
    profile = profile.replace(normalize_block + normalize_block, normalize_block)
profile_path.write_text(profile, encoding="utf-8")

# Remove all one-shot implementation helpers. Keep the read-only audit tooling.
for relative in [
    ".ops/apply-chronology-code-fix",
    "cloudflare-portal/scripts/apply-chronology-code-fix.mjs",
    "scripts/apply_chronology_code_fix.py",
    "scripts/patch_history_logic.py",
    "scripts/patch_profile_chronology_normalizer.py",
]:
    path = ROOT / relative
    if path.exists():
        path.unlink()

print("Finalized chronology branch and removed temporary helpers.")
