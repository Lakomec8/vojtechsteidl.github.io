# Studentská data

Produkční studentský portál běží přes Cloudflare Worker. Profily jsou uložené v D1 a soukromé PDF materiály v R2. GitHub je zdroj pravdy pro aplikační logiku, validační skripty a deployment.

## Povinná pravidla

- Každá skutečně absolvovaná hodina se eviduje z Google Calendaru.
- Synchronizované kalendářní hodiny jsou v profilu v poli `externalLessons`.
- Každá položka v `externalLessons` odpovídá jedné proběhlé kalendářní události a má unikátní ID události.
- Datum hodiny používá formát `YYYY-MM-DD`.
- Pole `lessons`, `materials`, `tasks`, `timeline`, `upcoming`, `links` a `externalLessons` mají být pole, i když jsou prázdná.
- Každý úkol musí mít unikátní `id`.
- Hodnocení `score` je volitelné; pokud je uvedené, musí být v rozsahu 0 až 10.
- Součet `lessonWeight` a `taskWeight` musí být 100.

## Počet absolvovaných hodin

**Jediným zdrojem pravdy pro počet absolvovaných hodin je Google Calendar.**

Počet na studentské nástěnce se počítá jako počet synchronizovaných proběhlých kalendářních událostí v `externalLessons`.

`completedLessonsCount` je pouze odvozená/cache hodnota a při každé normalizaci profilu se musí přepočítat z `externalLessons`.

Platí zejména:

- nahrání PDF = **0 nových hodin**,
- přidání detailního záznamu do `lessons` = **0 nových hodin**,
- přidání položky do `timeline` = **0 nových hodin**,
- pouze nová proběhlá událost synchronizovaná z Google Calendaru může zvýšit počet absolvovaných hodin,
- duplicitní synchronizace stejné kalendářní události se nesmí započítat dvakrát,
- dvě různé kalendářní události ve stejný den jsou dvě absolvované hodiny.

Toto pravidlo platí pro všechny studenty bez výjimky.

## Materiály

Materiály jsou na počtu hodin nezávislé.

Soukromé PDF se v aktuálním portálu nahrává přes administraci:

```text
/student-portal/admin/materials
```

Upload:

- uloží PDF do Cloudflare R2,
- přidá záznam do `materials`,
- seřadí materiály chronologicky podle data,
- označí nejnovější platný dokument jako `Aktuální PDF`,
- zobrazí jej studentovi v sekci Materiály a jako aktuální materiál na nástěnce,
- **nesmí změnit počet absolvovaných hodin**.

Dodatečné nahrání staršího dokumentu nesmí přebít novější aktuální materiál.

## Poslední hodina vs. aktuální materiál

Jde o dvě různé věci:

- **Poslední hodina** = nejnovější proběhlá kalendářní lekce z `externalLessons`.
- **Aktuální materiál** = nejnovější materiál podle data v `materials`.

Datum materiálu proto nesmí měnit údaj o poslední absolvované hodině.

## Detailní historie

Pole `lessons` může obsahovat detailnější pedagogické záznamy: témata, hodnocení, domácí úkol nebo materiál ke konkrétní hodině. Tyto záznamy slouží k obsahu historie, nikoli k výpočtu počtu hodin.

Pokud existuje detailní záznam i kalendářní událost pro stejný termín, jde stále o tutéž kalendářní lekci; počet určuje kalendář, ne počet datových záznamů.

## Kontrola před publikováním

Z kořene repozitáře se používají zejména:

```bash
python scripts/validate_student_data.py
node --check assets/student-portal.js
node --check assets/student-dashboard-featured.js
```

Cloudflare portal navíc prochází buildem a typecheckem. Read-only produkční audit `cloudflare-portal/scripts/audit-student-portal.mjs` kontroluje mimo jiné invariant:

```text
completedLessonsCount == počet synchronizovaných proběhlých kalendářních událostí
```

Pokud se tyto hodnoty liší, audit má skončit chybou.
