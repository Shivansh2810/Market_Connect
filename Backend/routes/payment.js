const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const { protect } = require("../middlewares/auth");

// Create Razorpay order (before payment)
router.post("/create-order", protect, paymentController.createRazorpayOrder);

// Verify payment (after payment completion)
router.post("/verify", protect, paymentController.verifyPayment);

// Get payment details by order ID
router.get("/order/:orderId", protect, paymentController.getPaymentByOrderId);

// -- Routes for Refund functionality

// Initiate a refund for an order (called by the buyer)
router.post("/initiate-refund", protect, paymentController.initiateRefund);

// Get the status of a refund for a specific order
router.get("/refund/status/:orderId", protect, paymentController.getRefundStatus);

module.exports = router;