#!/usr/bin/env python3
"""Publish the online-math SEO landing page into the hardened public artifact."""

from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / ".public-site"
SOURCE = ROOT / "online-doucovani-matematiky"
TARGET = DIST / "online-doucovani-matematiky"

if not SOURCE.is_dir():
    raise FileNotFoundError(f"Online tutoring source is missing: {SOURCE}")
if not DIST.is_dir():
    raise FileNotFoundError(f"Public artifact is missing: {DIST}")

if TARGET.exists():
    shutil.rmtree(TARGET)
shutil.copytree(SOURCE, TARGET)

landing = (TARGET / "index.html").read_text(encoding="utf-8")
required = (
    "Online doučování matematiky pro ZŠ, SŠ a VŠ",
    'rel="canonical" href="https://vojtechsteidl.eu/online-doucovani-matematiky/"',
    "../diagnostika/",
    "450 Kč",
)
for token in required:
    if token not in landing:
        raise RuntimeError(f"Online tutoring landing page is missing required content: {token}")

# The local mathematics landing page must link to the dedicated online page.
# Older revisions needed this script to inject the link; current SEO pages include
# it directly, so only fall back to the legacy patch when the link is absent.
math_page = DIST / "doucovani-matematiky" / "index.html"
html = math_page.read_text(encoding="utf-8")
if "../online-doucovani-matematiky/" not in html:
    needle = '<article class="card"><h3>Online doučování</h3><p>Výuka přes sdílenou obrazovku s navazujícími materiály po hodině.</p></article>'
    replacement = '<article class="card"><h3>Online doučování</h3><p>Výuka přes sdílenou obrazovku s navazujícími materiály po hodině.</p><a href="../online-doucovani-matematiky/" style="display:inline-block;margin-top:.75rem;font-weight:800;text-decoration:none">Jak probíhá online doučování →</a></article>'
    if needle not in html:
        raise RuntimeError("Math landing page does not link to the online tutoring page")
    math_page.write_text(html.replace(needle, replacement, 1), encoding="utf-8")

sitemap = (DIST / "sitemap.xml").read_text(encoding="utf-8")
if "https://vojtechsteidl.eu/online-doucovani-matematiky/" not in sitemap:
    raise RuntimeError("Online tutoring landing page is missing from sitemap")

print("Published online tutoring landing page and verified internal link")
