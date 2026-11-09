const Produk = require("../models/produkModel");
const config = require("../config");
const { validateProduk } = require("../utils/validateProduk");

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

exports.status = (req, res) => {
  res.status(200).json({
    status: "ok",
    aplikasi: config.appName,
    uptimeDetik: Math.round(process.uptime()),
    waktuServer: new Date().toISOString()
  });
};

// Format array tetap dipakai agar integrasi Fetch API sebelumnya tetap kompatibel.
exports.produk = async (req, res) => {
  try {
    const data = await Produk.findAll({ order: [["id", "ASC"]] });
    res.status(200).json(data);
  } catch (error) {
    console.error("GET /api/produk:", error.message);
    res.status(500).json({ sukses: false, pesan: "Gagal mengambil data produk." });
  }
};

exports.detailProduk = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ sukses: false, pesan: "ID harus berupa angka positif." });

    const data = await Produk.findByPk(id);
    if (!data) return res.status(404).json({ sukses: false, pesan: "Produk tidak ditemukan." });

    res.status(200).json({ sukses: true, data });
  } catch (error) {
    console.error("GET detail produk:", error.message);
    res.status(500).json({ sukses: false, pesan: "Gagal mengambil detail produk." });
  }
};

exports.tambahProduk = async (req, res) => {
  try {
    const { data, errors } = validateProduk(req.body);
    if (Object.keys(errors).length) {
      return res.status(400).json({
        sukses: false,
        pesan: "Data produk belum lengkap atau tidak valid.",
        errors
      });
    }

    const produkBaru = await Produk.create(data);
    res.status(201).json({
      sukses: true,
      pesan: "Produk berhasil ditambahkan.",
      data: produkBaru
    });
  } catch (error) {
    console.error("POST /api/produk:", error.message);
    res.status(500).json({ sukses: false, pesan: "Produk gagal ditambahkan." });
  }
};

exports.ubahProduk = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ sukses: false, pesan: "ID harus berupa angka positif." });

    const produk = await Produk.findByPk(id);
    if (!produk) return res.status(404).json({ sukses: false, pesan: "Produk tidak ditemukan." });

    const { data, errors } = validateProduk(req.body);
    if (Object.keys(errors).length) {
      return res.status(400).json({
        sukses: false,
        pesan: "Data produk belum lengkap atau tidak valid.",
        errors
      });
    }

    await produk.update(data);
    res.status(200).json({
      sukses: true,
      pesan: "Produk berhasil diperbarui.",
      data: produk
    });
  } catch (error) {
    console.error("PUT /api/produk:", error.message);
    res.status(500).json({ sukses: false, pesan: "Produk gagal diperbarui." });
  }
};

exports.hapusProduk = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ sukses: false, pesan: "ID harus berupa angka positif." });

    const produk = await Produk.findByPk(id);
    if (!produk) return res.status(404).json({ sukses: false, pesan: "Produk tidak ditemukan." });

    await produk.destroy();
    res.status(200).json({
      sukses: true,
      pesan: "Produk berhasil dihapus.",
      data: { id }
    });
  } catch (error) {
    console.error("DELETE /api/produk:", error.message);
    res.status(500).json({ sukses: false, pesan: "Produk gagal dihapus." });
  }
};
