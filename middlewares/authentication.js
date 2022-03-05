const passport = require('passport');
const { capitalizeFirstLetter } = require('../utils/helper');

const handleJWT = (req, res, next) => async (err, user, info) => {
  if (err || info || !user) {
    let error = err || info.message == "jwt expired" ? "Invalid token" : info.messag;
    return res
      .status(401)
      .sendJson(error ? capitalizeFirstLetter(error) : 'Unauthorized access');
  }
  req.user = user;
  return next();
};

exports.isAuthenticated = (req, res, next) => {
  passport.authenticate(
    'jwt',
    { session: false },
    handleJWT(req, res, next)
  )(req, res, next);
};