/**
 * Guardrail chat — lapisan pengaman TAMBAHAN berbasis pola.
 *
 * PENTING: filter pola (regex + kata kunci) BUKAN jaminan sempurna.
 * Penyerang dapat memakai parafrase, bahasa lain, atau teknik baru yang tidak
 * tercakup di sini, sedangkan pertanyaan sah kadang bisa tertolak (false positive).
 * Lapisan utama tetap: system instruction yang membatasi peran model, pemisahan
 * data dari instruksi, serta API key yang hanya ada di backend.
 *
 * Modul ini tidak mencatat (log) isi pesan pengguna maupun kredensial apa pun.
 */

const MAX_MESSAGE_LENGTH = 4000; // selaras dengan maxlength textarea di views/assistant.ejs

const PESAN = {
  tipeTidakValid: "Pertanyaan harus berupa teks.",
  kosong: "Pertanyaan tidak boleh kosong.",
  terlaluPanjang: `Pertanyaan terlalu panjang. Maksimal ${MAX_MESSAGE_LENGTH} karakter.`,
  promptInjection:
    "Maaf, permintaan tersebut tidak dapat saya proses karena terindikasi mencoba mengubah atau mengungkap aturan sistem. " +
    "Silakan ajukan pertanyaan seputar Catatan Aksesibilitas Web.",
  diLuarTopik:
    "Maaf, saya hanya dapat membantu topik Catatan Aksesibilitas Web, seperti prinsip POUR, semantic HTML, " +
    "ulasan jurnal, dan produk pada website ini. Silakan ajukan pertanyaan seputar topik tersebut."
};

const PLACEHOLDER_DISARING = "[teks disaring karena terindikasi instruksi tersembunyi]";

// ---------------------------------------------------------------------------
// Normalisasi teks
// ---------------------------------------------------------------------------

const ZERO_WIDTH = /[\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF]/g;
// Karakter kontrol kecuali tab (\u0009), newline (\u000A), carriage return (\u000D).
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const COMBINING_MARKS = /[\u0300-\u036F]/g;

function stripInvisible(text) {
  return String(text ?? "").replace(ZERO_WIDTH, "").replace(CONTROL_CHARS, "");
}

// Huruf kecil, tanpa diakritik/zero-width, spasi horizontal dirapikan, newline dipertahankan.
function normalizeBase(text) {
  return String(text ?? "")
    .normalize("NFKD")
    .replace(COMBINING_MARKS, "")
    .replace(ZERO_WIDTH, "")
    .replace(CONTROL_CHARS, "")
    .toLowerCase()
    .replace(/[^\S\n]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function toFlat(base) {
  return base.replace(/\n/g, " ").replace(/ {2,}/g, " ");
}

const LEET_MAP = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", "$": "s" };

function foldLeet(text) {
  return text.replace(/[013457@$]/g, (char) => LEET_MAP[char]);
}

// "i g n o r e" -> "ignore"
function collapseSpacedLetters(text) {
  return text.replace(/\b(?:[a-z][ .\-_*]){3,}[a-z]\b/g, (match) => match.replace(/[ .\-_*]/g, ""));
}

// ---------------------------------------------------------------------------
// Deteksi prompt injection
// ---------------------------------------------------------------------------

// target "flat"  : dicocokkan ke teks satu baris (varian asli, leet, dan huruf terpisah)
// target "base"  : dicocokkan ke teks yang masih mempertahankan newline (penanda role/delimiter)
const INJECTION_PATTERNS = [
  {
    kategori: "abaikan_instruksi",
    regex: /\b(?:ignore|disregard|forget|override)\s+(?:(?:all|any|every|the|your|my|these|those|this|that|of|previous|prior|earlier|above|preceding|initial|original|system|safety|security|other|and|everything)\s+){1,6}(?:instructions?|prompts?|rules?|guidelines?|directives?|constraints?|programming|polic(?:y|ies)|commands?)\b/
  },
  {
    kategori: "abaikan_instruksi",
    regex: /\b(?:forget|ignore|disregard)\s+(?:everything|anything|all)\s+(?:above|before|prior|previously|so far|you (?:know|were told|have been told|learned))\b/
  },
  {
    kategori: "abaikan_instruksi",
    regex: /\b(?:abaikan(?:lah)?|lupakan(?:lah)?|kesampingkan|hiraukan|acuhkan|langgar)\s+(?:(?:semua|segala|seluruh|setiap|aturan|instruksi|perintah|petunjuk|arahan|sebelumnya|di atas|diatas|tadi|awal|sistem|keamanan|kamu|mu|anda|yang|dan|atau|ini|itu|para|dari|pada)\s+){0,6}(?:instruksi|perintah|aturan|petunjuk|arahan|prompt|batasan|pedoman|kebijakan|pengaturan)\b/
  },
  {
    kategori: "abaikan_instruksi",
    regex: /\b(?:lupakan|abaikan)\s+(?:semua|segala|apa)\s+(?:yang\s+)?(?:di atas|diatas|sebelumnya|tadi|kamu|anda|telah|sudah)\b/
  },
  {
    kategori: "abaikan_instruksi",
    regex: /\b(?:abaikan|lupakan)(?:lah)?\s+(?:semua|segala|seluruh|apa)\s+(?:\w+\s+){0,3}(?:sebelumnya|tadi|di atas|diatas)\b/
  },
  {
    kategori: "abaikan_instruksi",
    regex: /\b(?:ignore|disregard|forget)\s+(?:what|everything|anything)\s+(?:you(?:'ve| have| were| had)?\s+)?(?:been\s+)?(?:told|said|instructed|taught|given)\b/
  },
  {
    kategori: "abaikan_instruksi",
    regex: /\bjangan\s+(?:ikuti|patuhi|turuti|gunakan)\s+(?:\w+\s+){0,2}(?:instruksi|aturan|perintah|prompt)\s+(?:sebelumnya|sistem|awal|di atas|diatas|tadi)\b/
  },
  {
    kategori: "ubah_peran",
    regex: /\b(?:you are now|you're now|you will now be|from now on,? you(?:'re| are| will| must| should)?|pretend (?:to be|you are|you're|that you)|act as if you (?:are|have|were)|imagine you (?:are|have no|can)|roleplay as|role-play as)\b/
  },
  {
    kategori: "ubah_peran",
    regex: /\b(?:mulai sekarang,? (?:kamu|anda|engkau)|sekarang (?:kamu|anda|engkau) (?:adalah|menjadi|jadi|bukan|bebas|tidak)|(?:kamu|anda|engkau) (?:sekarang|kini) (?:adalah|menjadi|jadi|bebas|bukan)|(?:berpura-?pura|pura-?pura) (?:menjadi|jadi|kamu|anda|bahwa|sebagai)|anggap (?:saja )?(?:dirimu|kamu|anda) (?:adalah|sebagai|bukan|bebas)|bayangkan (?:kamu|anda) (?:adalah|tidak|bebas))\b/
  },
  {
    kategori: "jailbreak",
    regex: /\b(?:do anything now|jailbreak(?:ed|ing|s)?|developer mode|dev mode|god mode|sudo mode|unrestricted mode|unfiltered mode|mode (?:developer|pengembang|tanpa batas|tanpa filter|bebas|dewa))\b/
  },
  {
    kategori: "hapus_batasan",
    regex: /\b(?:without|remove|disable|turn off|switch off|lift)\s+(?:(?:any|all|your|the|safety|content|ethical|security)\s+)*(?:restrictions?|filters?|guardrails?|limitations?|censorship|safeguards?)\b/
  },
  {
    kategori: "hapus_batasan",
    regex: /\b(?:tanpa|hilangkan|matikan|nonaktifkan|singkirkan|lepaskan|cabut)\s+(?:(?:semua|segala|seluruh|setiap|batasan|pembatasan|aturan|filter|sensor|pengaman|keamanan|etika|kamu|mu|anda|yang|dan)\s+)*(?:batasan|pembatasan|filter|sensor|pengaman|guardrail|larangan|moderasi)\b/
  },
  {
    kategori: "ungkap_prompt",
    regex: /\b(?:(?:system|developer)\s+(?:prompt|instruction|message)s?|(?:hidden|secret|initial|original)\s+(?:prompt|instructions?)|prompt\s+(?:sistem|awal|rahasia|tersembunyi)|instruksi\s+(?:sistem|awal|rahasia|tersembunyi|internal|pengembang)|aturan\s+(?:internal|rahasia|tersembunyi)|instruksimu|promptmu|aturanmu|perintahmu|konfigurasimu)\b/
  },
  {
    kategori: "ungkap_prompt",
    regex: /\b(?:reveal|show|print|repeat|display|leak|tell me|give me|output|recite|dump)\b.{0,30}\byour\s+(?:instructions?|prompt|rules|guidelines|configuration|setup|programming|system)\b/
  },
  {
    kategori: "ungkap_prompt",
    regex: /\b(?:tampilkan|ungkap(?:kan)?|tunjukkan|bocorkan|beberkan|ulangi|sebutkan|cetak|tuliskan|berikan|kasih)\b.{0,30}\b(?:instruksi|aturan|prompt|konfigurasi|pengaturan|perintah)\s+(?:kamu|anda|awalmu|sistemmu)\b/
  },
  {
    kategori: "ekstraksi_rahasia",
    regex: /\b(?:gemini[\s_-]?api[\s_-]?key|google[\s_-]?api[\s_-]?key|process\.env|db[\s_-]?pass(?:word)?|db[\s_-]?user)\b/
  },
  {
    kategori: "ekstraksi_rahasia",
    regex: /\b(?:show|reveal|print|display|give|tell|leak|send|share|read|dump|expose|list|what(?:'s| is| are)|tampilkan|ungkap(?:kan)?|bocorkan|berikan|kirim(?:kan)?|beri tahu|beritahu|sebutkan|bagikan|baca|apa(?: itu| isi| saja)?|cetak)\b.{0,50}\b(?:api[\s_-]?keys?|secret[\s_-]?keys?|access[\s_-]?tokens?|auth(?:entication)?[\s_-]?tokens?|bearer[\s_-]?tokens?|kunci[\s_-]?api|token[\s_-]?akses|credentials?|kredensial|connection[\s_-]?strings?|environment[\s_-]?variables?|variabel[\s_-]?lingkungan|env[\s_-]?file|file[\s_-]?\.?env|(?:database|server|admin)[\s_-]?(?:password|passwd|pass)|kata[\s_-]?sandi[\s_-]?(?:database|server|admin))\b/
  },
  {
    kategori: "instruksi_baru",
    regex: /\b(?:new|updated|revised|real|actual|hidden|secret)\s+(?:instructions?|rules?|directives?|orders?)\s*(?::|-|=)/
  },
  {
    kategori: "instruksi_baru",
    regex: /\b(?:instruksi|perintah|aturan|tugas)\s+(?:baru|terbaru|sebenarnya|asli|rahasia|tambahan)\s*(?::|-|=)/
  },
  {
    kategori: "encoding_evasion",
    regex: /\b(?:base64|rot13|hex(?:adecimal)?|binary|morse|encoded|encrypted|obfuscated)\b.{0,50}\b(?:instructions?|prompts?|commands?|perintah|instruksi|execute|follow|run|jalankan|ikuti|lakukan)\b/
  },
  {
    kategori: "encoding_evasion",
    regex: /\b(?:decode|decrypt|deobfuscate|dekode|dekripsi)\b.{0,40}\b(?:and|then|lalu|kemudian|terus)\s+(?:follow|execute|run|obey|jalankan|ikuti|turuti|patuhi|lakukan)\b/
  },
  // --- Penanda role/delimiter palsu (dicocokkan pada teks yang mempertahankan newline) ---
  {
    kategori: "delimiter_palsu",
    target: "base",
    regex: /^\s*(?:system|assistant|developer|model)\s*:/m
  },
  {
    kategori: "delimiter_palsu",
    target: "base",
    regex: /\[\s*\/?\s*(?:system|inst|instructions?|sys)\s*\]/
  },
  {
    kategori: "delimiter_palsu",
    target: "base",
    regex: /<\s*\/?\s*(?:system|assistant|developer|instructions?|prompt|data_[a-z_]+)\b[^>]*>/
  },
  {
    kategori: "delimiter_palsu",
    target: "base",
    regex: /<\|\s*(?:im_start|im_end|system|endoftext)\s*\|>/
  },
  {
    kategori: "delimiter_palsu",
    target: "base",
    regex: /^\s*#{2,}\s*(?:system|instructions?|new instructions?)\b/m
  },
  {
    kategori: "delimiter_palsu",
    target: "base",
    regex: /```\s*(?:system|instructions?)\b/
  }
];

/**
 * @param {string} text
 * @returns {{ terdeteksi: boolean, kategori: string[] }}
 */
function detectPromptInjection(text) {
  const base = normalizeBase(text);
  if (!base) return { terdeteksi: false, kategori: [] };

  const flat = toFlat(base);
  const varianFlat = [flat];
  const leet = foldLeet(flat);
  if (leet !== flat) varianFlat.push(leet);
  const spasiDirapatkan = collapseSpacedLetters(leet);
  if (spasiDirapatkan !== leet) varianFlat.push(spasiDirapatkan);

  const kategori = new Set();
  for (const { kategori: nama, regex, target = "flat" } of INJECTION_PATTERNS) {
    const sasaran = target === "base" ? [base] : varianFlat;
    if (sasaran.some((teks) => regex.test(teks))) kategori.add(nama);
  }

  return { terdeteksi: kategori.size > 0, kategori: [...kategori] };
}

// ---------------------------------------------------------------------------
// Filter topik: Catatan Aksesibilitas Web
// ---------------------------------------------------------------------------

// Istilah KUAT: satu kemunculan sudah cukup menandakan topik relevan.
const ISTILAH_KUAT = [
  "aksesibilitas", "aksesibel", "accessibility", "accessible", "a11y", "wcag", "wai-aria", "aria",
  "perceivable", "operable", "understandable", "prinsip pour", "pour principle",
  "screen reader", "screenreader", "pembaca layar", "assistive", "teknologi bantu",
  "disabilitas", "difabel", "tunanetra", "tunarungu", "buta warna", "color blind", "colorblind",
  "low vision", "gangguan penglihatan", "gangguan pendengaran", "deaf", "pengguna tuli", "penyandang tuli",
  "alt text", "teks alternatif", "kontras warna", "color contrast",
  "semantic html", "html semantic", "html semantik", "semantik html",
  "skip link", "focus indicator", "indikator fokus", "fokus keyboard", "keyboard focus",
  "navigasi keyboard", "keyboard navigation", "tab order", "urutan tab", "landmark",
  "nvda", "voiceover", "talkback", "caption", "transkrip", "closed caption",
  "jurnal", "ulasan", "daniel dang", "citrenz", "doi",
  "catatan aksesibilitas", "a11ylab", "produk", "katalog", "template audit"
];

// Istilah LEMAH: hanya dihitung bila minimal dua istilah berbeda muncul bersamaan.
const ISTILAH_LEMAH = [
  "html", "css", "javascript", "js", "web", "website", "situs", "antarmuka", "interface",
  "keyboard", "papan ketik", "fokus", "focus", "label", "form", "formulir", "tombol", "button",
  "heading", "tautan", "link", "warna", "kontras", "navigasi", "tabel", "table",
  "semantik", "semantic", "responsif", "responsive", "inklusif", "inclusive",
  "prinsip", "pour", "robust", "standar", "browser", "mouse", "layar", "pengujian",
  "usability", "ux", "ui"
];

const SUFIKS_UMUM = "(?:s|nya|lah|kah|ku|mu)?(?![a-z])";

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildKeywordRegex(terms, flags = "") {
  const bagian = terms.map((term) => escapeRegex(term).replace(/ /g, "\\s+"));
  return new RegExp(`(?<![a-z0-9])(?:${bagian.join("|")})${SUFIKS_UMUM}`, flags);
}

const REGEX_KUAT = buildKeywordRegex(ISTILAH_KUAT);
const REGEX_LEMAH = buildKeywordRegex(ISTILAH_LEMAH, "g");

// "POUR" huruf kapital dipakai sebagai akronim; "pour" (menuang) tidak dihitung kuat.
const REGEX_POUR_KAPITAL = /\bPOUR\b/;

// Pesan yang hanya berisi sapaan/basa-basi.
const REGEX_SAPAAN = /^(?:(?:halo|hai|hi|hello|hey|assalamualaikum|selamat\s+(?:pagi|siang|sore|malam)|terima\s+kasih|makasih|thanks|thank\s+you|ok|oke|baik|ya|dong|kak|min|asisten|bot|ai)[\s!.,?~]*)+$/;

// Pertanyaan singkat tentang kemampuan asisten.
const REGEX_BANTUAN = /^(?:(?:kamu|anda|kau)\s+)?(?:bisa|dapat)\s+(?:apa|bantu\s+apa)|^apa\s+(?:yang\s+)?(?:bisa|dapat)\s+(?:kamu|anda)\s+(?:bantu|lakukan)|^(?:siapa|apa)\s+(?:kamu|anda)\b|^what\s+can\s+you\s+do|^who\s+are\s+you|^bantuan\b|^help\b/;

/**
 * @param {string} text
 * @returns {{ sesuai: boolean, alasan: string, skor: { kuat: boolean, lemah: number } }}
 */
function checkTopik(text) {
  const asli = String(text ?? "");
  const flat = toFlat(normalizeBase(asli));
  const kuat = REGEX_KUAT.test(flat) || REGEX_POUR_KAPITAL.test(asli);
  const lemah = new Set(flat.match(REGEX_LEMAH) || []).size;
  const skor = { kuat, lemah };

  if (kuat || lemah >= 2) return { sesuai: true, alasan: "ok", skor };

  if (flat.length <= 60) {
    if (REGEX_SAPAAN.test(flat)) return { sesuai: true, alasan: "sapaan", skor };
    if (REGEX_BANTUAN.test(flat)) return { sesuai: true, alasan: "bantuan", skor };
  }

  return { sesuai: false, alasan: "di_luar_topik", skor };
}

// ---------------------------------------------------------------------------
// Evaluasi pesan pengguna (titik masuk utama untuk controller)
// ---------------------------------------------------------------------------

/**
 * Format hasil selalu sama:
 * {
 *   diizinkan: boolean,
 *   jenis: "diizinkan" | "input_tidak_valid" | "ditolak",
 *   alasan: "ok" | "sapaan" | "bantuan" | "tipe_tidak_valid" | "kosong" | "terlalu_panjang"
 *           | "prompt_injection" | "di_luar_topik",
 *   pesanBersih: string,          // aman diteruskan ke model bila diizinkan
 *   pesanPenolakan: string|null,  // teks untuk pengguna bila tidak diizinkan
 *   kategori: string[]            // kategori pola yang cocok (untuk pemantauan; tanpa isi pesan)
 * }
 *
 * Saran pemakaian: jenis "input_tidak_valid" -> HTTP 400; jenis "ditolak" -> penolakan
 * sopan (status ditentukan pemilik route chat).
 *
 * @param {unknown} pesan
 * @returns {object}
 */
function evaluatePesan(pesan) {
  const hasil = (diizinkan, jenis, alasan, pesanBersih, pesanPenolakan, kategori = []) => ({
    diizinkan,
    jenis,
    alasan,
    pesanBersih,
    pesanPenolakan,
    kategori
  });

  if (typeof pesan !== "string") {
    return hasil(false, "input_tidak_valid", "tipe_tidak_valid", "", PESAN.tipeTidakValid);
  }

  const bersih = stripInvisible(pesan).replace(/\r\n?/g, "\n").replace(/\n{3,}/g, "\n\n").trim();

  if (!bersih) {
    return hasil(false, "input_tidak_valid", "kosong", "", PESAN.kosong);
  }

  if (bersih.length > MAX_MESSAGE_LENGTH) {
    return hasil(false, "input_tidak_valid", "terlalu_panjang", "", PESAN.terlaluPanjang);
  }

  const injeksi = detectPromptInjection(bersih);
  if (injeksi.terdeteksi) {
    return hasil(false, "ditolak", "prompt_injection", "", PESAN.promptInjection, injeksi.kategori);
  }

  const topik = checkTopik(bersih);
  if (!topik.sesuai) {
    return hasil(false, "ditolak", "di_luar_topik", "", PESAN.diLuarTopik);
  }

  return hasil(true, "diizinkan", topik.alasan, bersih, null);
}

// ---------------------------------------------------------------------------
// Sanitasi data tidak tepercaya (mis. nama/deskripsi produk dari database)
// ---------------------------------------------------------------------------

/**
 * Membersihkan teks yang akan dimasukkan ke dalam konteks prompt sebagai DATA.
 * - karakter tak terlihat/kontrol dibuang
 * - bila terindikasi instruksi tersembunyi, seluruh teks diganti placeholder
 * - tanda < > ` dibuang agar tidak dapat memalsukan tag/blok penutup
 * - dipotong sesuai batas panjang
 */
function sanitizeUntrustedText(value, { maxLength = 300, singleLine = true } = {}) {
  let teks = stripInvisible(String(value ?? "")).slice(0, 2000);

  if (detectPromptInjection(teks).terdeteksi) return PLACEHOLDER_DISARING;

  teks = singleLine ? teks.replace(/\s+/g, " ") : teks.replace(/\r\n?/g, "\n");
  teks = teks.replace(/[<>`]/g, "").trim();

  if (teks.length > maxLength) {
    teks = `${teks.slice(0, Math.max(maxLength - 1, 0)).trimEnd()}…`;
  }
  return teks;
}

// ---------------------------------------------------------------------------
// Redaksi rahasia pada teks keluaran (opsional dipakai sebelum mengirim balasan)
// ---------------------------------------------------------------------------

const REDAKSI = "[disembunyikan]";

function redactSecrets(text) {
  let hasil = String(text ?? "");

  // Nilai rahasia yang sedang dipakai aplikasi (tidak pernah dicetak/di-log di sini).
  for (const nama of ["GEMINI_API_KEY", "DB_PASS"]) {
    const nilai = process.env[nama];
    if (typeof nilai === "string" && nilai.length >= 8) {
      hasil = hasil.split(nilai).join(REDAKSI);
    }
  }

  return hasil
    .replace(/AIza[0-9A-Za-z_-]{35}/g, REDAKSI)
    .replace(/\bBearer\s+[A-Za-z0-9._~+/-]{20,}=*/gi, `Bearer ${REDAKSI}`)
    .replace(/postgres(?:ql)?:\/\/\S+/gi, REDAKSI)
    .replace(
      /\b((?:api[_-]?key|secret|token|password|passwd|pwd)\s*[:=]\s*)(["']?)[^\s"']+\2/gi,
      `$1${REDAKSI}`
    );
}

module.exports = {
  MAX_MESSAGE_LENGTH,
  PESAN,
  evaluatePesan,
  detectPromptInjection,
  checkTopik,
  sanitizeUntrustedText,
  redactSecrets
};