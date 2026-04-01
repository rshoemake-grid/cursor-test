const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function setupProxy(app) {
  const target = process.env.PROXY_TARGET || "http://localhost:8000";
  app.use(
    "/api",
    createProxyMiddleware({
      target,
      changeOrigin: true,
    }),
  );
  app.use(
    "/ws",
    createProxyMiddleware({
      target,
      changeOrigin: true,
      ws: true,
    }),
  );
};
