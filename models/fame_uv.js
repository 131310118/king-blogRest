/**
 * Created by wangj on 2016/11/3.
 */
var mongoose    = require('mongoose');
var Schema      = mongoose.Schema;
var md5         = require('MD5');
var Redis       = require('ioredis');
var tools       = require('../libs/tools');
var Joi         = require('joi');
var moment      = require('moment');
var uuid        = require('node-uuid');
var jwt         = require('jsonwebtoken');
var config      = require('../config');
var db          = require('./db');
var async       = require('async');
var redis       = new Redis();
var env         = config.env.current;
//var _         = require('lodash');

//用户信息表
var FameUvSchema = new Schema({
    user_name       : {type: String, default: null},
    user_password   : {type: String, default: null},
    user_salt       : {type: String, default: null},
    user_tags       : [{type: String, default: null}],
    access_token    : {type: String}
});

FameUvSchema.index({'user_name': 1}, {unique: true});

var model = db.model('fame_uv', FameUvSchema);

var getById = function (id, filed, callback) {
    if('function' == typeof filed) {
        callback = filed;
        filed = null;
    }
    if(filed) {
        model.findById(id, filed, callback);
    } else {
        model.findById(id, callback);
    }
};

var create = function (object, callback) {
    var item = new model(object);
    item.save(callback);
};

var getByQuery = function (query, callback) {
    //console.log(query);
    model.findOne(query, callback);
};

var getByUser_name = function (user_name, callback) {
    //console.log(query);
    model.findOne({user_name: user_name}, callback);
};

var getClassifyById = function(id, callback) {
    model.findById(id, 'user_tags -_id', callback);
};

var hasClassify = function(object, callback) {
    model.findOne({_id: object.id, user_tags: object.classify}, callback);
};

var createClassify = function(object, callback) {
    model.update({_id: object.rid, user_tags: {$ne: object.name}}, {$push: {user_tags: object.name}}, callback)
};

module.exports = {
    model           : model,
    getById         : getById,
    create          : create,
    getByQuery      : getByQuery,
    getByUser_name  : getByUser_name,
    getClassifyById : getClassifyById,
    hasClassify     : hasClassify,
    createClassify  : createClassify
};