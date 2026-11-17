require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");

const DEFAULT_TIMEOUT_MS = 20000;

class GeminiConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = "GeminiConfigError";
  }
}

let cachedClient = null;
let cachedKey = null;

function getApiKey() {
  const key = (process.env.GEMINI_API_KEY || "").trim();
  if (!key || key === "your_gemini_api_key") {
    throw new GeminiConfigError("GEMINI_API_KEY belum diisi.");
  }
  return key;
}

function getModel() {
  const model = (process.env.GEMINI_MODEL || "").trim();
  if (!model) {
    throw new GeminiConfigError("GEMINI_MODEL belum diisi.");
  }
  return model;
}

function getTimeoutMs() {
  const value = Number(process.env.GEMINI_TIMEOUT_MS);
  return Number.isFinite(value) && value >= 1000 ? value : DEFAULT_TIMEOUT_MS;
}

// Client dibuat saat pertama kali dibutuhkan, sehingga server tetap bisa
// berjalan (dan fitur lama tetap normal) walaupun key belum diisi.
function getClient() {
  const apiKey = getApiKey();
  if (!cachedClient || cachedKey !== apiKey) {
    cachedClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        timeout: getTimeoutMs(),
        retryOptions: { attempts: 1 }
      }
    });
    cachedKey = apiKey;
  }
  return cachedClient;
}

module.exports = {
  GeminiConfigError,
  getApiKey,
  getModel,
  getTimeoutMs,
  getClient
};