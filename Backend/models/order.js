const mongoose = require("mongoose");
const { Schema } = mongoose;

const addressSchema = require("./sharedSchemas.js");

const orderItemSchema = new Schema(
    {
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        image: { type: String, required: true }, 
        price: { type: Number, required: true },
        product: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Product", 
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
        ref: "User", 
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User",
    },
    orderItems: [orderItemSchema],
    payment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Payment" // Reference to the Payment document
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
        enum: [
        "Payment Pending", // initial default status while creating order
        "Payment Failed",
        "Order Placed",
        "Shipped",
        "Delivered",
        "Cancelled",
        "Returned", // return has been requested by buyer
        "Partially Refunded",
        "Refunded",],
        default: "Payment Pending",
    },

    orderPlacedAt: {
      // confirmed payment timestamp received from payment gateway  
      type: Date,
    },

    //this is irrelevant for time-being, hence commented
    // deliveredAt: {
    //     type: Date,
    // },
  },
  {
    timestamps: true, // in order to save timestamps for both instances - creation and updation
  }
);

module.exports = mongoose.model("Order", orderSchema);