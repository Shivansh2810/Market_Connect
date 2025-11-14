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

router.post("/admin/login", validate(loginSchema), userController.adminLogin);

router.put(
  "/upgradetoseller",
  protect,
  validate(upgradeToSellerSchema),
  userController.upgradeToSeller
);

router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/login?error=google_auth_failed`,
  }),
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
  validate(updateProfileSchema, "body"),
  userController.updateProfile
);

router.get("/me/addresses", protect, userController.getAddresses);
router.post(
  "/me/addresses",
  protect,
  validate(addressSchema, "body"),
  userController.addAddress
);
router.put(
  "/me/addresses/:addressId",
  protect,
  validate(addressSchema, "body"),
  userController.updateAddress
);
router.delete(
  "/me/addresses/:addressId",
  protect,
  userController.deleteAddress
);

router.get("/me/orders", protect, orderController.getMyOrders);

module.exports = router;
