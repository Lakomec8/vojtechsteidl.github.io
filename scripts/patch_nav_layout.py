#!/usr/bin/env python3
"""Patch the built public navigation so it never wraps and remains usable on subpages."""

from pathlib import Path

DIST = Path(__file__).resolve().parents[1] / ".public-site"
STYLE_PATH = DIST / "style.css"
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

NAV_SCRIPT = '''
<script data-responsive-nav>
(() => {
  const button = document.getElementById('hamburger');
  const links = document.getElementById('navLinks');
  if (!button || !links || button.dataset.bound === '1') return;
  button.dataset.bound = '1';
  button.addEventListener('click', () => {
    const open = links.classList.toggle('active');
    button.classList.toggle('active', open);
    button.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  links.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    links.classList.remove('active');
    button.classList.remove('active');
    button.setAttribute('aria-expanded', 'false');
  }));
})();
</script>
'''

if not STYLE_PATH.is_file():
    raise FileNotFoundError(f"Built stylesheet not found: {STYLE_PATH}")

css = STYLE_PATH.read_text(encoding="utf-8")
if MARKER not in css:
    STYLE_PATH.write_text(css.rstrip() + PATCH + "\n", encoding="utf-8")

patched_pages = 0
for page in DIST.rglob("*.html"):
    html = page.read_text(encoding="utf-8")
    if 'class="nav-links"' not in html:
        continue

    changed = False
    if 'class="hamburger"' not in html:
        nav_tag = '<ul class="nav-links">'
        if nav_tag in html:
            replacement = '<button class="hamburger" id="hamburger" type="button" aria-label="Otevřít menu" aria-expanded="false"><span></span><span></span><span></span></button>\n      <ul class="nav-links" id="navLinks">'
            html = html.replace(nav_tag, replacement, 1)
            changed = True
        elif '<ul class="nav-links" id="navLinks">' in html:
            html = html.replace('<ul class="nav-links" id="navLinks">', '<button class="hamburger" id="hamburger" type="button" aria-label="Otevřít menu" aria-expanded="false"><span></span><span></span><span></span></button>\n      <ul class="nav-links" id="navLinks">', 1)
            changed = True
    elif 'id="navLinks"' not in html:
        html = html.replace('<ul class="nav-links">', '<ul class="nav-links" id="navLinks">', 1)
        changed = True

    if 'class="hamburger"' in html and 'id="navLinks"' in html and 'data-responsive-nav' not in html and '</body>' in html:
        html = html.replace('</body>', NAV_SCRIPT + '</body>', 1)
        changed = True

    if changed:
        page.write_text(html, encoding="utf-8")
        patched_pages += 1

print(f"Patched responsive navigation layout on {patched_pages} pages")
