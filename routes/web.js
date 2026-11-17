const express = require("express");
const homeController = require("../controllers/homeController");
const produkController = require("../controllers/produkController");
const assistantController = require("../controllers/assistantController");

const router = express.Router();

// Halaman utama
router.get("/", homeController.index);

// Ulasan jurnal
router.get("/ulasan", homeController.ulasan);

// AI Assistant
router.get("/assistant", assistantController.index);

// CRUD Produk
router.get("/produk", produkController.index);
router.get("/produk/tambah", produkController.tambah);
router.get("/produk/:id/edit", produkController.edit);

module.exports = router;