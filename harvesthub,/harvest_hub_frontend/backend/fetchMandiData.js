const fs = require("fs");
const path = require("path");

let mandiData = [];

function loadMandiData() {
  const filePath = path.join(__dirname, "data", "daily_mandi_price.json"); // your JSON file path
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const allRecords = JSON.parse(raw);

    mandiData = allRecords.map(r => ({
      commodity: r.commodity.toLowerCase(),
      market: r.market.toLowerCase(),
      modal_price: Number(r.modal_price)
    }));

    console.log(`✅ Loaded ${mandiData.length} mandi records`);
  } catch (err) {
    console.error("⚠️ Error loading mandi data:", err.message);
  }
}

module.exports = {
  loadMandiData,  // export the function with this name
  mandiData
};
