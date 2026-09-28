const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const env = require('./env');
const { findOrCreateOAuthUser } = require('../services/identity.service');

if (env.google.isConfigured) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.google.clientId,
        clientSecret: env.google.clientSecret,
        // Overridden per request (see auth.controller) so it matches the origin the user is on.
        callbackURL: `${env.frontendUrls[0]}/api/auth/google/callback`,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const user = await findOrCreateOAuthUser({
            provider: 'google',
            providerId: profile.id,
            email: profile.emails?.[0]?.value,
            preferredUsername: profile.displayName,
          });
          done(null, user);
        } catch (error) {
          done(error);
        }
      }
    )
  );
}

module.exports = passport;
