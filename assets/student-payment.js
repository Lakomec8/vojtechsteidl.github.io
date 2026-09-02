(async function () {
  const container = document.getElementById("paymentContent");
  if (!container) return;

  const QR_400 = "data:image/png;base64,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";
  const QR_450 = "data:image/png;base64,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";

  try {
    const response = await fetch("./api/profile", {
      cache: "no-store",
      credentials: "same-origin",
      headers: { "X-Requested-With": "XMLHttpRequest" },
    });
    if (!response.ok) throw new Error("profile request failed");

    const profile = await response.json();
    const studentId = String(profile.studentId || "").toLowerCase();
    const isGroupStudent = studentId === "adam" || studentId === "krystof";
    const isNatalie = studentId === "natalie";
    const amount = isGroupStudent ? 300 : isNatalie ? 400 : 450;
    const qr = isGroupStudent
      ? "/assets/payment-300.svg?v=20260902-1"
      : isNatalie ? QR_400 : QR_450;
    const lessonLabel = isGroupStudent ? "1 skupinová lekce · 60 min" : "1 lekce";
    const paymentText = isGroupStudent
      ? "QR platba je předvyplněná na jednu hodinu za jednoho účastníka."
      : "QR platba je předvyplněná na jednu lekci.";

    container.innerHTML = `
      <div class="payment-layout">
        <div class="payment-copy">
          <span class="badge">${lessonLabel}</span>
          <strong>${amount} Kč</strong>
          <p>${paymentText} Platbu lze poslat také ručně na účet:</p>
          <code>2401739315/2010</code>
          <small>Bez zprávy pro příjemce.</small>
        </div>
        <button class="payment-qr-button" type="button" aria-label="Zvětšit QR platbu">
          <img src="${qr}" alt="QR platba za jednu lekci – ${amount} Kč">
        </button>
      </div>
      <dialog class="payment-dialog">
        <button class="payment-dialog-close" type="button" aria-label="Zavřít">×</button>
        <img src="${qr}" alt="QR platba za jednu lekci – ${amount} Kč">
        <strong>${amount} Kč</strong>
        <span>2401739315/2010</span>
      </dialog>
    `;

    const dialog = container.querySelector(".payment-dialog");
    const qrButton = container.querySelector(".payment-qr-button");
    const closeButton = container.querySelector(".payment-dialog-close");

    qrButton?.addEventListener("click", () => dialog?.showModal());
    closeButton?.addEventListener("click", () => dialog?.close());
    dialog?.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
  } catch (error) {
    container.innerHTML = '<div class="empty">Platební údaje se nepodařilo načíst.</div>';
    console.warn("Platební kartu se nepodařilo načíst.", error);
  }
})();
