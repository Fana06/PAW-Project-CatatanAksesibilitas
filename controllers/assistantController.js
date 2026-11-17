const config = require("../config");
const anggota = require("../utils/dataTim");

exports.index = (req, res) => {
  res.render("assistant", {
    judul: `${config.appName} | AI Assistant`,
    activePage: "assistant",
    anggota
  });
};