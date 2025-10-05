const db = require("../db");

const orderController = {
  // ✅ Existing: createOrder
  createOrder: (req, res) => {
    const { user_id, total, instructions, items } = req.body;

    console.log("📦 Received order payload:", req.body);

    if (!user_id || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Invalid order data" });
    }

    // Insert into orders table
    db.query(
      "INSERT INTO orders (user_id, total, status, created_at) VALUES (?, ?, ?, NOW())",
      [user_id, total, "Pending"],
      (err, orderResult) => {
        if (err) {
          console.error("❌ Error inserting order:", err);
          return res.status(500).json({ error: "Internal Server Error" });
        }

        const orderId = orderResult.insertId;
        let itemsProcessed = 0;

        // Insert each order_item and reduce product qty
        items.forEach((item) => {
          db.query(
            "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
            [orderId, item.product_id, item.quantity, item.price],
            (err2) => {
              if (err2) {
                console.error("❌ Error inserting order item:", err2);
                return res.status(500).json({ error: "Internal Server Error" });
              }

              // Reduce product quantity (safely only if enough stock)
              db.query(
                "UPDATE products SET quantity = quantity - ? WHERE id = ? AND quantity >= ?",
                [item.quantity, item.product_id, item.quantity],
                (err3, result) => {
                  if (err3) {
                    console.error("❌ Error updating product quantity:", err3);
                    return res.status(500).json({ error: "Internal Server Error" });
                  }

                  if (result.affectedRows === 0) {
                    console.warn(`⚠️ Not enough quantity for product ${item.product_id}`);
                  }

                  itemsProcessed++;

                  // After all items processed, clear cart and create delivery tasks
                  if (itemsProcessed === items.length) {
                    db.query(
                      "DELETE FROM cart WHERE user_id = ?",
                      [user_id],
                      (err4) => {
                        if (err4) {
                          console.error("❌ Error clearing cart:", err4);
                          return res.status(500).json({ error: "Internal Server Error" });
                        }

                        const updatedProducts = items.map((i) => ({
                          product_id: i.product_id,
                          quantity_ordered: i.quantity
                        }));

                        // ---- Create delivery tasks per unique farmer ----
                        db.query(
                          "SELECT fullName, contact, location, pincode FROM users WHERE id = ? LIMIT 1",
                          [user_id],
                          (errBuyer, buyerRows) => {
                            const buyer = (buyerRows && buyerRows[0]) || { fullName: '', contact: '', location: '', pincode: '' };
                            const productIds = items.map(i => i.product_id);

                            if (productIds.length === 0) {
                              return res.json({ success: true, orderId, updatedProducts });
                            }

                            db.query(
                              "SELECT DISTINCT farmer_id FROM products WHERE id IN (?)",
                              [productIds],
                              (errF, farmerRows) => {
                                if (!farmerRows || farmerRows.length === 0) {
                                  return res.json({ success: true, orderId, updatedProducts });
                                }

                                let farmersProcessed = 0;
                                const totalFarmers = farmerRows.length;

                                farmerRows.forEach(fr => {
                                  const farmerId = fr.farmer_id;

                                  db.query(
                                    "SELECT id, fullName, contact, location, pincode FROM users WHERE id = ? LIMIT 1",
                                    [farmerId],
                                    (errFr, frInfoRows) => {
                                      const frInfo = (frInfoRows && frInfoRows[0]) || { fullName: '', contact: '', location: '', pincode: '' };

                                      db.query(
                                        `INSERT INTO delivery_tasks
                                          (order_id, agent_id, pickup_name, pickup_contact, pickup_location, pickup_pincode,
                                           delivery_name, delivery_contact, delivery_location, delivery_pincode, status, created_at)
                                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                                        [
                                          orderId,
                                          2, // delivery agent id hardcoded
                                          frInfo.fullName || '',
                                          frInfo.contact || '',
                                          frInfo.location || '',
                                          frInfo.pincode || '',
                                          buyer.fullName || '',
                                          buyer.contact || '',
                                          buyer.location || '',
                                          buyer.pincode || '',
                                          'Assigned'
                                        ],
                                        (errIns) => {
                                          if (!errIns) {
                                            console.log(`🚚 Delivery task created for order ${orderId}, farmer ${farmerId}`);
                                          }
                                          farmersProcessed++;
                                          if (farmersProcessed === totalFarmers) {
                                            return res.json({
                                              success: true,
                                              orderId,
                                              updatedProducts,
                                              message: "Order placed successfully and delivery tasks created"
                                            });
                                          }
                                        }
                                      );
                                    }
                                  );
                                });
                              }
                            );
                          }
                        );
                      }
                    );
                  }
                }
              );
            }
          );
        });
      }
    );
  },

  // ✅ Existing: Get all orders of a user with items and delivery status
  getUserOrders: (req, res) => {
    const userId = req.params.userId;

    const sqlOrders = `
      SELECT o.id AS order_id, o.total, o.status AS order_status, o.created_at,
             d.status AS delivery_status
      FROM orders o
      LEFT JOIN delivery_tasks d ON d.order_id = o.id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `;

    db.query(sqlOrders, [userId], (err, orders) => {
      if (err) return res.status(500).json({ message: "Error fetching orders", err });

      if (orders.length === 0) return res.json([]);

      const orderIds = orders.map(o => o.order_id);
      const sqlItems = `
        SELECT oi.order_id, p.name AS product_name, oi.quantity, oi.price
        FROM order_items oi
        JOIN products p ON p.id = oi.product_id
        WHERE oi.order_id IN (?)
      `;

      db.query(sqlItems, [orderIds], (err2, items) => {
        if (err2) return res.status(500).json({ message: "Error fetching order items", err2 });

        const ordersWithItems = orders.map(order => ({
          ...order,
          items: items.filter(i => i.order_id === order.order_id)
        }));

        res.json(ordersWithItems);
      });
    });
  },

  // ✅ NEW: Get all products listed by a farmer
  getFarmerProducts: (req, res) => {
    const userId = req.params.userId;

    const sql = `
      SELECT id AS product_id, name, quantity, price, description, created_at
      FROM products
      WHERE farmer_id = ?
      ORDER BY created_at DESC
    `;

    db.query(sql, [userId], (err, products) => {
      if (err) return res.status(500).json({ message: "Error fetching farmer products", err });
      res.json(products);
    });
  }





};

module.exports = orderController;