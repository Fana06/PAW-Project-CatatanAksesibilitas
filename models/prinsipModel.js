const prinsip = [
 { huruf: 'P', nama: 'Perceivable', deskripsi: 'Isi harus bisa ditangkap pengguna. Beri teks alternatif pada gambar dan caption pada video.', contoh: 'alt' },
 { huruf: 'O', nama: 'Operable', deskripsi: 'Semua fungsi harus bisa dijalankan lewat keyboard, tidak hanya dengan mouse.', contoh: 'Tab' },
 { huruf: 'U', nama: 'Understandable', deskripsi: 'Pakai bahasa sederhana, heading berurutan, dan form dengan label.', contoh: '<label>' },
 { huruf: 'R', nama: 'Robust', deskripsi: 'Tulis kode valid dan sesuai standar agar terbaca browser dan screen reader.', contoh: '<button>' }
];
module.exports = { getAll: () => prinsip };
