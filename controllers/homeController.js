const ProdukModel = require('../models/produkModel');
const PrinsipModel = require('../models/prinsipModel');
const config = require('../config');
const anggota = [
 { nama: 'Reyhan Arya Yudha', nim: '20240140025' },
 { nama: 'Amiludin Nazar Ali Ghufron', nim: '20240140005' },
 { nama: 'Aquilla Faza Naufan', nim: '20240140006' },
 { nama: 'Bintang Aulia Farhantifka', nim: '20240140051' },
 { nama: 'Arby Pangestu', nim: '20240140167' }
];
exports.index = (req, res) => res.render('index', { judul: config.appName + ' | Beranda', prinsip: PrinsipModel.getAll(), produk: ProdukModel.getAll(), anggota });
exports.ulasan = (req, res) => res.render('ulasan', { judul: config.appName + ' | Ulasan Jurnal', prinsip: PrinsipModel.getAll(), anggota });
