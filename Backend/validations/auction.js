const Joi = require('joi');

const createAuctionSchema = Joi.object({
  // Product details
  title: Joi.string().min(3).max(200).required().messages({
    'string.empty': 'Product title is required.',
    'string.min': 'Title must be at least 3 characters long.',
    'string.max': 'Title must not exceed 200 characters.'
  }),

  description: Joi.string().min(10).required().messages({
    'string.empty': 'Product description is required.',
    'string.min': 'Description must be at least 10 characters long.'
  }),

  categoryId: Joi.string().hex().length(24).required().messages({
    'string.empty': 'Category is required.',
    'string.hex': 'Must be a valid Category ID.'
  }),

  images: Joi.array().items(
    Joi.object({
      url: Joi.string().uri().required()
    })
  ).optional().messages({
    'array.base': 'Images must be an array.'
  }),

  price: Joi.number().min(0).optional().messages({
    'number.base': 'Price must be a number.'
  }),

  condition: Joi.string().valid('new', 'like-new', 'good', 'fair', 'refurbished').optional().default('new'),

  stock: Joi.number().min(1).optional().default(1).messages({
    'number.base': 'Stock must be a number.',
    'number.min': 'Stock must be at least 1.'
  }),

  specs: Joi.object().optional(),

  // Auction details
  startTime: Joi.date().iso().required().messages({
    'date.base': 'Start time must be a valid date.',
    'any.required': 'Start time is required.'
  }),

  endTime: Joi.date().iso().greater(Joi.ref('startTime')).required().messages({
    'date.base': 'End time must be a valid date.',
    'date.greater': 'End time must be after the start time.',
    'any.required': 'End time is required.'
  }),

  startPrice: Joi.number().min(1).required().messages({
    'number.base': 'Starting price must be a number.',
    'number.min': 'Starting price must be at least 1.',
    'any.required': 'Starting price is required.'
  })
});

const updateAuctionSchema = Joi.object({
  endTime: Joi.date().iso().optional()
});

module.exports = {
  createAuctionSchema,
  updateAuctionSchema
};