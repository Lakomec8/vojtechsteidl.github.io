from __future__ import annotations

from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "index.html"
STYLE = ROOT / "style.css"
WORKFLOW = ROOT / ".github" / "workflows" / "apply-pricing-update.yml"

pricing_section = '''        <section class="pricing section" id="cenik">
            <div class="section-heading">
                <p class="eyebrow">Transparentní cena</p>
                <h2>Ceník doučování</h2>
                <p>Jednorázová pomoc, zvýhodněné balíčky i rozšířená spolupráce s interaktivními materiály.</p>
            </div>
            <div class="pricing-grid five-plans">
                <article class="pricing-card free-trial">
                    <h3>Úvodní konzultace</h3>
                    <p class="price free">Zdarma</p>
                    <p class="price-period">30 minut</p>
                    <p>Seznámení, ujasnění cíle a doporučení dalšího postupu.</p>
                    <a href="#kontakt" class="card-button">Domluvit konzultaci</a>
                </article>
                <article class="pricing-card">
                    <h3>Jedna lekce</h3>
                    <p class="price">450 Kč</p>
                    <p class="price-period">60 minut</p>
                    <p>Vhodné pro jednorázovou pomoc, konkrétní test nebo vyzkoušení spolupráce.</p>
                    <a href="#kontakt" class="card-button">Mám zájem</a>
                </article>
                <article class="pricing-card">
                    <h3>Balíček 5 lekcí</h3>
                    <p class="price">1 800 Kč</p>
                    <p class="price-period">5 × 60 minut</p>
                    <p>Pro pravidelnější výuku, základní materiály a průběžnou návaznost.</p>
                    <a href="#kontakt" class="card-button">Vybrat balíček</a>
                </article>
                <article class="pricing-card">
                    <h3>Balíček 10 lekcí</h3>
                    <p class="price">3 400 Kč</p>
                    <p class="price-period">10 × 60 minut</p>
                    <p>Pro dlouhodobější spolupráci a systematickou přípravu.</p>
                    <a href="#kontakt" class="card-button">Vybrat balíček</a>
                </article>
                <article class="pricing-card featured premium-plan">
                    <p class="recommended">Studium Plus</p>
                    <h3>Prémiový balíček</h3>
                    <p class="price">2 390 Kč</p>
                    <p class="price-period">5 × 60 minut + 30 dní přístupu</p>
                    <ul class="pricing-features">
                        <li>osobní studentská zóna</li>
                        <li>dostupné interaktivní zápisy</li>
                        <li>úkoly a doporučený další krok</li>
                        <li>průběžná návaznost mezi lekcemi</li>
                    </ul>
                    <a href="#kontakt" class="card-button">Chci Studium Plus</a>
                </article>
            </div>
            <p class="pricing-note">Interaktivní zápisy jsou nyní dostupné k vybraným tématům a knihovna se průběžně rozšiřuje.</p>
        </section>'''

premium_faq = '''<article class="faq-item"><button class="faq-question" type="button" aria-expanded="false">Co obsahuje prémiový balíček Studium Plus?<i class="fas fa-chevron-down"></i></button><div class="faq-answer"><p>Balíček obsahuje pět individuálních lekcí, osobní studentskou zónu, přístup k dostupným interaktivním zápisům, úkoly a doporučený další postup. Interaktivní knihovna je zatím v pilotním režimu a průběžně se rozšiřuje o další témata.</p></div></article>'''

pricing_css = '''

/* Pět nabídek v ceníku: tři nahoře, dvě vycentrované dole. */
@media (min-width: 1025px) {
    .pricing-grid.five-plans {
        grid-template-columns: repeat(6, minmax(0, 1fr));
    }

    .pricing-grid.five-plans .pricing-card {
        grid-column: span 2;
    }

    .pricing-grid.five-plans .pricing-card:nth-child(4) {
        grid-column: 2 / span 2;
    }

    .pricing-grid.five-plans .pricing-card:nth-child(5) {
        grid-column: 4 / span 2;
    }
}

.premium-plan {
    background: linear-gradient(145deg, #ffffff, #f5f8ff);
}

.pricing-features {
    display: grid;
    gap: 0.55rem;
    margin: 0 0 1.4rem;
    padding: 0;
    color: var(--muted);
    font-size: 0.88rem;
    text-align: left;
    list-style: none;
}

.pricing-features li {
    position: relative;
    padding-left: 1.25rem;
}

.pricing-features li::before {
    position: absolute;
    left: 0;
    color: var(--green);
    font-weight: 800;
    content: "✓";
}

.pricing-note {
    max-width: 760px;
    margin: 1.25rem auto 0;
    color: var(--muted);
    font-size: 0.84rem;
    text-align: center;
}
'''

index = INDEX.read_text(encoding="utf-8")
style = STYLE.read_text(encoding="utf-8")

pricing_pattern = re.compile(
    r'\s*<section class="pricing section" id="cenik">.*?</section>',
    flags=re.DOTALL,
)
if len(pricing_pattern.findall(index)) != 1:
    raise RuntimeError("Sekci ceníku se nepodařilo jednoznačně najít.")
index = pricing_pattern.sub("\n" + pricing_section, index, count=1)

faq_anchor = '<article class="faq-item"><button class="faq-question" type="button" aria-expanded="false">Je možné využívat doučování jen nárazově?'
if premium_faq not in index:
    if faq_anchor not in index:
        raise RuntimeError("Místo pro vložení FAQ se nepodařilo najít.")
    index = index.replace(faq_anchor, premium_faq + faq_anchor, 1)

service_option = '<option value="materialy">Vlastní výukové materiály</option>'
premium_option = '<option value="studium-plus">Prémiový balíček Studium Plus</option>'
if premium_option not in index:
    if service_option not in index:
        raise RuntimeError("Výběr služby v kontaktním formuláři nebyl nalezen.")
    index = index.replace(service_option, service_option + premium_option, 1)

if "Pět nabídek v ceníku" not in style:
    style = style.rstrip() + pricing_css + "\n"

INDEX.write_text(index, encoding="utf-8")
STYLE.write_text(style, encoding="utf-8")

# Jednorázové pomocné soubory nemají zůstat v cílové větvi.
Path(__file__).unlink()
if WORKFLOW.exists():
    WORKFLOW.unlink()
