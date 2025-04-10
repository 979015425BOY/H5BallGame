const mysql = require('mysql2');
const config = require('../config/db');

// 创建连接池
const pool = mysql.createPool(config);

// 测试数据库连接
pool.getConnection((err, connection) => {
  if (err) {
    console.error('数据库连接失败:', err);
    return;
  }
  console.log('成功连接到MySQL数据库');
  connection.release();
});

module.exports = pool;