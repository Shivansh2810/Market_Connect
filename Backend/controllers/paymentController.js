const Razorpay = require("razorpay");
const crypto = require("crypto");
const Payment = require("../models/payment");
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
// yet to be added



module.exports = {
  createRazorpayOrder,
  verifyPayment,
  getPaymentByOrderId,
};