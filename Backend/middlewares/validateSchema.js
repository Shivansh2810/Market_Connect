const validate = (schema) => (req, res, next) => {
  const options = {
    allowUnknown: true, 
    stripUnknown: true, 
  };

  const { error, value } = schema.validate(req.body, options); 
  if (error) {
    console.error('Validation Error:', error.details[0].message, 'Field:', error.details[0].context);
    return res.status(400).json({
      message: error.details[0].message,
      error: error.details[0].message,
    });
  }

  req.body = value; 
  next();
};

module.exports = validate;
