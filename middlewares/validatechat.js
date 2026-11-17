const MAX_MESSAGE_LENGTH = 500;

function badRequest(res, message) {
  return res.status(400).json({ success: false, message });
}

/**
 * Validasi body POST /api/chat.
 * - message wajib bertipe string
 * - tidak boleh kosong (setelah trim)
 * - maksimal 500 karakter (dihitung per karakter, bukan per code unit UTF-16)
 *
 * Isi pesan tidak dicatat di sini. Pemeriksaan keamanan lanjutan
 * (prompt injection, topik) dilakukan di chatController lewat chatGuardrail.
 */
function validateChat(req, res, next) {
  const body = req.body;
  const message = body && typeof body === "object" ? body.message : undefined;

  if (typeof message !== "string") {
    return badRequest(res, "Pertanyaan harus berupa teks.");
  }

  const trimmed = message.trim();

  if (!trimmed) {
    return badRequest(res, "Pertanyaan tidak boleh kosong.");
  }

  if (Array.from(trimmed).length > MAX_MESSAGE_LENGTH) {
    return badRequest(res, `Pertanyaan terlalu panjang. Maksimal ${MAX_MESSAGE_LENGTH} karakter.`);
  }

  return next();
}

module.exports = validateChat;
module.exports.MAX_MESSAGE_LENGTH = MAX_MESSAGE_LENGTH;