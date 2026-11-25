const request = require("supertest");
const app = require("../../app");
const Produk = require("../../models/produkModel");
const geminiService = require("../../services/geminiService");
const { mockProdukList } = require("../fixtures/produk");
const { chatMessages, mockAiReply } = require("../fixtures/chat");

describe("Integration Test - Fitur Chat AI (/api/chat)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("POST /api/chat memproses pertanyaan aksesibilitas dari route hingga Gemini service (200)", async () => {
    vi.spyOn(Produk, "findAll").mockResolvedValue(mockProdukList);
    const geminiSpy = vi.spyOn(geminiService, "generateReply").mockResolvedValue(mockAiReply);

    const res = await request(app)
      .post("/api/chat")
      .send({ message: chatMessages.validStrong });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      data: { reply: mockAiReply }
    });
    expect(geminiSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        message: chatMessages.validStrong,
        systemInstruction: expect.stringContaining("Template Audit WCAG 2.1")
      })
    );
  });

  it("POST /api/chat menolak pesan kosong dan pesan >500 karakter di middleware validateChat (400)", async () => {
    const geminiSpy = vi.spyOn(geminiService, "generateReply");

    const resKosong = await request(app).post("/api/chat").send({ message: "   " });
    expect(resKosong.status).toBe(400);
    expect(resKosong.body.success).toBe(false);

    const resPanjang = await request(app).post("/api/chat").send({ message: "a".repeat(501) });
    expect(resPanjang.status).toBe(400);
    expect(resPanjang.body.message).toContain("Maksimal 500 karakter");

    expect(geminiSpy).not.toHaveBeenCalled();
  });

  it("POST /api/chat menolak pesan off-topic dan prompt injection lewat guardrail tanpa memanggil Gemini", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const geminiSpy = vi.spyOn(geminiService, "generateReply");

    const resOffTopic = await request(app)
      .post("/api/chat")
      .send({ message: chatMessages.offTopic });
    expect(resOffTopic.status).toBe(200);
    expect(resOffTopic.body.success).toBe(true);
    expect(resOffTopic.body.data.reply).toContain("Catatan Aksesibilitas Web");

    const resInjection = await request(app)
      .post("/api/chat")
      .send({ message: chatMessages.injectionEn });
    expect(resInjection.status).toBe(200);
    expect(resInjection.body.data.reply).toContain("mengubah atau mengungkap aturan sistem");

    expect(geminiSpy).not.toHaveBeenCalled();
  });

  it("POST /api/chat tetap berjalan (200) walau database produk gagal diakses", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(Produk, "findAll").mockRejectedValue(new Error("DB offline"));
    const geminiSpy = vi.spyOn(geminiService, "generateReply").mockResolvedValue(mockAiReply);

    const res = await request(app)
      .post("/api/chat")
      .send({ message: chatMessages.validStrong });

    expect(res.status).toBe(200);
    expect(geminiSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        systemInstruction: expect.stringContaining('status="tidak_tersedia"')
      })
    );
  });

  it("POST /api/chat meneruskan status 429 saat kuota Gemini tercapai", async () => {
    vi.spyOn(Produk, "findAll").mockResolvedValue([]);
    vi.spyOn(geminiService, "generateReply").mockRejectedValue(
      new geminiService.GeminiServiceError(429, "Batas permintaan Gemini tercapai.")
    );

    const res = await request(app)
      .post("/api/chat")
      .send({ message: chatMessages.validStrong });

    expect(res.status).toBe(429);
    expect(res.body).toEqual({
      success: false,
      message: "Batas permintaan Gemini tercapai."
    });
  });
});