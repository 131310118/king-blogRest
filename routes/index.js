/**
 * Created by wangj on 2016/11/3.
 */
module.exports = function(server) {
    var error_init = require('./error');
    error_init(server);
    require('./uv')(server);
}
