const mongoose = require("mongoose");
const { Schema } = mongoose;

const couponSchema = new Schema(
  {
    code: {
      type: String,
      required: [true, "Coupon code is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    minOrderValue: {
      type: Number,
      default: 0,
    },
    applicableCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
  },
  { timestamps: true }
);


couponSchema.methods.calculateDiscount = function (cartValue) {
  if (cartValue < this.minOrderValue) {
    return 0; 
  }

  const discount = this.discountValue;

  return Math.min(discount, cartValue);
};

module.exports = mongoose.model("Coupon", couponSchema);