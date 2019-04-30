var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cfenv = require('cfenv');
var appenv = cfenv.getAppEnv();

var app = express();
if(appenv.isLocal == true) { require('dotenv').config(); } else {
  app.enable('trust proxy');
  app.use (function (req, res, next) {
    if (req.secure || process.env.BLUEMIX_REGION === undefined) {
      next();
    } else {
      console.log('redirecting to https');
      res.redirect('https://' + req.headers.host + req.url);
    }
  });
}

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(function(req,res,next) {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

var odefRouter = require('./routes/odef');
app.use('/odef', odefRouter);

module.exports = app;
