
const ProdukModel = require('../models/produkModel');
const config = require('../config');

// Endpoint GET /api/status
exports.status = (req, res) => {
  res.status(200).json({
    status: 'ok',
    aplikasi: config.appName,
    uptimeDetik: Math.round(process.uptime()),
    waktuServer: new Date().toISOString()
  });
};

// Endpoint GET /api/produk
exports.produk = (req, res) => {
  const data = ProdukModel.getAll();

  res.status(200).json(data);
};
