const Joi = require('joi');
const addressSchema = require("./sharedSchemas");

const orderItemSchema = Joi.object({
    productId: Joi.string().hex().length(24).required(),
    quantity: Joi.number().integer().min(1).required()
});

const createOrderSchema = Joi.object({
    shippingInfo: addressSchema.required(),
    orderItems: Joi.array().items(orderItemSchema).min(1).required(),
    payment: Joi.string().hex().length(24).required()
});

const updateOrderStatusSchema = Joi.object({
    status: Joi.string().valid("Order Placed", "Shipped", "Delivered", "Cancelled", "Returned", "Payment Failed").required()
});


module.exports = {
    createOrderSchema,
    updateOrderStatusSchema
};