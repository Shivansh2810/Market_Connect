const express = require("express");
const passport = require("passport");
const router = express.Router();
const userController = require("../controllers/user");
const { protect } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const { updateProfileSchema } = require("../validations/user");
const addressSchema = require("../validations/sharedSchema");

router.post("/api/signup", userController.signup);

router.post("/api/login", userController.login);

router.get(
  "/api/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/api/auth/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/" }),
  userController.googleAuth
);

// Protected user profile routes
router.get("/api/me", protect, userController.getMe);
router.put(
  "/api/me/profile",
  protect,
  validate(updateProfileSchema, "body"),
  userController.updateProfile
);

// Addresses
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

// Orders
router.get("/api/me/orders", protect, userController.getMyOrders);

module.exports = router;
