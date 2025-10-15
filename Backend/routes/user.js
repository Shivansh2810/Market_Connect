const express = require("express");
const passport = require("passport");
const router = express.Router();
const userController = require("../controllers/user");

// ---------------- USER AUTH ROUTES ----------------

// User Signup
router.post("/api/signup", userController.signup);

// User Login
router.post("/api/login", userController.login);

// ---------------- GOOGLE OAUTH ROUTES ----------------

// Step 1: Redirect user to Google for authentication
router.get(
  "/api/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Step 2: Google redirects back to this callback URL after successful login
router.get(
  "/api/auth/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/" }),
  userController.googleAuth
);

module.exports = router;
