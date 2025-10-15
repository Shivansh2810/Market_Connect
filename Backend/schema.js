const Joi = require("joi");

// 🧩 Reusable address schema
const addressSchema = Joi.object({
  street: Joi.string().trim().required(),
  city: Joi.string().trim().required(),
  state: Joi.string().trim().required(),
  pincode: Joi.string()
    .length(6)
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
      "string.length": "Pincode must be exactly 6 digits",
      "string.pattern.base": "Pincode must contain only numbers",
    }),
  country: Joi.string().trim().default("India"),
});

// 🧠 Profile picture (optional for signup)
const profilePicSchema = Joi.object({
  public_id: Joi.string().allow("", null),
  url: Joi.string().uri().allow("", null),
});

// 🧍‍♂️ User signup validation
const userSchema = Joi.object({
  firstName: Joi.string().trim().min(2).required().messages({
    "string.empty": "First name is required",
  }),
  lastName: Joi.string().trim().min(2).required().messages({
    "string.empty": "Last name is required",
  }),
  email: Joi.string().email().trim().required().messages({
    "string.email": "Please enter a valid email",
  }),
  password: Joi.string().min(6).required().messages({
    "string.min": "Password must be at least 6 characters",
  }),
  confirmPassword: Joi.any()
    .equal(Joi.ref("password"))
    .required()
    .messages({ "any.only": "Passwords do not match" }),
  role: Joi.string().valid("buyer", "seller", "both").required(),
  mobNo: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({ "string.pattern.base": "Mobile number must be 10 digits" }),
  profilePic: profilePicSchema.optional(),

  // 👇 Seller or both account types require shop info
  sellerInfo: Joi.when("role", {
    is: Joi.valid("seller", "both"),
    then: Joi.object({
      shopName: Joi.string().trim().required().messages({
        "string.empty": "Shop name is required for sellers",
      }),
      shopAddress: addressSchema.required().messages({
        "any.required": "Shop address is required for sellers",
      }),
    }),
    otherwise: Joi.forbidden(),
  }),
});

// 🔐 Login validation
const loginSchema = Joi.object({
  email: Joi.string().email().trim().required(),
  password: Joi.string().required(),
  role: Joi.string().valid("buyer", "seller", "both").required(),
});

module.exports = { userSchema, loginSchema };
