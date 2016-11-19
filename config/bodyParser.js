/**
 * Created by wangj on 2016/11/15.
 */
var os = require('os');

var config = {
    maxBodySize: 5242880, // 5*1024*1024
    mapFiles: true,
    uploadDir: os.tmpdir(),
    multiples: true
};

module.exports = config;
