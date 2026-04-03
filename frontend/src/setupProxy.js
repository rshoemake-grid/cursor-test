const { createProxyMiddleware } = require("http-proxy-middleware");

/**
 * http-proxy-middleware v3 removed automatic req.url patching when mounting on a path.
 * The mount segment must be reflected in `target` (see MIGRATION.md in that package).
 * PROXY_TARGET should be the API origin only (no /api suffix), e.g. http://127.0.0.1:8000
 */
module.exports = function setupProxy(app) {
  const rawTarget = process.env.PROXY_TARGET || "http://127.0.0.1:8000";
  const origin = rawTarget.replace(/\/+$/, "");

  app.use(
    "/api",
    createProxyMiddleware({
      target: `${origin}/api`,
      changeOrigin: true,
    }),
  );

  app.use(
    "/workflow-chat",
    createProxyMiddleware({
      target: `${origin}/api/workflow-chat`,
      changeOrigin: true,
    }),
  );

  app.use(
    "/ws",
    createProxyMiddleware({
      target: `${origin}/ws`,
      changeOrigin: true,
      ws: true,
    }),
  );
};
