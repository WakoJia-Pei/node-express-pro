/**
 * 描述: 初始化路由信息，自定义全局异常处理
 * 作者: Want Jiang
 * 日期: 2020-09-04
 */

const { executeSQL } = require('../utils/index');
const boom = require('boom');
const { validationResult } = require('express-validator');
const { 
  CODE_ERROR,
  CODE_SUCCESS, 
  PRIVATE_KEY, 
  JWT_EXPIRED 
} = require('../utils/constant');
// const jwt = require('jsonwebtoken');
// const { decode } = require('../utils/user-jwt');

// 查询任务列表
async function queryTaskList(req, res, next) {
  let err = validationResult(req);
  // 如果验证错误，empty不为空
  if (!err.isEmpty()) {
    // 获取错误信息
    const [{ msg }] = err.errors;
    // 抛出错误，交给我们自定义的统一异常处理程序进行错误返回 
    next(boom.badRequest(msg));
  } else {
    let { pageSize, pageNo, status } = req.query;
    // 默认值
    pageSize = pageSize ? pageSize : 1;
    pageNo = pageNo ? pageNo : 1;
    status = (status || status == 0) ? status : null;
    
    // 计算数据总条数
    let computeTotal = `select count(a.id) as total from sys_task a`;

    let query = `select d.id, d.title, d.content, d.status, d.is_major, d.gmt_create, d.gmt_expire from sys_task d`;
    // 分页条件 (跳过多少条)
    let n = (pageNo - 1) * pageSize;
    // 拼接分页的sql语句命令
    if(status) {
      query = query + ` where status='${status}' order by d.gmt_create desc limit ${n} , ${pageSize}`;
      computeTotal = computeTotal + ` where status='${status}'`;
    } else {
      query = query + `  order by d.gmt_create desc limit ${n} , ${pageSize}`;
    }
    const [{ total }] = await executeSQL(computeTotal);
    await executeSQL(query).then(result => {
      console.log('分页数据===', result);
      if (!result || result.length === 0) {
        res.json({ 
          code: CODE_SUCCESS, 
          msg: '暂无数据', 
          data: null 
        })
      } else {
        res.json({ 
          code: CODE_SUCCESS, 
          msg: '查询数据成功', 
          data: {
            rows: result,
            total: total,
            pageNo: parseInt(pageNo),
            pageSize: parseInt(pageSize),
          } 
        })
      }
    })
  }
}

// 通过任务名称或ID查询数据是否存在
function findTask(param, type) {
  let query = `select id, title from sys_task`;
  if (type == 1) { // 1:添加类型 2:编辑或删除类型
    query = query + ` where title='${param}'`;
  } else {
    query = query + ` where id='${param}'`;
  }
  return executeSQL(query);
}

// 添加任务
function addTask(req, res, next) {
  const err = validationResult(req);
  if (!err.isEmpty()) {
    const [{ msg }] = err.errors;
    next(boom.badRequest(msg));
  } else {
    let { title, content, gmt_expire } = req.body;
    findTask(title, 1).then(task => {
      if (task[0]) {
        res.json({ 
          code: CODE_ERROR, 
          msg: '任务名称不能重复', 
          data: null 
        })
      } else {
        const query = `insert into sys_task(title, content, status, is_major, gmt_expire) values('${title}', '${content}', 0, 0, '${gmt_expire}')`;
        executeSQL(query).then(data => {
          // console.log('添加任务===', data);
          if (!data || data.length === 0) {
            res.json({ 
              code: CODE_ERROR, 
              msg: '添加数据失败', 
              data: null 
            })
          } else {
            res.json({ 
              code: CODE_SUCCESS, 
              msg: '添加数据成功', 
              data: null 
            })
          }
        }).catch(err => {
          res.json({ 
              code: CODE_ERROR, 
              msg: err.sqlMessage, 
              data: null 
            })
        })
      }
    })

  }
}

// 编辑任务
function editTask(req, res, next) {
  const err = validationResult(req);
  if (!err.isEmpty()) {
    const [{ msg }] = err.errors;
    next(boom.badRequest(msg));
  } else {
    let { id, title, content, gmt_expire } = req.body;
    findTask(id, 2).then(task => {
      if (task[0]) {
        const query = `update sys_task set title='${title}', content='${content}', gmt_expire='${gmt_expire}' where id='${id}'`;
        executeSQL(query).then(data => {
          // console.log('编辑任务===', data);
          if (!data || data.length === 0) {
            res.json({ 
              code: CODE_ERROR, 
              msg: '更新数据失败', 
              data: null 
            })
          } else {
            res.json({ 
              code: CODE_SUCCESS, 
              msg: '更新数据成功', 
              data: null 
            })
          }
        }).catch(err => {
          res.json({ 
            code: CODE_ERROR, 
            msg: err.sqlMessage, 
            data: null 
          })
        })
        // findTask(title, 1).then(result => {
        //   if (result[0]) {
        //     res.json({ 
        //       code: CODE_ERROR, 
        //       msg: '任务名称不能重复', 
        //       data: null 
        //     })
        //   } else {
            
        //   }
        // })
      } else {
        res.json({ 
          code: CODE_ERROR, 
          msg: '参数错误或数据不存在', 
          data: null 
        })
      }
    })

  }
}

// 操作任务状态
function updateTaskStatus(req, res, next) {
  const err = validationResult(req);
  if (!err.isEmpty()) {
    const [{ msg }] = err.errors;
    next(boom.badRequest(msg));
  } else {
    let { id, status } = req.body;
    findTask(id, 2).then(task => {
      if (task[0]) {
        const query = `update sys_task set status='${status}' where id='${id}'`;
        executeSQL(query).then(data => {
          // console.log('操作任务状态===', data);
          if (!data || data.length === 0) {
            res.json({ 
              code: CODE_ERROR, 
              msg: '操作数据失败', 
              data: null 
            })
          } else {
            res.json({ 
              code: CODE_SUCCESS, 
              msg: '操作数据成功', 
              data: null 
            })
          }
        })
      } else {
        res.json({ 
          code: CODE_ERROR, 
          msg: '参数错误或数据不存在', 
          data: null 
        })
      }
    })
  }
}

// 点亮红星标记
function updateMark(req, res, next) {
  const err = validationResult(req);
  if (!err.isEmpty()) {
    const [{ msg }] = err.errors;
    next(boom.badRequest(msg));
  } else {
    let { id, is_major } = req.body;
    findTask(id, 2).then(task => {
      if (task[0]) {
        const query = `update sys_task set is_major='${is_major}' where id='${id}'`;
        executeSQL(query).then(data => {
          // console.log('点亮红星标记===', data);
          if (!data || data.length === 0) {
            res.json({ 
              code: CODE_ERROR, 
              msg: '操作数据失败', 
              data: null 
            })
          } else {
            res.json({ 
              code: CODE_SUCCESS, 
              msg: '操作数据成功', 
              data: null 
            })
          }
        })
      } else {
        res.json({ 
          code: CODE_ERROR, 
          msg: '参数错误或数据不存在', 
          data: null 
        })
      }
    })
  }
}

// 删除任务
function deleteTask(req, res, next) {
  const err = validationResult(req);
  if (!err.isEmpty()) {
    const [{ msg }] = err.errors;
    next(boom.badRequest(msg));
  } else {
    let { id, status } = req.body;
    findTask(id, 2).then(task => {
      if (task[0]) {
        const query = `update sys_task set status='${status}' where id='${id}'`;
        executeSQL(query).then(data => {
          // console.log('操作任务状态===', data);
          if (!data || data.length === 0) {
            res.json({ 
              code: CODE_ERROR, 
              msg: '删除数据失败', 
              data: null 
            })
          } else {
            res.json({ 
              code: CODE_SUCCESS, 
              msg: '删除数据成功', 
              data: null 
            })
          }
        })
      } else {
        res.json({ 
          code: CODE_ERROR, 
          msg: '参数错误或数据不存在', 
          data: null 
        })
      }
    })
  }
}

module.exports = {
  queryTaskList,
  addTask,
  editTask,
  updateTaskStatus,
  updateMark,
  deleteTask
}