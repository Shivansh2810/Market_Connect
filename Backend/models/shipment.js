const mongoose = require("mongoose");
const { Schema } = mongoose;

const shipmentSchema = new Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true },
      },
    ],
    shipmentStatus: {
      type: String,
      enum: [
        "pending",
        "packed",
        "shipped",
        "in-transit",
        "delivered",
        "return-initiated",
        "returned",
        "cancelled",
      ],
      default: "pending",
    },
    courier: {
      name: { type: String, trim: true },
      trackingNumber: { type: String, trim: true },
      trackingUrl: { type: String, trim: true },
    },
    estimatedDelivery: {
      type: Date,
    },
    actualDelivery: {
      type: Date,
    },
    returnReason: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    refundProcessed: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// method to update shipment status
shipmentSchema.methods.updateStatus = async function (newStatus) {
  this.shipmentStatus = newStatus;

  if (newStatus === "delivered") {
    this.actualDelivery = new Date();
  }

  await this.save();
};

// helper to initiate return
shipmentSchema.methods.initiateReturn = async function (reason) {
  this.shipmentStatus = "return-initiated";
  this.returnReason = reason;
  await this.save();
};

module.exports = mongoose.model("Shipment", shipmentSchema);
