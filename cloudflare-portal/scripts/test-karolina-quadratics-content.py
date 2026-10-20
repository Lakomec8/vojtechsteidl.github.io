#!/usr/bin/env python3
"""End-to-end SQLite regression for Karolína Losová's quadratic diagnostic.

Runs the real D1 SQL migrations against an in-memory SQLite database.
Checks that the diagnostic is published, uniquely assigned, graded safely,
well-formed, and independently reviewable through the existing portal.
"""
from __future__ import annotations

import json
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MIGRATIONS = ROOT / "migrations"
TEST_ID = "kvadraticke-funkce-rovnice-karolina-v1"
FOUR_DOMAINS = (
    "Základy, graf a transformace",
    "Vrchol, monotónnost, obor hodnot",
    "Sudost, symetrie a geometrie",
    "Rovnice, diskriminant a aplikace",
)


def run() -> None:
    db = sqlite3.connect(":memory:")
    db.execute("PRAGMA foreign_keys=ON")
    db.executescript("""
        CREATE TABLE students (
          id TEXT PRIMARY KEY, display_name TEXT NOT NULL, enabled INTEGER NOT NULL
        );
        CREATE TABLE self_check_tests (
          id TEXT PRIMARY KEY, slug TEXT NOT NULL, version INTEGER NOT NULL,
          title TEXT NOT NULL, description TEXT NOT NULL, subject TEXT NOT NULL,
          topic TEXT NOT NULL, level TEXT NOT NULL,
          estimated_minutes INTEGER NOT NULL, status TEXT NOT NULL
        );
        CREATE TABLE self_check_questions (
          id TEXT PRIMARY KEY, test_id TEXT NOT NULL, position INTEGER NOT NULL,
          prompt TEXT NOT NULL, options_json TEXT NOT NULL,
          correct_answer TEXT NOT NULL, explanation TEXT NOT NULL, points INTEGER NOT NULL,
          FOREIGN KEY(test_id) REFERENCES self_check_tests(id)
        );
        CREATE TABLE self_check_assignments (
          id TEXT PRIMARY KEY, student_id TEXT NOT NULL, test_id TEXT NOT NULL,
          status TEXT NOT NULL,
          FOREIGN KEY(student_id) REFERENCES students(id),
          FOREIGN KEY(test_id) REFERENCES self_check_tests(id)
        );
        INSERT INTO students VALUES ('karolina','Karolína Losová',1);
        INSERT INTO students VALUES ('karolina-lhotska','Karolína Lhotská',1);
        INSERT INTO students VALUES ('adam','Adam',1);
    """)
    for name in (
        "0065_karolina_losova_quadratics_self_check.sql",
        "0066_polish_karolina_quadratics_choices.sql",
    ):
        source = (MIGRATIONS / name).read_text(encoding="utf-8")
        db.executescript(source)
        db.executescript(source)  # safely repeatable by design

    test = db.execute(
        "SELECT title, description, subject, topic, level, estimated_minutes, status "
        "FROM self_check_tests WHERE id=?", (TEST_ID,)
    ).fetchone()
    assert test is not None
    title, desc, subject, topic, level, minutes, status = test
    assert title.startswith("Kvadratické funkce a rovnice")
    assert "32 úloh / 64 bodů" in desc
    assert "[[calculator:Bez kalkulačky]]" in desc
    assert subject == "Matematika" and topic == "Kvadratické funkce a rovnice"
    assert level == "SŠ" and minutes == 50 and status == "published"

    student_rows = db.execute(
        "SELECT student_id, test_id, status FROM self_check_assignments"
    ).fetchall()
    assert student_rows == [("karolina", TEST_ID, "active")], student_rows

    qs = db.execute(
        "SELECT id, position, prompt, options_json, correct_answer, explanation, points "
        "FROM self_check_questions WHERE test_id=? ORDER BY position", (TEST_ID,)
    ).fetchall()
    assert len(qs) == 32
    assert sum(row[-1] for row in qs) == 64
    assert len({row[0] for row in qs}) == 32

    question_prompts: set[tuple[str, str]] = set()
    for index, (id_, position, raw_prompt, raw_options, answer, explanation, points) in enumerate(qs):
        assert position == index + 1
        assert id_ == f"{TEST_ID}-q{position:02d}"
        assert points == (1 if index < 8 else 2 if index < 24 else 3)
        data = json.loads(raw_prompt)
        assert data["category"] == FOUR_DOMAINS[index // 8], data
        assert all(field in data for field in ("instruction", "math", "category", "hint"))
        assert len(data["instruction"]) >= 18 and len(data["hint"]) > 10
        assert (data["instruction"], data["math"]) not in question_prompts, position
        question_prompts.add((data["instruction"], data["math"]))
        assert len(explanation) >= 35, (position, explanation)
        options = json.loads(raw_options)
        assert len(options) == 4
        assert [option["id"] for option in options] == ["a", "b", "c", "d"]
        labels = [option["label"] for option in options]
        assert len(set(labels)) == 4, position
        assert all(label.strip() and "\\" not in label or "[[math:" in label for label in labels)
        assert answer in {opt["id"] for opt in options}

    # Mathematical correctness anchors across all four content domains.
    def answer_label(n: int) -> str:
        row = qs[n - 1]
        options = json.loads(row[3])
        return next(opt["label"] for opt in options if opt["id"] == row[4])

    assert answer_label(1) == "a ≠ 0"
    assert answer_label(3) == "0"  # f(2)=4-6+2
    assert answer_label(8) == "(x+3)^2-4"
    assert answer_label(9) == "(2;−3)"
    assert "Maximum 5 při x=−1" == answer_label(10)
    assert "⟨−6;+∞)" == answer_label(11)
    assert "jen zdola" in answer_label(15).lower()
    assert answer_label(17) == "Sudá"
    assert "Není sudá ani lichá" in answer_label(19)
    assert answer_label(21) == "Právě když b=0"
    assert answer_label(22) == "Ne, pokud a≠0"
    assert answer_label(25) == "{2;3}"
    assert "Jeden dvojnásobný: −2" == answer_label(26)
    assert answer_label(29) == "(−∞;1) ∪ (3;+∞)"
    assert answer_label(30) == "⟨2;4⟩"
    assert answer_label(31) == "m=4"
    assert answer_label(32) == "a=5 m, b=5 m"
    db.close()
    print("Karolína Losová quadratic self-check: 32 questions / 64 points, 4 domains, "
          "JSON syntax, explanations, grading anchors and student-only assignment OK.")


if __name__ == "__main__":
    run()
