/**
 * 描述: 入口文件
 * 作者: Want Jiang
 * 日期: 2020-09-03
 */

const bodyParser = require('body-parser'); 				// 引入body-parser模块
const express = require('express'); 						// 引入express模块
const cors = require('cors'); 								// 引入cors模块
const routes = require('./routes'); 						// 导入自定义路由文件，创建模块化路由
const session = require('express-session');
const app = express();

// 使用express-session 来存放数据到session中
app.use(
    session({
        secret: 'secret',
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false }
    })
);

app.use(bodyParser.json()); 									// 解析json数据格式
app.use(bodyParser.urlencoded({extended: true})); 		// 解析form表单提交的数据application/x-www-form-urlencoded

app.use(cors()); 												// 注入cors模块解决跨域
app.use('/', routes);											// 注入自定义的路由

// listen方法监听3000端口
app.listen(3000, () => { 
	console.log('服务启动成功 http://localhost:3000');
})

// 创建http服务器
// const server = http.createServer((req, res) => { 
// 	res.end(str); // 发送响应数据
// })

// listen方法监听3000端口
// server.listen(3000, () => { 
// 	console.log('服务启动成功 http://localhost:3000');
// })
