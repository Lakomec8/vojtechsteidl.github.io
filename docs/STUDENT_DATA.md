# Studentská data

Nový profil založte z `docs/student-profile.template.json` a uložte jej do složky `students/` pod jednoduchým názvem bez mezer, například `students/jan.json`.

## Povinná pravidla

- Každá reálná hodina musí mít unikátní `id` a datum `date` ve formátu `YYYY-MM-DD`.
- Pole `lessons`, `materials`, `tasks`, `timeline`, `upcoming` a `links` musí být vždy přítomná, i když jsou prázdná.
- Každý úkol musí mít unikátní `id`.
- Hodnocení `score` je volitelné; pokud je uvedené, musí být v rozsahu 0 až 10.
- Lokální odkazy na materiály se zapisují relativně ke kořeni webu, například `./Materials/Student/material.pdf`.
- Součet `lessonWeight` a `taskWeight` musí být 100.

## Materiály a nástěnka

Pole `materials` je jediný zdroj dat pro sekci Materiály i kartu Aktuální materiál na nástěnce.

- Nový materiál vložte jako první položku pole `materials`.
- První položka s platným `url` se automaticky zobrazí také na nástěnce.
- Samostatné pole `featuredMaterial` už není potřeba a do nových profilů se nepřidává.
- Název, popis, štítek a odkaz se na obou místech načítají ze stejného objektu, takže se nemusí udržovat duplicitně.

Příklad:

```json
"materials": [
  {
    "title": "Lineární rovnice — pracovní list",
    "meta": "PDF materiál · Matematika · aktuální téma",
    "badge": "Aktuální PDF",
    "badgeClass": "pdf",
    "url": "./Materials/Student/linearni-rovnice.pdf"
  }
]
```

## Kontrola před publikováním

Z kořene repozitáře spusťte:

```bash
python scripts/validate_student_data.py
node --check assets/student-portal.js
node --check assets/student-dashboard-featured.js
```

Stejné kontroly automaticky spouští GitHub Actions při změně studentských dat, portálu nebo PDF materiálů.
