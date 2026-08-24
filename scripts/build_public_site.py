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
    "skupinove-doucovani-matematiky",
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


def replace_required(html: str, old: str, new: str, label: str) -> str:
    if old not in html:
        raise RuntimeError(f"Expected homepage fragment was not found: {label}")
    return html.replace(old, new, 1)


def patch_public_entrypoint() -> None:
    index_path = DIST / "index.html"
    html = index_path.read_text(encoding="utf-8")

    # Use one canonical student login entry point. This avoids unnecessary
    # cross-host Access cookie redirects and keeps the recovery instructions
    # identical for every student account.
    html = html.replace("https://portal.vojtechsteidl.eu", PORTAL_URL)

    # Surface group tutoring as a first-class product on the deployed homepage
    # without changing the existing individual tutoring flow.
    html = replace_required(
        html,
        '<meta name="description" content="Individuální doučování matematiky a fyziky v Jihlavě i online. Součástí výuky jsou vlastní materiály a osobní studentská zóna.">',
        '<meta name="description" content="Individuální i skupinové doučování matematiky a fyziky v Jihlavě i online. Skupinové lekce matematiky od 300 Kč na osobu, vlastní materiály a studentská zóna.">',
        "group tutoring meta description",
    )
    html = replace_required(
        html,
        '<li><a href="#cenik">Ceník</a></li>',
        '<li><a href="/skupinove-doucovani-matematiky/">Skupinové lekce</a></li><li><a href="#cenik">Ceník</a></li>',
        "group tutoring navigation link",
    )
    html = replace_required(
        html,
        '<p>Individuální výuka doplněná o přehledné zápisy, interaktivní materiály a osobní studentskou zónu, kde má student návaznost mezi jednotlivými hodinami.</p>',
        '<p>Individuální výuka i malé skupinové lekce matematiky doplněné o přehledné zápisy, vlastní materiály a studentskou zónu, kde má student návaznost mezi jednotlivými hodinami.</p>',
        "group tutoring hero copy",
    )
    html = replace_required(
        html,
        '<div class="hero-actions"><a href="#kontakt" class="cta-button">Domluvit úvodní konzultaci zdarma <i class="fas fa-arrow-right"></i></a><a href="https://vojtechsteidl.eu/student-portal/" class="cta-button cta-button-secondary"><i class="fas fa-user-lock"></i> Vstoupit do studentské zóny</a></div>',
        '<div class="hero-actions"><a href="#kontakt" class="cta-button">Domluvit úvodní konzultaci zdarma <i class="fas fa-arrow-right"></i></a><a href="/skupinove-doucovani-matematiky/" class="cta-button cta-button-secondary"><i class="fas fa-users"></i> Skupinové lekce od 300 Kč</a><a href="https://vojtechsteidl.eu/student-portal/" class="cta-button cta-button-secondary"><i class="fas fa-user-lock"></i> Studentská zóna</a></div>',
        "group tutoring hero action",
    )

    group_section = '''
        <section class="school-promo-section" id="skupinove-lekce">
            <div class="school-promo">
                <div>
                    <p class="eyebrow">Nově · malé skupiny 3–5 studentů</p>
                    <h2>Skupinové lekce matematiky za 300 Kč na osobu</h2>
                    <p>Pro studenty se stejným cílem sestavuji malé skupiny pro přijímačky na SŠ, maturitu a průběžnou středoškolskou matematiku. Nejdřív sbírám zájemce podle úrovně a časových možností; teprve potom navrhnu společný termín.</p>
                    <div class="school-promo-actions"><a class="school-promo-button" href="/skupinove-doucovani-matematiky/">Zjistit více a přidat se mezi zájemce <i class="fas fa-arrow-right"></i></a></div>
                    <p class="school-promo-note">300 Kč / osoba / 60 minut · online nebo po domluvě v Jihlavě · vyplnění zájmu je nezávazné</p>
                </div>
                <div class="school-promo-points">
                    <div class="school-promo-point"><i class="fas fa-school"></i><span><strong>Přijímačky na SŠ</strong> — typové úlohy, strategie a práce s testem.</span></div>
                    <div class="school-promo-point"><i class="fas fa-graduation-cap"></i><span><strong>Maturita z matematiky</strong> — didaktické testy, bodová strategie a slabá témata.</span></div>
                    <div class="school-promo-point"><i class="fas fa-square-root-variable"></i><span><strong>Středoškolská matematika</strong> — průběžné zvládnutí látky v podobném ročníku.</span></div>
                    <div class="school-promo-point"><i class="fas fa-list-check"></i><span><strong>VŠ a další témata</strong> — zájem sbírám a skupinu otevřu, pokud se potká stejný předmět nebo syllabus.</span></div>
                </div>
            </div>
        </section>
'''
    html = replace_required(
        html,
        '<section class="school-promo-section" id="pro-skoly">',
        group_section + '<section class="school-promo-section" id="pro-skoly">',
        "group tutoring homepage section",
    )

    old_note = (
        "Přístup je chráněný ověřením e-mailu a jednorázovým kódem. "
        "Přihlášení na zařízení zůstává aktivní až 30 dní. "
        "Náhled vedle neobsahuje skutečná studentská data."
    )
    new_note = (
        "Přístup je chráněný ověřením e-mailu a jednorázovým kódem. "
        "Vyžádejte vždy jen jeden kód a použijte pouze nejnovější e-mail; nový požadavek "
        "předchozí PIN zneplatní. Pokud Cloudflare oznámí, že kód už byl použit, "
        "vyžádejte nový a z e-mailu pouze opište PIN; neotevírejte přihlašovací odkaz v e-mailu. "
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

    root_pdfs = sorted(path.name for path in DIST.glob("*.pdf"))
    if root_pdfs:
        raise RuntimeError(f"Unexpected root PDFs in public artifact: {', '.join(root_pdfs)}")

    required_material_files = (
        "materialy-zdarma/index.html",
        "materialy-zdarma/ukazky-pdf/posloupnosti-ukazka.pdf",
        "materialy-zdarma/ukazky-pdf/linearni-rovnice-a-nerovnice-ukazka.pdf",
        "materialy-zdarma/ukazky-pdf/maturita-jednobodove-ulohy-ukazka.pdf",
        "materialy-zdarma/previews/posloupnosti-1.jpg",
        "materialy-zdarma/previews/posloupnosti-2.jpg",
        "materialy-zdarma/previews/linearni-rovnice-a-nerovnice-01.jpg",
        "materialy-zdarma/previews/linearni-rovnice-a-nerovnice-02.jpg",
        "materialy-zdarma/previews/maturita-jednobodove-ulohy-01.jpg",
        "materialy-zdarma/previews/maturita-jednobodove-ulohy-02.jpg",
    )
    missing_material_files = [
        relative for relative in required_material_files if not (DIST / relative).is_file()
    ]
    if missing_material_files:
        raise RuntimeError(
            "Free PDF gallery is incomplete: " + ", ".join(missing_material_files)
        )

    group_page = DIST / "skupinove-doucovani-matematiky" / "index.html"
    if not group_page.exists():
        raise RuntimeError("Group tutoring landing page is missing from public artifact")

    homepage = (DIST / "index.html").read_text(encoding="utf-8")
    if "/skupinove-doucovani-matematiky/" not in homepage:
        raise RuntimeError("Group tutoring link is missing from deployed homepage")


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
