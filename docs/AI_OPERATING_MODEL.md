# AI Operating Model

Tento repozitář je zdroj pravdy pro veřejný web, studentské nástěnky a data, která se na nich zobrazují.

## Zdroj pravdy podle typu dat

- **GitHub `students/*.json`** — studentský progres, úkoly, timeline, připravenost a veřejná data nástěnky.
- **GitHub `Materials/<student-id>/`** — materiály publikované na studentské nástěnce. Nový PDF materiál se synchronizuje do profilu podle pravidel v `STUDENT_DATA.md`.
- **Google Calendar** — zdroj pravdy pro skutečně proběhlé a naplánované lekce.
- **Gmail** — zdroj pravdy pro obchodní komunikaci, leady a školské kontakty.
- **Tutoring OS (Google Sheets)** — business/řídicí vrstva: sazby, revenue, leady, týdenní přehled a provozní metriky. Není náhradou studentských JSONů.
- **Google Drive** — knihovna a archiv pracovních materiálů; materiál je veřejně aktivní teprve po zařazení do GitHub `Materials/`.

## Cenové pravidlo

- Evelin: 400 Kč/h
- Natalie: 400 Kč/h
- všichni ostatní současní i budoucí studenti: 450 Kč/h

Ceny nejsou veřejnou součástí studentských profilů; patří do business vrstvy.

## Provozní pravidla

1. Proběhlá lekce se potvrzuje podle Google Calendar.
2. Studentská nástěnka se mění pouze v GitHub studentských datech a souvisejících materiálech.
3. Nový PDF materiál přidaný do správné složky `Materials/<student-id>/` se řídí globálním pravidlem počítání hodin popsaným v `STUDENT_DATA.md`.
4. Business metriky a příjmy se nesmí duplikovat do veřejných JSON profilů.
5. Změny webu a automatizací se preferovaně připravují na samostatné branchi a přes pull request.
6. Před publikováním studentských změn se spouští validační skripty uvedené v `README.md` a `STUDENT_DATA.md`.

## Cíl architektury

Každý typ informace má jeden autoritativní zdroj. Ostatní vrstvy mohou data číst, sumarizovat nebo zobrazovat, ale nemají vytvářet paralelní ručně udržované kopie stejného stavu.
