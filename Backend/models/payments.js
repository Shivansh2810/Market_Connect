const mongoose = require("mongoose");
const { Schema } = mongoose;

const paymentSchema = new Schema(
  {
    gatewayPaymentId: {
      type: String,
      required: true,
      trim: true,
    },
    gatewayOrderId: {
      type: String,
      required: true,
      trim: true,
    },
    gatewaySignature: {
      type: String,
      required: true,
      trim: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order", // Ref. to the Order schema
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // user schema
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
      enum: ["created", "authorized", "captured", "failed"],
      default: "created",
    },
    method: {
      type: String, // e.g., 'card', 'upi', 'netbanking'
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

module.exports = mongoose.model("Payment", paymentSchema);