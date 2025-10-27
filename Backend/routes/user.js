const express = require("express");
const passport = require("passport");
const router = express.Router();
const userController = require("../controllers/user");

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

module.exports = router;
