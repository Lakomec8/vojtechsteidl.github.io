# Automatic tutoring settlement

The secure portal now runs a Cloudflare Cron Trigger every 15 minutes.

## What it does

- reads planned tutoring events already stored in D1,
- detects events whose end time has passed,
- resolves all linked participants (including group lessons),
- creates one idempotent `tutoring_lessons` row and one `tutoring_income` row per participant,
- marks the calendar event as completed,
- refreshes `tutoring_sync_state`.

The same reconciliation runs opportunistically when the administrator opens `/student-portal/admin/tutoring/`, so a missed cron run does not leave the dashboard stale.

## Calendar ingestion boundary

The Cloudflare Worker does not receive the OAuth credentials used by ChatGPT's connected Google Calendar. Calendar events must therefore already exist in `tutoring_calendar_events` before the settlement cron can process them. The 2026-09-03 deployment refreshes the current known tutoring snapshot through November 2026. A direct Google Calendar API/ICS credential can be added later as a Worker secret if continuous discovery of newly-created calendar events is required.
