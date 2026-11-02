# PAW Week 7 — Catatan Aksesibilitas Web

Melanjutkan project kelompok Kelas A dari repository Week 2: https://github.com/Fana06/PAW-Week2-Kelompok2-KelasA

## Teknologi
- Node.js dan Express.js
- EJS sebagai view engine
- Bootstrap 5.3.3 melalui CDN dan CSS sendiri untuk mempertahankan identitas visual project awal
- Arsitektur MVC
- Logger middleware ke terminal dan `logs/requests.log`

## Menjalankan project
Pastikan Node.js terpasang, kemudian jalankan:

```bash
npm install
npm run dev
```

Buka http://localhost:3000.

## Endpoint
- `GET /` — beranda EJS Catatan Aksesibilitas Web
- `GET /ulasan` — halaman ulasan jurnal
- `GET /api/status` — status aplikasi dalam JSON
- `GET /api/produk` — array data produk dalam JSON

Data produk sementara dikelola oleh `models/produkModel.js` tanpa database. Produk API berupa contoh data untuk latihan Week 7 dan tidak mengubah tema utama situs.

## Struktur MVC
```text
config/          konfigurasi aplikasi
models/          data produk dan prinsip POUR
middlewares/     logger request
controllers/     controller halaman dan API
routes/          route web dan API
views/           template EJS
public/css/      stylesheet
public/assets/   gambar SVG
utils/           fungsi bantuan
logs/            file log request
app.js         entry point Express
```

## Commit yang disarankan
`Week7(feat): integrate EJS frontend, status and product APIs, and request logger`
