# Potvrzovací e-maily z info@vojtechsteidl.eu (Resend Free)

**Důvod:** `MailApp.sendEmail` odesílá z Google účtu vlastníka Apps Scriptu, což zákazníkovi zobrazovalo soukromý Gmail. Aktualizovaný `google-booking-bridge.gs` používá Resend API a **nikdy nemá fallback na MailApp**.

## Příprava bez výpadku

1. Zaregistrovat se na <https://resend.com/> (bezplatný tarif 3 000 e-mailů/měsíc, maximálně 100/den).
2. **Domains → Add domain → `vojtechsteidl.eu`**. Zvolit region v souladu s nabízenými možnostmi a podle pokynů Resend přidat DNS záznamy do Cloudflare DNS.
   - Přidejte **přesně** záznamy, které Resend uvede (zejména DKIM a případně SPF/MX pro **odesílací subdoménu**, kterou zobrazuje Resend).
   - **NEMĚŇTE existující kořenové MX záznamy Cloudflare Email Routing pro `vojtechsteidl.eu`.** Přeposílání `info@` na Seznam musí zůstat funkční.
   - Nevytvářejte druhý SPF TXT se stejným názvem; při konfliktu SPF se slučují autorizační mechanismy v jednom záznamu.
3. Po stavu **Verified** otevřít Resend → **API Keys → Create API Key**, oprávnění **Sending access**, případně omezit na příslušnou doménu. Klíč nikam neposílat a neukládat v GitHubu.
4. V **původním Google Apps Script projektu**, kde je stávající nasazená webová aplikace, otevřít **Project Settings → Script properties** a přidat:
   - `RESEND_API_KEY` = zkopírovaný tajný Resend API key (`re_...`).
   - Ponechat `BOOKING_WEBHOOK_SECRET` a `BOOKING_CALENDAR_ID` **beze změny**.
5. Teprve nyní přepsat obsah souboru `Code.gs` aktuálním zdrojem [google-booking-bridge.gs](./google-booking-bridge.gs), uložit a **Deploy → Manage deployments → Edit → Version: New version → Deploy**.
   - Zachovat **stejné nasazení a stejnou /exec URL**; nezakládat nový projekt.
   - Při novém oprávnění `UrlFetchApp` souhlasit s odchozími HTTPS požadavky.
   - Odesílání teď používá `Vojtěch Steidl <info@vojtechsteidl.eu>`, Reply-To `info@vojtechsteidl.eu`.
   - Neaktivovat upravenou verzi dříve než je DNS doména a API klíč skutečně funkční; bez nich bude potvrzení čekat na opakovaný pokus (ale rezervovaný termín zůstane obsazený).
6. Vytvořit jednu testovací rezervaci na vlastní kontrolovanou adresu. Ověřit skutečné hlavičky **From**, odpověď na `info@`, doručení, událost v Google Kalendáři a následné storno.
7. Po ověření aktualizovat veřejné zásady ochrany osobních údajů o použitém poskytovateli e-mailů (Resend) a uzavřít příslušnou dokumentaci zpracovatele osobních údajů, pokud je potřeba.

Technický detail: Resend odesílá `POST /emails` se stable `Idempotency-Key` odvozeným z rezervace a operace. Klíč platí u Resend 24 hodin, Apps Script si navíc uchovává dlouhodobý stav v Script Properties.

## Alternativa v existujícím Cloudflare

Cloudflare Email Service lze použít přímo z Workeru s `info@` jako odesílatelem po zapnutí **Email Sending** a ověření DNS domény. Pro zasílání zákazníkům na libovolné adresy vyžaduje plán **Workers Paid** (minimálně 5 USD/měsíc). To by odstranilo externí Resend, ale změnilo by účtování a implementaci. Pro nízkonákladové řešení je výše uvedený Resend Free vhodnější.

---

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
4. **Deploy → New deployment → Web app** (jen při prvním nasazení): *Execute as: Me*, *Who has access: Anyone*. Při dalších změnách zachovejte existující URL přes **Manage deployments → Edit → New version**.
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
