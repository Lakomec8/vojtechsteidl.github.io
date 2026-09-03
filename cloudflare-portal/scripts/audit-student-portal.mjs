import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function runD1(sql) {
  const stdout = execFileSync(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["wrangler", "d1", "execute", "DB", "--remote", "--json", "--command", sql],
    {
      cwd: appRoot,
      env: process.env,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "inherit"],
      maxBuffer: 32 * 1024 * 1024,
    },
  );
  return JSON.parse(stdout);
}

function resultRows(payload) {
  const batches = Array.isArray(payload) ? payload : [payload];
  for (const batch of batches) {
    if (Array.isArray(batch?.results)) return batch.results;
    if (Array.isArray(batch?.result?.results)) return batch.result.results;
    if (Array.isArray(batch?.result)) {
      for (const nested of batch.result) {
        if (Array.isArray(nested?.results)) return nested.results;
      }
    }
  }
  return [];
}

function arr(value) {
  return Array.isArray(value) ? value : [];
}

function dateOf(item) {
  const value = String(item?.date || item?.isoDate || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function isDescending(items) {
  const dates = items.map(dateOf).filter(Boolean);
  return dates.every((date, index) => index === 0 || dates[index - 1] >= date);
}

function latestDate(...groups) {
  const dates = groups.flatMap((items) => arr(items).map(dateOf).filter(Boolean));
  return dates.length ? [...dates].sort().at(-1) : null;
}

function compactItems(items, fields = ["title", "badge", "source", "counted"]) {
  return arr(items).map((item) => {
    const out = { date: dateOf(item) };
    for (const field of fields) {
      if (item?.[field] !== undefined && item?.[field] !== null && item?.[field] !== "") {
        out[field] = item[field];
      }
    }
    return out;
  });
}

const payload = runD1(`
  SELECT s.id,
         s.display_name,
         s.material_path,
         s.enabled,
         p.updated_at,
         p.payload_json,
         (SELECT COUNT(*)
            FROM tutoring_lessons AS lesson
           WHERE lesson.student_id = s.id
             AND lesson.source = 'google_calendar'
             AND lesson.payment_status <> 'cancelled') AS calendar_lesson_count,
         (SELECT MAX(lesson.lesson_date)
            FROM tutoring_lessons AS lesson
           WHERE lesson.student_id = s.id
             AND lesson.source = 'google_calendar'
             AND lesson.payment_status <> 'cancelled') AS latest_calendar_lesson_date,
         (SELECT COUNT(*)
            FROM self_check_attempts AS attempt
           WHERE attempt.student_id = s.id) AS self_check_attempt_count,
         (SELECT attempt.score
            FROM self_check_attempts AS attempt
           WHERE attempt.student_id = s.id
           ORDER BY attempt.submitted_at DESC, attempt.id DESC
           LIMIT 1) AS latest_self_check_score,
         (SELECT attempt.max_score
            FROM self_check_attempts AS attempt
           WHERE attempt.student_id = s.id
           ORDER BY attempt.submitted_at DESC, attempt.id DESC
           LIMIT 1) AS latest_self_check_max_score,
         (SELECT test.title
            FROM self_check_attempts AS attempt
            JOIN self_check_tests AS test ON test.id = attempt.test_id
           WHERE attempt.student_id = s.id
           ORDER BY attempt.submitted_at DESC, attempt.id DESC
           LIMIT 1) AS latest_self_check_title,
         (SELECT attempt.submitted_at
            FROM self_check_attempts AS attempt
           WHERE attempt.student_id = s.id
           ORDER BY attempt.submitted_at DESC, attempt.id DESC
           LIMIT 1) AS latest_self_check_submitted_at
    FROM students AS s
    LEFT JOIN student_profiles AS p ON p.student_id = s.id
   WHERE s.enabled = 1
   ORDER BY s.display_name COLLATE NOCASE;
`);

const rows = resultRows(payload);
const audit = [];

for (const row of rows) {
  const anomalies = [];
  if (!row.payload_json) {
    audit.push({ id: row.id, displayName: row.display_name, anomalies: ["missing-profile"] });
    continue;
  }

  let profile;
  try {
    profile = JSON.parse(row.payload_json);
  } catch {
    audit.push({ id: row.id, displayName: row.display_name, anomalies: ["invalid-profile-json"] });
    continue;
  }

  const lessons = arr(profile.lessons);
  const materials = arr(profile.materials);
  const timeline = arr(profile.timeline);

  const expectedCompleted = Number(row.calendar_lesson_count || 0);
  const historicalOffsetRaw = Number(profile.historicalLessonCountOffset ?? 0);
  const historicalOffset = Number.isFinite(historicalOffsetRaw)
    ? Math.max(0, Math.round(historicalOffsetRaw))
    : 0;
  const effectiveCompleted = historicalOffset + expectedCompleted;

  if (!Number.isFinite(historicalOffsetRaw) || historicalOffsetRaw < 0) {
    anomalies.push("invalid-historical-lesson-offset");
  }
  if (profile.incrementLessonCountOnMaterialAdd === true) {
    anomalies.push("material-upload-still-configured-to-count-lessons");
  }
  if (!isDescending(materials)) anomalies.push("materials-not-chronological");

  const latestMaterialDate = latestDate(materials);
  const firstMaterialDate = dateOf(materials[0]);
  if (latestMaterialDate && firstMaterialDate !== latestMaterialDate) {
    anomalies.push("first-material-is-not-latest-by-date");
  }

  const currentMaterials = materials.filter((item) =>
    ["Aktuální PDF", "Aktuální materiál"].includes(item?.badge),
  );
  if (materials.length && currentMaterials.length !== 1) {
    anomalies.push(`current-material-badge-count-${currentMaterials.length}`);
  }
  if (currentMaterials.length === 1 && latestMaterialDate && dateOf(currentMaterials[0]) !== latestMaterialDate) {
    anomalies.push("current-material-badge-is-not-latest-date");
  }

  audit.push({
    id: row.id,
    displayName: row.display_name,
    materialPath: row.material_path,
    updatedAt: row.updated_at,
    completedLessonsCount: effectiveCompleted,
    historicalLessonCountOffset: historicalOffset,
    effectiveCompletedLessonsCount: effectiveCompleted,
    expectedCalendarLessonCount: expectedCompleted,
    latestCalendarLessonDate: row.latest_calendar_lesson_date,
    selfCheckAttemptCount: Number(row.self_check_attempt_count || 0),
    latestSelfCheck: row.latest_self_check_score == null
      ? null
      : {
          title: row.latest_self_check_title,
          score: Number(row.latest_self_check_score),
          maxScore: Number(row.latest_self_check_max_score),
          submittedAt: row.latest_self_check_submitted_at,
        },
    latestMaterialDate,
    latestDetailedLessonDate: latestDate(lessons),
    materialsChronological: isDescending(materials),
    lessons: compactItems(lessons, ["title", "subject", "score"]),
    materials: compactItems(materials, ["title", "badge", "source"]),
    timeline: compactItems(timeline, ["title", "badge", "source"]),
    anomalies,
  });
}

console.log("STUDENT_PORTAL_AUDIT_BEGIN");
console.log(JSON.stringify(audit, null, 2));
console.log("STUDENT_PORTAL_AUDIT_END");

if (audit.some((row) => row.anomalies?.length)) {
  process.exitCode = 2;
}
