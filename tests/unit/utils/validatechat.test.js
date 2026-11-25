const validateChat = require("../../../middlewares/validatechat");

function createMockRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis()
  };
}

describe("Unit Test - middleware validateChat", () => {
  it("menolak jika message bukan string", () => {
    const req = { body: { message: 12345 } };
    const res = createMockRes();
    const next = vi.fn();

    validateChat(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Pertanyaan harus berupa teks."
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("menolak jika message kosong atau hanya spasi", () => {
    const req = { body: { message: "   " } };
    const res = createMockRes();
    const next = vi.fn();

    validateChat(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Pertanyaan tidak boleh kosong."
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("menolak jika panjang message melebihi 500 karakter", () => {
    const req = { body: { message: "a".repeat(501) } };
    const res = createMockRes();
    const next = vi.fn();

    validateChat(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Pertanyaan terlalu panjang. Maksimal 500 karakter."
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("memanggil next() jika message valid dan tepat di batas 500 karakter", () => {
    const req = { body: { message: "a".repeat(500) } };
    const res = createMockRes();
    const next = vi.fn();

    validateChat(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});