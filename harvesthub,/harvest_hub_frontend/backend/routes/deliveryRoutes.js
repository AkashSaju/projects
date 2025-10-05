// routes/deliveryRoutes.js
const express = require("express");
const router = express.Router();
const deliveryController = require("../controllers/deliveryController");

router.get("/tasks/:agentId", deliveryController.getTasksByAgent);
router.put("/update/:taskId", deliveryController.updateStatus);
// Admin - Get all delivery tasks
router.get("/admin/all", deliveryController.getAllDeliveries);


module.exports = router;
