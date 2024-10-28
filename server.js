const express = require('express');
const cors = require('cors'); // 引入 cors 中间件
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // 启用 CORS 中间件

// 处理 /proxy 路由
app.get('/proxy', async (req, res) => {
  const { url } = req.query; // 从查询参数获取目标 URL
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  console.log("收到的请求 URL:", url); // 日志输出请求的 URL

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      console.log(`请求失败，状态码: ${response.status}`); // 输出状态码
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.text();
    console.log("获取到的 RSS 数据:", data); // 日志输出获取到的 RSS 数据
    res.send(data); // 将获取到的 RSS 源返回给前端
  } catch (error) {
    console.error('Error fetching the URL:', error.message); // 输出具体错误信息
    res.status(500).json({ error: 'Failed to fetch the URL' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
