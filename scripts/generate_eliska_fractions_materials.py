#!/usr/bin/env python3
"""Generate Eliška's fraction PDF and the matching 50-question D1 migration."""

from __future__ import annotations

import json
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    HRFlowable, KeepTogether, PageBreak, Paragraph, SimpleDocTemplate, Spacer,
    Table, TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
WORKSPACE = ROOT.parents[1]
OUT = WORKSPACE / "outputs" / "eliska-zlomky-kraceni-a-prevody-jednotek.pdf"
MIGRATION = ROOT / "cloudflare-portal" / "migrations" / "0052_eliska_fractions_units_self_check.sql"

FONT_SETS = [
    (Path(r"C:\Windows\Fonts"), ("arial.ttf", "arialbd.ttf", "ariali.ttf")),
    (Path("/usr/share/fonts/truetype/dejavu"), ("DejaVuSans.ttf", "DejaVuSans-Bold.ttf", "DejaVuSans-Oblique.ttf")),
]
FONT_DIR, FONT_FILES = next((directory, files) for directory, files in FONT_SETS if all((directory / file).exists() for file in files))
for name, filename in zip(("DV", "DVB", "DVI"), FONT_FILES):
    pdfmetrics.registerFont(TTFont(name, str(FONT_DIR / filename)))

NAVY = colors.HexColor("#113E50")
TEAL = colors.HexColor("#17617A")
MID = colors.HexColor("#52636D")
LIGHT = colors.HexColor("#EAF2F6")
LIGHT2 = colors.HexColor("#F7F9FA")
LINE = colors.HexColor("#7EA6B8")
TEXT = colors.HexColor("#242C31")
GREEN = colors.HexColor("#356C55")
ORANGE = colors.HexColor("#A85D18")

styles = getSampleStyleSheet()
base = ParagraphStyle("base", parent=styles["BodyText"], fontName="DV", fontSize=10.2, leading=14.2, textColor=TEXT, spaceAfter=4)
center = ParagraphStyle("center", parent=base, alignment=TA_CENTER, fontSize=10.8, leading=15)
formula = ParagraphStyle("formula", parent=center, fontSize=12.2, leading=18, spaceAfter=5)
section = ParagraphStyle("section", parent=base, fontName="DVB", fontSize=17, leading=21, textColor=NAVY, spaceBefore=7, spaceAfter=4)
sub = ParagraphStyle("sub", parent=base, fontName="DVB", fontSize=12.4, leading=16, textColor=TEAL, spaceBefore=6, spaceAfter=3)
label = ParagraphStyle("label", parent=base, fontName="DVB", fontSize=10, leading=12.5, textColor=NAVY)
answer = ParagraphStyle("answer", parent=base, fontName="DVB", textColor=GREEN)
title1 = ParagraphStyle("title1", parent=base, fontName="DVB", fontSize=14, leading=18, textColor=TEAL, alignment=TA_CENTER, spaceAfter=9)
title2 = ParagraphStyle("title2", parent=base, fontName="DVB", fontSize=24, leading=29, textColor=NAVY, alignment=TA_CENTER, spaceAfter=7)
title3 = ParagraphStyle("title3", parent=base, fontName="DVI", fontSize=12, leading=16, textColor=MID, alignment=TA_CENTER, spaceAfter=8)
small = ParagraphStyle("small", parent=base, fontSize=8.8, leading=12)


def P(text: str, style=base):
    return Paragraph(text, style)


def H(text: str):
    return [P(text, section), HRFlowable(width="100%", thickness=.65, color=LINE, spaceAfter=8)]


def box(title: str, body: str, color=LIGHT):
    table = Table([[P(title, label)], [P(body, base)]], colWidths=[174 * mm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), color),
        ("LEFTPADDING", (0, 0), (-1, -1), 7), ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, 0), 6), ("BOTTOMPADDING", (0, 0), (-1, 0), 1),
        ("TOPPADDING", (0, 1), (-1, 1), 0), ("BOTTOMPADDING", (0, 1), (-1, 1), 7),
    ]))
    return table


def grid(rows, widths=None, header=True):
    widths = widths or [42 * mm] * len(rows[0])
    data = [[P(str(value), center if row_index else label) for value in row] for row_index, row in enumerate(rows)]
    table = Table(data, colWidths=widths, repeatRows=1 if header else 0, hAlign="CENTER")
    commands = [
        ("GRID", (0, 0), (-1, -1), .5, LINE), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5), ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT2]),
    ]
    if header:
        commands += [("BACKGROUND", (0, 0), (-1, 0), LIGHT), ("TEXTCOLOR", (0, 0), (-1, 0), NAVY)]
    table.setStyle(TableStyle(commands))
    return table


def compact_grid(rows, widths=None):
    widths = widths or [42 * mm] * len(rows[0])
    data = [[P(str(value), small if row_index else label) for value in row] for row_index, row in enumerate(rows)]
    table = Table(data, colWidths=widths, repeatRows=1, hAlign="CENTER")
    table.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), .45, LINE), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4), ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 2.4), ("BOTTOMPADDING", (0, 0), (-1, -1), 2.4),
        ("BACKGROUND", (0, 0), (-1, 0), LIGHT), ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT2]),
    ]))
    return table


def exercise(code: str, text: str, space=8):
    return KeepTogether([P(f"<b>{code}</b> {text}"), Spacer(1, space * mm)])


def footer(canvas, doc):
    canvas.saveState()
    width, height = A4
    canvas.setFillColor(MID)
    canvas.setFont("DV", 8.2)
    canvas.drawRightString(width - 18 * mm, height - 9 * mm, "MATEMATIKA | Zlomky, krácení a převody jednotek")
    canvas.drawRightString(width - 18 * mm, 9 * mm, f"Strana {doc.page}")
    canvas.restoreState()


def build_pdf():
    story = [
        Spacer(1, 21 * mm), P("ZLOMKY", title1), P("Krácení a převody jednotek", title2),
        HRFlowable(width="100%", thickness=.8, color=colors.HexColor("#2D6F8E"), spaceAfter=9),
        P("Od rozkladu na činitele k jistému výsledku", title3), Spacer(1, 2 * mm),
        P("Studijní materiál pro Elišku", ParagraphStyle("student", parent=center, fontSize=11.4, textColor=MID)),
        Spacer(1, 4 * mm),
        box("Cíl materiálu", "Porozumět zlomku, rozložit čitatele a jmenovatele na činitele, bezpečně krátit a rozšiřovat a převádět jednotky délky i hmotnosti - také ve zlomkovém zápisu."),
        Spacer(1, 7 * mm), P("Mapa postupu", sub),
        grid([["1. Rozlož", "2. Najdi společné", "3. Zkrať", "4. Zkontroluj"],
              ["čitatel i jmenovatel", "stejné činitele", "jen stejné faktory", "jmenovatel > 0"]],
             [43.5 * mm] * 4), Spacer(1, 8 * mm),
        box("Jak s materiálem pracovat", "Nejprve si projdi vzorové příklady. Cvičení počítej bez kalkulačky a piš mezikroky. Výsledky na konci používej až pro kontrolu."),
        PageBreak(),
    ]

    story += H("1. Co přesně znamená zlomek")
    story += [
        P("Ve zlomku <b>3/7</b> je číslo 3 <b>čitatel</b> - říká, kolik částí bereme. Číslo 7 je <b>jmenovatel</b> - říká, na kolik stejných částí je celek rozdělen."),
        P("3/7 = 3 : 7", formula),
        box("Důležitá podmínka", "Jmenovatel nesmí být nula. Zápis 4/0 proto nedává smysl."),
        Spacer(1, 4 * mm), P("Stejná hodnota, jiný zápis", sub),
        P("Zlomky 1/2, 2/4, 3/6 a 5/10 mají stejnou hodnotu. Když čitatele i jmenovatele násobíme nebo dělíme stejným nenulovým číslem, hodnotu zlomku nezměníme."),
        grid([["zlomek", "operace", "výsledek"], ["1/2", "· 3 nahoře i dole", "3/6"], ["8/12", ": 4 nahoře i dole", "2/3"]], [42 * mm, 82 * mm, 42 * mm]),
        Spacer(1, 5 * mm), P("Základní tvar", sub),
        P("Zlomek je v základním tvaru, když čitatel a jmenovatel nemají žádného společného dělitele většího než 1. Například 3/8 už krátit nelze."),
        box("Kontrola rozumem", "Krácením se nemění velikost zlomku. Jestliže 18/24 je menší než 1, musí být i výsledek menší než 1."),
    ]

    story += H("2. Rozklad na prvočinitele")
    story += [
        P("Prvočíslo má právě dva kladné dělitele: 1 a samo sebe. Pro krácení se hodí rozložit číslo na součin prvočísel."),
        grid([["číslo", "rozklad"], ["12", "2 · 2 · 3 = 2² · 3"], ["18", "2 · 3 · 3 = 2 · 3²"], ["30", "2 · 3 · 5"], ["42", "2 · 3 · 7"], ["60", "2² · 3 · 5"]], [52 * mm, 110 * mm]),
        Spacer(1, 5 * mm), P("Vzor: rozklad zlomku 42/63", sub),
        P("42/63 = (2 · 3 · 7)/(3 · 3 · 7)", formula),
        P("Nahoře i dole vidíme společné činitele 3 a 7. Jejich součin je 21, tedy největší společný dělitel čísel 42 a 63."),
        P("42/63 = (2 · <font color='#A85D18'>3 · 7</font>)/(<font color='#A85D18'>3 · 7</font> · 3) = 2/3", formula),
        box("Proč rozklad pomáhá", "Společné činitele jsou vidět přímo. Nemusíš hádat, jakým číslem ještě lze krátit."),
        Spacer(1, 4 * mm), P("Rychlá pravidla dělitelnosti", sub),
        grid([["dělitel", "poznám podle"], ["2", "poslední číslice je sudá"], ["3", "ciferný součet je dělitelný 3"], ["5", "poslední číslice je 0 nebo 5"], ["10", "poslední číslice je 0"]], [38 * mm, 124 * mm]),
        PageBreak(),
    ]

    story += H("3. Krácení krok za krokem")
    story += [
        P("Krátit smíme pouze tak, že <b>celý čitatel i celý jmenovatel</b> vydělíme stejným nenulovým číslem."),
        P("Vzor A: 18/24", sub),
        P("18 = 2 · 3 · 3, &nbsp;&nbsp; 24 = 2 · 2 · 2 · 3", formula),
        P("18/24 = (2 · 3 · 3)/(2 · 2 · 2 · 3) = 3/4", formula),
        P("Společné činitele jsou 2 a 3, tedy krátíme číslem 6."),
        P("Vzor B: postupné krácení 60/84", sub),
        P("60/84 = 30/42 = 15/21 = 5/7", formula),
        P("Postupné krácení je správné, pokud pokračujeme až do základního tvaru."),
        box("Typická chyba", "Zápis 18/24 = 17/23 není krácení. Odčítáním stejného čísla hodnotu zlomku obecně nezachováme.", colors.HexColor("#FFF3E8")),
        Spacer(1, 4 * mm), P("Krácení v součinu", sub),
        P("Před násobením můžeme krátit křížem: společný činitel musí být jednou v čitateli a jednou ve jmenovateli."),
        P("(14/15) · (25/21) = (2/3) · (5/3) = 10/9", formula),
        box("Závěrečná kontrola", "1. Je jmenovatel kladný? 2. Nemají čitatel a jmenovatel společného dělitele? 3. Odpovídá velikost výsledku odhadu?"),
    ]

    story += H("4. Rozšiřování - opačný pohyb")
    story += [
        P("Při rozšiřování násobíme čitatele i jmenovatele stejným nenulovým číslem. Hodnota zlomku zůstane stejná."),
        P("3/5 = (3 · 4)/(5 · 4) = 12/20", formula),
        P("Vzor: doplň chybějící číslo", sub),
        P("7/9 = ?/36. Protože 9 · 4 = 36, také 7 · 4 = 28. Výsledek je 28/36.", formula),
        box("K čemu je rozšiřování", "Hlavně ke společnému jmenovateli při porovnávání, sčítání a odčítání zlomků."),
        Spacer(1, 4 * mm),
        grid([["zadání", "společný jmenovatel", "výsledek"], ["2/3 a 5/8", "24", "16/24 a 15/24"], ["1/4 + 2/3", "12", "3/12 + 8/12 = 11/12"]], [48 * mm, 52 * mm, 62 * mm]),
        PageBreak(),
    ]

    story += H("5. Převody délky ve zlomcích")
    story += [
        P("Při převodu na menší jednotku násobíme. Při převodu na větší jednotku dělíme."),
        grid([["vztah", "příklad"], ["1 cm = 10 mm", "3/5 cm = 3/5 · 10 mm = 6 mm"], ["1 dm = 10 cm", "7/10 dm = 7 cm"], ["1 m = 10 dm = 100 cm = 1 000 mm", "3/4 m = 75 cm"], ["1 km = 1 000 m", "2/5 km = 400 m"]], [78 * mm, 84 * mm]),
        Spacer(1, 5 * mm), P("Vzor A: 7/20 m na centimetry", sub),
        P("7/20 m = 7/20 · 100 cm = 700/20 cm = 35 cm", formula),
        P("Vzor B: 250 cm na metry", sub),
        P("250 cm = 250/100 m = 5/2 m = 2 1/2 m", formula),
        box("Jednotka je součást výsledku", "Číslo bez jednotky není úplná odpověď. Vždy napiš například 35 cm, ne pouze 35."),
        Spacer(1, 4 * mm),
        box("Odhad", "2/5 km je méně než polovina kilometru. Výsledek 400 m proto dává smysl; 4 000 m by byl příliš velký."),
    ]

    story += [PageBreak()]
    story += H("6. Převody hmotnosti ve zlomcích")
    story += [
        grid([["vztah", "příklad"], ["1 g = 1 000 mg", "3/4 g = 750 mg"], ["1 kg = 1 000 g", "2/5 kg = 400 g"], ["1 t = 1 000 kg", "3/20 t = 150 kg"]], [78 * mm, 84 * mm]),
        Spacer(1, 5 * mm), P("Vzor A: 9/25 kg na gramy", sub),
        P("9/25 kg = 9/25 · 1 000 g = 9 · 40 g = 360 g", formula),
        P("Vzor B: 125 g jako část kilogramu", sub),
        P("125 g = 125/1 000 kg = 1/8 kg", formula),
        P("Vzor C: slovní úloha", sub),
        P("Balík váží 3/4 kg. Obal tvoří 1/12 kg. Obsah váží 3/4 - 1/12 = 9/12 - 1/12 = 8/12 = 2/3 kg, tedy 667 g přibližně."),
        box("Přesně, nebo přibližně?", "2/3 kg je přesně 2/3 kg. V gramech je to 666 2/3 g, proto při zápisu 667 g musíme uvést, že jde o přibližnou hodnotu."),
        PageBreak(),
    ]

    story += H("7. Cvičení A - rozklad, krácení a rozšiřování")
    for code, text in [
        ("A1", "Rozlož na prvočinitele čísla 24 a 36."),
        ("A2", "Rozlož na prvočinitele čísla 70 a 105."),
        ("A3", "Zkrať 16/24 na základní tvar."),
        ("A4", "Zkrať 45/60 na základní tvar."),
        ("A5", "Zkrať 84/126 na základní tvar."),
        ("A6", "Zkrať 96/144 na základní tvar."),
        ("A7", "Rozšiř 3/8 na jmenovatel 40."),
        ("A8", "Doplň: 7/12 = ?/60."),
        ("A9", "Doplň: ?/42 = 5/7."),
        ("A10", "Urči, zda jsou zlomky 18/30 a 3/5 ekvivalentní."),
        ("A11", "Vypočti a zkrať: (8/15) · (9/16)."),
        ("A12", "Vypočti a zkrať: (14/25) · (15/21)."),
    ]:
        story.append(exercise(code, text, 7))
    story += [box("Pracovní pravidlo", "U A3-A6 napiš alespoň jeden mezikrok. U A11-A12 vyznač, které činitele krátíš před násobením."), PageBreak()]

    story += H("8. Cvičení B - délka a hmotnost")
    for code, text in [
        ("B1", "Převeď 3/5 cm na milimetry."),
        ("B2", "Převeď 7/10 dm na centimetry."),
        ("B3", "Převeď 9/20 m na centimetry."),
        ("B4", "Převeď 3/8 km na metry."),
        ("B5", "Zapiš 250 mm jako zlomek metru v základním tvaru."),
        ("B6", "Zapiš 35 cm jako zlomek metru v základním tvaru."),
        ("B7", "Převeď 3/4 g na miligramy."),
        ("B8", "Převeď 2/5 kg na gramy."),
        ("B9", "Převeď 7/20 t na kilogramy."),
        ("B10", "Zapiš 125 g jako zlomek kilogramu v základním tvaru."),
        ("B11", "Provaz dlouhý 3/4 m rozdělíme na 3 stejné kusy. Kolik centimetrů měří jeden kus?"),
        ("B12", "Z balení o hmotnosti 2/5 kg spotřebujeme 3/4 obsahu. Kolik gramů spotřebujeme?"),
    ]:
        story.append(exercise(code, text, 7))
    story += [box("Kontrola jednotek", "Než začneš počítat, podtrhni cílovou jednotku. Po výpočtu zkontroluj, zda převod na menší jednotku zvětšil číselnou hodnotu."), PageBreak()]

    story += H("9. Výsledky")
    story += [
        P("Rozklad, krácení a rozšiřování", sub),
        compact_grid([["úloha", "výsledek"],
              ["A1", "24 = 2³ · 3; 36 = 2² · 3²"], ["A2", "70 = 2 · 5 · 7; 105 = 3 · 5 · 7"],
              ["A3", "2/3"], ["A4", "3/4"], ["A5", "2/3"], ["A6", "2/3"],
              ["A7", "15/40"], ["A8", "35"], ["A9", "30"], ["A10", "ano"],
              ["A11", "3/10"], ["A12", "2/5"]], [28 * mm, 134 * mm]),
        Spacer(1, 6 * mm), P("Převody délky a hmotnosti", sub),
        compact_grid([["úloha", "výsledek"], ["B1", "6 mm"], ["B2", "7 cm"], ["B3", "45 cm"],
              ["B4", "375 m"], ["B5", "1/4 m"], ["B6", "7/20 m"], ["B7", "750 mg"],
              ["B8", "400 g"], ["B9", "350 kg"], ["B10", "1/8 kg"], ["B11", "25 cm"], ["B12", "300 g"]], [28 * mm, 134 * mm]),
        Spacer(1, 6 * mm),
        box("Tahák v jedné větě", "Rozložím čísla na činitele, krátím pouze společné činitele a při převodu jednotek násobím počtem menších jednotek v jedné větší jednotce."),
    ]

    OUT.parent.mkdir(parents=True, exist_ok=True)
    SimpleDocTemplate(str(OUT), pagesize=A4, leftMargin=18 * mm, rightMargin=18 * mm, topMargin=20 * mm, bottomMargin=18 * mm).build(story, onFirstPage=footer, onLaterPages=footer)


def question(category, instruction, math, options, correct, explanation, hint="", points=1):
    return dict(category=category, instruction=instruction, math=math, options=options, correct=correct, explanation=explanation, hint=hint, points=points)


QUESTIONS = [
    question("Význam zlomku", "Co udává jmenovatel zlomku?", r"\frac{3}{8}", ["Počet vybraných částí.", "Počet stejných částí, na které je rozdělen celek.", "Výsledek sčítání 3 + 8.", "Počet celků."], "b", "Jmenovatel 8 říká, že celek je rozdělen na 8 stejně velkých částí.", "Jmenovatel je číslo pod zlomkovou čarou."),
    question("Význam zlomku", "Který zápis nemá smysl?", "", [r"[[math:\frac{0}{7}]]", r"[[math:\frac{7}{1}]]", r"[[math:\frac{4}{0}]]", r"[[math:\frac{1}{4}]]"], "c", "Jmenovatel nesmí být nula, protože nulou nelze dělit."),
    question("Význam zlomku", "Který zlomek je roven jedné polovině?", r"\frac{1}{2}", [r"[[math:\frac{2}{3}]]", r"[[math:\frac{3}{6}]]", r"[[math:\frac{4}{6}]]", r"[[math:\frac{5}{8}]]"], "b", r"Zlomek [[math:\frac{3}{6}]] zkrátíme třemi na [[math:\frac{1}{2}]]."),
    question("Význam zlomku", "Který zlomek je už v základním tvaru?", "", [r"[[math:\frac{6}{9}]]", r"[[math:\frac{8}{12}]]", r"[[math:\frac{7}{12}]]", r"[[math:\frac{15}{25}]]"], "c", "Čísla 7 a 12 nemají společného dělitele většího než 1."),
    question("Význam zlomku", "Který zlomek je větší než 1?", "", [r"[[math:\frac{5}{8}]]", r"[[math:\frac{7}{7}]]", r"[[math:\frac{9}{7}]]", r"[[math:\frac{3}{4}]]"], "c", "Je-li čitatel větší než jmenovatel, kladný zlomek je větší než 1."),

    question("Dělitelnost a činitelé", "Které číslo je prvočíslo?", "", ["21", "29", "33", "39"], "b", "Číslo 29 má jen dělitele 1 a 29."),
    question("Dělitelnost a činitelé", "Které číslo je dělitelné třemi?", "", ["124", "215", "372", "451"], "c", "Ciferný součet 3 + 7 + 2 = 12 je dělitelný třemi."),
    question("Dělitelnost a činitelé", "Který rozklad čísla 24 je správný?", "", [r"[[math:2\cdot2\cdot2\cdot3]]", r"[[math:2\cdot3\cdot5]]", r"[[math:3\cdot3\cdot3]]", r"[[math:2\cdot2\cdot7]]"], "a", r"[[math:24=2^3\cdot3]]."),
    question("Dělitelnost a činitelé", "Který rozklad čísla 45 na prvočinitele je správný?", "", [r"[[math:3\cdot3\cdot5]]", r"[[math:3\cdot5\cdot5]]", r"[[math:2\cdot3\cdot5]]", r"[[math:5\cdot9]]"], "a", r"Prvočíselný rozklad je [[math:45=3^2\cdot5]]."),
    question("Dělitelnost a činitelé", "Urči největší společný dělitel.", r"\operatorname{NSD}(18,24)", ["2", "3", "6", "12"], "c", "Společní dělitelé jsou 1, 2, 3 a 6; největší je 6."),
    question("Dělitelnost a činitelé", "Urči největší společný dělitel.", r"\operatorname{NSD}(42,63)", ["3", "7", "14", "21"], "d", r"[[math:42=2\cdot3\cdot7]] a [[math:63=3^2\cdot7]], takže společná část je [[math:3\cdot7=21]].", "Rozlož obě čísla na prvočinitele.", 2),
    question("Dělitelnost a činitelé", "Které číslo dělí zároveň 60 i 84?", "", ["5", "8", "12", "18"], "c", "Platí 60 : 12 = 5 a 84 : 12 = 7."),
    question("Dělitelnost a činitelé", "Jakým největším číslem lze najednou krátit?", r"\frac{70}{105}", ["5", "7", "25", "35"], "d", r"[[math:70=2\cdot5\cdot7]], [[math:105=3\cdot5\cdot7]], proto NSD je 35.", "Hledej společné činitele 5 a 7.", 2),

    question("Krácení", "Zkrať na základní tvar.", r"\frac{12}{18}", [r"[[math:\frac{6}{9}]]", r"[[math:\frac{2}{3}]]", r"[[math:\frac{3}{2}]]", r"[[math:\frac{4}{9}]]"], "b", r"Čitatele i jmenovatele vydělíme 6: [[math:\frac{12}{18}=\frac{2}{3}]]."),
    question("Krácení", "Zkrať na základní tvar.", r"\frac{16}{24}", [r"[[math:\frac{2}{3}]]", r"[[math:\frac{3}{4}]]", r"[[math:\frac{4}{6}]]", r"[[math:\frac{8}{10}]]"], "a", r"Krátíme osmi: [[math:\frac{16}{24}=\frac{2}{3}]]."),
    question("Krácení", "Zkrať na základní tvar.", r"\frac{45}{60}", [r"[[math:\frac{4}{3}]]", r"[[math:\frac{3}{4}]]", r"[[math:\frac{9}{12}]]", r"[[math:\frac{5}{6}]]"], "b", r"NSD čísel 45 a 60 je 15, tedy [[math:\frac{45}{60}=\frac{3}{4}]]."),
    question("Krácení", "Zkrať na základní tvar.", r"\frac{84}{126}", [r"[[math:\frac{2}{3}]]", r"[[math:\frac{3}{2}]]", r"[[math:\frac{4}{6}]]", r"[[math:\frac{7}{9}]]"], "a", r"Krátíme 42: [[math:\frac{84}{126}=\frac{2}{3}]]."),
    question("Krácení", "Zkrať na základní tvar.", r"\frac{96}{144}", [r"[[math:\frac{4}{5}]]", r"[[math:\frac{2}{3}]]", r"[[math:\frac{3}{4}]]", r"[[math:\frac{12}{18}]]"], "b", r"Krátíme 48: [[math:\frac{96}{144}=\frac{2}{3}]]."),
    question("Krácení", "Který mezikrok je správný?", r"\frac{60}{84}", [r"[[math:\frac{60}{84}=\frac{59}{83}]]", r"[[math:\frac{60}{84}=\frac{30}{42}]]", r"[[math:\frac{60}{84}=\frac{6}{84}]]", r"[[math:\frac{60}{84}=\frac{60}{42}]]"], "b", "Při krácení dvěma dělíme dvěma celý čitatel i celý jmenovatel."),
    question("Krácení", "Je výsledek v základním tvaru?", r"\frac{18}{30}=\frac{6}{10}", ["Ano, dál krátit nelze.", "Ne, lze ještě krátit dvěma.", "Ne, lze ještě krátit pěti.", "Ne, správný výsledek je 2/5."], "b", r"[[math:\frac{6}{10}]] ještě krátíme dvěma na [[math:\frac{3}{5}]]."),
    question("Krácení", "Vypočti a zkrať.", r"\frac{8}{15}\cdot\frac{9}{16}", [r"[[math:\frac{3}{10}]]", r"[[math:\frac{72}{31}]]", r"[[math:\frac{8}{10}]]", r"[[math:\frac{9}{15}]]"], "a", r"Před násobením krátíme 8 s 16 a 9 s 15: [[math:\frac{1}{5}\cdot\frac{3}{2}=\frac{3}{10}]].", "Krátit smíš mezi čitatelem a jmenovatelem.", 2),
    question("Krácení", "Vypočti a zkrať.", r"\frac{14}{25}\cdot\frac{15}{21}", [r"[[math:\frac{2}{5}]]", r"[[math:\frac{10}{15}]]", r"[[math:\frac{3}{5}]]", r"[[math:\frac{2}{3}]]"], "a", r"Krátíme 14 s 21 sedmi a 15 s 25 pěti: [[math:\frac{2\cdot3}{5\cdot3}=\frac{6}{15}=\frac{2}{5}]].", points=2),
    question("Krácení", "Které tvrzení o krácení je správné?", "", ["Od čitatele i jmenovatele odečteme stejné číslo.", "Vydělíme čitatele i jmenovatele stejným nenulovým číslem.", "Vydělíme jen jmenovatele.", "Vynásobíme čitatele a vydělíme jmenovatele."], "b", "Stejným nenulovým dělitelem dělíme celý čitatel i celý jmenovatel."),

    question("Rozšiřování", "Rozšiř zlomek na jmenovatel 20.", r"\frac{3}{5}=\frac{\square}{20}", ["8", "10", "12", "15"], "c", "Pětku násobíme čtyřmi, proto také 3 · 4 = 12."),
    question("Rozšiřování", "Rozšiř zlomek na jmenovatel 40.", r"\frac{3}{8}=\frac{\square}{40}", ["5", "12", "15", "24"], "c", "Osmičku násobíme pěti, proto také 3 · 5 = 15."),
    question("Rozšiřování", "Doplň chybějící čitatel.", r"\frac{7}{12}=\frac{\square}{60}", ["25", "30", "35", "42"], "c", "Jmenovatel násobíme pěti, proto čitatel je 7 · 5 = 35."),
    question("Rozšiřování", "Doplň chybějící čitatel.", r"\frac{\square}{42}=\frac{5}{7}", ["25", "30", "35", "36"], "b", "Sedmičku násobíme šesti na 42, proto 5 · 6 = 30."),
    question("Rozšiřování", "Která dvojice obsahuje ekvivalentní zlomky?", "", [r"[[math:\frac{2}{3}\text{ a }\frac{8}{9}]]", r"[[math:\frac{3}{5}\text{ a }\frac{18}{30}]]", r"[[math:\frac{4}{7}\text{ a }\frac{8}{21}]]", r"[[math:\frac{5}{8}\text{ a }\frac{10}{24}]]"], "b", r"[[math:\frac{18}{30}]] krátíme šesti na [[math:\frac{3}{5}]]."),
    question("Rozšiřování", "Převeď na společný jmenovatel 24.", r"\frac{2}{3}\quad\text{a}\quad\frac{5}{8}", [r"[[math:\frac{16}{24}\text{ a }\frac{15}{24}]]", r"[[math:\frac{8}{24}\text{ a }\frac{5}{24}]]", r"[[math:\frac{16}{24}\text{ a }\frac{10}{24}]]", r"[[math:\frac{6}{24}\text{ a }\frac{15}{24}]]"], "a", r"První zlomek rozšíříme osmi a druhý třemi: [[math:\frac{16}{24}]] a [[math:\frac{15}{24}]].", points=2),
    question("Rozšiřování", "Vypočti pomocí společného jmenovatele.", r"\frac{1}{4}+\frac{2}{3}", [r"[[math:\frac{3}{7}]]", r"[[math:\frac{3}{12}]]", r"[[math:\frac{11}{12}]]", r"[[math:\frac{9}{12}]]"], "c", r"[[math:\frac{1}{4}=\frac{3}{12}]] a [[math:\frac{2}{3}=\frac{8}{12}]], tedy součet je [[math:\frac{11}{12}]].", points=2),

    question("Převody délky", "Převeď na milimetry.", r"\frac{3}{5}\,\mathrm{cm}", ["5 mm", "6 mm", "8 mm", "15 mm"], "b", r"Jeden centimetr má 10 mm: [[math:\frac{3}{5}\cdot10=6]] mm."),
    question("Převody délky", "Převeď na centimetry.", r"\frac{7}{10}\,\mathrm{dm}", ["0,7 cm", "7 cm", "70 cm", "700 cm"], "b", r"Jeden decimetr má 10 cm: [[math:\frac{7}{10}\cdot10=7]] cm."),
    question("Převody délky", "Převeď na centimetry.", r"\frac{9}{20}\,\mathrm{m}", ["9 cm", "20 cm", "45 cm", "90 cm"], "c", r"Jeden metr má 100 cm: [[math:\frac{9}{20}\cdot100=45]] cm.", points=2),
    question("Převody délky", "Převeď na metry.", r"\frac{3}{8}\,\mathrm{km}", ["37,5 m", "125 m", "375 m", "3 750 m"], "c", r"Jeden kilometr má 1 000 m: [[math:\frac{3}{8}\cdot1000=375]] m.", points=2),
    question("Převody délky", "Zapiš v základním tvaru jako část metru.", r"250\,\mathrm{mm}", [r"[[math:\frac{1}{4}\,\mathrm{m}]]", r"[[math:\frac{1}{25}\,\mathrm{m}]]", r"[[math:\frac{25}{100}\,\mathrm{m}]]", r"[[math:\frac{4}{1}\,\mathrm{m}]]"], "a", r"[[math:250\,\mathrm{mm}=\frac{250}{1000}\,\mathrm{m}=\frac{1}{4}\,\mathrm{m}]].", points=2),
    question("Převody délky", "Provaz rozdělíme na tři stejné kusy. Jak dlouhý je jeden?", r"\frac{3}{4}\,\mathrm{m}:3", ["15 cm", "20 cm", "25 cm", "30 cm"], "c", r"[[math:\frac{3}{4}:3=\frac{1}{4}]] m a čtvrt metru je 25 cm.", "Nejprve vyděl zlomek třemi, potom převeď jednotku.", 2),

    question("Převody hmotnosti", "Převeď na miligramy.", r"\frac{3}{4}\,\mathrm{g}", ["75 mg", "250 mg", "750 mg", "1 333 mg"], "c", r"Jeden gram má 1 000 mg: [[math:\frac{3}{4}\cdot1000=750]] mg."),
    question("Převody hmotnosti", "Převeď na gramy.", r"\frac{2}{5}\,\mathrm{kg}", ["200 g", "250 g", "400 g", "500 g"], "c", r"Jeden kilogram má 1 000 g: [[math:\frac{2}{5}\cdot1000=400]] g."),
    question("Převody hmotnosti", "Převeď na gramy.", r"\frac{9}{25}\,\mathrm{kg}", ["90 g", "250 g", "360 g", "900 g"], "c", r"[[math:\frac{9}{25}\cdot1000=9\cdot40=360]] g.", points=2),
    question("Převody hmotnosti", "Převeď na kilogramy.", r"\frac{7}{20}\,\mathrm{t}", ["35 kg", "70 kg", "350 kg", "700 kg"], "c", r"Jedna tuna má 1 000 kg: [[math:\frac{7}{20}\cdot1000=350]] kg.", points=2),
    question("Převody hmotnosti", "Zapiš v základním tvaru jako část kilogramu.", r"125\,\mathrm{g}", [r"[[math:\frac{1}{8}\,\mathrm{kg}]]", r"[[math:\frac{1}{4}\,\mathrm{kg}]]", r"[[math:\frac{8}{1}\,\mathrm{kg}]]", r"[[math:\frac{125}{100}\,\mathrm{kg}]]"], "a", r"[[math:125\,\mathrm{g}=\frac{125}{1000}\,\mathrm{kg}=\frac{1}{8}\,\mathrm{kg}]].", points=2),
    question("Převody hmotnosti", "Kolik gramů spotřebujeme?", r"\frac{3}{4}\text{ z }\frac{2}{5}\,\mathrm{kg}", ["150 g", "300 g", "400 g", "600 g"], "b", r"[[math:\frac{3}{4}\cdot\frac{2}{5}=\frac{3}{10}]] kg, tedy 300 g.", points=2),
    question("Převody hmotnosti", "Obsah balíku váží 2/3 kg. Který přesný zápis v gramech je správný?", r"\frac{2}{3}\,\mathrm{kg}", ["Přesně 667 g", r"[[math:666\frac{2}{3}\,\mathrm{g}]]", "Přesně 600 g", "Přesně 660 g"], "b", r"[[math:\frac{2}{3}\cdot1000=\frac{2000}{3}=666\frac{2}{3}]] g. Hodnota 667 g je jen zaokrouhlení.", points=2),

    question("Smíšené úlohy", "Nejprve zkrať a potom převeď na centimetry.", r"\frac{18}{24}\,\mathrm{m}", ["25 cm", "50 cm", "75 cm", "80 cm"], "c", r"[[math:\frac{18}{24}=\frac{3}{4}]] a [[math:\frac{3}{4}\cdot100=75]] cm.", points=2),
    question("Smíšené úlohy", "Nejprve zkrať a potom převeď na gramy.", r"\frac{24}{60}\,\mathrm{kg}", ["240 g", "400 g", "500 g", "600 g"], "b", r"[[math:\frac{24}{60}=\frac{2}{5}]] a [[math:\frac{2}{5}\cdot1000=400]] g.", points=2),
    question("Smíšené úlohy", "Který výpočet je správný?", r"\frac{3}{20}\,\mathrm{t}", [r"[[math:\frac{3}{20}\cdot1000=150\,\mathrm{kg}]]", r"[[math:\frac{3}{20}:1000=150\,\mathrm{kg}]]", r"[[math:\frac{3}{20}\cdot100=15\,\mathrm{kg}]]", r"[[math:\frac{3}{20}\cdot10=1{,}5\,\mathrm{kg}]]"], "a", "Při převodu tun na kilogramy násobíme 1 000; výsledek je 150 kg."),
    question("Smíšené úlohy", "Páska dlouhá 2/5 m se prodává po kusech. Kolik milimetrů měří?", r"\frac{2}{5}\,\mathrm{m}", ["40 mm", "200 mm", "400 mm", "2 500 mm"], "c", r"Jeden metr má 1 000 mm: [[math:\frac{2}{5}\cdot1000=400]] mm."),
    question("Smíšené úlohy", "Dvě balení po 3/8 kg mají dohromady kolik gramů?", r"2\cdot\frac{3}{8}\,\mathrm{kg}", ["375 g", "600 g", "750 g", "800 g"], "c", r"[[math:2\cdot\frac{3}{8}=\frac{3}{4}]] kg, tedy 750 g.", points=2),
    question("Smíšené úlohy", "Tyč dlouhá 5/6 m se zkrátí o 1/3 m. Jaká délka zbude?", r"\frac{5}{6}\,\mathrm{m}-\frac{1}{3}\,\mathrm{m}", ["30 cm", "50 cm", "60 cm", "75 cm"], "b", r"[[math:\frac{5}{6}-\frac{2}{6}=\frac{3}{6}=\frac{1}{2}]] m, tedy 50 cm.", points=2),
    question("Smíšené úlohy", "Který odhad je rozumný?", r"\frac{2}{5}\,\mathrm{kg}", ["Je to méně než 100 g.", "Je to přesně 200 g.", "Je to o něco méně než půl kilogramu.", "Je to více než 1 kg."], "c", "Dvě pětiny jsou 0,4, tedy o něco méně než polovina celku."),
]


def sql_quote(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def build_migration():
    if len(QUESTIONS) != 50:
        raise ValueError(f"Expected 50 questions, got {len(QUESTIONS)}")
    test_id = "zlomky-kraceni-jednotky-v2"
    lines = [
        "PRAGMA foreign_keys = ON;", "",
        "-- Rozsáhlý interaktivní self-check pro ověřený účet eliska.",
        "-- Starší přiřazení zůstává zachované v historii; nástěnka sama zobrazuje jen nejnovější přiřazení.",
        "INSERT OR IGNORE INTO self_check_tests",
        "  (id, slug, version, title, description, subject, topic, level, estimated_minutes, status)",
        "VALUES",
        f"  ({sql_quote(test_id)}, 'zlomky-kraceni-jednotky', 2,",
        "   'Zlomky, krácení a převody jednotek - rozsáhlý self-check',",
        "   '[[calculator:Bez kalkulačky]]50 úloh / 69 bodů / přibližně 45-60 minut. Od významu zlomku a rozkladu na činitele přes krácení a rozšiřování až k převodům délky a hmotnosti ve zlomcích. Po odeslání se zobrazí správné odpovědi, stručná vysvětlení a výsledky po oblastech; test můžeš opakovat.',",
        "   'Matematika', 'Zlomky a jednotky', 'ZŠ / základy SŠ', 55, 'published');", "",
        "INSERT OR IGNORE INTO self_check_questions",
        "  (id, test_id, position, prompt, options_json, correct_answer, explanation, points)",
        "VALUES",
    ]
    rows = []
    ids = ["a", "b", "c", "d"]
    for position, item in enumerate(QUESTIONS, 1):
        if len(item["options"]) != 4 or item["correct"] not in ids:
            raise ValueError(f"Invalid options in question {position}")
        prompt = json.dumps({"instruction": item["instruction"], "math": item["math"], "category": item["category"], "hint": item["hint"]}, ensure_ascii=False, separators=(",", ":"))
        options = json.dumps([{"id": option_id, "label": value} for option_id, value in zip(ids, item["options"])], ensure_ascii=False, separators=(",", ":"))
        rows.append(
            f"  ({sql_quote(f'{test_id}-q{position:02d}')}, {sql_quote(test_id)}, {position},\n"
            f"   {sql_quote(prompt)},\n   {sql_quote(options)},\n"
            f"   {sql_quote(item['correct'])}, {sql_quote(item['explanation'])}, {item['points']})"
        )
    lines.append(",\n\n".join(rows) + ";")
    lines += [
        "", "-- Přiřazení je omezeno přesným stabilním ID, jménem a aktivním stavem účtu.",
        "INSERT OR IGNORE INTO self_check_assignments (id, student_id, test_id, status)",
        "SELECT 'eliska-zlomky-kraceni-jednotky-v2', id, 'zlomky-kraceni-jednotky-v2', 'active'",
        "  FROM students", " WHERE id = 'eliska' AND display_name = 'Eliška' AND enabled = 1;", "",
    ]
    MIGRATION.write_text("\n".join(lines), encoding="utf-8")


if __name__ == "__main__":
    build_pdf()
    build_migration()
    print(OUT)
    print(MIGRATION)
