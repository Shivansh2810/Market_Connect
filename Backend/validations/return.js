const Joi = require("joi");

const returnItemSchema = Joi.object({
  product: Joi.string().hex().length(24).required(),
  quantity: Joi.number().integer().min(1).required(),
});

const createReturnSchema = Joi.object({
  order: Joi.string().hex().length(24).required(),
  items: Joi.array().items(returnItemSchema).min(1).required(),
  reason: Joi.string()
    .valid(
      "Damaged Item",
      "Wrong Item Sent",
      "Item Not as Described",
      "Size Issue",
      "No Longer Needed",
      "Other"
    )
    .required(),
});

const updateReturnSchema = Joi.object({
  status: Joi.string()
    .valid(
      "Approved",
      "Rejected",
      "Shipped by Buyer",
      "Received by Seller",
      "Completed"
    )
    .required(),

  resolution: Joi.string()
    .valid("Refund", "Replacement", "Store Credit")
    .optional(),
});

module.exports = {
  createReturnSchema,
  updateReturnSchema,
};
