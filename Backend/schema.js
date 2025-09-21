const Joi = require("joi");

const userSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string()
    .email({ tlds: { allow: true } })
    .required()
    .messages({
      "string.email":
        "Please select an Email with a valid domain-name (like: gmail.com, dau.ac.in)",
    }),
  password: Joi.string()
    .min(6)
    .required()
    .messages({
      "string.min": "Password must be at least 6 characters long.",
    }),
  role: Joi.string().valid("buyer", "seller").required(),
}).required();

const loginSchema = Joi.object({
  email: Joi.string().required(),
  password: Joi.string().required(),
  role: Joi.string().valid("buyer", "seller").required(),
});

module.exports = { userSchema, loginSchema };
