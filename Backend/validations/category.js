const Joi = require('joi');

const createCategorySchema = Joi.object({
    name: Joi.string().trim().min(3).required(),
    parentId: Joi.string().hex().length(24).allow(null).optional()
});

const updateCategorySchema = Joi.object({
    name: Joi.string().trim().min(3),
    parentId: Joi.string().hex().length(24).allow(null)
});

module.exports = {
    createCategorySchema,
    updateCategorySchema
};