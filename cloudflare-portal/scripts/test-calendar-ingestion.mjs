import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { syncGoogleCalendarToD1 } from '../src/calendar-ingestion.ts';
const db = new DatabaseSync(':memory:');
for (const file of ['0006_tutoring_os.sql', '0007_group_lessons.sql']) {
  const sql = readFileSync(new URL('../migrations/' + file, import.meta.url), 'utf8');
  db.exec(sql.slice(0, sql.indexOf('INSERT OR IGNORE')));
}
db.exec(`CREATE TABLE public_capacity_series (series_id TEXT PRIMARY KEY, public_label TEXT, capacity INTEGER, fallback_people INTEGER, enabled INTEGER, sort_order INTEGER);`);
for (const file of ['0049_sync_public_calendar_busy.sql', '0054_calendar_ingestion_state.sql', '0067_explicit_calendar_student_aliases.sql']) db.exec(readFileSync(new URL('../migrations/' + file, import.meta.url), 'utf8'));
db.exec(`INSERT INTO tutoring_students (id, display_name, hourly_rate) VALUES ('alice','Alice',500),('bob','Bob',500)`);
let writes = 0;
const DB = {
  prepare(sql) {
    const statement = db.prepare(sql); let args = [];
    const query = {
      bind(...values) { args = values; return query; },
      async all() { return { results: statement.all(...args) }; },
      async run() { const r = statement.run(...args); writes += Number(r.changes); return { meta: { changes: Number(r.changes) } }; },
    }; return query;
  },
  async batch(statements) { return Promise.all(statements.map((s) => s.run())); },
};
const date = new Date(Date.now() + 86400000).toISOString().slice(0,10).replaceAll('-','');
let title = 'Alice doučko', hour = '150000', cancelled = false, fail = false;
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => fail ? new Response('', { status: 503 }) : new Response(`BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nUID:test@google.com\r\nDTSTART:${date}T${hour}Z\r\nDTEND:${date}T170000Z\r\nSUMMARY:${title}\r\n${cancelled ? 'STATUS:CANCELLED\r\n' : ''}END:VEVENT\r\nEND:VCALENDAR\r\n`);
const env = { DB, GOOGLE_CALENDAR_ICS_URL: 'https://example.test/calendar' };
try {
  await syncGoogleCalendarToD1(env);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM tutoring_calendar_events').get().n, 1);
  writes = 0; await syncGoogleCalendarToD1(env);
  assert.equal(writes, 1, 'unchanged snapshot writes only one freshness marker');
  title = 'Alice Bob doučko'; hour = '160000'; await syncGoogleCalendarToD1(env);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM tutoring_calendar_event_students').get().n, 2);
  assert.match(db.prepare('SELECT starts_at FROM public_calendar_busy').get().starts_at, /T16:00/);
  title = 'Bob doučko'; await syncGoogleCalendarToD1(env);
  assert.deepEqual(db.prepare('SELECT student_id FROM tutoring_calendar_event_students').all().map((r) => r.student_id), ['bob']);
  cancelled = true; await syncGoogleCalendarToD1(env);
  assert.equal(db.prepare('SELECT status FROM tutoring_calendar_events').get().status, 'cancelled');
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM public_calendar_busy').get().n, 0);
  cancelled = false; await syncGoogleCalendarToD1(env);
  assert.equal(db.prepare('SELECT status FROM tutoring_calendar_events').get().status, 'planned');
  db.exec(`UPDATE tutoring_calendar_events SET status='completed'`); await syncGoogleCalendarToD1(env);
  assert.equal(db.prepare('SELECT status FROM tutoring_calendar_events').get().status, 'completed');
  const marker = db.prepare('SELECT last_synced_at FROM calendar_ingestion_state').get().last_synced_at;
  fail = true; await assert.rejects(syncGoogleCalendarToD1(env), /503/);
  assert.equal(db.prepare('SELECT last_synced_at FROM calendar_ingestion_state').get().last_synced_at, marker);

  // First-name aliases must be explicit, belong to active identities and
  // require a tutoring marker in the title (never import private meetings).
  db.exec(`INSERT INTO tutoring_calendar_aliases(normalized_alias, alias, tutoring_student_id)
           VALUES ('bobby', 'Bobby', 'bob')`);
  fail = false; cancelled = false; title = 'Bobby doučko'; hour = '150000';
  await syncGoogleCalendarToD1(env);
  assert.deepEqual(db.prepare('SELECT student_id FROM tutoring_calendar_event_students').all().map((r)=>r.student_id), ['bob']);
  title = 'Bobby soukromá oslava';
  await syncGoogleCalendarToD1(env);
  assert.equal(db.prepare('SELECT status FROM tutoring_calendar_events').get().status, 'cancelled',
    'A private event with only an alias must not import into tutoring');
  title = 'Bobby doučko'; await syncGoogleCalendarToD1(env);
  assert.equal(db.prepare('SELECT status FROM tutoring_calendar_events').get().status, 'planned');

  // Duplicate first names must never cross-assign a lesson.
  db.exec(`INSERT INTO tutoring_students(id,display_name,hourly_rate)
           VALUES ('bob-other','Bobby Novák',500)`);
  await syncGoogleCalendarToD1(env);
  assert.equal(db.prepare('SELECT status FROM tutoring_calendar_events').get().status, 'cancelled',
    'Short alias must be disabled when another active student's canonical name matches it');
  console.log('Calendar ingestion: unchanged snapshot = 1 write; moves, participants, cancellation, restoration, completed status and failed feed verified.');
} finally { globalThis.fetch = originalFetch; db.close(); }
