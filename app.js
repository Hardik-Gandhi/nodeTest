const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');

const routes = require('./routes');
const config = require('./config');
const sendJson = require('./middlewares/generateResponse');

// DB Connection
mongoose.connect(config.dbUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  autoIndex: true
}, function(error) {
  if(error){
    console.error("Error while connecting database\n", error);
    return false;
  }
  console.log('\x1b[32m%s\x1b[0m', 'Database connected...');
});

const app = express();

//CORS middleware
var allowCrossDomain = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', '*');
  res.header('Access-Control-Allow-Headers', '*');
  next();
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(sendJson);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'uploads')));
app.use(allowCrossDomain);
app.use(express.json());
app.use('/profile', express.static(path.join(__dirname, '/uploads')));

// Routes
app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  res.status(404).sendJson('Invalid Route');
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
