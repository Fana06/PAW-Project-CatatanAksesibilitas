require("dotenv").config();

const express = require("express");
const path = require("path");
const config = require("./config");
const logger = require("./middlewares/logger");
const routes = require("./routes");
const { sequelize } = require("./models");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(logger);
app.use(routes);

app.use((req, res) => {
  if (req.originalUrl.startsWith("/api")) {
    return res.status(404).json({ sukses: false, pesan: "Endpoint tidak ditemukan." });
  }
  return res.status(404).send("Halaman tidak ditemukan.");
});

app.use((error, req, res, next) => {
  console.error("[ERROR]", error);
  if (req.originalUrl.startsWith("/api")) {
    return res.status(500).json({ sukses: false, pesan: "Terjadi kesalahan pada server." });
  }
  return res.status(500).send("Terjadi kesalahan pada server.");
});

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("[DATABASE] Koneksi PostgreSQL berhasil.");

    await sequelize.sync();
    console.log("[DATABASE] Tabel berhasil diperiksa.");

    app.listen(config.port, () => {
      console.log(`\n${config.appName} berjalan di http://localhost:${config.port}`);
      console.log("Endpoint: /api/status dan /api/produk\n");
    });
  } catch (error) {
    console.error("[DATABASE] Koneksi gagal:", error.message);
    process.exitCode = 1;
  }
}

if (require.main === module) startServer();

module.exports = app;
module.exports.startServer = startServer;
