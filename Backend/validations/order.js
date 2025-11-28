const Joi = require('joi');
const addressSchema = require("./sharedSchema");

const orderItemSchema = Joi.object({
    productId: Joi.alternatives().try(
        Joi.string().hex().length(24), 
        Joi.string().valid('cart')      
    ).required(),
    quantity: Joi.number().integer().min(1).required()
});

const createOrderSchema = Joi.object({
    shippingInfo: addressSchema.required(),
    orderItems: Joi.array().items(orderItemSchema).min(1).required(),
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

const updateAuctionAddressSchema = Joi.object({
    shippingInfo: addressSchema.required()
});


module.exports = {
    createOrderSchema,
    updateOrderStatusSchema,
    updateAuctionAddressSchema   
};