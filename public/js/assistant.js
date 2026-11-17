document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("assistant-form");
  const input = document.getElementById("message");
  const messages = document.getElementById("chat-messages");
  const status = document.getElementById("assistant-status");
  const sendButton = document.getElementById("send-button");

  if (!form || !input || !messages || !status || !sendButton) {
    return;
  }

  // Frontend hanya memanggil backend sendiri. API key dan pemanggilan
  // Gemini hanya ada di server (POST /api/chat).
  const CHAT_ENDPOINT = "/api/chat";
  const REQUEST_TIMEOUT_MS = 60000;
  const BUTTON_LABEL = sendButton.textContent.trim();
  const READY_TEXT = status.textContent.trim();

  const LABELS = {
    user: "Anda",
    assistant: "AI Assistant",
    error: "Kesalahan"
  };

  let isSending = false;
  let loadingBubble = null;

  function scrollToBottom() {
    messages.scrollTop = messages.scrollHeight;
  }

  function createBubble(role, extraClass) {
    const wrapper = document.createElement("div");
    wrapper.className =
      role === "user"
        ? "message user-message"
        : "message assistant-message";

    if (extraClass) {
      wrapper.classList.add(extraClass);
    }

    const label = document.createElement("span");
    label.className = "message-label";
    label.textContent = LABELS[role] || LABELS.assistant;

    const content = document.createElement("div");
    content.className = "message-content";

    wrapper.appendChild(label);
    wrapper.appendChild(content);

    return { wrapper, content };
  }

  // role: "user" | "assistant" | "error"
  function addMessage(role, text) {
    const bubbleRole = role === "error" ? "error" : role;
    const { wrapper, content } = createBubble(
      bubbleRole,
      role === "error" ? "error-message" : ""
    );

    // textContent agar balasan tidak pernah diinterpretasikan sebagai HTML.
    content.textContent = text;

    messages.appendChild(wrapper);
    scrollToBottom();
  }

  function showLoading() {
    const { wrapper, content } = createBubble("assistant", "loading-message");

    // Status loading diumumkan lewat #assistant-status, jadi bubble ini
    // disembunyikan dari screen reader agar tidak diumumkan dua kali.
    wrapper.setAttribute("aria-hidden", "true");

    for (let i = 0; i < 3; i += 1) {
      const dot = document.createElement("span");
      dot.className = "loading-dot";
      content.appendChild(dot);
    }

    const text = document.createElement("span");
    text.className = "loading-text";
    text.textContent = "AI sedang menjawab…";
    content.appendChild(text);

    messages.appendChild(wrapper);
    loadingBubble = wrapper;
    scrollToBottom();
  }

  function hideLoading() {
    if (loadingBubble) {
      loadingBubble.remove();
      loadingBubble = null;
    }
  }

  function setSending(sending) {
    isSending = sending;
    sendButton.disabled = sending;
    sendButton.textContent = sending ? "Mengirim..." : BUTTON_LABEL;
  }

  function fallbackMessage(statusCode) {
    if (statusCode === 400) return "Pertanyaan tidak valid.";
    if (statusCode === 404) return "Layanan chat belum tersedia di server.";
    if (statusCode === 429) {
      return "Terlalu banyak permintaan. Silakan coba beberapa saat lagi.";
    }
    if (statusCode >= 500) {
      return "Server sedang bermasalah. Silakan coba lagi nanti.";
    }
    return "Terjadi kesalahan saat memproses pertanyaan.";
  }

  async function readJson(response) {
    const raw = await response.text();

    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch (parseError) {
      return null;
    }
  }

  async function requestReply(message) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(CHAT_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ message }),
        signal: controller.signal
      });

      const result = await readJson(response);

      if (!response.ok || !result || result.success !== true) {
    const serverMessage =
        result && typeof result.message === "string"
        ? result.message.trim()
          : "";

    throw new Error(
        serverMessage || fallbackMessage(response.status)
    );
    }

      const reply =
        result.data && (result.data.balasan ?? result.data.reply);

      if (typeof reply !== "string" || !reply.trim()) {
        throw new Error("Format jawaban dari server tidak sesuai.");
      }

      return reply;
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error("Permintaan terlalu lama. Silakan coba lagi.");
      }

      if (error instanceof TypeError) {
        throw new Error(
          "Tidak dapat terhubung ke server. Periksa koneksi Anda."
        );
      }

      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    // Cegah kirim ganda (misalnya Enter ditekan berulang saat loading).
    if (isSending) return;

    const message = input.value.trim();

    // Cegah submit kosong atau hanya berisi spasi.
    if (!message) {
      input.value = "";
      input.setAttribute("aria-invalid", "true");
      status.textContent = "Pertanyaan tidak boleh kosong.";
      input.focus();
      return;
    }

    input.removeAttribute("aria-invalid");
    setSending(true);
    status.textContent = "AI sedang menjawab…";

    addMessage("user", message);
    showLoading();

    try {
      const reply = await requestReply(message);

      hideLoading();
      addMessage("assistant", reply);

      input.value = "";
      status.textContent = "Jawaban diterima.";
    } catch (error) {
      console.error("Assistant request failed:", error.message);

      hideLoading();

      // Pesan lengkap muncul di bubble error (diumumkan oleh area log);
      // status dibuat singkat agar tidak diumumkan dua kali.
      addMessage("error", error.message);

      // Teks pertanyaan dipertahankan agar pengguna bisa mencoba lagi.
      status.textContent = "Terjadi kesalahan.";
    } finally {
      setSending(false);
      input.focus();
    }
  });

  // Enter = kirim, Shift+Enter = baris baru. Abaikan Enter saat IME aktif.
  input.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || event.shiftKey) return;
    if (event.isComposing || event.keyCode === 229) return;

    event.preventDefault();

    if (typeof form.requestSubmit === "function") {
      form.requestSubmit();
    } else {
      form.dispatchEvent(
        new Event("submit", { cancelable: true, bubbles: true })
      );
    }
  });

  input.addEventListener("input", () => {
    if (input.hasAttribute("aria-invalid") && input.value.trim()) {
      input.removeAttribute("aria-invalid");
      status.textContent = READY_TEXT;
    }
  });
});