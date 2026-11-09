require("dotenv").config();
const { sequelize, Produk } = require("../models");

const dataAwal = [
  {
    nama: "Panduan HTML Semantik",
    kategori: "Materi Belajar",
    harga: 25000,
    deskripsi: "Ringkasan penggunaan elemen HTML semantik untuk menyusun halaman yang lebih mudah dipahami."
  },
  {
    nama: "Checklist Aksesibilitas Web",
    kategori: "Toolkit",
    harga: 15000,
    deskripsi: "Checklist dasar untuk meninjau prinsip Perceivable, Operable, Understandable, dan Robust."
  },
  {
    nama: "Template Audit WCAG",
    kategori: "Template",
    harga: 30000,
    deskripsi: "Template pencatatan pemeriksaan awal aksesibilitas pada halaman website."
  }
];

async function seed() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();

    for (const item of dataAwal) {
      await Produk.findOrCreate({
        where: { nama: item.nama },
        defaults: item
      });
    }

    console.log("Seeder selesai. Data awal tersedia.");
    await sequelize.close();
  } catch (error) {
    console.error("Seeder gagal:", error.message);
    process.exitCode = 1;
  }
}

seed();
