const express = require("express");
const web = require("./web");
const api = require("./api");
const router = express.Router();

let chat = null;

try {
  chat = require("./chat");
} catch (error) {
  const chatModuleBelumAda =
    error.code === "MODULE_NOT_FOUND" &&
    error.message.includes("./chat");

  if (!chatModuleBelumAda) {
    throw error;
  }
}

router.use("/", web);
router.use("/api", api);

if (chat) {
  router.use("/api/chat", chat);
}

module.exports = router;