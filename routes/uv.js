/**
 * Created by wangj on 2016/11/3.
 */
var uv = require('../controllers/uv');

module.exports = function(server) {
    server.post({path: '/api/registed'}, uv.registed);
    server.get({path: '/api/checkUser'}, uv.checkUser);
/*    server.get({path: '/api/token'}, uv.token);*/
    server.post({path: '/api/login'}, uv.login);
    server.post({path: '/api/publish'}, uv.publish);
    server.get({path: '/api/getBlogs'}, uv.getBlogs);
    server.post({path: '/api/createClassify'}, uv.createClassify);
    server.get({path: '/api/getClassify'}, uv.getClassify);
    server.get({path: '/api/getBlogDetail'}, uv.getBlogDetail);
    server.post({path: 'api/upload'}, uv.upload);
};
