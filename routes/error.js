/**
 * Created by wangj on 2016/11/3.
 */
module.exports = function(server) {
    server.on('NotFound', function(req, res, err) {
        console.error(err);
        res.send(404);
    });
    server.on('MethodNotAllowed', function(req, res, err) {
        console.error(err);
        res.send(405);
    });
    server.on('VersionNotAllowed', function(req, res, err) {
        console.error(err);
        res.send(400);
    });
    server.on('UnsupportedMediaType', function(req, res, err) {
        console.error(err);
        res.send(415);
    });
};
