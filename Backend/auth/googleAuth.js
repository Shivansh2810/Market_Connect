const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const jwt = require("jsonwebtoken");
const User = require("../models/user");

// Only register GoogleStrategy when credentials are provided. This prevents
// the app from throwing when imported in test environments that don't set
// GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET.
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback",
      },
      async (accessToken, refreshToken, googleProfile, done) => {
        try {
          let existingUser = await User.findOne({
            email: googleProfile.emails[0].value,
          });

          if (!existingUser) {
            existingUser = new User({
              name: googleProfile.displayName,
              email: googleProfile.emails[0].value,
              profilePic: {
                url: googleProfile.photos[0].value,
                public_id: "google-oauth",
              },
              role: "user",
            });

            await existingUser.save();
          }

          const authToken = jwt.sign(
            { id: existingUser._id },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
          );

          return done(null, { user: existingUser, token: authToken });
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
} else {
  // No-op: credentials not present; tests/imports can still use passport.
  // If you want to enable Google auth locally, provide GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.
}

module.exports = passport;
