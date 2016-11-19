/**
 * Created by wangj on 2016/11/3.
 */
var mongoose     = require('mongoose');
var FameUv       = require('../models').FameUv;
var BlogUv       = require('../models').BlogUv;
var Joi          = require('joi');
var _            = require('lodash');
var tools        = require('../libs/tools');
var moment       = require('moment');
var async        = require('async');
var uuid         = require('node-uuid');
var jwt          = require('jsonwebtoken');
var config       = require('../config');
var restify      = require('restify');
var md5          = require('MD5');
var Redis        = require('ioredis');
var fs           = require('fs');
var redis        = new Redis();
var env          = config.env.current;

function middleware(req, res, next, option) {
    Joi.validate(req.params, option.schema, {allowUnknown: true}, function(err, value) {
        if(err) {
            console.error(err);
            tools.rtnRst(res, 406, {err_name: '参数错误', err_msg: '参数错误'});
            return next();
        } else {
            option.callback(value);
        }
    })
}

var registed = function(req, res, next) {
    var schema = Joi.object().keys({
        user_name       : Joi.string().regex(/^[_0-9a-zA-Z]{1,24}$/).required(),
        user_password   : Joi.string()/*.regex(/^[\S]*((\d[^\d]*[a-zA-Z])|([a-zA-Z][^[a-zA-Z]]*\d))[\S]*$/)*/.required(),
        user_salt       : Joi.string().default(String(Math.random()).replace('.', ''))
    });
    middleware(req, res, next, {
        schema      : schema,
        callback    : function(value) {
            value.user_password = md5(value.user_password + value.user_salt);
            FameUv.create(value, function(err) {
                if(err) {
                    console.error(err);
                    tools.rtnRst(res, 406, {err_name: '服务器异常，请稍后再试', err_msg: '服务器异常，请稍后再试'});
                    return next();
                }
                tools.rtnRst(res, 200, {data:{msg: "注册成功", status: 1}});
                return next();
            })
        }
    })
};

var checkUser = function(req, res, next) {
    //console.log('checkuser');
    var schema = Joi.object().keys({
        user_name   : Joi.string().regex(/^[_0-9a-zA-Z]{1,24}$/).required()
    });
    middleware(req, res, next, {
        schema  : schema,
        callback: function(value) {
            //console.log(value);
            FameUv.getByQuery(value, function(err, data) {
                //console.log(err + ', ' + data);
                if(err) {
                    console.error(err);
                    tools.rtnRst(res, 406, {err_name: '服务器异常，请稍后再试，', err_msg: '服务器异常，请稍后再试'});
                } else {
                    //console.log(data);
                    if(data) {
                        tools.rtnRst(res, 200, {data: {message: '用户名已存在', status: 0}});
                    } else {
                        tools.rtnRst(res, 200, {data: {message: '该用名名可用', status: 1}});
                    }
                }
            });
        }
    })
};

/*var generateToken = function() {
    var token = md5((new Date()).valueOf() + Math.random());
    redis.set(token, true, 'EX', 20);
    return token;
};

var token = function(req, res, next) {
    var ip = tools.getIP(req);
    tools.lock('ip', ip + '_token', function(err, locked) {
        if(locked) {
            tools.rtnRst(res, 429, {err_name: "请求出错", err_msg: "请求过多"});
            return next();
        }
    });
    var token = generateToken();
    tools.rtnRst(res, 200, {token: token});
    return next();
};*/

var login = function(req, res, next) {
    console.log('login');
    var ip = tools.getIP(req);
    console.log("ip " + ip);
    redis.get(config.security.lock.ip_not_user.prefix + ip, function(err, result) {
        if(err) {
            console.error(err);
            console.log(err);
            tools.rtnRst(res, 429, {err_name: "请求出错", err_msg: "错误代码101"});
            return next();
        }
        console.log("result " + result);
        if(result && result >= 5) {
            tools.rtnRst(res, 429, {err_name: "请求出错", err_msg: "您已被禁止登录，一小时后再试"});
            return next();
        }
        tools.lock('ip', ip, function(err, locked) {
            console.log(locked);
            if(locked) {
                tools.rtnRst(res, 429, {err_name: "请求出错", err_msg: "请求过多"});
                return next();
            }
            console.log(req.params);
            var schema = Joi.object().keys({
                user_name       : Joi.string().required(),
                user_password   : Joi.string(/^\w{32}$/).required()
            });

            Joi.validate(req.params, schema, function(err, value) {
                if(err) {
                    console.error(err);
                    tools.rtnRst(res, 409, {err_name: "请求出错", err_msg: "参数有误"});
                    return next();
                }
                /* redis.get(token, function(err, y) {
                 if(err || !y) {
                 console.error(err);
                 console.log(y);
                 tools.rtnRst(res, 409, {err_name: "请求出错", err_msg: "校验失败"});
                 return next();
                 }*/
                FameUv.getByUser_name(value.user_name, function(err, user) {
                    if(err) {
                        console.error(err);
                        tools.rtnRst(res, 406, {err_name: "请求出错", err_msg: "获取用户信息出错"});
                        return next();
                    }
                    if(user) {
                        if(user.user_password != md5(value.user_password + user.user_salt)) {
                            console.log("password:" + user.user_password);
                            redis.get(config.security.lock.ip_not_user.expire + ip, function(err, result) {
                                if(!result) {
                                    result = 1;
                                } else {
                                    result++;
                                }
                                redis.set(config.security.lock.ip_not_user.expire + ip, result, 'ex', config.security.lock.ip_not_user.expire);
                            });
                            tools.rtnRst(res, 406, {err_name: "请求出错", err_msg: "用户名或密码错误"});
                            return next();
                        }
                        if(user.access_token) {
                            redis.del(user.access_token);
                        }
                        user.access_token = uuid.v4();
                        console.log(user.access_token);
                        async.waterfall([
                            function(callback) {
                                user.save(function(err, user) {
                                    if(err) {
                                        console.error(err);
                                        tools.rtnRst(res, 406, {err_name: "请求出错", err_msg: "更新用户信息失败"});
                                        callback(err);
                                    } else {
                                        redis.set(user.access_token, user.user_salt, 'EX', config.security.user.token_expire);
                                        console.log(config.server.host[env]);
                                        console.log(user.access_token);
                                        console.log(user.user_salt);

                                        var token = jwt.sign({
                                            iss: config.server.host[env],
                                            upk: user.access_token,
                                            rid: user._id
                                        }, user.user_salt);
                                        console.log(token);
                                        callback(null, token);
                                    }
                                });
                            }
                        ], function(err, result) {
                            if(err) {
                                console.error(err);
                                tools.rtnRst(res, 401, {err_name: "请求出错", err_msg: "会话保存出错"});
                                return next();
                            }
                            res.header('authorization', result);
                            tools.rtnRst(res, 200, {msg: "登录成功", uid: user._id});
                            return next();
                        });
                    }
                    else {
                        tools.rtnRst(res, 406, {err_name: "请求出错", err_msg: "用户名不存在"});
                        return next();
                    }
                });
                /*})*/
            })
        })
    });
    console.log("end");
};

var publish = function(req, res, next) {
    if(!req.user) {
        tools.rtnRst(res, 406, {err_name: "请求出错", err_msg: "没有权限"});
        return next();
    } else {
        var schema = Joi.object().keys({
            content         : Joi.string().required(),
            title           : Joi.string().required(),
            summary         : Joi.string().allow(""),
            classify        : Joi.string().allow(""),
            imgs            : Joi.array().max(3)
        });
        middleware(req, res, next, {
            schema      : schema,
            callback    : function(value) {
                value.content = tools.filterRichInput(value.content);
                value.summary = tools.filterRichInput(value.summary);
                value.id = req.user.rid;
                if(value.classify) {
                    FameUv.hasClassify(value, function(err, result) {
                        if(err) {
                            console.error(err);
                            tools.rtnRst(res, 406, {err_name: '服务器异常，请稍后再试', err_msg: '服务器异常，请稍后再试'});
                            return next();
                        }
                        if(result) {
                            BlogUv.publish(value, function(err) {
                                if(err) {
                                    console.error(err);
                                    tools.rtnRst(res, 406, {err_name: '服务器异常，请稍后再试', err_msg: '服务器异常，请稍后再试'});
                                    return next();
                                }
                                console.log("publish success.");
                                tools.rtnRst(res, 200, {data:{uid: value.id}});
                                return next();
                            })
                        } else {
                            tools.rtnRst(res, 406, {err_name: '请求出错', err_msg: '分组不存在'});
                            return next();
                        }
                    })
                } else {
                    BlogUv.publish(value, function(err) {
                        if(err) {
                            console.error(err);
                            tools.rtnRst(res, 406, {err_name: '服务器异常，请稍后再试', err_msg: '服务器异常，请稍后再试'});
                            return next();
                        }
                        tools.rtnRst(res, 200, {data: {uid: value.id}});
                        return next();
                    })
                }
            }
        });
    }
};

var getClassify = function(req, res, next) {
    if(!req.user) {
        tools.rtnRst(res, 406, {err_name: "请求出错", err_msg: "没有权限"});
        return next();
    } else {
        FameUv.getClassifyById(req.user.rid, function(err, result) {
            if(err || !result) {
                console.error(err);
                tools.rtnRst(res, 406, {err_name: '服务器异常，请稍后再试，', err_msg: '服务器异常，请稍后再试'});
                return next();
            }
            /*if(!result.user_tags) {
                var arrTags = [];
            } else {
                arrTags = result.user_tags.toString().split(',');
            }*/
            tools.rtnRst(res, 200, {data: {tags: result.user_tags}});
            return next();
        })
    }
};

var getBlogs = function(req, res, next) {
    var schema = Joi.object().keys({
        uid             : Joi.string().required(),
        page            : Joi.number().default(1)
    });
    middleware(req, res, next, {
        schema      : schema,
        callback    : function(value) {
            async.waterfall([
                function(callback) {
                    BlogUv.getBlogsById(value.uid, 'title id imgs publish_time summary', function(err, result) {
                        if(err) {
                            console.error(err);
                            tools.rtnRst(res, 406, {err_name: '服务器异常，请稍后再试，', err_msg: '服务器异常，请稍后再试'});
                            callback(err);
                        }
                        callback(null, result)
                    })
                },
                function(result, callback) {
                    if(result[0] && result[0].id) {
                        FameUv.getById(result[0].id, '-_id user_name', function(err, fame_result) {
                            if(err) {
                                console.error(err);
                                tools.rtnRst(res, 406, {err_name: '服务器异常，请稍后再试，', err_msg: '服务器异常，请稍后再试'});
                                callback(err);
                            }
                            callback(null, result, fame_result)
                        })
                    }
                }
            ], function(err, result, fame_result) {
                var data = {};
                data.data = result;
                data.user_name = fame_result.user_name;
                tools.rtnRst(res, 200, data);
                return next();
            });

        }
    });
    BlogUv.getBlogsById(req)
};

var getBlogDetail = function(req, res, next) {
    var schema = Joi.object().keys({
        uid             : Joi.string().required()
    });
    middleware(req, res, next, {
        schema      : schema,
        callback    : function(value) {
            //console.log(value);
            async.waterfall([
                function(callback) {
                    BlogUv.getBlogDetail(value.uid, '-_id title content id publish_time', function(err, result) {
                        if(err) {
                            console.error(err);
                            tools.rtnRst(res, 406 , {err_name: '服务器异常，请稍后再试，', err_msg: '服务器异常，请稍后再试'});
                            callback(err);
                        }
                        callback(null, result);
                    })
                },
                function(result, callback) {
                    console.log(result);
                    if(result && result.id) {
                        FameUv.getById(result.id, '-_id user_name', function(err, fame_result) {
                            if(err) {
                                console.error(err);
                                tools.rtnRst(res, 406, {err_name: '服务器异常，请稍后再试，', err_msg: '服务器异常，请稍后再试'});
                                callback(err);
                            }
                            callback(null, result, fame_result)
                        })
                    } else {
                        tools.rtnRst(res, 406, {err_name: '请求出错，', err_msg: '博文不存在'});
                        callback(new Error("博文不存在"));
                    }
                }
            ],function(err, result, fame_result) {
                if(err) {
                    return next();
                }
                var data = {};
                data.user_name = fame_result.user_name;
                data.data = result;
                tools.rtnRst(res, 200, data);
                return next();
            })
        }
    })
};

var upload = function(req, res, next) {
    //console.log(req.files);
    var fileName = new Date()*1 + tools.generateUUID() + '.' + req.files.file.type.match(/\/(.*)/)[1];
    fs.writeFile(config.source.img + fileName, req.params.file, function(err) {
        if(err) {
            console.error(err);
            tools.rtnRst(res, 200, {err_name: '请求出错，', err_msg: '文件保存失败'});
            next();
        }
        tools.rtnRst(res, 200, {url: config.source.getImg + fileName});
    });
};

var createClassify = function(req, res, next) {
    var schema = Joi.object().keys({
        name: Joi.string().required()
    });
    middleware(req, res, next, {
        schema      : schema,
        callback    : function(value) {
            value.rid = req.user.rid;
            FameUv.createClassify(value, function(err, numberAffected) {
                //console.log(numberAffected);
                if(err) {
                    console.error(err);
                    tools.rtnRst(res, 406, {err_name: '服务器异常，请稍后再试', err_msg: '服务器异常，请稍后再试'});
                    return next();
                }
                if(!numberAffected.nModified) {
                    tools.rtnRst(res, 406, {err_name: '请求出错', err_msg: '请勿重复添加'});
                    return next();
                }
                tools.rtnRst(res, 200, {data:{msg: "添加成功", status: 1}});
                return next();
            });
        }
    })
};

function validAdmin(req, callback) {
    if(!req.headers[config.server.author.user]) {
        return callback(new Error("用户未登陆"));
    }
}

module.exports = {
    registed: registed,
    checkUser: checkUser,
    login: login,/*,
    token: token*/
    publish: publish,
    getClassify: getClassify,
    getBlogs: getBlogs,
    getBlogDetail: getBlogDetail,
    upload: upload,
    createClassify: createClassify
};

