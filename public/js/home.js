async function loadStatus() {
  const output = document.querySelector("#status-output");
  const label = document.querySelector("#status-label");
  if (!output || !label) return;

  try {
    const response = await fetch("/api/status");
    if (!response.ok) throw new Error("Status server tidak dapat dimuat.");

    const data = await response.json();
    output.textContent = JSON.stringify(data, null, 2);
    label.textContent = "Server berjalan";
    label.classList.add("is-online");
  } catch (error) {
    output.textContent = error.message;
    label.textContent = "Tidak terhubung";
    label.classList.add("is-offline");
  }
}

const feedbackForm = document.querySelector("#feedback-form");
if (feedbackForm) {
  feedbackForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!feedbackForm.reportValidity()) return;

    const status = document.querySelector("#feedback-status");
    status.hidden = false;
    status.textContent = "Form berhasil divalidasi. Ini masih simulasi dan pesan belum disimpan.";
  });
}

loadStatus();
