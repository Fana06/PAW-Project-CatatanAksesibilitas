const { createChatHandler } = require("../../../controllers/chatController");
const { mockAiReply } = require("../../fixtures/chat");

function createMockRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis()
  };
}

describe("Unit Test - chatController", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("mengembalikan 400 jika guardrail menilai input_tidak_valid", async () => {
    const handler = createChatHandler({
      guardrail: {
        evaluatePesan: vi.fn().mockReturnValue({
          diizinkan: false,
          jenis: "input_tidak_valid",
          pesanPenolakan: "Pertanyaan tidak boleh kosong.",
          kategori: []
        }),
        redactSecrets: (v) => v
      }
    });

    const res = createMockRes();
    await handler({ body: { message: "" } }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Pertanyaan tidak boleh kosong."
    });
  });

  it("mengembalikan penolakan sopan (200) tanpa memanggil Gemini saat off-topic/injection", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const loadGeminiService = vi.fn();

    const handler = createChatHandler({
      guardrail: {
        evaluatePesan: vi.fn().mockReturnValue({
          diizinkan: false,
          jenis: "ditolak",
          alasan: "di_luar_topik",
          pesanPenolakan: "Maaf, di luar topik.",
          kategori: []
        }),
        redactSecrets: (v) => v
      },
      loadGeminiService
    });

    const res = createMockRes();
    await handler({ body: { message: "Resep soto" } }, res);

    expect(loadGeminiService).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { reply: "Maaf, di luar topik." }
    });
  });

  it("mengembalikan 200 dengan balasan teredaksi saat pesan valid", async () => {
    const handler = createChatHandler({
      guardrail: {
        evaluatePesan: vi.fn().mockReturnValue({
          diizinkan: true,
          jenis: "diizinkan",
          alasan: "ok",
          pesanBersih: "Apa itu semantic HTML?",
          kategori: []
        }),
        redactSecrets: (v) => v.replace("RAHASIA", "[disembunyikan]")
      },
      contextService: {
        buildChatContext: vi.fn().mockResolvedValue({ systemInstruction: "SYS" })
      },
      loadGeminiService: () => ({
        generateReply: vi.fn().mockResolvedValue(`${mockAiReply} RAHASIA`)
      })
    });

    const res = createMockRes();
    await handler({ body: { message: "Apa itu semantic HTML?" } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { reply: `${mockAiReply} [disembunyikan]` }
    });
  });

  it("menangani balasan kosong (502), service error (429), module hilang (503), dan error umum (500)", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const baseGuardrail = {
      evaluatePesan: vi.fn().mockReturnValue({
        diizinkan: true,
        jenis: "diizinkan",
        pesanBersih: "WCAG",
        kategori: []
      }),
      redactSecrets: (v) => v
    };
    const baseContext = { buildChatContext: vi.fn().mockResolvedValue({ systemInstruction: "SYS" }) };

    // 502 balasan kosong
    const res502 = createMockRes();
    await createChatHandler({
      guardrail: baseGuardrail,
      contextService: baseContext,
      loadGeminiService: () => ({ generateReply: vi.fn().mockResolvedValue("   ") })
    })({ body: { message: "WCAG" } }, res502);
    expect(res502.status).toHaveBeenCalledWith(502);

    // 429 GeminiServiceError
    const res429 = createMockRes();
    await createChatHandler({
      guardrail: baseGuardrail,
      contextService: baseContext,
      loadGeminiService: () => ({
        generateReply: vi.fn().mockRejectedValue({ statusCode: 429, publicMessage: "Limit tercapai" })
      })
    })({ body: { message: "WCAG" } }, res429);
    expect(res429.status).toHaveBeenCalledWith(429);

    // 503 MODULE_NOT_FOUND
    const res503 = createMockRes();
    await createChatHandler({
      guardrail: baseGuardrail,
      contextService: baseContext,
      loadGeminiService: () => {
        throw Object.assign(new Error("Cannot find module"), { code: "MODULE_NOT_FOUND" });
      }
    })({ body: { message: "WCAG" } }, res503);
    expect(res503.status).toHaveBeenCalledWith(503);

    // 500 error tak terduga
    const res500 = createMockRes();
    await createChatHandler({
      guardrail: baseGuardrail,
      contextService: baseContext,
      loadGeminiService: () => ({
        generateReply: vi.fn().mockRejectedValue(new Error("Unexpected"))
      })
    })({ body: { message: "WCAG" } }, res500);
    expect(res500.status).toHaveBeenCalledWith(500);
  });
});