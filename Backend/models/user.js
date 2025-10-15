const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const { Schema } = mongoose;

// ---------------- CART SCHEMA ----------------
const cartSchema = new Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity can't be less than 1"],
      default: 1,
    },
  },
  { _id: false }
);

// ---------------- ADDRESS SCHEMA ----------------
const addressSchema = new Schema(
  {
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: {
      type: String,
      required: true,
      trim: true,
      minlength: 6,
      maxlength: 6,
    },
    country: { type: String, default: "India" },
  },
  { _id: false }
);

// ---------------- USER SCHEMA ----------------
const userSchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false },
    role: { type: String, enum: ["buyer", "seller", "both"], required: true }, // replace accountType
    mobNo: { type: String },
    sellerInfo: {
      shopName: String,
      shopAddress: addressSchema,
      verified: { type: Boolean, default: false },
    },
    buyerInfo: {
      shippingAddresses: [addressSchema],
      cart: [cartSchema],
    },
  },
  { timestamps: true }
);

// ---------------- PASSWORD HASHING ----------------
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) {
    return next();
  }

  try {
    const plainPassword = this.password.toString().trim();
    this.password = await bcrypt.hash(plainPassword, 10);
  } catch (error) {
    return next(error);
  }

  next();
});

// ---------------- PASSWORD COMPARISON ----------------
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword.trim(), this.password);
};

module.exports = mongoose.model("User", userSchema);
