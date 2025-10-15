const Joi = require('joi');

const createReviewSchema = Joi.object({
    productId: Joi.string().hex().length(24).required(),
    orderId: Joi.string().hex().length(24).required(),

    rating: Joi.number().integer().min(1).max(5).required(),

    comment: Joi.string().trim().max(3000).optional().allow(''),

    images: Joi.array().items(
        Joi.object({
            url: Joi.string().uri().required(),
            publicId: Joi.string().required()
        })
    ).optional()
});

const updateReviewSchema = Joi.object({
    rating: Joi.number().integer().min(1).max(5),
    comment: Joi.string().trim().max(3000).allow(''),
    images: Joi.array().items(
        Joi.object({
            url: Joi.string().uri().required(),
            publicId: Joi.string().required()
        })
    )
});

module.exports = {
    createReviewSchema,
    updateReviewSchema
};