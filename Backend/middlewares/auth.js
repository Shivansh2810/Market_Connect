const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Product = require("../models/product");


exports.protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer")) {
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

exports.isAdmin = (req, res, next) => {
  const adminEmails = ['admin@marketplace.com'];
  
  if (adminEmails.includes(req.user.email)) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: "Access denied. Admin privileges required."
    });
  }
};

exports.isSeller = (req, res, next) => {
  const isSeller = req.user.role === 'seller' || req.user.role === 'both';
  
  if (isSeller) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: "Access denied. Seller privileges required."
    });
  }
};

//to check if user trying to edit/delete a product is its owner
exports.isOwner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(403).json({ message: "Product not found." });
    }

    if (product.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Forbidden: You do not own this product." });
    }
    
    req.product = product;
    next();
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};