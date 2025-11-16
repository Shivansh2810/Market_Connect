const validate = (schema) => (req, res, next) => {
  const options = {
    allowUnknown: true, 
    stripUnknown: true, 
  };

  const { error, value } = schema.validate(req.body, options); 
  if (error) {
    return res.status(400).json({
      message: "Validation failed",
      error: error.details[0].message,
    });
  }

  req.body = value; 
  next();
};

module.exports = validate;
