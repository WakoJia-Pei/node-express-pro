/**
 * 描述: 用户路由模块
 * 作者: Want Jiang
 * 日期: 2020-09-04
 */

const crypto = require('crypto'); // 引入crypto加密模块

function md5(s) {
  return crypto.createHash('md5').update('' + s).digest('hex');
}

module.exports = md5;