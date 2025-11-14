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

    // Refund fields yet to be added
    
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Payment", paymentSchema);