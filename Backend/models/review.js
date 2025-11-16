const mongoose = require("mongoose");
const { Schema } = mongoose;

const reviewSchema = new Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
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
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 3000,
    },
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
      },
    ],
    status: {
      type: String,
      enum: ["visible", "hidden", "reported"],
      default: "visible",
    },
  },
  { timestamps: true }
);

reviewSchema.index({ productId: 1, buyerId: 1, orderId: 1 }, { unique: true });

reviewSchema.statics.updateProductRating = async function (productId) {
  const stats = await this.aggregate([
    { $match: { productId } },
    {
      $group: {
        _id: "$productId",
        ratingCount: { $sum: 1 },
        ratingAvg: { $avg: "$rating" },
      },
    },
  ]);

  if (stats.length > 0) {
    await mongoose.model("Product").findByIdAndUpdate(productId, {
      ratingCount: stats[0].ratingCount,
      ratingAvg: stats[0].ratingAvg,
    });
  } else {
    await mongoose.model("Product").findByIdAndUpdate(productId, {
      ratingCount: 0,
      ratingAvg: 0,
    });
  }
};

reviewSchema.post("save", function () {
  this.constructor.updateProductRating(this.productId);
});

reviewSchema.post("remove", function () {
  this.constructor.updateProductRating(this.productId);
});

reviewSchema.post("findOneAndUpdate", function (doc) {
  if (doc) {
    doc.constructor.updateProductRating(doc.productId);
  }
});

module.exports = mongoose.model("Review", reviewSchema);
