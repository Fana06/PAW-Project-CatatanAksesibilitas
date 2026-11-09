const express = require("express");
const web = require("./web");
const api = require("./api");
const router = express.Router();

router.use("/", web);
router.use("/api", api);

module.exports = router;
