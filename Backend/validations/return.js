const Joi = require("joi");

// Validation for requesting a return
const requestReturnSchema = Joi.object({
  orderId: Joi.string()
    .hex()
    .length(24)
    .required()
    .messages({
      "string.hex": "Invalid order ID format",
      "string.length": "Order ID must be 24 characters",
      "any.required": "Order ID is required",
    }),

  items: Joi.array()
    .items(
      Joi.object({
        productId: Joi.string()
          .hex()
          .length(24)
          .required()
          .messages({
            "string.hex": "Invalid product ID format",
            "string.length": "Product ID must be 24 characters",
            "any.required": "Product ID is required",
          }),
        quantity: Joi.number()
          .integer()
          .min(1)
          .required()
          .messages({
            "number.base": "Quantity must be a number",
            "number.min": "Quantity must be at least 1",
            "any.required": "Quantity is required",
          }),
      })
    )
    .min(1)
    .required()
    .messages({
      "array.min": "At least one item must be returned",
      "any.required": "Items array is required",
    }),

  reason: Joi.string()
    .valid(
      "Damaged Item",
      "Wrong Item Sent",
      "Item Not as Described",
      "Size Issue",
      "No Longer Needed",
      "Other"
    )
    .required()
    .messages({
      "any.only": "Invalid return reason",
      "any.required": "Reason is required",
    }),

  description: Joi.string()
    .max(500)
    .allow("")
    .optional()
    .messages({
      "string.max": "Description cannot exceed 500 characters",
    }),
});

// Validation for rejecting a return
const rejectReturnSchema = Joi.object({
  rejectionReason: Joi.string()
    .max(500)
    .required()
    .messages({
      "string.max": "Rejection reason cannot exceed 500 characters",
      "any.required": "Rejection reason is required",
    }),
});

module.exports = {
  requestReturnSchema,
  rejectReturnSchema,
};