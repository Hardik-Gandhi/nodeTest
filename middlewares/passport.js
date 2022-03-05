const passport = require('passport');
const localStrategy = require('passport-local').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

const config = require('../config');
const { removeFields, jsonToObject } = require('../utils/helper');
const { registration } = require('../validations/user');

const USER = require('../models/user');

let opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = config.jwtSecretKey;

// Create a passport middleware to handle user registration
passport.use(
  'signup',
  new localStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true,
    },
    async (req, email, password, done) => {
      try {
          if(!req.file) {
            throw new Error('Profile image is required.');
          }

          let validationResponse = await registration(req.body);
          if (validationResponse && !validationResponse.status) {
            return done({ joi: validationResponse.message });
          }

          let userPayload = validationResponse.payload;
          userPayload['profileImage'] = `${config.baseImageUrl}/${req.file.filename}`;
          userPayload['dateOfBirth'] = new Date(userPayload.dateOfBirth);
          let user = new USER(userPayload);

          let userRecord = await user.save();
          if(!userRecord) {
            throw new Error('Something went wrong while registering new user');
          }
          return done(null, { user: userRecord._id });
      } catch (error) {
        console.error(error);
        return done(error);
      }
    }
  )
);


// Create a passport middleware to handle User login
passport.use(
  'login',
  new localStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        let user = await USER.findOne({ email, isDeleted: false});
        if (!user) {
          return done(null, false, {
            message: 'Invalid email address',
          });
        }
        const validate = await user.isValidPassword(password);

        if (!validate) {
          return done(null, false, { message: 'Invalid password' });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Verifies the token sent by the user is valid
passport.use(
  new JwtStrategy(opts, async function (jwtPayload, done) {
    try {
      let user = await USER.findOne({ _id: jwtPayload.user._id, email: jwtPayload.user.email, isDeleted: false });
      if (!user) {
        return done('Invalid token', false);
      } else if (user) {
        user = removeFields(jsonToObject(user), ['password'])
        return done(null, user);
      }
    } catch (error) {
      return done(error, false);
    }
  })
);