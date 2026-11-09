const config = require("../config");
const anggota = require("../utils/dataTim");

exports.index = (req, res) => {
  res.render("produk/index", {
    judul: `${config.appName} | Kelola Produk`,
    activePage: "products",
    pesan: req.query.pesan || null,
    anggota
  });
};

exports.tambah = (req, res) => {
  res.render("produk/form", {
    judul: `${config.appName} | Tambah Produk`,
    activePage: "products",
    mode: "tambah",
    id: "",
    anggota
  });
};

exports.edit = (req, res) => {
  res.render("produk/form", {
    judul: `${config.appName} | Edit Produk`,
    activePage: "products",
    mode: "edit",
    id: req.params.id,
    anggota
  });
};
