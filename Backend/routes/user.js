const express = require("express");
const passport = require("passport");
const router = express.Router();
const { validateUser } = require("../middlewares");
const userController = require("../controllers/user");

router.post("/signup", validateUser, userController.signup);

router.post("/login", (req, res, next) => {
  passport.authenticate("local", { session: false }, (err, user, info) => {
    if (err) return next(err);

    if (!user) {
      return res.status(401).json({
        message: info?.message || "Invalid Credentials",
      });
    }

    if(user.role !== req.body.role){
        return res.status(403).json({
            message: "Access Denied. You are not authorized to log in as a " + req.body.role + ".",
        });
    }

    req.user = user;
    userController.login(req,res);
    
  })(req, res, next);
});

module.exports = router;
