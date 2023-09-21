const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.send("h.w");
});

module.exports = router;
