const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const jwt = require("jsonwebtoken");
const User = require("../models/user");

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
const callbackURL = process.env.NODE_ENV === 'production'
  ? 'https://market-connect-2qmb.onrender.com/api/users/auth/google/callback'
  : 'http://localhost:8080/api/users/auth/google/callback';

console.log('Google OAuth Callback URL:', callbackURL);
console.log(' Environment:', process.env.NODE_ENV);
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
          
          
          if (!googleProfile.emails || !googleProfile.emails[0]) {
            console.error(' No email in Google profile');
            return done(new Error('No email provided by Google'), null);
          }

          const email = googleProfile.emails[0].value;
          console.log('📧 Email:', email);

          let existingUser = await User.findOne({ email: email.toLowerCase().trim() });

          if (!existingUser) {
            console.log('👤 Creating new user from Google profile');
            
            try {
              const uniquePlaceholder = `000${Date.now().toString().slice(-7)}`;
              
              existingUser = new User({
                name: googleProfile.displayName,
                email: email.toLowerCase().trim(),
                role: "buyer",
                mobNo: uniquePlaceholder,
                googleId: googleProfile.id,
              });

              await existingUser.save();
              console.log(' New user created successfully:', existingUser._id);
            } catch (saveError) {
              console.error(' Error saving new user:', saveError);
              console.error('Error details:', {
                message: saveError.message,
                code: saveError.code,
                keyPattern: saveError.keyPattern,
                keyValue: saveError.keyValue
              });
              
              if (saveError.code === 11000) {
                console.log(' Duplicate key error, attempting to find existing user...');
                existingUser = await User.findOne({ 
                  $or: [
                    { email: email.toLowerCase().trim() },
                    { googleId: googleProfile.id }
                  ]
                });
                
                if (existingUser) {
                  console.log(' Found existing user after duplicate error:', existingUser._id);
                  // Update googleId if missing
                  if (!existingUser.googleId) {
                    existingUser.googleId = googleProfile.id;
                    await existingUser.save();
                  }
                } else {
                  throw saveError;
                }
              } else {
                throw saveError;
              }
            }
          } else {
            console.log(' Existing user found:', existingUser._id);
            if (!existingUser.googleId) {
              existingUser.googleId = googleProfile.id;
              await existingUser.save();
              console.log(' Google ID added to existing user');
            }
          }

          const authToken = jwt.sign(
            { id: existingUser._id },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
          );

          console.log('JWT token generated for user:', existingUser._id);

          return done(null, { user: existingUser, token: authToken });
        } catch (error) {
          console.error(' Google OAuth error:', error);
          console.error('Error message:', error.message);
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
  console.warn('Google OAuth not configured - missing CLIENT_ID or CLIENT_SECRET');
}

module.exports = passport;