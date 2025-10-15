const Joi = require('joi');


const createCouponSchema = Joi.object({
    code: Joi.string().trim().uppercase().min(3).required(),
    description: Joi.string().trim().max(500).optional().allow(''),
    discountValue: Joi.number().min(0).required(),
    minOrderValue: Joi.number().min(0).default(0),
    applicableCategories: Joi.array().items(
        Joi.string().hex().length(24)
    ).default([])
});


const updateCouponSchema = Joi.object({
    code: Joi.string().trim().uppercase().min(3),
    description: Joi.string().trim().max(500).allow(''),
    discountValue: Joi.number().min(0),
    minOrderValue: Joi.number().min(0),
    applicableCategories: Joi.array().items(J.string().hex().length(24))
});

const applyCouponSchema = Joi.object({
    code: Joi.string().trim().uppercase().required()
});

module.exports = {
    createCouponSchema,
    updateCouponSchema,
    applyCouponSchema
};