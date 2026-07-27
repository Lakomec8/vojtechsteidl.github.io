from pathlib import Path

INDEX = Path("index.html")
html = INDEX.read_text(encoding="utf-8")

nav_link = '                <li><a href="#ocekavat">Co můžete očekávat</a></li>\n'
if nav_link not in html:
    raise SystemExit("Odkaz na sekci Co můžete očekávat nebyl nalezen.")
html = html.replace(nav_link, "", 1)


def remove_section(source: str, marker: str, label: str) -> str:
    start = source.find(marker)
    if start < 0:
        raise SystemExit(f"Sekce {label} nebyla nalezena.")
    end = source.find("</section>", start)
    if end < 0:
        raise SystemExit(f"Sekce {label} nemá ukončovací tag.")
    end += len("</section>")
    if source[end:end + 1] == "\n":
        end += 1
    return source[:start] + source[end:]


html = remove_section(
    html,
    '        <section class="expectations section" id="ocekavat">',
    "Co můžete očekávat",
)
html = remove_section(
    html,
    '        <section class="process section" id="jak-to-funguje">',
    "Jak spolupráce probíhá",
)

for removed in ('href="#ocekavat"', 'id="ocekavat"', 'id="jak-to-funguje"', "Jak spolupráce probíhá"):
    if removed in html:
        raise SystemExit(f"Na stránce zůstal odstraněný prvek: {removed}")

for required in (
    'id="materialy"',
    'id="studentska-zona"',
    'id="reference"',
    'id="cenik"',
    '450 Kč',
    'Studium Plus',
    'id="faq"',
    'id="kontakt"',
):
    if required not in html:
        raise SystemExit(f"Po úpravě chybí důležitý prvek: {required}")

INDEX.write_text(html, encoding="utf-8")

Path("scripts/remove_redundant_home_sections.py").unlink()
Path(".github/workflows/simplify-homepage.yml").unlink()
