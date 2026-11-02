// Model berisi data statis untuk memenuhi latihan REST API Week 7.
const produk = [
  { id: 1, nama: 'Panduan HTML Semantik', kategori: 'Materi Belajar', harga: 25000, deskripsi: 'Ringkasan penggunaan elemen HTML semantic.' },
  { id: 2, nama: 'Checklist Aksesibilitas Web', kategori: 'Toolkit', harga: 15000, deskripsi: 'Checklist dasar untuk mengevaluasi prinsip POUR.' },
  { id: 3, nama: 'Template Audit WCAG', kategori: 'Template', harga: 30000, deskripsi: 'Template catatan pemeriksaan aksesibilitas halaman web.' }
];
module.exports = { getAll: () => produk };
