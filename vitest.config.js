module.exports = {
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./tests/setup/test-setup.js"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: [
        "controllers/apiController.js",
        "controllers/chatController.js",
        "services/**/*.js",
        "utils/**/*.js",
        "middlewares/**/*.js",
        "routes/api.js",
        "routes/index.js"
      ],
      exclude: ["node_modules/**", "tests/**"]
    }
  }
};