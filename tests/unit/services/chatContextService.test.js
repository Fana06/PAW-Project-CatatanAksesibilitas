const {
  MAX_PRODUK,
  getProduk,
  buildChatContext
} = require("../../../services/chatContextService");
const { mockProdukList } = require("../../fixtures/produk");

describe("Unit Test - chatContextService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("mengambil produk dengan status 'tersedia' dan memformat harga", async () => {
    const fakeProdukModel = {
      findAll: vi.fn().mockResolvedValue([
        { get: () => mockProdukList[0] },
        { ...mockProdukList[1], harga: "tidak-valid" }
      ])
    };

    const hasil = await getProduk({ produkModel: fakeProdukModel });

    expect(hasil.status).toBe("tersedia");
    expect(hasil.terpotong).toBe(false);
    expect(hasil.daftar).toHaveLength(2);
    expect(hasil.daftar[0].hargaTeks).toContain("Rp50.000");
    expect(hasil.daftar[1].harga).toBeNull();
    expect(hasil.daftar[1].hargaTeks).toBe("tidak tersedia");
  });

  it("menangani katalog kosong dengan status 'kosong'", async () => {
    const fakeProdukModel = { findAll: vi.fn().mockResolvedValue([]) };

    const hasil = await buildChatContext({
      produkModel: fakeProdukModel,
      now: new Date("2026-11-25T00:00:00.000Z")
    });

    expect(hasil.metadata.produkStatus).toBe("kosong");
    expect(hasil.metadata.dibuatPada).toBe("2026-11-25T00:00:00.000Z");
    expect(hasil.teks).toContain('status="kosong"');
  });

  it("menandai terpotong jika jumlah produk melebihi MAX_PRODUK", async () => {
    const banyakProduk = Array.from({ length: MAX_PRODUK + 1 }, (_, i) => ({
      id: i + 1,
      nama: `Produk ${i + 1}`,
      kategori: "Audit",
      harga: 10000,
      deskripsi: "Deskripsi"
    }));
    const fakeProdukModel = { findAll: vi.fn().mockResolvedValue(banyakProduk) };

    const hasil = await buildChatContext({ produkModel: fakeProdukModel });

    expect(hasil.metadata.produkTerpotong).toBe(true);
    expect(hasil.data.produk).toHaveLength(MAX_PRODUK);
    expect(hasil.metadata.peringatan).toContain(`Daftar produk dibatasi ${MAX_PRODUK} item.`);
  });

  it("melakukan fallback 'tidak_tersedia' tanpa melempar error jika database gagal", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const fakeProdukModel = {
      findAll: vi.fn().mockRejectedValue(new Error("Connection refused"))
    };

    const hasil = await buildChatContext({ produkModel: fakeProdukModel });

    expect(hasil.metadata.produkStatus).toBe("tidak_tersedia");
    expect(hasil.metadata.peringatan).toContain("Data produk tidak dapat diambil dari database.");
    expect(hasil.systemInstruction).toContain("DATA REFERENSI");
  });
});