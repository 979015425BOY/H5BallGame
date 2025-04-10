const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 路由
app.use('/api', routes);

// 基本路由
app.get('/', (req, res) => {
  res.send('H5游戏后端服务运行中');
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});

module.exports = app;