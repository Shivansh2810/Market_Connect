const User = require("../models/user");

module.exports.signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const newUser = new User({name, email, role});

    const registeredUser = await User.register(newUser, password);

    return res.status(200).json({
      message: "User registered successfully!",
    });
  } catch (err) {
    return res.status(401).json({
      message: err.message,
    });
  }
};

module.exports.login = (req, res) => {
  res.status(200).json({
    message: "Login Successful!",
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
};
