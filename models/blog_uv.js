/**
 * Created by wangj on 2016/11/3.
 */
var mongoose    = require('mongoose');
var Schema      = mongoose.Schema;
var config      = require('../config');
var db          = require('./db');

//用户信息表
var BlogUvSchema = new Schema({
    id              : {type: Schema.Types.ObjectId},
    publish_time    : {type: Date, default: Date.now},
    content         : {type: String},
    title           : {type: String},
    summary         : {type: String},
    classify        : {type: String},
    imgs            : [{type: String}]
});

var model = db.model('blog_uv', BlogUvSchema);

var publish = function(object, callback) {
    //console.log(object);
    var item = new model(object);
    item.save(callback);
};

var getBlogsById = function(id, fileds, callback) {
    if('function' == typeof fileds) {
        callback = fileds;
        fileds = null;
    }
    if(fileds) {
        model.find({id: id}, fileds, callback)
    } else {
        model.find({id: id}, callback);
    }
};

var getBlogDetail = function(id, fileds, callback) {
    if('function' == typeof fileds) {
        callback = fileds;
        fileds = null;
    }
    if(fileds) {
        model.findById(id, fileds, callback);
    } else {
        model.findById(id, callback);
    }
};

module.exports = {
    model           : model,
    publish         : publish,
    getBlogsById    : getBlogsById,
    getBlogDetail   : getBlogDetail
};