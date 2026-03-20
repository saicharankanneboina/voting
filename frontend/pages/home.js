import { showToast } from "../services/api.js";

export function renderHomePage() {
  const resultsBtn = document.getElementById("hero-results-btn");
  if (!resultsBtn) return;

  resultsBtn.addEventListener("click", () => {
    showToast("Open the Elections page to browse ended elections and view published results.");
    window.location.href = "/elections";
  });
}
