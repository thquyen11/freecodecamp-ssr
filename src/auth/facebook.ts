var passport = require('passport')
  , FacebookStrategy = require('passport-facebook').Strategy;

passport.use(new FacebookStrategy({
    clientID: '197825031154291',
    clientSecret: '714f2934fc87986389a0906c3f90970b',
    callbackURL: "http://localhost:3000/auth/facebook/callback"
  },
//   function(accessToken, refreshToken, profile, done) {
//     User.findOrCreate(..., function(err, user) {
//       if (err) { return done(err); }
//       done(null, user);
//     });
//   }
));