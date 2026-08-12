#!/usr/bin/env python3
"""Register one generated PDF in exactly one student profile.

This helper is intentionally narrower than sync_student_materials.py: it does not
migrate or inspect other student profiles, so case-variant legacy profiles cannot
interfere with a targeted generated-material upload.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

from sync_student_materials import ROOT, STUDENTS_DIR, parse_filename, relative_url


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, data: dict) -> None:
    path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: register_generated_material.py Materials/<student>/<file>.pdf", file=sys.stderr)
        return 2

    target = (ROOT / sys.argv[1]).resolve()
    try:
        relative = target.relative_to(ROOT)
    except ValueError:
        print("Target must be inside the repository.", file=sys.stderr)
        return 2

    if len(relative.parts) < 3 or relative.parts[0] != "Materials" or target.suffix.lower() != ".pdf":
        print("Target must match Materials/<student>/<file>.pdf", file=sys.stderr)
        return 2
    if not target.is_file():
        print(f"PDF does not exist: {relative}", file=sys.stderr)
        return 2

    student_id = relative.parts[1]
    profile_path = STUDENTS_DIR / f"{student_id}.json"
    if not profile_path.is_file():
        print(f"Student profile does not exist: {profile_path.relative_to(ROOT)}", file=sys.stderr)
        return 2

    profile = load_json(profile_path)
    materials = profile.setdefault("materials", [])
    if not isinstance(materials, list):
        print(f"{profile_path.relative_to(ROOT)}: materials must be a list", file=sys.stderr)
        return 2

    metadata = parse_filename(target)
    url = relative_url(target)
    existing = next(
        (item for item in materials if isinstance(item, dict) and item.get("url") == url),
        None,
    )
    is_new = existing is None

    current = existing or {}
    current.update(
        {
            "title": metadata["title"],
            "meta": metadata["meta"],
            "badge": "Aktuální PDF",
            "badgeClass": "pdf",
            "url": url,
            "date": metadata["date"],
            "source": "generated-upload",
        }
    )

    remaining = []
    for item in materials:
        if item is existing:
            continue
        if isinstance(item, dict) and item.get("badge") == "Aktuální PDF":
            item["badge"] = "PDF"
        remaining.append(item)
    profile["materials"] = [current] + remaining

    profile["incrementLessonCountOnMaterialAdd"] = True
    if is_new:
        lessons = profile.get("lessons", [])
        lesson_count = len(lessons) if isinstance(lessons, list) else 0
        try:
            completed = int(profile.get("completedLessonsCount", lesson_count))
        except (TypeError, ValueError):
            completed = lesson_count
        profile["completedLessonsCount"] = max(completed, lesson_count) + 1

    save_json(profile_path, profile)
    print(
        f"Registered {'new' if is_new else 'existing'} material: "
        f"{profile_path.name} -> {url}; completedLessonsCount="
        f"{profile.get('completedLessonsCount', len(profile.get('lessons', [])))}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
