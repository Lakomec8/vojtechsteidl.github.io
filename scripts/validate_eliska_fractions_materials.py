#!/usr/bin/env python3
"""Validate the generated fraction self-check against a fresh local schema."""

import json
import os
import sqlite3
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TEST_ID = "zlomky-kraceni-jednotky-v2"

handle, database_path = tempfile.mkstemp(suffix=".sqlite")
os.close(handle)
database = sqlite3.connect(database_path)
try:
    for migration in sorted((ROOT / "cloudflare-portal" / "migrations").glob("*.sql")):
        database.executescript(migration.read_text(encoding="utf-8"))

    test = database.execute(
        "SELECT id, title FROM self_check_tests WHERE id = ?", (TEST_ID,),
    ).fetchone()
    assert test, "Generated test is missing"

    questions = database.execute(
        "SELECT position, prompt, options_json, correct_answer, explanation, points "
        "FROM self_check_questions WHERE test_id = ? ORDER BY position",
        (TEST_ID,),
    ).fetchall()
    assert len(questions) == 50
    assert [row[0] for row in questions] == list(range(1, 51))
    assert sum(row[5] for row in questions) == 69

    for position, prompt, options_json, correct, explanation, points in questions:
        prompt_data = json.loads(prompt)
        options = json.loads(options_json)
        assert set(prompt_data) == {"instruction", "math", "category", "hint"}, position
        assert prompt_data["instruction"] and prompt_data["category"], position
        assert len(options) == 4 and len({option["id"] for option in options}) == 4, position
        assert correct in {option["id"] for option in options}, position
        assert explanation and points > 0, position

    # A blank fixture does not contain Eliška, so the guarded assignment must not
    # accidentally attach to any seeded or similarly named profile.
    assignment_count = database.execute(
        "SELECT COUNT(*) FROM self_check_assignments WHERE id = ?",
        ("eliska-zlomky-kraceni-jednotky-v2",),
    ).fetchone()[0]
    assert assignment_count == 0

    print(f"Validated {len(questions)} questions / {sum(row[5] for row in questions)} points.")
finally:
    database.close()
    os.unlink(database_path)
