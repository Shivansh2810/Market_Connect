/**
 * Middleware factory to validate request body/params/query using Joi schema
 * Usage: validate(schema, 'body') or validate(schema, 'params')
 */
module.exports = function validate(schema, target = "body") {
  return (req, res, next) => {
    const data = req[target];
    const { error, value } = schema.validate(data);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    // replace validated portion with the validated & truncated values
    req[target] = value;
    next();
  };
};
