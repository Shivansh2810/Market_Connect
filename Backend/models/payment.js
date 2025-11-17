const mongoose = require("mongoose");
const { Schema } = mongoose;

const paymentSchema = new Schema(
  {
    razorpayPaymentId: {
      type: String,
      trim: true,
      sparse: true, // Allows null, but unique if present
    },
    razorpayOrderId: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    razorpaySignature: {
      type: String,
      trim: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order", // reference to Order schema
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // reference to User schema
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      default: "INR",
    },
    status: {
      type: String,
      required: true,
      enum: ["created", "authorized", "captured", "failed", "refunded"],
      default: "created",
    },
    method: {
      type: String, // 'card', 'upi', 'netbanking', 'wallet'
    },

    // Refund fields

    refundId: {
      type: String,
      trim: true,
      // stores the Razorpay refund ID (like, "rfnd_xyz123...")
      // Can and will be null if no refund has been initiated
    },
    refundAmount: {
      type: Number,
      default: 0,
      // Cumulative refunded amount
      // partial refunds -> this can be less than 'amount', full refunds-> this equals 'amount'
    },
    refundStatus: {
      type: String,
      enum: ["none", "pending", "processed", "failed"],
      default: "none",
      // Tracks the status of refund processing
    },
    
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Payment", paymentSchema);