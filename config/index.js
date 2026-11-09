const path = require("path");

module.exports = {
  appName: "Catatan Aksesibilitas Web",
  port: Number(process.env.PORT) || 3000,
  logDir: path.join(__dirname, "..", "logs"),
  logFile: "requests.log"
};
