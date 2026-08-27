(function () {
  const container = document.getElementById("paymentContent");
  if (!container) return;

  const applyStableQr = () => {
    if (!container.textContent.includes("400 Kč")) return;
    container.querySelectorAll("img").forEach((image) => {
      image.src = "/assets/payment-400.svg?v=20260827-3";
    });
  };

  const observer = new MutationObserver(applyStableQr);
  observer.observe(container, { childList: true, subtree: true });
  applyStableQr();
  setTimeout(applyStableQr, 0);
})();
