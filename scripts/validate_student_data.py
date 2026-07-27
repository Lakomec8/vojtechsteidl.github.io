#!/usr/bin/env python3
"""Validate student JSON profiles and referenced local material files."""

from __future__ import annotations

import json
import sys
from datetime import date
from pathlib import Path
from typing import Any
from urllib.parse import unquote, urlparse

REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
STUDENTS_DIRECTORY = REPOSITORY_ROOT / "students"
LEGACY_DEMO_FILES = {"demo123.json"}
ARRAY_FIELDS = ("lessons", "materials", "tasks", "timeline", "upcoming", "links")


class ValidationErrors:
    def __init__(self) -> None:
        self.messages: list[str] = []

    def add(self, profile: Path, location: str, message: str) -> None:
        self.messages.append(f"{profile.as_posix()}:{location}: {message}")


def is_non_empty_string(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip())


def validate_iso_date(
    value: Any,
    profile: Path,
    location: str,
    errors: ValidationErrors,
    *,
    required: bool = True,
) -> None:
    if value in (None, "") and not required:
        return

    if not is_non_empty_string(value):
        errors.add(profile, location, "datum musí být text ve formátu YYYY-MM-DD")
        return

    try:
        date.fromisoformat(value)
    except ValueError:
        errors.add(profile, location, f"neplatné ISO datum: {value!r}")


def validate_unique_ids(
    rows: list[Any],
    profile: Path,
    field_name: str,
    errors: ValidationErrors,
) -> None:
    seen: set[str] = set()

    for index, row in enumerate(rows):
        location = f".{field_name}[{index}].id"
        if not isinstance(row, dict):
            errors.add(profile, f".{field_name}[{index}]", "položka musí být objekt")
            continue

        identifier = row.get("id")
        if not is_non_empty_string(identifier):
            errors.add(profile, location, "chybí neprázdné ID")
            continue

        if identifier in seen:
            errors.add(profile, location, f"duplicitní ID {identifier!r}")
        seen.add(identifier)


def local_file_from_url(url: str) -> Path | None:
    if not url or url == "#":
        return None

    parsed = urlparse(url)
    if parsed.scheme or parsed.netloc:
        return None

    path = unquote(parsed.path).strip()
    if not path or path == "#":
        return None

    normalized = path.lstrip("/")
    while normalized.startswith("./"):
        normalized = normalized[2:]

    return REPOSITORY_ROOT / normalized


def validate_material_url(
    url: Any,
    profile: Path,
    location: str,
    errors: ValidationErrors,
) -> None:
    if not is_non_empty_string(url):
        errors.add(profile, location, "chybí URL materiálu")
        return

    local_file = local_file_from_url(url)
    if local_file is None:
        return

    try:
        local_file.relative_to(REPOSITORY_ROOT)
    except ValueError:
        errors.add(profile, location, "odkaz míří mimo repozitář")
        return

    if not local_file.is_file():
        relative = local_file.relative_to(REPOSITORY_ROOT)
        errors.add(profile, location, f"soubor neexistuje: {relative.as_posix()}")


def validate_lessons(
    lessons: list[Any],
    profile: Path,
    errors: ValidationErrors,
) -> None:
    validate_unique_ids(lessons, profile, "lessons", errors)

    for index, lesson in enumerate(lessons):
        if not isinstance(lesson, dict):
            continue

        prefix = f".lessons[{index}]"
        for field in ("title", "subject"):
            if not is_non_empty_string(lesson.get(field)):
                errors.add(profile, f"{prefix}.{field}", "pole je povinné")

        validate_iso_date(lesson.get("date"), profile, f"{prefix}.date", errors)

        topics = lesson.get("topics", [])
        if not isinstance(topics, list) or not all(
            is_non_empty_string(topic) for topic in topics
        ):
            errors.add(
                profile,
                f"{prefix}.topics",
                "musí být pole neprázdných textových položek",
            )

        score = lesson.get("score")
        if score is not None:
            if isinstance(score, bool) or not isinstance(score, (int, float)):
                errors.add(profile, f"{prefix}.score", "hodnocení musí být číslo")
            elif not 0 <= score <= 10:
                errors.add(profile, f"{prefix}.score", "hodnocení musí být mezi 0 a 10")

        material = lesson.get("material")
        if material is not None:
            if not isinstance(material, dict):
                errors.add(profile, f"{prefix}.material", "materiál musí být objekt")
            else:
                if not is_non_empty_string(material.get("title")):
                    errors.add(
                        profile,
                        f"{prefix}.material.title",
                        "název materiálu je povinný",
                    )
                validate_material_url(
                    material.get("url"),
                    profile,
                    f"{prefix}.material.url",
                    errors,
                )


def validate_profile(path: Path, errors: ValidationErrors) -> None:
    relative_path = path.relative_to(REPOSITORY_ROOT)

    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        errors.add(
            relative_path,
            f"{error.lineno}:{error.colno}",
            f"neplatný JSON: {error.msg}",
        )
        return

    if not isinstance(data, dict):
        errors.add(relative_path, ".", "kořen JSON musí být objekt")
        return

    for field in ("studentName", "studentInitials"):
        if not is_non_empty_string(data.get(field)):
            errors.add(relative_path, f".{field}", "pole je povinné")

    is_legacy_demo = path.name in LEGACY_DEMO_FILES

    for field in ARRAY_FIELDS:
        value = data.get(field)
        if value is None and is_legacy_demo:
            continue
        if not isinstance(value, list):
            errors.add(relative_path, f".{field}", "pole je povinné a musí být seznam")

    lessons = data.get("lessons", [])
    if isinstance(lessons, list):
        validate_lessons(lessons, relative_path, errors)

    tasks = data.get("tasks", [])
    if isinstance(tasks, list):
        validate_unique_ids(tasks, relative_path, "tasks", errors)

    materials = data.get("materials", [])
    if isinstance(materials, list):
        for index, material in enumerate(materials):
            prefix = f".materials[{index}]"
            if not isinstance(material, dict):
                errors.add(relative_path, prefix, "položka musí být objekt")
                continue
            if not is_non_empty_string(material.get("title")):
                errors.add(relative_path, f"{prefix}.title", "název je povinný")
            validate_material_url(
                material.get("url"),
                relative_path,
                f"{prefix}.url",
                errors,
            )

    upcoming = data.get("upcoming", [])
    if isinstance(upcoming, list):
        for index, row in enumerate(upcoming):
            if not isinstance(row, dict):
                errors.add(
                    relative_path,
                    f".upcoming[{index}]",
                    "položka musí být objekt",
                )
                continue
            validate_iso_date(
                row.get("date"),
                relative_path,
                f".upcoming[{index}].date",
                errors,
                required=False,
            )

    deadline = data.get("deadline")
    if deadline is not None:
        if not isinstance(deadline, dict):
            errors.add(relative_path, ".deadline", "termín musí být objekt")
        else:
            validate_iso_date(
                deadline.get("date"),
                relative_path,
                ".deadline.date",
                errors,
                required=False,
            )

    readiness = data.get("readiness")
    if readiness is not None:
        if not isinstance(readiness, dict):
            errors.add(relative_path, ".readiness", "nastavení musí být objekt")
        else:
            lesson_weight = readiness.get("lessonWeight", 60)
            task_weight = readiness.get("taskWeight", 40)
            if not all(
                isinstance(weight, (int, float)) and not isinstance(weight, bool)
                for weight in (lesson_weight, task_weight)
            ):
                errors.add(relative_path, ".readiness", "váhy musí být číselné")
            elif lesson_weight + task_weight != 100:
                errors.add(
                    relative_path,
                    ".readiness",
                    "lessonWeight a taskWeight musí mít součet 100",
                )


def main() -> int:
    errors = ValidationErrors()
    profiles = sorted(STUDENTS_DIRECTORY.glob("*.json"))

    if not profiles:
        print("Nebyly nalezeny žádné studentské JSON profily.", file=sys.stderr)
        return 1

    for profile in profiles:
        validate_profile(profile, errors)

    if errors.messages:
        print("Validace studentských dat selhala:", file=sys.stderr)
        for message in errors.messages:
            print(f"- {message}", file=sys.stderr)
        return 1

    print(f"Validace proběhla úspěšně: {len(profiles)} profilů.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
