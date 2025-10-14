const mongoose = require("mongoose");
const { Schema } = mongoose;

const addressSchema = require("./sharedSchemas.js");

// Schema for individual items within an order
const orderItemSchema = new Schema(
    {
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        image: { type: String, required: true }, // URL to the product image
        price: { type: Number, required: true },
        product: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Product", // Reference to the Product schema
        },
    },
    { _id: false }
);


const orderSchema = new Schema(
  {
    shippingInfo: {
        type: addressSchema,
        required: true,
    },
    buyer: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User", // Reference to the User schema
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User",
    },
    orderItems: [orderItemSchema],
    payment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Payment"
    },
    itemsPrice: {
        type: Number,
        required: true,
        default: 0.0,
    },
    taxPrice: {
        type: Number,
        required: true,
        default: 0.0,
    },
    shippingPrice: {
        type: Number,
        required: true,
        default: 0.0,
    },
    totalPrice: {
        type: Number,
        required: true,
        default: 0.0,
    },
    orderStatus: {
        type: String,
        required: true,
        enum: ["Processing", "Shipped", "Delivered", "Cancelled", "Returned"],
        default: "Processing",
    },
    deliveredAt: {
        type: Date,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt timestamps
  }
);

module.exports = mongoose.model("Order", orderSchema);