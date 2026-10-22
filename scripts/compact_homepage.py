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
.blue-ecosystem{position:relative;overflow:hidden;padding:6.4rem 0;background:
  radial-gradient(circle at 82% 18%,rgba(96,165,250,.22),transparent 30%),
  radial-gradient(circle at 14% 78%,rgba(37,99,235,.18),transparent 34%),
  linear-gradient(135deg,#0b1f34 0%,#123d70 54%,#1d4ed8 120%)}
.blue-ecosystem::after{position:absolute;right:-150px;bottom:-240px;width:560px;height:560px;border:1px solid rgba(255,255,255,.1);border-radius:50%;content:"";box-shadow:0 0 0 78px rgba(255,255,255,.02),0 0 0 155px rgba(255,255,255,.015);pointer-events:none}
.blue-ecosystem>.blue-shell{position:relative;z-index:1}
.blue-bento{display:grid;grid-template-columns:1.35fr .65fr;grid-template-rows:1fr 1fr;gap:1rem;min-height:560px;margin-top:1.6rem}
.blue-zone-card{grid-row:1/3;display:grid;grid-template-rows:auto 1fr;overflow:hidden;padding:1.6rem;border-radius:26px;background:linear-gradient(135deg,#0e2a47 0%,#174f89 62%,#2563eb 140%);color:#fff;box-shadow:0 25px 65px rgba(15,23,42,.16)}
.blue-zone-card .eyebrow{color:#93c5fd}.blue-zone-card h3{margin:.4rem 0 .7rem;color:#fff;font-size:clamp(2rem,3.4vw,3rem);letter-spacing:-.045em}.blue-zone-card>div>p{max-width:660px;color:rgba(255,255,255,.75);line-height:1.7}.blue-zone-card a{display:inline-flex;margin-top:1rem;color:#fff;font-weight:850;text-decoration:none}
.blue-portal-mini{align-self:end;overflow:hidden;margin-top:1.25rem;border:1px solid rgba(255,255,255,.18);border-radius:18px 18px 0 0;background:#f4f7fb;box-shadow:0 22px 50px rgba(0,0,0,.2);color:#243b53}
.blue-portal-top{display:flex;gap:6px;padding:10px 12px;background:#e7edf4;border-bottom:1px solid #d6dee8}.blue-portal-top span{width:8px;height:8px;border-radius:50%;background:#b7c3d0}
.blue-portal-body{display:grid;grid-template-columns:115px 1fr;min-height:235px}.blue-portal-side{padding:14px 10px;background:#102a43}.blue-portal-side strong{color:#fff;font-size:.72rem}.blue-portal-nav{display:grid;gap:6px;margin-top:15px}.blue-portal-nav span{padding:7px;border-radius:7px;color:rgba(255,255,255,.58);font-size:.56rem}.blue-portal-nav span.active{background:rgba(255,255,255,.13);color:#fff}
.blue-portal-main{padding:14px}.blue-portal-banner{display:flex;justify-content:space-between;gap:1rem;padding:14px;border-radius:12px;background:linear-gradient(135deg,#eaf2ff,#fff)}.blue-portal-banner strong{color:#102a43;font-size:.9rem}.blue-portal-banner span{color:#64748b;font-size:.58rem}.blue-progress{width:86px;padding:9px;border-radius:9px;background:#fff}.blue-progress b{display:block;color:#102a43;font-size:.95rem}.blue-progress i{display:block;height:5px;margin-top:5px;border-radius:999px;background:linear-gradient(90deg,#2563eb 68%,#e2e8f0 68%)}
.blue-portal-panels{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:8px}.blue-portal-panel{min-height:72px;padding:9px;border:1px solid #e0e7ef;border-radius:9px;background:#fff}.blue-portal-panel strong{display:block;color:#102a43;font-size:.55rem}.blue-portal-line{height:5px;margin-top:7px;border-radius:999px;background:#e2e8f0}.blue-portal-line.short{width:62%}
.blue-mini-card{display:flex;flex-direction:column;justify-content:space-between;padding:1.4rem;border:1px solid var(--home-line);border-radius:22px;background:#f8fbff;box-shadow:0 12px 30px rgba(15,23,42,.05)}.blue-mini-card i{display:grid;width:44px;height:44px;place-items:center;border-radius:12px;background:#eaf2ff;color:#1d4ed8}.blue-mini-card h3{margin:1rem 0 .45rem;color:var(--navy);font-size:1.25rem;letter-spacing:-.03em}.blue-mini-card p{margin:0;color:#64748b;line-height:1.55;font-size:.88rem}.blue-mini-card a{margin-top:1rem;color:#1d4ed8;font-size:.8rem;font-weight:850;text-decoration:none}
.blue-ecosystem-frame{overflow:visible;padding:0;border-radius:0;background:transparent;box-shadow:none}
.blue-ecosystem-frame .blue-section-head{margin-bottom:1.7rem}
.blue-ecosystem-frame .blue-section-head .eyebrow{color:#93c5fd}
.blue-ecosystem-frame .blue-section-head h2{color:#fff}
.blue-ecosystem-frame .blue-section-head p{color:rgba(255,255,255,.72)}
.blue-ecosystem-frame .blue-bento{margin-top:0;min-height:500px}
.blue-ecosystem-frame .blue-zone-card{border:1px solid rgba(255,255,255,.15);border-radius:20px;background:rgba(255,255,255,.075);box-shadow:none}
.blue-ecosystem-frame .blue-zone-card .eyebrow{color:#93c5fd}
.blue-ecosystem-frame .blue-mini-card{border-color:rgba(255,255,255,.14);background:rgba(255,255,255,.085);box-shadow:none}
.blue-ecosystem-frame .blue-mini-card i{background:rgba(147,197,253,.14);color:#bfdbfe}
.blue-ecosystem-frame .blue-mini-card h3{color:#fff}
.blue-ecosystem-frame .blue-mini-card p{color:rgba(255,255,255,.68)}
.blue-ecosystem-frame .blue-mini-card a{color:#dbeafe}
.blue-capacity-standalone{padding:5.4rem 0 5.8rem;background:#fff}
.blue-capacity-standalone .blue-section-head{margin-bottom:1rem}
.blue-capacity-standalone .blue-section-head h2{color:var(--navy)}
.blue-capacity-standalone .capacity-legend{color:#64748b}
.blue-capacity-standalone .capacity-legend span{color:#64748b}
.blue-capacity-standalone .weekly-calendar-wrap{overflow-x:auto;padding:.15rem 0 .75rem}
.blue-capacity-standalone .weekly-calendar{display:grid;grid-template-columns:repeat(5,minmax(190px,1fr));gap:.75rem;min-width:1020px}
.blue-capacity-standalone .calendar-day{padding:.85rem;border:1px solid #285f98;border-radius:18px;background:linear-gradient(160deg,#102f50 0%,#174d82 58%,#2563a6 135%);box-shadow:0 14px 30px rgba(15,42,67,.13)}
.blue-capacity-standalone .calendar-day-head{display:flex;justify-content:space-between;gap:.7rem;align-items:flex-start;margin-bottom:1rem;padding-bottom:.82rem;border-bottom:1px solid rgba(255,255,255,.18)}
.blue-capacity-standalone .calendar-day-title{display:grid;gap:.08rem}
.blue-capacity-standalone .calendar-day-abbr{color:#fff;font-size:1.2rem;font-weight:950;letter-spacing:.03em;line-height:1}
.blue-capacity-standalone .calendar-day-name{color:#cfe3f7;font-size:.69rem}
.blue-capacity-standalone .calendar-day-count{color:#b9d6f0;font-size:.66rem;font-weight:800;white-space:nowrap}
.blue-capacity-standalone .calendar-week-label{margin:.3rem 0 0;color:#64748b;font-size:.84rem;font-weight:750}
.blue-capacity-standalone .calendar-week-summary{margin:.28rem 0 0;color:#102a43;font-size:.9rem;font-weight:800}
.blue-capacity-standalone .calendar-live-status[data-state="live"]{color:#15803d}
.blue-capacity-standalone .calendar-live-status[data-state="fallback"]{color:#b45309}
.blue-capacity-standalone .calendar-time-track{position:relative;height:540px;margin-left:2.3rem;border-radius:12px;background:repeating-linear-gradient(to bottom,rgba(255,255,255,.12) 0,rgba(255,255,255,.12) 1px,transparent 1px,transparent 12.5%)}
.blue-capacity-standalone .calendar-hour{position:absolute;left:-2.3rem;width:1.9rem;transform:translateY(-50%);color:#b9d6f0;font-size:.58rem;text-align:right}
.blue-capacity-standalone .calendar-event{position:absolute;right:.2rem;left:.15rem;z-index:2;overflow:hidden;min-height:36px;padding:.42rem .48rem;border:1px solid #d6e6f5;border-radius:9px;background:#f8fbff;box-shadow:0 6px 14px rgba(5,24,43,.16)}
.blue-capacity-standalone .calendar-event.join{border-left:4px solid #3b82f6}
.blue-capacity-standalone .calendar-event.full{border-left:4px solid #94a3b8;background:#edf2f7}
.blue-capacity-standalone .calendar-event-time{display:block;color:#475569;font-size:.61rem;font-weight:850}
.blue-capacity-standalone .calendar-event strong{display:block;overflow:hidden;margin-top:.1rem;color:#102a43;font-size:.72rem;line-height:1.2;text-overflow:ellipsis;white-space:nowrap}
.blue-capacity-standalone .calendar-event small{display:block;margin-top:.08rem;color:#64748b;font-size:.57rem}
.booking-panel{display:grid;grid-template-columns:minmax(230px,.7fr) minmax(0,1.3fr);gap:1.2rem;margin-top:1.4rem;padding:1.25rem;border:1px solid #dbe7f2;border-radius:20px;background:#f8fbff}
.booking-panel-copy h3{margin:.3rem 0 .55rem;color:#102a43;font-size:1.35rem}.booking-panel-copy p{margin:0;color:#64748b;line-height:1.55}.booking-security{display:flex;gap:.45rem;align-items:center;margin-top:1rem;color:#39725f;font-size:.72rem;font-weight:800}
.booking-type-grid{display:grid;grid-template-columns:1fr 1fr;gap:.65rem}.booking-type{position:relative}.booking-type input{position:absolute;opacity:0;pointer-events:none}.booking-type span{display:block;height:100%;padding:.85rem;border:1px solid #cbd5e1;border-radius:12px;background:#fff;cursor:pointer}.booking-type strong{display:block;color:#102a43;font-size:.84rem}.booking-type small{display:block;margin-top:.25rem;color:#64748b;font-size:.68rem;line-height:1.35}.booking-type input:checked+span{border-color:#2563eb;background:#eff6ff;box-shadow:0 0 0 2px rgba(37,99,235,.12)}
.booking-form-fields{display:grid;grid-template-columns:1fr 1fr;gap:.65rem;margin-top:.7rem}.booking-form-fields label{display:grid;gap:.28rem;color:#334155;font-size:.7rem;font-weight:800}.booking-form-fields .full{grid-column:1/-1}.booking-form-fields input,.booking-form-fields select,.booking-form-fields textarea{width:100%;padding:.72rem;border:1px solid #cbd5e1;border-radius:9px;background:#fff;color:#102a43;font:inherit;font-size:.82rem}.booking-form-fields textarea{min-height:76px;resize:vertical}.booking-consent{display:flex!important;grid-column:1/-1!important;grid-template-columns:auto 1fr!important;gap:.55rem!important;align-items:flex-start;font-weight:500!important;line-height:1.4}.booking-consent input{width:auto;margin-top:.18rem}.booking-submit{grid-column:1/-1;padding:.78rem 1rem;border:0;border-radius:9px;background:#102a43;color:#fff;font:inherit;font-size:.82rem;font-weight:850;cursor:pointer}.booking-submit:disabled{opacity:.6;cursor:wait}.booking-form .form-status{grid-column:1/-1;margin:0;font-size:.78rem;line-height:1.5}.booking-form .form-status.success{color:#166534}.booking-form .form-status.error{color:#b91c1c}.booking-honeypot{position:absolute!important;left:-9999px!important}
.blue-reference{padding:5rem 0;background:#fff}
.blue-review-head{display:flex;justify-content:space-between;gap:2rem;align-items:end;margin-bottom:1.5rem}
.blue-review-head h2{margin:0;color:var(--navy);font-size:clamp(2rem,4vw,3.1rem);letter-spacing:-.05em}
.blue-review-head p{max-width:540px;margin:.65rem 0 0;color:#64748b;line-height:1.6}
.blue-review-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem}
.blue-review-card{display:flex;min-height:285px;flex-direction:column;padding:1.45rem;border:1px solid var(--home-line);border-radius:20px;background:linear-gradient(150deg,#f8fbff,#fff);box-shadow:0 14px 34px rgba(15,23,42,.05)}
.blue-review-top{display:flex;justify-content:space-between;gap:.8rem;align-items:center}
.blue-review-stars{color:#f59e0b;font-size:.82rem;letter-spacing:.08em}
.blue-review-source{display:inline-flex;align-items:center;padding:.3rem .52rem;border-radius:999px;background:#eaf2ff;color:#1d4ed8;font-size:.65rem;font-weight:850;letter-spacing:.03em}
.blue-review-card blockquote{margin:1.25rem 0 1.4rem;color:#334155;font-size:.98rem;line-height:1.7}
.blue-review-person{margin-top:auto}.blue-review-person strong{display:block;color:var(--navy)}.blue-review-person span{display:block;margin-top:.2rem;color:#64748b;font-size:.72rem}
.blue-review-person a{display:inline-flex;margin-top:.65rem;color:#2563eb;font-size:.72rem;font-weight:800;text-decoration:none}
.blue-pricing{padding:5.5rem 0;background:linear-gradient(180deg,#f4f8fd,#eef5ff)}.blue-price-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-top:1.5rem}.blue-price-card{min-height:250px;padding:1.4rem;border:1px solid #d5e3f2;border-radius:20px;background:#fff;box-shadow:0 14px 32px rgba(15,23,42,.05)}.blue-price-card.featured{border-color:#93c5fd;background:linear-gradient(145deg,#0f3358,#1d4ed8);color:#fff;box-shadow:0 20px 46px rgba(29,78,216,.2)}.blue-price-card small{color:#64748b;font-size:.7rem;font-weight:850;letter-spacing:.06em;text-transform:uppercase}.blue-price-card.featured small{color:#bfdbfe}.blue-price-card strong{display:block;margin:2.4rem 0 .3rem;color:var(--navy);font-size:2rem;letter-spacing:-.045em}.blue-price-card.featured strong{color:#fff}.blue-price-card p{margin:0;color:#64748b;line-height:1.55}.blue-price-card.featured p{color:rgba(255,255,255,.73)}.blue-price-card a{display:inline-flex;margin-top:1.2rem;color:#1d4ed8;font-size:.82rem;font-weight:850;text-decoration:none}.blue-price-card.featured a{color:#fff}
.blue-contact{padding:6rem 0;background:#fff}.blue-contact-grid{display:grid;grid-template-columns:minmax(300px,.78fr) minmax(0,1.22fr);gap:1rem}.blue-contact-copy{min-height:100%;padding:2rem;border-radius:24px;background:linear-gradient(145deg,#0d2947,#174f89);color:#fff}.blue-contact-copy .eyebrow{color:#93c5fd}.blue-contact-copy h2{margin:.45rem 0 .8rem;color:#fff;font-size:clamp(2.2rem,4vw,3.4rem);letter-spacing:-.05em;line-height:1.08}.blue-contact-copy>p{color:rgba(255,255,255,.72);line-height:1.7}.blue-contact-details{display:grid;gap:.8rem;margin-top:2rem}.blue-contact-detail{display:flex;gap:.75rem;align-items:flex-start;padding:.85rem;border:1px solid rgba(255,255,255,.11);border-radius:12px;background:rgba(255,255,255,.055);color:rgba(255,255,255,.72);font-size:.82rem}.blue-contact-detail i{margin-top:.18rem;color:#93c5fd}.blue-contact-detail strong{display:block;color:#fff}.blue-contact-detail a{color:#dbeafe;text-decoration:none}.blue-contact-detail strong a{color:#fff;text-decoration:underline;text-underline-offset:3px}
.blue-form{display:grid;grid-template-columns:1fr 1fr;gap:.8rem;padding:2rem;border:1px solid var(--home-line);border-radius:24px;background:#fff;box-shadow:0 22px 55px rgba(15,23,42,.07)}.blue-form .form-group{margin:0}.blue-form .form-group.full,.blue-form .consent,.blue-form .submit-button,.blue-form .form-status{grid-column:1/-1}.blue-form label{font-size:.8rem}.blue-form input,.blue-form select,.blue-form textarea{min-height:46px}.blue-form textarea{min-height:105px}.blue-form .submit-button{min-height:50px}
@media(max-width:980px){.blue-hero-grid,.blue-contact-grid{grid-template-columns:1fr}.blue-hero-panel{max-width:720px}.blue-section-head{align-items:flex-start;flex-direction:column}.blue-bento{grid-template-columns:1fr;grid-template-rows:auto}.blue-zone-card{grid-row:auto;min-height:530px}.blue-goal-grid,.blue-price-grid{grid-template-columns:1fr 1fr}.blue-review-grid{grid-template-columns:1fr 1fr}.blue-capacity-grid{grid-template-columns:repeat(3,minmax(220px,1fr));overflow-x:auto;padding-bottom:.4rem}.booking-panel{grid-template-columns:1fr}}
@media(max-width:680px){.blue-shell{width:min(100% - 2rem,1180px)}.blue-home-hero{padding:7rem 0 4.5rem}.blue-home-hero h1{font-size:clamp(2.7rem,13vw,4.1rem)}.blue-panel-stats,.blue-goal-grid,.blue-price-grid,.blue-review-grid,.blue-form{grid-template-columns:1fr}.blue-review-head{align-items:flex-start;flex-direction:column}.blue-review-card{min-height:0}.blue-capacity-grid{grid-template-columns:repeat(3,245px)}.blue-capacity{padding:3.7rem 0}.blue-goals,.blue-ecosystem,.blue-pricing,.blue-contact{padding:4rem 0}.blue-goal-card{min-height:500px}.blue-bento{min-height:0}.blue-zone-card{min-height:0}.blue-portal-body{grid-template-columns:90px 1fr}.blue-portal-panels{grid-template-columns:1fr 1fr}.blue-portal-panel:last-child{display:none}.blue-form .form-group.full,.blue-form .consent,.blue-form .submit-button,.blue-form .form-status{grid-column:1}}
@media(max-width:680px){
  .blue-ecosystem-frame{padding:0;border-radius:0}
  .blue-capacity-standalone{padding:4rem 0}
  .blue-capacity-standalone .weekly-calendar-wrap{margin-right:-1rem;padding:0 1rem .55rem 0}
  .blue-capacity-standalone .weekly-calendar{grid-template-columns:repeat(5,190px);gap:.65rem;min-width:max-content}
  .blue-capacity-standalone .calendar-time-track{height:480px}
  .booking-type-grid,.booking-form-fields{grid-template-columns:1fr}
  .booking-form-fields .full{grid-column:1}
}

.blue-about{padding:5rem 0;background:#fff;border-block:1px solid var(--home-line)}
.blue-about-grid{display:grid;grid-template-columns:minmax(220px,.68fr) minmax(0,1.32fr);align-items:center;gap:clamp(1.5rem,5vw,5rem)}
.blue-about-image{overflow:hidden;border-radius:24px;background:#eaf1f8;box-shadow:0 18px 45px rgba(16,42,67,.1)}
.blue-about-image img{width:100%;max-height:400px;aspect-ratio:4/3;object-fit:cover;object-position:center 30%;display:block}
.blue-about-image>span{display:block;padding:.95rem;font-size:.7rem;letter-spacing:.09em;font-weight:800;text-align:center;color:#254a70}
.blue-about-content h2{margin:.4rem 0 1rem;color:#102a43;font-size:clamp(2rem,4vw,3.3rem);line-height:1.1}
.blue-about-intro{font-size:1.05rem;max-width:690px;color:#475569;line-height:1.8}
.blue-about-proofs{display:grid;gap:.65rem;margin:1.2rem 0}
.blue-about-proofs span{color:#24415d;font-weight:650}.blue-about-proofs i{color:#1d4ed8;margin-right:.5rem}
.blue-about-location{max-width:690px;color:#64748b;font-size:.91rem}
.blue-about-link{display:inline-flex;align-items:center;gap:.6rem;font-weight:800;color:#1d4ed8;margin-top:.6rem}
.blue-demo-watermark{display:block;padding:.45rem 1rem;font-size:.67rem;letter-spacing:.1em;font-weight:800;text-align:center;color:#345980;background:#e7f0ff}
.blue-contact .consent a,.booking-form .booking-consent a{color:#1d4ed8;text-decoration:underline;text-underline-offset:3px}
.blue-form .consent{font-size:.79rem;color:#4e647b;line-height:1.6}
@media(max-width:760px){.blue-about-grid{grid-template-columns:1fr}.blue-about-image img{max-height:280px}.blue-about{padding:3.3rem 0}}

/* P2: jasná konverzní cesta – rozvrh a rezervační formulář zůstávají oddělené */
.capacity-explainer{max-width:680px;margin:.65rem 0 1rem;font-size:.86rem;line-height:1.55;color:#52677d}
.booking-jump{display:inline-flex;align-items:center;gap:.65rem;margin-top:.45rem;padding:.72rem 1rem;border-radius:11px;background:#1d4ed8;color:#fff!important;font-size:.82rem;font-weight:800;text-decoration:none;box-shadow:0 8px 20px rgba(29,78,216,.16)}
.booking-jump:hover,.booking-jump:focus-visible{background:#1642b5;outline-offset:3px}
.booking-jump span{margin-left:.3rem}
.calendar-swipe-hint{display:none}
#rezervace-terminu{scroll-margin-top:105px}
.booking-step-heading{display:flex;align-items:center;gap:.55rem;margin:0 0 .65rem;color:#213d62;font-size:.79rem;font-weight:850}
.booking-step-heading>span{display:inline-grid;place-items:center;flex:0 0 auto;width:28px;height:28px;border-radius:50%;background:#dbeafe;color:#1d4ed8;font-size:.71rem;font-weight:850}
.booking-form-section{grid-column:1/-1;margin:.65rem 0 .2rem}
.booking-form .booking-form-fields label.full .booking-step-heading{margin:0 0 .3rem;font-size:.79rem}
.booking-terms{grid-column:1/-1;margin:.35rem 0 0;color:#52677d;font-size:.73rem;line-height:1.6}
.booking-terms a{color:#1d4ed8;font-weight:750;text-decoration:underline;text-underline-offset:3px}
.blue-capacity-standalone .weekly-calendar-wrap:focus-visible{outline:3px solid #2563eb;outline-offset:3px}
@media(max-width:1080px){.calendar-swipe-hint{display:block;margin:.55rem 0 .25rem;font-size:.76rem;color:#52677d}}


/* Unified calendar/booking: accessible selectable free windows and compact inline contact form */
.blue-capacity-standalone{padding:4rem 0 4.4rem;background:linear-gradient(180deg,#fff,#f7faff)}
.blue-capacity-standalone .capacity-compact-heading{display:flex;justify-content:space-between;align-items:center;gap:1rem;margin-bottom:1.2rem}
.blue-capacity-standalone .capacity-compact-heading h2{font-size:clamp(1.8rem,3.5vw,2.7rem);line-height:1.12}
.blue-capacity-standalone .capacity-explainer{max-width:700px;margin:.55rem 0 0}
.blue-capacity-standalone .capacity-compact-heading .booking-security{margin:0;white-space:nowrap}
.calendar-booking-toolbar{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.9rem;padding:.85rem 1rem;margin-bottom:.8rem;background:#fff;border:1px solid #dae6f1;border-radius:15px}
.calendar-booking-type{display:flex;flex-wrap:wrap;gap:.4rem}
.booking-chip{position:relative;cursor:pointer}.booking-chip input{position:absolute;opacity:0;inset:0;cursor:pointer}
.booking-chip span{display:block;padding:.63rem .9rem;border-radius:10px;border:1px solid #d0e0ed;background:#f8fbff;color:#345573;font-size:.8rem;font-weight:850}
.booking-chip input:checked+span{color:#fff;background:#16456e;border-color:#16456e}
.booking-chip input:focus-visible+span{outline:3px solid #60a5fa;outline-offset:3px}
.calendar-booking-meta{display:flex;flex-direction:column;gap:.12rem;text-align:right}
.blue-capacity-standalone .calendar-booking-meta .calendar-week-label{margin:0;color:#153b63}
.blue-capacity-standalone .calendar-booking-meta .calendar-week-summary{margin:0;font-size:.75rem;color:#66809b;font-weight:650}
.calendar-legend-free{background:#1aa46b!important}
.blue-capacity-standalone .weekly-calendar{grid-template-columns:repeat(5,minmax(175px,1fr));min-width:930px;gap:.65rem}
.blue-capacity-standalone .calendar-day{padding:.75rem;border:1px solid #d8e6f1;background:#edf5fd;border-radius:15px;box-shadow:0 9px 20px rgba(15,42,67,.055)}
.blue-capacity-standalone .calendar-day-head{margin-bottom:.6rem;padding-bottom:.6rem;border-color:#d4e4f2}
.blue-capacity-standalone .calendar-day-abbr{color:#163f67;font-size:1rem}
.blue-capacity-standalone .calendar-day-name,.blue-capacity-standalone .calendar-day-count{color:#5b7894}
.blue-capacity-standalone .calendar-time-track{height:430px;margin-left:2.1rem;background:repeating-linear-gradient(to bottom,#d7e6f2 0,#d7e6f2 1px,transparent 1px,transparent 13.3333%)}
.blue-capacity-standalone .calendar-hour{left:-2.1rem;width:1.9rem;color:#738ca6}
.blue-capacity-standalone .calendar-event{padding:.24rem .4rem;min-height:0;border-radius:7px;box-shadow:0 3px 8px rgba(15,42,67,.06)}
.blue-capacity-standalone .calendar-event.join{background:#fff;border-color:#cddfec;border-left:3px solid #4e87bf}
.blue-capacity-standalone .calendar-event.full{background:#f8fafc;border-color:#dce6ef;border-left:3px solid #94a3b8}
.blue-capacity-standalone .calendar-event strong{font-size:.66rem}
.blue-capacity-standalone .calendar-event small{font-size:.54rem}
.blue-capacity-standalone .calendar-window{position:absolute;z-index:4;left:.12rem;right:.12rem;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:.08rem;padding:.24rem .4rem;min-height:0;overflow:hidden;text-align:left;border:1px solid #62cca1;border-left:3px solid #179266;border-radius:7px;background:#dff9ed;color:#125f47;box-shadow:0 3px 9px rgba(21,148,104,.07);cursor:pointer}
.blue-capacity-standalone .calendar-window:hover,.blue-capacity-standalone .calendar-window:focus-visible{background:#c1f2dc;border-color:#0f8658;z-index:5;outline:2px solid #15946b;outline-offset:1px}
.blue-capacity-standalone .calendar-window.is-selected{background:#aaf0cd;outline:2px solid #0a8154}
.calendar-window-time{font-size:.65rem;font-weight:900;line-height:1.15}
.calendar-window-label{font-size:.63rem;font-weight:750;line-height:1.15}
.calendar-action-status{margin:.4rem 0 0;color:#9a3412;font-size:.78rem;font-weight:750}
.booking-panel.booking-inline{display:block;max-width:900px;margin:1rem auto 0;padding:1.2rem 1.3rem;border:1px solid #b9dbce;border-radius:17px;background:#fff;box-shadow:0 14px 32px rgba(15,42,67,.07);scroll-margin-top:90px}
.booking-panel.booking-inline[hidden]{display:none!important}
.booking-inline-head{display:flex;justify-content:space-between;gap:1rem;align-items:flex-start;padding-bottom:.8rem;border-bottom:1px solid #e4edf4}
.booking-inline-head .eyebrow{margin:0;color:#17815c}.booking-inline-head h3{margin:.15rem 0 .25rem;font-size:1.16rem;color:#153957}.booking-inline-head p{margin:0;color:#617b94;font-size:.77rem}
.booking-dismiss{display:inline-flex;align-items:center;gap:.35rem;padding:.5rem .7rem;border:1px solid #d9e5f0;border-radius:9px;background:#fff;color:#516f87;font:inherit;font-size:.75rem;font-weight:750;cursor:pointer}
.booking-dismiss:hover{background:#f0f6fc}
.booking-inline .booking-form-fields{grid-template-columns:repeat(4,minmax(0,1fr));gap:.65rem;margin-top:1rem}
.booking-inline .booking-form-fields .booking-time-field{grid-column:1/-1;max-width:480px}
.booking-inline .booking-form-fields input,.booking-inline .booking-form-fields select{min-height:42px}
.booking-inline .booking-extra{border:1px solid #e0eaf2;border-radius:9px}
.booking-inline .booking-extra summary{padding:.6rem .8rem;display:flex;justify-content:space-between;color:#58728b;font-size:.76rem;font-weight:800;cursor:pointer;list-style:none}
.booking-inline .booking-extra summary::-webkit-details-marker{display:none}
.booking-inline .booking-extra[open] summary i{transform:rotate(180deg)}
.booking-inline .booking-extra label{padding:0 .8rem .8rem}
.booking-inline .booking-extra textarea{min-height:65px}
.booking-inline .booking-terms{grid-column:1/4;margin:.4rem 0 0;font-size:.72rem;font-weight:500}
.booking-inline .booking-submit{grid-column:4;align-self:center;white-space:nowrap}
.booking-inline .form-status{margin:.65rem 0 0;font-size:.79rem}
.booking-inline .form-status:empty{display:none}
.booking-inline.is-complete .booking-form-fields{display:none}
@media(max-width:980px){.blue-capacity-standalone .capacity-compact-heading{align-items:flex-start;flex-direction:column}.blue-capacity-standalone .capacity-compact-heading .booking-security{white-space:normal}}
@media(max-width:760px){.blue-capacity-standalone{padding:3rem 0}.calendar-booking-meta{text-align:left}.blue-capacity-standalone .weekly-calendar{grid-template-columns:repeat(5,175px);min-width:max-content}.blue-capacity-standalone .calendar-time-track{height:430px}.booking-inline .booking-form-fields{grid-template-columns:repeat(2,minmax(0,1fr))}.booking-inline .booking-terms,.booking-inline .booking-submit{grid-column:1/-1}.booking-inline .booking-submit{width:100%}.booking-panel.booking-inline{padding:1rem}}
@media(max-width:480px){.booking-inline .booking-form-fields{grid-template-columns:1fr}.booking-inline .booking-form-fields .booking-time-field{grid-column:1}.booking-chip span{font-size:.73rem;padding:.55rem .65rem}}

/* 2026-10: compact intro and tutor bio; eliminate redundant full-width sections */
.blue-home-hero{padding:6.65rem 0 3.35rem;background:radial-gradient(circle at 77% 18%,rgba(96,165,250,.22),transparent 29%),linear-gradient(118deg,#0b233d 0%,#164574 66%,#215b9b 130%)}
.blue-home-hero::after{width:300px;height:300px;right:-100px;bottom:-170px;box-shadow:0 0 0 52px rgba(255,255,255,.02)}
.blue-hero-grid{grid-template-columns:minmax(0,1.17fr) minmax(340px,.83fr);gap:clamp(1.3rem,3.8vw,3.2rem);align-items:center}
.blue-home-hero h1{font-size:clamp(2.2rem,3.8vw,3.8rem);line-height:1.07;margin:.9rem 0 0;letter-spacing:-.055em;max-width:670px}
.blue-home-hero .blue-kicker{font-size:.64rem;letter-spacing:.035em}
.blue-hero-copy{font-size:clamp(.91rem,1.35vw,1.02rem);line-height:1.65;margin:.85rem 0 0;max-width:600px}
.blue-actions{margin-top:1.15rem;gap:.55rem}
.blue-primary,.blue-secondary{min-height:2.85rem;padding:.72rem 1rem;font-size:.83rem}
.blue-meta{margin-top:.98rem;gap:.75rem;font-size:.71rem}
.blue-hero-bio{display:grid;grid-template-columns:minmax(118px,.45fr) minmax(0,1fr);align-items:stretch;gap:0;min-height:245px;border:1px solid rgba(255,255,255,.23);border-radius:19px;background:#fff;overflow:hidden;box-shadow:0 16px 42px rgba(0,16,34,.16)}
.blue-hero-portrait{min-height:245px;background:#e9f1f7}
.blue-hero-portrait img{display:block;width:100%;height:100%;min-height:245px;object-fit:cover;object-position:center 26%}
.blue-hero-bio-body{display:flex;flex-direction:column;align-items:flex-start;padding:1.2rem 1.15rem;color:#2c4964}
.blue-hero-bio-eyebrow{margin:0 0 .4rem;color:#24609a;font-size:.63rem;font-weight:850;text-transform:uppercase;letter-spacing:.09em}
.blue-hero-bio h2{margin:0;color:#112f4c;font-size:clamp(1rem,1.6vw,1.22rem);letter-spacing:-.035em;line-height:1.23}
.blue-hero-bio-body>p:not(.blue-hero-bio-eyebrow){margin:.65rem 0 0;color:#526c83;font-size:.76rem;line-height:1.57}
.blue-hero-bio-facts{display:flex;flex-wrap:wrap;gap:.35rem;margin-top:.8rem}
.blue-hero-bio-facts span{display:inline-flex;align-items:center;gap:.28rem;padding:.34rem .45rem;border-radius:7px;background:#edf5ff;color:#235480;font-size:.61rem;font-weight:800}
.blue-hero-bio-mail{display:inline-flex;align-items:center;gap:.35rem;margin-top:auto;padding-top:.75rem;color:#14549b;font-size:.71rem;font-weight:850;text-decoration:none}
.blue-hero-bio-mail:hover{text-decoration:underline;text-underline-offset:3px}
.blue-capacity-standalone .capacity-explainer{max-width:800px}
.blue-capacity-standalone .calendar-legend-free{display:none}
.blue-capacity-standalone .booking-panel{margin-top:1.15rem;border:1px solid #d9e7f2;background:#f8fbff;box-shadow:none}
.blue-capacity-standalone .booking-panel-copy p{font-size:.82rem;line-height:1.62}
.blue-capacity-standalone .booking-panel-copy h3{font-size:1.27rem;margin:.4rem 0 .55rem}
.blue-capacity-standalone .booking-panel .booking-form-fields{grid-template-columns:1fr 1fr;margin-top:.75rem}
.blue-capacity-standalone .booking-panel .booking-type-grid{grid-template-columns:1fr 1fr}
.blue-capacity-standalone .booking-panel .booking-terms{grid-column:1/-1}
.blue-capacity-standalone .booking-panel .booking-submit{grid-column:1/-1}
.blue-capacity-standalone .booking-panel .form-status{grid-column:1/-1}
@media(max-width:980px){.blue-hero-grid{grid-template-columns:minmax(0,1fr) minmax(300px,.85fr);gap:1.4rem}.blue-hero-bio{grid-template-columns:120px minmax(0,1fr)}.blue-hero-portrait,.blue-hero-portrait img{min-height:265px}.blue-hero-bio-body{padding:1rem}}
@media(max-width:760px){.blue-home-hero{padding:5.65rem 0 2.4rem}.blue-hero-grid{grid-template-columns:1fr;gap:1.25rem}.blue-home-hero h1{font-size:clamp(2.25rem,7.7vw,3.25rem)}.blue-hero-bio{grid-template-columns:125px minmax(0,1fr);min-height:0}.blue-hero-portrait,.blue-hero-portrait img{min-height:220px}.blue-hero-bio-body{padding:.95rem}.blue-capacity-standalone .booking-panel{grid-template-columns:1fr}}
@media(max-width:500px){.blue-home-hero{padding:5.2rem 0 2.2rem}.blue-hero-bio{grid-template-columns:105px minmax(0,1fr)}.blue-hero-portrait,.blue-hero-portrait img{min-height:230px}.blue-hero-bio-facts span{font-size:.57rem}.blue-home-hero .blue-kicker{font-size:.57rem}.blue-meta{gap:.56rem}.blue-capacity-standalone .booking-panel .booking-form-fields{grid-template-columns:1fr}.blue-capacity-standalone .booking-panel .booking-type-grid{grid-template-columns:1fr}}

/* Open editorial 50:50 composition. Both halves live on the same surface. */
.blue-home-hero{padding:6.4rem 0 3.1rem;background:radial-gradient(circle at 90% 6%,rgba(96,165,250,.16),transparent 36%),linear-gradient(112deg,#0b223c 0%,#133d69 68%,#164c82 100%)}
.blue-home-hero::after{display:none}
.blue-hero-grid{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:0;align-items:center}
.blue-hero-intro{min-width:0;padding-right:clamp(1.4rem,3.5vw,3rem)}
.blue-hero-overline{margin:0 0 .65rem;color:#b3d6ff;font-size:.7rem;font-weight:850;letter-spacing:.13em;text-transform:uppercase}
.blue-home-hero .blue-kicker{display:inline-flex;max-width:100%;padding:.35rem .65rem;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.055);font-size:.62rem;letter-spacing:.02em}
.blue-home-hero h1{max-width:590px;margin:.84rem 0 0;font-size:clamp(2.2rem,3.5vw,3.65rem);line-height:1.06;letter-spacing:-.052em}
.blue-hero-copy{margin:.95rem 0 0;max-width:540px;font-size:.98rem;line-height:1.67}
.blue-actions{margin-top:1.25rem}
.blue-meta{margin-top:1.1rem;font-size:.74rem}
.blue-hero-bio{display:grid;grid-template-columns:minmax(0,1fr) minmax(135px,37%);align-items:center;gap:clamp(.85rem,2.1vw,1.65rem);min-width:0;min-height:0;padding:0 0 0 clamp(1.3rem,3.3vw,2.85rem);border:0;border-left:1px solid rgba(255,255,255,.21);border-radius:0;background:none;box-shadow:none;overflow:visible;backdrop-filter:none}
.blue-hero-bio-body{display:flex;flex-direction:column;align-items:flex-start;min-width:0;padding:0;color:#fff;order:1}
.blue-hero-bio-eyebrow{margin:0 0 .6rem;color:#b3d6ff;font-size:.7rem;letter-spacing:.13em}
.blue-hero-bio h2{margin:0;color:#fff;font-size:clamp(1.34rem,2.1vw,1.85rem);line-height:1.16;letter-spacing:-.045em}
.blue-hero-bio-body>p:not(.blue-hero-bio-eyebrow){margin:.95rem 0 0;color:rgba(255,255,255,.8);font-size:.87rem;line-height:1.65}
.blue-hero-bio-facts{display:grid;gap:.46rem;margin-top:1rem}
.blue-hero-bio-facts span{display:flex;align-items:center;gap:.47rem;padding:0;border-radius:0;background:none;color:#d5e7fb;font-size:.73rem;font-weight:650}
.blue-hero-bio-facts i{width:15px;color:#91c9ff}
.blue-hero-bio-mail{margin-top:1.1rem;padding:0;color:#fff;font-size:.77rem;text-decoration:underline;text-underline-offset:4px}
.blue-hero-portrait{order:2;align-self:stretch;display:flex;align-items:center;min-height:0;background:none;overflow:visible}
.blue-hero-portrait img{display:block;width:100%;height:auto;min-height:0;max-height:300px;aspect-ratio:3/4;object-fit:cover;object-position:center 24%;border-radius:12px;box-shadow:0 10px 32px rgba(0,0,0,.16)}
@media(max-width:1100px){.blue-hero-grid{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.blue-hero-intro{padding-right:1.3rem}.blue-hero-bio{padding-left:1.35rem;gap:.9rem;grid-template-columns:minmax(0,1fr) minmax(116px,33%)}.blue-hero-bio h2{font-size:1.4rem}.blue-hero-bio-body>p:not(.blue-hero-bio-eyebrow){font-size:.79rem}.blue-hero-portrait img{max-height:275px}}
@media(max-width:760px){.blue-home-hero{padding:5.5rem 0 2.65rem}.blue-hero-grid{grid-template-columns:1fr;gap:1.6rem}.blue-hero-intro{padding-right:0}.blue-home-hero h1{font-size:clamp(2.2rem,7.5vw,3.2rem);max-width:600px}.blue-hero-bio{padding:1.45rem 0 0;border:0;border-top:1px solid rgba(255,255,255,.22);gap:1.2rem;grid-template-columns:minmax(0,1fr) minmax(140px,28%)}.blue-hero-bio h2{font-size:clamp(1.45rem,4.2vw,1.9rem)}.blue-hero-bio-body>p:not(.blue-hero-bio-eyebrow){font-size:.85rem}.blue-hero-portrait img{max-height:240px}}
@media(max-width:470px){.blue-home-hero{padding:5.2rem 0 2.2rem}.blue-hero-bio{grid-template-columns:minmax(0,1fr) 106px;gap:.75rem}.blue-hero-bio h2{font-size:1.25rem}.blue-hero-bio-body>p:not(.blue-hero-bio-eyebrow){font-size:.77rem;line-height:1.54;margin-top:.6rem}.blue-hero-bio-facts{gap:.35rem;margin-top:.75rem}.blue-hero-bio-facts span{font-size:.63rem}.blue-hero-portrait img{max-height:198px}.blue-hero-bio-mail{margin-top:.7rem}.blue-meta{gap:.65rem}}
</style>'''

HERO = r'''<section class="blue-home-hero">
  <div class="blue-shell blue-hero-grid">
    <div class="blue-hero-intro" aria-labelledby="introTitle">
      <p class="blue-hero-overline">Co nabízím</p>
      <span class="blue-kicker"><i class="fas fa-circle-check" aria-hidden="true"></i> Matematika a fyzika · ZŠ / SŠ / VŠ</span>
      <h1 id="introTitle">Doučování, které má mezi hodinami pokračování.</h1>
      <p class="blue-hero-copy">Od rychlé pomoci před testem po dlouhodobou přípravu na přijímačky, maturitu nebo VŠ. Cílem není jen projít látku, ale vědět, co má student dělat dál.</p>
      <div class="blue-actions">
        <a class="blue-primary" href="#rezervace-terminu">Rezervovat 30 minut zdarma <i class="fas fa-arrow-right" aria-hidden="true"></i></a>
        <a class="blue-secondary" href="#jak-to-funguje">Jak výuka funguje</a>
      </div>
      <div class="blue-meta">
        <span><i class="fas fa-laptop" aria-hidden="true"></i> Online po celé ČR</span>
        <span><i class="fas fa-user-group" aria-hidden="true"></i> Individuálně i ve skupině</span>
      </div>
    </div>
    <aside class="blue-hero-bio" id="o-lektorovi" aria-labelledby="heroBioName">
      <div class="blue-hero-bio-body">
        <p class="blue-hero-bio-eyebrow">Kdo učí</p>
        <h2 id="heroBioName">Bc. Vojtěch Steidl, MBA</h2>
        <p>Vystudoval jsem aplikovanou fyziku na Masarykově univerzitě. Matematiku a fyziku učím srozumitelně, na příkladech a s vlastními materiály, ke kterým se studenti mohou vracet.</p>
        <div class="blue-hero-bio-facts">
          <span><i class="fas fa-graduation-cap" aria-hidden="true"></i> Aplikovaná fyzika · MUNI</span>
          <span><i class="fas fa-file-circle-check" aria-hidden="true"></i> Materiály po hodině</span>
        </div>
        <a class="blue-hero-bio-mail" href="mailto:info@vojtechsteidl.eu">Kontaktovat lektora <i class="fas fa-arrow-right" aria-hidden="true"></i></a>
      </div>
      <div class="blue-hero-portrait">
        <img src="/foto.jpg" width="210" height="280" fetchpriority="high" alt="Vojtěch Steidl, lektor matematiky a fyziky">
      </div>
    </aside>
  </div>
</section>'''

ABOUT = r'''<section class="blue-about" id="o-lektorovi" aria-labelledby="aboutTitle">
  <div class="blue-shell blue-about-grid">
    <div class="blue-about-image"><img src="/foto.jpg" loading="lazy" alt="Vojtěch Steidl, lektor matematiky a fyziky"><span>MATEMATIKA A FYZIKA · ZŠ / SŠ / VŠ</span></div>
    <div class="blue-about-content">
      <p class="eyebrow">Kdo výuku vede</p>
      <h2 id="aboutTitle">Bc. Vojtěch Steidl, MBA</h2>
      <p class="blue-about-intro">Vystudoval jsem aplikovanou fyziku na Masarykově univerzitě a profesně působím v projektovém řízení. Při doučování propojuji přesný matematický postup s názorným vysvětlením, které student dokáže použít i na nové úloze.</p>
      <div class="blue-about-proofs">
        <span><i class="fas fa-graduation-cap"></i> Aplikovaná fyzika, MUNI</span>
        <span><i class="fas fa-diagram-project"></i> Profesní zkušenost s projektovým řízením</span>
        <span><i class="fas fa-chart-line"></i> Vlastní interaktivní zápisy a diagnostiky</span>
      </div>
      <p class="blue-about-location">Online po celé ČR. Osobní lekce jsou možné po individuální domluvě u lektora v okolí Jihlavy; standardně za studenty nedojíždím.</p>
      <a class="blue-about-link" href="#kapacita">Domluvit úvodní konzultaci <i class="fas fa-arrow-right"></i></a>
    </div>
  </div>
</section>'''

CAPACITY = r''''''

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
    <div class="blue-ecosystem-frame">
    <div class="blue-section-head">
      <div>
        <p class="eyebrow">Součást spolupráce</p>
        <h2>Studentská zóna – ukázka</h2>
        <p>Takto může vypadat studijní přehled po zahájení spolupráce. Ukázka je ilustrační, nejde o skutečné údaje studenta.</p>
      </div>
    </div>
    <div class="blue-bento">
      <article class="blue-zone-card">
        <div>
          <p class="eyebrow">Ukázka prostředí pro studenty</p>
          <h3>Vše důležité na jednom místě.</h3>
          <p>Termíny, materiály, úkoly, průběh spolupráce a platby. Bez hledání starých e-mailů a souborů.</p>
          <a href="/student-portal/" rel="nofollow">Přihlášení pro současné studenty <i class="fas fa-arrow-right" style="margin-left:.45rem"></i></a>
        </div>
        <div class="blue-portal-mini" aria-label="Ilustrační náhled studentské zóny"><span class="blue-demo-watermark">ILUSTRAČNÍ UKÁZKA</span>
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
  </div>
</section>
<section class="blue-capacity-standalone" id="kapacita">
  <div class="blue-shell">
        <div class="blue-section-head">
          <div>
            <p class="eyebrow">Rozvrh a volné termíny</p>
            <h2>Týdenní kalendář</h2>
            <p class="capacity-explainer">Kalendář ukazuje obsazenou výuku. Volné termíny k rezervaci vyberete v jediném formuláři přímo pod ním.</p>
            <a class="booking-jump" href="#rezervace-terminu"><i class="fas fa-calendar-check" aria-hidden="true"></i> Vybrat dostupný termín <span aria-hidden="true">↓</span></a>
            <p class="calendar-week-label" id="calendarWeekLabel">Následující týden</p>
            <p class="calendar-week-summary" id="calendarWeekSummary">Načítám aktuální možnosti…</p>
          </div>
        </div>
        <div class="capacity-legend" style="margin-bottom:1rem">
          <span><i class="legend-dot join"></i> probíhající lekce</span>
          <span>Volné termíny k rezervaci najdete pod kalendářem ↓</span>
          <span class="calendar-live-status" id="calendarLiveStatus">Ověřuji aktuálnost…</span>
        </div>
        <p class="calendar-swipe-hint" aria-hidden="true"><i class="fas fa-arrows-left-right"></i> Posunutím zobrazíte ostatní dny.</p>
        <div class="weekly-calendar-wrap" role="region" aria-label="Týdenní rozvrh lekcí" tabindex="0">
          <div class="weekly-calendar timeline-calendar" id="weeklyCalendar" aria-live="polite">
            <p class="calendar-empty" role="status">Dostupnost termínů ověřuji v Google Kalendáři…</p>
          </div>
        </div>
        <div class="booking-panel" id="rezervace-terminu">
          <div class="booking-panel-copy">
            <p class="eyebrow">Rezervace pro nové zájemce</p>
            <h3>Rezervace termínu</h3>
            <p>Vyberte typ lekce, potom konkrétní dostupný termín ze seznamu níže. Kalendář chrání soukromí studentů; dostupnost ještě ověřím před potvrzením. Pro osobní výuku u lektora mi napište na info@vojtechsteidl.eu.</p>
            <span class="booking-security"><i class="fas fa-shield-halved"></i> Časy jsou uvedené pro Českou republiku</span>
          </div>
          <form class="booking-form" id="slotBookingForm">
            <p class="booking-step-heading"><span>01</span> Typ lekce</p>
            <div class="booking-type-grid" role="radiogroup" aria-label="Typ rezervace">
              <label class="booking-type"><input type="radio" name="booking_type" value="diagnostic_30" checked><span><strong>30 minut zdarma</strong><small>Úvodní online diagnostika / zkušební konzultace</small></span></label>
              <label class="booking-type"><input type="radio" name="booking_type" value="lesson_60"><span><strong>60 minut · 450 Kč</strong><small>Standardní placená online lekce</small></span></label>
            </div>
            <p id="bookingTypeSummary" class="calendar-week-summary"></p>
            <div class="booking-form-fields">
              <label class="full" for="bookingStartAt"><span class="booking-step-heading"><span>02</span> Dostupný termín</span><select id="bookingStartAt" name="start_at" required disabled><option value="">Ověřuji dostupnost…</option></select></label>
              <p class="booking-step-heading booking-form-section"><span>03</span> Kontaktní údaje</p>
              <label>Jméno<input type="text" name="name" autocomplete="name" maxlength="100" required></label>
              <label>E-mail<input type="email" name="email" autocomplete="email" maxlength="160" required></label>
              <label>Ročník / úroveň<input type="text" name="grade" maxlength="80" placeholder="např. 9. třída, maturita, VŠ" required></label>
              <label>Téma<input type="text" name="topic" maxlength="160" placeholder="např. rovnice, derivace, fyzika" required></label>
              <label class="full">Poznámka<textarea name="note" maxlength="1000" placeholder="Co potřebujete probrat?"></textarea></label>
              <p class="booking-consent">Údaje z rezervace slouží k její přípravě a potvrzení. <a href="/ochrana-osobnich-udaju/">Jak pracuji s osobními údaji</a>.</p>
              <label class="booking-honeypot" aria-hidden="true">Web<input type="text" name="website" tabindex="-1" autocomplete="off"></label>
              <p class="booking-terms">Lekci lze bezplatně zrušit nejpozději 24 hodin předem. Při pozdější změně se domluvíme individuálně. <a href="/podminky-doucovani/">Podmínky výuky a storno</a>.</p>
              <button class="booking-submit" type="submit">Potvrdit rezervaci</button>
              <p class="form-status" id="slotBookingStatus" aria-live="polite"></p>
            </div>
          </form>
        </div>
      </div>
    </section>'''

REFERENCE = r'''<section class="blue-reference" id="reference">
  <div class="blue-shell">
    <div class="blue-review-head">
      <div><p class="eyebrow">Reference</p><h2>Jak výuku hodnotí studenti.</h2></div>
      <p>Krátký výběr z veřejných referencí na Doučuji.eu a Superprof.</p>
    </div>
    <div class="blue-review-grid">
      <article class="blue-review-card">
        <div class="blue-review-top"><span class="blue-review-stars" aria-label="5 hvězdiček">★★★★★</span><span class="blue-review-source">Doučuji.eu</span></div>
        <blockquote>Fyziku vysvětluje srozumitelně a klidně i jiným způsobem, když je potřeba. Oceňuji hlavně dobře zpracované materiály a větší jistotu v látce.</blockquote>
        <div class="blue-review-person"><strong>Justýna B.</strong><span>reference na Doučuji.eu</span><a href="https://www.doucuji.eu/507905-doucovani-doucovani-matematiky-a-fyzika-osobne-ci-online" target="_blank" rel="noopener">Zobrazit zdroj →</a></div>
      </article>
      <article class="blue-review-card">
        <div class="blue-review-top"><span class="blue-review-stars" aria-label="5 hvězdiček">★★★★★</span><span class="blue-review-source">Doučuji.eu</span></div>
        <blockquote>Potřebovala jsem rychlou přípravu na zápočet z matematiky. Výklad byl jasný a po lekci jsem dostala ještě přehledný písemný souhrn dalšího postupu.</blockquote>
        <div class="blue-review-person"><strong>Petra S.</strong><span>reference na Doučuji.eu</span><a href="https://www.doucuji.eu/507905-doucovani-doucovani-matematiky-a-fyzika-osobne-ci-online" target="_blank" rel="noopener">Zobrazit zdroj →</a></div>
      </article>
      <article class="blue-review-card">
        <div class="blue-review-top"><span class="blue-review-stars" aria-label="5 hvězdiček">★★★★★</span><span class="blue-review-source">Superprof</span></div>
        <blockquote>Rychle rozpoznal, kde má syn problém v algebře, a ukázal jiný postup, který mu začal dávat smysl. Velké plus byla také flexibilní domluva před písemkou.</blockquote>
        <div class="blue-review-person"><strong>Miroslav</strong><span>ověřená recenze na Superprof</span><a href="https://www.superprof.cz/jako-absolvent-aplikovane-fyziky-muni-vam-pomuzu-zvladnout-slozite-matematicke-fyzikalni-koncepty-jednoduse.html" target="_blank" rel="noopener">Zobrazit zdroj →</a></div>
      </article>
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
      <article class="blue-price-card"><small>První krok</small><strong>Zdarma</strong><p>30 minut úvodní konzultace nebo diagnostiky.</p><a href="#kapacita">Rezervovat termín →</a></article>
      <article class="blue-price-card featured"><small>Individuální lekce</small><strong>450 Kč</strong><p>60 minut, jednorázově nebo pravidelně podle aktuální potřeby. Zrušení nejpozději 24 hodin předem zdarma.</p><a href="#rezervace-terminu">Vybrat individuální lekci →</a></article>
      <article class="blue-price-card"><small>Malá skupina</small><strong>300 Kč / osoba</strong><p>60 minut pro studenty s podobnou úrovní a stejným cílem.</p><a href="/skupiny/">Otevírané online skupiny →</a></article>
    </div>
  </div>
</section>'''

CONTACT = ''  # Zrušen duplicitní kontaktní formulář – rezervace zůstává pod kalendářem.

NAV = r'''<ul class="nav-links" id="navLinks">
  <li><a href="#kapacita">Kapacita</a></li>
  <li><a href="#jak-to-funguje">Příprava</a></li>
  <li><a href="#o-lektorovi">O lektorovi</a></li>
  <li><a href="#cenik">Ceník</a></li>
  <li><a href="/student-portal/" rel="nofollow" class="nav-student"><i class="fas fa-user-lock"></i> Studentská zóna</a></li>
  <li><a href="mailto:info@vojtechsteidl.eu" class="nav-contact">Kontakt</a></li>
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
    # Stručné bio s fotografií je již v pravé části hero; nevkládat pod něj další velkou sekci.
    html = replace_section(html, '<section class="section" id="studijni-cile">', OFFER, "goals")
    html = replace_section(html, '<section class="testimonials section" id="reference">', REFERENCE, "testimonials")
    html = replace_section(html, '<section class="pricing section" id="cenik">', PRICING, "pricing")
    html = remove_section(html, '<section class="contact section" id="kontakt">', "duplicate bottom contact form")

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
        'id="rezervace-terminu"',
        'id="o-lektorovi"',
        'class="blue-hero-bio"',
        "/diagnostika/",
        "/materialy-zdarma/",
        "/skupiny/",
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
