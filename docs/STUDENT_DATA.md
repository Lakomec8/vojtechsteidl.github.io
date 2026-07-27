# Studentská data

Nový profil založte z `docs/student-profile.template.json` a uložte jej do složky `students/` pod jednoduchým názvem bez mezer, například `students/jan.json`.

## Povinná pravidla

- Každá reálná hodina musí mít unikátní `id` a datum `date` ve formátu `YYYY-MM-DD`.
- Pole `lessons`, `materials`, `tasks`, `timeline`, `upcoming` a `links` musí být vždy přítomná, i když jsou prázdná.
- Každý úkol musí mít unikátní `id`.
- Hodnocení `score` je volitelné; pokud je uvedené, musí být v rozsahu 0 až 10.
- Lokální odkazy na materiály se zapisují relativně ke kořeni webu, například `./Materials/Student/material.pdf`.
- Součet `lessonWeight` a `taskWeight` musí být 100.

## Kontrola před publikováním

Z kořene repozitáře spusťte:

```bash
python scripts/validate_student_data.py
node --check assets/student-portal.js
```

Stejné kontroly automaticky spouští GitHub Actions při změně studentských dat, portálu nebo PDF materiálů.
