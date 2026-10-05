#!/usr/bin/env python3
"""Compress the public homepage into a short conversion-focused landing page."""

from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / ".public-site" / "index.html"
MARKER = "compact-homepage-v1"

CSS = r'''<style id="compact-homepage-v1">
.compact-shell{width:min(1180px,calc(100% - 2.5rem));margin:0 auto}
.compact-hero{padding:8.4rem 0 4.8rem;background:linear-gradient(180deg,#fff 0%,#f8fbff 100%)}
.compact-hero-grid{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(320px,.85fr);gap:clamp(2rem,6vw,5.2rem);align-items:center}
.compact-kicker{display:inline-flex;gap:.45rem;align-items:center;margin-bottom:1.15rem;padding:.38rem .72rem;border:1px solid #dbe7f3;border-radius:999px;background:#fff;color:#315b7d;font-size:.74rem;font-weight:850;letter-spacing:.04em;text-transform:uppercase}
.compact-hero h1{max-width:780px;margin:0;color:var(--navy);font-size:clamp(2.7rem,6vw,5.25rem);line-height:.98;letter-spacing:-.06em}
.compact-hero-copy{max-width:680px;margin:1.35rem 0 0;color:var(--muted);font-size:clamp(1rem,1.6vw,1.15rem);line-height:1.75}
.compact-actions{display:flex;gap:.75rem;flex-wrap:wrap;margin-top:1.65rem}
.compact-primary,.compact-secondary{display:inline-flex;align-items:center;justify-content:center;gap:.55rem;min-height:3.1rem;padding:.82rem 1.05rem;border-radius:10px;font-weight:850;text-decoration:none}
.compact-primary{background:var(--navy);color:#fff;box-shadow:0 12px 28px rgba(15,23,42,.14)}
.compact-secondary{border:1px solid #cbd5e1;background:#fff;color:var(--navy)}
.compact-primary:hover,.compact-primary:focus-visible{background:var(--blue-dark);color:#fff}.compact-secondary:hover,.compact-secondary:focus-visible{border-color:#94a3b8;color:var(--navy);background:#f8fafc}
.compact-meta{display:flex;gap:.8rem;flex-wrap:wrap;margin-top:1.25rem;color:#64748b;font-size:.82rem}.compact-meta span{display:inline-flex;gap:.4rem;align-items:center}.compact-meta i{color:#2563eb}
.compact-hero-card{padding:1.35rem;border:1px solid #dbe5ef;border-radius:22px;background:#fff;box-shadow:0 22px 60px rgba(15,23,42,.09)}
.compact-hero-card .label{color:#64748b;font-size:.72rem;font-weight:800;text-transform:uppercase;letter-spacing:.06em}.compact-hero-card strong{display:block;margin:.4rem 0;color:var(--navy);font-size:1.22rem}.compact-hero-card p{margin:0;color:#64748b;font-size:.9rem;line-height:1.6}
.compact-hero-card-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:.65rem;margin-top:1rem}.compact-stat{padding:.8rem;border-radius:12px;background:#f8fafc}.compact-stat span{display:block;color:#8190a4;font-size:.66rem}.compact-stat b{display:block;margin-top:.18rem;color:var(--navy);font-size:.9rem}
.compact-capacity{padding:1.15rem 0 1.35rem;border-top:1px solid #e8eef5;border-bottom:1px solid #e8eef5;background:#fff}
.compact-capacity-row{display:grid;grid-template-columns:minmax(210px,.8fr) minmax(0,2.2fr) auto;gap:1rem;align-items:center}
.compact-capacity-copy .eyebrow{margin:0 0 .25rem}.compact-capacity-copy h2{margin:0;color:var(--navy);font-size:1.25rem;letter-spacing:-.025em}.compact-capacity-copy p{margin:.25rem 0 0;color:#718096;font-size:.8rem}
.compact-capacity-slots{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.55rem}.compact-capacity-card{display:block;padding:.75rem .8rem;border:1px solid #dbe5ef;border-radius:12px;background:#f8fafc;color:inherit;text-decoration:none}.compact-capacity-card:hover{border-color:#bfdbfe;background:#f5f9ff;color:inherit}.compact-capacity-card small{display:block;color:#718096;font-size:.66rem}.compact-capacity-card strong{display:block;margin:.18rem 0;color:var(--navy);font-size:.82rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.compact-capacity-card span{display:block;color:#2563eb;font-size:.7rem;font-weight:800}
.compact-link{white-space:nowrap;color:#1d4ed8;font-size:.82rem;font-weight:850;text-decoration:none}.compact-link:hover{text-decoration:underline}
.compact-offer{padding:4.4rem 0 4rem}.compact-heading{max-width:760px;margin-bottom:1.45rem}.compact-heading .eyebrow{margin-bottom:.45rem}.compact-heading h2{margin:0;color:var(--navy);font-size:clamp(2rem,4vw,3.15rem);letter-spacing:-.05em;line-height:1.08}.compact-heading p{margin:.8rem 0 0;color:var(--muted);line-height:1.7}
.compact-goals{display:grid;grid-template-columns:repeat(3,1fr);gap:.8rem}.compact-goal{padding:1.15rem;border:1px solid #dbe5ef;border-radius:16px;background:#fff;text-decoration:none;color:inherit;transition:.2s}.compact-goal:hover{transform:translateY(-2px);border-color:#bfdbfe;box-shadow:0 12px 28px rgba(15,23,42,.07);color:inherit}.compact-goal i{display:grid;width:36px;height:36px;place-items:center;margin-bottom:.8rem;border-radius:10px;background:#eff6ff;color:#2563eb}.compact-goal h3{margin:0;color:var(--navy);font-size:1rem}.compact-goal p{margin:.4rem 0 0;color:#718096;font-size:.82rem;line-height:1.55}.compact-goal span{display:inline-block;margin-top:.65rem;color:#1d4ed8;font-size:.76rem;font-weight:850}
.compact-support{display:grid;grid-template-columns:repeat(3,1fr);gap:.7rem;margin-top:.85rem;padding-top:.85rem;border-top:1px solid #edf2f7}.compact-support-card{display:flex;gap:.7rem;align-items:flex-start;padding:.8rem;border-radius:12px;background:#f8fafc}.compact-support-card i{margin-top:.14rem;color:#2563eb}.compact-support-card strong{display:block;color:var(--navy);font-size:.82rem}.compact-support-card p{margin:.18rem 0 0;color:#718096;font-size:.74rem;line-height:1.5}.compact-support-card a{color:#1d4ed8;font-weight:800;text-decoration:none}
.compact-reference{padding:1.4rem 0 4rem}.compact-quote{display:grid;grid-template-columns:auto 1fr auto;gap:1rem;align-items:center;padding:1.25rem 1.4rem;border:1px solid #dbe5ef;border-radius:18px;background:linear-gradient(135deg,#f8fafc,#fff)}.compact-quote-mark{color:#bfdbfe;font-size:2.8rem;line-height:1}.compact-quote p{margin:0;color:#334155;font-size:1rem;line-height:1.65}.compact-quote-author{min-width:150px}.compact-quote-author strong{display:block;color:var(--navy)}.compact-quote-author span{display:block;margin-top:.2rem;color:#718096;font-size:.72rem}
.compact-pricing{padding:4rem 0;border-top:1px solid #e8eef5;border-bottom:1px solid #e8eef5;background:#f8fafc}.compact-price-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:.8rem}.compact-price{padding:1.15rem;border:1px solid #dbe5ef;border-radius:16px;background:#fff}.compact-price small{display:block;color:#64748b;font-size:.7rem;font-weight:800;text-transform:uppercase;letter-spacing:.05em}.compact-price strong{display:block;margin:.35rem 0;color:var(--navy);font-size:1.55rem;letter-spacing:-.04em}.compact-price p{margin:0;color:#718096;font-size:.8rem;line-height:1.5}.compact-pricing-note{margin:.85rem 0 0;color:#718096;font-size:.8rem}
.compact-contact{padding:4.4rem 0 5rem}.compact-contact-grid{display:grid;grid-template-columns:minmax(260px,.72fr) minmax(0,1.28fr);gap:clamp(2rem,6vw,5rem);align-items:start}.compact-contact-copy h2{margin:.35rem 0 .75rem;color:var(--navy);font-size:clamp(2rem,4vw,3rem);letter-spacing:-.05em}.compact-contact-copy>p{color:var(--muted);line-height:1.7}.compact-contact-details{display:grid;gap:.65rem;margin-top:1.2rem}.compact-contact-detail{display:flex;gap:.7rem;align-items:flex-start;color:#52606d;font-size:.82rem}.compact-contact-detail i{margin-top:.18rem;color:#2563eb}.compact-contact-detail strong{display:block;color:var(--navy)}
.compact-form{display:grid;grid-template-columns:1fr 1fr;gap:.75rem;padding:1.2rem;border:1px solid #dbe5ef;border-radius:18px;background:#fff;box-shadow:0 18px 50px rgba(15,23,42,.07)}.compact-form .form-group{margin:0}.compact-form .form-group.full,.compact-form .consent,.compact-form .submit-button,.compact-form .form-status{grid-column:1/-1}.compact-form label{font-size:.78rem}.compact-form input,.compact-form select,.compact-form textarea{min-height:44px}.compact-form textarea{min-height:92px}.compact-form .submit-button{min-height:48px}
@media(max-width:900px){.compact-hero-grid,.compact-contact-grid{grid-template-columns:1fr}.compact-hero-card{max-width:620px}.compact-capacity-row{grid-template-columns:1fr}.compact-capacity-slots{grid-template-columns:repeat(3,1fr)}.compact-goals,.compact-support,.compact-price-grid{grid-template-columns:1fr 1fr}.compact-quote{grid-template-columns:auto 1fr}.compact-quote-author{grid-column:2}}
@media(max-width:620px){.compact-shell{width:min(100% - 2rem,1180px)}.compact-hero{padding:6.8rem 0 3.5rem}.compact-hero h1{font-size:clamp(2.45rem,13vw,3.6rem)}.compact-capacity-slots,.compact-goals,.compact-support,.compact-price-grid,.compact-form{grid-template-columns:1fr}.compact-capacity-card:nth-child(n+3){display:none}.compact-quote{grid-template-columns:1fr}.compact-quote-mark{display:none}.compact-quote-author{grid-column:1}.compact-form .form-group.full,.compact-form .consent,.compact-form .submit-button,.compact-form .form-status{grid-column:1}}
</style>'''

HERO = r'''<section class="compact-hero">
  <div class="compact-shell compact-hero-grid">
    <div>
      <span class="compact-kicker"><i class="fas fa-circle-check"></i> Online po celé ČR · ZŠ, SŠ a VŠ</span>
      <h1>Online doučování matematiky a fyziky s jasnou návazností.</h1>
      <p class="compact-hero-copy">Vysvětlení bez zbytečného chaosu, konkrétní plán dalšího postupu a materiály, které na lekci skutečně navazují.</p>
      <div class="compact-actions">
        <a class="compact-primary" href="#kontakt">Domluvit úvodní konzultaci <i class="fas fa-arrow-right"></i></a>
        <a class="compact-secondary" href="#kapacita">Zobrazit volná místa</a>
      </div>
      <div class="compact-meta">
        <span><i class="fas fa-clock"></i> 30 min úvod zdarma</span>
        <span><i class="fas fa-laptop"></i> pouze online</span>
        <span><i class="fas fa-coins"></i> od 300 Kč / 60 min</span>
      </div>
    </div>
    <aside class="compact-hero-card">
      <span class="label">Jak spolupráce vypadá</span>
      <strong>Lekce → zápis → další krok.</strong>
      <p>U pravidelné spolupráce má student vše důležité pohromadě ve studentské zóně.</p>
      <div class="compact-hero-card-grid">
        <div class="compact-stat"><span>Individuálně</span><b>450 Kč / 60 min</b></div>
        <div class="compact-stat"><span>Malá skupina</span><b>300 Kč / osoba</b></div>
        <div class="compact-stat"><span>Diagnostika</span><b>zdarma</b></div>
        <div class="compact-stat"><span>Forma</span><b>online</b></div>
      </div>
    </aside>
  </div>
</section>'''

CAPACITY = r'''<section class="compact-capacity" id="kapacita">
  <div class="compact-shell compact-capacity-row">
    <div class="compact-capacity-copy">
      <p class="eyebrow">Aktuální kapacita</p>
      <h2>Nejbližší možnosti</h2>
      <p>Automaticky aktualizováno z kalendáře.</p>
    </div>
    <div class="compact-capacity-slots" id="compactCapacity">
      <a class="compact-capacity-card" href="/skupinove-doucovani-matematiky/"><small>Pondělí · 16:30–17:30</small><strong>CERMAT přijímačky</strong><span>2/4 míst</span></a>
      <a class="compact-capacity-card" href="/skupinove-doucovani-matematiky/"><small>Úterý · 13:00–15:00</small><strong>VŠ matematika</strong><span>1/4 míst</span></a>
      <a class="compact-capacity-card" href="/skupinove-doucovani-matematiky/"><small>Pátek · 15:15–16:15</small><strong>Volný slot</strong><span>0/4 míst</span></a>
    </div>
    <a class="compact-link" href="/skupinove-doucovani-matematiky/">Celý kalendář →</a>
  </div>
</section>'''

OFFER = r'''<section class="compact-offer" id="jak-to-funguje">
  <div class="compact-shell">
    <div class="compact-heading">
      <p class="eyebrow">Podle cíle, ne podle šablony</p>
      <h2>Vyberte problém. Zbytek nastavíme podle studenta.</h2>
      <p>Homepage nemusí vysvětlovat všechno. Detailní postup, diagnostika i ukázky materiálů jsou na samostatných stránkách.</p>
    </div>
    <div class="compact-goals">
      <a class="compact-goal" href="/priprava-na-prijimacky-z-matematiky/"><i class="fas fa-school"></i><h3>Přijímačky na SŠ</h3><p>CERMAT, slovní úlohy, geometrie a práce s časem.</p><span>Detail přípravy →</span></a>
      <a class="compact-goal" href="/priprava-na-maturitu-z-matematiky/"><i class="fas fa-graduation-cap"></i><h3>Maturita / SŠ</h3><p>Průběžná matematika, didaktické testy a slabá témata.</p><span>Detail přípravy →</span></a>
      <a class="compact-goal" href="/doucovani-vs-matematiky/"><i class="fas fa-square-root-variable"></i><h3>VŠ matematika</h3><p>Limity, derivace, integrály a lineární algebra podle sylabu.</p><span>Detail VŠ výuky →</span></a>
    </div>
    <div class="compact-support">
      <div class="compact-support-card"><i class="fas fa-chart-line"></i><div><strong>Diagnostika zdarma</strong><p>Krátký test ukáže, kde začít. <a href="/diagnostika/">Spustit →</a></p></div></div>
      <div class="compact-support-card"><i class="fas fa-file-lines"></i><div><strong>Vlastní materiály</strong><p>Zápisy a interaktivní podklady. <a href="/materialy-zdarma/">Ukázky →</a></p></div></div>
      <div class="compact-support-card"><i class="fas fa-user-lock"></i><div><strong>Studentská zóna</strong><p>Termíny, materiály, úkoly a platby. <a href="https://vojtechsteidl.eu/student-portal/" rel="nofollow">Přihlásit se →</a></p></div></div>
    </div>
  </div>
</section>'''

REFERENCE = r'''<section class="compact-reference" id="reference">
  <div class="compact-shell">
    <div class="compact-quote">
      <div class="compact-quote-mark">“</div>
      <p>Je velmi trpělivý, ochotný a dokáže látku vysvětlit jednoduše a srozumitelně, i když se na první pohled zdá složitá. Bylo vidět, že mu opravdu záleží na tom, abych látku pochopila, ne jen naučila nazpaměť.</p>
      <div class="compact-quote-author"><strong>Evelína</strong><span>studentka · reference na Doučuji.eu</span></div>
    </div>
  </div>
</section>'''

PRICING = r'''<section class="compact-pricing" id="cenik">
  <div class="compact-shell">
    <div class="compact-heading">
      <p class="eyebrow">Jednoduše a transparentně</p>
      <h2>Ceník</h2>
    </div>
    <div class="compact-price-grid">
      <div class="compact-price"><small>První krok</small><strong>Zdarma</strong><p>30min úvodní konzultace / diagnostika.</p></div>
      <div class="compact-price"><small>Individuální výuka</small><strong>450 Kč</strong><p>60 minut · jednorázově nebo pravidelně.</p></div>
      <div class="compact-price"><small>Malá skupina</small><strong>300 Kč / osoba</strong><p>60 minut · studenti se stejným cílem.</p></div>
    </div>
    <p class="compact-pricing-note">U pravidelné spolupráce mohou navazovat materiály a osobní studentská zóna. Platba převodem nebo QR kódem.</p>
  </div>
</section>'''

CONTACT = r'''<section class="compact-contact" id="kontakt">
  <div class="compact-shell compact-contact-grid">
    <div class="compact-contact-copy">
      <p class="eyebrow">První krok</p>
      <h2>Napište, co potřebujete vyřešit.</h2>
      <p>Stačí ročník, téma a ideální čas. Podle kapacity navrhnu individuální nebo skupinovou variantu.</p>
      <div class="compact-contact-details">
        <div class="compact-contact-detail"><i class="fas fa-envelope"></i><div><strong>vojtasteidl@seznam.cz</strong>Odpovídám zpravidla do 24 hodin.</div></div>
        <div class="compact-contact-detail"><i class="fas fa-laptop"></i><div><strong>Online po celé ČR</strong>Videohovor + sdílený zápis.</div></div>
        <div class="compact-contact-detail"><i class="fas fa-user-lock"></i><div><strong>Jste současný student?</strong><a href="https://vojtechsteidl.eu/student-portal/" rel="nofollow"> Otevřít studentskou zónu →</a></div></div>
      </div>
    </div>
    <form class="contact-form compact-form" id="contactForm">
      <div class="form-group"><label for="name">Jméno</label><input type="text" id="name" name="name" autocomplete="name" required></div>
      <div class="form-group"><label for="email">E-mail</label><input type="email" id="email" name="email" autocomplete="email" required></div>
      <div class="form-group"><label for="grade">Ročník</label><select id="grade" name="grade" required><option value="" selected disabled>Vyberte</option><option value="1-stupen-zs">1. stupeň ZŠ</option><option value="2-stupen-zs">2. stupeň ZŠ</option><option value="stredni-skola">Střední škola</option><option value="vysoka-skola">Vysoká škola</option><option value="jine">Jiné</option></select></div>
      <div class="form-group"><label for="service">Cíl</label><select id="service" name="service" required><option value="" selected disabled>Vyberte</option><option value="skupinove-doucovani">Skupinová výuka / volný slot</option><option value="prubezne-doucovani">Průběžné doučování</option><option value="test">Příprava na test</option><option value="prijimacky">Přijímačky</option><option value="maturita">Maturita</option><option value="fyzika">Fyzika</option><option value="vysoka-skola">VŠ matematika</option><option value="jine">Jiné</option></select></div>
      <div class="form-group full"><label for="message">Zpráva</label><textarea id="message" name="message" placeholder="Téma, cíl a kdy se vám hodí online lekce." required></textarea></div>
      <label class="consent"><input type="checkbox" id="consent" required><span>Souhlasím se zpracováním údajů za účelem vyřízení mé poptávky.</span></label>
      <button type="submit" class="submit-button">Poslat nezávaznou poptávku</button>
      <p class="form-status" id="formStatus" aria-live="polite"></p>
    </form>
  </div>
</section>'''

NAV = r'''<ul class="nav-links" id="navLinks">
  <li><a href="#kapacita">Volná místa</a></li>
  <li><a href="#jak-to-funguje">Jak to funguje</a></li>
  <li><a href="#cenik">Ceník</a></li>
  <li><a href="https://vojtechsteidl.eu/student-portal/" rel="nofollow" class="nav-student"><i class="fas fa-user-lock"></i> Studentská zóna</a></li>
  <li><a href="#kontakt" class="nav-contact">Kontakt</a></li>
</ul>'''


def section_bounds(html: str, marker: str, label: str) -> tuple[int, int]:
    start = html.find(marker)
    if start < 0:
        raise RuntimeError(f"Expected homepage section was not found: {label}")
    token = re.compile(r"<section\b|</section>")
    depth = 0
    for match in token.finditer(html, start):
        if match.group(0).startswith("<section"):
            depth += 1
        else:
            depth -= 1
            if depth == 0:
                return start, match.end()
    raise RuntimeError(f"Homepage section has no closing tag: {label}")


def replace_section(html: str, marker: str, replacement: str, label: str) -> str:
    start, end = section_bounds(html, marker, label)
    return html[:start] + replacement + html[end:]


def remove_section(html: str, marker: str, label: str) -> str:
    return replace_section(html, marker, "", label)


def replace_nav(html: str) -> str:
    start = html.find('<ul class="nav-links" id="navLinks">')
    if start < 0:
        raise RuntimeError("Homepage navigation list was not found")
    end = html.find("</ul>", start)
    if end < 0:
        raise RuntimeError("Homepage navigation list has no closing tag")
    return html[:start] + NAV + html[end + len("</ul>"):]


def main() -> None:
    if not INDEX.is_file():
        raise FileNotFoundError(f"Generated homepage is missing: {INDEX}")
    html = INDEX.read_text(encoding="utf-8")
    if MARKER in html:
        raise RuntimeError("Compact homepage was already applied")

    html = replace_nav(html)
    html = replace_section(html, '<section class="hero">', HERO, "hero")
    html = replace_section(html, '<section class="capacity-strip" id="kapacita"', CAPACITY, "capacity")
    html = replace_section(html, '<section class="section" id="studijni-cile">', OFFER, "goals")
    html = replace_section(html, '<section class="testimonials section" id="reference">', REFERENCE, "testimonials")
    html = replace_section(html, '<section class="pricing section" id="cenik">', PRICING, "pricing")
    html = replace_section(html, '<section class="contact section" id="kontakt">', CONTACT, "contact")

    for marker, label in (
        ('<section class="materials-block" id="materialy">', "materials"),
        ('<section class="student-zone-section" id="studentska-zona">', "student zone"),
        ('<section class="school-promo-section" id="diagnostika">', "diagnostics promo"),
        ('<section class="school-promo-section" id="skupinove-lekce">', "group promo"),
        ('<section class="school-promo-section" id="pro-skoly">', "schools promo"),
        ('<section class="about section" id="o-mne">', "about"),
        ('<section class="faq section" id="faq">', "faq"),
    ):
        html = remove_section(html, marker, label)

    if "</head>" not in html:
        raise RuntimeError("Homepage has no closing head tag")
    html = html.replace("</head>", CSS + "\n</head>", 1)

    required = (
        MARKER,
        'id="compactCapacity"',
        'id="jak-to-funguje"',
        'id="reference"',
        'id="cenik"',
        'id="kontakt"',
        "/diagnostika/",
        "/skupinove-doucovani-matematiky/",
        "/priprava-na-prijimacky-z-matematiky/",
        "/doucovani-vs-matematiky/",
        "student-portal/",
    )
    for token in required:
        if token not in html:
            raise RuntimeError(f"Compact homepage is missing required token: {token}")

    forbidden = ('id="materialy"', 'id="studentska-zona"', 'id="pro-skoly"', 'id="faq"', 'id="o-mne"', 'home-diagnostic-section')
    for token in forbidden:
        if token in html:
            raise RuntimeError(f"Legacy homepage block still remains: {token}")

    INDEX.write_text(html, encoding="utf-8")
    print("Built compact conversion-focused homepage")


if __name__ == "__main__":
    main()
