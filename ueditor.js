var path = require('path');
var url = require('url');
var os = require('os');
var fs = require('fs');
var fse = require('fs-extra');
var Busboy = require('busboy');
var guid = 1000;
var bcs = require('bcs-nodejs-sdk');
var config = {
    configfile: '',
    mode: 'local',
    AccessKey: '',
    SecrectKey: '',
    staticPath: '',
    dynamicPath: '',
    hostName: 'bcs.duapp.com'
};
var ueditor = function(c) {
    setConfig(c);
    return function (req, res, next) {
        _ueditor(req, res, next);
    }
};
var setConfig = function(c) {
    for (var i in c) {
        config[i] = c[i];
    }
    if (config.mode == 'bcs') {
        bcs.setKeys(config.AccessKey, config.SecrectKey);
    }
    if (config.hostName.indexOf('http') != 0) {
        config.hostName = 'http://' + config.hostName;
    }
}
var _ueditor = function(req, res, next) {
    switch (req.query.action) {
        case 'config':
            res.setHeader('Content-Type', 'application/json');
            res.redirect(config.configFile);
            break;
        case 'uploadimage':
            uploadimage(req, res);
            break;
        case 'listimage':
            listimage(req, res);
    }
}

var listimage = function (req, res) {
    var callback = function (err, list) {
        var r = {
            'list': list,
            'start': 1,
            'total': list ? list.length : 0
        };
        if (err) {
            r.state = 'ERROR';
            res.status(500);
        } else r.state = 'SUCCESS';
        res.json(r);
    };
    if (config.mode == 'bcs') {
        bcsListObject(req, 3, callback);
    } else {
        localListPath(req, callback);
    }
}
var localListPath = function (req, callback) {
    var data = [];
    d_path = getRealDynamicPath(req);
    console.log(config.staticPath, d_path);
    fs.readdir(path.join(config.staticPath, d_path) , function(err, files) {
        if (err) {
            callback(err, null);
            return;
        }
        var filetype = '.jpg,.jpeg,.png,.gif,.ico,.bmp';
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            var extname = path.extname(file);
            console.log(file);
            if (filetype.indexOf(extname.toLowerCase()) >= 0) {
                data.push({
                    'url': d_path + '/' + file
                });
            }
        }
        callback(null, data);
    });
}
var bcsListObject = function (req, t, callback, err) {
    if (t == 0) {
        callback(err, null);
        return;
    }
    t--;
    //console.log(t);
    bcs.listObject(config.staticPath, function (res) {
        if (res.statusCode == 200) {
            //console.log(res.data);
            var data = [], objectList = res.data.object_list;
            var filetype = '.jpg,.jpeg,.png,.gif,.ico,.bmp';
            for (var i = 0; i < objectList.length; i++) {
                var obj = objectList[i];
                var extname = path.extname(obj.object);
                console.log(extname);
                if (parseInt(obj.is_dir) == 0) {
                    if (filetype.indexOf(extname.toLowerCase()) >= 0) {
                        data.push({
                            'url': getUrlRoot() + obj.object
                        });
                    }
                }
            }
            callback(null, data);
        } else {
            bcsListObject(req, t, callback, res)
        }
    });
}
var uploadimage = function (req, res) {
    var busboy = new Busboy({ headers: req.headers });
    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
        var isReturn = false;
        save(file, filename, req, function (err, url) {
            //防止多次res.end()
            if (isReturn) return;
            isReturn = true;
            var r = {
                'url': url,
                'title': req.body.pictitle,
                'original': filename,
            }
            if (err) {
                r.state = 'ERROR';
            } else r.state = 'SUCCESS';
            res.json(r);
        });
    });
    req.pipe(busboy);
}
var save = function (file, filename, req, callback) {
    var realName = getFileName(path.extname(filename));
    //console.log(realName);
    var saveTo = path.join(os.tmpDir(), realName);
    //console.log(saveTo);
    file.pipe(fs.createWriteStream(saveTo));
    file.on('end', function() {
        if (config.mode == 'bcs') {
            var id = setTimeout(function() {
                callback({'msg': 'timeout'});
            }, 10000);
            bcsPutObject(config.staticPath, realName,
                'public-read', saveTo, 3, id, callback);
        } else {
            var readPath = path.join(config.staticPath, getRealDynamicPath(), realName);
            fse.move(saveTo, readPath, function(err) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, readPath);
                }
            });
        }
    });
}
var bcsPutObject = function(buckect, object, acl, src, t, id, callback, err) {
    if (t == 0) {
        clearTimeout(id);
        callback(err);
        return;
    }
    t--;
    bcs.putObject(buckect, object, acl, src, function (res){
        if (res.statusCode == 200) {
            clearTimeout(id);
            callback(null, getUrlRoot() + '/' + object);
        } else {
            bcsPutObject(buckect, object, acl, src, t, id, callback, res);
        }
    });
}
var getFileName = function(extname) {
    var d = new Date();
    var name = [ d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(),
                 d.getMinutes(), d.getSeconds(), d.getMilliseconds(), guid++ ]
                .join('_') + extname;
    return name;
}
var getRealDynamicPath = function (req) {
    var d_path = config.dynamicPath;
    if (typeof d_path == 'function')
        d_path = d_path(req);
    return d_path;
}
var getUrlRoot = function () {
    return config.hostName + '/' + config.staticPath;
}
module.exports = ueditor;