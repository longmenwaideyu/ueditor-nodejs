ueditor-nodejs
=============
##ueditor的nodejs版后台，支持本地存储和百度云存储
###使用方法
####1. 安装
    npm install ueditor-nodejs --save
####2. 到ueditor官网下载php版或者jsp版的ueditor，并将本npm包目录/test/下的nodejs文件拷入ueditor下。将ueditor放入public下，重命名文件夹为ueditor
####3. 将ueditor.config.js中的serverURL改为 URL + "ue"
####4. 注册后台
    var ueditor = require('ueditor-nodejs');
    app.use('/ueditor/ue', ueditor({
        configFile: '/ueditor/nodejs/config.json',
        mode: 'bcs', //本地存储填写local
        AccessKey: 'Adxxxxxxx',//本地存储不填写
        SecrectKey: 'oiUqt1VpH3fdxxxx',//本地存储不填写
        staticPath: path.join(__dirname, 'public'), //一般固定的写法，静态资源的目录
        dynamicPath: '/blogpicture' //动态目录，以/开头，可以根据req动态变化，可以是一个函数，function(req) { return '/xx'}
    }));
