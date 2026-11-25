const geminiConfigPath = require.resolve("../../../config/gemini");
const geminiServicePath = require.resolve("../../../services/geminiService");

function loadGeminiServiceWithMock(mockGetGeminiClient) {
  delete require.cache[geminiServicePath];
  require.cache[geminiConfigPath] = {
    id: geminiConfigPath,
    filename: geminiConfigPath,
    loaded: true,
    exports: {
      GEMINI_MODEL: "gemini-test-model",
      getGeminiClient: mockGetGeminiClient
    }
  };
  return require("../../../services/geminiService");
}

describe("Unit Test - geminiService", () => {
  const originalConfigCache = require.cache[geminiConfigPath];

  afterEach(() => {
    vi.restoreAllMocks();
    delete require.cache[geminiServicePath];
    if (originalConfigCache) {
      require.cache[geminiConfigPath] = originalConfigCache;
    } else {
      delete require.cache[geminiConfigPath];
    }
  });

  it("melempar GeminiServiceError 400 jika message atau systemInstruction kosong", async () => {
    const { generateReply, GeminiServiceError } = loadGeminiServiceWithMock(vi.fn());

    await expect(
      generateReply({ message: "  ", systemInstruction: "Instruksi" })
    ).rejects.toMatchObject({ name: GeminiServiceError.name, statusCode: 400 });

    await expect(
      generateReply({ message: "Apa itu WCAG?", systemInstruction: "" })
    ).rejects.toMatchObject({ name: GeminiServiceError.name, statusCode: 400 });
  });

  it("melempar status 503 jika GEMINI_API_KEY belum dikonfigurasi", async () => {
    const missingKeyErr = Object.assign(new Error("Missing"), { code: "GEMINI_API_KEY_MISSING" });
    const { generateReply } = loadGeminiServiceWithMock(() => {
      throw missingKeyErr;
    });

    await expect(
      generateReply({ message: "Apa itu WCAG?", systemInstruction: "Instruksi" })
    ).rejects.toMatchObject({ statusCode: 503 });
  });

  it("mengembalikan teks balasan yang sudah di-trim saat request berhasil", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const mockCreate = vi.fn().mockResolvedValue({ output_text: "  WCAG adalah standar aksesibilitas.  " });
    const { generateReply } = loadGeminiServiceWithMock(() => ({
      interactions: { create: mockCreate }
    }));

    const reply = await generateReply({
      message: "Apa itu WCAG?",
      systemInstruction: "Instruksi sistem"
    });

    expect(reply).toBe("WCAG adalah standar aksesibilitas.");
    expect(mockCreate).toHaveBeenCalledWith({
      model: "gemini-test-model",
      input: "Apa itu WCAG?",
      system_instruction: "Instruksi sistem"
    });
  });

  it("melempar status 502 jika Gemini mengembalikan output kosong", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { generateReply } = loadGeminiServiceWithMock(() => ({
      interactions: { create: vi.fn().mockResolvedValue({ output_text: "   " }) }
    }));

    await expect(
      generateReply({ message: "Apa itu WCAG?", systemInstruction: "Instruksi" })
    ).rejects.toMatchObject({ statusCode: 502 });
  });

  it("memetakan error 429 ke status 429 dan error 401/500 ke status 502", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});

    const svc429 = loadGeminiServiceWithMock(() => ({
      interactions: { create: vi.fn().mockRejectedValue({ status: 429, message: "Quota exceeded" }) }
    }));
    await expect(
      svc429.generateReply({ message: "WCAG", systemInstruction: "Sys" })
    ).rejects.toMatchObject({
      statusCode: 429,
      publicMessage: expect.stringContaining("Batas permintaan Gemini tercapai")
    });

    const svc401 = loadGeminiServiceWithMock(() => ({
      interactions: { create: vi.fn().mockRejectedValue({ status: 401, message: "Unauthorized" }) }
    }));
    await expect(
      svc401.generateReply({ message: "WCAG", systemInstruction: "Sys" })
    ).rejects.toMatchObject({
      statusCode: 502,
      publicMessage: expect.stringContaining("API Key Gemini tidak valid")
    });
  });
});