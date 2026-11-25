const request = require("supertest");
const app = require("../../app");

describe("Integration Test - Status & 404 Handler", () => {
  it("GET /api/status mengembalikan 200 dan informasi server", async () => {
    const res = await request(app).get("/api/status");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: "ok",
      aplikasi: expect.any(String),
      uptimeDetik: expect.any(Number),
      waktuServer: expect.any(String)
    });
  });

  it("GET endpoint API yang tidak ada mengembalikan 404 JSON", async () => {
    const res = await request(app).get("/api/endpoint-tidak-ada");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      sukses: false,
      pesan: "Endpoint tidak ditemukan."
    });
  });
});