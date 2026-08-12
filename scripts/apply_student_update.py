#!/usr/bin/env python3
"""Apply a small targeted JSON patch to one student profile."""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
STUDENTS_DIR = ROOT / "students"


def decode_pointer_token(token: str) -> str:
    return token.replace("~1", "/").replace("~0", "~")


def get_target(root: Any, pointer: str) -> Any:
    if pointer in {"", "/"}:
        return root
    current = root
    for raw in pointer.strip("/").split("/"):
        token = decode_pointer_token(raw)
        current = current[int(token)] if isinstance(current, list) else current[token]
    return current


def set_value(root: Any, pointer: str, value: Any) -> None:
    tokens = [decode_pointer_token(part) for part in pointer.strip("/").split("/") if part != ""]
    if not tokens:
        raise ValueError("Root replacement is not supported")
    parent = root
    for token in tokens[:-1]:
        parent = parent[int(token)] if isinstance(parent, list) else parent[token]
    last = tokens[-1]
    if isinstance(parent, list):
        parent[int(last)] = value
    else:
        parent[last] = value


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: apply_student_update.py <patch.json>", file=sys.stderr)
        return 2

    patch_path = Path(sys.argv[1])
    patch = json.loads(patch_path.read_text(encoding="utf-8"))
    student_id = str(patch.get("studentId", "")).strip()
    if not student_id or any(ch not in "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789._-" for ch in student_id):
        raise ValueError("Invalid studentId")

    profile_path = STUDENTS_DIR / f"{student_id}.json"
    if not profile_path.is_file():
        raise FileNotFoundError(profile_path)

    profile = json.loads(profile_path.read_text(encoding="utf-8"))

    for pointer, value in patch.get("set", {}).items():
        set_value(profile, pointer, value)

    for operation in patch.get("prepend", []):
        pointer = operation["path"]
        value = operation["value"]
        target = get_target(profile, pointer)
        if not isinstance(target, list):
            raise TypeError(f"Prepend target is not a list: {pointer}")
        if value not in target:
            target.insert(0, value)

    profile_path.write_text(
        json.dumps(profile, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Updated {profile_path.relative_to(ROOT)} from {patch_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
