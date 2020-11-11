/**
 * 描述: 任务路由模块
 * 作者: Want Jiang
 * 日期: 2020-11-10
 */

const express = require('express');
const router = express.Router();
const service = require('../services/uploadService');

// router.all('*', (req, res, next) => {
//     res.header('Access-Control-Allow-Origin', '*')
//     res.header(
//         'Access-Control-Allow-Headers',
//         'Content-Type,Content-Length, Authorization, Accept,X-Requested-With'
//     )
//     res.header('Access-Control-Allow-Methods', 'PUT,POST,GET,DELETE,OPTIONS')
//     res.header('X-Powered-By', ' 3.2.1')
//     if (req.method == 'OPTIONS') res.send(200) /*让options请求快速返回*/
//     else next()
// })

// 校验上传文件的MD5
router.get('/check/file', service.checkFileMD5);

// 校验chunk的MD5
// router.get('/check/chunk', service.checkChunkMD5);

// 上传文件
router.post('/upload', service.upload);

// 合并断点上传的分文件
router.get('/merge', service.merge);



module.exports = router;
