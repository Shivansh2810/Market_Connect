const mongoose = require("mongoose");
const { Schema } = mongoose;

// A sub-schema for the specific items being requested for return
const returnItemSchema = new Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product", // Reference to the Product schema
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
        ref: "Order", //Reference to the original order
        required: true,
    },
    buyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", //Ref. to the user who requested the return
        required: true,
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", //Ref. to the seller of the product(s)
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
            "Completed", //i.e., Refund processed or replacement sent
        ],
        default: "Requested",
    },
    resolution: {
        type: String,
        enum: ["Pending", "Refund", "Replacement", "Store Credit"],
        default: "Pending"
    },
    refundInfo: { //section to store refund details obtained from payment gateway
        refundId: { type: String, trim: true }, // The ID from the payment gateway (rfnd_...)
        status: { type: String, enum: ['pending', 'processed', 'failed'] },
        amount: { type: Number },
    },

    comments: { // Optional field for buyer to add more details about the request
        type: String,
        trim: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt timestamps
  }
);

module.exports = mongoose.model("Return", returnSchema);