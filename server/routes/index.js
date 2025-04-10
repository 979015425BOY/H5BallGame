const express = require('express');
const router = express.Router();

// 示例路由
router.get('/', (req, res) => {
  res.send('API路由工作正常');
});

module.exports = router;