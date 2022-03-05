const express = require('express');
const router = express.Router();
const passport = require('passport');
const multer  = require('multer');
const fs = require('fs')
const path = require('path');

require('../middlewares/passport');
const { removeFields, jsonToObject, genrateJwt } = require('../utils/helper.js');
const { isAuthenticated } = require('../middlewares/authentication');
const USER = require('../models/user');

let upload = multer({ dest: 'uploads/' });

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
      cb(null, 'uploads/');
  },
  filename: function(req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

upload = multer({ storage: storage });

function getDateParamaters(param, date = new Date().toISOString()) {
  if (param === 'month') {
    return parseInt(date.split('-')[1]);
  } else {
    return parseInt(date.split('-')[2]);
  }
}


/* GET login page. */
router.get('/login', function(req, res, next) {
  res.render('login');
});

/* GET registration page. */
router.get('/registration', function(req, res, next) {
  res.render('registration');
});

/* GET profile page. */
router.get('/viewProfile', function(req, res, next) {
  res.render('profile');
});

// SignUp
router.post('/signUp', upload.single('profileImage'), async (req, res, next) => {
  passport.authenticate('signup', { session: false }, async (err, data, info) => {
    if (err || info) {
      let statusCode = (err && err.joi) || (info && info.message) ? 422 : 400;
      err = (err && err.joi) ? err.joi : (info && info.message) ? info.message : err.message;
      if (req.file) {
        fs.unlink(`uploads/${req.file.filename}`, () => {console.log(`Delete file ${req.file.filename}`)})
      }
      if(!res.headersSent) return res.status(statusCode).sendJson(err);
    } else {
      return res.status(200).sendJson('Signup successful');
    }
  })(req, res, next)
});

// SignIn
router.post('/signIn', async (req, res, next) => {
  passport.authenticate('login', async (err, user, info) => {
    if (info && info.message) {
      return res.status(403).sendJson(info.message);
    }

    try {
      if (err || !user) {
        return res.status(401).sendJson("Unauthoried access");
      }
      req.login(user, { session: false }, async (error) => {
        if (error) return next(error);
        const body = { _id: user._id, email: user.email };
        const token = await genrateJwt(body);
        var responsePayload = removeFields(jsonToObject(user), ['password']);
        responsePayload['token'] = token;
        return res.sendJson(responsePayload);
      });
    } catch (error) {
      return res.status(400).sendJson(error ? error.message : 'Error while login');
    }
  })(req, res, next);
});

// Profile route
router.get('/profile', isAuthenticated, async (req, res) => {
  try {
    if (req.user) {
      let user = await USER.findOne({ _id: req.user._id, isDeleted: false});
      if (!user) {
        throw new Error('User might be deleted or does not exist.');
      }
      let responsePayload = removeFields(jsonToObject(user), ['password']);
      responsePayload['isBirthdayWeek'] = false;

      let currentMonth = getDateParamaters('month');
      let currentDate = getDateParamaters('date');
      let birthMonth = getDateParamaters('month', user.dateOfBirth.toISOString());
      let birthDate = getDateParamaters('date', user.dateOfBirth.toISOString());

      if (currentMonth === birthMonth && birthDate >= currentDate && birthDate-currentDate <=7) {
        responsePayload['isBirthdayWeek'] = true;
        let dateDifference = birthDate-currentDate;
        if (dateDifference === 0) {
          responsePayload['birthdayMessage'] = "Today is your birthday";
        } else if (dateDifference === 1) {
          console.log(`${dateDifference} Day to go`);
          responsePayload['birthdayMessage'] = `${dateDifference} Day to go for your birthday`;
        } else {
          responsePayload['birthdayMessage'] = `${dateDifference} Days to go for your birthday`;
        }
      }

      return res.sendJson(responsePayload);
    } else {
      throw new Error('Session expire, Need to login again.');
    }
  } catch (error) {
    console.error(error);
    return res.status(statusCode).sendJson(error ? error.message : 'Error while fetching profile details.');
  }
});

module.exports = router;