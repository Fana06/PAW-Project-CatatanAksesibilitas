const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Produk = sequelize.define(
  "Produk",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nama: {
      type: DataTypes.STRING(120),
      allowNull: false,
      validate: { notEmpty: true }
    },
    kategori: {
      type: DataTypes.STRING(80),
      allowNull: false,
      validate: { notEmpty: true }
    },
    harga: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: { min: 0 }
    },
    deskripsi: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: { notEmpty: true }
    }
  },
  {
    tableName: "produk",
    timestamps: true,
    underscored: true
  }
);

module.exports = Produk;
