const User = require("../models/user");
const Order = require("../models/order");
const jwt = require("jsonwebtoken");
const { updateProfileSchema } = require("../validations/user");
const addressJoiSchema = require("../validations/sharedSchema");

exports.signup = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      confirmPassword,
      mobNo,
    } = req.body;

    if (!name || !email || !password || !confirmPassword|| !mobNo) {
      return res
        .status(400)
        .json({ message: "All required fields must be filled" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const existingUser = await User.findOne({
      email: email.trim().toLowerCase(),
    });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const userData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: password.trim(),
      mobNo,
    };

    const newUser = new User(userData);
    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.status(201).json({
      message: "Account created successfully",
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password");

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (role) {
      if (user.role === "both") {
        if (!["buyer", "seller"].includes(role)) {
          return res
            .status(403)
            .json({ message: `Access denied for role: ${role}` });
        }
      } else if (user.role !== role) {
        return res
          .status(403)
          .json({ message: `Access denied for role: ${role}` });
      }
    }

    if (!user.password) {
      return res.status(401).json({
        message: "This account is linked with Google. Please use Google login.",
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

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
        role: role || user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.upgradeToSeller = async (req, res) => {
    try {
        const { shopName, shopAddress } = req.body;
        if (!shopName || !shopAddress) {
             return res.status(400).json({ message: "Shop name and address are required." });
        }

        const userId = req.user.id; 

        const user = await User.findById(userId);

        if (user.role === 'seller' || user.role === 'both') {
            return res.status(400).json({ message: "You are already a seller." });
        }

        user.role = 'both'; 
        user.sellerInfo = { shopName, shopAddress };
        
        await user.save();

        res.status(200).json({
            message: "Congratulations! Your account has been upgraded to a seller.",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                sellerInfo: user.sellerInfo
            }
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



exports.googleAuth = (req, res) => {
  res.status(200).json({
    message: "Google login successful",
    token: req.user.token,
    user: req.user.user,
  });
};

/**
 * GET /api/me
 * Fetch full profile of logged-in user (addresses, cart, wishlist if present)
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("buyerInfo.cart.productId", "title images price stock sellerId")
      .select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const profile = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      mobNo: user.mobNo,
      sellerInfo: user.sellerInfo || null,
      buyerInfo: {
        shippingAddresses:
          user.buyerInfo && user.buyerInfo.shippingAddresses
            ? user.buyerInfo.shippingAddresses
            : [],
        cart: user.buyerInfo && user.buyerInfo.cart ? user.buyerInfo.cart : [],
        wishlist:
          user.buyerInfo && user.buyerInfo.wishlist
            ? user.buyerInfo.wishlist
            : [],
      },
    };

    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * PUT /api/me/profile
 * Update basic profile information (name, mobNo, sellerInfo)
 */
exports.updateProfile = async (req, res) => {
  try {
    const { error, value } = updateProfileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (value.name) user.name = value.name;
    if (value.mobNo) user.mobNo = value.mobNo;
    if (value.sellerInfo)
      user.sellerInfo = { ...user.sellerInfo, ...value.sellerInfo };

    await user.save();
    const updated = await User.findById(user._id).select("-password");
    res.json({ success: true, message: "Profile updated", data: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** Address related handlers */

exports.getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("buyerInfo");
    if (!user) return res.status(404).json({ message: "User not found" });

    const addresses =
      (user.buyerInfo && user.buyerInfo.shippingAddresses) || [];
    res.json({ success: true, data: addresses });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addAddress = async (req, res) => {
  try {
    const { error, value } = addressJoiSchema.validate(req.body);
    if (error)
      return res.status(400).json({ message: error.details[0].message });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.buyerInfo) user.buyerInfo = {};
    if (!user.buyerInfo.shippingAddresses)
      user.buyerInfo.shippingAddresses = [];

    user.buyerInfo.shippingAddresses.push(value);
    await user.save();

    const last =
      user.buyerInfo.shippingAddresses[
        user.buyerInfo.shippingAddresses.length - 1
      ];
    res
      .status(201)
      .json({ success: true, message: "Address added", data: last });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const { error, value } = addressJoiSchema.validate(req.body);
    if (error)
      return res.status(400).json({ message: error.details[0].message });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const address =
      user.buyerInfo && user.buyerInfo.shippingAddresses
        ? user.buyerInfo.shippingAddresses.id(addressId)
        : null;

    if (!address) return res.status(404).json({ message: "Address not found" });

    address.street = value.street;
    address.city = value.city;
    address.state = value.state;
    address.pincode = value.pincode;
    address.country = value.country;

    await user.save();
    res.json({ success: true, message: "Address updated", data: address });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const existing =
      user.buyerInfo && user.buyerInfo.shippingAddresses
        ? user.buyerInfo.shippingAddresses.id(addressId)
        : null;

    if (!existing)
      return res.status(404).json({ message: "Address not found" });

    existing.remove();
    await user.save();

    res.json({ success: true, message: "Address deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/me/orders
 * Fetch order history for logged-in buyer
 */
exports.getMyOrders = async (req, res) => {
  try {
    if (req.user.role === "seller") {
      return res.status(403).json({ message: "Access denied. Not a buyer." });
    }

    const orders = await Order.find({ buyer: req.user._id })
      .populate("orderItems.product", "title images price")
      .populate("seller", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
