// middlewares.js
const { userSchema, loginSchema } = require("./schema");

/*
 * Ensures all required user fields are present and valid before creating an account
 */
exports.validateSignup = (req, res, next) => {
  const { error } = userSchema.validate(req.body, { abortEarly: false });

  if (error) {
    const details = error.details.map((err) => err.message);
    return res.status(400).json({
      message: "Invalid signup data",
      errors: details,
    });
  }

  next(); // Continue to controller
};

/*
 * Checks if email and password are correctly formatted and provided
 */
exports.validateLogin = (req, res, next) => {
  const { error } = loginSchema.validate(req.body, { abortEarly: false });

  if (error) {
    const details = error.details.map((err) => err.message);
    return res.status(400).json({
      message: "Invalid login data",
      errors: details,
    });
  }

  next(); // Continue to controller
};
