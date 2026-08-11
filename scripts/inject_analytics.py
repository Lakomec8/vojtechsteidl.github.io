from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
SCRIPT_TAG = '    <!-- Google Analytics: public pages only; consent handled before tracking -->\n    <script defer src="/assets/analytics-consent.js"></script>\n'

SKIP_DIRS = {
    '.git',
    '.github',
    'Materials',
    'students',
    'demo123',
}

SKIP_FILES = {
    'student-portal.html',
    'student-portal-demo.html',
    'test123.html',
}


def should_skip(path: Path) -> bool:
    rel = path.relative_to(ROOT)
    if rel.name in SKIP_FILES:
        return True
    return any(part in SKIP_DIRS for part in rel.parts[:-1])


def inject(path: Path) -> bool:
    if should_skip(path):
        return False

    text = path.read_text(encoding='utf-8')
    if '/assets/analytics-consent.js' in text:
        return False

    match = re.search(r'<head\b[^>]*>', text, flags=re.IGNORECASE)
    if not match:
        return False

    updated = text[:match.end()] + '\n' + SCRIPT_TAG + text[match.end():]
    path.write_text(updated, encoding='utf-8')
    return True


def main() -> None:
    changed = []
    for path in ROOT.rglob('*.html'):
        if inject(path):
            changed.append(str(path.relative_to(ROOT)))

    print(f'Injected analytics consent loader into {len(changed)} public HTML files.')
    for item in changed:
        print(f'  - {item}')


if __name__ == '__main__':
    main()
