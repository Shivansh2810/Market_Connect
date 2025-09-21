const Joi = require("joi");

const passwordComplexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).*$/;

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
    .pattern(passwordComplexityRegex)
    .required()
    .messages({
      "string.min": "Password must be at least 8 characters long.",
      "string.pattern.base":
        "Password must contain at least one uppercase letter, one lowercase letter, and one special symbol.",
    }),
  role: Joi.string().valid("buyer", "seller").required(),
}).required();

const loginSchema = Joi.object({
  email: Joi.string().required(),
  password: Joi.string().required(),
  role: Joi.string().valid("buyer", "seller").required(),
});

module.exports = { userSchema, loginSchema };
