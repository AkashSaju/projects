const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");

// ---------------------
// USER ROUTES
// ---------------------
router.post("/create", orderController.createOrder); // Place a new order
router.get("/user/:userId", orderController.getUserOrders); // Get all orders of a specific user

// ---------------------
// FARMER ROUTES
// ---------------------
router.get("/farmer/:userId/products", orderController.getFarmerProducts); // Get all products of a farmer


module.exports = router;
