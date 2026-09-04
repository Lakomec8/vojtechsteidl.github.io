# Automatic tutoring settlement

The secure portal runs a Cloudflare Cron Trigger every 15 minutes.

## What it does

When the `GOOGLE_CALENDAR_ICS_URL` Worker secret is configured, each run first:

- downloads the private read-only Google Calendar iCal feed,
- expands recurring events and exceptions for the active sync window,
- imports only events whose summary contains the name of an active tutoring student,
- links every matched participant, including group lessons such as `Adam a Kryštof`,
- updates moved/rescheduled events,
- marks planned D1 events as cancelled when they disappear from the live calendar.

It then:

- reads planned tutoring events stored in D1,
- detects events whose end time has passed,
- resolves all linked participants,
- creates one idempotent `tutoring_lessons` row and one `tutoring_income` row per participant,
- marks the calendar event as completed,
- refreshes `tutoring_sync_state`.

The same sync-and-reconciliation path runs opportunistically before an administrator opens `/student-portal/admin/tutoring/` and before any student profile is returned. A missed cron run therefore cannot leave a student dashboard stale. Inserts are conflict-safe and also repair a missing income row for an already-created lesson.

Student dashboards do not read a cached lesson count from profile JSON. Every profile response derives `externalLessons`, the completed count and total minutes from the calendar-backed `tutoring_lessons` ledger for that student.

## Required production secret

Set a Cloudflare Worker secret named `GOOGLE_CALENDAR_ICS_URL` to the primary calendar's **Secret address in iCal format**. Do not commit this URL to GitHub or store it in `wrangler.jsonc`.

Without this secret, the Worker deliberately falls back to the existing D1 snapshot and settlement logic, but it cannot discover newly-created, moved or deleted calendar events continuously.

The ingestion window covers two days in the past and 120 days into the future. Unknown calendar names are intentionally ignored until the person exists as an active tutoring student, preventing unrelated personal calendar entries from entering the tutoring ledger.
