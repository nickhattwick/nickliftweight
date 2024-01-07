const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/redirect"
}, (accessToken, refreshToken, profile, done) => {
    // Find or create a user in your database
    done(null, profile);
}));

passport.serializeUser((user, done) => {
    // Serialize the user object and store it in the session
    done(null, user);
});

passport.deserializeUser((user, done) => {
    // Retrieve the user object from the session
    done(null, user);
});
