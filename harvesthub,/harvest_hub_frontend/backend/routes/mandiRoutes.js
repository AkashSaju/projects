const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

// Load mandi data from JSON
let mandiData = [];
try {
  const raw = fs.readFileSync(path.join(__dirname, "../data/daily_mandi_price.json"));
  mandiData = JSON.parse(raw);
  console.log(`📥 Loaded ${mandiData.length} mandi records`);
} catch (err) {
  console.error("⚠️ Error loading mandi JSON:", err.message);
}

router.get("/mandi-price", (req, res) => {
  const { commodity, mandi } = req.query;

  if (!commodity || !mandi) {
    return res.status(400).json({ error: "commodity and mandi required" });
  }

  const matched = mandiData.find(
    (item) =>
      item.commodity.toLowerCase() === commodity.trim().toLowerCase() &&
      item.market.toLowerCase() === mandi.trim().toLowerCase()
  );

  if (!matched) {
    return res.status(404).json({ error: "No mandi data found" });
  }

  res.json({
    commodity: matched.commodity,
    mandi: matched.market,
    modal_price: Number(matched.modal_price),
    min_price: Number(matched.min_price),
    max_price: Number(matched.max_price),
  });
});

module.exports = router;
