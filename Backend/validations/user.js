const Joi = require("joi");
const addressSchema = require("./sharedSchemas");

const signupSchema = Joi.object({
  name: Joi.string().trim().min(3).required(),
  email: Joi.string()
    .trim()
    .email({ tlds: { allow: true } })
    .lowercase()
    .required(),
  password: Joi.string()
    .min(6)
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$"))
    .required()
    .messages({
      "string.min": "Password must be at least 6 characters long.",
      "string.pattern.base":
        "Password must contain at least one uppercase letter, one lowercase letter, and one number.",
    }),
  role: Joi.string().valid("buyer", "seller", "both").required(),
  mobNo: Joi.string()
    .trim()
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .messages({
      "string.pattern.base":
        "Please provide a valid 10-digit Indian mobile number.",
    }),

  //called when user is seller or both in role.  
  sellerInfo: Joi.when("role", {
    is: Joi.string().valid("seller", "both"),
    then: Joi.object({
      shopName: Joi.string().trim().required(),
      shopAddress: addressSchema.required(),
      razorpayAccountId: Joi.string().trim().optional().allow(""), 
    }).required(),
    otherwise: Joi.forbidden(), 
  }),
}).required();

const loginSchema = Joi.object({
    email: Joi.string().trim().email().lowercase().required(),
    password: Joi.string().required(),
    role: Joi.string().required()
}).required();

const updateProfileSchema = Joi.object({
    name: Joi.string().trim().min(3),
    mobNo: Joi.string().trim().pattern(/^[6-9]\d{9}$/).messages({
        'string.pattern.base': 'Please provide a valid 10-digit Indian mobile number.'
    }),

    sellerInfo: Joi.object({
        shopName: Joi.string().trim(),
        shopAddress: addressSchema,
        razorpayAccountId: Joi.string().trim().allow('')
    })
});

module.exports = {
    signupSchema,
    loginSchema,
    updateProfileSchema,
    addressSchema,
};