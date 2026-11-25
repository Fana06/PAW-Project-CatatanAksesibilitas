const mockProdukList = [
  {
    id: 1,
    nama: "Template Audit WCAG 2.1",
    kategori: "Template",
    harga: 50000,
    deskripsi: "Checklist evaluasi aksesibilitas berbasis prinsip POUR."
  },
  {
    id: 2,
    nama: "Panduan Semantic HTML",
    kategori: "E-Book",
    harga: 75000,
    deskripsi: "Panduan praktis penggunaan elemen semantik dan ARIA."
  }
];

const validProdukPayload = {
  nama: "  Checklist Screen Reader  ",
  kategori: "  Panduan  ",
  harga: "45000",
  deskripsi: "  Langkah uji kompatibilitas NVDA dan VoiceOver.  "
};

const invalidProdukPayload = {
  nama: "",
  kategori: "",
  harga: -5000,
  deskripsi: ""
};

module.exports = {
  mockProdukList,
  validProdukPayload,
  invalidProdukPayload
};