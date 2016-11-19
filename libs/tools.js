/**
 * Created by wangj on 2016/11/3.
 */
var config      = require('../config');
var restify     = require('restify');
var crypto      = require('crypto');
var cp          = require('child_process');
var md5         = require('MD5');
var Redis       = require('ioredis');
var moment      = require('moment');
var fs          = require('fs');
var xss         = require('xss');
var _           = require('lodash');
var redis       = new Redis();
var env         = config.env.current;
var xssRich     = new xss.FilterXSS(config.xss.rich);

exports.rtnRst = function(res, code, data) {
    res.charSet('utf-8');
    res.contentType = 'json';
    res.send(code, data);
};

exports.getIP = function(req) {
    if(req.headers['x-forwarded-for']) {
        var xff = req.headers['x-forwarded-for'];
        var ips = xff.split(',');
        return ips[0].trim();
    } else {
        return '';
    }
};

exports.lock = function(locker, ip, expire, callback) {
    if(typeof expire === 'function') {
        callback = expire;
        expire = config.security.lock[locker].expire;
    }
    var lock = config.security.lock[locker].prefix + ip;
    var expireAt = expire + moment().unix() + 1;
    console.log("lock: " + lock);
    console.log("expireAt: " + expireAt);
    redis.set(lock, expireAt, 'ex', expire, 'nx', function(err, result) {
        console.log("result: " + result);
        if(err || !result) {
            callback(null, true);
        } else {
            callback(null, false);
        }
    });  //nx存在则直接返回
    //callback(null, true);
};

exports.unlock = function(locker, id) {
    var lock = config.security.lock[locker].prefix + id;
    redis.del(lock);
};

exports.filterRichInput = function(input) {
    input = xssRich.process(input);
    return input;
};

exports.generateUUID = function() {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
};



