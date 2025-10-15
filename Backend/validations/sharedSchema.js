const Joi = require("joi");

const addressSchema = Joi.object({
    street: Joi.string().trim().required(),
    city: Joi.string().trim().required(),
    state: Joi.string().trim().required(),
    pincode: Joi.string()
        .trim()
        .length(6)
        .pattern(/^[0-9]+$/) 
        .required()
        .messages({
            'string.length': 'Pincode must be exactly 6 digits.',
            'string.pattern.base': 'Pincode must only contain numbers.'
        }),
    country: Joi.string().trim().default('India')
});

module.exports = addressSchema;