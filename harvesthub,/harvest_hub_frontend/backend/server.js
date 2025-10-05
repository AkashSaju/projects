// server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cron = require("node-cron");
const db = require("./db");

const deliveryRoutes = require("./routes/deliveryRoutes");



// Correct import of fetchMandiData
const { loadMandiData, mandiData } = require("./fetchMandiData");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Routes
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const mandiRoutes = require("./routes/mandiRoutes");
const farmerRoutes = require('./routes/farmer');
const cartRoutes = require("./routes/cartRoutes");

const orderRoutes = require("./routes/ordersRoutes");


app.use("/api/products", productRoutes);
app.use("/api", mandiRoutes);
app.use("/api/users", userRoutes);
app.use('/api/farmers', farmerRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use(express.json()); 
app.use("/api/delivery", deliveryRoutes);

// Health check
app.get("/", (req, res) => {
  res.send("🌾 HarvestHub Backend is Running 🚀");
});

// ✅ Load mandi data once at startup
loadMandiData();
app.locals.mandiData = mandiData; // store in app.locals for easy access

// ✅ Schedule auto-refresh every day at 6 AM
cron.schedule("0 6 * * *", () => {
  console.log("⏰ Running scheduled mandi data update...");
  loadMandiData();
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at: http://localhost:${PORT}`);
});
