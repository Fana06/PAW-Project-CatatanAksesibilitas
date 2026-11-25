const apiController = require("../../../controllers/apiController");
const Produk = require("../../../models/produkModel");
const { mockProdukList, validProdukPayload, invalidProdukPayload } = require("../../fixtures/produk");

function createMockRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis()
  };
}

describe("Unit Test - apiController", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("status mengembalikan 200 dengan status ok", () => {
    const res = createMockRes();
    apiController.status({}, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: "ok" }));
  });

  it("produk mengembalikan daftar produk atau 500 jika DB error", async () => {
    vi.spyOn(Produk, "findAll").mockResolvedValue(mockProdukList);
    const resOk = createMockRes();
    await apiController.produk({}, resOk);
    expect(resOk.status).toHaveBeenCalledWith(200);
    expect(resOk.json).toHaveBeenCalledWith(mockProdukList);

    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(Produk, "findAll").mockRejectedValue(new Error("DB error"));
    const resErr = createMockRes();
    await apiController.produk({}, resErr);
    expect(resErr.status).toHaveBeenCalledWith(500);
  });

  it("detailProduk menangani ID tidak valid (400), tidak ditemukan (404), dan sukses (200)", async () => {
    const res400 = createMockRes();
    await apiController.detailProduk({ params: { id: "abc" } }, res400);
    expect(res400.status).toHaveBeenCalledWith(400);

    vi.spyOn(Produk, "findByPk").mockResolvedValueOnce(null);
    const res404 = createMockRes();
    await apiController.detailProduk({ params: { id: "99" } }, res404);
    expect(res404.status).toHaveBeenCalledWith(404);

    vi.spyOn(Produk, "findByPk").mockResolvedValueOnce(mockProdukList[0]);
    const res200 = createMockRes();
    await apiController.detailProduk({ params: { id: "1" } }, res200);
    expect(res200.status).toHaveBeenCalledWith(200);
    expect(res200.json).toHaveBeenCalledWith({ sukses: true, data: mockProdukList[0] });
  });

  it("tambahProduk menolak data invalid (400) dan menyimpan data valid (201)", async () => {
    const res400 = createMockRes();
    await apiController.tambahProduk({ body: invalidProdukPayload }, res400);
    expect(res400.status).toHaveBeenCalledWith(400);

    const created = { id: 3, ...validProdukPayload };
    vi.spyOn(Produk, "create").mockResolvedValue(created);
    const res201 = createMockRes();
    await apiController.tambahProduk({ body: validProdukPayload }, res201);
    expect(res201.status).toHaveBeenCalledWith(201);
    expect(res201.json).toHaveBeenCalledWith(expect.objectContaining({ sukses: true, data: created }));
  });

  it("ubahProduk dan hapusProduk memperbarui serta menghapus data yang ditemukan", async () => {
    const instance = {
      ...mockProdukList[0],
      update: vi.fn().mockResolvedValue(true),
      destroy: vi.fn().mockResolvedValue(true)
    };
    vi.spyOn(Produk, "findByPk").mockResolvedValue(instance);

    const resPut = createMockRes();
    await apiController.ubahProduk({ params: { id: "1" }, body: validProdukPayload }, resPut);
    expect(instance.update).toHaveBeenCalledTimes(1);
    expect(resPut.status).toHaveBeenCalledWith(200);

    const resDel = createMockRes();
    await apiController.hapusProduk({ params: { id: "1" } }, resDel);
    expect(instance.destroy).toHaveBeenCalledTimes(1);
    expect(resDel.status).toHaveBeenCalledWith(200);
    expect(resDel.json).toHaveBeenCalledWith(expect.objectContaining({ sukses: true, data: { id: 1 } }));
  });
});