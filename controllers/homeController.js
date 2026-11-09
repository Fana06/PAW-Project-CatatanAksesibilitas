const Produk = require("../models/produkModel");
const PrinsipModel = require("../models/prinsipModel");
const config = require("../config");
const anggota = require("../utils/dataTim");

exports.index = async (req, res, next) => {
  try {
    const produk = await Produk.findAll({
      order: [["id", "ASC"]],
      limit: 3
    });

    res.render("index", {
      judul: `${config.appName} | Beranda`,
      activePage: "home",
      prinsip: PrinsipModel.getAll(),
      produk,
      anggota
    });
  } catch (error) {
    next(error);
  }
};

exports.ulasan = (req, res) => {
  res.render("ulasan", {
    judul: `${config.appName} | Ulasan Jurnal`,
    activePage: "review",
    prinsip: PrinsipModel.getAll(),
    anggota
  });
};
