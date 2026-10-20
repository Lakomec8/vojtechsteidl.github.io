import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { calendarUpcomingLessonsForStudent } from "../src/student-learning.ts";

const db = new DatabaseSync(":memory:");
db.exec(`
  CREATE TABLE tutoring_calendar_events (
    google_event_id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    starts_at TEXT NOT NULL,
    ends_at TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    status TEXT NOT NULL
  );
  CREATE TABLE tutoring_calendar_event_students (
    google_event_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    PRIMARY KEY(google_event_id, student_id)
  );
  CREATE TABLE student_tutoring_links (
    student_id TEXT PRIMARY KEY,
    tutoring_student_id TEXT NOT NULL
  );
  INSERT INTO student_tutoring_links VALUES ('adam','adam'),('krystof','krystof'),('anicka-portal','anicka');
`);
const start = new Date(Date.now() + 4 * 86400000).toISOString();
const end = new Date(Date.now() + 4 * 86400000 + 3600000).toISOString();
const old = new Date(Date.now() - 3 * 86400000).toISOString();
const insert = db.prepare("INSERT INTO tutoring_calendar_events VALUES (?,?,?,?,?,?)");
insert.run("group", "adam", start, end, 60, "planned");
insert.run("past", "adam", old, start, 60, "completed");
insert.run("cancelled", "anicka", start, end, 60, "cancelled");
db.prepare("INSERT INTO tutoring_calendar_event_students VALUES (?,?)").run("group","adam");
db.prepare("INSERT INTO tutoring_calendar_event_students VALUES (?,?)").run("group","krystof");
const DB = {
  prepare(sql) {
    assert.match(sql,/tutoring_calendar_event_students/);
    const statement = db.prepare(sql);
    return {bind(...args){return {async all(){return {results:statement.all(...args)}}}}};
  }
};
const env = {DB};
const first = await calendarUpcomingLessonsForStudent("adam", env);
const second = await calendarUpcomingLessonsForStudent("krystof", env);
const third = await calendarUpcomingLessonsForStudent("anicka-portal", env);
assert.deepEqual(first.map(row=>row.google_event_id),["group"]);
assert.deepEqual(second.map(row=>row.google_event_id),["group"],
  "Group event must be visible to participant, not just primary owner");
assert.deepEqual(third,[], "Cancelled events are excluded");
assert.equal(first[0].starts_at, start);
assert.equal(second[0].ends_at, end);
db.close();
console.log("Student next lesson: upcoming shared session visible to both students, past/cancelled events suppressed.");
