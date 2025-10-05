const db = require("../db");

// ---------------------
// AGENT TASKS
// ---------------------

// GET tasks by agent (hardcoded agentId = 2 for now)
exports.getTasksByAgent = (req, res) => {
  const agentId = req.params.agentId || 2; // hardcoded for now
  const sql = `
    SELECT 
      d.id,
      d.order_id,
      d.agent_id,
      d.pickup_name,
      d.pickup_contact,
      d.pickup_location,
      d.pickup_pincode,
      d.delivery_name,
      d.delivery_contact,
      d.delivery_location,
      d.delivery_pincode,
      d.status,
      d.created_at,
      o.user_id
    FROM delivery_tasks d
    JOIN orders o ON d.order_id = o.id
    WHERE d.agent_id = ?
    ORDER BY d.created_at DESC
  `;

  db.query(sql, [agentId], (err, result) => {
    if (err) {
      console.error("Error fetching deliveries:", err);
      return res.status(500).json({ message: "Error fetching deliveries", err });
    }
    res.json(result);
  });
};

// PUT update delivery status + update order status if delivered
exports.updateStatus = (req, res) => {
  const taskId = req.params.taskId;
  const { status } = req.body; // frontend sends { status: newStatus }

  if (!status) return res.status(400).json({ message: "Status is required" });

  const updateTask = `UPDATE delivery_tasks SET status = ? WHERE id = ?`;

  db.query(updateTask, [status, taskId], (err) => {
    if (err) {
      console.error("Error updating delivery task:", err);
      return res.status(500).json({ message: "Error updating delivery status", err });
    }

    // If delivered, update order status too
    if (status === "Delivered") {
      const updateOrder = `
        UPDATE orders 
        SET status = 'Delivered' 
        WHERE id = (SELECT order_id FROM delivery_tasks WHERE id = ?)
      `;
      db.query(updateOrder, [taskId], (err2) => {
        if (err2) console.error("Error updating order status:", err2);
      });
    }

    res.json({ message: "Status updated successfully" });
  });
};

// ---------------------
// ADMIN ENDPOINTS
// ---------------------

// ✅ Get all delivery tasks (for Admin Dashboard)
exports.getAllDeliveries = (req, res) => {
  const sql = `
    SELECT 
      d.id,
      d.order_id,
      d.agent_id,
      d.pickup_name,
      d.pickup_contact,
      d.pickup_location,
      d.pickup_pincode,
      d.delivery_name,
      d.delivery_contact,
      d.delivery_location,
      d.delivery_pincode,
      d.status,
      d.created_at,
      o.total AS order_total,
      u.fullName AS agent_name
    FROM delivery_tasks d
    LEFT JOIN orders o ON d.order_id = o.id
    LEFT JOIN users u ON d.agent_id = u.id
    ORDER BY d.created_at DESC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error("Error fetching all deliveries:", err);
      return res.status(500).json({ message: "Error fetching deliveries", err });
    }
    res.json(result);
  });
};
