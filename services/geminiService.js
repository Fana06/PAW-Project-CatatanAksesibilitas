
const {
  getGeminiClient,
  GEMINI_MODEL
} = require("../config/gemini");

class GeminiServiceError extends Error {
  constructor(statusCode, publicMessage) {
    super(publicMessage);
    this.name = "GeminiServiceError";
    this.statusCode = statusCode;
    this.publicMessage = publicMessage;
  }
}

// Mengambil HTTP status dari error SDK.
function getStatusCode(error) {
  const candidates = [
    error?.status,
    error?.statusCode,
    error?.response?.status,
    error?.error?.code
  ];

  for (const candidate of candidates) {
    const status = Number(candidate);

    if (Number.isInteger(status) && status >= 400 && status <= 599) {
      return status;
    }
  }

  const match = String(error?.message || "").match(/\b([45]\d{2})\b/);
  return match ? Number(match[1]) : 0;
}

// Menyembunyikan kredensial sebelum error dicetak ke terminal.
function redactSecrets(value) {
  let message = String(value ?? "");

  const secrets = [
    process.env.GEMINI_API_KEY,
    process.env.DB_PASS,
    process.env.DATABASE_URL
  ].filter(Boolean);

  for (const secret of secrets) {
    message = message.split(secret).join("[REDACTED]");
  }

  return message
    .replace(/AIza[0-9A-Za-z_-]{20,}/g, "[REDACTED]")
    .replace(
      /Bearer\s+[A-Za-z0-9._~+/-]{20,}=*/gi,
      "Bearer [REDACTED]"
    );
}

// Pesan aman yang dikembalikan kepada frontend.
function getPublicErrorMessage(status) {
  if (status === 400) {
    return "Gemini menolak format request. Periksa model dan konfigurasi request.";
  }

  if (status === 401 || status === 403) {
    return "API Key Gemini tidak valid atau tidak memiliki akses.";
  }

  if (status === 404) {
    return "Model Gemini tidak ditemukan. Periksa GEMINI_MODEL.";
  }

  if (status === 429) {
    return "Batas permintaan Gemini tercapai. Silakan coba beberapa saat lagi.";
  }

  if (status >= 500) {
    return "Layanan Gemini sedang bermasalah. Silakan coba lagi nanti.";
  }

  return "Gagal menghubungi Gemini. Periksa konfigurasi dan koneksi internet.";
}

/**
 * Mengirim pertanyaan pengguna ke Google Gemini.
 *
 * @param {Object} params
 * @param {string} params.message
 * @param {string} params.systemInstruction
 * @returns {Promise<string>}
 */
async function generateReply({ message, systemInstruction }) {
  if (typeof message !== "string" || !message.trim()) {
    throw new GeminiServiceError(
      400,
      "Pertanyaan tidak boleh kosong."
    );
  }

  if (
    typeof systemInstruction !== "string" ||
    !systemInstruction.trim()
  ) {
    throw new GeminiServiceError(
      400,
      "System Instruction tidak tersedia."
    );
  }

  let client;

  // Memastikan API Key tersedia.
  try {
    client = getGeminiClient();
  } catch (error) {
    if (error.code === "GEMINI_API_KEY_MISSING") {
      throw new GeminiServiceError(
        503,
        "API Key Gemini belum dikonfigurasi di server."
      );
    }

    throw error;
  }

  try {
    console.log("[GEMINI] Mengirim request...");
    console.log("[GEMINI] Model:", GEMINI_MODEL);

    // Memanggil Gemini melalui Interactions API.
    const interaction = await client.interactions.create({
      model: GEMINI_MODEL,
      input: message.trim(),
      system_instruction: systemInstruction
    });

    const reply =
      typeof interaction?.output_text === "string"
        ? interaction.output_text.trim()
        : "";

    if (!reply) {
      console.error("[GEMINI] Response tidak memiliki output teks.");

      throw new GeminiServiceError(
        502,
        "Gemini tidak menghasilkan jawaban. Silakan coba lagi."
      );
    }

    console.log("[GEMINI] Request berhasil.");

    return reply;

  } catch (error) {
    // Jangan membungkus ulang error yang sudah memiliki pesan aman.
    if (error instanceof GeminiServiceError) {
      throw error;
    }

    const status = getStatusCode(error);
    const detail = redactSecrets(error?.message || error);

    // Detail error hanya dicetak ke terminal backend.
    // Isi pesan pengguna dan API Key tidak dicetak.
    console.error(
      "[GEMINI] Request gagal. HTTP status:",
      status || "tidak diketahui"
    );

    console.error(
      "[GEMINI] Detail error:",
      detail.slice(0, 1500)
    );

    throw new GeminiServiceError(
      status === 429 ? 429 : status === 400 || status === 401 || status === 403 || status === 404 ? 502 : 502,
      getPublicErrorMessage(status)
    );
  }
}

module.exports = {
  generateReply,
  GeminiServiceError
};
