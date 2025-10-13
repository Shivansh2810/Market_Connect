// controllers/user.js
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// ----------------- SIGNUP -----------------
exports.signup = async (req, res) => {
  try {
    const { name, email, password, role, mobNo, profilePic } = req.body;

    // Trim inputs
    const trimmedEmail = email.trim();
    const trimmedPassword = password ? password.toString().trim() : undefined;

    // Check if user exists
    const existingUser = await User.findOne({ email: trimmedEmail });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    // Create user with plain password
    const newUser = new User({
      name,
      email: trimmedEmail,
      password: trimmedPassword,
      role,
      mobNo,
      profilePic,
    });

    await newUser.save();

    // Generate JWT
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.status(200).json({
      message: "User registered successfully",
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ----------------- LOGIN -----------------
exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find user and include password
    const user = await User.findOne({ email: email.trim() }).select("+password");
    if (!user)
      return res.status(401).json({ message: "Invalid email or password" });

    // Check role
    if (role && user.role !== role)
      return res
        .status(403)
        .json({ message: `Access denied for role: ${role}` });

    // If user has no password (Google OAuth)
    if (!user.password)
      return res.status(401).json({
        message: "This account is registered via Google. Use Google login.",
      });

    // Compare password
    const isMatch = await user.comparePassword(password);

    if (!isMatch)
      return res.status(401).json({ message: "Invalid email or password" });

    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// ----------------- GOOGLE AUTH -----------------
exports.googleAuth = (req, res) => {
  res.json({
    message: "Google login successful",
    token: req.user.token,
    user: req.user.user,
  });
};
