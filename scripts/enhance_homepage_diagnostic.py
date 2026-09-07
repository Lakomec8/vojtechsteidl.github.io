#!/usr/bin/env python3
"""Replace the generic homepage diagnostic promo with a product-preview block.

The public homepage is assembled into .public-site by build_public_site.py. This
post-build step intentionally operates on that generated artifact so the design
survives future homepage source changes without coupling the diagnostic mockup
to the private portal implementation.
"""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / ".public-site" / "index.html"

START = '<section class="school-promo-section" id="diagnostika">'
MARKER = 'homepage-diagnostic-product-preview'

CSS = r'''<style id="homepage-diagnostic-product-preview">
.home-diagnostic-section {
    width: 100%;
    padding: 5.5rem max(1.25rem, calc((100% - 1180px) / 2));
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    background: linear-gradient(180deg, #f8fafc 0%, #eef4fb 100%);
}
.home-diagnostic-layout {
    display: grid;
    grid-template-columns: minmax(300px, .82fr) minmax(520px, 1.18fr);
    gap: clamp(2.2rem, 5vw, 5rem);
    align-items: center;
}
.home-diagnostic-copy .eyebrow { margin-bottom: .7rem; }
.home-diagnostic-copy h2 {
    margin: .5rem 0 .9rem;
    color: var(--navy);
    font-size: clamp(2rem, 4vw, 3rem);
    letter-spacing: -.045em;
    line-height: 1.08;
}
.home-diagnostic-copy > p {
    color: var(--muted);
    font-size: 1.03rem;
    line-height: 1.75;
}
.home-diagnostic-points {
    display: grid;
    gap: .78rem;
    margin: 1.45rem 0 1.8rem;
}
.home-diagnostic-point {
    display: flex;
    gap: .75rem;
    align-items: flex-start;
    color: #334155;
    font-size: .94rem;
}
.home-diagnostic-point i {
    width: 1.1rem;
    margin-top: .27rem;
    color: var(--green);
    text-align: center;
}
.home-diagnostic-actions {
    display: flex;
    gap: .75rem;
    flex-wrap: wrap;
    align-items: center;
}
.home-diagnostic-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: .6rem;
    min-height: 3.15rem;
    padding: .88rem 1.2rem;
    border-radius: 10px;
    background: var(--navy);
    color: #fff;
    font-weight: 850;
    text-decoration: none;
    box-shadow: 0 12px 26px rgba(15, 23, 42, .14);
}
.home-diagnostic-button:hover,
.home-diagnostic-button:focus-visible {
    background: var(--blue-dark);
    color: #fff;
    outline: none;
    transform: translateY(-2px);
}
.home-diagnostic-secondary {
    display: inline-flex;
    align-items: center;
    min-height: 3rem;
    padding: .7rem .2rem;
    color: var(--blue-dark);
    font-size: .88rem;
    font-weight: 800;
    text-decoration: none;
}
.home-diagnostic-secondary:hover,
.home-diagnostic-secondary:focus-visible {
    color: var(--navy);
    text-decoration: underline;
    outline: none;
}
.home-diagnostic-note {
    display: block;
    margin-top: .85rem;
    color: #8492a6;
    font-size: .8rem;
}
.diagnostic-preview-shell {
    overflow: hidden;
    border: 1px solid #d9e3ee;
    border-radius: 22px;
    background: #f6f8fb;
    box-shadow: 0 30px 70px rgba(15, 23, 42, .17);
    color: #334155;
}
.diagnostic-preview-bar {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 12px 16px;
    border-bottom: 1px solid #dce4ed;
    background: #e9eef5;
}
.diagnostic-preview-bar span {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: #b7c2cf;
}
.diagnostic-preview {
    padding: 20px;
}
.diagnostic-preview-head {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: flex-start;
    margin-bottom: 14px;
}
.diagnostic-preview-head small {
    display: block;
    margin-bottom: 2px;
    color: #7b8794;
    font-size: .59rem;
    font-weight: 800;
    letter-spacing: .09em;
    text-transform: uppercase;
}
.diagnostic-preview-head strong {
    color: var(--navy);
    font-size: .96rem;
}
.diagnostic-preview-badge {
    padding: .32rem .55rem;
    border-radius: 999px;
    background: #ecfdf5;
    color: #15803d;
    font-size: .6rem;
    font-weight: 850;
}
.diagnostic-summary {
    display: grid;
    grid-template-columns: 128px 1fr;
    gap: 14px;
}
.diagnostic-score {
    display: grid;
    min-height: 150px;
    place-items: center;
    padding: 14px;
    border: 1px solid #dbe4ee;
    border-radius: 15px;
    background: #fff;
    text-align: center;
}
.diagnostic-score strong {
    display: block;
    color: var(--navy);
    font-size: 2.25rem;
    line-height: 1;
    letter-spacing: -.04em;
}
.diagnostic-score span {
    display: block;
    margin-top: 6px;
    color: #718096;
    font-size: .62rem;
}
.diagnostic-topics {
    padding: 14px;
    border: 1px solid #dbe4ee;
    border-radius: 15px;
    background: #fff;
}
.diagnostic-topic {
    display: grid;
    grid-template-columns: 82px 1fr 34px;
    gap: 8px;
    align-items: center;
    color: #52606d;
    font-size: .63rem;
}
.diagnostic-topic + .diagnostic-topic { margin-top: 10px; }
.diagnostic-topic strong {
    color: #334e68;
    font-size: .62rem;
    font-weight: 750;
}
.diagnostic-track {
    height: 7px;
    overflow: hidden;
    border-radius: 999px;
    background: #e2e8f0;
}
.diagnostic-fill {
    height: 100%;
    border-radius: inherit;
    background: var(--blue);
}
.diagnostic-topic.priority strong,
.diagnostic-topic.priority > span:last-child { color: #b45309; }
.diagnostic-topic.priority .diagnostic-fill { background: #f59e0b; }
.diagnostic-detail-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-top: 12px;
}
.diagnostic-priority,
.diagnostic-answer {
    padding: 13px;
    border: 1px solid #dbe4ee;
    border-radius: 14px;
    background: #fff;
}
.diagnostic-priority {
    border-color: #fde68a;
    background: #fffbeb;
}
.diagnostic-priority small,
.diagnostic-answer small {
    display: block;
    color: #718096;
    font-size: .58rem;
    font-weight: 800;
    letter-spacing: .08em;
    text-transform: uppercase;
}
.diagnostic-priority strong {
    display: block;
    margin: 4px 0 3px;
    color: #92400e;
    font-size: .83rem;
}
.diagnostic-priority p {
    color: #a16207;
    font-size: .62rem;
    line-height: 1.45;
}
.diagnostic-answer-lines {
    display: grid;
    gap: 7px;
    margin-top: 8px;
}
.diagnostic-answer-line {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    padding: 7px 8px;
    border-radius: 8px;
    font-size: .62rem;
    font-weight: 750;
}
.diagnostic-answer-line.bad { background: #fef2f2; color: #b91c1c; }
.diagnostic-answer-line.good { background: #ecfdf5; color: #15803d; }
.diagnostic-next-step {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
    margin-top: 12px;
    padding: 11px 12px;
    border-radius: 12px;
    background: #eff6ff;
    color: #1d4ed8;
    font-size: .64rem;
}
.diagnostic-next-step strong { color: #1e3a8a; }
@media (max-width: 1000px) {
    .home-diagnostic-layout { grid-template-columns: 1fr; }
    .diagnostic-preview-shell { max-width: 760px; }
}
@media (max-width: 620px) {
    .home-diagnostic-section { padding: 4rem 1rem; }
    .diagnostic-preview { padding: 12px; }
    .diagnostic-summary,
    .diagnostic-detail-grid { grid-template-columns: 1fr; }
    .diagnostic-score { min-height: 105px; }
    .diagnostic-topic { grid-template-columns: 76px 1fr 32px; }
}
</style>'''

REPLACEMENT = r'''<section class="home-diagnostic-section" id="diagnostika">
            <div class="home-diagnostic-layout">
                <div class="home-diagnostic-copy">
                    <p class="eyebrow">Diagnostika matematiky · zdarma</p>
                    <h2>Nejen skóre. Uvidíš, co přesně potřebuješ zlepšit.</h2>
                    <p>Krátký test rozdělí výsledek podle témat a ukáže, kde má další příprava největší efekt. Nejde o známku — jde o rychlou mapu toho, čemu se vyplatí věnovat čas.</p>
                    <div class="home-diagnostic-points">
                        <div class="home-diagnostic-point"><i class="fas fa-chart-simple"></i><span>výsledek po jednotlivých tematických oblastech</span></div>
                        <div class="home-diagnostic-point"><i class="fas fa-circle-xmark"></i><span>konkrétní chyby a správné odpovědi</span></div>
                        <div class="home-diagnostic-point"><i class="fas fa-bullseye"></i><span>jasně označená priorita pro další procvičování</span></div>
                    </div>
                    <div class="home-diagnostic-actions">
                        <a class="home-diagnostic-button" href="/diagnostika/">Vyzkoušet diagnostiku <i class="fas fa-arrow-right"></i></a>
                        <a class="home-diagnostic-secondary" href="/priprava-na-prijimacky-z-matematiky/">Příprava na přijímačky</a>
                        <a class="home-diagnostic-secondary" href="/doucovani-vs-matematiky/">VŠ matematika</a>
                    </div>
                    <span class="home-diagnostic-note">Přijímačky na SŠ · maturita · 1. ročník VŠ · přibližně 15 minut</span>
                </div>
                <div class="diagnostic-preview-shell" aria-label="Ilustrační náhled výsledku diagnostiky">
                    <div class="diagnostic-preview-bar"><span></span><span></span><span></span></div>
                    <div class="diagnostic-preview">
                        <div class="diagnostic-preview-head">
                            <div><small>Výsledek diagnostiky</small><strong>Matematika · přehled témat</strong></div>
                            <span class="diagnostic-preview-badge">Dokončeno</span>
                        </div>
                        <div class="diagnostic-summary">
                            <div class="diagnostic-score"><div><strong>73 %</strong><span>celkové skóre</span></div></div>
                            <div class="diagnostic-topics">
                                <div class="diagnostic-topic"><strong>Algebra</strong><div class="diagnostic-track"><div class="diagnostic-fill" style="width:80%"></div></div><span>80 %</span></div>
                                <div class="diagnostic-topic"><strong>Funkce</strong><div class="diagnostic-track"><div class="diagnostic-fill" style="width:67%"></div></div><span>67 %</span></div>
                                <div class="diagnostic-topic priority"><strong>Planimetrie</strong><div class="diagnostic-track"><div class="diagnostic-fill" style="width:42%"></div></div><span>42 %</span></div>
                                <div class="diagnostic-topic"><strong>Rovnice</strong><div class="diagnostic-track"><div class="diagnostic-fill" style="width:86%"></div></div><span>86 %</span></div>
                                <div class="diagnostic-topic"><strong>Data</strong><div class="diagnostic-track"><div class="diagnostic-fill" style="width:75%"></div></div><span>75 %</span></div>
                            </div>
                        </div>
                        <div class="diagnostic-detail-grid">
                            <div class="diagnostic-priority"><small>Nejvyšší priorita</small><strong>Planimetrie</strong><p>Zaměřit se na trojúhelníky, podobnost a práci s délkami.</p></div>
                            <div class="diagnostic-answer"><small>Ukázka opravy</small><div class="diagnostic-answer-lines"><div class="diagnostic-answer-line bad"><span>Tvoje odpověď</span><span>✕ 12</span></div><div class="diagnostic-answer-line good"><span>Správně</span><span>✓ 16</span></div></div></div>
                        </div>
                        <div class="diagnostic-next-step"><span>Doporučený další krok</span><strong>Procvičit podobnost a Pythagorovu větu →</strong></div>
                    </div>
                </div>
            </div>
        </section>'''


def section_bounds(html: str) -> tuple[int, int]:
    start = html.find(START)
    if start < 0:
        raise RuntimeError("Expected generic homepage diagnostic section was not found")
    end = html.find("</section>", start)
    if end < 0:
        raise RuntimeError("Homepage diagnostic section has no closing tag")
    return start, end + len("</section>")


def main() -> None:
    if not INDEX.is_file():
        raise FileNotFoundError(f"Generated homepage is missing: {INDEX}")

    html = INDEX.read_text(encoding="utf-8")
    if MARKER in html:
        raise RuntimeError("Homepage diagnostic product preview was already applied")

    start, end = section_bounds(html)
    html = html[:start] + REPLACEMENT + html[end:]

    if "</head>" not in html:
        raise RuntimeError("Homepage has no closing head tag")
    html = html.replace("</head>", CSS + "\n</head>", 1)

    if START in html:
        raise RuntimeError("Generic homepage diagnostic section still remains")
    if 'class="home-diagnostic-section" id="diagnostika"' not in html:
        raise RuntimeError("Enhanced homepage diagnostic section is missing")
    if "73 %" not in html or "Nejvyšší priorita" not in html:
        raise RuntimeError("Diagnostic result preview is incomplete")
    if "/priprava-na-prijimacky-z-matematiky/" not in html:
        raise RuntimeError("Admissions internal link was lost from homepage diagnostics")

    INDEX.write_text(html, encoding="utf-8")
    print("Enhanced homepage diagnostic section with product-style result preview")


if __name__ == "__main__":
    main()
