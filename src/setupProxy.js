const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    "/b2api", // Префикс вашего API
    createProxyMiddleware({
      target: "https://awx.pro/b2api", // Адрес вашего API
      changeOrigin: true,
    })
  );
};
