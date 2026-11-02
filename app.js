const express = require('express');
const path = require('path');
const config = require('./config');
const logger = require('./middlewares/logger');
const routes = require('./routes');
const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(logger);
app.use(routes);
app.use((req, res) => {
  if (req.originalUrl.startsWith('/api')) return res.status(404).json({ sukses: false, pesan: 'Endpoint tidak ditemukan' });
  return res.status(404).send('Halaman tidak ditemukan');
});
if (require.main === module) app.listen(config.port, () => console.log(`
${config.appName} berjalan di http://localhost:${config.port}
Endpoint API: /api/status dan /api/produk
`));
module.exports = app;
