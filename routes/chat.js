const express = require("express");
const controller = require("../controllers/chatController");
const validateChat = require("../middlewares/validatechat");

const router = express.Router();

// routes/index.js memasang router ini pada prefix /api/chat.
// Logger global dari app.js tetap merekam request; tidak ada logger tambahan di sini.
router.post("/", validateChat, controller.chat);

module.exports = router;