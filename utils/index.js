const mysql = require('mysql');
const dbConfig = require('../dbConfig/index');

// 连接数据库
const connect = () => mysql.createConnection(dbConfig);

// 查询
const executeSQL = sql => {
    let conn = connect();
    return new Promise((resolve, reject) => {
        try {
            conn.query(sql, (err, res) => err ? reject(err) : resolve(res))
        } catch(e) {
            reject(e)
        } finally {
            conn.end()
        }
    })
}

module.exports = {
    executeSQL
}