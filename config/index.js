/**
 * Created by wangj on 2016/11/3.
 */
var environment = require('./environment');
var server      = require('./server');
var database    = require('./database');
var security    = require('./security');
var xss         = require('./xss.js');
var bodyParser  = require('./bodyParser.js');
var source      = require('./source.js');

var config = {
    env         : environment,
    server      : server,
    db          : database,
    security    : security,
    xss         : xss,
    bodyParser  : bodyParser,
    source      : source
};

module.exports = config;