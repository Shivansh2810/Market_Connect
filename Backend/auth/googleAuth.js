const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const jwt = require("jsonwebtoken");
const User = require("../models/user");

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  // Always use production URL for Google OAuth (must match Google Console settings)
  const callbackURL = 'https://market-connect-2qmb.onrender.com/api/users/auth/google/callback';

  console.log('🔐 Google OAuth Callback URL:', callbackURL);
  console.log('🔐 Environment:', process.env.NODE_ENV);

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: callbackURL,
        proxy: true,
        passReqToCallback: false

      },
      async (accessToken, refreshToken, googleProfile, done) => {
        try {
          console.log('✅ Google OAuth callback received');
          console.log('Profile:', JSON.stringify(googleProfile, null, 2));
          
          if (!googleProfile.emails || !googleProfile.emails[0]) {
            console.error('❌ No email in Google profile');
            return done(new Error('No email provided by Google'), null);
          }

          const email = googleProfile.emails[0].value;
          console.log('📧 Email:', email);

          let existingUser = await User.findOne({ email });

          if (!existingUser) {
            console.log('👤 Creating new user from Google profile');
            existingUser = new User({
              name: googleProfile.displayName,
              email: email,
              role: "buyer",
              mobNo: "0000000000",
              googleId: googleProfile.id,
            });

            await existingUser.save();
            console.log('✅ New user created:', existingUser._id);
          } else {
            console.log('👤 Existing user found:', existingUser._id);
            if (!existingUser.googleId) {
              existingUser.googleId = googleProfile.id;
              await existingUser.save();
              console.log('✅ Google ID added to existing user');
            }
          }

          const authToken = jwt.sign(
            { id: existingUser._id },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
          );

          console.log('✅ JWT token generated for user:', existingUser._id);

          return done(null, { user: existingUser, token: authToken });
        } catch (error) {
          console.error('❌ Google OAuth error:', error);
          console.error('Error stack:', error.stack);
          return done(error, null);
        }
      }
    )
  );
  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((user, done) => {
    done(null, user);
  });
} else {
  console.warn('⚠️ Google OAuth not configured - missing CLIENT_ID or CLIENT_SECRET');
}

module.exports = passport;