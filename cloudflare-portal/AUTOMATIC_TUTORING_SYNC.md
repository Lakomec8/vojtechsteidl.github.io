# Automatic tutoring settlement

The secure portal now runs a Cloudflare Cron Trigger every 15 minutes.

## What it does

- reads planned tutoring events already stored in D1,
- detects events whose end time has passed,
- resolves all linked participants (including group lessons),
- creates one idempotent `tutoring_lessons` row and one `tutoring_income` row per participant,
- marks the calendar event as completed,
- refreshes `tutoring_sync_state`.

The same reconciliation runs opportunistically before an administrator opens `/student-portal/admin/tutoring/` and before any student profile is returned. A missed cron run therefore cannot leave a student dashboard stale. Inserts are conflict-safe and also repair a missing income row for an already-created lesson.

Student dashboards do not read a cached lesson count from profile JSON. Every profile response derives `externalLessons`, the completed count and total minutes from the calendar-backed `tutoring_lessons` ledger for that student.

## Calendar ingestion boundary

The Cloudflare Worker does not receive the OAuth credentials used by ChatGPT's connected Google Calendar. Calendar events must therefore already exist in `tutoring_calendar_events` before the settlement cron can process them. The 2026-09-03 deployment refreshes the current known tutoring snapshot through November 2026. A direct Google Calendar API/ICS credential can be added later as a Worker secret if continuous discovery of newly-created calendar events is required.
