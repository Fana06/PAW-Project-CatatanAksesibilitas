const defaultGuardrail = require("../services/chatGuardrail");
const defaultContextService = require("../services/chatContextService");

const PESAN = {
  internal: "Terjadi kesalahan pada server. Silakan coba lagi nanti.",
  layananAiTidakTersedia: "Layanan AI belum tersedia di server. Silakan coba lagi nanti.",
  balasanKosong: "Layanan AI tidak mengembalikan jawaban. Silakan coba lagi."
};

// geminiService dimuat saat request datang, bukan saat startup, agar aplikasi dan
// fitur lama tetap berjalan walaupun service/SDK-nya belum tersedia di server.
function defaultLoadGeminiService() {
  return require("../services/geminiService");
}

function sendSuccess(res, reply) {
  return res.status(200).json({ success: true, data: { reply } });
}

function sendError(res, statusCode, message) {
  return res.status(statusCode).json({ success: false, message });
}

// GeminiServiceError membawa statusCode dan publicMessage yang aman ditampilkan.
function isServiceError(error) {
  return (
    Boolean(error) &&
    typeof error.publicMessage === "string" &&
    Number.isInteger(error.statusCode) &&
    error.statusCode >= 400 &&
    error.statusCode <= 599
  );
}

/**
 * Membuat handler POST /api/chat. Dependensi dapat diganti untuk pengujian.
 *
 * Alur: guardrail -> konteks -> Gemini -> redaksi rahasia -> JSON.
 * Format sukses : { success: true, data: { reply } }
 * Format gagal  : { success: false, message }
 */
function createChatHandler({
  guardrail = defaultGuardrail,
  contextService = defaultContextService,
  loadGeminiService = defaultLoadGeminiService
} = {}) {
  const redact = (value) => guardrail.redactSecrets(String(value ?? ""));

  return async function chat(req, res) {
    try {
      const hasil = guardrail.evaluatePesan(req.body && req.body.message);

      if (hasil.jenis === "input_tidak_valid") {
        return sendError(res, 400, hasil.pesanPenolakan);
      }

      if (!hasil.diizinkan) {
        // Penolakan sopan (off-topic / terindikasi prompt injection) dikirim sebagai
        // balasan asisten agar tampil wajar di UI. Yang dicatat hanya alasan dan
        // kategori pola, tidak pernah isi pesan pengguna.
        const kategori = hasil.kategori.length ? ` (${hasil.kategori.join(", ")})` : "";
        console.warn(`[CHAT] Pesan ditolak guardrail: ${hasil.alasan}${kategori}`);
        return sendSuccess(res, hasil.pesanPenolakan);
      }

      // systemInstruction sudah memuat aturan sistem dan data referensi,
      // jadi konteks tidak dikirim lagi lewat parameter context.
      const { systemInstruction } = await contextService.buildChatContext();
      const geminiService = loadGeminiService();
      const balasan = await geminiService.generateReply({
        message: hasil.pesanBersih,
        systemInstruction
      });

      const reply = typeof balasan === "string" ? redact(balasan).trim() : "";
      if (!reply) {
        return sendError(res, 502, PESAN.balasanKosong);
      }

      return sendSuccess(res, reply);
    } catch (error) {
      if (isServiceError(error)) {
        // geminiService sudah mencatat detail error tanpa rahasia.
        return sendError(res, error.statusCode, error.publicMessage);
      }

      if (error && error.code === "MODULE_NOT_FOUND") {
        console.error("[CHAT] Modul layanan AI tidak dapat dimuat:", redact(error.message));
        return sendError(res, 503, PESAN.layananAiTidakTersedia);
      }

      console.error("[CHAT] Gagal memproses pesan:", redact(error && error.message));
      return sendError(res, 500, PESAN.internal);
    }
  };
}

module.exports = {
  chat: createChatHandler(),
  createChatHandler
};