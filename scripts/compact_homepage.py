#!/usr/bin/env python3
"""Build a spacious blue conversion-focused homepage without excessive copy."""

from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / ".public-site" / "index.html"
MARKER = "blue-spacious-homepage-v2"

CSS = r'''<style id="blue-spacious-homepage-v2">
:root{
  --home-blue:#1d4ed8;
  --home-blue-dark:#102a43;
  --home-blue-mid:#173f73;
  --home-blue-soft:#eef5ff;
  --home-line:#dbe6f2;
}
.blue-shell{width:min(1180px,calc(100% - 2.5rem));margin:0 auto}
.blue-home-hero{
  position:relative;
  overflow:hidden;
  padding:8.8rem 0 6.2rem;
  background:
    radial-gradient(circle at 82% 18%,rgba(96,165,250,.26),transparent 30%),
    radial-gradient(circle at 18% 82%,rgba(37,99,235,.2),transparent 32%),
    linear-gradient(135deg,#0b1f34 0%,#123d70 54%,#1d4ed8 120%);
  color:#fff;
}
.blue-home-hero::after{
  position:absolute;right:-120px;bottom:-210px;width:520px;height:520px;border:1px solid rgba(255,255,255,.12);border-radius:50%;content:"";
  box-shadow:0 0 0 70px rgba(255,255,255,.025),0 0 0 145px rgba(255,255,255,.018);
}
.blue-hero-grid{position:relative;z-index:1;display:grid;grid-template-columns:minmax(0,1.08fr) minmax(340px,.92fr);gap:clamp(3rem,7vw,6rem);align-items:center}
.blue-kicker{display:inline-flex;gap:.55rem;align-items:center;padding:.42rem .78rem;border:1px solid rgba(255,255,255,.22);border-radius:999px;background:rgba(255,255,255,.08);color:#dbeafe;font-size:.74rem;font-weight:850;letter-spacing:.05em;text-transform:uppercase;backdrop-filter:blur(8px)}
.blue-home-hero h1{max-width:760px;margin:1.2rem 0 0;font-size:clamp(3rem,6vw,5.6rem);line-height:.98;letter-spacing:-.065em;color:#fff}
.blue-hero-copy{max-width:690px;margin:1.45rem 0 0;color:rgba(255,255,255,.78);font-size:clamp(1rem,1.5vw,1.16rem);line-height:1.75}
.blue-actions{display:flex;gap:.75rem;flex-wrap:wrap;margin-top:1.75rem}
.blue-primary,.blue-secondary{display:inline-flex;align-items:center;justify-content:center;gap:.6rem;min-height:3.2rem;padding:.88rem 1.15rem;border-radius:10px;font-weight:850;text-decoration:none}
.blue-primary{background:#fff;color:#102a43;box-shadow:0 16px 34px rgba(0,0,0,.2)}
.blue-secondary{border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);color:#fff}
.blue-primary:hover,.blue-primary:focus-visible{background:#eff6ff;color:#102a43}
.blue-secondary:hover,.blue-secondary:focus-visible{background:rgba(255,255,255,.14);color:#fff}
.blue-meta{display:flex;gap:1.15rem;flex-wrap:wrap;margin-top:1.3rem;color:rgba(255,255,255,.68);font-size:.82rem}.blue-meta span{display:flex;gap:.4rem;align-items:center}.blue-meta i{color:#93c5fd}
.blue-hero-panel{min-height:390px;padding:1.4rem;border:1px solid rgba(255,255,255,.18);border-radius:26px;background:linear-gradient(145deg,rgba(255,255,255,.14),rgba(255,255,255,.06));box-shadow:0 28px 75px rgba(0,0,0,.23);backdrop-filter:blur(14px)}
.blue-panel-head{display:flex;justify-content:space-between;gap:1rem;align-items:flex-start}
.blue-panel-label{display:block;color:#bfdbfe;font-size:.7rem;font-weight:850;letter-spacing:.08em;text-transform:uppercase}
.blue-panel-head strong{display:block;margin-top:.3rem;color:#fff;font-size:1.3rem;letter-spacing:-.03em}
.blue-panel-pill{padding:.35rem .58rem;border-radius:999px;background:#dcfce7;color:#166534;font-size:.66rem;font-weight:850}
.blue-flow{display:grid;gap:.65rem;margin-top:1.15rem}
.blue-flow-step{display:grid;grid-template-columns:38px 1fr auto;gap:.75rem;align-items:center;padding:.85rem .9rem;border:1px solid rgba(255,255,255,.12);border-radius:13px;background:rgba(3,17,32,.22)}
.blue-flow-step i{display:grid;width:36px;height:36px;place-items:center;border-radius:10px;background:rgba(147,197,253,.15);color:#bfdbfe}
.blue-flow-step strong{display:block;color:#fff;font-size:.86rem}.blue-flow-step span{display:block;margin-top:.16rem;color:rgba(255,255,255,.57);font-size:.7rem}.blue-flow-step b{color:#93c5fd;font-size:.72rem}
.blue-panel-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:.55rem;margin-top:.75rem}
.blue-panel-stat{padding:.78rem;border-radius:12px;background:rgba(255,255,255,.08)}.blue-panel-stat span{display:block;color:rgba(255,255,255,.55);font-size:.62rem}.blue-panel-stat strong{display:block;margin-top:.2rem;color:#fff;font-size:.86rem}
.blue-capacity{padding:4.8rem 0;background:#fff}
.blue-section-head{display:flex;justify-content:space-between;gap:2rem;align-items:end;margin-bottom:1.5rem}
.blue-section-head .eyebrow{margin:0 0 .45rem}.blue-section-head h2{margin:0;color:var(--navy);font-size:clamp(2.1rem,4vw,3.5rem);letter-spacing:-.05em;line-height:1.05}.blue-section-head p{max-width:560px;margin:.7rem 0 0;color:var(--muted);line-height:1.65}
.blue-section-link{white-space:nowrap;color:#1d4ed8;font-size:.88rem;font-weight:850;text-decoration:none}.blue-section-link:hover{text-decoration:underline}
.blue-capacity-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem}
.compact-capacity-card{display:flex;min-height:170px;flex-direction:column;justify-content:space-between;padding:1.25rem;border:1px solid var(--home-line);border-radius:18px;background:linear-gradient(180deg,#fff,#f8fbff);color:inherit;text-decoration:none;box-shadow:0 10px 28px rgba(15,23,42,.05);transition:.22s}
.compact-capacity-card:hover{transform:translateY(-3px);border-color:#93c5fd;box-shadow:0 18px 34px rgba(29,78,216,.1);color:inherit}
.compact-capacity-card small{color:#64748b;font-size:.72rem;font-weight:750}.compact-capacity-card strong{display:block;margin:.5rem 0;color:var(--navy);font-size:1.08rem;line-height:1.3}.compact-capacity-card span{display:inline-flex;width:max-content;padding:.35rem .55rem;border-radius:999px;background:#eff6ff;color:#1d4ed8;font-size:.72rem;font-weight:850}
.blue-goals{padding:5.7rem 0;background:linear-gradient(180deg,#f6f9fd 0%,#fff 100%)}
.blue-goal-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.1rem;margin-top:1.6rem}
.blue-goal-card{position:relative;overflow:hidden;min-height:520px;padding:1.5rem;border:1px solid var(--home-line);border-radius:22px;background:#fff;color:inherit;text-decoration:none;box-shadow:0 14px 36px rgba(15,23,42,.06);transition:.22s;display:flex;flex-direction:column}
.blue-goal-card::after{display:none}
.blue-goal-card:hover{transform:translateY(-4px);border-color:#bfdbfe;box-shadow:0 22px 44px rgba(15,23,42,.09);color:inherit}
.blue-goal-icon{display:grid;width:52px;height:52px;place-items:center;border-radius:14px;background:#eaf2ff;color:#1d4ed8;font-size:1.15rem}
.blue-goal-card h3{margin:1.1rem 0 .55rem;color:var(--navy);font-size:1.45rem;letter-spacing:-.035em}.blue-goal-card p{color:#64748b;line-height:1.6;margin:0}.blue-goal-card>span{position:static;margin-top:auto;padding-top:1rem;color:#1d4ed8;font-size:.82rem;font-weight:850}
.blue-doc-preview{position:relative;overflow:hidden;height:205px;margin-top:1.15rem;border:1px solid #d9e3ee;border-radius:14px;background:#f8fafc;box-shadow:0 12px 24px rgba(15,23,42,.07)}
.blue-doc-preview img{display:block;width:100%;height:100%;object-fit:cover;object-position:top}
.blue-doc-preview::after{position:absolute;right:0;bottom:0;left:0;height:52px;background:linear-gradient(180deg,rgba(255,255,255,0),rgba(255,255,255,.96));content:"";z-index:1}
.blue-doc-label{position:absolute;z-index:3;top:.65rem;left:.65rem;padding:.3rem .5rem;border-radius:999px;background:rgba(16,42,67,.9);color:#fff;font-size:.62rem;font-weight:850;letter-spacing:.035em}
.blue-ecosystem{padding:5.8rem 0;background:#fff}
.blue-bento{display:grid;grid-template-columns:1.35fr .65fr;grid-template-rows:1fr 1fr;gap:1rem;min-height:560px;margin-top:1.6rem}
.blue-zone-card{grid-row:1/3;display:grid;grid-template-rows:auto 1fr;overflow:hidden;padding:1.6rem;border-radius:26px;background:linear-gradient(135deg,#0e2a47 0%,#174f89 62%,#2563eb 140%);color:#fff;box-shadow:0 25px 65px rgba(15,23,42,.16)}
.blue-zone-card .eyebrow{color:#93c5fd}.blue-zone-card h3{margin:.4rem 0 .7rem;color:#fff;font-size:clamp(2rem,3.4vw,3rem);letter-spacing:-.045em}.blue-zone-card>div>p{max-width:660px;color:rgba(255,255,255,.75);line-height:1.7}.blue-zone-card a{display:inline-flex;margin-top:1rem;color:#fff;font-weight:850;text-decoration:none}
.blue-portal-mini{align-self:end;overflow:hidden;margin-top:1.25rem;border:1px solid rgba(255,255,255,.18);border-radius:18px 18px 0 0;background:#f4f7fb;box-shadow:0 22px 50px rgba(0,0,0,.2);color:#243b53}
.blue-portal-top{display:flex;gap:6px;padding:10px 12px;background:#e7edf4;border-bottom:1px solid #d6dee8}.blue-portal-top span{width:8px;height:8px;border-radius:50%;background:#b7c3d0}
.blue-portal-body{display:grid;grid-template-columns:115px 1fr;min-height:235px}.blue-portal-side{padding:14px 10px;background:#102a43}.blue-portal-side strong{color:#fff;font-size:.72rem}.blue-portal-nav{display:grid;gap:6px;margin-top:15px}.blue-portal-nav span{padding:7px;border-radius:7px;color:rgba(255,255,255,.58);font-size:.56rem}.blue-portal-nav span.active{background:rgba(255,255,255,.13);color:#fff}
.blue-portal-main{padding:14px}.blue-portal-banner{display:flex;justify-content:space-between;gap:1rem;padding:14px;border-radius:12px;background:linear-gradient(135deg,#eaf2ff,#fff)}.blue-portal-banner strong{color:#102a43;font-size:.9rem}.blue-portal-banner span{color:#64748b;font-size:.58rem}.blue-progress{width:86px;padding:9px;border-radius:9px;background:#fff}.blue-progress b{display:block;color:#102a43;font-size:.95rem}.blue-progress i{display:block;height:5px;margin-top:5px;border-radius:999px;background:linear-gradient(90deg,#2563eb 68%,#e2e8f0 68%)}
.blue-portal-panels{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:8px}.blue-portal-panel{min-height:72px;padding:9px;border:1px solid #e0e7ef;border-radius:9px;background:#fff}.blue-portal-panel strong{display:block;color:#102a43;font-size:.55rem}.blue-portal-line{height:5px;margin-top:7px;border-radius:999px;background:#e2e8f0}.blue-portal-line.short{width:62%}
.blue-mini-card{display:flex;flex-direction:column;justify-content:space-between;padding:1.4rem;border:1px solid var(--home-line);border-radius:22px;background:#f8fbff;box-shadow:0 12px 30px rgba(15,23,42,.05)}.blue-mini-card i{display:grid;width:44px;height:44px;place-items:center;border-radius:12px;background:#eaf2ff;color:#1d4ed8}.blue-mini-card h3{margin:1rem 0 .45rem;color:var(--navy);font-size:1.25rem;letter-spacing:-.03em}.blue-mini-card p{margin:0;color:#64748b;line-height:1.55;font-size:.88rem}.blue-mini-card a{margin-top:1rem;color:#1d4ed8;font-size:.8rem;font-weight:850;text-decoration:none}
.blue-reference{padding:4.5rem 0;background:#fff}.blue-quote{display:grid;grid-template-columns:auto 1fr auto;gap:1.2rem;align-items:center;padding:1.5rem 1.7rem;border:1px solid var(--home-line);border-radius:20px;background:linear-gradient(135deg,#f8fbff,#fff);box-shadow:0 12px 30px rgba(15,23,42,.045)}.blue-quote-mark{color:#bfdbfe;font-size:3.4rem;line-height:1}.blue-quote p{margin:0;color:#334155;font-size:1.05rem;line-height:1.7}.blue-quote-author{min-width:160px}.blue-quote-author strong{display:block;color:var(--navy)}.blue-quote-author span{display:block;margin-top:.2rem;color:#64748b;font-size:.72rem}
.blue-pricing{padding:5.5rem 0;background:linear-gradient(180deg,#f4f8fd,#eef5ff)}.blue-price-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-top:1.5rem}.blue-price-card{min-height:250px;padding:1.4rem;border:1px solid #d5e3f2;border-radius:20px;background:#fff;box-shadow:0 14px 32px rgba(15,23,42,.05)}.blue-price-card.featured{border-color:#93c5fd;background:linear-gradient(145deg,#0f3358,#1d4ed8);color:#fff;box-shadow:0 20px 46px rgba(29,78,216,.2)}.blue-price-card small{color:#64748b;font-size:.7rem;font-weight:850;letter-spacing:.06em;text-transform:uppercase}.blue-price-card.featured small{color:#bfdbfe}.blue-price-card strong{display:block;margin:2.4rem 0 .3rem;color:var(--navy);font-size:2rem;letter-spacing:-.045em}.blue-price-card.featured strong{color:#fff}.blue-price-card p{margin:0;color:#64748b;line-height:1.55}.blue-price-card.featured p{color:rgba(255,255,255,.73)}.blue-price-card a{display:inline-flex;margin-top:1.2rem;color:#1d4ed8;font-size:.82rem;font-weight:850;text-decoration:none}.blue-price-card.featured a{color:#fff}
.blue-contact{padding:6rem 0;background:#fff}.blue-contact-grid{display:grid;grid-template-columns:minmax(300px,.78fr) minmax(0,1.22fr);gap:1rem}.blue-contact-copy{min-height:100%;padding:2rem;border-radius:24px;background:linear-gradient(145deg,#0d2947,#174f89);color:#fff}.blue-contact-copy .eyebrow{color:#93c5fd}.blue-contact-copy h2{margin:.45rem 0 .8rem;color:#fff;font-size:clamp(2.2rem,4vw,3.4rem);letter-spacing:-.05em;line-height:1.08}.blue-contact-copy>p{color:rgba(255,255,255,.72);line-height:1.7}.blue-contact-details{display:grid;gap:.8rem;margin-top:2rem}.blue-contact-detail{display:flex;gap:.75rem;align-items:flex-start;padding:.85rem;border:1px solid rgba(255,255,255,.11);border-radius:12px;background:rgba(255,255,255,.055);color:rgba(255,255,255,.72);font-size:.82rem}.blue-contact-detail i{margin-top:.18rem;color:#93c5fd}.blue-contact-detail strong{display:block;color:#fff}.blue-contact-detail a{color:#dbeafe;text-decoration:none}
.blue-form{display:grid;grid-template-columns:1fr 1fr;gap:.8rem;padding:2rem;border:1px solid var(--home-line);border-radius:24px;background:#fff;box-shadow:0 22px 55px rgba(15,23,42,.07)}.blue-form .form-group{margin:0}.blue-form .form-group.full,.blue-form .consent,.blue-form .submit-button,.blue-form .form-status{grid-column:1/-1}.blue-form label{font-size:.8rem}.blue-form input,.blue-form select,.blue-form textarea{min-height:46px}.blue-form textarea{min-height:105px}.blue-form .submit-button{min-height:50px}
@media(max-width:980px){.blue-hero-grid,.blue-contact-grid{grid-template-columns:1fr}.blue-hero-panel{max-width:720px}.blue-section-head{align-items:flex-start;flex-direction:column}.blue-bento{grid-template-columns:1fr;grid-template-rows:auto}.blue-zone-card{grid-row:auto;min-height:530px}.blue-goal-grid,.blue-price-grid{grid-template-columns:1fr 1fr}.blue-quote{grid-template-columns:auto 1fr}.blue-quote-author{grid-column:2}.blue-capacity-grid{grid-template-columns:repeat(3,minmax(220px,1fr));overflow-x:auto;padding-bottom:.4rem}}
@media(max-width:680px){.blue-shell{width:min(100% - 2rem,1180px)}.blue-home-hero{padding:7rem 0 4.5rem}.blue-home-hero h1{font-size:clamp(2.7rem,13vw,4.1rem)}.blue-panel-stats,.blue-goal-grid,.blue-price-grid,.blue-form{grid-template-columns:1fr}.blue-capacity-grid{grid-template-columns:repeat(3,245px)}.blue-capacity{padding:3.7rem 0}.blue-goals,.blue-ecosystem,.blue-pricing,.blue-contact{padding:4rem 0}.blue-goal-card{min-height:500px}.blue-bento{min-height:0}.blue-zone-card{min-height:0}.blue-portal-body{grid-template-columns:90px 1fr}.blue-portal-panels{grid-template-columns:1fr 1fr}.blue-portal-panel:last-child{display:none}.blue-quote{grid-template-columns:1fr}.blue-quote-mark{display:none}.blue-quote-author{grid-column:1}.blue-form .form-group.full,.blue-form .consent,.blue-form .submit-button,.blue-form .form-status{grid-column:1}}
</style>'''

HERO = r'''<section class="blue-home-hero">
  <div class="blue-shell blue-hero-grid">
    <div>
      <span class="blue-kicker"><i class="fas fa-circle-check"></i> Online po celé ČR · matematika a fyzika</span>
      <h1>Doučování, které má mezi hodinami pokračování.</h1>
      <p class="blue-hero-copy">Od rychlé pomoci před testem po dlouhodobou přípravu na přijímačky, maturitu nebo VŠ. Cílem není jen projít látku, ale vědět, co má student dělat dál.</p>
      <div class="blue-actions">
        <a class="blue-primary" href="#kontakt">Domluvit úvodní konzultaci <i class="fas fa-arrow-right"></i></a>
        <a class="blue-secondary" href="#kapacita">Podívat se na kapacitu</a>
      </div>
      <div class="blue-meta">
        <span><i class="fas fa-clock"></i> 30 min úvod zdarma</span>
        <span><i class="fas fa-laptop"></i> pouze online</span>
        <span><i class="fas fa-user-group"></i> individuálně i ve skupině</span>
      </div>
    </div>
    <aside class="blue-hero-panel">
      <div class="blue-panel-head">
        <div><span class="blue-panel-label">Model spolupráce</span><strong>Jedna hodina není izolovaný ostrov.</strong></div>
        <span class="blue-panel-pill">Online</span>
      </div>
      <div class="blue-flow">
        <div class="blue-flow-step"><i class="fas fa-video"></i><div><strong>1. Lekce</strong><span>Vysvětlení, společné řešení, okamžitá zpětná vazba.</span></div><b>60 min</b></div>
        <div class="blue-flow-step"><i class="fas fa-file-lines"></i><div><strong>2. Materiály</strong><span>Zápis nebo procvičování k tomu, co se skutečně řešilo.</span></div><b>navazuje</b></div>
        <div class="blue-flow-step"><i class="fas fa-chart-line"></i><div><strong>3. Další krok</strong><span>Je jasné, co opakovat a kam se posunout příště.</span></div><b>bez chaosu</b></div>
      </div>
      <div class="blue-panel-stats">
        <div class="blue-panel-stat"><span>Individuálně</span><strong>450 Kč</strong></div>
        <div class="blue-panel-stat"><span>Skupina</span><strong>300 Kč / os.</strong></div>
        <div class="blue-panel-stat"><span>Diagnostika</span><strong>zdarma</strong></div>
      </div>
    </aside>
  </div>
</section>'''

CAPACITY = r'''<section class="blue-capacity" id="kapacita">
  <div class="blue-shell">
    <div class="blue-section-head">
      <div>
        <p class="eyebrow">Stávající kapacita</p>
        <h2>Týdenní kalendář</h2>
      </div>
    </div>
    <div class="capacity-legend" style="margin-bottom:1rem">
      <span><i class="legend-dot join"></i> lze se přidat</span>
      <span><i class="legend-dot free"></i> volný slot</span>
      <span>automatická aktualizace ~15 min</span>
    </div>
    <div class="weekly-calendar-wrap">
      <div class="weekly-calendar" id="weeklyCalendar" aria-live="polite">
        <section class="calendar-day"><h3>Pondělí</h3><div class="calendar-day-slots"><article class="calendar-slot join"><div class="calendar-slot-time">16:30–17:30</div><strong>CERMAT přijímačky</strong><div class="calendar-slot-foot"><span>2/4</span><button type="button" class="calendar-slot-action" data-slot-id="mon-1630">Přidat se</button></div></article></div></section>
        <section class="calendar-day"><h3>Úterý</h3><div class="calendar-day-slots"><article class="calendar-slot join"><div class="calendar-slot-time">13:00–15:00</div><strong>VŠ matematika</strong><div class="calendar-slot-foot"><span>1/4</span><button type="button" class="calendar-slot-action" data-slot-id="tue-1300">Přidat se</button></div></article><article class="calendar-slot free"><div class="calendar-slot-time">15:15–16:15</div><strong>Volný slot</strong><div class="calendar-slot-foot"><span>0/4</span><button type="button" class="calendar-slot-action" data-slot-id="tue-1515">Vybrat slot</button></div></article><article class="calendar-slot free"><div class="calendar-slot-time">16:30–17:30</div><strong>Volný slot</strong><div class="calendar-slot-foot"><span>0/4</span><button type="button" class="calendar-slot-action" data-slot-id="tue-1630">Vybrat slot</button></div></article><article class="calendar-slot join"><div class="calendar-slot-time">17:30–18:30</div><strong>CERMAT přijímačky</strong><div class="calendar-slot-foot"><span>1/4</span><button type="button" class="calendar-slot-action" data-slot-id="tue-1730">Přidat se</button></div></article></div></section>
        <section class="calendar-day"><h3>Středa</h3><div class="calendar-day-slots"><article class="calendar-slot join"><div class="calendar-slot-time">16:00–17:00</div><strong>2. ročník SŠ</strong><div class="calendar-slot-foot"><span>1/4</span><button type="button" class="calendar-slot-action" data-slot-id="wed-1600">Přidat se</button></div></article><article class="calendar-slot join"><div class="calendar-slot-time">17:00–18:00</div><strong>Příprava na maturitu</strong><div class="calendar-slot-foot"><span>1/4</span><button type="button" class="calendar-slot-action" data-slot-id="wed-1700">Přidat se</button></div></article><article class="calendar-slot join"><div class="calendar-slot-time">19:00–20:00</div><strong>9. ročník · AJ kurikulum</strong><div class="calendar-slot-foot"><span>1/4</span><button type="button" class="calendar-slot-action" data-slot-id="wed-1900">Přidat se</button></div></article></div></section>
        <section class="calendar-day"><h3>Čtvrtek</h3><div class="calendar-day-slots"><article class="calendar-slot free"><strong>Volno</strong><div class="calendar-slot-foot"><button type="button" class="calendar-slot-action" data-slot-id="thu-flex">Domluvit</button></div></article></div></section>
        <section class="calendar-day"><h3>Pátek</h3><div class="calendar-day-slots"><article class="calendar-slot join"><div class="calendar-slot-time">14:00–15:00</div><strong>VŠ matematika</strong><div class="calendar-slot-foot"><span>1/4</span><button type="button" class="calendar-slot-action" data-slot-id="fri-1400">Přidat se</button></div></article><article class="calendar-slot free"><div class="calendar-slot-time">15:15–16:15</div><strong>Volný slot</strong><div class="calendar-slot-foot"><span>0/4</span><button type="button" class="calendar-slot-action" data-slot-id="fri-1515">Vybrat slot</button></div></article><article class="calendar-slot free"><div class="calendar-slot-time">16:30–17:30</div><strong>Volný slot</strong><div class="calendar-slot-foot"><span>0/4</span><button type="button" class="calendar-slot-action" data-slot-id="fri-1630">Vybrat slot</button></div></article></div></section>
      </div>
    </div>
    <div class="slot-selection" id="slotSelection" hidden>
      <div class="slot-selection-copy">
        <span class="slot-selection-label">Vybraný slot</span>
        <strong id="selectedSlotTitle"></strong>
        <span id="selectedSlotMeta"></span>
      </div>
      <form class="slot-selection-form" id="slotBookingForm">
        <input type="hidden" id="selectedSlotId" name="slot_id">
        <input type="hidden" id="selectedSlotInfo" name="slot_info">
        <input type="text" name="name" placeholder="Jméno" autocomplete="name" required>
        <input type="email" name="email" placeholder="E-mail" autocomplete="email" required>
        <button type="submit">Potvrdit výběr</button>
        <p class="form-status" id="slotBookingStatus" aria-live="polite"></p>
      </form>
    </div>
  </div>
</section>'''

OFFER = r'''<section class="blue-goals" id="jak-to-funguje">
  <div class="blue-shell">
    <div class="blue-section-head">
      <div>
        <p class="eyebrow">Podle cíle</p>
        <h2>Tři typické důvody, proč studenti přicházejí.</h2>
      </div>
    </div>
    <div class="blue-goal-grid">
      <a class="blue-goal-card" href="/priprava-na-prijimacky-z-matematiky/"><div class="blue-goal-icon"><i class="fas fa-school"></i></div><h3>Přijímačky na SŠ</h3><p>CERMAT, slovní úlohy, geometrie a strategie práce s časem.</p><div class="blue-doc-preview"><span class="blue-doc-label">Ukázka · slovní úlohy</span><img src="/assets/previews/zs-slovni-ulohy.webp" alt="Omezená ukázka materiálu pro 9. třídu se slovními úlohami" loading="lazy"></div><span>Prohlédnout přípravu →</span></a>
      <a class="blue-goal-card" href="/priprava-na-maturitu-z-matematiky/"><div class="blue-goal-icon"><i class="fas fa-graduation-cap"></i></div><h3>SŠ a maturita</h3><p>Průběžná matematika, didaktické testy a systematické uzavírání slabých témat.</p><div class="blue-doc-preview"><span class="blue-doc-label">Ukázka · geometrie</span><img src="/assets/previews/ss-geometrie.webp" alt="Omezená ukázka středoškolského materiálu ke kružnici, výseči a typové úloze" loading="lazy"></div><span>Prohlédnout přípravu →</span></a>
      <a class="blue-goal-card" href="/doucovani-vs-matematiky/"><div class="blue-goal-icon"><i class="fas fa-square-root-variable"></i></div><h3>VŠ matematika</h3><p>Limity, derivace, integrály a lineární algebra podle konkrétního sylabu.</p><div class="blue-doc-preview"><span class="blue-doc-label">Ukázka · integrály</span><img src="/assets/previews/vs-integraly.webp" alt="Omezená ukázka vysokoškolského materiálu s integračním vzorcem a řešeným příkladem" loading="lazy"></div><span>Prohlédnout VŠ výuku →</span></a>
    </div>
  </div>
</section>
<section class="blue-ecosystem" id="studentska-zona">
  <div class="blue-shell">
    <div class="blue-section-head">
      <div>
        <p class="eyebrow">Součást spolupráce</p>
        <h2>Nejen videohovor.</h2>
        <p>Technické věci mají pomáhat udržet návaznost, ne přidávat další administrativu.</p>
      </div>
    </div>
    <div class="blue-bento">
      <article class="blue-zone-card">
        <div>
          <p class="eyebrow">Studentská zóna</p>
          <h3>Vše důležité na jednom místě.</h3>
          <p>Termíny, materiály, úkoly, průběh spolupráce a platby. Bez hledání starých e-mailů a souborů.</p>
          <a href="https://vojtechsteidl.eu/student-portal/" rel="nofollow">Vstoupit do studentské zóny <i class="fas fa-arrow-right" style="margin-left:.45rem"></i></a>
        </div>
        <div class="blue-portal-mini" aria-label="Ilustrační náhled studentské zóny">
          <div class="blue-portal-top"><span></span><span></span><span></span></div>
          <div class="blue-portal-body">
            <div class="blue-portal-side"><strong>Student Zone</strong><div class="blue-portal-nav"><span class="active">Přehled</span><span>Materiály</span><span>Termíny</span><span>Platby</span></div></div>
            <div class="blue-portal-main">
              <div class="blue-portal-banner"><div><strong>Další lekce</strong><span>Středa · matematika</span></div><div class="blue-progress"><span>Postup</span><b>68 %</b><i></i></div></div>
              <div class="blue-portal-panels"><div class="blue-portal-panel"><strong>Poslední materiál</strong><div class="blue-portal-line"></div><div class="blue-portal-line short"></div></div><div class="blue-portal-panel"><strong>Úkoly</strong><div class="blue-portal-line"></div><div class="blue-portal-line short"></div></div><div class="blue-portal-panel"><strong>Platba</strong><div class="blue-portal-line"></div><div class="blue-portal-line short"></div></div></div>
            </div>
          </div>
        </div>
      </article>
      <article class="blue-mini-card"><div><i class="fas fa-chart-simple"></i><h3>Diagnostika</h3><p>Krátký test ukáže, kde student ztrácí body a čím začít.</p></div><a href="/diagnostika/">Vyzkoušet zdarma →</a></article>
      <article class="blue-mini-card"><div><i class="fas fa-file-circle-check"></i><h3>Vlastní materiály</h3><p>Přehledné zápisy a procvičování k tématům, která se opravdu probírají.</p></div><a href="/materialy-zdarma/">Prohlédnout ukázky →</a></article>
    </div>
  </div>
</section>'''

REFERENCE = r'''<section class="blue-reference" id="reference">
  <div class="blue-shell">
    <div class="blue-quote">
      <div class="blue-quote-mark">“</div>
      <p>Je velmi trpělivý, ochotný a dokáže látku vysvětlit jednoduše a srozumitelně, i když se na první pohled zdá složitá. Bylo vidět, že mu opravdu záleží na tom, abych látku pochopila, ne jen naučila nazpaměť.</p>
      <div class="blue-quote-author"><strong>Evelína</strong><span>studentka · reference na Doučuji.eu</span></div>
    </div>
  </div>
</section>'''

PRICING = r'''<section class="blue-pricing" id="cenik">
  <div class="blue-shell">
    <div class="blue-section-head">
      <div>
        <p class="eyebrow">Jednoduše a transparentně</p>
        <h2>Ceník bez složitostí.</h2>
      </div>
    </div>
    <div class="blue-price-grid">
      <article class="blue-price-card"><small>První krok</small><strong>Zdarma</strong><p>30min úvodní konzultace nebo diagnostika.</p><a href="#kontakt">Domluvit →</a></article>
      <article class="blue-price-card featured"><small>Individuální lekce</small><strong>450 Kč</strong><p>60 minut, jednorázově nebo pravidelně podle aktuální potřeby.</p><a href="#kontakt">Vybrat individuální lekci →</a></article>
      <article class="blue-price-card"><small>Malá skupina</small><strong>300 Kč / osoba</strong><p>60 minut pro studenty s podobnou úrovní a stejným cílem.</p><a href="/skupinove-doucovani-matematiky/">Zobrazit skupiny →</a></article>
    </div>
  </div>
</section>'''

CONTACT = r'''<section class="blue-contact" id="kontakt">
  <div class="blue-shell blue-contact-grid">
    <aside class="blue-contact-copy">
      <p class="eyebrow">První krok</p>
      <h2>Napište, co potřebujete vyřešit.</h2>
      <p>Stačí ročník, téma a ideální čas. Podle aktuální kapacity navrhnu individuální nebo skupinovou variantu.</p>
      <div class="blue-contact-details">
        <div class="blue-contact-detail"><i class="fas fa-envelope"></i><div><strong>vojtasteidl@seznam.cz</strong>Odpovídám zpravidla do 24 hodin.</div></div>
        <div class="blue-contact-detail"><i class="fas fa-laptop"></i><div><strong>Online po celé ČR</strong>Videohovor + sdílený zápis.</div></div>
        <div class="blue-contact-detail"><i class="fas fa-user-lock"></i><div><strong>Současní studenti</strong><a href="https://vojtechsteidl.eu/student-portal/" rel="nofollow">Otevřít studentskou zónu →</a></div></div>
      </div>
    </aside>
    <form class="contact-form blue-form" id="contactForm">
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
  <li><a href="#kapacita">Kapacita</a></li>
  <li><a href="#jak-to-funguje">Příprava</a></li>
  <li><a href="#studentska-zona">Studentská zóna</a></li>
  <li><a href="#cenik">Ceník</a></li>
  <li><a href="#kontakt" class="nav-contact">Kontakt</a></li>
</ul>'''


def section_bounds(html: str, marker: str, label: str) -> tuple[int, int]:
    start = html.find(marker)
    if start < 0:
        raise RuntimeError(f"Expected homepage section was not found: {label}")
    token = re.compile(r"<section[^>]*>|</section>")
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
        raise RuntimeError("Blue spacious homepage was already applied")

    html = replace_nav(html)
    html = replace_section(html, '<section class="hero">', HERO, "hero")
    html = replace_section(html, '<section class="capacity-strip" id="kapacita"', CAPACITY, "capacity")
    html = replace_section(html, '<section class="section" id="studijni-cile">', OFFER, "goals")
    html = replace_section(html, '<section class="testimonials section" id="reference">', REFERENCE, "testimonials")
    html = replace_section(html, '<section class="pricing section" id="cenik">', PRICING, "pricing")
    html = replace_section(html, '<section class="contact section" id="kontakt">', CONTACT, "contact")

    for marker, label in (
        ('<section class="materials-block" id="materialy">', "legacy materials"),
        ('<section class="student-zone-section" id="studentska-zona">', "legacy student zone"),
        ('<section class="school-promo-section" id="diagnostika">', "legacy diagnostics"),
        ('<section class="school-promo-section" id="skupinove-lekce">', "legacy group promo"),
        ('<section class="school-promo-section" id="pro-skoly">', "schools promo"),
        ('<section class="about section" id="o-mne">', "about"),
        ('<section class="faq section" id="faq">', "faq"),
    ):
        if marker in html:
            html = remove_section(html, marker, label)

    if "</head>" not in html:
        raise RuntimeError("Homepage has no closing head tag")
    html = html.replace("</head>", CSS + "\\n</head>", 1)

    required = (
        MARKER,
        'id="weeklyCalendar"',
        'id="jak-to-funguje"',
        'id="studentska-zona"',
        'id="reference"',
        'id="cenik"',
        'id="kontakt"',
        "/diagnostika/",
        "/materialy-zdarma/",
        "/skupinove-doucovani-matematiky/",
        "/priprava-na-prijimacky-z-matematiky/",
        "/doucovani-vs-matematiky/",
        "student-portal/",
    )
    for token in required:
        if token not in html:
            raise RuntimeError(f"Blue spacious homepage is missing required token: {token}")

    forbidden = ('id="materialy"', 'id="pro-skoly"', 'id="faq"', 'id="o-mne"', 'home-diagnostic-section', 'compact-homepage-v1')
    for token in forbidden:
        if token in html:
            raise RuntimeError(f"Legacy homepage block still remains: {token}")

    INDEX.write_text(html, encoding="utf-8")
    print("Built blue spacious homepage")


if __name__ == "__main__":
    main()
