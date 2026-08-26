#!/usr/bin/env python3
"""Patch the built public stylesheet so the main navigation never wraps to two rows."""

from pathlib import Path

STYLE_PATH = Path(__file__).resolve().parents[1] / ".public-site" / "style.css"
MARKER = "/* responsive-nav-no-wrap */"

PATCH = r'''

/* responsive-nav-no-wrap */
.nav-links {
    flex-wrap: nowrap;
    white-space: nowrap;
}

@media (min-width: 1281px) {
    .nav {
        width: min(1460px, calc(100% - 2.5rem));
    }
}

@media (min-width: 761px) and (max-width: 1280px) {
    .nav {
        width: min(100% - 2rem, 1460px);
        min-height: 4.4rem;
    }

    .hamburger {
        display: block;
    }

    .nav-links {
        position: absolute;
        top: calc(100% + 1px);
        right: 0;
        left: 0;
        display: none;
        padding: 0.65rem 1rem 1rem;
        border-bottom: 1px solid var(--border);
        background: rgba(255, 255, 255, 0.98);
        box-shadow: 0 10px 18px rgba(15, 23, 42, 0.08);
        white-space: normal;
    }

    .nav-links.active {
        display: block;
    }

    .nav-links li {
        width: 100%;
    }

    .nav-links a,
    .nav-links .nav-contact {
        display: block;
        width: 100%;
        margin: 0;
        padding: 0.75rem;
    }
}
'''

if not STYLE_PATH.is_file():
    raise FileNotFoundError(f"Built stylesheet not found: {STYLE_PATH}")

css = STYLE_PATH.read_text(encoding="utf-8")
if MARKER not in css:
    STYLE_PATH.write_text(css.rstrip() + PATCH + "\n", encoding="utf-8")

print("Patched responsive navigation layout")
