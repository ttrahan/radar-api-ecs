'use strict';

var cors = require('cors');
var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var winston = require('winston');

var routes = require('./routes/routes');
var app = express();

global.logger = winston;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors());
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers',
    'Accept,Content-Type,Authorization,Cookie');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

if (process.env.FILE_LOG) {
  logger.add(winston.transports.File, {filename: 'logs.log'});
}
logger.remove(winston.transports.Console);
logger.add(winston.transports.Console,
  {level: process.env.CONSOLE_LOGLEVEL || 'debug'});

routes(app);

var PORT = process.env.API_PORT || '3001';

// listen
app.listen(PORT, function () {
  logger.info('Application running on port:', PORT);
});
