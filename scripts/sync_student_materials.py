#!/usr/bin/env python3
"""Synchronize PDF files in Materials/<student-id>/ with student profiles.

The student directory name must match the JSON profile stem, for example:
Materials/evelina/... -> students/evelina.json
"""

from __future__ import annotations

import json
import re
import shutil
import sys
import unicodedata
from datetime import datetime
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
MATERIALS_DIR = ROOT / "Materials"
STUDENTS_DIR = ROOT / "students"
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
LOCAL_PDF_RE = re.compile(r"^\./(.+\.pdf)$", re.IGNORECASE)


def load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def save_json(path: Path, data: dict[str, Any]) -> None:
    path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_value = normalized.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", ascii_value).strip("-").lower()
    return slug or "material"


def humanize(value: str) -> str:
    text = re.sub(r"[-_]+", " ", value).strip()
    text = re.sub(r"\s+", " ", text)
    return text[:1].upper() + text[1:] if text else "Studijní materiál"


def format_czech_date(value: str) -> str:
    parsed = datetime.strptime(value, "%Y-%m-%d").date()
    months = (
        "ledna",
        "února",
        "března",
        "dubna",
        "května",
        "června",
        "července",
        "srpna",
        "září",
        "října",
        "listopadu",
        "prosince",
    )
    return f"{parsed.day}. {months[parsed.month - 1]} {parsed.year}"


def parse_filename(path: Path) -> dict[str, str]:
    parts = path.stem.split("__")
    if len(parts) < 2 or not DATE_RE.fullmatch(parts[0]):
        raise ValueError(
            f"{path.relative_to(ROOT)}: očekáván název "
            "YYYY-MM-DD__nazev.pdf nebo "
            "YYYY-MM-DD__predmet__nazev__typ.pdf"
        )

    material_date = parts[0]
    datetime.strptime(material_date, "%Y-%m-%d")

    if len(parts) == 2:
        subject = "Studijní materiál"
        title = humanize(parts[1])
        material_type = "PDF"
    else:
        subject = humanize(parts[1])
        title = humanize(parts[2])
        material_type = humanize(" ".join(parts[3:])) if len(parts) > 3 else "PDF"

    meta_parts = ["PDF materiál"]
    if subject != "Studijní materiál":
        meta_parts.append(subject)
    if material_type.upper() != "PDF":
        meta_parts.append(material_type)
    meta_parts.append(f"přidáno {format_czech_date(material_date)}")

    return {
        "date": material_date,
        "title": title,
        "subject": subject,
        "type": material_type,
        "meta": " · ".join(meta_parts),
    }


def relative_url(path: Path) -> str:
    return "./" + path.relative_to(ROOT).as_posix()


def path_from_url(url: str) -> Path | None:
    match = LOCAL_PDF_RE.fullmatch(url or "")
    if not match:
        return None
    return ROOT / Path(match.group(1))


def replace_url(value: Any, old_url: str, new_url: str) -> int:
    replacements = 0
    if isinstance(value, dict):
        for key, child in value.items():
            if key == "url" and child == old_url:
                value[key] = new_url
                replacements += 1
            else:
                replacements += replace_url(child, old_url, new_url)
    elif isinstance(value, list):
        for child in value:
            replacements += replace_url(child, old_url, new_url)
    return replacements


def lesson_date_for_url(profile: dict[str, Any], url: str) -> str | None:
    for lesson in profile.get("lessons", []):
        if lesson.get("material", {}).get("url") == url and DATE_RE.fullmatch(
            str(lesson.get("date", ""))
        ):
            return str(lesson["date"])
    return None


def migrate_legacy_materials(
    student_id: str, profile: dict[str, Any], profile_path: Path
) -> bool:
    """Move referenced PDFs into Materials/<student-id>/ and update all URLs."""
    changed = False
    target_dir = MATERIALS_DIR / student_id
    target_dir.mkdir(parents=True, exist_ok=True)

    material_rows = profile.get("materials", [])
    if not isinstance(material_rows, list):
        return changed

    for material in material_rows:
        old_url = str(material.get("url", ""))
        source = path_from_url(old_url)
        if source is None or not source.exists():
            continue

        try:
            source.relative_to(target_dir)
            continue
        except ValueError:
            pass

        material_date = lesson_date_for_url(profile, old_url) or str(
            material.get("date", "")
        )
        if not DATE_RE.fullmatch(material_date):
            print(
                f"VAROVÁNÍ: {profile_path.relative_to(ROOT)}: "
                f"nelze bezpečně přesunout {old_url}, chybí datum.",
                file=sys.stderr,
            )
            continue

        destination_name = (
            f"{material_date}__{slugify(str(material.get('title', 'material')))}.pdf"
        )
        destination = target_dir / destination_name
        if destination.exists() and destination.resolve() != source.resolve():
            raise FileExistsError(
                f"Cílový soubor již existuje: {destination.relative_to(ROOT)}"
            )

        destination.parent.mkdir(parents=True, exist_ok=True)
        if source.resolve() != destination.resolve():
            shutil.move(str(source), str(destination))
            print(
                f"Přesunuto: {source.relative_to(ROOT)} -> "
                f"{destination.relative_to(ROOT)}"
            )

        new_url = relative_url(destination)
        replace_url(profile, old_url, new_url)
        material["date"] = material_date
        material["source"] = "filename-sync"
        changed = True

    return changed


def synchronize_profile(student_id: str, profile_path: Path) -> bool:
    profile = load_json(profile_path)
    changed = migrate_legacy_materials(student_id, profile, profile_path)

    student_dir = MATERIALS_DIR / student_id
    student_dir.mkdir(parents=True, exist_ok=True)
    pdf_files = sorted(
        (path for path in student_dir.rglob("*.pdf") if path.is_file()),
        key=lambda path: path.as_posix().casefold(),
    )

    materials = profile.setdefault("materials", [])
    if not isinstance(materials, list):
        raise TypeError(
            f"{profile_path.relative_to(ROOT)}: pole materials musí být seznam"
        )

    actual_urls = {relative_url(path) for path in pdf_files}

    # Remove stale local entries inside this student's managed directory.
    prefix = f"./Materials/{student_id}/"
    filtered_materials = []
    for item in materials:
        url = str(item.get("url", "")) if isinstance(item, dict) else ""
        if (
            url.startswith(prefix)
            and url.lower().endswith(".pdf")
            and url not in actual_urls
        ):
            print(f"Odstraněn neplatný záznam: {profile_path.name} -> {url}")
            changed = True
            continue
        filtered_materials.append(item)
    materials = filtered_materials
    profile["materials"] = materials
    existing_by_url = {
        str(item.get("url")): item
        for item in materials
        if isinstance(item, dict) and item.get("url")
    }

    new_items: list[dict[str, Any]] = []
    errors: list[str] = []
    for pdf_path in pdf_files:
        url = relative_url(pdf_path)
        if url in existing_by_url:
            continue
        try:
            metadata = parse_filename(pdf_path)
        except (ValueError, TypeError) as error:
            errors.append(str(error))
            continue

        new_items.append(
            {
                "title": metadata["title"],
                "meta": metadata["meta"],
                "badge": "PDF",
                "badgeClass": "pdf",
                "url": url,
                "date": metadata["date"],
                "source": "filename-sync",
            }
        )

    if errors:
        raise ValueError("\n".join(errors))

    if new_items:
        new_items.sort(
            key=lambda item: (item["date"], item["url"]), reverse=True
        )
        profile["materials"] = new_items + materials
        materials = profile["materials"]
        changed = True

        if profile.get("incrementLessonCountOnMaterialAdd") is True:
            current_count = profile.get("completedLessonsCount", len(profile.get("lessons", [])))
            try:
                current_count = int(current_count)
            except (TypeError, ValueError):
                current_count = len(profile.get("lessons", []))
            profile["completedLessonsCount"] = max(
                current_count,
                len(profile.get("lessons", [])),
            ) + len(new_items)

        for item in new_items:
            print(f"Přidán materiál: {profile_path.name} -> {item['url']}")

    # Exactly the first material is marked as current.
    for index, item in enumerate(materials):
        if not isinstance(item, dict):
            continue
        desired_badge = "Aktuální PDF" if index == 0 else "PDF"
        if (
            item.get("badge") in {None, "PDF", "Aktuální PDF"}
            and item.get("badge") != desired_badge
        ):
            item["badge"] = desired_badge
            changed = True

    if changed:
        save_json(profile_path, profile)
    return changed


def main() -> int:
    if not STUDENTS_DIR.exists():
        print("Složka students neexistuje.", file=sys.stderr)
        return 1

    MATERIALS_DIR.mkdir(exist_ok=True)
    changed_profiles = 0
    errors: list[str] = []
    processed_students: set[str] = set()

    # Process profiles first. This lets the migration move PDFs out of legacy
    # directories such as Materials/Evelin before unknown-directory checks run.
    for profile_path in sorted(STUDENTS_DIR.glob("*.json")):
        student_id = profile_path.stem
        try:
            profile = load_json(profile_path)
            has_local_pdf = any(
                path_from_url(str(item.get("url", ""))) is not None
                for item in profile.get("materials", [])
                if isinstance(item, dict)
            )
            if (MATERIALS_DIR / student_id).exists() or has_local_pdf:
                if synchronize_profile(student_id, profile_path):
                    changed_profiles += 1
                processed_students.add(student_id)
        except (OSError, ValueError, TypeError, json.JSONDecodeError) as error:
            errors.append(str(error))

    # Every managed directory containing PDFs must map to a profile with the
    # exact same identifier.
    for student_dir in sorted(
        path for path in MATERIALS_DIR.iterdir() if path.is_dir()
    ):
        if not any(student_dir.rglob("*.pdf")):
            continue
        student_id = student_dir.name
        profile_path = STUDENTS_DIR / f"{student_id}.json"
        if not profile_path.exists():
            errors.append(
                f"{student_dir.relative_to(ROOT)} obsahuje PDF, ale chybí "
                f"students/{student_id}.json"
            )
            continue
        if student_id in processed_students:
            continue
        try:
            if synchronize_profile(student_id, profile_path):
                changed_profiles += 1
        except (OSError, ValueError, TypeError, json.JSONDecodeError) as error:
            errors.append(str(error))

    if errors:
        print("Synchronizace materiálů selhala:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print(f"Synchronizace dokončena. Změněné profily: {changed_profiles}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
