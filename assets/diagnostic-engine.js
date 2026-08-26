(() => {
  const config = window.DIAGNOSTIC_CONFIG || {};
  const form = document.getElementById('diagnosticForm');
  if (!form) return;

  const questions = [...form.querySelectorAll('.question[data-category][data-correct]')];
  const progressFill = document.getElementById('progressFill');
  const progressLabel = document.getElementById('progressLabel');
  const formError = document.getElementById('formError');
  const results = document.getElementById('results');

  function updateProgress() {
    const answered = questions.filter(q => q.querySelector('input[type="radio"]:checked')).length;
    if (progressFill) progressFill.style.width = `${(answered / questions.length) * 100}%`;
    if (progressLabel) progressLabel.textContent = `${answered} / ${questions.length}`;
  }

  function bandFor(score) {
    const bands = config.bands || [
      { min: .8, title: 'Velmi dobrý základ', text: 'Základní aparát máš stabilní. Dává smysl přejít na složitější úlohy a práci pod časem.' },
      { min: .6, title: 'Dobrý základ, ale jsou tam mezery', text: 'Na řadě témat můžeš stavět, několik oblastí ale potřebuje cíleně dopracovat.' },
      { min: .4, title: 'Výkon je zatím nerovnoměrný', text: 'Část základů funguje, část tě stojí zbytečně mnoho času a bodů. Začni nejslabšími oblastmi.' },
      { min: 0, title: 'Začni systematicky od základů', text: 'Největší efekt přinese nejprve stabilizovat základní postupy a teprve potom přidávat obtížnější úlohy.' }
    ];
    const ratio = score / questions.length;
    return bands.find(b => ratio >= b.min) || bands[bands.length - 1];
  }

  function evaluate() {
    const unanswered = questions.filter(q => !q.querySelector('input[type="radio"]:checked'));
    questions.forEach(q => q.classList.toggle('unanswered', unanswered.includes(q)));
    if (unanswered.length) {
      formError?.classList.add('show');
      unanswered[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    formError?.classList.remove('show');

    const categoryScores = {};
    let totalCorrect = 0;
    let totalSkipped = 0;
    questions.forEach(q => {
      const category = q.dataset.category;
      const selected = q.querySelector('input[type="radio"]:checked');
      categoryScores[category] ||= { correct: 0, total: 0 };
      categoryScores[category].total += 1;
      if (selected.value === q.dataset.correct) {
        categoryScores[category].correct += 1;
        totalCorrect += 1;
      }
      if (selected.value === 'skip') totalSkipped += 1;
    });

    const percent = Math.round((totalCorrect / questions.length) * 100);
    document.getElementById('scoreValue').textContent = `${totalCorrect}/${questions.length}`;
    document.getElementById('scorePercent').textContent = `${percent} %`;

    const band = bandFor(totalCorrect);
    document.getElementById('resultTitle').textContent = band.title;
    document.getElementById('resultText').textContent = band.text + (totalSkipped >= 3 ? ` Přeskočil/a jsi ${totalSkipped} úlohy, takže je potřeba trénovat i rychlou identifikaci postupu.` : '');

    const breakdown = document.getElementById('breakdown');
    breakdown.innerHTML = '';
    Object.entries(categoryScores).forEach(([key, value]) => {
      const pct = Math.round((value.correct / value.total) * 100);
      const row = document.createElement('div');
      row.className = 'breakdown-row';
      row.innerHTML = `<strong>${config.labels?.[key] || key}</strong><div class="bar"><span style="width:${pct}%"></span></div><div class="breakdown-score">${value.correct}/${value.total}</div>`;
      breakdown.appendChild(row);
    });

    const ranked = Object.entries(categoryScores).sort((a,b) => (a[1].correct / a[1].total) - (b[1].correct / b[1].total));
    const weakRatio = ranked[0][1].correct / ranked[0][1].total;
    const strongRatio = ranked[ranked.length - 1][1].correct / ranked[ranked.length - 1][1].total;
    const weakest = ranked.filter(([,v]) => v.correct / v.total === weakRatio).map(([k]) => config.labels?.[k] || k);
    const strongest = ranked.filter(([,v]) => v.correct / v.total === strongRatio).map(([k]) => config.labels?.[k] || k);
    document.getElementById('weakText').textContent = `${weakest.join(' + ')}. Tady má cílené procvičování nejvyšší prioritu.`;
    document.getElementById('strongText').textContent = `${strongest.join(' + ')}. Tady už máš relativně stabilní základ.`;

    const firstWeak = weakest[0];
    const nextText = typeof config.nextStep === 'function'
      ? config.nextStep({ totalCorrect, totalSkipped, percent, firstWeak, weakest, strongest })
      : `Začni oblastí „${firstWeak}“ a ověř ji na několika nových úlohách bez nápovědy. Potom diagnostiku zopakuj nebo přejdi na celý test.`;
    document.getElementById('nextText').textContent = nextText;

    results?.classList.add('show');
    window.DiagnosticFeedback?.renderFeedback();
    results?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  form.addEventListener('change', updateProgress);
  form.addEventListener('submit', event => { event.preventDefault(); evaluate(); });
  document.getElementById('resetButton')?.addEventListener('click', () => {
    form.reset();
    questions.forEach(q => q.classList.remove('unanswered'));
    formError?.classList.remove('show');
    results?.classList.remove('show');
    window.DiagnosticFeedback?.clearFeedback();
    updateProgress();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  updateProgress();
})();