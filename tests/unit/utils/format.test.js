const format = require("../../../utils/format");

describe("Unit Test - utils/format", () => {
  it("mengubah objek Date menjadi string ISO", () => {
    const fixedDate = new Date("2026-11-25T05:00:00.000Z");
    expect(format.timestamp(fixedDate)).toBe("2026-11-25T05:00:00.000Z");
  });

  it("menghasilkan ISO timestamp valid saat dipanggil tanpa argumen", () => {
    const result = format.timestamp();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});