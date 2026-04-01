const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function setupProxy(app) {
  const target = process.env.PROXY_TARGET || "http://127.0.0.1:8000";

  // Express strips the mount path before calling this middleware, so req.url is e.g.
  // "/settings/llm" instead of "/api/settings/llm". http-proxy-middleware v3 forwards
  // that path to the target unchanged — FastAPI expects /api/... → 404 without rewrite.
  app.use(
    "/api",
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: (path) => (path.startsWith("/api") ? path : `/api${path}`),
    }),
  );

  // Mount strips "/workflow-chat"; remainder is "/chat" → backend needs /api/workflow-chat/chat.
  app.use(
    "/workflow-chat",
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: (path) =>
        path.startsWith("/api/workflow-chat")
          ? path
          : `/api/workflow-chat${path}`,
    }),
  );

  // WebSocket routes on FastAPI are /ws/executions/... (not under /api).
  app.use(
    "/ws",
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: (path) => (path.startsWith("/ws") ? path : `/ws${path}`),
      ws: true,
    }),
  );
};
