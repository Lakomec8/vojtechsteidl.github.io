(() => {
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
  `;
  document.head.appendChild(style);

  function clearFeedback() {
    document.querySelectorAll('.answer').forEach(label => label.classList.remove('diagnostic-correct','diagnostic-wrong','diagnostic-skipped'));
    document.querySelectorAll('.answer-feedback').forEach(node => node.remove());
  }

  function renderFeedback() {
    clearFeedback();
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
        selectedLabel?.classList.add('diagnostic-skipped');
        correctLabel?.classList.add('diagnostic-correct');
        feedback.classList.add('skip');
        feedback.textContent = `Přeskočeno. Správná odpověď: ${correctLabel?.querySelector('span')?.textContent?.trim() || 'viz zeleně zvýrazněná možnost'}.`;
      } else {
        selectedLabel?.classList.add('diagnostic-wrong');
        correctLabel?.classList.add('diagnostic-correct');
        feedback.classList.add('bad');
        feedback.textContent = `Chyba. Správná odpověď: ${correctLabel?.querySelector('span')?.textContent?.trim() || 'viz zeleně zvýrazněná možnost'}.`;
      }
      question.appendChild(feedback);
    });
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