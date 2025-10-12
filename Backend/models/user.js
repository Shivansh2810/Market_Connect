const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { required } = require("joi");
const { Schema } = mongoose;


//Add to cart schema
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

//address schema for destructuring address
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
    country: { type: String, required: true, default: "India" },
  },
  { _id: false }
);


//user schema includes buyer and seller and info req for buying 
//and selling the products
const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false },
    googleId: { type: String, unique: true, sparse: true },
    role: { type: String, enum: ["buyer", "seller", "both"], required: true },
    mobNo: String,
    profilePic: {
      public_id: String,
      url: String,
    },
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


userSchema.pre("save", async function (next) {
  // console.log("=== PRE-SAVE HOOK ===");
  // console.log("Password modified:", this.isModified("password"));
  // console.log("Password exists:", !!this.password);
  
  if (!this.isModified("password") || !this.password) {
    console.log("Skipping password hashing");
    return next();
  }
  
  // Ensure password is a string and trim it
  const plainPassword = this.password.toString().trim();
  console.log("Password to hash:", `"${plainPassword}"`);
  console.log("Password length:", plainPassword.length);
  
  try {
    this.password = await bcrypt.hash(plainPassword, 10);
    console.log("Hashed password:", this.password);
  } catch (error) {
    console.error("Hashing error:", error);
    return next(error);
  }
  
  next();
});

// Compare password
// In your models/user.js - update the comparePassword method
userSchema.methods.comparePassword = async function (enteredPassword) {

  // console.log("=== Inside comparePassword ===");
  // console.log("Entered password:", `"${enteredPassword}"`);
  // console.log("Entered password trimmed:", `"${enteredPassword.trim()}"`);
  // console.log("Stored hash:", this.password);
  
  const result = await bcrypt.compare(enteredPassword.trim(), this.password);
  // console.log("Comparison result:", result);
  
  return result;

  return await bcrypt.compare(entered - password, this.password);
};

module.exports = mongoose.model("User", userSchema);
