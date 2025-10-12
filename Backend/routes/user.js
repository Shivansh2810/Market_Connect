const express = require("express");
const passport = require("passport");
const router = express.Router();
const userController = require("../controllers/user");

// Signup
router.post("/api/signup", userController.signup);

// Login
router.post("/api/login", userController.login);

// Google OAuth
router.get(
  "/api/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/api/auth/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/" }),
  userController.googleAuth
);

module.exports = router;
