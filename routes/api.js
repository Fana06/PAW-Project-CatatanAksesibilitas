const express = require("express");
const controller = require("../controllers/apiController");
const router = express.Router();

router.get("/status", controller.status);
router.get("/produk", controller.produk);
router.get("/produk/:id", controller.detailProduk);
router.post("/produk", controller.tambahProduk);
router.put("/produk/:id", controller.ubahProduk);
router.delete("/produk/:id", controller.hapusProduk);

module.exports = router;
