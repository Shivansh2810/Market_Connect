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
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    maxDiscountAmount: {
      type: Number,
      default: null,
    },
    minOrderValue: {
      type: Number,
      default: 0,
    },
    applicableProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    applicableCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    usageLimitPerUser: {
      type: Number,
      default: 1,
    },
    usageLimitTotal: {
      type: Number,
      default: null,
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "disabled", "expired"],
      default: "active",
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

// pre-save hook to auto-disable expired coupons
couponSchema.pre("save", function (next) {
  if (this.expiryDate < new Date()) {
    this.status = "expired";
  }
  next();
});

// Method to check if coupon is valid
couponSchema.methods.isValid = function () {
  const now = new Date();
  return (
    this.status === "active" &&
    now >= this.startDate &&
    now <= this.expiryDate &&
    (!this.usageLimitTotal || this.usedCount < this.usageLimitTotal)
  );
};

// Method to calculate discount for a given cart value
couponSchema.methods.calculateDiscount = function (cartValue) {
  if (!this.isValid()) return 0;

  let discount = 0;
  if (this.discountType === "percentage") {
    discount = (cartValue * this.discountValue) / 100;
    if (this.maxDiscountAmount) discount = Math.min(discount, this.maxDiscountAmount);
  } else {
    discount = this.discountValue;
  }

  // Ensure discount does not exceed cart value
  return Math.min(discount, cartValue);
};

module.exports = mongoose.model("Coupon", couponSchema);
