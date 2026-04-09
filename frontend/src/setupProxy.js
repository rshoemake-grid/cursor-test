const {
  createProxyMiddleware,
  legacyCreateProxyMiddleware,
} = require("http-proxy-middleware");

/**
 * PROXY_TARGET: API origin only (no /api suffix), e.g. http://127.0.0.1:8000
 *
 * The `/api` tree uses legacyCreateProxyMiddleware so paths like
 * `/api/storage/gcp/default-project` reach FastAPI as the same path. Plain v3
 * createProxyMiddleware + app.use("/api") + target `${origin}/api` has been
 * observed to produce wrong upstream URLs (404 on storage explorer routes).
 */
function makeProxyErrorHandler(origin, label) {
  return function onProxyError(err, req, res) {
    const code = err && err.code ? String(err.code) : "UNKNOWN";
    const msg = err && err.message ? err.message : String(err);
    console.error(`[setupProxy] ${label} → ${origin} (${code}): ${msg}`);
    if (res && !res.headersSent) {
      res.writeHead(502, {
        "Content-Type": "application/json; charset=utf-8",
      });
      res.end(
        JSON.stringify({
          detail: `Cannot reach API at ${origin} (${code}). Start the backend from the repo root: python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000. For a different API URL, set PROXY_TARGET (see frontend/README.md).`,
        }),
      );
    }
  };
}

module.exports = function setupProxy(app) {
  const rawTarget = process.env.PROXY_TARGET || "http://127.0.0.1:8000";
  const origin = rawTarget.replace(/\/+$/, "");
  const onApiError = makeProxyErrorHandler(origin, "/api");

  app.use(
    "/api",
    legacyCreateProxyMiddleware({
      target: origin,
      changeOrigin: true,
      onError: onApiError,
    }),
  );

  app.use(
    "/workflow-chat",
    createProxyMiddleware({
      target: `${origin}/api/workflow-chat`,
      changeOrigin: true,
      onError: makeProxyErrorHandler(origin, "/workflow-chat"),
    }),
  );

  app.use(
    "/ws",
    createProxyMiddleware({
      target: `${origin}/ws`,
      changeOrigin: true,
      ws: true,
      onError: makeProxyErrorHandler(origin, "/ws"),
    }),
  );
};
