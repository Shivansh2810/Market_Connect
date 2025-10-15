const User = require("../models/user");
const jwt = require("jsonwebtoken");

// ---------------- SIGNUP ----------------
exports.signup = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      role,
      mobNo,
      sellerInfo,
    } = req.body;

    // Check required fields
    if (!firstName || !lastName || !email || !password || !confirmPassword || !role) {
      return res.status(400).json({ message: "All required fields must be filled" });
    }

    // Password confirmation
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Role validation
    const validRoles = ["buyer", "seller", "both"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role selected" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Build user data
    const userData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      password: password.trim(),
      role,
      mobNo,
    };

    // If seller or both, include shop details
    if (role === "seller" || role === "both") {
      if (!sellerInfo || !sellerInfo.shopName || !sellerInfo.shopAddress) {
        return res.status(400).json({
          message: "Shop name and shop address are required for sellers",
        });
      }
      userData.sellerInfo = sellerInfo;
    }

    // Save new user
    const newUser = new User(userData);
    await newUser.save();

    // Generate JWT
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.status(201).json({
      message: "Account created successfully",
      token,
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------------- LOGIN ----------------
exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Role check with "both" support
    if (role) {
      if (user.role === "both") {
        if (!["buyer", "seller"].includes(role)) {
          return res.status(403).json({ message: `Access denied for role: ${role}` });
        }
      } else if (user.role !== role) {
        return res.status(403).json({ message: `Access denied for role: ${role}` });
      }
    }

    // Google login check
    if (!user.password) {
      return res.status(401).json({ message: "This account is linked with Google. Please use Google login." });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: role || user.role, // return the role used to login
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ---------------- GOOGLE AUTH ----------------
exports.googleAuth = (req, res) => {
  res.status(200).json({
    message: "Google login successful",
    token: req.user.token,
    user: req.user.user,
  });
};
