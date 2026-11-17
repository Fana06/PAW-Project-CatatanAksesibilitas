document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("assistant-form");
  const input = document.getElementById("message");
  const messages = document.getElementById("chat-messages");
  const status = document.getElementById("assistant-status");
  const sendButton = document.getElementById("send-button");

  if (!form || !input || !messages || !status || !sendButton) {
    return;
  }

  function addMessage(role, content) {
    const wrapper = document.createElement("div");

    wrapper.className =
      role === "user"
        ? "message user-message"
        : "message assistant-message";

    const label = document.createElement("span");
    label.className = "message-label";
    label.textContent =
      role === "user" ? "Anda" : "AI Assistant";

    const messageContent = document.createElement("div");
    messageContent.className = "message-content";

    // Gunakan textContent agar output tidak dieksekusi sebagai HTML.
    messageContent.textContent = content;

    wrapper.appendChild(label);
    wrapper.appendChild(messageContent);

    messages.appendChild(wrapper);

    messages.scrollTop = messages.scrollHeight;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const pesan = input.value.trim();

    if (!pesan) {
      status.textContent = "Pertanyaan tidak boleh kosong.";
      return;
    }

    sendButton.disabled = true;
    input.disabled = true;

    sendButton.textContent = "Mengirim...";
    status.textContent = "Sedang memproses pertanyaan...";

    addMessage("user", pesan);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },

        body: JSON.stringify({
          pesan: pesan
        })
      });

      const result = await response.json();

      if (!response.ok || result.sukses !== true) {
        throw new Error(
          result.pesan || "Terjadi kesalahan pada server."
        );
      }

      const balasan = result.data?.balasan;

      if (typeof balasan !== "string" || !balasan.trim()) {
        throw new Error(
          "Format jawaban dari server tidak sesuai."
        );
      }

      addMessage("assistant", balasan);

      input.value = "";

      status.textContent = "Jawaban berhasil diterima.";

    } catch (error) {
      console.error("Assistant request failed:", error.message);

      status.textContent = error.message;

      addMessage(
        "assistant",
        "Maaf, pertanyaan belum dapat diproses. Silakan coba kembali."
      );

    } finally {
      sendButton.disabled = false;
      input.disabled = false;

      sendButton.textContent = "Kirim Pertanyaan";

      input.focus();
    }
  });
});