
# Catatan Aksesibilitas Web — Project PAW

Project ini merupakan pengembangan website Catatan Aksesibilitas untuk mata kuliah Pengembangan Aplikasi Web.

## Teknologi
- Node.js
- Express.js 4
- CommonJS
- EJS
- PostgreSQL
- Sequelize ORM
- REST API
- Logger Middleware
- Google Gemini API
- @google/genai

## Persiapan

1. Pastikan Node.js dan PostgreSQL tersedia.
2. Gunakan database existing `a11ylab_db`.
3. Salin `.env.example` menjadi `.env`.
4. Isi konfigurasi PostgreSQL.
5. Isi GEMINI_API_KEY pada `.env` lokal.
6. Jangan commit file `.env`.

## Instalasi

```bash
npm install
npm install @google/genai
```

Jalankan aplikasi:

```bash
npm run dev
```

Buka:

http://localhost:3000

## Halaman Website

| Path | Keterangan |
|---|---|
| / | Beranda |
| /ulasan | Ulasan jurnal |
| /produk | Pengelolaan produk |
| /produk/tambah | Tambah produk |
| /produk/:id/edit | Edit produk |
| /assistant | AI Accessibility Assistant |

## REST API

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | /api/status | Status server |
| GET | /api/produk | Semua produk |
| GET | /api/produk/:id | Detail produk |
| POST | /api/produk | Tambah produk |
| PUT | /api/produk/:id | Ubah produk |
| DELETE | /api/produk/:id | Hapus produk |
| POST | /api/chat | Chat AI Gemini |

## Format API Chat

Request:

```json
{
  "pesan": "Apa itu semantic HTML?"
}
```

Response:

```json
{
  "sukses": true,
  "data": {
    "balasan": "Semantic HTML adalah..."
  }
}
```

## Keamanan API Key

- GEMINI_API_KEY disimpan di environment.
- API key hanya digunakan di backend.
- Jangan meletakkan API key di JavaScript frontend.
- Jangan menampilkan API key dalam log.
- Jangan memasukkan API key asli ke README atau GitHub.

## Database

Database menggunakan PostgreSQL existing:

`a11ylab_db`

Tidak membuat database pengganti.

## Logger Middleware

Logger Middleware tetap dipasang secara global melalui app.js.

Log request disimpan di:

`logs/requests.log`

## Pengujian

Pemeriksaan sintaks:

```bash
node --check app.js
node --check routes/index.js
node --check routes/web.js
node --check routes/api.js
node --check controllers/assistantController.js
node --check public/js/assistant.js
```

Endpoint yang perlu diperiksa:

- GET /api/status
- GET /api/produk
- POST /api/chat
- GET /assistant

Pengujian CRUD lama tetap dilakukan untuk memastikan tidak terjadi regresi.
