const mongoose = require("mongoose");
const { Schema } = mongoose;

const returnItemSchema = new Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const returnSchema = new Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [returnItemSchema],
    reason: {
      type: String,
      required: true,
      enum: [
        "Damaged Item",
        "Wrong Item Sent",
        "Item Not as Described",
        "Size Issue",
        "No Longer Needed",
        "Other",
      ],
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["Requested", "Approved", "Rejected", "Completed"],
      default: "Requested",
    },
    refundAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    rejectionReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Return", returnSchema);