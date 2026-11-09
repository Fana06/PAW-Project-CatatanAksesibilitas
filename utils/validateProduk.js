function validateProduk(body = {}) {
  const data = {
    nama: String(body.nama || "").trim(),
    kategori: String(body.kategori || "").trim(),
    harga: Number(body.harga),
    deskripsi: String(body.deskripsi || "").trim()
  };

  const errors = {};

  if (!data.nama) errors.nama = "Nama produk wajib diisi.";
  else if (data.nama.length > 120) errors.nama = "Nama maksimal 120 karakter.";

  if (!data.kategori) errors.kategori = "Kategori wajib diisi.";
  else if (data.kategori.length > 80) errors.kategori = "Kategori maksimal 80 karakter.";

  if (
    body.harga === undefined ||
    String(body.harga).trim() === "" ||
    !Number.isFinite(data.harga) ||
    data.harga < 0
  ) {
    errors.harga = "Harga harus berupa angka nol atau lebih.";
  }

  if (!data.deskripsi) errors.deskripsi = "Deskripsi wajib diisi.";

  return { data, errors };
}

module.exports = { validateProduk };
