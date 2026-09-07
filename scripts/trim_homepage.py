#!/usr/bin/env python3
"""Keep the homepage focused on the core tutoring offer.

The dedicated school-cooperation page stays public, but the homepage no longer
carries the large school promo or FAQ. Testimonials are retained as social
proof, but moved below the contact section so they do not interrupt the main
conversion path.
"""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / ".public-site" / "index.html"

EVELINA_SOURCE = (
    '<p class="testimonial-text">„Doporučuji každému, kdo potřebuje matematiku opravdu pochopit, '
    'a ne se ji jen mechanicky učit.“</p><p class="testimonial-author">Kateřina N.</p>'
    '<p class="testimonial-role">Příprava na přijímačky</p>'
)
EVELINA_REPLACEMENT = (
    '<p class="testimonial-text">„Je velmi trpělivý, ochotný a dokáže látku vysvětlit jednoduše '
    'a srozumitelně, i když se na první pohled zdá složitá. Bylo vidět, že mu opravdu záleží na tom, '
    'abych látku pochopila, ne jen naučila nazpaměť.“</p><p class="testimonial-author">Evelína</p>'
    '<p class="testimonial-role">Studentka · reference na Doučuji.eu</p>'
)


def section_bounds(html: str, marker: str, label: str) -> tuple[int, int]:
    start = html.find(marker)
    if start < 0:
        raise RuntimeError(f"Expected homepage section was not found: {label}")
    end = html.find("</section>", start)
    if end < 0:
        raise RuntimeError(f"Homepage section has no closing tag: {label}")
    return start, end + len("</section>")


def remove_section(html: str, marker: str, label: str) -> str:
    start, end = section_bounds(html, marker, label)
    return html[:start] + html[end:]


def extract_section(html: str, marker: str, label: str) -> tuple[str, str]:
    start, end = section_bounds(html, marker, label)
    return html[:start] + html[end:], html[start:end]


if not INDEX.is_file():
    raise FileNotFoundError(f"Public homepage is missing: {INDEX}")

html = INDEX.read_text(encoding="utf-8")

# Prefer the stronger, recent reference submitted by Evelína on Doučuji.eu while
# keeping the established three-card desktop layout intact.
if EVELINA_SOURCE not in html:
    raise RuntimeError("Expected testimonial slot for Evelína was not found")
html = html.replace(EVELINA_SOURCE, EVELINA_REPLACEMENT, 1)

# Reduce top-navigation noise. Dedicated pages remain accessible through the
# rest of the site and the school page remains linked from the footer.
html = html.replace('<li><a href="#reference">Reference</a></li>', "")
html = html.replace(
    '<li><a href="/pro-skoly/" class="nav-schools"><i class="fas fa-school"></i> Pro školy</a></li>',
    "",
)

# Remove secondary blocks from the main conversion path.
html = remove_section(
    html,
    '<section class="school-promo-section" id="pro-skoly">',
    "school cooperation promo",
)
html = remove_section(
    html,
    '<section class="faq section" id="faq">',
    "homepage FAQ",
)

# Keep testimonials, but put them at the very bottom of <main>, after contact.
html, testimonials = extract_section(
    html,
    '<section class="testimonials section" id="reference">',
    "testimonials",
)
if "</main>" not in html:
    raise RuntimeError("Homepage has no closing main tag")
html = html.replace("</main>", testimonials + "\n    </main>", 1)

# Guard the intended information hierarchy and the newly selected testimonial.
if 'id="pro-skoly"' in html:
    raise RuntimeError("School promo still appears on homepage")
if 'id="faq"' in html:
    raise RuntimeError("FAQ still appears on homepage")
if 'href="#reference"' in html:
    raise RuntimeError("Reference link still appears in top navigation")
if 'class="nav-schools"' in html:
    raise RuntimeError("School link still appears in top navigation")
if 'testimonial-author">Evelína<' not in html or "reference na Doučuji.eu" not in html:
    raise RuntimeError("Evelína testimonial is missing from the public homepage")
contact_pos = html.find('id="kontakt"')
testimonials_pos = html.find('id="reference"')
if contact_pos < 0 or testimonials_pos < 0 or testimonials_pos < contact_pos:
    raise RuntimeError("Testimonials are not placed after the contact section")

INDEX.write_text(html, encoding="utf-8")
print("Trimmed homepage and selected Evelína testimonial for social proof")
