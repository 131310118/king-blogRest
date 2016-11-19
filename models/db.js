/**
 * Created by wangj on 2016/11/3.
 */
var mongoose = require('mongoose');
var config   = require('../config');
var env      = config.env.current;
mongoose.Promise = global.Promise;
var db       = mongoose.connect(config.db.mongo[env].server);

if(!db) {
    db = null;
}

module.exports = db;
