const Joi = require("joi");

const createProductSchema = Joi.object({
    title: Joi.string().trim().min(3).max(140).required(),
    description: Joi.string().trim().max(5000).required(),
    categoryId: Joi.string().hex().length(24),
    tags: Joi.array().items(Joi.string().trim()).default([]),
    price: Joi.number().min(0).required(),
    currency: Joi.string().valid('INR', 'USD').default('INR'),
    stock: Joi.number().integer().min(0).required(),
    condition: Joi.string().valid('new', 'used', 'refurbished').default('new'),
    specs: Joi.object().pattern(Joi.string(), Joi.string()).default({})
});

const updateProductSchema = Joi.object({
    title: Joi.string().trim().min(3).max(140),
    description: Joi.string().trim().max(5000),
    categoryId: Joi.string().hex().length(24),
    tags: Joi.array().items(Joi.string().trim()),
    images: Joi.array().items(
        Joi.object({
            url: Joi.string().uri().required(),
            publicId: Joi.string().required(),
            isPrimary: Joi.boolean()
        })
    ),
    price: Joi.number().min(0),
    currency: Joi.string().valid('INR', 'USD'),
    stock: Joi.number().integer().min(0),
    condition: Joi.string().valid('new', 'used', 'refurbished'),
    specs: Joi.object().pattern(Joi.string(), Joi.string())
});


module.exports = {
    createProductSchema,
    updateProductSchema,
}