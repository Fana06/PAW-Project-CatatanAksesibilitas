const fs = require("fs");
const path = require("path");
const config = require("../config");
const format = require("../utils/format");

const logPath = path.join(config.logDir, config.logFile);
fs.mkdirSync(config.logDir, { recursive: true });

module.exports = (req, res, next) => {
  const started = process.hrtime.bigint();
  const timestamp = format.timestamp();

  res.on("finish", () => {
    const duration = (Number(process.hrtime.bigint() - started) / 1e6).toFixed(1);
    const row = `${timestamp} | ${req.method} | ${req.originalUrl} | ${res.statusCode} | ${duration} ms`;

    console.log(`[LOGGER] ${row}`);
    fs.appendFile(logPath, row + "\n", (error) => {
      if (error) console.error("[LOGGER] Gagal menulis log:", error.message);
    });
  });

  next();
};
