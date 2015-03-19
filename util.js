var util = {};
var guid = 1000;
util.getFileName = function(extname) {
    var d = new Date();
    var name = [ d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(),
                 d.getMinutes(), d.getSeconds(), d.getMilliseconds(), guid++ ]
                .join('_') + extname;
    return name;
}
util.getUrlRoot = function (config, dPath) {
    if (config.mode == 'local')
        return dPath;
    else return config.hostName + '/' + config.staticPath;
}
util.getRealDynamicPath = function (config, req) {
    var dPath = config.dynamicPath;
    if (typeof dPath == 'function')
        dPath = dPath(req);
    return dPath;
}
util.stringify = function (obj) {
    var str = obj;
    try {
        str = JSON.stringify(obj);
    }catch (e) {
    }
    return str;
}
module.exports = util;