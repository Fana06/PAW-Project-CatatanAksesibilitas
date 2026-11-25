const fs = require("fs");
const EventEmitter = require("events");
const logger = require("../../../middlewares/logger");

describe("Unit Test - middleware logger", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("memanggil next() dan mencatat log saat response finish", () => {
    const appendSpy = vi.spyOn(fs, "appendFile").mockImplementation((path, data, cb) => cb(null));
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const req = { method: "GET", originalUrl: "/api/status" };
    const res = new EventEmitter();
    res.statusCode = 200;
    const next = vi.fn();

    logger(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);

    res.emit("finish");

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("[LOGGER]"));
    expect(appendSpy).toHaveBeenCalledWith(
      expect.stringContaining("requests.log"),
      expect.stringContaining("GET | /api/status | 200"),
      expect.any(Function)
    );
  });

  it("mencatat error ke console.error jika fs.appendFile gagal", () => {
    vi.spyOn(fs, "appendFile").mockImplementation((path, data, cb) => cb(new Error("Disk penuh")));
    vi.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const req = { method: "POST", originalUrl: "/api/produk" };
    const res = new EventEmitter();
    res.statusCode = 500;

    logger(req, res, vi.fn());
    res.emit("finish");

    expect(errorSpy).toHaveBeenCalledWith("[LOGGER] Gagal menulis log:", "Disk penuh");
  });
});