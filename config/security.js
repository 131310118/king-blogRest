/**
 * Created by wangj on 2016/11/5.
 */
var config = {
    lock: {
        ip: {
            prefix: 'lock.ip',
            expire: 3   //(s)
        },
        ip_not_user: {
            prefix: 'lock.ip_not_user',
            expire: 3600
        }
    },
    user: {
        token_expire: 604800 //(s)
    }
};

module.exports = config;