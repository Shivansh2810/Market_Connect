const express = require("express");
const passport = require("passport");
const router = express.Router();
const userController = require("../controllers/user");
const orderController = require("../controllers/orderController");
const { updateProfileSchema } = require("../validations/user");
const addressSchema = require("../validations/sharedSchema");
const validate = require("../middlewares/validateSchema");
const { protect } = require("../middlewares/auth");
const {
  signupSchema,
  loginSchema,
  adminLoginSchema,
  upgradeToSellerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require("../validations/user");

router.post("/signup", validate(signupSchema), userController.signup);

router.post("/login", validate(loginSchema), userController.login);

router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  userController.forgotPassword
);
router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  userController.resetPassword
);

router.post("/admin/login", validate(adminLoginSchema), userController.adminLogin);

router.put(
  "/upgradetoseller",
  protect, 
  validate(upgradeToSellerSchema),
  userController.upgradeToSeller
);

router.get(
  "/auth/google",
  (req, res, next) => {
    console.log('Initiating Google OAuth flow');
    next();
  },
  passport.authenticate("google", { 
    scope: ["profile", "email"],
    prompt: "select_account"
  })
);

router.get(
  "/auth/google/callback",
  (req, res, next) => {
    console.log('Google OAuth callback received');
    console.log('Query params:', req.query);
    
    if (req.query.error) {
      console.error(' Google OAuth error:', req.query.error);
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      return res.redirect(`${frontendUrl}/login?error=${req.query.error}`);
    }
    
    next();
  },
  (req, res, next) => {
    passport.authenticate("google", {
      session: false,
    }, (err, userObj, info) => {
      console.log('Passport authenticate callback triggered');
      
      if (err) {
        console.error('Passport authentication error:', err);
        console.error('Error details:', err.message, err.stack);
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        return res.redirect(`${frontendUrl}/login?error=auth_error`);
      }
      
      if (!userObj) {
        console.error(' No user returned from passport');
        console.error('Info:', info);
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        return res.redirect(`${frontendUrl}/login?error=no_user`);
      }
      
      console.log(' User object received:', {
        hasUser: !!userObj.user,
        hasToken: !!userObj.token,
        userId: userObj.user?._id
      });
      
      // Set the user object on req.user
      req.user = userObj;
      next();
    })(req, res, next);
  },
  userController.googleAuth
);

router.get("/auth/google/success", protect, (req, res) => {
  res.json({
    success: true,
    user: req.user,
    requiresPhoneUpdate: req.user.mobNo === "0000000000",
  });
});

router.get("/me", protect, userController.getMe);
router.put(
  "/me/profile",
  protect,
  validate(updateProfileSchema),
  userController.updateProfile
);

router.delete("/me", protect, userController.deleteMe);

router.get("/me/addresses", protect, userController.getAddresses);
router.post(
  "/me/addresses",
  protect,
  validate(addressSchema),
  userController.addAddress
);
router.put(
  "/me/addresses/:addressId",
  protect,
  validate(addressSchema),
  userController.updateAddress
);
router.delete(
  "/me/addresses/:addressId",
  protect,
  userController.deleteAddress
);

router.get("/me/orders", protect, orderController.getMyOrders);

module.exports = router;