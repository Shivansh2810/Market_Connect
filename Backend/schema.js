const Joi = require("joi");

const profilePicSchema = Joi.object({
  public_id: Joi.string().required(),
  url: Joi.string().uri().required(),
});

const userSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid("buyer", "seller", "both").required(),
  mobNo: Joi.string().length(10).pattern(/^[0-9]+$/).required(),
  profilePic: profilePicSchema.required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  role: Joi.string().valid("buyer", "seller", "both").required(),
});

module.exports = { userSchema, loginSchema };
