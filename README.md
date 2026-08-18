# vojtechsteidl.github.io

Doučování matematiky a fyziky v Jihlavě a online.

## Interaktivní materiály

- [`Funkce: od předpisu ke grafu`](interactive-notes/functions/index.html) — plnohodnotná interaktivní lekce s grafickou laboratoří, procvičováním a závěrečným testem.

Kontrola interaktivních materiálů:

```bash
python scripts/validate_interactive_materials.py
node --check interactive-notes/functions/app.js
```

## Studentská data

Šablona nového profilu a pravidla datového formátu jsou v dokumentu [`docs/STUDENT_DATA.md`](docs/STUDENT_DATA.md).

Kontrola profilů a odkazovaných materiálů:

```bash
python scripts/validate_student_data.py
node --check assets/student-portal.js
```

## Provozní model

Rozdělení autoritativních zdrojů mezi GitHub, Google Calendar, Gmail, Google Drive a Tutoring OS je popsáno v [`docs/AI_OPERATING_MODEL.md`](docs/AI_OPERATING_MODEL.md). Cílem je, aby každý typ informace měl právě jeden source of truth a nevznikaly paralelní ručně udržované kopie.
