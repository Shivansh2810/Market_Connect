const Joi = require("joi");

// Validation for creating Razorpay order
const createRazorpayOrderSchema = Joi.object({
  orderId: Joi.string()
    .hex()
    .length(24)
    .required()
    .messages({
      "string.hex": "Invalid order ID format",
      "string.length": "Order ID must be 24 characters",
      "any.required": "Order ID is required",
      "string.empty": "Order ID cannot be empty",
    }),
});

// Validation for verifying payment
const verifyPaymentSchema = Joi.object({
  razorpayOrderId: Joi.string()
    .required()
    .messages({
      "any.required": "Razorpay Order ID is required",
      "string.empty": "Razorpay Order ID cannot be empty",
    }),
  razorpayPaymentId: Joi.string()
    .required()
    .messages({
      "any.required": "Razorpay Payment ID is required",
      "string.empty": "Razorpay Payment ID cannot be empty",
    }),
  razorpaySignature: Joi.string()
    .required()
    .messages({
      "any.required": "Razorpay Signature is required",
      "string.empty": "Razorpay Signature cannot be empty",
    }),
  orderId: Joi.string()
    .hex()
    .length(24)
    .required()
    .messages({
      "string.hex": "Invalid order ID format",
      "string.length": "Order ID must be 24 characters",
      "any.required": "Order ID is required",
      "string.empty": "Order ID cannot be empty",
    }),
});

// Validation for initiating refund
const initiateRefundSchema = Joi.object({
  orderId: Joi.string()
    .hex()
    .length(24)
    .required()
    .messages({
      "string.hex": "Invalid order ID format",
      "string.length": "Order ID must be 24 characters",
      "any.required": "Order ID is required",
      "string.empty": "Order ID cannot be empty",
    }),
  refundAmount: Joi.number()
    .positive()
    .optional()
    .messages({
      "number.base": "Refund amount must be a number",
      "number.positive": "Refund amount must be positive",
    }),
  reason: Joi.string()
    .max(200)
    .optional()
    .messages({
      "string.max": "Reason cannot exceed 200 characters",
    }),
});

module.exports = {
  createRazorpayOrderSchema,
  verifyPaymentSchema,
  initiateRefundSchema,
};