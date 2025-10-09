const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { Schema } = mongoose;

const addressSchema = new Schema(
  {
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true, minlength: 6, maxlength: 6 },
    country: { type: String, required: true, default: "India" },
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ["buyer", "seller", "both"],
      required: true,
    },
    mobNo: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      trim: true,
    },
    profilePic: {
      public_id: { type: String, required: true },
      url: { type: String, required: true },
    },
    sellerInfo: {
      shopName: { type: String, trim: true },
      shopAddress: addressSchema,
      razorpayAccountId: { type: String, trim: true },
      verified: {
        type: Boolean,
        default: false,
      },
    },
    buyerInfo: {
      shippingAddresses: [addressSchema],
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(entered-password, this.password);
};

module.exports = mongoose.model("User", userSchema);