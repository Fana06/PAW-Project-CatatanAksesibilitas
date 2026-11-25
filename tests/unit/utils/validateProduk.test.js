const { validateProduk } = require("../../../utils/validateProduk");
const { validProdukPayload, invalidProdukPayload } = require("../../fixtures/produk");

describe("Unit Test - validateProduk", () => {
  it("meloloskan data valid dan merapikan spasi serta tipe angka", () => {
    const { data, errors } = validateProduk(validProdukPayload);

    expect(errors).toEqual({});
    expect(data).toEqual({
      nama: "Checklist Screen Reader",
      kategori: "Panduan",
      harga: 45000,
      deskripsi: "Langkah uji kompatibilitas NVDA dan VoiceOver."
    });
  });

  it("mengizinkan harga bernilai 0 (produk gratis)", () => {
    const { data, errors } = validateProduk({
      nama: "Panduan Gratis",
      kategori: "E-Book",
      harga: 0,
      deskripsi: "Materi dasar aksesibilitas web."
    });

    expect(errors).toEqual({});
    expect(data.harga).toBe(0);
  });

  it("menolak seluruh field jika body kosong atau tidak valid", () => {
    const { errors } = validateProduk(invalidProdukPayload);

    expect(errors.nama).toBe("Nama produk wajib diisi.");
    expect(errors.kategori).toBe("Kategori wajib diisi.");
    expect(errors.harga).toBe("Harga harus berupa angka nol atau lebih.");
    expect(errors.deskripsi).toBe("Deskripsi wajib diisi.");
  });

  it("menolak nama lebih dari 120 karakter dan kategori lebih dari 80 karakter", () => {
    const { errors } = validateProduk({
      nama: "A".repeat(121),
      kategori: "B".repeat(81),
      harga: "bukan-angka",
      deskripsi: "Valid"
    });

    expect(errors.nama).toBe("Nama maksimal 120 karakter.");
    expect(errors.kategori).toBe("Kategori maksimal 80 karakter.");
    expect(errors.harga).toBe("Harga harus berupa angka nol atau lebih.");
  });
});