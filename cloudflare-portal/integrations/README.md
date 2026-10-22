# Rezervace → e-mail → Google Kalendář

## Co už běží automaticky

- Web přijímá a atomicky blokuje online termíny v Cloudflare D1 (při souběžných rezervacích nelze stejný čas rezervovat dvakrát).
- Rezervace má potvrzovací kód a soukromý jednorázově zobrazovaný odkaz pro zrušení nejpozději 24 h předem.
- Cloudflare Workers odesílají upozornění na **ověřený interní e-mail na Seznamu** přes omezený binding `BOOKING_EMAIL`.
- D1 outbox uchovává stav doručování, při chybě se další pokus spustí z cron Workeru každých pět minut.
- Stejně je připravené vytvoření/zrušení události v Google Kalendáři + potvrzení pro studenta. **Do aktivace níže se tato část nespouští.**

## Jednorázová aktivace Google Kalendáře (majitel)

1. Na účtu, který vlastní cílový Google Kalendář, otevřít <https://script.google.com/> → **New project**.
2. Zkopírovat celý soubor [google-booking-bridge.gs](google-booking-bridge.gs) do `Code.gs`. Uložit.
3. **Project Settings → Script Properties:** vložit
   - `BOOKING_WEBHOOK_SECRET`: vygenerovaný bezpečný náhodný řetězec minimálně 32 znaků (neukládat do repozitáře ani do chatu),
   - `BOOKING_CALENDAR_ID`: `primary` pro hlavní kalendář daného účtu, nebo přesné ID cílového kalendáře.
4. **Deploy → New deployment → Web app**: *Execute as: Me*, *Who has access: Anyone*.
   Poskytnout potřebná oprávnění ke kalendáři a posílání e-mailů. Zkopírovat výslednou HTTPS `.../exec` URL.
5. V Cloudflare otevřít **Workers & Pages** → oba Workery
   `vojtechsteidl-public-capacity` **a** `vojtechsteidl-secure-portal`.
   V **Settings → Variables and Secrets** přidat stejné **secret** proměnné do obou Workerů:
   - `GOOGLE_BOOKING_WEBHOOK_URL`: `.../exec` URL,
   - `GOOGLE_BOOKING_WEBHOOK_SECRET`: stejný náhodný řetězec jako v Apps Script.
6. Ověřit na jedné legitimní zkušební rezervaci: zápis v interní administraci,
   oznámení majiteli na Seznam, vytvořenou událost ve **správném Google Kalendáři**
   a doručený potvrzovací e-mail studentovi. Potom otestovat storno a odstranění události.

Poznámka: potvrzovací e-mail studenta odesílá **Google Apps Script z účtu, kterým je spuštěný**.
Cloudflare Email Routing zajišťuje pouze příjem na `info@vojtechsteidl.eu`; bez nastavení doménového odesílání nepředstírejte, že potvrzení chodí přímo z `info@`.

## Bezpečnost a stav

- Skript přijímá jen POST a každou akci ověřuje proti tajnému tokenu ze Script Properties.
- Zapsané rezervace jsou zdrojem pravdy; neúspěšný webhook nevrátí čas mezi volné termíny.
- Apps Script používá zámek a evidenci ID rezervace, aby se při opakování nevytvářely duplicitní události.
- Raw token pro samostatné storno nikdy není v databázi, ukládá se pouze SHA-256.
- **Změna data lekce**: nejprve zrušit a pak rezervovat nový termín. Pozdější než 24hodinové změny e-mailem.
- **Nevypínat** D1 migraci 0071 ani integraci bez otestování následné rezervace.
