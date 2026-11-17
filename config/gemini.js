
require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

const GEMINI_MODEL =
  process.env.GEMINI_MODEL || "gemini-3.8-flash";

let geminiClient;

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    const error = new Error("GEMINI_API_KEY belum dikonfigurasi.");
    error.code = "GEMINI_API_KEY_MISSING";
    throw error;
  }

  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey });
  }

  return geminiClient;
}

module.exports = {
  getGeminiClient,
  GEMINI_MODEL
};
