# Catatan Aksesibilitas Web — Project PAW Kelompok 2 Kelas A

Project ini merupakan pengembangan berkelanjutan dari website Catatan Aksesibilitas. Konten utama membahas jurnal Daniel Dang mengenai penggunaan semantic HTML, CSS, dan JavaScript untuk menerapkan prinsip web accessibility (POUR).

## Teknologi
- Node.js dan Express.js
- EJS sebagai view engine
- Bootstrap 5 melalui CDN dan CSS khusus project
- PostgreSQL sebagai database
- Sequelize sebagai ORM
- REST API untuk operasi CRUD
- Middleware logger untuk mencatat request

## Menjalankan project
1. Pastikan Node.js dan PostgreSQL sudah terpasang.
2. Buat database bernama `a11ylab_db` melalui pgAdmin dengan menjalankan isi `database/create-database.sql`.
3. Salin `.env.example` menjadi `.env`, kemudian sesuaikan password PostgreSQL.
4. Jalankan perintah berikut di terminal root project:

```bash
npm install
npm run seed
npm run dev
```

5. Buka `http://localhost:3000`.

## Halaman website
- `/` — Beranda dan pintasan ke semua fitur utama.
- `/ulasan` — Ringkasan jurnal, prinsip POUR, teknik, tantangan, kesimpulan, dan sitasi.
- `/produk` — Halaman pengelolaan data produk.
- `/produk/tambah` — Form tambah produk.
- `/produk/:id/edit` — Form edit produk.

## Endpoint API
| Method | Endpoint | Kegunaan |
|---|---|---|
| GET | `/api/status` | Status server |
| GET | `/api/produk` | Mengambil seluruh produk |
| GET | `/api/produk/:id` | Mengambil detail produk |
| POST | `/api/produk` | Menambahkan produk |
| PUT | `/api/produk/:id` | Memperbarui produk |
| DELETE | `/api/produk/:id` | Menghapus produk |

Contoh JSON untuk POST dan PUT:

```json
{
  "nama": "Panduan ARIA Dasar",
  "kategori": "Materi Belajar",
  "harga": 20000,
  "deskripsi": "Materi pengantar penggunaan atribut ARIA secara tepat."
}
```

## Struktur folder
```text
config/          konfigurasi aplikasi dan database
controllers/     controller halaman dan API
database/        SQL pembuatan database
logs/            file log request
middlewares/     middleware logger
models/          model prinsip POUR dan produk
public/assets/   aset SVG
public/css/      stylesheet
public/js/       JavaScript frontend
routes/          route web dan API
seeders/         data awal database
utils/           validasi, data tim, dan fungsi bantuan
views/           template EJS
app.js           entry point Express
```

## Pengujian
1. Pastikan data awal muncul pada `/produk`.
2. Tambahkan satu produk melalui tombol Tambah Produk.
3. Edit produk tersebut.
4. Hapus produk tersebut.
5. Uji seluruh endpoint CRUD menggunakan Postman atau Thunder Client.
6. Periksa tabel `produk` melalui pgAdmin:

```sql
SELECT * FROM produk ORDER BY id;
```

7. Perhatikan terminal dan `logs/requests.log` untuk melihat catatan request.

## Catatan
- Data produk adalah data contoh untuk mendemonstrasikan CRUD yang berkaitan dengan materi aksesibilitas.
- Form masukan pada beranda masih berupa simulasi dan belum menyimpan pesan.
- Belum ada login atau pembatasan hak akses. Fitur CRUD ditujukan untuk demonstrasi tugas lokal, bukan penggunaan produksi.
- Penerapan beberapa praktik aksesibilitas tidak berarti website otomatis 100% aksesibel. Pengujian lebih lanjut tetap diperlukan.
