const express = require("express");
const router = express.Router();
const db = require("../db");

// ✅ Add item to cart
router.post("/add", (req, res) => {
  const { user_id, product_id, quantity } = req.body;

  if (!user_id || !product_id || !quantity) {
    return res.status(400).json({ error: "All fields are required" });
  }

  // Check if product already in cart → update quantity instead of duplicating
  const checkSql = "SELECT * FROM cart WHERE user_id = ? AND product_id = ?";
  db.query(checkSql, [user_id, product_id], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });

    if (results.length > 0) {
      const updateSql = "UPDATE cart SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?";
      db.query(updateSql, [quantity, user_id, product_id], (err2) => {
        if (err2) return res.status(500).json({ error: "Error updating cart" });
        return res.json({ message: "🛒 Cart updated successfully" });
      });
    } else {
      const insertSql = `
        INSERT INTO cart (user_id, product_id, quantity)
        VALUES (?, ?, ?)
      `;
      db.query(insertSql, [user_id, product_id, quantity], (err3) => {
        if (err3) return res.status(500).json({ error: "Error adding to cart" });
        return res.json({ message: "✅ Product added to cart" });
      });
    }
  });
});

// ✅ Get all cart items for a user
router.get("/:user_id", (req, res) => {
  const { user_id } = req.params;

  const sql = `
    SELECT c.id AS cart_id, c.quantity, 
           p.name, p.price, p.image_url, p.farmer_id, p.mandi, u.fullName AS farmer_name
    FROM cart c
    JOIN products p ON c.product_id = p.id
    LEFT JOIN users u ON p.farmer_id = u.id
    WHERE c.user_id = ?
  `;

  db.query(sql, [user_id], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    results.forEach(p => {
      if (p.image_url) p.image_url = `http://localhost:5000/uploads/${p.image_url}`;
    });
    res.json(results);
  });
});

// ✅ Remove item from cart
router.delete("/:cart_id", (req, res) => {
  const { cart_id } = req.params;

  const sql = "DELETE FROM cart WHERE id = ?";
  db.query(sql, [cart_id], (err) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json({ message: "🗑️ Item removed from cart" });
  });
});

module.exports = router;
