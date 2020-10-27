/**
 * 描述: 用户路由模块
 * 作者: Want Jiang
 * 日期: 2020-09-04
 */
 
const { executeSQL } = require('../utils/index');
const md5 = require('../utils/md5');
const jwt = require('jsonwebtoken');
const boom = require('boom');
const { body, validationResult } = require('express-validator');
const { 
  CODE_ERROR,
  CODE_SUCCESS, 
  PRIVATE_KEY, 
  JWT_EXPIRED 
} = require('../utils/constant');
// const { decode } = require('../utils/user-jwt');
const svgCaptcha = require("svg-captcha");

function captcha(req, res, next) {
  const captcha = svgCaptcha.create({
    noise: 3, // 干扰线条的数量
    size: 5
    // color: true,
    // background: '#cc9966' // 背景颜色
  });
  // 将图片的验证码存入到 session 中
  req.session.img_code = captcha.text.toLocaleUpperCase() // 将验证码装换为大写
  res.type('svg');
  res.json({ 
    code: CODE_SUCCESS, 
    data: captcha.data
  })
  // res.send(captcha.data);
}

// 登录
function login(req, res, next) {
  console.log('登录', req.body);
  const err = validationResult(req);
  // 如果验证错误，empty不为空
  if (!err.isEmpty()) {
    // 获取错误信息
    const [{ msg }] = err.errors;
    // 抛出错误，交给我们自定义的统一异常处理程序进行错误返回 
    next(boom.badRequest(msg));
  } else {
    let { username, password } = req.body;
    // md5加密
    password = md5(password);
    const query = `select * from sys_user where username='${username}' and password='${password}'`;
    executeSQL(query).then(user => {
    	// console.log('用户登录===', user);
      if (!user || user.length === 0) {
        res.json({ 
        	code: CODE_ERROR, 
        	msg: '用户名或密码错误', 
        	data: null 
        })
      } else {
        // 登录成功，签发一个token并返回给前端
        const token = jwt.sign(
          // payload：签发的 token 里面要包含的一些数据。
          { username },
          // 私钥
          PRIVATE_KEY,
          // 设置过期时间
          { expiresIn: JWT_EXPIRED }
        )

        let userData = {
          id: user[0].id,
          username: user[0].username,
          nickname: user[0].nickname,
          avator: user[0].avator,
          sex: user[0].sex,
          gmt_create: user[0].joinDate
        };

        res.json({ 
        	code: CODE_SUCCESS, 
        	msg: '登录成功', 
        	data: { 
            token,
            userData
          } 
        })
      }
    })
  }
}

// 注册
function register(req, res, next) {
  const err = validationResult(req);
  if (!err.isEmpty()) {
    const [{ msg }] = err.errors;
    next(boom.badRequest(msg));
  } else {
    let { username, password } = req.body;
    findUser(username).then(data => {
      // console.log('用户注册===', data[0]);
      if (data[0]) {
        res.json({ 
          code: CODE_ERROR, 
          msg: '用户已存在', 
          data: null 
        })
      } else {
        password = md5(password);
        const query = `insert into sys_user(username, password) values('${username}', '${password}')`;
        executeSQL(query).then(result => {
          // console.log('用户注册===', result);
          if (!result || result.length === 0) {
            res.json({ 
              code: CODE_ERROR, 
              msg: '注册失败', 
              data: null 
            })
          } else {
            const queryUser = `select * from sys_user where username='${username}' and password='${password}'`;
            executeSQL(queryUser).then(user => {
              const token = jwt.sign(
                { username },
                PRIVATE_KEY,
                { expiresIn: JWT_EXPIRED }
              )

              let userData = {
                id: user[0].id,
                username: user[0].username,
                nickname: user[0].nickname,
                avator: user[0].avator,
                sex: user[0].sex,
                gmt_create: user[0].gmt_create,
                gmt_modify: user[0].gmt_modify
              };

              res.json({ 
                code: CODE_SUCCESS, 
                msg: '注册成功', 
                data: { 
                  token,
                  userData
                } 
              })
            })
          }
        })
      }
    }) 
  }
}

// 重置密码
function resetPwd(req, res, next) {
  const err = validationResult(req);
  if (!err.isEmpty()) {
    const [{ msg }] = err.errors;
    next(boom.badRequest(msg));
  } else {
    let { username, oldPassword, newPassword } = req.body;
    oldPassword = md5(oldPassword);
    validateUser(username, oldPassword).then(data => {
      console.log('校验用户名和密码===', data);
      if (data) {
        if (newPassword) {
          newPassword = md5(newPassword);
          const query = `update sys_user set password='${newPassword}' where username='${username}'`;
          executeSQL(query).then(user => {
            // console.log('密码重置===', user);
            if (!user || user.length === 0) {
              res.json({ 
                code: CODE_ERROR, 
                msg: '重置密码失败', 
                data: null 
              })
            } else {
              res.json({ 
                code: CODE_SUCCESS, 
                msg: '重置密码成功', 
                data: null
              })
            }
          })
        } else {
          res.json({ 
            code: CODE_ERROR, 
            msg: '新密码不能为空', 
            data: null 
          })
        }
      } else {
        res.json({ 
          code: CODE_ERROR, 
          msg: '用户名或旧密码错误', 
          data: null 
        })
      }
    })
   
  }
}

// 校验用户名和密码
function validateUser(username, oldPassword) {
	const query = `select id, username from sys_user where username='${username}' and password='${oldPassword}'`;
  	return executeSQL(query);
}

// 通过用户名查询用户信息
function findUser(username) {
  const query = `select id, username from sys_user where username='${username}'`;
  return executeSQL(query);
}

module.exports = {
  login,
  register,
  resetPwd,
  captcha
}
