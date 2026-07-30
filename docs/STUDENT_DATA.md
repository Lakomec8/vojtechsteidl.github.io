# Studentská data

Nový profil založte z `docs/student-profile.template.json` a uložte jej do složky `students/` pod jednoduchým jednoznačným ID bez mezer, například `students/jan-01.json`.

Stejné ID se používá pro složku materiálů:

```text
students/jan-01.json
Materials/jan-01/
```

Číselná přípona řeší studenty se stejným jménem, například `evelina-01` a `evelina-02`.

## Povinná pravidla

- Každá reálná hodina musí mít unikátní `id` a datum `date` ve formátu `YYYY-MM-DD`.
- Pole `lessons`, `materials`, `tasks`, `timeline`, `upcoming` a `links` musí být vždy přítomná, i když jsou prázdná.
- Každý úkol musí mít unikátní `id`.
- Hodnocení `score` je volitelné; pokud je uvedené, musí být v rozsahu 0 až 10.
- Lokální odkazy na materiály se zapisují relativně ke kořeni webu.
- Součet `lessonWeight` a `taskWeight` musí být 100.

## Automatické přidání PDF

Nový materiál se už ručně nepřidává do studentského JSONu. Stačí nahrát PDF do složky odpovídající ID studenta.

Minimální formát názvu:

```text
Materials/evelina/2026-08-05__soustavy-linearnich-rovnic.pdf
```

Rozšířený formát:

```text
Materials/evelina/2026-08-05__matematika__soustavy-linearnich-rovnic__pracovni-list.pdf
```

Jednotlivé části jsou oddělené dvojitým podtržítkem `__`:

1. datum ve formátu `YYYY-MM-DD`,
2. volitelně předmět,
3. název materiálu,
4. volitelně typ materiálu.

Po nahrání GitHub Action automaticky:

- najde profil podle názvu složky,
- vytvoří položku v poli `materials`,
- vloží nový materiál na první místo,
- označí jej jako `Aktuální PDF`,
- zobrazí jej v sekci Materiály i na nástěnce,
- zabrání vytvoření duplicitního záznamu podle URL.

Příklad vytvořeného záznamu:

```json
{
  "title": "Soustavy linearnich rovnic",
  "meta": "PDF materiál · Matematika · Pracovni list · přidáno 5. srpna 2026",
  "badge": "Aktuální PDF",
  "badgeClass": "pdf",
  "url": "./Materials/evelina/2026-08-05__matematika__soustavy-linearnich-rovnic__pracovni-list.pdf",
  "date": "2026-08-05",
  "source": "filename-sync"
}
```

Samostatné pole `featuredMaterial` se nepoužívá. První platná položka v `materials` je automaticky aktuálním materiálem na nástěnce.

## Přejmenování a odstranění

- Přejmenovaný PDF soubor se vyhodnotí jako nový materiál.
- Starý automaticky spravovaný záznam se odstraní, pokud jeho soubor už neexistuje.
- Materiály připojené přímo ke konkrétní hodině v `lessons[].material` se automaticky nepřiřazují k nové hodině; automatizace řeší sekci Materiály a nástěnku.

## Kontrola před publikováním

Z kořene repozitáře spusťte:

```bash
python scripts/sync_student_materials.py
python scripts/validate_student_data.py
python -m py_compile scripts/sync_student_materials.py
node --check assets/student-portal.js
node --check assets/student-dashboard-featured.js
```

Stejné kontroly automaticky spouští GitHub Actions při změně studentských dat, portálu nebo PDF materiálů.
