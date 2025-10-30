const Joi = require("joi");

const applyCouponSchema = Joi.object({
  couponCode: Joi.string().trim().uppercase().required().messages({
    'string.empty': 'Coupon code is required',
    'any.required': 'Please enter a coupon code'
  }),
  cartValue: Joi.number().min(0).required().messages({
    'number.min': 'Cart value cannot be negative',
    'any.required': 'Cart value is required'
  })
});

const createCouponSchema = Joi.object({
  code: Joi.string().trim().uppercase().min(3).max(20).required().messages({
    'string.empty': 'Coupon code is required',
    'string.min': 'Coupon code must be at least 3 characters',
    'string.max': 'Coupon code cannot exceed 20 characters'
  }),
  description: Joi.string().trim().max(500).optional(),
  discountAmount: Joi.number().min(1).required().messages({
    'number.min': 'Discount amount must be at least 1',
    'any.required': 'Discount amount is required'
  }),
  minOrderValue: Joi.number().min(0).default(0),
  validFrom: Joi.date().optional(),
  validUntil: Joi.date().greater('now').required().messages({
    'date.greater': 'Valid until date must be in the future'
  }),
  usageLimit: Joi.number().min(1).optional(),
  isActive: Joi.boolean().default(true),
  applicableCategories: Joi.array().items(
    Joi.string().hex().length(24)
  ).optional()
});

const updateCouponSchema = Joi.object({
  description: Joi.string().trim().max(500).optional(),
  discountAmount: Joi.number().min(1).optional(),
  minOrderValue: Joi.number().min(0).optional(),
  validUntil: Joi.date().greater('now').optional(),
  usageLimit: Joi.number().min(1).optional(),
  isActive: Joi.boolean().optional(),
  applicableCategories: Joi.array().items(
    Joi.string().hex().length(24)
  ).optional()
});

module.exports = {
  applyCouponSchema,
  createCouponSchema,
  updateCouponSchema
};