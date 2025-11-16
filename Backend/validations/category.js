const Joi = require('joi');

const createCategorySchema = Joi.object({
    name: Joi.string().trim().min(3).required(),
    parentId: Joi.alternatives().try(
        Joi.string().hex().length(24),
        Joi.string().allow('', null),
        Joi.valid(null)
    ).optional().default(null)
});

const updateCategorySchema = Joi.object({
    name: Joi.string().trim().min(3),
    parentId: Joi.alternatives().try(
        Joi.string().hex().length(24),
        Joi.string().allow('', null),
        Joi.valid(null)
    ).optional()
});

module.exports = {
    createCategorySchema,
    updateCategorySchema
};