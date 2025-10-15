const jwt = require("jsonwebtoken");
const User = require("../models/user");

// Middleware to verify JWT and protect routes
exports.protect = async (req, res, next) => {
  try {
    // Extract token from "Authorization" header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    const decodedData = jwt.verify(token, process.env.JWT_SECRET);

    // Find user by ID stored in token
    const authenticatedUser = await User.findById(decodedData.id);
    if (!authenticatedUser) {
      return res.status(404).json({ message: "User not found or removed." });
    }

    // Attach user to request for next middleware/controller
    req.user = authenticatedUser;

    next(); // Continue to next route handler
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token." });
  }
};
