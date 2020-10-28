const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const service = require('../services/userService');

// 登录/注册校验
const vaildator = [
    body('username').isString().withMessage('用户名类型错误'),
    body('password').isString().withMessage('密码类型错误')
]

// 重置密码校验
const resetPwdVaildator = [
    body('username').isString().withMessage('用户名类型错误'),
    body('oldPassword').isString().withMessage('密码类型错误'),
    body('newPassword').isString().withMessage('密码类型错误')
]

// 用户登录路由
router.post('/login', vaildator, service.login);

// 用户注册路由
router.post('/register', vaildator, service.register);

// 密码重置路由
router.post('/resetPwd', resetPwdVaildator, service.resetPwd);

// 获取图片验证码
router.post('/captcha', vaildator, service.captcha);
/* GET users listing. */
// router.get('/', function(req, res, next) {
//   res.send('respond with a resource');
// });

module.exports = router;
