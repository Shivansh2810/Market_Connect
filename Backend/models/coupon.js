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
    discountAmount: {
      type: Number,
      required: true,
      min: 1,
    },
    minOrderValue: {
      type: Number,
      default: 0,
    },
    validFrom: {
      type: Date,
      default: Date.now,
    },
    validUntil: {
      type: Date,
      required: true,
    },
    usageLimit: {
      type: Number,
      default: null,
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
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
  if (!this.isActive) return 0;
  
  if (new Date() > this.validUntil) return 0;
  
  if (cartValue < this.minOrderValue) return 0;
  
  if (this.usageLimit && this.usedCount >= this.usageLimit) return 0;

  const discount = Math.min(this.discountAmount, cartValue);

  return discount;
};

couponSchema.methods.isValid = function (cartValue) {
  if (!this.isActive) return false;
  if (new Date() > this.validUntil) return false;
  if (cartValue < this.minOrderValue) return false;
  if (this.usageLimit && this.usedCount >= this.usageLimit) return false;
  return true;
};

module.exports = mongoose.model("Coupon", couponSchema);  