const Joi = require("joi");
const addressSchema = require("./sharedSchema");

const signupSchema = Joi.object({
  name: Joi.string().trim().min(3).required().messages({
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 3 characters long'
  }),
  email: Joi.string()
    .trim()
    .email({ tlds: { allow: true } })
    .lowercase()
    .required()
    .messages({
      'string.email': 'Please enter a valid email address',
      'string.empty': 'Email is required'
    }),
  password: Joi.string()
    .min(6)
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$"))
    .required()
    .messages({
      "string.empty": "Password is required",
      "string.min": "Password must be at least 6 characters long",
      "string.pattern.base": "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    }),
  confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
    "any.only": "Passwords do not match",
    "string.empty": "Please confirm your password"
  }),
  mobNo: Joi.string()
    .trim()
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .messages({
      "string.empty": "Mobile number is required",
      "string.pattern.base": "Please provide a valid 10-digit Indian mobile number",
    }),
}).required();

const googleAuthSchema = Joi.object({
  name: Joi.string().trim().min(3).required(),
  email: Joi.string()
    .trim()
    .email({ tlds: { allow: true } })
    .lowercase()
    .required(),
  googleId: Joi.string().required(),
  password: Joi.forbidden(),
  role: Joi.string().valid("buyer", "seller", "both").required(),
  mobNo: Joi.string()
    .trim()
    .pattern(/^[6-9]\d{9}$/)
    .optional()
    .messages({
      "string.pattern.base": "Please provide a valid 10-digit Indian mobile number",
    }),
}).required();

const loginSchema = Joi.object({
  email: Joi.string().trim().email().lowercase().required().messages({
    'string.email': 'Please enter a valid email address',
    'string.empty': 'Email is required'
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password is required'
  }),
  role: Joi.string().valid("buyer", "seller").required().messages({
    'any.only': 'Role must be either buyer or seller',
    'string.empty': 'Please select login type (buyer/seller)'
  })
}).required();

const forgotPasswordSchema = Joi.object({
  email: Joi.string().trim().email().lowercase().required().messages({
    'string.email': 'Please enter a valid email address',
    'string.empty': 'Email is required'
  }),
}).required();

// ✅ ADDED: Reset Password Schema
const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    'string.empty': 'Reset token is required'
  }),
  password: Joi.string()
    .min(6)
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$"))
    .required()
    .messages({
      "string.empty": "Password is required",
      "string.min": "Password must be at least 6 characters long",
      "string.pattern.base": "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    }),
  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Passwords do not match',
      'string.empty': 'Please confirm your password'
    }),
}).required();

const upgradeToSellerSchema = Joi.object({
  shopName: Joi.string().trim().required().messages({
    'string.empty': 'Shop name is required'
  }),
  shopAddress: addressSchema.required().messages({
    'any.required': 'Shop address is required'
  }),
}).required();

const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(3).messages({
    'string.min': 'Name must be at least 3 characters long'
  }),
  mobNo: Joi.string()
    .trim()
    .pattern(/^[6-9]\d{9}$/)
    .messages({
      "string.pattern.base": "Please provide a valid 10-digit Indian mobile number",
    }),
});

const updateSellerInfoSchema = Joi.object({
  shopName: Joi.string().trim(),
  shopAddress: addressSchema,
}).optional();

module.exports = {
  signupSchema,
  googleAuthSchema,
  loginSchema,
  updateProfileSchema,
  upgradeToSellerSchema,
  updateSellerInfoSchema,
  forgotPasswordSchema,
  resetPasswordSchema
};