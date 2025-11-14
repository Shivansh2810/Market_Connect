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

module.exports = router;