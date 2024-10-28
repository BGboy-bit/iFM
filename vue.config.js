const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true
})

// vue.config.js
module.exports = {
  devServer: {
    proxy: {
      '/api': {
        target: 'https://podcasts.subsplash.com', // 目标 API 地址
        changeOrigin: true,
        pathRewrite: { '^/api': '' }, // 使 /api 前缀在请求中消失
      },
    },
  },
};

