ueditor-nodejs
=============

##ueditor的nodejs版后台，支持本地存储和百度云存储

###使用方法

####1. 安装

	npm install ueditor-nodejs --save

####2. 到ueditor官网下载php版或者jsp版的ueditor,将ueditor放入public下，重命名文件夹为ueditor

####3. 将ueditor.config.js中的serverURL改为 URL + "ue"

####4. 注册后台

	var ueditor = require('ueditor-nodejs');
    app.use('/ueditor/ue', ueditor({//这里的/ueditor/ue是因为文件件重命名为了ueditor,如果没改名，那么应该是/ueditor版本号/ue
        configFile: '/ueditor/php/config.json',//如果下载的是jsp的，就填写/ueditor/jsp/config.json
        mode: 'bcs', //本地存储填写local
        accessKey: 'Adxxxxxxx',//本地存储不填写，bcs填写
        secrectKey: 'oiUqt1VpH3fdxxxx',//本地存储不填写，bcs填写
        staticPath: path.join(__dirname, 'public'), //一般固定的写法，静态资源的目录，如果是bcs，可以不填
        dynamicPath: '/blogpicture' //动态目录，以/开头，bcs填写buckect名字，开头没有/.路径可以根据req动态变化，可以是一个函数，function(req) { return '/xx'} req.query.action是请求的行为，uploadimage表示上传图片，具体查看config.json.
    }));

####5. 动态目录示例

这里例子是这个博客中的一段代码，如果是我自己上传图片，就放在uploadimage下，访客的图片放在visitorimage下。dynamicPath参数填写这个函数就可以了。bcs暂不支持自动创建目录操作，所以，返回的bucket必须是存在的，buckect开头没有/。

	var dynamicPath = function (req) {
		if (req.query.action == 'uploadimage') {//如果是上传图片
			if (req.session.isMe) {//如果是博主自己
				return '/uploadimage'
			} else {//其余的当作访客
				return '/visitorimage'
			}
		}
	}


###6. 作者个人博客

[longmenwaideyu.cn](http://longmenwaideyu.cn)
如有任何问题可以在这里留言，或者直接联系我
[http://www.longmenwaideyu.com/article/ueditor_nodejs_bcs_local](http://www.longmenwaideyu.com/article/ueditor_nodejs_bcs_local)

###7. 致谢

感谢[jenkiHuang](http://www.jenkihuang.com) 反馈的若干BUG。


