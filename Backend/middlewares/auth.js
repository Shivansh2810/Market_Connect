const jwt = require("jsonwebtoken");
const User = require("../models/user");


exports.protect = async (req, res, next) => {
  try {
    // Extract token from "Authorization" header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];

    const decodedData = jwt.verify(token, process.env.JWT_SECRET);

    const authenticatedUser = await User.findById(decodedData.id);
    if (!authenticatedUser) {
      return res.status(404).json({ message: "User not found or removed." });
    }

    req.user = authenticatedUser;

    next(); 
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token." });
  }
};
