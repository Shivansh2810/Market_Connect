const mongoose = require("mongoose");
const { Schema } = mongoose;

const bidSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User", 
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true } 
);

module.exports = mongoose.model("Bid", bidSchema);