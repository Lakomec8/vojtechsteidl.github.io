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
    "doucovani-vs-matematiky",
    "skupinove-doucovani-matematiky",
    "priprava-na-prijimacky-z-matematiky",
    "priprava-na-maturitu-z-matematiky",
    "diagnostika",
    "test-prijimacky-9-matematika",
    "test-maturita-matematika",
    "test-vs-matematika-1-rocnik",
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

    html = html.replace("https://portal.vojtechsteidl.eu", PORTAL_URL)

    html = replace_required(
        html,
        '<title>Doučování matematiky a fyziky | Jihlava i online | Vojtěch Steidl</title>',
        '<title>Doučování matematiky a fyziky | online ČR + Vysočina | Vojtěch Steidl</title>',
        "homepage title",
    )
    html = replace_required(
        html,
        '<meta name="robots" content="index, follow">',
        '<meta name="robots" content="index, follow">\n    <link rel="canonical" href="https://vojtechsteidl.eu/">',
        "homepage canonical",
    )
    html = replace_required(
        html,
        '<meta property="og:title" content="Doučování matematiky a fyziky | Jihlava i online">',
        '<meta property="og:title" content="Doučování matematiky a fyziky | online ČR + Vysočina">',
        "homepage og title",
    )

    homepage_schema = '''    <script type="application/ld+json">
    {
      "@context":"https://schema.org",
      "@graph":[
        {
          "@type":"Person",
          "@id":"https://vojtechsteidl.eu/#person",
          "name":"Vojtěch Steidl",
          "url":"https://vojtechsteidl.eu/",
          "image":"https://vojtechsteidl.eu/foto.jpg",
          "jobTitle":"Lektor matematiky a fyziky",
          "telephone":"+420728345633",
          "email":"vojtasteidl@seznam.cz",
          "knowsAbout":["matematika","fyzika","doučování","vysokoškolská matematika"]
        },
        {
          "@type":"WebSite",
          "@id":"https://vojtechsteidl.eu/#website",
          "url":"https://vojtechsteidl.eu/",
          "name":"Doučování matematiky a fyziky | Vojtěch Steidl",
          "publisher":{"@id":"https://vojtechsteidl.eu/#person"},
          "inLanguage":"cs-CZ"
        }
      ]
    }
    </script>'''
    html = replace_required(html, "</head>", homepage_schema + "\n</head>", "homepage structured data")

    html = replace_required(
        html,
        '<meta name="description" content="Individuální doučování matematiky a fyziky v Jihlavě i online. Součástí výuky jsou vlastní materiály a osobní studentská zóna.">',
        '<meta name="description" content="Individuální i skupinové doučování matematiky a fyziky online po celé ČR a osobně po domluvě u lektora na Vysočině. Diagnostické testy zdarma, VŠ matematika, vlastní materiály a studentská zóna.">',
        "homepage service meta description",
    )
    html = replace_required(
        html,
        '<li><a href="#cenik">Ceník</a></li>',
        '<li><a href="/doucovani-vs-matematiky/">VŠ matematika</a></li><li><a href="/diagnostika/">Diagnostika</a></li><li><a href="/skupinove-doucovani-matematiky/">Skupinové lekce</a></li><li><a href="#cenik">Ceník</a></li>',
        "university diagnostics and group navigation links",
    )
    html = replace_required(
        html,
        '<p>Individuální výuka doplněná o přehledné zápisy, interaktivní materiály a osobní studentskou zónu, kde má student návaznost mezi jednotlivými hodinami.</p>',
        '<p>Individuální výuka online po celé ČR a osobně po domluvě na Vysočině, doplněná o přehledné zápisy, diagnostické testy, vlastní materiály a studentskou zónu. Pro VŠ studenty je dostupná také cílená příprava na zápočty a zkoušky.</p>',
        "homepage hero positioning",
    )
    html = replace_required(
        html,
        '<div class="hero-actions"><a href="#kontakt" class="cta-button">Domluvit úvodní konzultaci zdarma <i class="fas fa-arrow-right"></i></a><a href="https://vojtechsteidl.eu/student-portal/" class="cta-button cta-button-secondary"><i class="fas fa-user-lock"></i> Vstoupit do studentské zóny</a></div>',
        '<div class="hero-actions"><a href="#kontakt" class="cta-button">Domluvit úvodní konzultaci zdarma <i class="fas fa-arrow-right"></i></a><a href="/doucovani-vs-matematiky/" class="cta-button cta-button-secondary"><i class="fas fa-square-root-variable"></i> VŠ matematika</a><a href="/diagnostika/" class="cta-button cta-button-secondary"><i class="fas fa-chart-line"></i> Diagnostika zdarma</a><a href="/skupinove-doucovani-matematiky/" class="cta-button cta-button-secondary"><i class="fas fa-users"></i> Skupinové lekce od 300 Kč</a><a href="https://vojtechsteidl.eu/student-portal/" class="cta-button cta-button-secondary"><i class="fas fa-user-lock"></i> Studentská zóna</a></div>',
        "homepage hero actions",
    )

    diagnostics_section = '''
        <section class="school-promo-section" id="diagnostika">
            <div class="school-promo">
                <div>
                    <p class="eyebrow">Zdarma · bez registrace · okamžitý výsledek</p>
                    <h2>Nejdřív zjisti, kde přesně ztrácíš body</h2>
                    <p>Krátké diagnostické testy matematiky pro přijímačky na SŠ, maturitu a 1. ročník VŠ. Po dokončení dostaneš rozpad výsledku podle témat a u každé chyby uvidíš správnou odpověď.</p>
                    <div class="school-promo-actions"><a class="school-promo-button" href="/diagnostika/">Spustit diagnostiku zdarma <i class="fas fa-arrow-right"></i></a><a class="school-promo-button" href="/priprava-na-prijimacky-z-matematiky/">Příprava na přijímačky <i class="fas fa-arrow-right"></i></a><a class="school-promo-button" href="/doucovani-vs-matematiky/">VŠ matematika <i class="fas fa-arrow-right"></i></a></div>
                    <p class="school-promo-note">15 úloh · 5 oblastí · přibližně 15 minut · výsledek se počítá pouze v prohlížeči</p>
                </div>
                <div class="school-promo-points">
                    <div class="school-promo-point"><i class="fas fa-school"></i><span><strong>Přijímačky 9. třída</strong> — čísla, algebra, slovní úlohy, geometrie a data.</span></div>
                    <div class="school-promo-point"><i class="fas fa-graduation-cap"></i><span><strong>Maturita z matematiky</strong> — rychlá mapa slabých maturitních oblastí.</span></div>
                    <div class="school-promo-point"><i class="fas fa-square-root-variable"></i><span><strong>VŠ 1. ročník</strong> — algebra, funkce, limity, derivace a lineární algebra.</span></div>
                    <div class="school-promo-point"><i class="fas fa-check-circle"></i><span><strong>Konkrétní chyby</strong> — špatná volba červeně, správná odpověď zeleně.</span></div>
                </div>
            </div>
        </section>
'''

    group_section = '''
        <section class="school-promo-section" id="skupinove-lekce">
            <div class="school-promo">
                <div>
                    <p class="eyebrow">Nově · malé skupiny 3–5 studentů</p>
                    <h2>Skupinové lekce matematiky za 300 Kč na osobu</h2>
                    <p>Pro studenty se stejným cílem sestavuji malé skupiny pro přijímačky na SŠ, maturitu a průběžnou středoškolskou matematiku. Nejdřív sbírám zájemce podle úrovně a časových možností; teprve potom navrhnu společný termín.</p>
                    <div class="school-promo-actions"><a class="school-promo-button" href="/skupinove-doucovani-matematiky/">Zjistit více a přidat se mezi zájemce <i class="fas fa-arrow-right"></i></a></div>
                    <p class="school-promo-note">300 Kč / osoba / 60 minut · online nebo osobně po domluvě u lektora na Vysočině · vyplnění zájmu je nezávazné</p>
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
        diagnostics_section + group_section + '<section class="school-promo-section" id="pro-skoly">',
        "diagnostics and group tutoring homepage sections",
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


def patch_maturita_diagnostic_feedback() -> None:
    path = DIST / "test-maturita-matematika" / "index.html"
    html = path.read_text(encoding="utf-8")
    script = '<script src="../assets/diagnostic-feedback.js"></script>'
    if script not in html:
        if "</body>" not in html:
            raise RuntimeError("Maturita diagnostic page has no closing body tag")
        html = html.replace("</body>", script + "\n</body>", 1)
    path.write_text(html, encoding="utf-8")


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
    missing_material_files = [relative for relative in required_material_files if not (DIST / relative).is_file()]
    if missing_material_files:
        raise RuntimeError("Free PDF gallery is incomplete: " + ", ".join(missing_material_files))

    for relative, label in (
        ("skupinove-doucovani-matematiky/index.html", "Group tutoring landing page"),
        ("priprava-na-prijimacky-z-matematiky/index.html", "Admissions math landing page"),
        ("doucovani-vs-matematiky/index.html", "University math landing page"),
    ):
        if not (DIST / relative).exists():
            raise RuntimeError(f"{label} is missing from public artifact")

    admissions_html = (DIST / "priprava-na-prijimacky-z-matematiky" / "index.html").read_text(encoding="utf-8")
    if "../test-prijimacky-9-matematika/" not in admissions_html:
        raise RuntimeError("Admissions diagnostic link is missing from admissions landing page")

    university_html = (DIST / "doucovani-vs-matematiky" / "index.html").read_text(encoding="utf-8")
    if "../test-vs-matematika-1-rocnik/" not in university_html:
        raise RuntimeError("University diagnostic link is missing from university math landing page")
    if "standardně za studenty nedojíždím" not in university_html:
        raise RuntimeError("University page must state the in-person travel model accurately")

    required_diagnostics = (
        "diagnostika/index.html",
        "test-prijimacky-9-matematika/index.html",
        "test-maturita-matematika/index.html",
        "test-vs-matematika-1-rocnik/index.html",
        "assets/diagnostic-feedback.js",
        "assets/diagnostic-engine.js",
        "assets/diagnostic-test.css",
    )
    missing_diagnostics = [relative for relative in required_diagnostics if not (DIST / relative).is_file()]
    if missing_diagnostics:
        raise RuntimeError("Diagnostics are incomplete: " + ", ".join(missing_diagnostics))

    homepage = (DIST / "index.html").read_text(encoding="utf-8")
    if '<link rel="canonical" href="https://vojtechsteidl.eu/">' not in homepage:
        raise RuntimeError("Homepage canonical link is missing")
    for link, label in (
        ("/skupinove-doucovani-matematiky/", "Group tutoring"),
        ("/diagnostika/", "Diagnostics"),
        ("/priprava-na-prijimacky-z-matematiky/", "Admissions landing page"),
        ("/doucovani-vs-matematiky/", "University math landing page"),
    ):
        if link not in homepage:
            raise RuntimeError(f"{label} link is missing from deployed homepage")

    if "online po celé ČR" not in homepage or "Vysočině" not in homepage:
        raise RuntimeError("Homepage positioning does not reflect online-first plus Vysočina model")

    math_page = (DIST / "doucovani-matematiky" / "index.html").read_text(encoding="utf-8")
    if "standardně za studenty nedojíždím" not in math_page:
        raise RuntimeError("Local tutoring page must state the no-commuting model accurately")
    if "../doucovani-vs-matematiky/" not in math_page:
        raise RuntimeError("University math internal link is missing from local tutoring page")

    maturita_page = (DIST / "priprava-na-maturitu-z-matematiky" / "index.html").read_text(encoding="utf-8")
    if "../test-maturita-matematika/" not in maturita_page:
        raise RuntimeError("Diagnostic test link is missing from maturita landing page")

    maturita_test = (DIST / "test-maturita-matematika" / "index.html").read_text(encoding="utf-8")
    if "../assets/diagnostic-feedback.js" not in maturita_test:
        raise RuntimeError("Maturita diagnostic feedback highlighting is missing")


if DIST.exists():
    shutil.rmtree(DIST)
DIST.mkdir(parents=True)

for relative in ROOT_FILES:
    copy_required(relative)
for relative in PUBLIC_DIRECTORIES:
    copy_required(relative)

patch_public_entrypoint()
patch_maturita_diagnostic_feedback()
assert_public_artifact()
print(f"Built hardened public site at {DIST}")
