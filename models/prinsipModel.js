const prinsip = [
  {
    huruf: "P",
    nama: "Perceivable",
    deskripsi: "Informasi dan komponen antarmuka harus dapat ditangkap pengguna, misalnya melalui teks alternatif dan caption.",
    contoh: "alt text"
  },
  {
    huruf: "O",
    nama: "Operable",
    deskripsi: "Navigasi dan fungsi website harus dapat dioperasikan, termasuk menggunakan keyboard.",
    contoh: "keyboard"
  },
  {
    huruf: "U",
    nama: "Understandable",
    deskripsi: "Informasi dan cara penggunaan harus mudah dipahami, konsisten, serta memiliki label yang jelas.",
    contoh: "label form"
  },
  {
    huruf: "R",
    nama: "Robust",
    deskripsi: "Kode perlu mengikuti standar agar dapat ditafsirkan browser dan teknologi bantu.",
    contoh: "semantic HTML"
  }
];

module.exports = {
  getAll: () => prinsip
};
