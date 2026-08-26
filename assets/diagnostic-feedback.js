(() => {
  const CONTACT_EMAIL = 'vojtasteidl@seznam.cz';
  const TESTS = {
    '/test-prijimacky-9-matematika/': {
      name: 'Přijímačky 9. třída',
      goal: 'přijímačky na SŠ',
      secondaryLabel: 'Skupinová příprava',
      secondaryHref: '/skupinove-doucovani-matematiky/'
    },
    '/test-maturita-matematika/': {
      name: 'Maturita z matematiky',
      goal: 'maturitu z matematiky',
      secondaryLabel: 'Skupinová příprava',
      secondaryHref: '/skupinove-doucovani-matematiky/#maturita'
    },
    '/test-vs-matematika-1-rocnik/': {
      name: 'VŠ matematika – 1. ročník',
      goal: 'matematiku v 1. ročníku VŠ',
      secondaryLabel: 'Individuální konzultace',
      secondaryHref: '/#kontakt'
    }
  };

  const style = document.createElement('style');
  style.textContent = `
    .answer.diagnostic-correct{border-color:#16a34a!important;background:#f0fdf4!important;box-shadow:0 0 0 2px rgba(22,163,74,.08)}
    .answer.diagnostic-correct span{color:#166534!important;font-weight:700}
    .answer.diagnostic-wrong{border-color:#dc2626!important;background:#fef2f2!important;box-shadow:0 0 0 2px rgba(220,38,38,.08)}
    .answer.diagnostic-wrong span{color:#991b1b!important;font-weight:700}
    .answer.diagnostic-skipped{border-color:#f59e0b!important;background:#fffbeb!important}
    .answer.diagnostic-skipped span{color:#92400e!important;font-weight:700}
    .answer-feedback{margin-top:.75rem;padding:.72rem .85rem;border-radius:10px;font-size:.9rem;font-weight:700}
    .answer-feedback.ok{background:#f0fdf4;color:#166534}
    .answer-feedback.bad{background:#fef2f2;color:#991b1b}
    .answer-feedback.skip{background:#fffbeb;color:#92400e}
    .review-errors-btn{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:.8rem 1rem;border:1px solid #fecaca;border-radius:9px;background:#fff;color:#b91c1c;font:inherit;font-weight:800;cursor:pointer}
    .review-errors-btn:hover{background:#fef2f2}
    .diagnostic-conversion{margin-top:1.35rem;padding:1.55rem;border:1px solid #a7f3d0;border-radius:18px;background:linear-gradient(135deg,#ecfdf5 0%,#f0fdfa 100%)}
    .diagnostic-conversion-kicker{margin:0 0 .35rem;color:#047857;font-size:.78rem;font-weight:850;letter-spacing:.08em;text-transform:uppercase}
    .diagnostic-conversion h3{margin:0;color:#102a43;font-size:clamp(1.25rem,3vw,1.6rem);letter-spacing:-.025em}
    .diagnostic-conversion-copy{margin:.55rem 0 1rem;color:#4b6475;line-height:1.65}
    .diagnostic-conversion-summary{display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:1.05rem}
    .diagnostic-conversion-chip{padding:.38rem .65rem;border:1px solid #a7f3d0;border-radius:999px;background:#fff;color:#166534;font-size:.82rem;font-weight:750}
    .diagnostic-conversion-actions{display:flex;gap:.65rem;flex-wrap:wrap;align-items:center}
    .diagnostic-conversion-primary,.diagnostic-conversion-secondary{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:.8rem 1rem;border-radius:10px;text-decoration:none;font-weight:850}
    .diagnostic-conversion-primary{background:#047857;color:#fff;box-shadow:0 8px 20px rgba(4,120,87,.16)}
    .diagnostic-conversion-primary:hover,.diagnostic-conversion-primary:focus-visible{background:#065f46;color:#fff}
    .diagnostic-conversion-secondary{border:1px solid #a7f3d0;background:#fff;color:#102a43}
    .diagnostic-conversion-secondary:hover,.diagnostic-conversion-secondary:focus-visible{background:#f8fafc;color:#102a43}
    .diagnostic-conversion-note{margin:.75rem 0 0;color:#64748b;font-size:.78rem;line-height:1.5}
  `;
  document.head.appendChild(style);

  function clearFeedback() {
    document.querySelectorAll('.answer').forEach(label => label.classList.remove('diagnostic-correct','diagnostic-wrong','diagnostic-skipped'));
    document.querySelectorAll('.answer-feedback').forEach(node => node.remove());
    document.getElementById('reviewErrorsButton')?.remove();
    document.getElementById('diagnosticConversion')?.remove();
  }

  function pageText(id) {
    return document.getElementById(id)?.textContent?.trim() || '';
  }

  function extractArea(id) {
    const value = pageText(id);
    return value.split('. Tady')[0].trim() || value;
  }

  function currentTest() {
    const path = window.location.pathname.endsWith('/') ? window.location.pathname : `${window.location.pathname}/`;
    return TESTS[path] || {
      name: 'Diagnostika matematiky',
      goal: 'matematiku',
      secondaryLabel: 'Individuální konzultace',
      secondaryHref: '/#kontakt'
    };
  }

  function buildMailto(test, score, percent, weak, strong) {
    const subject = `Diagnostika – ${test.name} – 4týdenní plán`;
    const body = [
      'Dobrý den,',
      '',
      `vyplnil/a jsem diagnostiku „${test.name}“ na vojtechsteidl.eu a rád/a bych získal/a krátký 4týdenní plán přípravy.`,
      '',
      `Výsledek: ${score}${percent ? ` (${percent})` : ''}`,
      `Nejslabší oblast: ${weak || '—'}`,
      `Nejsilnější oblast: ${strong || '—'}`,
      '',
      'Můj cíl / termín:',
      'Co mi dělá největší problém:',
      '',
      'Děkuji.'
    ].join('\n');
    return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  function renderConversion() {
    const results = document.getElementById('results');
    if (!results || !results.classList.contains('show')) return;

    document.getElementById('diagnosticConversion')?.remove();
    const test = currentTest();
    const score = pageText('scoreValue') || '—';
    const percent = pageText('scorePercent');
    const weak = extractArea('weakText');
    const strong = extractArea('strongText');

    const card = document.createElement('section');
    card.id = 'diagnosticConversion';
    card.className = 'diagnostic-conversion';
    card.setAttribute('aria-label', 'Další krok po diagnostice');

    const kicker = document.createElement('p');
    kicker.className = 'diagnostic-conversion-kicker';
    kicker.textContent = 'Výsledek už máš. Teď z něj vytěž maximum.';

    const heading = document.createElement('h3');
    heading.textContent = 'Získej zdarma konkrétní 4týdenní plán přípravy';

    const copy = document.createElement('p');
    copy.className = 'diagnostic-conversion-copy';
    copy.textContent = `Pošli mi výsledek diagnostiky a stručně napiš svůj cíl. Navrhnu, co řešit jako první, v jakém pořadí a kde má smysl přidat cílenou přípravu na ${test.goal}.`;

    const summary = document.createElement('div');
    summary.className = 'diagnostic-conversion-summary';
    const scoreChip = document.createElement('span');
    scoreChip.className = 'diagnostic-conversion-chip';
    scoreChip.textContent = `Výsledek: ${score}${percent ? ` · ${percent}` : ''}`;
    summary.appendChild(scoreChip);
    if (weak) {
      const weakChip = document.createElement('span');
      weakChip.className = 'diagnostic-conversion-chip';
      weakChip.textContent = `Priorita: ${weak}`;
      summary.appendChild(weakChip);
    }

    const actions = document.createElement('div');
    actions.className = 'diagnostic-conversion-actions';
    const primary = document.createElement('a');
    primary.className = 'diagnostic-conversion-primary';
    primary.href = buildMailto(test, score, percent, weak, strong);
    primary.textContent = 'Chci 4týdenní plán zdarma';
    const secondary = document.createElement('a');
    secondary.className = 'diagnostic-conversion-secondary';
    secondary.href = test.secondaryHref;
    secondary.textContent = test.secondaryLabel;
    actions.append(primary, secondary);

    const note = document.createElement('p');
    note.className = 'diagnostic-conversion-note';
    note.textContent = `Kliknutí pouze otevře předvyplněný e-mail. Výsledek se automaticky nikam neodesílá. Pokud se poštovní aplikace neotevře, napiš na ${CONTACT_EMAIL}.`;

    card.append(kicker, heading, copy, summary, actions, note);
    const host = results.querySelector('.result-hero') || results.querySelector('.test-wrap') || results;
    const disclaimer = host.querySelector('.disclaimer');
    if (disclaimer) host.insertBefore(card, disclaimer);
    else host.appendChild(card);
  }

  function renderFeedback() {
    clearFeedback();
    let errorCount = 0;
    document.querySelectorAll('.question[data-correct]').forEach(question => {
      const correct = question.dataset.correct;
      const selected = question.querySelector('input[type="radio"]:checked');
      if (!selected) return;
      const correctInput = question.querySelector(`input[type="radio"][value="${CSS.escape(correct)}"]`);
      const correctLabel = correctInput ? correctInput.closest('.answer') : null;
      const selectedLabel = selected.closest('.answer');
      const feedback = document.createElement('div');
      feedback.className = 'answer-feedback';

      if (selected.value === correct) {
        selectedLabel?.classList.add('diagnostic-correct');
        feedback.classList.add('ok');
        feedback.textContent = 'Správně.';
      } else if (selected.value === 'skip') {
        errorCount += 1;
        selectedLabel?.classList.add('diagnostic-skipped');
        correctLabel?.classList.add('diagnostic-correct');
        feedback.classList.add('skip');
        feedback.textContent = `Přeskočeno. Správná odpověď: ${correctLabel?.querySelector('span')?.textContent?.trim() || 'viz zeleně zvýrazněná možnost'}.`;
      } else {
        errorCount += 1;
        selectedLabel?.classList.add('diagnostic-wrong');
        correctLabel?.classList.add('diagnostic-correct');
        feedback.classList.add('bad');
        feedback.textContent = `Chyba. Správná odpověď: ${correctLabel?.querySelector('span')?.textContent?.trim() || 'viz zeleně zvýrazněná možnost'}.`;
      }
      question.appendChild(feedback);
    });

    const actions = document.querySelector('.result-actions');
    if (actions && errorCount > 0) {
      const button = document.createElement('button');
      button.type = 'button';
      button.id = 'reviewErrorsButton';
      button.className = 'review-errors-btn';
      button.textContent = `Projít konkrétní chyby (${errorCount})`;
      button.addEventListener('click', () => {
        const firstError = document.querySelector('.diagnostic-wrong, .diagnostic-skipped');
        firstError?.closest('.question')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      actions.prepend(button);
    }

    renderConversion();
  }

  const form = document.getElementById('diagnosticForm');
  if (form) {
    form.addEventListener('submit', () => {
      window.setTimeout(() => {
        const results = document.querySelector('.results');
        if (!results || results.classList.contains('show')) renderFeedback();
      }, 0);
    });
  }

  const reset = document.getElementById('resetButton');
  if (reset) reset.addEventListener('click', clearFeedback);

  window.DiagnosticFeedback = { renderFeedback, clearFeedback };
})();