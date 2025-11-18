const Joi = require('joi');
const addressSchema = require("./sharedSchema");

const orderItemSchema = Joi.object({
    productId: Joi.alternatives().try(
        Joi.string().hex().length(24), // Valid MongoDB ObjectId
        Joi.string().valid('cart')      // Special case for cart orders
    ).required(),
    quantity: Joi.number().integer().min(1).required()
});

const createOrderSchema = Joi.object({
    shippingInfo: addressSchema.required(),
    orderItems: Joi.array().items(orderItemSchema).min(1).required(),
    // payment: Joi.string().hex().length(24).required() // Commented since payment object is not made before creeating order
    
    // Added: Allowing coupon code in request body
    couponCode: Joi.string().trim().uppercase().optional().allow('')
});

const updateOrderStatusSchema = Joi.object({
    status: Joi.string().valid(
        "Payment Failed",
        "Order Placed",
        "Shipped",
        "Delivered",
        "Cancelled",
        "Returned",
        "Partially Refunded",
        "Refunded").required()
});


module.exports = {
    createOrderSchema,
    updateOrderStatusSchema
};