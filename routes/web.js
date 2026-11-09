const express = require("express");
const homeController = require("../controllers/homeController");
const produkController = require("../controllers/produkController");
const router = express.Router();

router.get("/", homeController.index);
router.get("/ulasan", homeController.ulasan);
router.get("/produk", produkController.index);
router.get("/produk/tambah", produkController.tambah);
router.get("/produk/:id/edit", produkController.edit);

module.exports = router;
