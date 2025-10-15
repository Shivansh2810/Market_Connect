const mongoose = require("mongoose");
const { Schema } = mongoose;

const productSchema = new Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: [true, "Product title is required"],
      trim: true,
      minlength: 3,
      maxlength: 140,
    },

    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 5000,
    },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },

    tags: {
      type: [String],
      default: [],
      index: true,
    },

    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
        isPrimary: { type: Boolean, default: false },
      },
    ],

    price: {
      type: Number,
      required: true,
      min: [0, "Price cannot be negative"],
    },

    currency: {
      type: String,
      enum: ["INR", "USD"],
      default: "INR",
    },

    stock: {
      type: Number,
      required: true,
      min: [0, "Stock cannot be negative"],
    },

    condition: {
      type: String,
      enum: ["new", "used", "refurbished"],
      default: "new",
    },

    specs: {
      type: Map,
      of: String,
      default: {},
    },

    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

productSchema.pre("save", function (next) {
  if (!this.isModified("title")) return next();

  this.slug = this.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  next();
});

module.exports = mongoose.model("Product", productSchema);