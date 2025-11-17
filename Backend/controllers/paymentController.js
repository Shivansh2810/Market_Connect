/* const Razorpay = require("razorpay");
const crypto = require("crypto");
const Payment = require("../models/payments");
const Order = require("../models/order");
const Product = require("../models/product");
const {
  createRazorpayOrderSchema,
  verifyPaymentSchema,
} = require("../validations/payment");

// Initialize Razorpay instance
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// -- CREATE RAZORPAY ORDER (Called before opening Razorpay checkout)
exports.createRazorpayOrder = async (req, res) => {
  try {
    // Validating input
    const { error } = createRazorpayOrderSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        error: error.details[0].message,
      });
    }

    const { orderId } = req.body;

    // Fetch the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Verify buyer authorization
    if (order.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    // Ensuring order is in the appropriate default status
    if (order.orderStatus !== "Payment Pending") {
      return res.status(400).json({
        success: false,
        message: "Order is not in payment pending status",
      });
    }

    // Check if payment already exists for this order
    const existingPayment = await Payment.findOne({ order: orderId });
    if (existingPayment) {
      // If payment already created, return existing Razorpay order
      return res.status(200).json({
        success: true,
        message: "Razorpay order already exists",
        data: {
          razorpayOrderId: existingPayment.razorpayOrderId,
          amount: Math.round(order.totalPrice * 100),
          currency: "INR",
          keyId: process.env.RAZORPAY_KEY_ID,
        },
      });
    }

    // Create Razorpay order options
    const options = {
      amount: Math.round(order.totalPrice * 100), // Amount in paise
      currency: "INR",
      receipt: `receipt_${order._id}`,
      notes: {
        orderId: order._id.toString(),
        buyerId: req.user._id.toString(),
        buyerEmail: req.user.email,
      },
    };

    // Create Razorpay order using official SDK
    const razorpayOrder = await razorpayInstance.orders.create(options);

    // Create payment record document in the DB
    const payment = new Payment({
      razorpayOrderId: razorpayOrder.id,
      order: order._id,
      user: req.user._id,
      amount: order.totalPrice,
      currency: "INR",
      status: "created",
    });

    await payment.save();

    // Link payment to order
    order.payment = payment._id;
    await order.save();

    res.status(200).json({
      success: true,
      message: "Razorpay order created successfully",
      data: {
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    console.error("Create Razorpay order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create Razorpay order",
      error: error.message,
    });
  }
};

// -- VERIFY PAYMENT (Called after user completes payment)
exports.verifyPayment = async (req, res) => {
  try {
    // Validate input
    const { error } = verifyPaymentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.details.map((e) => e.message),
      });
    }

    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } =
      req.body;

    // Verify signature (Official Razorpay method)
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (generatedSignature !== razorpaySignature) {
      // Signature verification failed
      await Payment.findOneAndUpdate(
        { razorpayOrderId },
        { status: "failed" }
      );

      // Store failed payment order
      await Order.findByIdAndUpdate(orderId, {
        orderStatus: "Payment Failed",
      });

      return res.status(400).json({
        success: false,
        message: "Payment verification failed. Invalid signature.",
      });
    }

    // Signature verified - Fetch payment details from Razorpay
    const razorpayPayment = await razorpayInstance.payments.fetch(
      razorpayPaymentId
    );

    // Check payment status
    if (
      razorpayPayment.status !== "captured" &&
      razorpayPayment.status !== "authorized"
    ) {
      await Payment.findOneAndUpdate(
        { razorpayOrderId },
        { status: "failed" }
      );

      await Order.findByIdAndUpdate(orderId, {
        orderStatus: "Payment Failed",
      });

      return res.status(400).json({
        success: false,
        message: `Payment not successful. Status: ${razorpayPayment.status}`,
      });
    }

    // Update payment record
    const payment = await Payment.findOneAndUpdate(
      { razorpayOrderId },
      {
        razorpayPaymentId,
        razorpaySignature,
        status: razorpayPayment.status,
        method: razorpayPayment.method,
      },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found",
      });
    }

    // Update order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Set order status to "Order Placed"
    order.orderStatus = "Order Placed";

    // Store Razorpay payment timestamp [Convert Razorpay timestamp (seconds) to Date]
    order.orderPlacedAt = new Date(razorpayPayment.created_at * 1000);

    await order.save();

    // Reduce product stock ONLY after successful payment
    for (const item of order.orderItems) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock -= item.quantity;
        await product.save();
      }
    }

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      data: {
        payment,
        order,
      },
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({
      success: false,
      message: "Payment verification failed",
      error: error.message,
    });
  }
};

// -- GET PAYMENT DETAILS BY ORDER ID
exports.getPaymentByOrderId = async (req, res) => {
  try {
    const payment = await Payment.findOne({ order: req.params.orderId })
      .populate("order")
      .populate("user", "name email");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found for this order",
      });
    }

    // Authorization check
    if (payment.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    res.status(200).json({
      success: true,
      message: "Payment details retrieved successfully",
      data: payment,
    });
  } catch (error) {
    console.error("Get payment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve payment details",
      error: error.message,
    });
  }
};

// -- INITIATE REFUND (For use with returns)
// can be called from API or from other controllers

exports.initiateRefund = async (req, res) => {
  try {
    // Validate input
    const { error } = initiateRefundSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        error: error.details[0].message,
      });
    }

    const { orderId, refundAmount, reason } = req.body;

    // Process refund using helper function
    const result = await processRefund(orderId, req.user._id, refundAmount, reason);

    if (!result.success) {
      return res.status(result.statusCode || 400).json({
        success: false,
        message: result.message,
      });
    }

    res.status(200).json({
      success: true,
      message: "Refund initiated successfully",
      data: result.data,
    });
  } catch (error) {
    console.error("Refund initiation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to initiate refund",
      error: error.message,
    });
  }
};

// HELPER: Process Refund (Internal function)
// Used by both paymentController and returnController
async function processRefund(orderId, userId, refundAmount = null, reason = "Refund requested") {
  try {
    // Fetch order with payment
    const order = await Order.findById(orderId).populate("payment");
    if (!order) {
      return {
        success: false,
        statusCode: 404,
        message: "Order not found",
      };
    }

    // Authorization check
    if (order.buyer.toString() !== userId.toString()) {
      return {
        success: false,
        statusCode: 403,
        message: "Unauthorized access",
      };
    }

    // Fetch payment
    const payment = order.payment;
    if (!payment || !payment.razorpayPaymentId) {
      return {
        success: false,
        statusCode: 404,
        message: "Payment not found for this order",
      };
    }

    if (payment.status !== "captured") {
      return {
        success: false,
        statusCode: 400,
        message: "Payment is not in captured status",
      };
    }

    // Calculate refund amount
    const amountToRefund = refundAmount || payment.amount;

    // Check if refund amount is valid
    const alreadyRefunded = payment.refundAmount || 0;
    const availableForRefund = payment.amount - alreadyRefunded;

    if (amountToRefund > availableForRefund) {
      return {
        success: false,
        statusCode: 400,
        message: `Cannot refund ₹${amountToRefund}. Only ₹${availableForRefund} available for refund.`,
      };
    }

    // Create refund via Razorpay
    const refund = await razorpayInstance.payments.refund(
      payment.razorpayPaymentId,
      {
        amount: Math.round(amountToRefund * 100),
        notes: {
          orderId: orderId.toString(),
          reason: reason,
        },
      }
    );

    // Update payment record
    payment.refundId = refund.id;
    payment.refundAmount = (payment.refundAmount || 0) + amountToRefund;
    payment.refundStatus = "processed";

    // Check if fully refunded
    if (payment.refundAmount >= payment.amount) {
      payment.status = "refunded";
    }

    await payment.save();

    // Restore product stock
    for (const item of order.orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      });
    }

    return {
      success: true,
      data: {
        refundId: refund.id,
        amount: amountToRefund,
        status: refund.status,
        totalRefunded: payment.refundAmount,
      },
    };
  } catch (error) {
    console.error("Process refund error:", error);
    return {
      success: false,
      statusCode: 500,
      message: "Failed to process refund",
      error: error.message,
    };
  }
}

// -- GET REFUND STATUS
exports.getRefundStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    const payment = await Payment.findOne({ order: orderId });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    if (!payment.refundId) {
      return res.status(400).json({
        success: false,
        message: "No refund initiated for this order",
      });
    }

    // Fetch refund details from Razorpay
    const refund = await razorpayInstance.refunds.fetch(payment.refundId);

    res.status(200).json({
      success: true,
      message: "Refund status retrieved successfully",
      data: {
        refundId: refund.id,
        amount: refund.amount / 100,
        status: refund.status,
        createdAt: refund.created_at,
      },
    });
  } catch (error) {
    console.error("Get refund status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve refund status",
      error: error.message,
    });
  }
};

// We Export the helper function for use in other controllers
module.exports = {
  createRazorpayOrder,
  verifyPayment,
  getPaymentByOrderId,
  initiateRefund,
  getRefundStatus,
  processRefund, // EXPORTING THIS for returnController
};
 */