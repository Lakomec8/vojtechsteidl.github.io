#!/usr/bin/env python3
"""Static validation for self-contained interactive learning materials."""

from __future__ import annotations

import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parents[1]
MODULES = [ROOT / "interactive-notes" / "functions" / "index.html"]


class MaterialParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.ids: list[str] = []
        self.references: list[tuple[str, str]] = []
        self.inline_handlers: list[str] = []
        self.canvas_count = 0
        self.button_count = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if values.get("id"):
            self.ids.append(values["id"] or "")
        if tag == "canvas":
            self.canvas_count += 1
        if tag == "button":
            self.button_count += 1

        for attribute, value in attrs:
            if attribute.lower().startswith("on"):
                self.inline_handlers.append(attribute)
            if value and (
                (tag == "script" and attribute == "src")
                or (tag == "link" and attribute == "href")
                or (tag == "a" and attribute == "href")
            ):
                self.references.append((tag, value))


def local_target(document: Path, reference: str) -> Path | None:
    parsed = urlparse(reference)
    if parsed.scheme or parsed.netloc or reference.startswith("#"):
        return None
    clean = unquote(parsed.path)
    if not clean:
        return None
    target = (document.parent / clean).resolve()
    try:
        target.relative_to(ROOT.resolve())
    except ValueError:
        return None
    if clean.endswith("/"):
        target /= "index.html"
    return target


def validate(document: Path) -> list[str]:
    errors: list[str] = []
    relative = document.relative_to(ROOT)
    if not document.is_file():
        return [f"{relative}: soubor neexistuje"]

    parser = MaterialParser()
    parser.feed(document.read_text(encoding="utf-8"))

    duplicates = sorted({value for value in parser.ids if parser.ids.count(value) > 1})
    if duplicates:
        errors.append(f"{relative}: duplicitní HTML id: {', '.join(duplicates)}")
    if parser.inline_handlers:
        errors.append(f"{relative}: nepoužívejte inline event handlery: {', '.join(parser.inline_handlers)}")
    if parser.canvas_count < 3:
        errors.append(f"{relative}: očekávány alespoň 3 interaktivní canvas vizualizace")
    if parser.button_count < 10:
        errors.append(f"{relative}: očekáváno alespoň 10 interaktivních tlačítek")

    for tag, reference in parser.references:
        target = local_target(document, reference)
        if target is None:
            continue
        if not target.exists():
            errors.append(f"{relative}: neexistující lokální odkaz {tag}={reference!r}")

    return errors


def main() -> int:
    errors: list[str] = []
    for module in MODULES:
        errors.extend(validate(module))

    if errors:
        print("Validace interaktivních materiálů selhala:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print(f"Validace proběhla úspěšně: {len(MODULES)} interaktivní modul.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
