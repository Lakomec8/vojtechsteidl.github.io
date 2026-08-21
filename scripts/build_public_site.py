#!/usr/bin/env python3
"""Build the public GitHub Pages artifact from an explicit allowlist.

Student profiles, tutoring materials, upload staging, automation payloads and
Cloudflare portal implementation files must never be published by GitHub Pages.
The private student portal is served separately by Cloudflare Access/Workers.
"""

from __future__ import annotations

import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / ".public-site"
PORTAL_URL = "https://vojtechsteidl.eu/student-portal/"

ROOT_FILES = (
    ".nojekyll",
    "CNAME",
    "index.html",
    "style.css",
    "foto.jpg",
    "favicon.ico",
    "favicon-16x16.png",
    "favicon-32x32.png",
    "apple-touch-icon.png",
    "android-chrome-192x192.png",
    "android-chrome-512x512.png",
    "site.webmanifest",
    "robots.txt",
    "sitemap.xml",
)

PUBLIC_DIRECTORIES = (
    "assets",
    "doucovani-fyziky",
    "doucovani-matematiky",
    "priprava-na-maturitu-z-matematiky",
    "pro-skoly",
    "interactive-notes",
    "materialy-zdarma",
)

FORBIDDEN_TOP_LEVEL = {
    "Materials",
    "students",
    ".uploads",
    ".student-updates",
    "cloudflare-portal",
    "docs",
    "scripts",
    ".github",
}


def copy_required(relative: str) -> None:
    source = ROOT / relative
    target = DIST / relative
    if not source.exists():
        raise FileNotFoundError(f"Required public path is missing: {relative}")
    target.parent.mkdir(parents=True, exist_ok=True)
    if source.is_dir():
        shutil.copytree(source, target)
    else:
        shutil.copy2(source, target)


def patch_public_entrypoint() -> None:
    index_path = DIST / "index.html"
    html = index_path.read_text(encoding="utf-8")

    # One canonical student-login entry point avoids unnecessary cross-host
    # Access cookie redirects. The portal subdomain remains available as an
    # implementation detail/backward-compatible hostname.
    html = html.replace("https://portal.vojtechsteidl.eu", PORTAL_URL)

    old_note = (
        "Přístup je chráněný ověřením e-mailu a jednorázovým kódem. "
        "Přihlášení na zařízení zůstává aktivní až 30 dní. "
        "Náhled vedle neobsahuje skutečná studentská data."
    )
    new_note = (
        "Přístup je chráněný ověřením e-mailu a jednorázovým kódem. "
        "Pokud Cloudflare oznámí, že kód už byl použit, vyžádejte nový kód "
        "a z e-mailu pouze opište PIN; neotevírejte přihlašovací odkaz v e-mailu. "
        "Přihlášení na zařízení zůstává aktivní až 30 dní. "
        "Náhled vedle neobsahuje skutečná studentská data."
    )
    if old_note not in html:
        raise RuntimeError("Expected student-zone login note was not found")
    html = html.replace(old_note, new_note)
    index_path.write_text(html, encoding="utf-8")


def assert_public_artifact() -> None:
    top_level = {path.name for path in DIST.iterdir()}
    leaked = sorted(top_level & FORBIDDEN_TOP_LEVEL)
    if leaked:
        raise RuntimeError(f"Forbidden paths leaked into public artifact: {', '.join(leaked)}")

    # Personal tutoring PDFs must never appear at the public artifact root.
    root_pdfs = sorted(path.name for path in DIST.glob("*.pdf"))
    if root_pdfs:
        raise RuntimeError(f"Unexpected root PDFs in public artifact: {', '.join(root_pdfs)}")


if DIST.exists():
    shutil.rmtree(DIST)
DIST.mkdir(parents=True)

for relative in ROOT_FILES:
    copy_required(relative)
for relative in PUBLIC_DIRECTORIES:
    copy_required(relative)

patch_public_entrypoint()
assert_public_artifact()
print(f"Built hardened public site at {DIST}")
