/**
 * Created by wangj on 2016/11/3.
 */

var config  = require('./config');
var route   = require('./routes');
var restify = require('restify');
var jwt     = require('./framework/plugins/jwt');
var Redis   = require('ioredis');
var redis   = new Redis();
var env     = config.env.current;
var server  = restify.createServer({
    name      : config.server.name[env],
    formatters: {
        'application/json': function(req, res, body, cb) {
            console.log("body: " + body);
            return cb(null, JSON.stringify(body));
        }
    },
    version   :config.server.version[env]
});

process.on('uncaughtException', function(err) {
    console.error('uncaughtException----------');
    console.error(err);
    server.close();
    setTimeout(process.exit, 5000, 1);
});

var test = function () {
    return function (req, res, next) {
        console.log(req.url);
        return next();
    }
};

// 获取密钥用回调
var secretCallback = function (req, header, payload, callback) {
    if (req.headers) {
        var role = false;
        if (req.headers.auth) {
            role = 'user';
        } else {
            role = false;
        }

        if (role) {
            if (payload) {
                var key = false;
                if (payload.hasOwnProperty('upk')) {
                    key = payload.upk;
                } else if (payload.hasOwnProperty('apk')) {
                    key = payload.apk;
                }

                if (key) {
                    redis.get(key, function (err, secret) {
                        if (!err && secret) {
                            // 延长时间
                             redis.expire(key, config.security[role].token_expire);
                        }
                        callback(err, secret, role);
                    });
                } else {
                    callback(new restify.InvalidCredentialsError('No secret was found'));
                }
            } else {
                callback(new restify.InvalidCredentialsError('token expired'));
            }
        } else {
            callback(new restify.InvalidCredentialsError('the role has no token'));
        }
    } else {
        callback(new restify.InvalidCredentialsError('req info missing'));
    }
};

var getToken = function (req) {
    if (req.headers) {
        if (req.headers.auth) {
            return req.headers.auth;
        } else {
            return false;
        }
    }
    return false;
};

var plugins = [
    restify.acceptParser(server.acceptable),
    // restify.authorizationParser(),
    restify.dateParser(),
    restify.queryParser(),
    restify.jsonp(),
    test(),
    restify.gzipResponse(),
    restify.conditionalRequest(),
    restify.bodyParser(config.bodyParser),
    restify.requestExpiry({header: 'x-request-expiry-time'})
    //restify.throttle(config.throttle),
];
// TODO: 这里要加入权限控制中间件
// plugins.push();
plugins.push(jwt({secret: secretCallback, getToken: getToken}));

server.use(plugins);

route(server);

server.listen(config.server.port[env], function() {
    console.log(server.name + ' listening at ' + server.url);
});