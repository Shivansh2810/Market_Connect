const Joi = require("joi");

const addToCartSchema = Joi.object({
  productId: Joi.string().hex().length(24).required().messages({
    'string.hex': 'Product ID must be a valid MongoDB ID',
    'string.length': 'Product ID must be 24 characters long'
  }),
  quantity: Joi.number().integer().min(1).max(100).default(1).messages({
    'number.min': 'Quantity must be at least 1',
    'number.max': 'Quantity cannot exceed 100'
  })
});

const updateCartSchema = Joi.object({
  quantity: Joi.number().integer().min(1).max(100).required().messages({
    'number.min': 'Quantity must be at least 1',
    'number.max': 'Quantity cannot exceed 100'
  })
});

module.exports = {
  addToCartSchema,
  updateCartSchema
};