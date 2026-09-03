export type CalendarLesson = {
  google_event_id: string;
  lesson_date: string;
  starts_at: string | null;
  ends_at: string | null;
  duration_minutes: number;
};

type SelfCheckAttemptRow = {
  assignment_id: string;
  assignment_status: string;
  test_status: string;
  title: string;
  topic: string;
  score: number;
  max_score: number;
  submitted_at: string;
};

export type SelfCheckSummary = {
  completedTests: number;
  averagePercent: number | null;
  latest: {
    assignmentId: string;
    title: string;
    topic: string;
    score: number;
    maxScore: number;
    percent: number;
    submittedAt: string;
    available: boolean;
  } | null;
};

export async function calendarLessonsForStudent(
  studentId: string,
  env: Env,
): Promise<CalendarLesson[]> {
  const result = await env.DB.prepare(
    `SELECT google_event_id, lesson_date, starts_at, ends_at, duration_minutes
       FROM tutoring_lessons
      WHERE student_id = ?1
        AND source = 'google_calendar'
        AND payment_status <> 'cancelled'
        AND google_event_id IS NOT NULL
      ORDER BY lesson_date DESC, starts_at DESC, id DESC`,
  ).bind(studentId).all<CalendarLesson>();

  return result.results || [];
}

export async function selfCheckSummaryForStudent(
  studentId: string,
  env: Env,
): Promise<SelfCheckSummary> {
  const result = await env.DB.prepare(
    `SELECT attempt.assignment_id,
            assignment.status AS assignment_status,
            test.status AS test_status,
            test.title,
            test.topic,
            attempt.score,
            attempt.max_score,
            attempt.submitted_at
       FROM self_check_attempts AS attempt
       JOIN self_check_assignments AS assignment ON assignment.id = attempt.assignment_id
       JOIN self_check_tests AS test ON test.id = attempt.test_id
      WHERE attempt.student_id = ?1
        AND attempt.id = (
          SELECT latest.id
            FROM self_check_attempts AS latest
           WHERE latest.assignment_id = attempt.assignment_id
             AND latest.student_id = attempt.student_id
           ORDER BY latest.submitted_at DESC, latest.id DESC
           LIMIT 1
        )
      ORDER BY attempt.submitted_at DESC, attempt.id DESC`,
  ).bind(studentId).all<SelfCheckAttemptRow>();

  const attempts = result.results || [];
  const averagePercent = attempts.length
    ? Math.round(
        attempts.reduce(
          (sum, attempt) => sum + (Number(attempt.score) / Number(attempt.max_score)) * 100,
          0,
        ) / attempts.length,
      )
    : null;
  const latest = attempts[0];

  return {
    completedTests: attempts.length,
    averagePercent,
    latest: latest
      ? {
          assignmentId: latest.assignment_id,
          title: latest.title,
          topic: latest.topic,
          score: Number(latest.score),
          maxScore: Number(latest.max_score),
          percent: Math.round((Number(latest.score) / Number(latest.max_score)) * 100),
          submittedAt: latest.submitted_at,
          available: latest.assignment_status === "active" && latest.test_status === "published",
        }
      : null,
  };
}
