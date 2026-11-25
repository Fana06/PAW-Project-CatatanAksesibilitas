const request = require("supertest");
const app = require("../../app");
const Produk = require("../../models/produkModel");
const { mockProdukList, validProdukPayload, invalidProdukPayload } = require("../fixtures/produk");

describe("Integration Test - CRUD Endpoint /api/produk", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("GET /api/produk mengembalikan array daftar produk (200)", async () => {
    vi.spyOn(Produk, "findAll").mockResolvedValue(mockProdukList);

    const res = await request(app).get("/api/produk");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockProdukList);
  });

  it("GET /api/produk/:id mengembalikan detail (200), 400 untuk ID invalid, dan 404 jika kosong", async () => {
    vi.spyOn(Produk, "findByPk").mockResolvedValueOnce(mockProdukList[0]);
    const ok = await request(app).get("/api/produk/1");
    expect(ok.status).toBe(200);
    expect(ok.body).toEqual({ sukses: true, data: mockProdukList[0] });

    const bad = await request(app).get("/api/produk/bukan-angka");
    expect(bad.status).toBe(400);

    vi.spyOn(Produk, "findByPk").mockResolvedValueOnce(null);
    const notFound = await request(app).get("/api/produk/999");
    expect(notFound.status).toBe(404);
  });

  it("POST /api/produk menambahkan produk valid (201) dan menolak payload invalid (400)", async () => {
    const created = {
      id: 3,
      nama: "Checklist Screen Reader",
      kategori: "Panduan",
      harga: 45000,
      deskripsi: "Langkah uji kompatibilitas NVDA dan VoiceOver."
    };
    vi.spyOn(Produk, "create").mockResolvedValue(created);

    const resOk = await request(app).post("/api/produk").send(validProdukPayload);
    expect(resOk.status).toBe(201);
    expect(resOk.body.sukses).toBe(true);
    expect(resOk.body.data).toEqual(created);

    const resBad = await request(app).post("/api/produk").send(invalidProdukPayload);
    expect(resBad.status).toBe(400);
    expect(resBad.body.sukses).toBe(false);
    expect(resBad.body.errors).toHaveProperty("nama");
  });

  it("PUT /api/produk/:id memperbarui produk (200) dan menolak jika tidak ditemukan (404)", async () => {
    const mockRow = {
      ...mockProdukList[0],
      update: vi.fn().mockImplementation(function (newData) {
        Object.assign(this, newData);
        return Promise.resolve(this);
      })
    };
    vi.spyOn(Produk, "findByPk").mockResolvedValueOnce(mockRow);

    const resOk = await request(app).put("/api/produk/1").send(validProdukPayload);
    expect(resOk.status).toBe(200);
    expect(resOk.body.sukses).toBe(true);
    expect(resOk.body.data.nama).toBe("Checklist Screen Reader");

    vi.spyOn(Produk, "findByPk").mockResolvedValueOnce(null);
    const res404 = await request(app).put("/api/produk/999").send(validProdukPayload);
    expect(res404.status).toBe(404);
  });

  it("DELETE /api/produk/:id menghapus produk (200) dan mengembalikan 404 jika tidak ditemukan", async () => {
    const mockRow = { id: 1, destroy: vi.fn().mockResolvedValue(true) };
    vi.spyOn(Produk, "findByPk").mockResolvedValueOnce(mockRow);

    const resOk = await request(app).delete("/api/produk/1");
    expect(resOk.status).toBe(200);
    expect(resOk.body).toEqual({
      sukses: true,
      pesan: "Produk berhasil dihapus.",
      data: { id: 1 }
    });

    vi.spyOn(Produk, "findByPk").mockResolvedValueOnce(null);
    const res404 = await request(app).delete("/api/produk/999");
    expect(res404.status).toBe(404);
  });
});