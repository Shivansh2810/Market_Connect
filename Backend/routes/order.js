const express = require("express");
const router = express.Router();

const orderController = require("../controllers/orderController");
const { protect, isAdmin } = require("../middlewares/auth");

// Create new order
router.post("/create", protect, orderController.createOrder);

// Get all orders for the logged-in buyer
router.get("/my-orders", protect, orderController.getMyOrders);

// Get specific order details
router.get("/:orderId", protect, orderController.getOrderById);

// Update order status (for seller/admin)
router.put("/:orderId/status", protect, orderController.updateOrderStatus);

// Cancel an order (for buyer)
router.put("/:orderId/cancel", protect, orderController.cancelOrder);

//get auction orders
router.get("/my-auction-orders", protect, orderController.getMyAuctionOrders);

//set address 
router.put("/:id/auction-shipping", protect, orderController.setAuctionOrderShipping);


module.exports = router;
