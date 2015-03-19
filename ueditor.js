var path = require('path');
var url = require('url');
var os = require('os');
var fs = require('fs');
var fse = require('fs-extra');
var Busboy = require('busboy');
var bcs = require('bcs-nodejs-sdk');
var util = require('./util');
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
    var dPath = util.getRealDynamicPath(config, req);
    var urlRoot = util.getUrlRoot(config, dPath);
    var callback = function (err, files) {
        var r = {};
        if (err) {
            r.state = 'ERROR';
            res.status(500);
        } else r.state = 'SUCCESS';
        var filetype = '.jpg,.jpeg,.png,.gif,.ico,.bmp';
        var data = [];
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            var extname = path.extname(file);
            //console.log(file);
            if (filetype.indexOf(extname.toLowerCase()) >= 0) {
                data.push({
                    'url': urlRoot + '/' + file
                });
            }
        }
        r.list = data;
        r.start = 1;
        r.total = data ? data.length : 0;
        res.json(r);
    };
    if (config.mode == 'bcs') {
        bcsListObject(config.staticPath, callback);
    } else {
        fs.readdir(path.join(config.staticPath, dPath), callback);
    }
}
var bcsListObject = function (path, callback) {
    bcs.listObject(path, function (res) {
        if (res.statusCode == 200) {
            //console.log(res.data);
            var data = res.data.object_list;
            for (var i = data.length - 1; i >= 0; i--) {
                data[i] = data[i].object;
            }
            callback(null, data);
        } else {
            callback(util.stringify(res.headers), []);
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
    var realName = util.getFileName(path.extname(filename));
    var dPath = util.getRealDynamicPath(config, req);
    var saveTo = path.join(os.tmpDir(), realName);
    file.pipe(fs.createWriteStream(saveTo));
    file.on('end', function() {
        if (config.mode == 'bcs') {
            var id = setTimeout(function() {
                callback('timeout');
            }, 10000);
            bcsPutObject(config.staticPath, realName,
                'public-read', saveTo, id, callback);
        } else {
            var readPath = path.join(config.staticPath, dPath, realName);
            fse.move(saveTo, readPath, function(err) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, dPath + '/' + realName);
                }
            });
        }
    });
}
var bcsPutObject = function(buckect, object, acl, src, id, callback) {
    bcs.putObject(buckect, object, acl, src, function (res){
        clearTimeout(id);
        if (res.statusCode == 200) {
            callback(null, util.getUrlRoot(config) + '/' + object);
        } else {
            callback(util.stringify(res.headers), '');
        }
    });
}

module.exports = ueditor;
