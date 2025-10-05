const express = require("express");
const router = express.Router();
const db = require("../db");
const multer = require("multer");
const path = require("path");

// ✅ Define base URL once at the top
const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

// ================================
// Multer storage configuration
// ================================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// ================================
// POST: Add new product
// ================================
router.post("/", upload.single("image"), (req, res) => {
  const { name, category, price, quantity, description, farmer_id, mandi } = req.body;
  const image = req.file ? req.file.filename : null;

  if (!name || !category || !price || !quantity || !farmer_id || !mandi) {
    return res.status(400).json({ error: "All required fields must be filled" });
  }

  const sql = `
    INSERT INTO products 
      (name, category, price, quantity, image_url, description, farmer_id, mandi) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [name, category, price, quantity, image, description, farmer_id, mandi], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error", details: err });
    }
    res.status(201).json({ message: "✅ Product added successfully", productId: result.insertId });
  });
});

// ================================
// GET: Fetch all products or by farmer
// ================================
router.get("/", (req, res) => {
  const { farmer_id } = req.query;

  let sql = `
    SELECT p.*, u.fullName AS farmer_name
    FROM products p
    LEFT JOIN users u ON p.farmer_id = u.id
  `;
  const params = [];

  if (farmer_id) {
    sql += " WHERE p.farmer_id = ?";
    params.push(farmer_id);
  }

  sql += " ORDER BY p.id DESC";

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    results.forEach(p => {
      if (p.image_url) p.image_url = `${BASE_URL}/uploads/${p.image_url}`;
    });

    res.json(results);
  });
});

// ================================
// GET: Fetch single product by ID
// ================================
router.get("/:id", (req, res) => {
  const productId = req.params.id;
  const sql = `
    SELECT p.*, u.fullName AS farmer_name
    FROM products p
    LEFT JOIN users u ON p.farmer_id = u.id
    WHERE p.id = ?
  `;

  db.query(sql, [productId], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    if (results.length === 0) return res.status(404).json({ error: "Product not found" });

    const product = results[0];
    if (product.image_url) product.image_url = `${BASE_URL}/uploads/${product.image_url}`;

    res.json(product);
  });
});

module.exports = router;
