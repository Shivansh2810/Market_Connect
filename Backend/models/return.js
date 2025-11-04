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
        required: [true, "A reason for the return must be provided."],
        enum: [
            "Damaged Item",
            "Wrong Item Sent",
            "Item Not as Described",
            "Size Issue",
            "No Longer Needed",
            "Other",
        ],
    },
    status: {
        type: String,
        required: true,
        enum: [
            "Requested",
            "Approved",
            "Rejected",
            "Shipped by Buyer",
            "Received by Seller",
            "Completed", 
        ],
        default: "Requested",
    },
    resolution: {
        type: String,
        enum: ["Pending", "Refund", "Replacement", "Store Credit"],
        default: "Pending"
    },
    refundInfo: { 
        refundId: { type: String, trim: true }, 
        status: { type: String, enum: ['pending', 'processed', 'failed'] },
        amount: { type: Number },
    },
  },
  {
    timestamps: true, 
  }
);

module.exports = mongoose.model("Return", returnSchema);