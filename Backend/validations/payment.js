// const Joi = require("joi");

// // Validation for creating Razorpay order
// const createRazorpayOrderSchema = Joi.object({
//   orderId: Joi.string().required().messages({
//     "any.required": "Order ID is required",
//     "string.empty": "Order ID cannot be empty",
//   }),
// });

// // Validation for verifying payment
// const verifyPaymentSchema = Joi.object({
//   razorpayOrderId: Joi.string().required().messages({
//     "any.required": "Razorpay Order ID is required",
//     "string.empty": "Razorpay Order ID cannot be empty",
//   }),
//   razorpayPaymentId: Joi.string().required().messages({
//     "any.required": "Razorpay Payment ID is required",
//     "string.empty": "Razorpay Payment ID cannot be empty",
//   }),
//   razorpaySignature: Joi.string().required().messages({
//     "any.required": "Razorpay Signature is required",
//     "string.empty": "Razorpay Signature cannot be empty",
//   }),
//   orderId: Joi.string().required().messages({
//     "any.required": "Order ID is required",
//     "string.empty": "Order ID cannot be empty",
//   }),
// });

// // Validation for initiating refund yet to be added

// module.exports = {
//   createRazorpayOrderSchema,
//   verifyPaymentSchema,
// };