const express = require("express");
const passport = require("passport");
const router = express.Router();
const userController = require("../controllers/user");
const { updateProfileSchema } = require("../validations/user");
const addressSchema = require("../validations/sharedSchema");
const validate = require("../middlewares/validateSchema");
const { protect } = require("../middlewares/auth");
const {
  signupSchema,
  loginSchema,
  upgradeToSellerSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} = require("../validations/user");

router.post("/signup", validate(signupSchema), userController.signup);

router.post("/login", validate(loginSchema), userController.login);


router.post("/forgot-password", validate(forgotPasswordSchema), userController.forgotPassword);
router.post("/reset-password", validate(resetPasswordSchema), userController.resetPassword);

router.post(
    "/admin/login",
    validate(loginSchema), 
    userController.adminLogin
);

router.put(
    "/upgradetoseller",
    protect, 
    validate(upgradeToSellerSchema), 
    userController.upgradeToSeller 
);

router.get(
  "/api/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/api/auth/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/" }),
  userController.googleAuth
);

router.get("/me", protect, userController.getMe);
router.put(
  "/api/me/profile",
  protect,
  validate(updateProfileSchema, "body"),
  userController.updateProfile
);

router.get("/api/me/addresses", protect, userController.getAddresses);
router.post(
  "/api/me/addresses",
  protect,
  validate(addressSchema, "body"),
  userController.addAddress
);
router.put(
  "/api/me/addresses/:addressId",
  protect,
  validate(addressSchema, "body"),
  userController.updateAddress
);
router.delete(
  "/api/me/addresses/:addressId",
  protect,
  userController.deleteAddress
);

router.get("/api/me/orders", protect, userController.getMyOrders);

module.exports = router;