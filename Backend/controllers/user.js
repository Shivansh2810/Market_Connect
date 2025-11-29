const User = require("../models/user");
const Order = require("../models/order");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.BREVO_EMAIL,
    pass: process.env.BREVO_SMTP_KEY,
  },
  connectionTimeout: 10000,
});

// transporter.verify((error, success) => {
//   if (error) {
//     console.error("Brevo SMTP Error:", error.message);
//   } else {
//     console.log("Brevo SMTP Server is ready to send emails");
//   }
// });

const ADMIN_EMAILS = ["admin@marketplace.com"];

exports.signup = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, mobNo } = req.body;

    if (!name || !email || !password || !confirmPassword || !mobNo) {
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

    if (!email || !password || !role) {
      return res
        .status(400)
        .json({ message: "Email, password and role are required" });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password");

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (user.googleId && !user.password) {
      return res.status(401).json({
        message: "This account uses Google login. Please use Google login.",
      });
    }

    if (user.role !== "both" && user.role !== role) {
      return res
        .status(403)
        .json({
          message: `Access denied for role: ${role}. Your role is: ${user.role}`,
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
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password");

    if (!user || user.role !== "admin") {
      return res.status(401).json({ message: "Invalid admin credentials." });
    }

    if (!user.password) {
      return res
        .status(401)
        .json({ message: "Admin account cannot use Google login." });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid admin credentials." });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.status(200).json({
      message: "Admin login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(404).json({
        message: "User hasn't registered with this email",
      });
    }

    if (user.googleId && !user.password) {
      return res.status(400).json({
        message:
          "This account uses Google login. Please use Google login instead.",
      });
    }

    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = resetPasswordExpire;
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    const mailOptions = {
      from: {
        name: "Market Connect",
        address: process.env.EMAIL_FROM || process.env.BREVO_EMAIL,
      },
      to: user.email,
      subject: "Password Reset Request - Market Connect",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { 
                    font-family: 'Arial', sans-serif; 
                    line-height: 1.6; 
                    color: #333; 
                    margin: 0; 
                    padding: 0; 
                    background-color: #f4f4f4;
                }
                .container { 
                    max-width: 600px; 
                    margin: 0 auto; 
                    background: white;
                    border-radius: 10px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }
                .header { 
                    background: linear-gradient(to right, #3c009d, #5832a8);
                    padding: 30px; 
                    text-align: center; 
                    color: white;
                }
                .logo {
                    font-size: 24px;
                    font-weight: bold;
                    font-family: monospace;
                    margin-bottom: 10px;
                }
                .content { 
                    padding: 30px; 
                }
                .button { 
                    display: inline-block; 
                    padding: 12px 30px; 
                    background: #3c009d; 
                    color: white; 
                    text-decoration: none; 
                    border-radius: 5px; 
                    margin: 20px 0;
                    font-weight: bold;
                }
                .token-box { 
                    background: #f8f9fa; 
                    padding: 15px; 
                    border-radius: 5px; 
                    font-family: monospace; 
                    word-break: break-all;
                    margin: 15px 0;
                    border: 1px solid #e9ecef;
                    font-size: 14px;
                }
                .footer { 
                    margin-top: 30px; 
                    padding-top: 20px; 
                    border-top: 1px solid #eee; 
                    font-size: 12px; 
                    color: #666;
                    text-align: center;
                }
                .instructions {
                    background: #f0f9ff;
                    padding: 15px;
                    border-radius: 5px;
                    border-left: 4px solid #3c009d;
                    margin: 20px 0;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">MARKET CONNECT</div>
                    <h1>Password Reset Request</h1>
                </div>
                <div class="content">
                    <p>Hello <strong>${user.name}</strong>,</p>
                    
                    <p>We received a request to reset your password for your Market Connect account. If you didn't make this request, please ignore this email.</p>
                    
                    <div class="instructions">
                        <p><strong>To reset your password:</strong></p>
                        <ol>
                            <li>Click the button below to reset your password</li>
                            <li>Or copy and paste the reset token on the reset page</li>
                            <li>Create your new password</li>
                        </ol>
                    </div>
                    
                    <div style="text-align: center;">
                        <a href="${resetUrl}" class="button">Reset Your Password</a>
                    </div>
                    
                    <p><strong>Reset Token:</strong></p>
                    <div class="token-box">${resetToken}</div>
                    
                    <p><strong>Important:</strong> This reset link will expire in 10 minutes for security reasons.</p>
                    
                    <p>If you're having trouble clicking the button, copy and paste the following URL into your browser:</p>
                    <p style="color: #3c009d; word-break: break-all;">${resetUrl}</p>
                </div>
                <div class="footer">
                    <p>If you didn't request this reset, please contact our support team immediately.</p>
                    <p>&copy; 2024 Market Connect. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);

    console.log("Password reset email sent to:", user.email);

    res.status(200).json({
      message: "Password reset link has been sent to your email",
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    if (error.code) {
      console.error("Nodemailer error code:", error.code);
      console.error("Nodemailer error message:", error.message);
    }

    res.status(500).json({
      message: "Failed to send reset email. Please try again later.",
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token || !password || !confirmPassword) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long",
      });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired reset token",
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

exports.upgradeToSeller = async (req, res) => {
  try {
    const { shopName, shopAddress } = req.body;
    if (!shopName || !shopAddress) {
      return res
        .status(400)
        .json({ message: "Shop name and address are required." });
    }

    const userId = req.user._id;

    const user = await User.findById(userId);

    if (user.role === "seller" || user.role === "both") {
      return res.status(400).json({ message: "You are already a seller." });
    }

    user.role = "both";
    user.sellerInfo = { shopName, shopAddress };

    await user.save();

    res.status(200).json({
      message: "Congratulations! Your account has been upgraded to a seller.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        sellerInfo: user.sellerInfo,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.googleAuth = (req, res) => {
  try {
    console.log('Google Auth Controller - Processing callback');
    console.log('req.user structure:', JSON.stringify(req.user, null, 2));
    
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    
    if (!req.user) {
      console.error(' No req.user object');
      return res.redirect(`${frontendUrl}/login?error=auth_failed`);
    }

    if (!req.user.user) {
      console.error(' No req.user.user object');
      return res.redirect(`${frontendUrl}/login?error=auth_failed`);
    }

    if (!req.user.token) {
      console.error('No req.user.token');
      return res.redirect(`${frontendUrl}/login?error=auth_failed`);
    }

    const userData = {
      id: req.user.user._id,
      name: req.user.user.name,
      email: req.user.user.email,
      role: req.user.user.role,
      mobNo: req.user.user.mobNo,
      googleId: req.user.user.googleId,
    };

    console.log(' User data prepared:', { id: userData.id, email: userData.email, role: userData.role });

    const redirectUrl = `${frontendUrl}/google-callback?token=${encodeURIComponent(req.user.token)}&userId=${encodeURIComponent(req.user.user._id)}`;

    console.log('Redirecting to frontend:', redirectUrl);
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Google Auth Controller Error:', error);
    console.error('Error stack:', error.stack);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    res.redirect(`${frontendUrl}/login?error=auth_processing_failed`);
  }
};

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
      googleId: user.googleId,
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

exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (req.body.name) user.name = req.body.name;
    if (req.body.mobNo) user.mobNo = req.body.mobNo;
    if (req.body.sellerInfo)
      user.sellerInfo = { ...user.sellerInfo, ...req.body.sellerInfo };

    await user.save();
    const updated = await User.findById(user._id).select("-password");
    res.json({ success: true, message: "Profile updated", data: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.buyerInfo) user.buyerInfo = {};
    if (!user.buyerInfo.shippingAddresses)
      user.buyerInfo.shippingAddresses = [];

    user.buyerInfo.shippingAddresses.push(req.body);
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

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const address =
      user.buyerInfo && user.buyerInfo.shippingAddresses
        ? user.buyerInfo.shippingAddresses.id(addressId)
        : null;

    if (!address) return res.status(404).json({ message: "Address not found" });

    address.street = req.body.street;
    address.city = req.body.city;
    address.state = req.body.state;
    address.pincode = req.body.pincode;
    address.country = req.body.country;

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

exports.deleteMe = async (req, res) => {
  try {
    const userId = req.user && req.user._id;

    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await User.deleteOne({ _id: userId });

    return res.json({ success: true, message: "Account deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

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

exports.googleAuthSuccess = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      mobNo: user.mobNo,
      googleId: user.googleId,
    };

    res.json({
      success: true,
      user: userData,
      requiresPhoneUpdate: user.mobNo === "0000000000" || !user.mobNo,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
